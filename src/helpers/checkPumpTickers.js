import CandlePatterns from "../helpers/candlePatterns.js";
import Indicators from "../helpers/indicators.js";
import Ticker from "../models/Ticker.js";
import Scan from "../models/Scan.js";
import { Markup } from "telegraf";

import { getCandles, getActiveSymbols } from "../helpers/bybitV5.js";
// Основная функция сканирования
export const runTimeframeScan = async (timeframe, bot) => {
  const config = await Scan.getConfig(timeframe);
  let cursor = null;
  let count = 0;
  let findTickers = 0;

  do {
    const { symbols, nextCursor } = await getActiveSymbols(cursor, 30);
    const pumpTickers = await processBatch(symbols, config, timeframe);
    findTickers += pumpTickers;
    count += symbols.length;
    cursor = nextCursor;
    // Пауза между пагинациями
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } while (cursor);

  console.log(
    `Completed ${timeframe} scan. Processed ${count} symbols. Found ${findTickers} pump tickers`,
  );
  if (config.notify) {
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
          data: { arrayNotify, lastNotified: new Date() },
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
    // search levels zone
    if (config.patterns?.patternSR) {
      const {
        candlesCount,
        extrCount,
        tolerancePercent,
        touchCount,
        priceNear,
      } = config.patterns.patternSR;
      const candlesSlice = candles.slice(-candlesCount);
      const levels = Indicators.calculateLevels(
        candlesSlice,
        extrCount,
        tolerancePercent,
        touchCount,
      );
      const priceNearConfig = priceNear || 0.002;
      if (levels.support) {
        const priceNearValue = Math.abs(
          (levels.support - candles[candles.length - 1].close) /
            candles[candles.length - 1].close,
        );
        if (priceNearValue <= priceNearConfig) {
          arrayNotify.push(
            `[LONG supportZone ${levels.support.toFixed(5)}] ${priceNear.toFixed(3)} Price ${candles[candles.length - 1].close}\n` +
              `Candle ${candles[candles.length - 1].localTime}`,
          );
        }
      }
      if (levels.resistance) {
        const priceNearValue = Math.abs(
          (levels.support - candles[candles.length - 1].close) /
            candles[candles.length - 1].close,
        );
        if (priceNearValue <= priceNearConfig) {
          arrayNotify.push(
            `[SHORT resistanceZone ${levels.resistance.toFixed(5)}] ${priceNear.toFixed(3)} Price ${candles[candles.length - 1].close}\n` +
              `Candle ${candles[candles.length - 1].localTime}`,
          );
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
        arrayNotify.push(
          `[RSI signalLong] Price ${candles[candles.length - 1].close}\n` +
            `Candle ${candles[candles.length - 1].localTime}` +
            `${JSON.stringify(rsiSignal.details)}`,
        );
      }
      if (rsiSignal.signalShort) {
        arrayNotify.push(
          `[RSI signalShort] Price ${candles[candles.length - 1].close}\n` +
            `Candle ${candles[candles.length - 1].localTime}` +
            `${JSON.stringify(rsiSignal.details)}`,
        );
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
