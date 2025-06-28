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
  //algolia set "1d" for upload
  if (timeframe === "====") {
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
    //const symbols = tickers.map((c) => c.symbol);
    const pumpTickers = await processBatch(tickers, config, timeframe);
    findTickers += pumpTickers;
    count += tickers.length;
    direction = hasNext ? "next" : null;
    lastVisible = lastVisibleId;
    // Пауза между пагинациями 1sec
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } while (direction);
  //notify
  console.log(
    `Completed ${timeframe} scan ${new Date()}. Processed ${count} symbols. Found ${findTickers} levels`,
  );
  if (config.notify) {
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
async function processBatch(tickers, config, timeframe) {
  const tickerLevelsArray = [];
  let count = 0;
  for (const ticker of tickers) {
    try {
      const { symbol } = ticker;
      const candles = await getCandles(symbol, timeframe, 50);
      const arrayNotify = await analyze(symbol, candles, config, timeframe);
      //save batch
      if (arrayNotify.length > 0) {
        count += 1;
        tickerLevelsArray.push({
          symbol,
          timeframe,
          arrayNotify,
        });
      }
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1second pause
    } catch (error) {
      console.error(`Error processing ${ticker.symbol}:`, error.message);
    }
  }
  await Ticker.saveLevelsBatch(tickerLevelsArray);
  return count;
}
export const analyze = async (symbol, candles, config, timeframe) => {
  try {
    const arrayNotify = [];
    const levelsPrice = await Ticker.getLevels(symbol);
    const levelS = levelsPrice.filter((l) => l.name === "patternS");
    const levelR = levelsPrice.filter((l) => l.name === "patternR");
    const tolerancePercentNewLevel = 0.1;
    // level resistance
    if (config.patterns?.patternR) {
      const { candlesCount, tolerancePercent, touchCount } =
        config.patterns.patternR;
      const candlesSlice = candles.slice(-candlesCount);
      const lastCandle = candlesSlice[candlesSlice.length - 1];
      const levels = Indicators.calculateLevels(
        candlesSlice,
        tolerancePercent,
        touchCount,
      );
      if (levels.resistance) {
        const prevPrice = levelR.find((l) => l.timeframe === timeframe)?.price;
        const difPricePercent = Math.abs(
          ((prevPrice - levels.resistance) / levels.resistance) * 100,
        );
        if (!prevPrice || difPricePercent >= tolerancePercentNewLevel) {
          arrayNotify.push({
            name: "patternR",
            price: levels.resistance,
            text:
              `[SHORT resistanceZone ${levels.resistance.toFixed(5)}]` +
              `Candle ${lastCandle.localTime}`,
            lastNotified: new Date(),
            timeframe,
          });
        }
      }
    }
    //level support
    if (config.patterns?.patternS) {
      const { candlesCount, tolerancePercent, touchCount } =
        config.patterns.patternS;
      const candlesSlice = candles.slice(-candlesCount);
      const lastCandle = candlesSlice[candlesSlice.length - 1];
      const levels = Indicators.calculateLevels(
        candlesSlice,
        tolerancePercent,
        touchCount,
      );
      //const priceNearConfig = tolerancePercent / 100;
      if (levels.support) {
        // const priceNearValue = Math.abs(
        //   (levels.support - lastCandle.close) / lastCandle.close,
        // );
        //if (priceNearValue <= priceNearConfig) {
        const prevPrice = levelS.find((l) => l.timeframe === timeframe)?.price;
        const difPricePercent = Math.abs(
          ((prevPrice - levels.support) / levels.support) * 100,
        );
        if (!prevPrice || difPricePercent >= tolerancePercentNewLevel) {
          arrayNotify.push({
            name: "patternS",
            price: levels.support,
            text:
              `[LONG supportZone ${levels.support.toFixed(5)}]` +
              `Candle ${lastCandle.localTime}`,
            lastNotified: new Date(),
            timeframe,
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
          price: candles[candles.length - 1].close,
          text:
            `[RSI signalLong]\n` +
            `Candle ${candles[candles.length - 1].localTime}` +
            `${JSON.stringify(rsiSignal.details)}`,
          lastNotified: new Date(),
        });
      }
      if (rsiSignal.signalShort) {
        arrayNotify.push({
          name: "patternRSI_short",
          price: candles[candles.length - 1].close,
          text:
            `[RSI signalShort]\n` +
            `Candle ${candles[candles.length - 1].localTime}` +
            `${JSON.stringify(rsiSignal.details)}`,
          lastNotified: new Date(),
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
