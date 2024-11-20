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
exports.tickerVolumeUp = onDocumentWritten(
  {
    document: "tickers-scan/{interval}/tickers/{symbol}",
    region: "europe-central2",
    //maxInstances: 5,
  },
  async (event) => {
    const { interval, symbol } = event.params;
    const ticker = event.data.after.data();
    //const previousTickerData = event.data.before.data();
    // logger.info("Hello logs!" + `${interval}, ${symbol}, ${ticker.volumeUp}`, {
    //   structuredData: true,
    // });
    if (Math.abs(ticker.volumeUp) > 10) {
      await bot.telegram.sendMessage(
        94899148,
        `<code>${symbol}</code>\nInterval ${interval}\n` +
          `${ticker.volumeUp > 0 ? `📈 volumeUp x ${ticker.volumeUp} more 10` : `📉 volumeUp x -${ticker.volumeUp} more 10`}\n` +
          `lastPrice: <b>${ticker.lastPrice}</b>`,
        {
          parse_mode: "HTML",
          ...Markup.inlineKeyboard([
            [
              Markup.button.url(
                `Rzk: ${symbol}`,
                `https://bybit.rzk.com.ru/${interval}/${symbol}`,
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
    return null;
  },
);
