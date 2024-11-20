import { RestClientV5 } from "bybit-api";
const client = new RestClientV5();

export const bybitKline = async (symbol, textInterval, candlesCount) => {
  const textToMinutes = {
    "1min": 1,
    "5min": 5,
    "15min": 15,
    "30min": 30,
    "1h": 60,
    "4h": 240,
    "6h": 360,
    "12h": 720,
    "1d": 1440,
    "1w": 10080,
  };
  const interval = textToMinutes[textInterval];
  if (!interval)
    throw new Error(
      `Error use only 1min 5min 15min 30min 1h 4h 6h 12h 1d interval!`,
    );
  const date = new Date();
  const timeEndMs = date.getTime();
  date.setMinutes(date.getMinutes() - interval * candlesCount);
  const timeStartMs = date.getTime();
  // get kline data
  const textToMinutesK = {
    "1min": 1,
    "5min": 5,
    "15min": 15,
    "30min": 30,
    "1h": 60,
    "4h": 240,
    "6h": 360,
    "12h": 720,
    "1d": "D",
    "1w": "W",
  };
  const kline = await client.getKline({
    category: "linear",
    symbol,
    interval: textToMinutesK[textInterval],
    start: timeStartMs,
    end: timeEndMs,
  });
  return kline.result.list;
};

export const bybitTickers = async () => {
  const getTickers = await client.getTickers({ category: "linear" });
  //parting
  return getTickers.result.list.filter(function (el) {
    return /([A-Z0-9]+)USDT/.test(el.symbol);
  });
};

// helper
const notStableCoins = (symbol) => {
  const stableCoinsArray = ["USDCUSDT", "USDEUSDT", "FDUSDUSDT"];
  for (const coin of stableCoinsArray) {
    if (symbol === coin) return false;
  }
  return true;
};

export const bybitTickersChunks = async () => {
  const getTickers = await client.getTickers({ category: "linear" });
  //all coins 469 split for 9 chunks by 52 tickers
  const tickersUsdtArray = getTickers.result.list.filter(function (el) {
    return /([A-Z0-9]+)USDT/.test(el.symbol) && notStableCoins(el.symbol);
  });
  const chunkSize = 50;
  let tickersLength = tickersUsdtArray.length;
  const chunksArray = [];
  for (let i = 0; i < tickersLength; i += chunkSize) {
    chunksArray.push(tickersUsdtArray.slice(i, i + chunkSize));
  }
  return { chunksArray, tickersLength };
};
