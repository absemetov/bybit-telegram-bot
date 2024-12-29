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
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString("ru-RU", {
    timeZone: "Europe/Moscow",
  });
};

exports.tickerVolumeUp = onDocumentWritten(
  {
    document: "crypto/{symbol}/pump-alerts/{alertId}",
    region: "europe-central2",
    //maxInstances: 5,
  },
  async (event) => {
    const { symbol } = event.params;
    const { lastPrice, volumeUp, interval, volumeCandleStartTime } =
      event.data.after.data();
    //const previousTickerData = event.data.before.data();
    // logger.info("Hello logs!" + `${interval}, ${symbol}, ${ticker.volumeUp}`, {
    //   structuredData: true,
    // });
    // const settings = await db
    //   .collection("settings")
    //   .doc("scanChunksNumber")
    //   .get();
    await bot.telegram.sendMessage(
      94899148,
      `<code>${symbol}</code> <b>${lastPrice}$</b> VolumeUp 📈${volumeUp}% in ${interval}\n` +
        `volumeCandleStartTime: ${formatDate(volumeCandleStartTime)}`,
      {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([
          // [
          //   Markup.button.callback(
          //     `Show ticker ${symbol}`,
          //     `show-ticker/${symbol}/clear`,
          //   ),
          // ],
          [
            Markup.button.url(
              `Rzk: ${symbol} TV`,
              `https://bybit.rzk.com.ru/tickers/${symbol}/tv`,
            ),
          ],
          [
            Markup.button.url(
              `📈 TV chart: ${symbol}`,
              `https://www.tradingview.com/chart/8qtrvOgg/?symbol=BYBIT:${symbol}.P&interval=D`,
            ),
          ],
          [
            Markup.button.url(
              `Bybit: ${symbol}`,
              `https://bybit.onelink.me/EhY6?af_web_dp=https://www.bybit.com/trade/usdt/${symbol}&af_xp=custom&pid=tradegpt&c=tele_share&af_dp=bybitapp://open/home?tab=2&symbol=${symbol}&page=chart&type=usdt&&source=GPT&orderType=Limit&af_force_deeplink=true`,
            ),
          ],
        ]),
      },
    );
    return null;
  },
);

//notify cross alers
exports.tickerAlerts = onDocumentWritten(
  {
    document: "crypto/{symbol}",
    region: "europe-central2",
    //maxInstances: 5,
  },
  async (event) => {
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
          `<b>${symbol}</b> alert ${ticker.alertMessage}`,
          {
            parse_mode: "HTML",
            ...Markup.inlineKeyboard([
              // [
              //   Markup.button.callback(
              //     `Show ticker ${symbol}`,
              //     `show-ticker/${symbol}/clear`,
              //   ),
              // ],
              [
                Markup.button.url(
                  `Rzk: ${symbol} TV`,
                  `https://bybit.rzk.com.ru/tickers/${symbol}/tv`,
                ),
              ],
              [
                Markup.button.url(
                  `📈 TV chart: ${symbol}`,
                  `https://www.tradingview.com/chart/8qtrvOgg/?symbol=BYBIT:${symbol}.P&interval=D`,
                ),
              ],
              [
                Markup.button.url(
                  `Bybit: ${symbol}`,
                  `https://bybit.onelink.me/EhY6?af_web_dp=https://www.bybit.com/trade/usdt/${symbol}&af_xp=custom&pid=tradegpt&c=tele_share&af_dp=bybitapp://open/home?tab=2&symbol=${symbol}&page=chart&type=usdt&&source=GPT&orderType=Limit&af_force_deeplink=true`,
                ),
              ],
            ]),
          },
        );
      }
    } else {
      //delete pump alerts
      const snapshot = await db
        .collection(`crypto/${symbol}/pump-alerts`)
        .get();
      if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }
    }
    return null;
  },
);
