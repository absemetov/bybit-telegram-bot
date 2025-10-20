import { Markup } from "telegraf";
import Ticker from "../models/Ticker.js";
import Indicators from "../helpers/indicators.js";
import { getCandles } from "../helpers/bybitV5.js";
import { algoTrading, checkPositions } from "../helpers/levels.js";
import { sendMsgMe } from "../helpers/helpers.js";
import { volumeUp } from "../helpers/checkPumpTickers.js";
//new algotrading and alerts
export const checkAlerts = async (bot) => {
  //algoTrading
  let direction = null;
  let lastVisible = null;
  //algotrading
  do {
    const { tickers, hasNext, lastVisibleId } = await Ticker.paginate(
      100,
      direction,
      lastVisible,
      "trading",
    );
    for (const ticker of tickers) {
      try {
        const {
          symbol,
          enterTf = "4h",
          candlesCount = 30,
          touchCount = 4,
          //tradingType = 1,
        } = ticker;
        const candles = await getCandles(symbol, enterTf, candlesCount);
        const levels = Indicators.calculateLevels(candles, touchCount);
        const { close } = candles[candles.length - 1];
        await checkPositions(ticker, close, bot, levels);
        await algoTrading(ticker, levels, close, bot, enterTf);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1second pause
      } catch (error) {
        console.error(`Error AlgoTrading ${ticker.symbol}:`, error.message);
        await sendMsgMe(
          bot,
          `Error in AlgoTrading ${ticker.symbol} ${error.message}`,
        );
      }
    }
    direction = hasNext ? "next" : null;
    lastVisible = lastVisibleId;
    // Пауза между пагинациями 1sec
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } while (direction);
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
              await sendMsgMe(
                bot,
                `<code>${symbol.slice(0, -4)}</code> <b>[#ALERT ${alertNames[index]} cross ${value.toFixed(priceScale)}$]</b>\n` +
                  `#${symbol.slice(0, -4)} #${symbol} /${symbol}`,
                Markup.inlineKeyboard([
                  [Markup.button.callback("🗑 Delete message", "delete/msg")],
                  [
                    Markup.button.url(
                      `${symbol} chart`,
                      `https://bybit.rzk.com.ru/chart/${symbol}/1h`,
                    ),
                  ],
                ]),
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
        //volumeUp
        const volume = await volumeUp(symbol);
        if (volume && silent10min) {
          tickerNotifyArray.push({
            symbol,
            data: {
              ...volume,
              lastNotified: new Date(),
              //alertIndex: index + 1,
            },
          });
          await sendMsgMe(
            bot,
            `<code>${symbol.slice(0, -4)}</code> <b>[${volume.msg}]</b>\n` +
              `#${symbol.slice(0, -4)} #${symbol} #volumeUp`,
            Markup.inlineKeyboard([
              [Markup.button.callback("🗑 Delete message", "delete/msg")],
              [
                Markup.button.url(
                  `${symbol} chart`,
                  `https://bybit.rzk.com.ru/chart/${symbol}/1h`,
                ),
              ],
            ]),
          );
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
    await sendMsgMe(bot, `Error in Check Alerts and Levels ${error.message}`);
  }
};
