import Ticker from "../models/Ticker.js";
import { RestClientV5 } from "bybit-api";
import dotenv from "dotenv";
dotenv.config();
const bybitClient = new RestClientV5({
  key: process.env.BYBIT_API_KEY,
  secret: process.env.BYBIT_API_SECRET,
});
//cancel order
export const closePosition = async (symbol, side, qty) => {
  const response = await bybitClient.submitOrder({
    category: "linear",
    symbol,
    side: side === "Buy" ? "Sell" : "Buy", // Инвертируем направление
    orderType: "Market",
    qty,
    positionIdx: side === "Sell" ? 2 : 1,
    reduceOnly: true,
  });
  if (response.retCode !== 0) {
    throw new Error(`Error API: ${response.retMsg}`);
  }
};
//get position
export const getPositions = async (cursor, limit = 10, symbol) => {
  const balance = await getBybitBalance();
  const params = {
    category: "linear",
    settleCoin: "USDT",
    limit,
    cursor,
  };
  if (symbol) {
    params.symbol = symbol;
  }
  const response = await bybitClient.getPositionInfo(params);
  if (response.retCode !== 0) {
    throw new Error(`Error API: ${response.retMsg}`);
  }
  const positions = response.result.list
    .filter((item) => item.avgPrice > 0)
    .map((order) => ({
      orderId: order.orderId,
      symbol: order.symbol,
      localTime: new Date(parseInt(order.updatedTime)).toLocaleString("ru-RU"),
      side: order.side,
      avgPrice: parseFloat(order.avgPrice),
      markPrice: parseFloat(order.markPrice),
      takeProfit: parseFloat(order.takeProfit),
      stopLoss: parseFloat(order.stopLoss),
      positionValue: parseFloat(order.positionValue),
      size: parseFloat(order.size),
      unrealisedPnl: parseFloat(order.unrealisedPnl),
    }));
  return { positions, nextPageCursor: response.result.nextPageCursor, balance };
};
//cancel order
export const cancelOrder = async (symbol, orderId) => {
  const response = await bybitClient.cancelOrder({
    category: "linear",
    symbol,
    orderId,
  });
  if (response.retCode !== 0) {
    throw new Error(`Error API: ${response.retMsg}`);
  }
};
//list orders
export const getLimitOrders = async (cursor, limit = 10, symbol) => {
  const params = {
    category: "linear",
    settleCoin: "USDT",
    openOnly: 0,
    orderFilter: "Order",
    limit,
    cursor,
  };
  if (symbol) {
    params.symbol = symbol;
  }
  const response = await bybitClient.getActiveOrders(params);
  if (response.retCode !== 0) {
    throw new Error(`Error API: ${response.retMsg}`);
  }
  const orders = response.result.list.map((order) => ({
    orderId: order.orderId,
    symbol: order.symbol,
    localTime: new Date(parseInt(order.createdTime)).toLocaleString("ru-RU"),
    side: order.side,
    price: parseFloat(order.price),
    qty: parseFloat(order.qty),
    sum: order.qty * order.price,
  }));
  return { orders, nextPageCursor: response.result.nextPageCursor };
};
//create order
export const createLimitOrder = async (
  symbol,
  side,
  price,
  tpPercent,
  slPercent,
) => {
  try {
    // 1. Получаем текущую рыночную цену
    const ticker = await bybitClient.getTickers({
      category: "linear",
      symbol,
    });
    const lastPrice = parseFloat(ticker.result.list[0].lastPrice);
    // 2. Проверяем логику цены
    if (side === "Buy" && price >= lastPrice) {
      throw new Error(
        `Для Buy цена ордера (${price}) должна быть ниже текущей (${lastPrice})`,
      );
    }
    if (side === "Sell" && price <= lastPrice) {
      throw new Error(
        `Для Sell цена ордера (${price}) должна быть выше текущей (${lastPrice})`,
      );
    }
    // 1. Получаем параметры символа
    const { result } = await bybitClient.getInstrumentsInfo({
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

    // 2. Рассчитываем количество контрактов как в споте: qty = сумма / цена
    //sl 1$ TP 5$
    const maxUsdt = 34;
    const baseQty = maxUsdt / price;

    // 3. Приводим к шагу qtyStep
    //const step = Number(qtyStep);
    const adjustedQty = Math.floor(baseQty / qtyStep) * qtyStep;

    // 4. Проверяем лимиты
    if (adjustedQty < minOrderQty) {
      throw new Error(
        `Минимум: ${minOrderQty} контрактов (${minOrderQty * price} USDT)`,
      );
    }

    if (adjustedQty > maxOrderQty) {
      throw new Error(
        `Максимум: ${maxOrderQty} контрактов (${maxOrderQty * price} USDT)`,
      );
    }

    // 5. Форматируем значения
    const qtyDecimals = (qtyStep + "").split(".")[1]?.length || 0;
    const formattedQty = adjustedQty.toFixed(qtyDecimals);
    //format
    const formatPrice = (value) => {
      return value.toFixed(priceScale);
    };
    const entryPrice = formatPrice(price);
    let takeProfit, stopLoss;
    if (side === "Sell") {
      // Для Sell: TP < Entry, SL > Entry
      takeProfit = formatPrice(price * (1 - tpPercent / 100));
      stopLoss = formatPrice(price * (1 + slPercent / 100));
    } else {
      // Для Buy: TP > Entry, SL < Entry
      takeProfit = formatPrice(price * (1 + tpPercent / 100));
      stopLoss = formatPrice(price * (1 - slPercent / 100));
    }

    const response = await bybitClient.submitOrder({
      category: "linear",
      symbol,
      side,
      orderType: "Limit",
      qty: formattedQty,
      price: entryPrice,
      takeProfit,
      stopLoss,
      timeInForce: "GTC",
      positionIdx: side === "Sell" ? 2 : 1,
    });
    if (response.retCode !== 0) {
      throw new Error(`Order create Error: ${response.retMsg}`);
    }
    //first enable alerts
    await Ticker.updateField(symbol, "alert", true);
    const alerts = {
      alert0: side === "Buy" ? +stopLoss : takeProfit * (1 - 0.01 * 3),
      alert1: side === "Buy" ? +entryPrice : takeProfit * (1 - 0.01 * 2),
      alert2: side === "Buy" ? +takeProfit : takeProfit * (1 - 0.01 * 1),
      alert3: side === "Sell" ? +takeProfit : takeProfit * (1 + 0.01),
      alert4: side === "Sell" ? +entryPrice : takeProfit * (1 + 0.01 * 2),
      alert5: side === "Sell" ? +stopLoss : takeProfit * (1 + 0.01 * 3),
    };
    await Ticker.createAlerts(symbol, alerts);
    return { orderId: response.result.orderId };
  } catch (error) {
    throw new Error(`Order creation failed: ${error.message}`);
  }
};
export const getBybitBalance = async () => {
  try {
    const response = await bybitClient.getWalletBalance({
      accountType: "UNIFIED",
    });
    return +response.result.list[0].totalEquity;
  } catch (error) {
    console.error("Failed to get wallet balance:", error);
  }
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
export const getCandles = async (symbol, timeframe = "1h", limit = 200) => {
  try {
    const response = await bybitClient.getKline({
      category: "linear",
      symbol: symbol,
      interval: intervalKline[timeframe],
      limit,
    });

    if (response.retCode !== 0) {
      throw new Error(`Error API: ${response.retMsg}`);
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
};

//get symbols
export const getActiveSymbols = async (cursor, limit = 30) => {
  try {
    const response = await bybitClient.getInstrumentsInfo({
      category: "linear",
      limit,
      cursor,
    });

    if (response.retCode !== 0) {
      console.error("Bybit API Error:", response.retMsg);
      return [];
    }
    const STABLECOINS = ["USDE", "USDC"];
    const symbols = response.result.list
      .filter((symbol) => {
        if (STABLECOINS.includes(symbol.baseCoin)) return false;
        return symbol.status === "Trading" && symbol.symbol.endsWith("USDT");
      })
      .map((s) => s.symbol);

    return { symbols, nextCursor: response.result.nextPageCursor };
  } catch (error) {
    console.error("Error in getActiveSymbols:", error.message);
    return { symbols: [], nextCursor: null };
  }
};
//chatgpt deprecated
// export const bybitKline = async (symbol, textInterval, limit) => {
//   const textToMinutes = {
//     "1min": 1,
//     "5min": 5,
//     "15min": 15,
//     "30min": 30,
//     "1h": 60,
//     "4h": 240,
//     "6h": 360,
//     "12h": 720,
//     "1d": 1440,
//     "1w": 10080,
//   };
//   const interval = textToMinutes[textInterval];
//   if (!interval)
//     throw new Error(
//       `Error use only 1min 5min 15min 30min 1h 4h 6h 12h 1d interval!`,
//     );
//   const date = new Date();
//   //const timeEndMs = date.getTime();
//   date.setMinutes(date.getMinutes() - interval * limit);
//   //const timeStartMs = date.getTime();
//   // get kline data
//   const textToMinutesK = {
//     "1min": 1,
//     "5min": 5,
//     "15min": 15,
//     "30min": 30,
//     "1h": 60,
//     "4h": 240,
//     "6h": 360,
//     "12h": 720,
//     "1d": "D",
//     "1w": "W",
//   };
//   const kline = await bybitClient.getKline({
//     category: "linear",
//     symbol,
//     interval: textToMinutesK[textInterval],
//     // start: timeStartMs,
//     // end: timeEndMs,
//     limit,
//   });
//   if (kline.retCode !== 0) {
//     throw new Error(`Error API: ${kline.retMsg}`);
//   }
//   const candlesArray = [];
//   for (let i = 0; i < limit; i += 1) {
//     if (kline.result.list) {
//       const candle = kline.result.list[i];
//       if (candle) {
//         candlesArray.push({
//           time: +candle[0] / 1000,
//           open: +candle[1],
//           high: +candle[2],
//           low: +candle[3],
//           close: +candle[4],
//           value: +candle[5],
//           //color: candle[4] > candle[1] ? "green" : "red",
//         });
//       }
//     }
//   }
//   return candlesArray;
// };
