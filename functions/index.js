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
const { algoliasearch } = require("algoliasearch");

initializeApp();
const db = getFirestore();

//Alerts
exports.tickerAlerts = onDocumentWritten(
  {
    document: "crypto/{symbol}",
    region: "europe-central2",
    //maxInstances: 5,
  },
  async (event) => {
    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    const algoliaClient = algoliasearch(
      process.env.ALGOLIA_APP_ID,
      process.env.ALGOLIA_API_KEY,
    );
    const { symbol } = event.params;
    const ticker = event.data.after.exists ? event.data.after.data() : null;
    if (ticker) {
      const previousTickerData = event.data.before.data();
      // logger.info("Hello logs!" + `${interval}, ${symbol}, ${ticker.volumeUp}`, {
      //   structuredData: true,
      // });
      if (
        ticker.lastNotified?._seconds !==
        previousTickerData.lastNotified?._seconds
      ) {
        await bot.telegram.sendMessage(
          94899148,
          `<b>${symbol}</b> ${ticker.alertMessage}\n` +
            `Price change ${ticker.price24hPcnt > 0 ? "↗️ +" : "🔻 "}${ticker.price24hPcnt.toFixed(2)}%\n` +
            `/s${symbol}`,
          {
            parse_mode: "HTML",
            ...Markup.inlineKeyboard([
              [
                Markup.button.url(
                  `${symbol}`,
                  `https://bybit.rzk.com.ru/t/${symbol}`,
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
      //update index algolia
      const productAlgolia = {
        objectID: symbol,
        symbol,
        lastPrice: ticker.lastPrice,
        price24hPcnt: ticker.price24hPcnt,
      };
      await algoliaClient.saveObject({
        indexName: "crypto",
        body: productAlgolia,
      });
    } else {
      //delete index
      await algoliaClient.deleteObject({
        indexName: "crypto",
        objectID: symbol,
      });
      //delete pump crypto-alerts
      await db.doc(`crypto-alerts/${symbol}`).delete();
      // const snapshot = await db.collection(`crypto-alerts/${symbol}`).get();
      // if (!snapshot.empty) {
      //   const batch = db.batch();
      //   snapshot.docs.forEach((doc) => {
      //     batch.delete(doc.ref);
      //   });
      //   await batch.commit();
      // }
    }
    return null;
  },
);
