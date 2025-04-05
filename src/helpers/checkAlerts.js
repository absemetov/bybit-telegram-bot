//import Scan from "../models/Scan.js";
import Ticker from "../models/Ticker.js";
import { getCandles } from "../helpers/bybitV5.js";

export const checkAlerts = async (bot) => {
  try {
    const interval = "1min";
    //const start = Date.now();
    // TODO write batch!!!
    const tickerNotifyArray = [];
    // load config for paginate
    //const scanPaginateSettings = await Scan.paginateData(1);
    //const { direction, lastVisibleId } = scanPaginateSettings;
    let direction = null;
    let lastVisibleId = null;
    do {
      const paginate = await Ticker.paginate(
        50,
        direction,
        lastVisibleId,
        "alerts",
      );
      for (const tickerAlerts of paginate.tickers) {
        const { symbol } = tickerAlerts;
        const alerts = await Ticker.getAlerts(symbol);
        //reverse!!! old->new
        const candlesArray = await getCandles(symbol, interval, 2);
        //check pre last candle
        if (candlesArray.length > 1) {
          const { high, low, localTime } = candlesArray[0];
          for (const [index, value] of alerts.alerts.entries()) {
            if (low <= value && value <= high) {
              tickerNotifyArray.push({
                symbol,
                data: {
                  alertMessage: `#${index + 1} Alert cross at ${value.toFixed(5)}$ ${localTime} 1min candle`,
                  lastNotified: new Date(),
                },
              });
            }
          }
        }
      }
      direction = paginate.hasNext ? "next" : null;
      lastVisibleId = paginate.lastVisibleId;
      //notify user
      await Ticker.sendNotifyAlert(tickerNotifyArray);
      // Пауза между пагинациями 1sec
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } while (direction);
    //TODO use paginate params
    // if (paginate.hasNext) {
    //   scanPaginateSettings.direction = "next";
    //   scanPaginateSettings.lastVisibleId = paginate.lastVisibleId;
    // } else {
    //   scanPaginateSettings.direction = null;
    //   scanPaginateSettings.lastVisibleId = null;
    // }
    // await scanPaginateSettings.update();
    //const end = Date.now();
    // console.log(
    //   `Scan alert tickers ${Date(end)} time: ${(end - start) / 1000} sec`,
    // );
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error in cron job checkAlerts:`,
      error.message,
    );
    await bot.telegram.sendMessage(
      94899148,
      `Error in Dev bot ${error.message}`,
      {
        parse_mode: "HTML",
      },
    );
  }
};
