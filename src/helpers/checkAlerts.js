import Ticker from "../models/Ticker.js";
import { bybitUsers } from "../helpers/bybitV5.js";
import { algoTrading } from "../helpers/levels.js";
import { sendMsgMe } from "../helpers/helpers.js";
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
            const { symbol, priceScale } = ticker;
            const alerts = ticker[`${user}Alerts`] || {};
            const lastNotified = ticker[`${user}LastNotified`] || null;
            const { attemptsCount = 0, tolerance = 0.5 } = ticker[user] || {};
            const bybit = bybitUsers[user];
            const candles = await bybit.getCandles(symbol, "5min", 1);
            if (candles.length === 0) {
              continue;
            }
            const { close } = candles[candles.length - 1];
            const alertsArray = Object.entries(alerts);
            //find cross
            const longAlert = alertsArray.find((alert) => {
              return (
                ["1", "3", "5"].includes(alert[0]) &&
                Math.abs(alert[1] - close) / close <= tolerance / 100
              );
            });
            const shortAlert = alertsArray.find((alert) => {
              return (
                ["2", "4", "6"].includes(alert[0]) &&
                Math.abs(alert[1] - close) / close <= tolerance / 100
              );
            });
            //if attempts = 6 only alerts
            if (attemptsCount <= 5) {
              await algoTrading(
                ticker,
                close,
                bot,
                bybit,
                user,
                longAlert,
                shortAlert,
                attemptsCount,
              );
            }
            //alert if price near zone
            if (attemptsCount === 6) {
              const timestampSeconds = Math.round(Date.now() / 1000);
              const silent10min =
                !lastNotified ||
                timestampSeconds - lastNotified._seconds >= 600;
              if (longAlert && silent10min) {
                await sendMsgMe(bot, {
                  header: `🔔[${user}] <code>${symbol.slice(0, -4)}</code>`,
                  msg: `Alert #${longAlert[0]} cross price ${longAlert[1].toFixed(priceScale)}$, Tolerance: ${tolerance}%`,
                  footer: `#${symbol.slice(0, -4)}_alert`,
                });
                arrayNotify.push({
                  symbol,
                  data: {
                    [`${user}LastNotified`]: new Date(),
                  },
                });
              }
              if (shortAlert && silent10min) {
                await sendMsgMe(bot, {
                  header: `🔔[${user}] <code>${symbol.slice(0, -4)}</code>`,
                  msg: `Alert #${shortAlert[0]} cross price ${shortAlert[1].toFixed(priceScale)}$, Tolerance: ${tolerance}$`,
                  footer: `#${symbol.slice(0, -4)}_alert`,
                });
                arrayNotify.push({
                  symbol,
                  data: {
                    [`${user}LastNotified`]: new Date(),
                  },
                });
              }
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
        await Ticker.saveBatch(arrayNotify);
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
};
