import Indicators from "../helpers/indicators.js";
import { getActiveSymbols, getCandles } from "../helpers/bybitV5.js";
//import { uploadDataToAlgolia } from "../helpers/algoliaIndex.js";
import Ticker from "../models/Ticker.js";
import { Markup } from "telegraf";
import { sendMsgChannel, sendMsgMe } from "../helpers/helpers.js";
//import { algoTrading, checkPositions } from "../helpers/levels.js";
// Основная функция сканирования
export const runTimeframeScan = async (timeframe, bot) => {
  try {
    //search levels in 4h tf
    if (timeframe === "4h") {
      let direction = null;
      let lastVisible = null;
      do {
        const { tickers, hasNext, lastVisibleId } = await Ticker.paginate(
          100,
          direction,
          lastVisible,
          "all",
        );
        const arrayNotify = [];
        for (const ticker of tickers) {
          const { symbol } = ticker;
          for (const tf of ["4h", "6h", "12h", "1d", "1w"]) {
            const levels = await findLevels(ticker, bot, tf);
            const rsi = await getRsi(ticker, bot, tf);
            if (levels) {
              arrayNotify.push({
                symbol,
                data: {
                  ...levels,
                  updatedAt: new Date(),
                  read: true,
                },
              });
              const { msg } = levels;
              await sendMsgChannel(
                bot,
                {
                  header: `<code>${symbol.slice(0, -4)}</code>`,
                  msg,
                  footer: `RSI ${rsi.toFixed(2)}% ${new Date().toLocaleString("ru-RU")} ${symbol}\n#${symbol.slice(0, -4)} #${symbol} #top100`,
                },
                Markup.inlineKeyboard([
                  [
                    Markup.button.url(
                      `${symbol} chart`,
                      `https://bybit-telegram-bot.pages.dev/${symbol}/${tf}`,
                    ),
                  ],
                ]),
              );
            }
          }
          //pause 1 seconds
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        //save batch
        await Ticker.saveLevelBatch(arrayNotify);
        direction = hasNext ? "next" : null;
        lastVisible = lastVisibleId;
        // Пауза между пагинациями
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } while (direction);
    }
    //scan all bybit tickers
    if (timeframe === "1d") {
      let cursor = null;
      //await configureAlgoliaIndex();
      do {
        const { tickers, nextCursor } = await getActiveSymbols(cursor, 50);
        //algolia set "1d" for upload
        //await uploadDataToAlgolia(tickers.map((t) => t.symbol));
        for (const ticker of tickers) {
          const { symbol } = ticker;
          for (const tf of ["4h", "1d"]) {
            const levels = await findLevels(ticker, bot, tf);
            const rsi = await getRsi(ticker, bot, tf);
            if (levels && rsi && (rsi <= 35 || rsi >= 70)) {
              const { msg } = levels;
              await sendMsgChannel(
                bot,
                {
                  header: `<code>${symbol.slice(0, -4)}</code>`,
                  msg,
                  footer: `RSI ${rsi.toFixed(2)}% ${new Date().toLocaleString("ru-RU")} ${symbol}\n#${symbol.slice(0, -4)} #${symbol} #top100`,
                },
                Markup.inlineKeyboard([
                  [
                    Markup.button.url(
                      `${symbol} chart`,
                      `https://bybit-telegram-bot.pages.dev/${symbol}/1h`,
                    ),
                  ],
                ]),
              );
            }
          }
          //volumeUp
          const volume = await volumeUp(symbol, 4);
          if (volume) {
            const { volumeRatio, msg } = volume;
            if (volumeRatio > 8) {
              await sendMsgChannel(
                bot,
                {
                  header: `<code>${symbol.slice(0, -4)}</code>`,
                  msg,
                  footer: `${new Date().toLocaleString("ru-RU")} ${symbol}\n#${symbol.slice(0, -4)} #${symbol} #top100`,
                },
                Markup.inlineKeyboard([
                  [
                    Markup.button.url(
                      `${symbol} chart`,
                      `https://bybit-telegram-bot.pages.dev/${symbol}/1h`,
                    ),
                  ],
                ]),
              );
            }
          }
          //pause 0.5 seconds
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        cursor = nextCursor;
        // Пауза между пагинациями
        // await new Promise((resolve) => setTimeout(resolve, 1000));
      } while (cursor);
    }
  } catch (error) {
    console.error(`Error CheckLevels`, error.message);
    await sendMsgMe(bot, { msg: `Error in CheckLevels ${error.message}` });
  }
};
//find pump volumes
export const volumeUp = async function findPumpVolumes(
  symbol,
  multiplier = 2.5,
  timeframe = "15min",
) {
  try {
    const candles = await getCandles(symbol, timeframe, 10);
    if (candles.length < 10) {
      return null;
    }
    const previousVolumes = candles.slice(-5, -1);
    //prev candle
    const { close, volume } = candles[candles.length - 1];
    const averageVolume =
      previousVolumes.reduce((sum, candle) => sum + candle.volume, 0) /
      previousVolumes.length;
    const volumeRatio = volume / averageVolume;
    const isSpike = volumeRatio >= multiplier;
    if (isSpike) {
      return {
        msg: `📊 Volume Up x${volumeRatio.toFixed(1)} ${timeframe} Price ${close}$`,
        volumeRatio,
      };
    }
    return null;
  } catch (error) {
    console.error(`Error in findPumpvolumes ${symbol}:`, error.message);
  }
};
//get RSI data
async function getRsi(ticker, bot, timeframe = "1h") {
  try {
    const { symbol } = ticker;
    const candles = await getCandles(symbol, timeframe, 200);
    if (candles.length < 100) {
      return 0;
    }
    const rsiData = Indicators.calculateRSI(candles);
    return rsiData[rsiData.length - 1].value;
  } catch (error) {
    console.error(`Error processing:`, error.message);
    await sendMsgMe(bot, { msg: `Error in getRsi ${error.message}` });
  }
}
//find levels
async function findLevels(ticker, bot, timeframe = "4h") {
  try {
    const {
      symbol,
      candlesCount = 30,
      touchCount = 4,
      tolerance = 0.5,
    } = ticker;
    const candles = await getCandles(symbol, timeframe, candlesCount);
    if (candles.length < candlesCount) {
      //continue;
      return null;
    }
    const { close } = candles[candles.length - 1];
    const longLevels = Indicators.calculateLevels(candles, touchCount);
    //support zone
    if (Math.abs(longLevels.support - close) / close <= 1 / 100) {
      //timeframe === "4h" ? 94899148 : "-1002687531775",
      const newLevel =
        !ticker[`levelPriceS${timeframe}`] ||
        Math.abs(ticker[`levelPriceS${timeframe}`] - longLevels.support) /
          longLevels.support >=
          0.5 / 100;
      if (newLevel) {
        return {
          msg: `📈 Support ${timeframe} ${close}$`,
          [`levelPriceS${timeframe}`]: longLevels.support,
        };
      }
    }
    //resistance
    //if (
    //  longLevels.resistance <= high * (1 + 0.5 / 100) &&
    //  longLevels.resistance >= low * (1 - 0.5 / 100)
    //) {
    if (Math.abs(longLevels.resistance - close) / close <= tolerance / 100) {
      const newLevel =
        !ticker[`levelPriceR${timeframe}`] ||
        Math.abs(ticker[`levelPriceR${timeframe}`] - longLevels.resistance) /
          longLevels.resistance >=
          0.5 / 100;
      if (newLevel) {
        return {
          msg: `📉 Resistance ${timeframe} ${close}$`,
          [`levelPriceR${timeframe}`]: longLevels.resistance,
        };
      }
    }
    return null;
  } catch (error) {
    console.error(`Error check Levels:`, error.message);
    await sendMsgMe(bot, { msg: `Error in findLevels ${error.message}` });
  }
}
