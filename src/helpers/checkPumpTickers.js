import Indicators from "../helpers/indicators.js";
import { getActiveSymbols } from "../helpers/bybitV5.js";
import { uploadDataToAlgolia } from "../helpers/algoliaIndex.js";
import Ticker from "../models/Ticker.js";
//import Scan from "../models/Scan.js";
import { Markup } from "telegraf";

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
      const candles = await getCandles(symbol, timeframe, 300);
      await analyze(ticker, candles, timeframe, bot);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1second pause
    } catch (error) {
      console.error(`Error processing ${ticker.symbol}:`, error.message);
    }
  }
  return { count, rsiSymbols };
}
export const analyze = async (ticker, candles, timeframe, bot) => {
  try {
    const { symbol, priceScale } = ticker;
    //calculate indicators levels, rsi, rsiEma
    const { close } = candles[candles.length - 1];
    const arrayNotify = [];
    //scan timeframe array
    const rsiData = Indicators.calculateRSI(candles);
    const currentRsi = rsiData[rsiData.length - 1].value;
    const { support, resistance, rangePercent } = Indicators.calculateLevels(
      candles.slice(-36),
      6,
    );
    //const ema21Data = Indicators.calculateEMA(candles1h, 21);
    //const currentEma21 = ema21Data[ema21Data.length - 1].value;
    //ema21 cross price
    //const ema21cross =
    //  Math.abs((currentEma21 - close) / close) * 100 <= 0.1;
    //if (ema21cross) {
    //  arrayNotify.push({
    //    tf: `ema21cross ${close}$`,
    //  });
    //}
    //support zone
    const supportZone =
      Math.abs((close - support) / support) * 100 <= rangePercent;
    if (supportZone && currentRsi < 55) {
      arrayNotify.push({
        tf: `Support zone ${timeframe} ${support.toFixed(priceScale)}$ RSI ${currentRsi.toFixed(1)}`,
      });
    }
    //resistance
    const resistanceZone =
      Math.abs((close - resistance) / resistance) * 100 < rangePercent;
    if (resistanceZone && currentRsi > 55) {
      arrayNotify.push({
        tf: `Resistance Zone ${timeframe} ${resistance.toFixed(priceScale)}$ RSI ${currentRsi.toFixed(1)}`,
      });
    }
    if (arrayNotify.length > 0) {
      //telegram bybit channel -1002687531775 absemetov 94899148
      const info = arrayNotify.map((obj) => Object.values(obj)).join();
      await bot.telegram.sendMessage(
        "-1002687531775",
        `<code>${symbol.slice(0, -4)}</code> <b>[#INFO ${info}]</b>\n` +
          `#${symbol.slice(0, -4)} #${symbol}`,
        {
          parse_mode: "HTML",
          ...Markup.inlineKeyboard([
            [
              Markup.button.url(
                `${symbol} chart`,
                `https://bybit-telegram-bot.pages.dev/${symbol}/1h`,
              ),
            ],
          ]),
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
