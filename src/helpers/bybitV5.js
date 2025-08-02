import { RestClientV5 } from "bybit-api";
import dotenv from "dotenv";
dotenv.config();
const bybitClient = new RestClientV5({
  key: process.env.BYBIT_API_KEY,
  secret: process.env.BYBIT_API_SECRET,
});
//win rate
export const getDailyWinRate = async (days = 7, symbol = null) => {
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
        const response = await bybitClient.getClosedPnL(params);

        if (response.retCode !== 0) {
          console.error(`Ошибка для ${dateKey}:`, response.retMsg);
          break;
        }

        // Добавляем новые сделки
        allTrades = [...allTrades, ...response.result.list];
        // Обновляем курсор для следующей страницы
        cursor = response.result.nextPageCursor;
        page++;

        // Условия завершения цикла:
        // 1. Нет следующей страницы (cursor пустой)
        // 2. Достигли лимита страниц
        // 3. Нет данных в ответе
        hasMorePages =
          !!cursor && page < maxPages && response.result.list.length > 0;
      }
      if (allTrades.length > 0) {
        // Фильтруем по символу, если нужно (дополнительная фильтрация)
        // if (symbol) {
        //   allTrades = allTrades.filter(trade => trade.symbol === symbol);
        // }
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
              (trade.avgExitPrice - trade.avgEntryPrice) / trade.avgEntryPrice,
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
          symbol: symbol || "ALL", // Указываем для какой монеты статистика
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
      console.error(`Ошибка для дня ${dateKey}:`, error.message);
      dailyStats.push({
        error: error.message,
        symbol: symbol || "ALL",
      });
    }
  }
  console.log(dailyStats);
  return dailyStats;
};
//convert 15min candles to 1h
const timeframeConfig = {
  "30min": {
    intervalMs: 1800000, // 30 мин в миллисекундах
    startOffsetUtcMs: 21 * 3600000, // Начало периода в UTC (21:00 UTC = 00:00 МСК)
    description: "30-минутные свечи (00:00, 00:30... МСК)",
    timezone: "Europe/Moscow",
  },
  "1h": {
    intervalMs: 3600000, // 1 час в миллисекундах
    startOffsetUtcMs: 21 * 3600000, // Начало периода в UTC (21:00 UTC = 00:00 МСК)
    description: "1-часовые свечи (00:00, 01:00... МСК)",
    timezone: "Europe/Moscow",
  },
  "2h": {
    intervalMs: 7200000, // 2 часа в миллисекундах
    startOffsetUtcMs: 22 * 3600000, // Начало периода в UTC (22:00 UTC = 01:00 МСК)
    description: "2-часовые свечи (01:00, 03:00... МСК)",
    timezone: "Europe/Moscow",
  },
  "4h": {
    intervalMs: 14400000, // 4 часа в миллисекундах
    startOffsetUtcMs: 0, // Начало периода в UTC (00:00 UTC = 03:00 МСК)
    description: "4-часовые свечи (03:00, 07:00... МСК)",
    timezone: "Europe/Moscow",
  },
};

export const convertCandles = (candles, timeframe) => {
  const { intervalMs, startOffsetUtcMs } = timeframeConfig[timeframe];
  const groups = new Map();

  for (const candle of candles) {
    // Вычисляем начало группы в UTC
    const time = candle.time;
    const diff = time - startOffsetUtcMs;
    const groupTime =
      startOffsetUtcMs + Math.floor(diff / intervalMs) * intervalMs;
    // Пропускаем группы до начального смещения
    if (groupTime < startOffsetUtcMs) continue;
    // Добавляем свечу в группу
    if (!groups.has(groupTime)) groups.set(groupTime, []);
    groups.get(groupTime).push(candle);
  }

  // Формируем свечи старшего ТФ
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

// get closed positions history
export const getClosedPositionsHistory = async (symbol = null, cursor) => {
  const params = {
    category: "linear",
    limit: 10,
    cursor,
  };
  if (symbol) {
    params.symbol = symbol;
  }
  const response = await bybitClient.getClosedPnL(params);
  if (response.retCode !== 0) {
    throw new Error(`Error API: ${response.retMsg}`);
  }

  if (response.result.list && response.result.list.length > 0) {
    return {
      positions: response.result.list,
      cursor: response.result.nextPageCursor,
    };
  }
  return { positions: [] };
};
//get position
export const getTickerPositions = async (symbol) => {
  const positionResponse = await bybitClient.getPositionInfo({
    category: "linear",
    symbol,
  });
  if (positionResponse.retCode !== 0) {
    throw new Error(`Error API: ${positionResponse.retMsg}`);
  }
  return positionResponse.result.list
    .filter((p) => p.size > 0)
    .map((order) => ({
      symbol: order.symbol,
      localTime: new Date(parseInt(order.updatedTime)).toLocaleString("ru-RU"),
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
};
//edit SL/TP

export const editStopLoss = async (symbol, side, stopLoss) => {
  // 1. Получаем текущую позицию
  const positions = await getTickerPositions(symbol);
  const sidePosition = positions.find((p) => p.side === side);
  if (!sidePosition) throw new Error("Нет открытой позиции");
  const params = {
    category: "linear",
    symbol,
    positionIdx: sidePosition.positionIdx, // Важно!
    stopLoss,
  };
  const response = await bybitClient.setTradingStop(params);
  if (response.retCode !== 0) {
    throw new Error(`Error API: ${response.retMsg}`);
  }
};
export const editTakeProfit = async (symbol, side, takeProfit) => {
  // 1. Получаем текущую позицию
  const positions = await getTickerPositions(symbol);
  const sidePosition = positions.find((p) => p.side === side);
  if (!sidePosition) throw new Error("Нет открытой позиции");
  const params = {
    category: "linear",
    symbol,
    positionIdx: sidePosition.positionIdx, // Важно!
    takeProfit,
  };
  const response = await bybitClient.setTradingStop(params);
  if (response.retCode !== 0) {
    throw new Error(`Error API: ${response.retMsg}`);
  }
};
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
//get positions
export const getPositions = async (cursor, limit = 10) => {
  const balance = await getBybitBalance();
  const params = {
    category: "linear",
    settleCoin: "USDT",
    limit,
    cursor,
  };
  const response = await bybitClient.getPositionInfo(params);
  if (response.retCode !== 0) {
    throw new Error(`Error API: ${response.retMsg}`);
  }
  return {
    positions: response.result.list,
    nextPageCursor: response.result.nextPageCursor,
    balance,
  };
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
//get order
export const getTickerOrders = async (symbol) => {
  const params = {
    category: "linear",
    settleCoin: "USDT",
    //openOnly: 0,
    //orderFilter: "Order",
    symbol,
  };
  const response = await bybitClient.getActiveOrders(params);
  if (response.retCode !== 0) {
    throw new Error(`Error API: ${response.retMsg}`);
  }
  return response.result.list
    .filter((o) => o.price > 0)
    .map((order) => ({
      orderId: order.orderId,
      symbol: order.symbol,
      localTime: new Date(parseInt(order.createdTime)).toLocaleString("ru-RU"),
      side: order.side,
      price: parseFloat(order.price),
      qty: parseFloat(order.qty),
      sum: (order.qty * order.price).toFixed(2),
      triggerPrice: parseFloat(order.triggerPrice),
    }));
};
//list orders
export const getLimitOrders = async (cursor, limit = 10) => {
  const params = {
    category: "linear",
    settleCoin: "USDT",
    //openOnly: 2,
    //orderFilter: "StopOrder",
    limit,
    cursor,
  };
  const response = await bybitClient.getActiveOrders(params);
  if (response.retCode !== 0) {
    throw new Error(`Error API: ${response.retMsg}`);
  }
  return {
    orders: response.result.list,
    nextPageCursor: response.result.nextPageCursor,
  };
};
//create or edit order
export const createLimitOrder = async (
  symbol,
  side,
  price,
  MAX_POSITION,
  tpPercent,
  slPercent,
  orderId,
) => {
  try {
    // 1. Получаем текущую рыночную цену
    const ticker = await bybitClient.getTickers({
      category: "linear",
      symbol,
    });
    const currentPrice = parseFloat(ticker.result.list[0].lastPrice);
    // 2. Проверяем логику цены
    // if (side === "Buy" && price >= lastPrice) {
    //   throw new Error(
    //     `Для Buy цена ордера (${price}) должна быть ниже текущей (${lastPrice})`,
    //   );
    // }
    // if (side === "Sell" && price <= lastPrice) {
    //   throw new Error(
    //     `Для Sell цена ордера (${price}) должна быть выше текущей (${lastPrice})`,
    //   );
    // }
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
    const maxUsdt = MAX_POSITION;
    const baseQty = maxUsdt / price;

    // 3. Приводим к шагу qtyStep
    //const step = Number(qtyStep);
    const adjustedQty = Math.floor(baseQty / qtyStep) * qtyStep;
    //const adjustedQty = Math.round(baseQty / qtyStep) * qtyStep;
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
    const triggerPrice =
      side === "Buy"
        ? formatPrice(price * (1 + 0.0015))
        : formatPrice(price * (1 - 0.0015));
    const entryPrice =
      side === "Buy"
        ? formatPrice(triggerPrice * (1 + 0.001))
        : formatPrice(triggerPrice * (1 - 0.001));
    const takeProfit =
      side === "Sell"
        ? formatPrice(entryPrice * (1 - tpPercent / 100))
        : formatPrice(entryPrice * (1 + tpPercent / 100));
    const stopLoss =
      side === "Sell"
        ? formatPrice(entryPrice * (1 + slPercent / 100))
        : formatPrice(entryPrice * (1 - slPercent / 100));
    //edit order
    if (orderId) {
      const params = {
        category: "linear",
        symbol,
        orderId,
        price: entryPrice,
        triggerPrice,
        takeProfit,
        stopLoss,
        qty: formattedQty,
      };

      const response = await bybitClient.amendOrder(params);
      if (response.retCode === 0) {
        console.log("Ордер успешно изменен:", response.result);
        return response.result;
      } else {
        throw new Error(`Ошибка ${response.retCode}: ${response.retMsg}`);
      }
    } else {
      const response = await bybitClient.submitOrder({
        category: "linear",
        symbol,
        side,
        orderType: "Limit",
        qty: formattedQty,
        triggerPrice,
        price: entryPrice,
        takeProfit,
        stopLoss,
        //triggerDirection: side === "Sell" ? 2 : 1,
        triggerDirection: triggerPrice > currentPrice ? 1 : 2,
        timeInForce: "GTC",
        positionIdx: side === "Sell" ? 2 : 1,
      });
      if (response.retCode !== 0) {
        throw new Error(`Order create Error: ${response.retMsg}`);
      }
      return { orderId: response.result.orderId };
    }
  } catch (error) {
    throw new Error(
      `${symbol} ${side} Order creation failed: ${error.message}`,
    );
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
//get ticker
export const getTicker = async (symbol) => {
  try {
    const response = await bybitClient.getInstrumentsInfo({
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
