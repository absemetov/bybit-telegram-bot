import CandlePatterns from "../helpers/candlePatterns.js";
import Indicators from "../helpers/indicators.js";
import { getActiveSymbols } from "../helpers/bybitV5.js";
import { uploadDataToAlgolia } from "../helpers/algoliaIndex.js";
import Ticker from "../models/Ticker.js";
import Scan from "../models/Scan.js";
import { Markup } from "telegraf";

import { getCandles } from "../helpers/bybitV5.js";
// Основная функция сканирования
export const runTimeframeScan = async (timeframe, bot) => {
  const config = await Scan.getConfig(timeframe);
  let count = 0;
  let findTickers = 0;
  //bybit api tickers
  if (timeframe === "1d") {
    let cursor = null;
    //await configureAlgoliaIndex();
    do {
      const { symbols, nextCursor } = await getActiveSymbols(cursor, 30);
      await uploadDataToAlgolia(symbols);
      //const pumpTickers = await processBatch(symbols, config, timeframe);
      //findTickers += pumpTickers;
      //count += symbols.length;
      cursor = nextCursor;
      // Пауза между пагинациями
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } while (cursor);
  }
  //own tickers search
  let direction = null;
  let lastVisible = null;
  do {
    const { tickers, hasNext, lastVisibleId } = await Ticker.paginate(
      50,
      direction,
      lastVisible,
      "all",
    );
    const symbols = tickers.map((c) => c.symbol);
    const pumpTickers = await processBatch(symbols, config, timeframe);
    findTickers += pumpTickers;
    count += tickers.length;
    direction = hasNext ? "next" : null;
    lastVisible = lastVisibleId;
    // Пауза между пагинациями 1sec
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } while (direction);
  //notify
  console.log(
    `Completed ${timeframe} scan. Processed ${count} symbols. Found ${findTickers} pump tickers`,
  );
  if (config.notify) {
    //channel notify
    // await bot.telegram.sendMessage(
    //   "-1001828677837",
    //   `Completed ${timeframe} scan. Found ${findTickers} pump tickers. From ${count} symbols. Config: ${JSON.stringify(config)}`,
    //   {
    //     parse_mode: "HTML",
    //     ...Markup.inlineKeyboard([
    //       [
    //         Markup.button.url(
    //           `BTCUSDT/${timeframe}`,
    //           `https://bybit.rzk.com.ru/chart/BTCUSDT/${timeframe}/message`,
    //         ),
    //       ],
    //     ]),
    //   },
    // );
    //@absemetov
    await bot.telegram.sendMessage(
      94899148,
      `Completed ${timeframe} scan. Found ${findTickers} pump tickers. From ${count} symbols.`,
      {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([
          [
            Markup.button.url(
              `BTCUSDT/${timeframe}`,
              `https://bybit.rzk.com.ru/chart/BTCUSDT/${timeframe}/message`,
            ),
          ],
        ]),
      },
    );
  }
};
// Обработка батча символов
async function processBatch(symbols, config, timeframe) {
  const tickerNotifyArray = [];
  let count = 0;
  for (const symbol of symbols) {
    try {
      const candles = await getCandles(symbol, timeframe, 50);
      const arrayNotify = await analyze(symbol, candles, config, timeframe);
      if (arrayNotify.length) {
        count += 1;
        tickerNotifyArray.push({
          symbol,
          timeframe,
          lastNotified: new Date(),
          arrayNotify,
        });
      }
      await new Promise((resolve) => setTimeout(resolve, 500)); // Пауза между символами
    } catch (error) {
      console.error(`Error processing ${symbol}:`, error.message);
    }
  }
  await Ticker.sendNotifyPump(tickerNotifyArray, "pump");
  return count;
}
export const analyze = async (symbol, candles, config) => {
  try {
    const arrayNotify = [];
    //const analyzeCandles = CandlePatterns.analyze(candles);
    // level resistance
    if (config.patterns?.patternR) {
      const {
        candlesCount,
        extrCount,
        tolerancePercent,
        touchCount,
        pricePercent = 0.1,
      } = config.patterns.patternR;
      const candlesSlice = candles.slice(-candlesCount);
      const lastCandle = candlesSlice[candlesSlice.length - 1];
      const levels = Indicators.calculateLevels(
        candlesSlice,
        extrCount,
        tolerancePercent,
        touchCount,
      );
      const priceNearConfig = pricePercent / 100;
      if (levels.resistance) {
        const priceNearValue = Math.abs(
          (levels.resistance - lastCandle.close) / lastCandle.close,
        );
        if (priceNearValue <= priceNearConfig) {
          arrayNotify.push({
            name: "patternR",
            text:
              `[SHORT resistanceZone ${levels.resistance.toFixed(5)}], priceNearValue ${priceNearValue.toFixed(5)} Price ${lastCandle.close}\n` +
              `Candle ${lastCandle.localTime}`,
          });
        }
      }
    }
    //level support
    if (config.patterns?.patternS) {
      const {
        candlesCount,
        extrCount,
        tolerancePercent,
        touchCount,
        pricePercent = 0.1,
      } = config.patterns.patternS;
      const candlesSlice = candles.slice(-candlesCount);
      const lastCandle = candlesSlice[candlesSlice.length - 1];
      const levels = Indicators.calculateLevels(
        candlesSlice,
        extrCount,
        tolerancePercent,
        touchCount,
      );
      const priceNearConfig = pricePercent / 100;
      if (levels.support) {
        const priceNearValue = Math.abs(
          (levels.support - lastCandle.close) / lastCandle.close,
        );
        if (priceNearValue <= priceNearConfig) {
          arrayNotify.push({
            name: "patternS",
            text:
              `[LONG supportZone ${levels.support.toFixed(5)}], priceNearValue ${priceNearValue.toFixed(5)} Price ${lastCandle.close}\n` +
              `Candle ${lastCandle.localTime}`,
          });
        }
      }
    }
    //RSI pattern
    if (config.patterns?.patternRSI) {
      const { longRSI, shortRSI } = config.patterns.patternRSI;
      const closes = candles.map((candle) => candle.close);
      const rsiSignal = Indicators.calculateRSISignal(
        closes,
        longRSI,
        shortRSI,
      );
      if (rsiSignal.signalLong) {
        arrayNotify.push({
          name: "patternRSI_long",
          text:
            `[RSI signalLong] Price ${candles[candles.length - 1].close}\n` +
            `Candle ${candles[candles.length - 1].localTime}` +
            `${JSON.stringify(rsiSignal.details)}`,
        });
      }
      if (rsiSignal.signalShort) {
        arrayNotify.push({
          name: "patternRSI_short",
          text:
            `[RSI signalShort] Price ${candles[candles.length - 1].close}\n` +
            `Candle ${candles[candles.length - 1].localTime}` +
            `${JSON.stringify(rsiSignal.details)}`,
        });
      }
    }
    return arrayNotify;
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error in cron job:`,
      error.message,
    );
  }
};

export const analyzeCoin = async (symbol, timeframe = "1h") => {
  const config = await Scan.getConfig(timeframe);
  const candles = await getCandles(symbol, timeframe, 15);
  const analyzeCandles = CandlePatterns.analyze(candles);
  const analyzeIndicators = Indicators.calc(candles, config);
  return { analyzeCandles, analyzeIndicators, candles };
};
