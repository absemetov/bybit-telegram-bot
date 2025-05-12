/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const { onRequest } = require("firebase-functions/v2/https");
//const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
const { Telegraf, Markup } = require("telegraf");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

exports.updatePumpCrypto = onDocumentWritten(
  {
    document: "crypto-pump/{symbol}",
    region: "europe-central2",
    //maxInstances: 5,
  },
  async (event) => {
    try {
      const { symbol } = event.params;
      const ticker = event.data.after.exists ? event.data.after.data() : null;
      if (ticker) {
        //const previousMessageData = event.data.before.data();
        const timestampSeconds = Math.round(Date.now() / 1000);
        const silent15min =
          !ticker.lastNotified ||
          timestampSeconds - ticker.lastNotified >= 15 * 60;
        const currentPrice = ticker[`price`];
        let nearCount = 0;
        for (const timeframe of ["15min", "30min", "1h", "2h", "4h"]) {
          for (const side of ["S", "R"]) {
            const price = ticker[`price_pattern${side}_${timeframe}`];
            const difference = Math.abs(currentPrice - price);
            const isNear = difference <= currentPrice * 0.01;
            if (isNear) nearCount++; // Увеличиваем счетчик
          }
        }
        //levels near
        if (nearCount >= 3 && silent15min) {
          // Then return a promise of a set operation to update the count
          //chanel 🎯 Bybit S/R Zone Futures Signals
          await bot.telegram.sendMessage(
            "-1002640533584",
            `<b>🚨 ${symbol.slice(0, -4)} Approaching Key Zone 🚨</b>\n` +
              `Stay Alert for Potential Volatility!\n` +
              `${symbol.slice(0, -4)} Price: ${ticker["price"]}$\n` +
              `#${symbol.slice(0, -4)}`,
            {
              parse_mode: "HTML",
              ...Markup.inlineKeyboard([
                [
                  Markup.button.url(
                    `Public site ${symbol}`,
                    `https://bybit-telegram-bot.pages.dev/${symbol}/1h?price=${ticker["price"]}&time=${timestampSeconds}`,
                  ),
                ],
                [
                  Markup.button.url(
                    `Terminal ${symbol}`,
                    `https://bybit.rzk.com.ru/chart/${symbol}/1h?price=${ticker["price"]}&time=${timestampSeconds}`,
                  ),
                ],
              ]),
            },
          );
          //@absemetov
          // await bot.telegram.sendMessage(
          //   94899148,
          //   `<b>${symbol.slice(0, -4)} #pattern${level} ${ticker["price"]}$, countCross ${countCross} 10min interval confirmed!</b> #${symbol.slice(0, -4)}\n/${symbol}`,
          //   {
          //     parse_mode: "HTML",
          //     ...Markup.inlineKeyboard([
          //       [
          //         Markup.button.url(
          //           symbol,
          //           `https://bybit.rzk.com.ru/chart/${symbol}/1h`,
          //         ),
          //       ],
          //       [
          //         Markup.button.url(
          //           `📈 Tradingview chart: ${symbol}`,
          //           `https://www.tradingview.com/chart/8qtrvOgg/?symbol=BYBIT:${symbol}.P&interval=D`,
          //         ),
          //       ],
          //       [
          //         Markup.button.url(
          //           `📈 Coinglass chart: ${symbol}`,
          //           `https://www.coinglass.com/tv/ru/Bybit_${symbol}`,
          //         ),
          //       ],
          //       [
          //         Markup.button.url(
          //           `📟 Bybit: ${symbol}`,
          //           `https://bybit.onelink.me/EhY6?af_web_dp=https://www.bybit.com/trade/usdt/${symbol}&af_xp=custom&pid=tradegpt&c=tele_share&af_dp=bybitapp://open/home?tab=2&symbol=${symbol}&page=chart&type=usdt&&source=GPT&orderType=Limit&af_force_deeplink=true`,
          //         ),
          //       ],
          //       [Markup.button.callback(`🗑 Delete message`, "delete/msg")],
          //     ]),
          //   },
          // );
          return event.data.after.ref.set(
            {
              lastNotified: timestampSeconds,
            },
            {
              merge: true,
            },
          );
        }
      }
    } catch (error) {
      await bot.telegram.sendMessage(
        94899148,
        `updatePumpCrypto function ${error}`,
      );
    }
    return null;
  },
);
//Alerts
exports.tickerAlerts = onDocumentWritten(
  {
    document: "crypto/{symbol}/message/{type}",
    region: "europe-central2",
    //maxInstances: 5,
  },
  async (event) => {
    try {
      const { symbol } = event.params;
      const message = event.data.after.exists ? event.data.after.data() : null;
      if (message) {
        const previousMessageData = event.data.before.data();
        const silent15min =
          !previousMessageData?.lastNotified ||
          message.lastNotified?._seconds -
            previousMessageData?.lastNotified?._seconds >=
            15 * 60;
        if (silent15min) {
          await bot.telegram.sendMessage(
            94899148,
            `<b>${symbol.slice(0, -4)} ${message.alertMessage}</b> #${symbol.slice(0, -4)}\n/${symbol}`,
            {
              parse_mode: "HTML",
              ...Markup.inlineKeyboard([
                [
                  Markup.button.url(
                    symbol,
                    `https://bybit.rzk.com.ru/chart/${symbol}/1h`,
                  ),
                ],
                [
                  Markup.button.url(
                    `📈 Tradingview chart: ${symbol}`,
                    `https://www.tradingview.com/chart/8qtrvOgg/?symbol=BYBIT:${symbol}.P&interval=D`,
                  ),
                ],
                [
                  Markup.button.url(
                    `📈 Coinglass chart: ${symbol}`,
                    `https://www.coinglass.com/tv/ru/Bybit_${symbol}`,
                  ),
                ],
                [
                  Markup.button.url(
                    `📟 Bybit: ${symbol}`,
                    `https://bybit.onelink.me/EhY6?af_web_dp=https://www.bybit.com/trade/usdt/${symbol}&af_xp=custom&pid=tradegpt&c=tele_share&af_dp=bybitapp://open/home?tab=2&symbol=${symbol}&page=chart&type=usdt&&source=GPT&orderType=Limit&af_force_deeplink=true`,
                  ),
                ],
                [Markup.button.callback(`🗑 Delete message`, "delete/msg")],
              ]),
            },
          );
        }
      } else {
        //delete doc
        // const snapshot = await db.collection(`crypto-alerts/${symbol}`).get();
        // if (!snapshot.empty) {
        //   const batch = db.batch();
        //   snapshot.docs.forEach((doc) => {
        //     batch.delete(doc.ref);
        //   });
        //   await batch.commit();
        // }
      }
    } catch (error) {
      await bot.telegram.sendMessage(
        94899148,
        `TickersAlert function ${error}`,
      );
    }
    return null;
  },
);

//Update crypto
exports.updateCrypto = onDocumentWritten(
  {
    document: "crypto/{symbol}",
    region: "europe-central2",
    //maxInstances: 5,
  },
  async (event) => {
    try {
      const { symbol } = event.params;
      const ticker = event.data.after.exists ? event.data.after.data() : null;
      if (ticker) {
        //update data
      } else {
        await db.doc(`crypto/${symbol}/alerts/triggers`).delete();
        await db.doc(`crypto/${symbol}/message/alert`).delete();
        //delete pump crypto-alerts
        const snapshot = await db
          .collection(`crypto-pump/${symbol}/message`)
          .get();
        if (!snapshot.empty) {
          const batch = db.batch();
          snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });
          await batch.commit();
        }
        await db.doc(`crypto-pump/${symbol}`).delete();
      }
    } catch (error) {
      await bot.telegram.sendMessage(
        94899148,
        `AlgoliaSync function ${JSON.stringify(error)}`,
      );
    }
    return null;
  },
);
