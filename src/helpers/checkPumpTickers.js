import Indicators from "../helpers/indicators.js";
import { getActiveSymbols } from "../helpers/bybitV5.js";
import { uploadDataToAlgolia } from "../helpers/algoliaIndex.js";
import Ticker from "../models/Ticker.js";
//import Scan from "../models/Scan.js";
//import { Markup } from "telegraf";

import { getCandles } from "../helpers/bybitV5.js";
// Основная функция сканирования
export const runTimeframeScan = async (timeframe, bot) => {
  //const config = await Scan.getConfig(timeframe);
  //let count = 0;
  //let findTickers = 0;
  //bybit all tickers
  //=================
  // let cursor = null;
  // do {
  //   const { symbols, nextCursor } = await getActiveSymbols(cursor, 20);
  //   await processBatch(symbols, timeframe, bot);
  //   //findTickers += response.count;
  //   //count += symbols.length;
  //   cursor = nextCursor;
  //   // Пауза между пагинациями
  //   await new Promise((resolve) => setTimeout(resolve, 1000));
  // } while (cursor);
  //================
  //bybit api tickers
  if (timeframe === "====") {
    let cursor = null;
    //await configureAlgoliaIndex();
    do {
      const { symbols, nextCursor } = await getActiveSymbols(cursor, 30);
      //algolia set "1d" for upload
      await uploadDataToAlgolia(symbols);
      cursor = nextCursor;
      // Пауза между пагинациями
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } while (cursor);
  }
  //my tickers search
  let direction = null;
  let lastVisible = null;
  //search params "alerts" or "all" "favorites"
  do {
    const { tickers, hasNext, lastVisibleId } = await Ticker.paginate(
      20,
      direction,
      lastVisible,
      "all",
    );
    await processBatch(tickers, timeframe, bot);
    //findTickers += response.count;
    //count += tickers.length;
    direction = hasNext ? "next" : null;
    lastVisible = lastVisibleId;
    // Пауза между пагинациями 1sec
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } while (direction);
  //notify
  // console.log(
  //   `Completed ${timeframe} scan ${new Date()}. Processed ${count} symbols. Found ${findTickers} levels`,
  // );
  // if (config.notify) {
  //   //@absemetov
  //   await bot.telegram.sendMessage(
  //     94899148,
  //     `Completed ${timeframe} scan. Found ${findTickers} pump tickers. From ${count} symbols.`,
  //     {
  //       parse_mode: "HTML",
  //       ...Markup.inlineKeyboard([
  //         [
  //           Markup.button.url(
  //             `BTCUSDT/${timeframe}`,
  //             `https://bybit.rzk.com.ru/chart/BTCUSDT/${timeframe}/message`,
  //           ),
  //         ],
  //       ]),
  //     },
  //   );
  // }
};
// Обработка батча символов
async function processBatch(tickers, timeframe, bot) {
  let count = 0;
  const rsiSymbols = [];
  for (const ticker of tickers) {
    try {
      const { symbol } = ticker;
      const candles = await getCandles(symbol, timeframe, 200);
      await analyze(symbol, candles, timeframe, bot);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1second pause
    } catch (error) {
      console.error(`Error processing ${ticker.symbol}:`, error.message);
    }
  }
  return { count, rsiSymbols };
}
export const analyze = async (symbol, candles, timeframe, bot) => {
  try {
    //calculate indicators levels, rsi, rsiEma
    const currentPrice = candles[candles.length - 1].close;
    const rsiData = Indicators.calculateRSI(candles);
    const rsiEmaData = Indicators.calculateEMA(rsiData);
    const ema9Data = Indicators.calculateEMA(candles, 9);
    const ema21Data = Indicators.calculateEMA(candles, 21);
    const candlesLevelSlice = candles.slice(-24);
    const { support, resistance } = Indicators.calculateLevels(
      candlesLevelSlice,
      1,
      5,
    );
    const currentEma9 = ema9Data[ema9Data.length - 1].value;
    const currentEma21 = ema21Data[ema21Data.length - 1].value;
    const currentEma9Prev = ema9Data[ema9Data.length - 2].value;
    const currentEma21Prev = ema21Data[ema21Data.length - 2].value;
    const currentRsi = rsiData[rsiData.length - 1].value;
    const currentRsiPrev = rsiData[rsiData.length - 2].value;
    const currentRsiEma = rsiEmaData[rsiEmaData.length - 1].value;
    const currentRsiEmaPrev = rsiEmaData[rsiEmaData.length - 2].value;
    //support
    if (Math.abs((currentPrice - support) / support) * 100 <= 4) {
      //telegram bybit channel -1002687531775 absemetov 94899148
      await bot.telegram.sendMessage(
        "-1002687531775",
        `<code>${symbol.slice(0, -4)}</code><b> [SIGNAL SUPPORT ZONE ${currentPrice}$ RSI ${currentRsi.toFixed(2)}% 1d]</b>\n` +
          `#${symbol.slice(0, -4)} #1d_${symbol.slice(0, -4)}`,
        {
          parse_mode: "HTML",
        },
      );
    }
    //resistance
    if (Math.abs((currentPrice - resistance) / resistance) * 100 <= 4) {
      await bot.telegram.sendMessage(
        "-1002687531775",
        `<code>${symbol.slice(0, -4)}</code><b> [SIGNAL RESISTANCE ZONE ${currentPrice}$ RSI ${currentRsi.toFixed(2)}% 1d]</b>\n` +
          `#${symbol.slice(0, -4)} #1d_${symbol.slice(0, -4)}`,
        {
          parse_mode: "HTML",
        },
      );
    }
    //rsi
    if (currentRsiEmaPrev < currentRsiPrev && currentRsiEma > currentRsi) {
      //telegram bybit channel -1002687531775 absemetov 94899148
      await bot.telegram.sendMessage(
        "-1002687531775",
        `<code>${symbol}</code> ${currentPrice}$ Long Signal ${timeframe} RSI14/RSI_EMA14\n` +
          `#${symbol} #1D_${symbol}`,
        {
          parse_mode: "HTML",
        },
      );
    }
    if (currentRsiEmaPrev > currentRsiPrev && currentRsiEma < currentRsi) {
      //telegram bybit channel -1002687531775 absemetov 94899148
      await bot.telegram.sendMessage(
        "-1002687531775",
        `<code>${symbol}</code> ${currentPrice}$ Short Signal ${timeframe} RSI14/RSI_EMA14\n` +
          `#${symbol} #1D_${symbol}`,
        {
          parse_mode: "HTML",
        },
      );
    }
    if (currentEma9Prev < currentEma21Prev && currentEma9 > currentEma21) {
      //telegram bybit channel -1002687531775 absemetov 94899148
      await bot.telegram.sendMessage(
        "-1002687531775",
        `<code>${symbol}</code> ${currentPrice}$ Long Signal ${timeframe} EMA9/EMA21 #${symbol}`,
        {
          parse_mode: "HTML",
        },
      );
    }
    if (currentEma9Prev > currentEma21Prev && currentEma9 < currentEma21) {
      //telegram bybit channel -1002687531775 absemetov 94899148
      await bot.telegram.sendMessage(
        "-1002687531775",
        `<code>${symbol}</code> ${currentPrice}$ Short Signal ${timeframe} EMA9/EMA21 #${symbol}`,
        {
          parse_mode: "HTML",
        },
      );
    }
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error in cron job:`,
      error.message,
    );
  }
};
