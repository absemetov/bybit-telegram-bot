//import { Markup } from "telegraf";
import Ticker from "../models/Ticker.js";
import Indicators from "../helpers/indicators.js";
import { bybitUsers } from "../helpers/bybitV5.js";
import { algoTrading } from "../helpers/levels.js";
import { sendMsgMe } from "../helpers/helpers.js";
import { findLevels } from "../helpers/checkPumpTickers.js";
//new algotrading and alerts
export const checkAlerts = async (bot) => {
  try {
    for (const user of ["main", "sub"]) {
      let direction = null;
      let lastVisible = null;
      do {
        const { tickers, hasNext, lastVisibleId } = await Ticker.paginate(
          100,
          direction,
          lastVisible,
          "trading",
          user,
        );
        const arrayNotify = [];
        for (const ticker of tickers) {
          try {
            const { symbol } = ticker;
            const {
              enterTf = "4h",
              candlesCount = 25,
              touchCount = 3,
            } = ticker[user] || {};
            const bybit = bybitUsers[user];
            const candles = await bybit.getCandles(
              symbol,
              enterTf,
              candlesCount,
            );
            if (candles.length < candlesCount) {
              continue;
            }
            const levels = Indicators.calculateLevels(candles, touchCount);
            const { close } = candles[candles.length - 1];
            await algoTrading(ticker, levels, close, bot, bybit, user);
            //alert if price near zone
            const priceLevel = await findLevels(
              ticker,
              candles,
              bot,
              enterTf,
              candlesCount,
              3,
              0.5,
            );
            //notify levels
            if (priceLevel) {
              arrayNotify.push({
                symbol,
                data: {
                  ...priceLevel,
                },
              });
              const { msg } = priceLevel;
              await sendMsgMe(bot, {
                header: `<code>${symbol.slice(0, -4)}</code> `,
                msg,
                footer: `${new Date().toLocaleString("ru-RU")} ${symbol}\n#${symbol.slice(0, -4)}_levels #${symbol} #levels`,
              });
            }
            //rate limits set pause 1sec!!!
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`Error AlgoTrading ${ticker.symbol}:`, error.message);
            await sendMsgMe(bot, {
              msg: `Error in AlgoTrading ${ticker.symbol} ${error.message}`,
            });
          }
        }
        //save batch
        await Ticker.saveLevelBatch(arrayNotify);
        direction = hasNext ? "next" : null;
        lastVisible = lastVisibleId;
      } while (direction);
    }
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error in cron job checkAlerts:`,
      error.message,
    );
    await sendMsgMe(bot, {
      msg: `Error in AlgoTrading ${error.message}`,
    });
  }
  //alerts
  //try {
  //  //const interval = "1min";
  //  const interval = "1min";
  //  const tickerNotifyArray = [];
  //  let direction = null;
  //  let lastVisibleId = null;
  //  //"alerts" or "all" "favorites"
  //  do {
  //    const paginate = await Ticker.paginate(
  //      100,
  //      direction,
  //      lastVisibleId,
  //      "alerts",
  //    );
  //    //edit delete ticker fields
  //    //await Ticker.changeFields(paginate.tickers);
  //    for (const ticker of paginate.tickers) {
  //      try {
  //        const {
  //          symbol,
  //          priceScale,
  //          lastNotified = null,
  //          alerts = {},
  //        } = ticker;
  //        const candlesArray = await bybitUsers["main"].getCandles(
  //          symbol,
  //          interval,
  //          10,
  //        );
  //        if (candlesArray.length === 0) {
  //          continue;
  //        }
  //        const { low, high } = candlesArray[candlesArray.length - 1];
  //        const timestampSeconds = Math.round(Date.now() / 1000);
  //        const silent10min =
  //          !lastNotified ||
  //          timestampSeconds - lastNotified._seconds >= 60 * 30;
  //        for (const [index, value] of Object.entries(alerts)) {
  //          if (low <= value && value <= high) {
  //            //trigger algo trade
  //            for (const user of ["main", "sub"]) {
  //              const { alertTrigger = false } = ticker[user] || {};
  //              if (alertTrigger) {
  //                await Ticker.update(symbol, {
  //                  [`${user}.attemptsCount`]: 3,
  //                  [`${user}.alertTrigger`]: false,
  //                });
  //                await sendMsgMe(bot, {
  //                  header: `<code>${symbol.slice(0, -4)}</code>`,
  //                  msg: `[${user}] alertTrigger "${index}" ${value.toFixed(priceScale)}$\nAlgoTrading attemptsCount = 3`,
  //                  footer: `#${symbol.slice(0, -4)} #${symbol.slice(0, -4)}_Trigger_Alert`,
  //                });
  //              }
  //            }
  //            if (silent10min) {
  //              await sendMsgMe(
  //                bot,
  //                {
  //                  header: `<code>${symbol.slice(0, -4)}</code>`,
  //                  msg: `[#ALERT ${index} cross ${value.toFixed(priceScale)}$]`,
  //                  footer: `#${symbol.slice(0, -4)} #${symbol}`,
  //                },
  //                Markup.inlineKeyboard([
  //                  [
  //                    Markup.button.url(
  //                      `${symbol} chart`,
  //                      `https://bybit.rzk.com.ru/chart/${symbol}`,
  //                    ),
  //                  ],
  //                ]),
  //              );
  //              tickerNotifyArray.push({
  //                symbol,
  //                data: {
  //                  lastNotified: new Date(),
  //                },
  //              });
  //            }
  //          }
  //        }
  //      } catch (error) {
  //        console.error(`Error checkAlerts ${ticker.symbol}:`, error.message);
  //        await sendMsgMe(bot, {
  //          msg: `Error in checkAlerts ${ticker.symbol} ${error.message}`,
  //        });
  //      }
  //      await new Promise((resolve) => setTimeout(resolve, 1100));
  //    }
  //    direction = paginate.hasNext ? "next" : null;
  //    lastVisibleId = paginate.lastVisibleId;
  //    await Ticker.saveLevelBatch(tickerNotifyArray);
  //  } while (direction);
  //} catch (error) {
  //  console.error(
  //    `[${new Date().toISOString()}] Error in cron job checkAlerts:`,
  //    error.message,
  //  );
  //  await sendMsgMe(bot, {
  //    msg: `Error in Check Alerts and Levels ${error.message}`,
  //  });
  //}
};
