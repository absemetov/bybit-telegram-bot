import { Markup } from "telegraf";
import Ticker from "../models/Ticker.js";
import Indicators from "../helpers/indicators.js";
import { getCandles } from "../helpers/bybitV5.js";
import { algoTrading, checkPositions } from "../helpers/levels.js";
import { sendMsgMe } from "../helpers/helpers.js";
//import { volumeUp } from "../helpers/checkPumpTickers.js";
//new algotrading and alerts
export const checkAlerts = async (bot) => {
  //algoTrading
  try {
    //scalp and swing accounts
    for (const user of ["main", "sub"]) {
      let direction = null;
      let lastVisible = null;
      //algotrading
      do {
        const { tickers, hasNext, lastVisibleId } = await Ticker.paginate(
          100,
          direction,
          lastVisible,
          "trading",
          user,
        );
        for (const ticker of tickers) {
          try {
            const { symbol } = ticker;
            const {
              candlesCount = 25,
              touchCount = 3,
              tradingType = 0,
              tradingTypeShort = 0,
              attemptsCount = 0,
            } = ticker[user] || {};
            //long side
            if (tradingType !== "off") {
              const candles = await getCandles(
                symbol,
                tradingType,
                candlesCount,
              );
              if (candles.length < candlesCount) {
                continue;
              }
              const levels = Indicators.calculateLevels(candles, touchCount);
              const { close } = candles[candles.length - 1];
              await checkPositions(
                ticker,
                close,
                bot,
                levels,
                user,
                tradingType,
              );
              if (attemptsCount > 0) {
                await algoTrading(
                  ticker,
                  levels,
                  close,
                  bot,
                  user,
                  tradingType,
                  "Buy",
                  attemptsCount,
                );
              }
            }
            //short side
            if (tradingTypeShort !== "off") {
              const candles = await getCandles(
                symbol,
                tradingTypeShort,
                candlesCount,
              );
              if (candles.length < candlesCount) {
                continue;
              }
              const levels = Indicators.calculateLevels(candles, touchCount);
              const { close } = candles[candles.length - 1];
              //const minTouches = candles
              //  .slice(-4)
              //  .filter(
              //    (candle) => close >= candle.low && close <= candle.high,
              //  ).length;
              await checkPositions(
                ticker,
                close,
                bot,
                levels,
                user,
                tradingTypeShort,
              );
              if (attemptsCount > 0) {
                await algoTrading(
                  ticker,
                  levels,
                  close,
                  bot,
                  user,
                  tradingTypeShort,
                  "Sell",
                  attemptsCount,
                );
              }
            }
            await new Promise((resolve) => setTimeout(resolve, 100)); // 0.5 second pause
          } catch (error) {
            console.error(`Error AlgoTrading ${ticker.symbol}:`, error.message);
            await sendMsgMe(bot, {
              msg: `Error in AlgoTrading ${ticker.symbol} ${error.message}`,
            });
          }
        }
        direction = hasNext ? "next" : null;
        lastVisible = lastVisibleId;
        // Пауза между пагинациями 1sec
        await new Promise((resolve) => setTimeout(resolve, 1000));
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
  try {
    //const interval = "1min";
    const interval = "1min";
    const tickerNotifyArray = [];
    let direction = null;
    let lastVisibleId = null;
    //"alerts" or "all" "favorites"
    do {
      const paginate = await Ticker.paginate(
        100,
        direction,
        lastVisibleId,
        "alerts",
      );
      //edit delete ticker fields
      //await Ticker.changeFields(paginate.tickers);
      for (const ticker of paginate.tickers) {
        const { symbol, priceScale, lastNotified = null, alerts = {} } = ticker;
        const candlesArray = await getCandles(symbol, interval, 10);
        if (candlesArray.length === 0) {
          continue;
        }
        const { low, high } = candlesArray[candlesArray.length - 1];
        //set tp sl default!!!
        //calc indicators
        //const { lastNotified = null } = await Ticker.getAlertMessage(symbol);
        const timestampSeconds = Math.round(Date.now() / 1000);
        const silent10min =
          !lastNotified || timestampSeconds - lastNotified._seconds >= 60 * 30;
        //get Alerts
        //const alerts = await Ticker.getOnlyAlerts(symbol);
        for (const [index, value] of Object.entries(alerts)) {
          if (low <= value && value <= high) {
            //trigger algo trade
            for (const user of ["main", "sub"]) {
              const { alertTrigger = false } = ticker[user] || {};
              if (alertTrigger) {
                await Ticker.update(symbol, {
                  [`${user}.attemptsCount`]: 3,
                  [`${user}.alertTrigger`]: false,
                });
                await sendMsgMe(bot, {
                  header: `<code>${symbol.slice(0, -4)}</code>`,
                  msg: `[${user}] alertTrigger "${index}" ${value.toFixed(priceScale)}$\nAlgoTrading attemptsCount = 3`,
                  footer: `#${symbol.slice(0, -4)} #${symbol.slice(0, -4)}_Trigger_Alert`,
                });
              }
            }
            if (silent10min) {
              await sendMsgMe(
                bot,
                {
                  header: `<code>${symbol.slice(0, -4)}</code>`,
                  msg: `[#ALERT ${index} cross ${value.toFixed(priceScale)}$]`,
                  footer: `#${symbol.slice(0, -4)} #${symbol} /${symbol}`,
                },
                Markup.inlineKeyboard([
                  //[Markup.button.callback("🗑 Delete message", "delete/msg")],
                  [
                    Markup.button.url(
                      `${symbol} chart`,
                      `https://bybit.rzk.com.ru/chart/${symbol}`,
                    ),
                  ],
                ]),
              );
              tickerNotifyArray.push({
                symbol,
                data: {
                  lastNotified: new Date(),
                },
              });
            }
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      direction = paginate.hasNext ? "next" : null;
      lastVisibleId = paginate.lastVisibleId;
      //save batch
      //await Ticker.sendNotifyAlert(tickerNotifyArray);
      await Ticker.saveLevelBatch(tickerNotifyArray);
    } while (direction);
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error in cron job checkAlerts:`,
      error.message,
    );
    await sendMsgMe(bot, {
      msg: `Error in Check Alerts and Levels ${error.message}`,
    });
  }
};
