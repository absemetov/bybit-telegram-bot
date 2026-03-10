import { RestClientV5 } from "bybit-api";
import dotenv from "dotenv";
dotenv.config();
class UserAPI {
  constructor(restClient) {
    this.bybitClient = restClient;
  }
  //win rate
  async getDailyWinRate(days = 7, symbol = null) {
    const dailyStats = [];
    const currentDate = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const targetDate = new Date(currentDate);
      targetDate.setDate(targetDate.getDate() - i);
      const startOfDayMSK = new Date(targetDate);
      startOfDayMSK.setHours(0, 0, 0, 0);
      const endOfDayMSK = new Date(targetDate);
      endOfDayMSK.setHours(23, 59, 59, 999);
      const startTime = startOfDayMSK.getTime();
      const endTime = endOfDayMSK.getTime();
      let allTrades = [];
      let cursor;
      let page = 0;
      const maxPages = 20;
      const dateKey = startOfDayMSK.toLocaleDateString("ru-RU");
      try {
        let hasMorePages = true;
        while (hasMorePages) {
          const params = {
            category: "linear",
            startTime: startTime,
            endTime: endTime,
            limit: 100,
            cursor: cursor,
          };
          if (symbol) params.symbol = symbol;
          const response = await this.bybitClient.getClosedPnL(params);
          if (response.retCode !== 0) {
            console.error(`Ошибка для ${dateKey}:`, response.retMsg);
            break;
          }
          allTrades = [...allTrades, ...response.result.list];
          cursor = response.result.nextPageCursor;
          page++;
          hasMorePages =
            !!cursor && page < maxPages && response.result.list.length > 0;
        }
        if (allTrades.length > 0) {
          const profitableTrades = allTrades.filter(
            (trade) => parseFloat(trade.closedPnl) > 0,
          );
          const lossTrades = allTrades.filter(
            (trade) => parseFloat(trade.closedPnl) < 0,
          );
          const strictWinRate = (
            (profitableTrades.length / allTrades.length) *
            100
          ).toFixed(2);
          const total = {
            pnl: 0,
            lossPrcnt: 0,
            profPrcnt: 0,
          };
          const totalR = allTrades.reduce((acc, trade) => {
            acc.pnl = acc.pnl + +trade.closedPnl;
            const changePrcnt =
              Math.abs(
                (trade.avgExitPrice - trade.avgEntryPrice) /
                  trade.avgEntryPrice,
              ) * 100;
            if (trade.closedPnl > 0) {
              acc.profPrcnt += changePrcnt;
            } else {
              acc.lossPrcnt = acc.lossPrcnt + changePrcnt;
            }
            return acc;
          }, total);
          dailyStats.push({
            dateKey,
            strictWinRate: `${strictWinRate}%`,
            totalTrades: allTrades.length,
            profitable: profitableTrades.length,
            loss: lossTrades.length,
            totalPnl: totalR.pnl,
            lossPrcnt: totalR.lossPrcnt,
            profPrcnt: totalR.profPrcnt,
            totalPrcnt: totalR.profPrcnt - total.lossPrcnt,
            symbol: symbol || "ALL",
          });
        } else {
          dailyStats.push({
            dateKey,
            strictWinRate: "0.00%",
            totalTrades: 0,
            profitable: 0,
            loss: 0,
            totalPnl: 0,
            symbol: symbol || "ALL",
          });
        }
      } catch (error) {
        console.error(`Error day ${dateKey}:`, error.message);
        dailyStats.push({
          error: error.message,
          symbol: symbol || "ALL",
        });
      }
    }
    return dailyStats;
  }
  // get closed positions history
  async getClosedPositionsHistory(symbol = null, cursor) {
    const params = {
      category: "linear",
      limit: 20,
      cursor,
    };
    if (symbol) {
      params.symbol = symbol;
    }
    const response = await this.bybitClient.getClosedPnL(params);
    if (response.retCode !== 0) {
      throw new Error(`Error getClosedPositionsHistory: ${response.retMsg}`);
    }
    if (response.result.list && response.result.list.length > 0) {
      const balance = await this.getBybitBalance();
      return {
        positions: response.result.list,
        cursor: response.result.nextPageCursor,
        balance,
      };
    }
    return { positions: [] };
  }
  //get position
  async getTickerPositions(symbol) {
    const positionResponse = await this.bybitClient.getPositionInfo({
      category: "linear",
      symbol,
    });
    if (positionResponse.retCode !== 0) {
      throw new Error(`Error getTickerPositions: ${positionResponse.retMsg}`);
    }
    return positionResponse.result.list
      .filter((p) => p.size > 0)
      .map((order) => ({
        symbol: order.symbol,
        localTime: new Date(parseInt(order.updatedTime)).toLocaleString(
          "ru-RU",
        ),
        side: order.side,
        avgPrice: parseFloat(order.avgPrice),
        markPrice: parseFloat(order.markPrice),
        takeProfit: parseFloat(order.takeProfit),
        stopLoss: parseFloat(order.stopLoss),
        positionValue: parseFloat(order.positionValue).toFixed(2),
        size: parseFloat(order.size),
        unrealisedPnl: parseFloat(order.unrealisedPnl).toFixed(2),
        positionIdx: order.positionIdx,
      }));
  }
  async setPart50(symbol, part, priceScale) {
    const orders = await this.getTickerOrders(symbol);
    const positions = await this.getTickerPositions(symbol);
    const longPosition = positions.find((p) => p.side === "Buy");
    const shortPosition = positions.find((p) => p.side === "Sell");
    const longPartialOrder = orders.part.find((o) => {
      return o.side === "Sell";
    });
    const shortPartialOrder = orders.part.find((o) => {
      return o.side === "Buy";
    });
    if (shortPosition) {
      const { avgPrice } = shortPosition;
      //partialClose 50% new 4/03/2026
      const newPart50 = avgPrice * (1 - part / 100);
      if (shortPartialOrder) {
        //delete part50
        if (part === 0) {
          for (const order of orders.part.filter((o) => o.side === "Buy")) {
            await this.cancelOrder(symbol, order.orderId);
          }
          return;
        }
        const { price } = shortPartialOrder;
        if ((Math.abs(newPart50 - price) / price) * 100 >= 0.03) {
          //first delete old
          for (const order of orders.part.filter((o) => o.side === "Buy")) {
            await this.cancelOrder(symbol, order.orderId);
          }
          //edit
          await this.setPartialTakeProfit(
            symbol,
            shortPosition,
            newPart50.toFixed(priceScale),
          );
        }
      } else {
        if (part > 0) {
          //create new
          await this.setPartialTakeProfit(
            symbol,
            shortPosition,
            newPart50.toFixed(priceScale),
          );
        }
      }
    }
    if (longPosition) {
      const { avgPrice } = longPosition;
      //partialClose 50% new 4/03/2026
      const newPart50 = avgPrice * (1 + part / 100);
      if (longPartialOrder) {
        //delete part50
        if (part === 0) {
          for (const order of orders.part.filter((o) => o.side === "Sell")) {
            await this.cancelOrder(symbol, order.orderId);
          }
          return;
        }
        const { price } = longPartialOrder;
        if ((Math.abs(newPart50 - price) / price) * 100 >= 0.03) {
          //first delete old
          for (const order of orders.part.filter((o) => o.side === "Sell")) {
            await this.cancelOrder(symbol, order.orderId);
          }
          //edit
          await this.setPartialTakeProfit(
            symbol,
            longPosition,
            newPart50.toFixed(priceScale),
          );
        }
      } else {
        if (part > 0) {
          //create new
          await this.setPartialTakeProfit(
            symbol,
            longPosition,
            newPart50.toFixed(priceScale),
          );
        }
      }
    }
  }
  //set part50
  async setPartialTakeProfit(symbol, position, takeProfit) {
    await this.bybitClient.setTradingStop({
      category: "linear",
      symbol,
      positionIdx: position.positionIdx,
      takeProfit,
      tpSize: `${position.size * 0.5}`,
      tpslMode: "Partial",
    });
  }
  //edit SL/TP
  async editStopLoss(symbol, side, stopLoss) {
    const params = {
      category: "linear",
      symbol,
      positionIdx: side === "Sell" ? 2 : 1,
      stopLoss,
    };
    const response = await this.bybitClient.setTradingStop(params);
    if (response.retCode !== 0) {
      throw new Error(`Error editStopLoss: ${response.retMsg}`);
    }
  }
  async editTakeProfit(symbol, side, takeProfit) {
    const params = {
      category: "linear",
      symbol,
      positionIdx: side === "Sell" ? 2 : 1,
      takeProfit,
    };
    const response = await this.bybitClient.setTradingStop(params);
    if (response.retCode !== 0) {
      throw new Error(`Error editTakeProfit: ${response.retMsg}`);
    }
  }
  //close position
  async closePosition(symbol, side, qty) {
    const response = await this.bybitClient.submitOrder({
      category: "linear",
      symbol,
      side: side === "Buy" ? "Sell" : "Buy",
      orderType: "Market",
      qty,
      positionIdx: side === "Sell" ? 2 : 1,
      reduceOnly: true,
    });
    if (response.retCode !== 0) {
      throw new Error(`Error closePosition ${response.retMsg}`);
    }
  }
  //get positions
  async getPositions(cursor, limit = 10) {
    const balance = await this.getBybitBalance();
    const params = {
      category: "linear",
      settleCoin: "USDT",
      limit,
      cursor,
    };
    const response = await this.bybitClient.getPositionInfo(params);
    if (response.retCode !== 0) {
      throw new Error(`Error getPositions: ${response.retMsg}`);
    }
    return {
      positions: response.result.list,
      nextPageCursor: response.result.nextPageCursor,
      balance,
    };
  }
  //cancel ALL order
  async cancelAllOrders(symbol, side) {
    const orders = await this.getTickerOrders(symbol);
    for (const order of orders.stop.filter((o) => o.side === side)) {
      await this.cancelOrder(symbol, order.orderId);
    }
  }
  //cancel order
  async cancelOrder(symbol, orderId) {
    const response = await this.bybitClient.cancelOrder({
      category: "linear",
      symbol,
      orderId,
    });
    if (response.retCode !== 0) {
      throw new Error(`Error cancelOrder: ${response.retMsg}`);
    }
  }
  //get order
  async getTickerOrders(symbol) {
    const params = {
      category: "linear",
      settleCoin: "USDT",
      symbol,
    };
    const response = await this.bybitClient.getActiveOrders(params);
    if (response.retCode !== 0) {
      throw new Error(`Error getTickersOrders: ${response.retMsg}`);
    }
    const stop = response.result.list
      .filter((o) => ["Stop"].includes(o.stopOrderType))
      .map((order) => ({
        orderId: order.orderId,
        symbol: order.symbol,
        localTime: new Date(parseInt(order.createdTime)).toLocaleString(
          "ru-RU",
        ),
        side: order.side,
        price: order.triggerPrice
          ? parseFloat(order.triggerPrice)
          : parseFloat(order.price),
        qty: parseFloat(order.qty),
        triggerPrice: order.triggerPrice,
        stopOrderType: order.stopOrderType,
      }));
    const part = response.result.list
      .filter((o) => ["PartialTakeProfit"].includes(o.stopOrderType))
      .map((order) => ({
        orderId: order.orderId,
        symbol: order.symbol,
        localTime: new Date(parseInt(order.createdTime)).toLocaleString(
          "ru-RU",
        ),
        side: order.side,
        price: order.triggerPrice
          ? parseFloat(order.triggerPrice)
          : parseFloat(order.price),
        qty: parseFloat(order.qty),
        triggerPrice: order.triggerPrice,
        stopOrderType: order.stopOrderType,
      }));
    const all = response.result.list.map((order) => ({
      orderId: order.orderId,
      symbol: order.symbol,
      localTime: new Date(parseInt(order.createdTime)).toLocaleString("ru-RU"),
      side: order.side,
      price: order.triggerPrice
        ? parseFloat(order.triggerPrice)
        : parseFloat(order.price),
      qty: parseFloat(order.qty),
      triggerPrice: order.triggerPrice,
      stopOrderType: order.stopOrderType,
    }));
    return { stop, part, all };
  }
  //list orders
  async getLimitOrders(cursor, limit = 10) {
    const params = {
      category: "linear",
      settleCoin: "USDT",
      limit,
      cursor,
    };
    const response = await this.bybitClient.getActiveOrders(params);
    if (response.retCode !== 0) {
      throw new Error(`Error getLimitOrders: ${response.retMsg}`);
    }
    return {
      orders: response.result.list,
      nextPageCursor: response.result.nextPageCursor,
    };
  }
  //create stopLimit order
  async createStopLimitOrder(symbol, side, triggerPrice, size, tp, sl) {
    try {
      const { result } = await this.bybitClient.getInstrumentsInfo({
        category: "linear",
        symbol: symbol,
      });
      if (!result?.list?.length) {
        throw new Error(`Ticker ${symbol} not found`);
      }
      const instrument = result.list[0];
      const {
        lotSizeFilter: { minOrderQty, maxOrderQty, qtyStep },
        priceScale,
      } = instrument;
      const baseQty = size / triggerPrice;
      let adjustedQty = Math.floor(baseQty / qtyStep) * qtyStep;
      if (adjustedQty < minOrderQty) {
        adjustedQty = +minOrderQty;
      }
      if (adjustedQty > maxOrderQty) {
        throw new Error(
          `Max: ${maxOrderQty} contracts (${maxOrderQty * triggerPrice} USDT)`,
        );
      }
      const qtyDecimals = (qtyStep + "").split(".")[1]?.length || 0;
      const formattedQty = adjustedQty.toFixed(qtyDecimals);
      //format
      const formatPrice = (value) => {
        return value.toFixed(priceScale);
      };
      const price =
        side === "Buy"
          ? formatPrice(triggerPrice * (1 + 1 / 100))
          : formatPrice(triggerPrice * (1 - 1 / 100));
      const response = await this.bybitClient.submitOrder({
        category: "linear",
        symbol,
        side,
        orderType: "Limit",
        qty: formattedQty,
        triggerPrice: formatPrice(triggerPrice),
        price,
        takeProfit: formatPrice(tp),
        stopLoss: formatPrice(sl),
        triggerDirection: side === "Sell" ? 2 : 1,
        timeInForce: "GTC",
        positionIdx: side === "Sell" ? 2 : 1,
      });
      if (response.retCode !== 0) {
        throw new Error(`Order create Error: ${response.retMsg}`);
      }
      return { orderId: response.result.orderId };
    } catch (error) {
      throw new Error(
        `${symbol} ${side} Order creation failed: ${error.message}`,
      );
    }
  }
  //create limit order
  async createLimitOrder(symbol, side, price, size, tp, sl) {
    try {
      const ticker = await this.bybitClient.getTickers({
        category: "linear",
        symbol,
      });
      const lastPrice = parseFloat(ticker.result.list[0].lastPrice);
      if (side === "Buy" && price >= lastPrice) {
        throw new Error(
          `For Buy order price (${price}) must be down (${lastPrice})`,
        );
      }
      if (side === "Sell" && price <= lastPrice) {
        throw new Error(
          `For Sell order price (${price}) must be up (${lastPrice})`,
        );
      }
      const { result } = await this.bybitClient.getInstrumentsInfo({
        category: "linear",
        symbol: symbol,
      });
      if (!result?.list?.length) {
        throw new Error(`Символ ${symbol} не найден`);
      }
      const instrument = result.list[0];
      const {
        lotSizeFilter: { minOrderQty, maxOrderQty, qtyStep },
        priceScale,
      } = instrument;
      const baseQty = size / price;
      let adjustedQty = Math.floor(baseQty / qtyStep) * qtyStep;
      if (adjustedQty < minOrderQty) {
        adjustedQty = +minOrderQty;
      }
      if (adjustedQty > maxOrderQty) {
        throw new Error(
          `Max: ${maxOrderQty} contracts (${maxOrderQty * price} USDT)`,
        );
      }
      const qtyDecimals = (qtyStep + "").split(".")[1]?.length || 0;
      const formattedQty = adjustedQty.toFixed(qtyDecimals);
      const formatPrice = (value) => {
        return value.toFixed(priceScale);
      };
      const response = await this.bybitClient.submitOrder({
        category: "linear",
        symbol,
        side,
        orderType: "Limit",
        qty: formattedQty,
        price: formatPrice(price),
        takeProfit: formatPrice(tp),
        stopLoss: formatPrice(sl),
        timeInForce: "GTC",
        positionIdx: side === "Sell" ? 2 : 1,
      });
      if (response.retCode !== 0) {
        throw new Error(`Order create Error: ${response.retMsg}`);
      }
      return { orderId: response.result.orderId };
    } catch (error) {
      throw new Error(
        `${symbol} ${side} Order creation failed: ${error.message}`,
      );
    }
  }
  async getBybitBalance() {
    try {
      const response = await this.bybitClient.getWalletBalance({
        accountType: "UNIFIED",
      });
      return +response.result.list[0].totalEquity;
    } catch (error) {
      console.error("Failed to get wallet balance:", error);
    }
  }
  async getCandles(symbol, timeframe = "1h", limit = 200) {
    try {
      const response = await this.bybitClient.getKline({
        category: "linear",
        symbol: symbol,
        interval: intervalKline[timeframe],
        limit,
      });
      if (response.retCode !== 0) {
        throw new Error(`Error getCandles: ${response.retMsg}`);
      }
      return response.result.list
        .map((candle) => ({
          time: parseInt(candle[0]),
          localTime: new Date(parseInt(candle[0])).toLocaleString("ru-RU"),
          open: parseFloat(candle[1]),
          high: parseFloat(candle[2]),
          low: parseFloat(candle[3]),
          close: parseFloat(candle[4]),
          color: candle[4] > candle[1] ? "green" : "red",
          volume: parseFloat(candle[5]),
        }))
        .reverse();
    } catch (error) {
      console.error(`Error getting candles for ${symbol}:`, error);
      return [];
    }
  }
}
export const getTicker = async (symbol) => {
  try {
    const response = await restMain.getInstrumentsInfo({
      category: "linear",
      symbol,
    });
    if (response.retCode !== 0) {
      console.error("Bybit API Error:", response.retMsg);
      return [];
    }
    return response.result.list;
  } catch (error) {
    console.error("Error in getActiveSymbols:", error.message);
    return [];
  }
};
export const getActiveSymbols = async (cursor, limit = 30) => {
  try {
    const response = await restMain.getInstrumentsInfo({
      category: "linear",
      limit,
      cursor,
    });
    if (response.retCode !== 0) {
      console.error("Bybit API Error:", response.retMsg);
      return [];
    }
    const STABLECOINS = ["USDE", "USDC", "RLUSD", "USD1"];
    const tickers = response.result.list.filter((symbol) => {
      if (STABLECOINS.includes(symbol.baseCoin)) return false;
      return symbol.status === "Trading" && symbol.symbol.endsWith("USDT");
    });
    return { tickers, nextCursor: response.result.nextPageCursor };
  } catch (error) {
    console.error("Error in getActiveSymbols:", error.message);
    return { symbols: [], nextCursor: null };
  }
};
//convert 15min candles to 1h
const timeframeConfig = {
  "30min": {
    intervalMs: 1800000,
    startOffsetUtcMs: 21 * 3600000,
    timezone: "Europe/Moscow",
  },
  "1h": {
    intervalMs: 3600000,
    startOffsetUtcMs: 21 * 3600000,
    timezone: "Europe/Moscow",
  },
  "2h": {
    intervalMs: 7200000,
    startOffsetUtcMs: 22 * 3600000,
    timezone: "Europe/Moscow",
  },
  "4h": {
    intervalMs: 14400000,
    startOffsetUtcMs: 0,
    description: "4-часовые свечи (03:00, 07:00... МСК)",
    timezone: "Europe/Moscow",
  },
};

export const convert15minCandles = (candles, timeframe) => {
  const { intervalMs, startOffsetUtcMs } = timeframeConfig[timeframe];
  const groups = new Map();
  for (const candle of candles) {
    const time = candle.time;
    const diff = time - startOffsetUtcMs;
    const groupTime =
      startOffsetUtcMs + Math.floor(diff / intervalMs) * intervalMs;
    if (groupTime < startOffsetUtcMs) continue;
    if (!groups.has(groupTime)) groups.set(groupTime, []);
    groups.get(groupTime).push(candle);
  }
  return Array.from(groups.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([time, group]) => {
      group.sort((a, b) => a.time - b.time);
      return {
        time,
        open: group[0].open,
        high: Math.max(...group.map((c) => c.high)),
        low: Math.min(...group.map((c) => c.low)),
        close: group[group.length - 1].close,
        volume: group.reduce((sum, c) => sum + (c.volume || 0), 0),
      };
    });
};

export const intervalKline = {
  "1min": 1,
  "5min": 5,
  "15min": 15,
  "30min": 30,
  "1h": 60,
  "2h": 120,
  "4h": 240,
  "6h": 360,
  "12h": 720,
  "1d": "D",
  "1w": "W",
  "1m": "M",
};
//new class for main and sub account
const restMain = new RestClientV5({
  key: process.env.BYBIT_API_KEY,
  secret: process.env.BYBIT_API_SECRET,
});
const restSub = new RestClientV5({
  key: process.env.BYBIT_SUB_API_KEY,
  secret: process.env.BYBIT_SUB_API_SECRET,
});
export const bybitUsers = {
  main: new UserAPI(restMain),
  sub: new UserAPI(restSub),
};
