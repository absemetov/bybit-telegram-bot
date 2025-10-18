import Indicators from "../helpers/indicators.js";
import { getActiveSymbols, getCandles } from "../helpers/bybitV5.js";
//import { uploadDataToAlgolia } from "../helpers/algoliaIndex.js";
import Ticker from "../models/Ticker.js";
import { Markup } from "telegraf";
import { sendMsgChannel, sendMsgMe, escapeHtml } from "../helpers/helpers.js";
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
          for (const tf of ["4h", "1d"]) {
            const levels = await findLevels(ticker, bot, tf);
            const rsi = await getRsi(ticker, bot, tf);
            if (levels && rsi && (rsi <= 40 || rsi >= 60)) {
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
                `<code>${symbol.slice(0, -4)}</code> <b>[${escapeHtml(msg)}] RSI ${rsi.toFixed(2)}%</b> ${new Date().toLocaleString("ru-RU")}\n` +
                  `#${symbol.slice(0, -4)} #${symbol} #top100`,
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
                `<code>${symbol.slice(0, -4)}</code> <b>[${escapeHtml(msg)} RSI ${rsi.toFixed(2)}%]</b> ${new Date().toLocaleString("ru-RU")}\n` +
                  `#${symbol.slice(0, -4)} #${symbol}`,
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
    await sendMsgMe(bot, `Error in CheckLevels ${error.message}`);
  }
};
//find pump volumes
async function findPumpVolumes(
  ticker,
  bot,
  timeframe = "15min",
  multiplier = 3,
) {
  try {
    const { symbol } = ticker;
    const candles = await getCandles(symbol, timeframe, 200);
    if (candles.length < 200) {
      return null;
    }
    const rsiData = Indicators.calculateRSI(candles);
    const currentRsi = rsiData[rsiData.length - 1].value;
    //const previousVolumes = candles.slice(0, 2);
    //prev candle
    const { close, volume } = candles[candles.length - 2];
    //const averageVolume =
    //  previousVolumes.reduce((sum, candle) => sum + candle.volume, 0) /
    //  previousVolumes.length;
    const averageVolume =
      (candles[candles.length - 4] + candles[candles.length - 5]) / 2;
    const volumeRatio = volume / averageVolume;
    const isSpike = volumeRatio >= multiplier;
    console.log(currentRsi);
    if (isSpike && currentRsi <= 50) {
      return {
        msg: `📊 Volume Up x${volumeRatio.toFixed(1)} RSI ${currentRsi.toFixed(2)}% ${timeframe} Price ${close}$`,
      };
    }
    return null;
  } catch (error) {
    console.error(`Error in findPumpvolumes ${ticker.symbol}:`, error.message);
    await bot.telegram.sendMessage(
      94899148,
      `Error in ${timeframe} find Levels ${error.message}`,
      {
        parse_mode: "HTML",
      },
    );
  }
}
//get RSI data
async function getRsi(ticker, bot, timeframe = "1h") {
  try {
    const { symbol } = ticker;
    const candles = await getCandles(symbol, timeframe, 100);
    if (candles.length < 100) {
      return null;
    }
    const rsiData = Indicators.calculateRSI(candles);
    return rsiData[rsiData.length - 1].value;
  } catch (error) {
    console.error(`Error processing:`, error.message);
    await bot.telegram.sendMessage(
      94899148,
      `Error in 4h find Levels ${error.message}`,
      {
        parse_mode: "HTML",
      },
    );
  }
}
//find levels
async function findLevels(
  ticker,
  bot,
  timeframe = "1h",
  candlesCount = 30,
  touchCount = 4,
  tolerance = 0.5,
) {
  try {
    const { symbol } = ticker;
    const candles = await getCandles(symbol, timeframe, candlesCount);
    const { close } = candles[candles.length - 1];
    const longLevels = Indicators.calculateLevels(candles, touchCount);
    //support zone
    if (Math.abs(longLevels.support - close) / close <= 1 / 100) {
      //timeframe === "4h" ? 94899148 : "-1002687531775",
      const newLevel =
        !ticker[`levelPriceS${timeframe}`] ||
        Math.abs(ticker[`levelPriceS${timeframe}`] - longLevels.support) /
          longLevels.support >=
          1 / 100;
      if (newLevel) {
        return {
          msg: `📈 Support zone ${timeframe} [${candlesCount}, ${touchCount}, ${tolerance}] ${close}$ #support `,
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
          1 / 100;
      if (newLevel) {
        return {
          msg: `📉 Resistance zone ${timeframe} [${candlesCount}, ${touchCount}, ${tolerance}] ${close}$ #resistance`,
          [`levelPriceR${timeframe}`]: longLevels.resistance,
        };
      }
    }
    return null;
  } catch (error) {
    console.error(`Error check Levels:`, error.message);
    await bot.telegram.sendMessage(
      94899148,
      `Error in 4h find Levels ${error.message}`,
      {
        parse_mode: "HTML",
      },
    );
  }
}
