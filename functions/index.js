/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const { onRequest } = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");

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
//const { algoliasearch } = require("algoliasearch");
//const { RestClientV5 } = require("bybit-api");

initializeApp();
const db = getFirestore();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
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
        const silent5min =
          message.lastNotified?._seconds -
            previousMessageData?.lastNotified?._seconds >=
          5 * 60;
        const newAlert = !previousMessageData?.lastNotified;
        if (newAlert || silent5min) {
          await bot.telegram.sendMessage(
            94899148,
            `<b>${symbol} ${message.alertMessage}</b>\n/${symbol}`,
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

//Algolia sync
exports.AlgoliaSync = onDocumentWritten(
  {
    document: "crypto/{symbol}",
    region: "europe-central2",
    //maxInstances: 5,
  },
  async (event) => {
    try {
      //const bybitClient = new RestClientV5();
      // const algoliaClient = algoliasearch(
      //   process.env.ALGOLIA_APP_ID,
      //   process.env.ALGOLIA_API_KEY,
      // );
      const { symbol } = event.params;
      const ticker = event.data.after.exists ? event.data.after.data() : null;
      if (ticker) {
        //update index algolia
        // const response = await bybitClient.getKline({
        //   category: "linear",
        //   symbol: symbol,
        //   interval: "D",
        //   limit: 1,
        // });
        // if (response.retCode !== 0) {
        //   throw new Error(`Error API: ${response.retMsg}`);
        // }
        // const candles = response.result.list.map((candle) => ({
        //   time: parseInt(candle[0]),
        //   localTime: new Date(parseInt(candle[0])).toLocaleString("ru-RU"),
        //   open: parseFloat(candle[1]),
        //   high: parseFloat(candle[2]),
        //   low: parseFloat(candle[3]),
        //   close: parseFloat(candle[4]),
        //   volume: parseFloat(candle[5]),
        // }));
        // const { open, close } = candles[0];
        // const productAlgolia = {
        //   objectID: symbol,
        //   symbol,
        //   price24hPcnt: ((close - open) / open) * 100,
        //   lastPrice: close,
        // };
        // await algoliaClient.saveObject({
        //   indexName: "crypto",
        //   body: productAlgolia,
        // });
      } else {
        //delete index
        // await algoliaClient.deleteObject({
        //   indexName: "crypto",
        //   objectID: symbol,
        // });
        //delete pump crypto-alerts
        await db.doc(`crypto/${symbol}/alerts/triggers`).delete();
        await db.doc(`crypto/${symbol}/message/alert`).delete();
        //await db.doc(`crypto/${symbol}/message/pump`).delete();
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
        `AlgoliaSync function ${JSON.stringify(error)}`,
      );
    }
    return null;
  },
);
