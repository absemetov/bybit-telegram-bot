//import { Markup } from "telegraf";
import { bybitKline } from "../helpers/bybitV5.js";
import { volumePattern } from "../helpers/candlesPatterns.js";
import Scan from "../models/Scan.js";
import Ticker from "../models/Ticker.js";
import Alert from "../models/Alert.js";
import { db } from "../firebase.js";

export const analyticCoinCandles = async (bot, interval) => {
  try {
    // TODO write batch!!!
    const pumpAlerts = [];
    // load config
    const scanPaginateSettings = await Scan.paginateData(1);
    const { direction, lastVisibleId } = scanPaginateSettings;
    // get new tickers use paginate!!!
    const paginate = await Ticker.paginate(50, direction, lastVisibleId);
    // const scanInterval = await Scan.find(interval);
    // const { chunkNumber, maxChunks } = scanInterval;
    const candlesCount = 5;
    // get new tickers
    // const tickers = await Ticker.chunk(chunkNumber);
    let countPumpTickers = 0;
    for (const ticker of paginate.tickers) {
      const { symbol, volumePcnt } = ticker;
      // get kline data
      const candlesArray = await bybitKline(symbol, interval, candlesCount);
      // Analyse candles data!!! Main pattern
      const patternArray = [];
      const volumeUpresult = volumePattern(candlesArray, volumePcnt);
      if (volumeUpresult.length > 0) {
        patternArray.push({
          id: 1,
          volumeUp: volumeUpresult[0],
          volumeCandleStartTime: volumeUpresult[1],
        });
      }
      if (patternArray.length) {
        ++countPumpTickers;
        const alertData = {
          symbol,
          interval,
          createdAt: new Date(),
          lastPrice: +candlesArray[0]?.closePrice,
        };
        // set patern data
        for (const pattern of patternArray) {
          if (pattern.id === 1) {
            alertData.volumeUp = pattern.volumeUp;
            alertData.volumeCandleStartTime = pattern.volumeCandleStartTime;
          }
        }
        const alertRef = db.doc(
          `crypto/${symbol}/pump-alerts/${symbol}-${interval}`,
        );
        pumpAlerts.push({ alertRef, alertData });
      }
    }
    //save Alert batch
    await Alert.setBatch(pumpAlerts);
    //update paginate settings
    if (paginate.hasNext) {
      scanPaginateSettings.direction = "next";
      scanPaginateSettings.lastVisibleId = paginate.lastVisibleId;
    } else {
      scanPaginateSettings.direction = null;
      scanPaginateSettings.lastVisibleId = null;
    }
    await scanPaginateSettings.update();
    return { countPumpTickers };
  } catch (error) {
    await bot.telegram.sendMessage(
      94899148,
      `Error fetching coins ${error.message}`,
      {
        parse_mode: "HTML",
      },
    );
    console.log(error);
    throw new Error(`Error fetching coins ${error.message}`);
  }
};

export const checkAlerts = async (bot, interval) => {
  try {
    // TODO write batch!!!
    const updateTickerNotify = [];
    // load config
    const scanPaginateSettings = await Scan.paginateData(2);
    const { direction, lastVisibleId } = scanPaginateSettings;
    console.log(direction, lastVisibleId);
    // get new tickers use paginate!!!
    const paginate = await Ticker.paginate(50, direction, lastVisibleId);
    for (const ticker of paginate.tickers) {
      const { symbol, alert1, alert2, lastNotified, price24h } = ticker;
      // get kline data
      const candlesArray = await bybitKline(symbol, interval, 2);
      //check pre last candle
      if (candlesArray.length > 1) {
        const { closePrice, openPrice, barChange, highPrice, lowPrice } =
          candlesArray[0];
        const updateTickerData = {
          symbol,
          data: {
            lastPrice: closePrice,
            price24hPcnt: ((closePrice - price24h) / price24h) * 100,
          },
        };
        if (interval === "1d") {
          updateTickerData.data.price24h = openPrice;
          updateTickerData.data.price24hPcnt = barChange;
        } else {
          if (
            !lastNotified ||
            Date.now() - lastNotified.toMillis() >= 10 * 60000
          ) {
            if (lowPrice <= alert1 && alert1 <= highPrice) {
              updateTickerData.data.alertMessage = `Price cross Top ${alert1}$`;
              updateTickerData.data.lastNotified = new Date();
            }
            if (lowPrice <= alert2 && alert2 <= highPrice) {
              updateTickerData.data.alertMessage = `Price cross Bottom ${alert2}$`;
              updateTickerData.data.lastNotified = new Date();
            }
          }
        }
        updateTickerNotify.push(updateTickerData);
      }
    }
    //notify user
    await Ticker.sendNotify(updateTickerNotify);
    // update chunkNumber
    //TODO use paginate params
    if (paginate.hasNext) {
      scanPaginateSettings.direction = "next";
      scanPaginateSettings.lastVisibleId = paginate.lastVisibleId;
    } else {
      scanPaginateSettings.direction = null;
      scanPaginateSettings.lastVisibleId = null;
    }
    await scanPaginateSettings.update();
  } catch (error) {
    await bot.telegram.sendMessage(
      94899148,
      `Error fetching coins ${error.message}`,
      {
        parse_mode: "HTML",
      },
    );
    console.log(error);
    throw new Error(`Error fetching coins ${error.message}`);
  }
};
