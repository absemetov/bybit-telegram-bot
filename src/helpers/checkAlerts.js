import Scan from "../models/Scan.js";
import Ticker from "../models/Ticker.js";

import { bybitKline } from "../helpers/bybitV5.js";
import { formatNumber } from "../helpers/functions.js";

export const checkAlerts = async (bot, interval) => {
  const start = Date.now();
  // TODO write batch!!!
  const updateTickerNotify = [];
  // load config
  const scanPaginateSettings = await Scan.paginateData(2);
  const { direction, lastVisibleId } = scanPaginateSettings;
  // get new tickers use paginate!!!
  const paginate = await Ticker.paginateAlerts(50, direction, lastVisibleId);
  for (const tickerAlerts of paginate.tickers) {
    const { symbol, alerts } = tickerAlerts;
    const ticker = await Ticker.find(symbol);
    const { lastNotified, price24h } = ticker;
    // get kline data
    const candlesArray = await bybitKline(symbol, interval, 2);
    //check pre last candle
    if (candlesArray.length > 1) {
      const { open, close } = candlesArray[0];
      const { high, low } = candlesArray[1];
      const updateTickerData = {
        symbol,
        data: {
          lastPrice: close,
          price24hPcnt: ((close - price24h) / price24h) * 100,
        },
      };
      if (interval === "1d") {
        updateTickerData.data.price24h = open;
        updateTickerData.data.price24hPcnt = ((close - open) / open) * 100;
      } else {
        //silent 10min
        if (
          !lastNotified ||
          Date.now() - lastNotified.toMillis() >= 10 * 60000
        ) {
          for (const value of alerts) {
            if (low <= value && value <= high) {
              updateTickerData.data.alertMessage = `${formatNumber(value)}$ cross price`;
              updateTickerData.data.lastNotified = new Date();
            }
          }
        }
      }
      updateTickerNotify.push(updateTickerData);
    }
  }
  //notify user
  await Ticker.sendNotify(updateTickerNotify);
  //TODO use paginate params
  if (paginate.hasNext) {
    scanPaginateSettings.direction = "next";
    scanPaginateSettings.lastVisibleId = paginate.lastVisibleId;
  } else {
    scanPaginateSettings.direction = null;
    scanPaginateSettings.lastVisibleId = null;
  }
  await scanPaginateSettings.update();

  const end = Date.now();
  return `${scanPaginateSettings.lastVisibleId} ${Date(start)} -${Date(end)} time: ${(end - start) / 1000} sec`;
};
