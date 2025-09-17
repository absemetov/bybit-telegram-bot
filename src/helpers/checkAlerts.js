//import Scan from "../models/Scan.js";
import { Markup } from "telegraf";
import Ticker from "../models/Ticker.js";
import { getCandles } from "../helpers/bybitV5.js";

export const checkAlerts = async (bot) => {
  try {
    //const interval = "1min";
    const interval = "5min";
    const tickerNotifyArray = [];
    let direction = null;
    let lastVisibleId = null;
    //"alerts" or "all" "favorites"
    do {
      const paginate = await Ticker.paginate(
        50,
        direction,
        lastVisibleId,
        "alerts",
      );
      //edit delete ticker fields
      //await Ticker.changeFields(paginate.tickers);
      for (const ticker of paginate.tickers) {
        const { symbol, priceScale } = ticker;
        const candlesArray = await getCandles(symbol, interval, 10);
        if (candlesArray.length === 0) {
          continue;
        }
        const { low, high } = candlesArray[candlesArray.length - 1];
        //set tp sl default!!!
        //calc indicators
        const { lastNotified = null } = await Ticker.getAlertMessage(symbol);
        const timestampSeconds = Math.round(Date.now() / 1000);
        const silent10min =
          !lastNotified || timestampSeconds - lastNotified._seconds >= 60 * 30;
        //send Alerts
        const alerts = await Ticker.getOnlyAlerts(symbol);
        const alertNames = {
          0: "slBuy",
          1: "endBuy",
          2: "startBuy",
          3: "startSell",
          4: "endSell",
          5: "slSell",
        };
        //check alerts [0,5]
        for (const [index, value] of alerts.entries()) {
          if (low <= value && value <= high && index <= 5) {
            if (silent10min) {
              await bot.telegram.sendMessage(
                "94899148",
                `<code>${symbol.slice(0, -4)}</code> <b>[#ALERT ${alertNames[index]} cross ${value.toFixed(priceScale)}$]</b>\n` +
                  `#${symbol.slice(0, -4)} #${symbol} /${symbol}`,
                {
                  parse_mode: "HTML",
                  ...Markup.inlineKeyboard([
                    [Markup.button.callback("🗑 Delete message", "delete/msg")],
                    [
                      Markup.button.url(
                        `${symbol} chart`,
                        `https://bybit.rzk.com.ru/chart/${symbol}/1h`,
                      ),
                    ],
                  ]),
                },
              );
              tickerNotifyArray.push({
                symbol,
                data: {
                  lastNotified: new Date(),
                  //alertIndex: index + 1,
                },
              });
            }
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      direction = paginate.hasNext ? "next" : null;
      lastVisibleId = paginate.lastVisibleId;
      //save batch
      await Ticker.sendNotifyAlert(tickerNotifyArray);
    } while (direction);
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error in cron job checkAlerts:`,
      error.message,
    );
    await bot.telegram.sendMessage(
      94899148,
      `Error in Check Alerts and Levels ${error.message}`,
      {
        parse_mode: "HTML",
      },
    );
  }
};
