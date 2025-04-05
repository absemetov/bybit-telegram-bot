import { RestClientV5 } from "bybit-api";
import dotenv from "dotenv";
dotenv.config();
const bybitClient = new RestClientV5({
  key: process.env.BYBIT_API_KEY,
  secret: process.env.BYBIT_API_SECRET,
});
export const getBybitBalance = async () => {
  try {
    const response = await bybitClient.getWalletBalance({
      accountType: "UNIFIED",
    });
    console.log("Wallet Balance:", response.result.list[0].totalEquity);
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
