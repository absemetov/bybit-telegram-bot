import Indicators from "../helpers/indicators.js";
import { getActiveSymbols, bybitUsers } from "../helpers/bybitV5.js";
//import { uploadDataToAlgolia } from "../helpers/algoliaIndex.js";
import Ticker from "../models/Ticker.js";
import { Markup } from "telegraf";
import { sendMsgChannel, sendMsgMe } from "../helpers/helpers.js";
//import { algoTrading, checkPositions } from "../helpers/levels.js";
// Основная функция сканирования
const bybit = bybitUsers["main"];
export const runTimeframeScan = async (timeframe, bot) => {
  try {
    //search levels in 4h tf
    if (timeframe === "4h") {
      let direction = null;
      let lastVisible = null;
      do {
        //scan fav tickers
        const { tickers, hasNext, lastVisibleId } = await Ticker.paginate(
          100,
          direction,
          lastVisible,
        );
        const arrayNotify = [];
        for (const ticker of tickers) {
          const candlesCount = 15;
          const { symbol } = ticker;
          for (const tf of ["2h", "4h", "1d"]) {
            const candles = await bybit.getCandles(symbol, tf, candlesCount);
            if (candles.length < candlesCount) {
              continue;
            }
            const levels = await findLevels(
              ticker,
              candles,
              bot,
              tf,
              candlesCount,
              3,
              0.5,
            );
            //const rsi = await getRsi(ticker, bot, tf);
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
                  header: `<code>${symbol.slice(0, -4)}</code> `,
                  msg,
                  footer: `${new Date().toLocaleString("ru-RU")} ${symbol}\n#${symbol.slice(0, -4)}_levels #${symbol} #levels`,
                },
                Markup.inlineKeyboard([
                  [
                    Markup.button.url(
                      `${symbol} chart`,
                      `https://bybit.rzk.com.ru/chart/${symbol}`,
                    ),
                  ],
                ]),
              );
            }
            //compression 3%
            //const compression = await findCompression(
            //  ticker,
            //  candles,
            //  bot,
            //  tf,
            //  5,
            //  3,
            //  0.5,
            //  1.5,
            //);
            //if (compression) {
            //  arrayNotify.push({
            //    symbol,
            //    data: {
            //      ...compression,
            //      updatedAt: new Date(),
            //      read: true,
            //    },
            //  });
            //  const { msg } = compression;
            //  await sendMsgChannel(
            //    bot,
            //    {
            //      header: `<code>${symbol.slice(0, -4)}</code> `,
            //      msg,
            //      footer: `${new Date().toLocaleString("ru-RU")} ${symbol}\n#${symbol.slice(0, -4)}_compression #${symbol} #compression`,
            //    },
            //    Markup.inlineKeyboard([
            //      [
            //        Markup.button.url(
            //          `${symbol} chart`,
            //          `https://bybit.rzk.com.ru/chart/${symbol}`,
            //        ),
            //      ],
            //    ]),
            //  );
            //}
            //pause 1 seconds
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
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
      const candlesCount = 25;
      //await configureAlgoliaIndex();
      do {
        const { tickers, nextCursor } = await getActiveSymbols(cursor, 50);
        //algolia set "1d" for upload
        //await uploadDataToAlgolia(tickers.map((t) => t.symbol));
        for (const ticker of tickers) {
          const { symbol } = ticker;
          for (const tf of ["1d", "1w"]) {
            const candles = await bybit.getCandles(symbol, tf, candlesCount);
            if (candles.length < candlesCount) {
              continue;
              //return null;
            }
            const levels = await findLevels(
              ticker,
              candles,
              bot,
              tf,
              candlesCount,
              3,
              0.5,
            );
            //const rsi = await getRsi(ticker, bot, tf);
            if (levels) {
              const { msg } = levels;
              await sendMsgChannel(
                bot,
                {
                  header: `<code>${symbol.slice(0, -4)}</code> `,
                  msg,
                  footer: `${new Date().toLocaleString("ru-RU")} ${symbol}\n#${symbol.slice(0, -4)}_levels #${symbol} #levels`,
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
            //pause 1 seconds
            await new Promise((resolve) => setTimeout(resolve, 2000));
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
function findPumpVolumes(ticker, candles, multiplier = 2, timeframe = "4h") {
  try {
    const previousVolumes = candles.slice(-5, -1);
    //prev candle
    const { close, volume } = candles[candles.length - 1];
    const averageVolume =
      previousVolumes.reduce((sum, candle) => sum + candle.volume, 0) /
      previousVolumes.length;
    const volumeRatio = volume / averageVolume;
    const isSpike = volumeRatio >= multiplier;
    const newVolume =
      !ticker["volume"]?.[`volumeRatio${timeframe}`] ||
      Math.abs(ticker["volume"][`volumeRatio${timeframe}`] - volumeRatio) /
        volumeRatio >=
        10 / 100;
    if (isSpike && newVolume) {
      return {
        msg: `📊 Volume Up x${volumeRatio.toFixed(1)} tf ${timeframe} Price ${close}$`,
        volume: {
          [`volumeRatio${timeframe}`]: volumeRatio,
        },
      };
    }
    return null;
  } catch (error) {
    console.error(`Error in findPumpvolumes`, error.message);
  }
}
//get RSI data
async function getRsi(ticker, bot, timeframe = "1h") {
  try {
    const { symbol } = ticker;
    const candles = await bybit.getCandles(symbol, timeframe, 200);
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
async function findCompression(
  ticker,
  candles,
  bot,
  timeframe = "4h",
  candlesCount = 10,
  touchCount = 5,
  tolerance = 0.5,
  range = 5,
) {
  try {
    const { close } = candles[candles.length - 1];
    const { support, resistance } = Indicators.calculateLevels(
      candles.slice(-candlesCount),
      touchCount,
    );
    if (support && resistance) {
      const newSupport =
        !ticker["compression"]?.[`support${timeframe}`] ||
        Math.abs(ticker[`support${timeframe}`] - support) / support >=
          tolerance / 100;
      const newResistance =
        !ticker["compression"]?.[`resistance${timeframe}`] ||
        Math.abs(ticker[`resistance${timeframe}`] - resistance) / resistance >=
          tolerance / 100;
      const rangePercent = ((resistance - support) / support) * 100;
      if (
        rangePercent < range &&
        support <= close &&
        resistance >= close &&
        newSupport &&
        newResistance
      ) {
        return {
          msg: `📉 Compression ${rangePercent.toFixed(2)}% ${timeframe} ${close}$ [${candlesCount}, ${touchCount}, ${tolerance}]`,
          compression: {
            [`resistance${timeframe}`]: resistance,
            [`support${timeframe}`]: support,
          },
        };
      }
    }
    return null;
  } catch (error) {
    console.error(`Error check Levels:`, error.message);
    await sendMsgMe(bot, { msg: `Error in findLevels ${error.message}` });
  }
}
//find levels
export const findLevels = async (
  ticker,
  candles,
  bot,
  timeframe = "4h",
  candlesCount,
  touchCount = 4,
  tolerance = 1,
) => {
  try {
    //pump detect
    const { close } = candles[candles.length - 1];
    const { support, resistance } = Indicators.calculateLevels(
      candles,
      touchCount,
    );
    const { priceScale } = ticker;
    //const timestampSeconds = Math.round(Date.now() / 1000);
    //const silentMore30min =
    //  !updatedAt || timestampSeconds - updatedAt._seconds >= 60 * 30;
    //support zone
    if (Math.abs(support - close) / close <= tolerance / 100) {
      const newLevel =
        !ticker["levels"]?.[`levelPriceS${timeframe}`] ||
        Math.abs(ticker["levels"][`levelPriceS${timeframe}`] - support) /
          support >=
          tolerance / 100;
      if (newLevel) {
        return {
          msg: `📈 Support zone ${timeframe} ${support.toFixed(priceScale)}$ [${candlesCount}, ${touchCount}, ${tolerance}]`,
          levels: {
            [`levelPriceS${timeframe}`]: support,
          },
        };
      }
    }
    //resistance zone
    if (Math.abs(resistance - close) / close <= tolerance / 100) {
      const newLevel =
        !ticker["levels"]?.[`levelPriceR${timeframe}`] ||
        Math.abs(ticker["levels"][`levelPriceR${timeframe}`] - resistance) /
          resistance >=
          tolerance / 100;
      if (newLevel) {
        return {
          msg: `📉 Resistance zone ${timeframe} ${resistance.toFixed(priceScale)}$ [${candlesCount}, ${touchCount}, ${tolerance}]`,
          levels: {
            [`levelPriceR${timeframe}`]: resistance,
          },
        };
      }
    }
    return null;
  } catch (error) {
    console.error(`Error check Levels:`, error.message);
    await sendMsgMe(bot, { msg: `Error in findLevels ${error.message}` });
  }
};
