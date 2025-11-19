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
        //const candlesCount = 20;
        for (const ticker of tickers) {
          const { symbol, candlesCount = 20 } = ticker;
          for (const tf of ["4h", "6h", "12h", "1d"]) {
            const candles = await getCandles(symbol, tf, candlesCount);
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
              1,
            );
            const shortLevels = await findLevels(
              ticker,
              candles.slice(-2),
              bot,
              tf,
              2,
              2,
              1,
            );
            //const rsi = await getRsi(ticker, bot, tf);
            if (levels && shortLevels) {
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
            //pause 1 seconds
            await new Promise((resolve) => setTimeout(resolve, 2000));
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
            const candles = await getCandles(symbol, tf, candlesCount);
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
function findPumpVolumes(
  ticker,
  candles,
  multiplier = 2.5,
  timeframe = "15min",
) {
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
      !ticker[`volumeRatio${timeframe}`] ||
      Math.abs(ticker[`volumeRatio${timeframe}`] - volumeRatio) / volumeRatio >=
        2 / 100;
    if (isSpike && newVolume) {
      return {
        msg: `📊 Volume Up x${volumeRatio.toFixed(1)} ${timeframe} Price ${close}$`,
        [`volumeRatio${timeframe}`]: volumeRatio,
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
async function findCompression(
  ticker,
  bot,
  candles,
  timeframe = "4h",
  candlesCount = 10,
  touchCount = 5,
  tolerance = 1,
) {
  try {
    const { close } = candles[candles.length - 1];
    const { support, resistance } = Indicators.calculateLevels(
      candles.slice(-candlesCount),
      touchCount,
    );
    if (support && resistance) {
      const newSupport =
        !ticker[`compPriceS${timeframe}`] ||
        Math.abs(ticker[`compPriceS${timeframe}`] - support) / support >=
          tolerance / 100;
      const newResistance =
        !ticker[`compPriceR${timeframe}`] ||
        Math.abs(ticker[`compPriceR${timeframe}`] - resistance) / resistance >=
          tolerance / 100;
      const rangePercent = ((resistance - support) / support) * 100;
      if (
        rangePercent < 2 &&
        support <= close &&
        resistance >= close &&
        newSupport &&
        newResistance
      ) {
        return {
          msg: `📉 Compression ${rangePercent.toFixed(2)}% ${timeframe} ${close}$ [${candlesCount}, ${touchCount}, ${tolerance}]`,
          [`compPriceR${timeframe}`]: resistance,
          [`compPriceS${timeframe}`]: support,
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
async function findLevels(
  ticker,
  candles,
  bot,
  timeframe = "4h",
  candlesCount,
  touchCount = 4,
  tolerance = 1,
) {
  try {
    //pump detect
    const { close } = candles[candles.length - 1];
    const { support, resistance } = Indicators.calculateLevels(
      candles,
      touchCount,
    );
    //support zone
    if (Math.abs(support - close) / close <= tolerance / 100) {
      const newLevel =
        !ticker[`levelPriceS${timeframe}`] ||
        Math.abs(ticker[`levelPriceS${timeframe}`] - support) / support >=
          tolerance / 100;
      if (newLevel) {
        return {
          msg: `📈 Support ${timeframe} ${close}$ [${candlesCount}, ${touchCount}, ${tolerance}]`,
          [`levelPriceS${timeframe}`]: support,
        };
      }
    }
    //resistance zone
    if (Math.abs(resistance - close) / close <= tolerance / 100) {
      const newLevel =
        !ticker[`levelPriceR${timeframe}`] ||
        Math.abs(ticker[`levelPriceR${timeframe}`] - resistance) / resistance >=
          tolerance / 100;
      if (newLevel) {
        return {
          msg: `📉 Resistance ${timeframe} ${close}$ [${candlesCount}, ${touchCount}, ${tolerance}]`,
          [`levelPriceR${timeframe}`]: resistance,
        };
      }
    }
    return null;
  } catch (error) {
    console.error(`Error check Levels:`, error.message);
    await sendMsgMe(bot, { msg: `Error in findLevels ${error.message}` });
  }
}
