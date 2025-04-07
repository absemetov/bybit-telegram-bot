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
      const candles = await getCandles(symbol, timeframe, 20);
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
export const analyze = async (symbol, candles, config, timeframe) => {
  try {
    const arrayNotify = [];
    //const analyzeCandles = CandlePatterns.analyze(candles);
    const analyzeIndicators = Indicators.calc(candles, config, timeframe);
    const { levels } = analyzeIndicators;
    const priceNearConfig = config.patterns?.patternSR?.priceNear
      ? config.patterns.patternSR.priceNear
      : 0.002;
    if (levels.support) {
      const priceNear = Math.abs(
        (levels.support - candles[candles.length - 1].close) /
          candles[candles.length - 1].close,
      );
      if (priceNear <= priceNearConfig) {
        arrayNotify.push(
          `[LONG supportZone ${levels.support.toFixed(5)}] ${priceNear.toFixed(3)} Price ${candles[candles.length - 1].close}\n` +
            `Candle ${candles[candles.length - 1].localTime}` +
            `${JSON.stringify(analyzeIndicators)}`,
        );
      }
    }
    if (levels.resistance) {
      const priceNear = Math.abs(
        (levels.support - candles[candles.length - 1].close) /
          candles[candles.length - 1].close,
      );
      if (priceNear <= priceNearConfig) {
        arrayNotify.push(
          `[SHORT resistanceZone ${levels.resistance.toFixed(5)}] ${priceNear.toFixed(3)} Price ${candles[candles.length - 1].close}\n` +
            `Candle ${candles[candles.length - 1].localTime}` +
            `${JSON.stringify(analyzeIndicators)}`,
        );
      }
    }
    // if (rsiSignal.signal && macdSignal.zeroCross) {
    //   arrayNotify.push(
    //     `[LONG macdSignal.zeroCross+RSI] Price ${candles[candles.length - 1].close}\n` +
    //       `Candle ${candles[candles.length - 1].localTime}` +
    //       `${JSON.stringify(analyzeIndicators)}`,
    //   );
    // }
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
