//import { Markup } from "telegraf";
import { bybitKline, bybitTickersChunks } from "../helpers/bybitV5.js";
import { volumePattern } from "../helpers/candlesPatterns.js";
import Scan from "../models/Scan.js";
import { db } from "../firebase.js";

export const analyticCoinCandles = async (bot, interval, limit = 10) => {
  try {
    // TODO write batch!!!
    const batch = db.batch();
    // load config
    const scanInterval = await Scan.find(interval);
    const volumePcnt = scanInterval.volumePcnt;
    const candlesCount = 5;
    // load coins data 425 tickers 30.10.2024
    const { chunksArray, tickersLength } = await bybitTickersChunks();
    const { chunkNumber } = scanInterval;
    const tickers = chunksArray[chunkNumber];
    // analytics check coins
    let limitCoins = limit;
    let countPumpTickers = 0;
    for (const ticker of tickers) {
      const { symbol, lastPrice } = ticker;
      if (limitCoins === 0) {
        break;
        //return `Limit coins is ${limit}!`;
      }
      // get kline data
      const kline = await bybitKline(symbol, interval, candlesCount);
      // Analyse candles data!!! Main pattern
      const patternArray = [];
      const candlesArray = [];
      // 0 candle not use it not close
      let breakCoin = false;
      for (let i = 0; i < candlesCount; i += 1) {
        const candle = kline[i];
        if (candle) {
          candlesArray.push({
            openPrice: +candle[1],
            highPrice: +candle[2],
            lowPrice: +candle[3],
            closePrice: +candle[4],
            volume: +candle[5],
            color: candle[1] < candle[4] ? "green" : "red",
            barChange: ((candle[4] - candle[1]) / candle[1]) * 100,
          });
        } else {
          breakCoin = true;
          // throw new Error(
          //   `Some candle from 5 not found! ${symbol} interval ${interval}`,
          // );
        }
      }
      if (breakCoin) {
        break;
      }
      // check patterns
      //================================
      const volumeUp = volumePattern(candlesArray, volumePcnt);
      if (volumeUp) patternArray.push({ id: 1, volumeUp });
      if (patternArray.length) {
        ++countPumpTickers;
        // write to Firestore
        const objTicker = {
          updatedAt: new Date(),
          lastPrice: +lastPrice,
        };
        // set paatern data
        for (const pattern of patternArray) {
          if (pattern.id === 1) objTicker.volumeUp = pattern.volumeUp;
        }
        const tickerRef = db.doc(`tickers-scan/${interval}/tickers/${symbol}`);
        batch.set(tickerRef, objTicker);
        --limitCoins;
      }
    }
    // Commit the batch
    await batch.commit();
    // update chunkNumber
    if (scanInterval.chunkNumber === 8) {
      scanInterval.chunkNumber = 0;
    } else {
      ++scanInterval.chunkNumber;
    }
    await scanInterval.update();
    //notify user
    // && interval !== "15min"
    // if (chunkNumber === 8 && interval !== "15min") {
    //   const inlineKeyboard = Markup.inlineKeyboard([
    //     [
    //       Markup.button.url(
    //         `Bybit.rzk.com.ru: ${interval}`,
    //         `https://bybit.rzk.com.ru/${interval}`,
    //       ),
    //     ],
    //   ]);
    //   await bot.telegram.sendMessage(
    //     94899148,
    //     `Scan 9 chunks from ${tickersLength} tickers. Interval ${interval}. Lets be billionare!!!`,
    //     {
    //       parse_mode: "HTML",
    //       ...inlineKeyboard,
    //     },
    //   );
    // }
    return { tickersLength, countPumpTickers, chunkNumber };
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
