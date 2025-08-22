//import Scan from "../models/Scan.js";
import { Markup } from "telegraf";
import Ticker from "../models/Ticker.js";
import { getCandles, convertCandles } from "../helpers/bybitV5.js";
import {
  checkPositions,
  createLongOrder,
  createShortOrder,
} from "../helpers/levels.js";
import Indicators from "../helpers/indicators.js";

export const checkAlerts = async (bot) => {
  try {
    //const interval = "1min";
    const interval = "15min";
    const tickerNotifyArray = [];
    let direction = null;
    let lastVisibleId = null;
    //"alerts" or "all" "favorites"
    do {
      const paginate = await Ticker.paginate(
        50,
        direction,
        lastVisibleId,
        "all",
      );
      for (const ticker of paginate.tickers) {
        const { symbol, alert, priceScale, trading, openLong } = ticker;
        const candlesArray = await getCandles(symbol, interval, 600);
        const { close, low, high } = candlesArray[candlesArray.length - 1];
        //calc indicators
        const arrayNotify = [];
        const { lastNotified = null } = await Ticker.getAlertMessage(symbol);
        const timestampSeconds = Math.round(Date.now() / 1000);
        const silent10min =
          !lastNotified || timestampSeconds - lastNotified._seconds >= 60 * 30;
        //scan 1h timeframe array
        const candles = convertCandles(candlesArray, "1h");
        //const candles30min = convertCandles(candlesArray, "30min");
        //const rsiData = Indicators.calculateRSI(candles);
        //const currentRsi = rsiData[rsiData.length - 1].value;
        const { support, resistance, rangePercent } =
          Indicators.calculateLevels(candles.slice(-12), 4);
        const supportZone =
          Math.abs((close - support) / support) * 100 <= rangePercent;
        const resistanceZone =
          Math.abs((close - resistance) / resistance) * 100 < rangePercent;
        //algo trading TODO
        if (trading) {
          //create LONG  order see 1D support zone!!!
          if (supportZone && openLong) {
            await createLongOrder(symbol, close * (1 - 0.1 / 100), bot);
          }
          //create SHORT order disabled!
          if (resistanceZone && !openLong) {
            //await createShortOrder(symbol, close * (1 + 0.1 / 100), bot);
          }
        }
        //set default SL and TP
        await checkPositions(ticker, close, bot, support, resistance);
        //send Alerts
        if (alert) {
          if (supportZone && silent10min) {
            arrayNotify.push({
              tf: `#Support zone 1h ${support.toFixed(priceScale)}$`,
            });
            tickerNotifyArray.push({
              symbol,
              data: {
                lastNotified: new Date(),
              },
            });
          }
          //resistance
          if (resistanceZone) {
            arrayNotify.push({
              tf: `#Resistance Zone 1h ${resistance.toFixed(priceScale)}$`,
            });
            tickerNotifyArray.push({
              symbol,
              data: {
                lastNotified: new Date(),
              },
            });
          }
          //todo check RSI[5,6]
          const alerts = await Ticker.getOnlyAlerts(symbol);
          //for (const [index, value] of alerts.alerts.entries()) {
          //  //index > 5 disable
          //  if (index > 7) {
          //    if ((Math.abs(value - currentRsi) / currentRsi) * 100 < 0.2) {
          //      if (silent10min) {
          //        arrayNotify.push({
          //          tf: `#RSI ALERT ${index + 1} 1h cross ${value.toFixed(2)}%`,
          //        });
          //        tickerNotifyArray.push({
          //          symbol,
          //          data: {
          //            lastNotified: new Date(),
          //            alertIndex: index + 1,
          //          },
          //        });
          //      }
          //    }
          //  }
          //}
          //check alerts [0,5]
          for (const [index, value] of alerts.alerts.entries()) {
            if (low <= value && value <= high && index <= 5) {
              if (silent10min) {
                arrayNotify.push({
                  tf: `#PRICE ALERT #${index + 1} cross ${value.toFixed(priceScale)}$`,
                });
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
        }
        //send msg
        if (arrayNotify.length > 0 && silent10min) {
          //telegram bybit channel -1002687531775 absemetov 94899148
          const info = arrayNotify.map((obj) => Object.values(obj)).join();
          await bot.telegram.sendMessage(
            "94899148",
            `<code>${symbol.slice(0, -4)}</code> <b>[${info}]</b>\n` +
              `#${symbol.slice(0, -4)} #${symbol} /${symbol}`,
            {
              parse_mode: "HTML",
              ...Markup.inlineKeyboard([
                [Markup.button.callback(`🗑 Delete message`, "delete/msg")],
                [
                  Markup.button.url(
                    `${symbol} chart`,
                    `https://bybit.rzk.com.ru/chart/${symbol}/1h`,
                  ),
                ],
              ]),
            },
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      direction = paginate.hasNext ? "next" : null;
      lastVisibleId = paginate.lastVisibleId;
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
