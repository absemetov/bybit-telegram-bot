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
//deprecated!
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
        // const silent15min =
        //   !ticker.lastNotified ||
        //   timestampSeconds - ticker.lastNotified >= 15 * 60;
        const currentPrice = ticker[`price`];
        const prevPrice = ticker[`prevPrice`];
        //if diff 1% then alert
        const silent =
          !prevPrice ||
          Math.abs((currentPrice - prevPrice) / prevPrice) >= 0.01;
        const nearCount = { S: 0, R: 0 };
        for (const timeframe of ["15min", "30min", "1h", "2h", "4h"]) {
          for (const side of ["S", "R"]) {
            const price = ticker[`price_pattern${side}_${timeframe}`];
            const difference = Math.abs((currentPrice - price) / price);
            //diff 0.25% levels
            if (difference <= 0.0025) nearCount[side]++; // Увеличиваем счетчик
          }
        }
        const side = nearCount["S"] > nearCount["R"] ? "s" : "r";
        //levels near
        if ((nearCount["S"] >= 3 || nearCount["R"] >= 3) && silent) {
          // Then return a promise of a set operation to update the count
          //channel bybitLevels
          await bot.telegram.sendMessage(
            "-1002687531775",
            `<b><code>${symbol.slice(0, -4)}</code> ${currentPrice}$ ${currentPrice > prevPrice ? "⬆️" : "🔻"} ` +
              `${side === "s" ? "Support" : "Ressistance"} ${new Date(timestampSeconds * 1000).toLocaleString("ru", { timeZone: "Europe/Moscow" })}</b>\n` +
              `Trade Smarter, Not Harder. #${symbol.slice(0, -4)} $${symbol.slice(0, -4)}`,
            {
              parse_mode: "HTML",
              ...Markup.inlineKeyboard([
                [
                  Markup.button.url(
                    `Public site ${symbol}`,
                    `https://bybit-telegram-bot.pages.dev/${symbol}/1h?price=${ticker["price"]}&time=${timestampSeconds}&side=${side}`,
                  ),
                ],
                [
                  Markup.button.url(
                    `Terminal ${symbol}`,
                    `https://bybit.rzk.com.ru/chart/${symbol}/1h?price=${ticker["price"]}&time=${timestampSeconds}&side=${side}`,
                  ),
                ],
              ]),
            },
          );
          //set prev price
          return event.data.after.ref.set(
            {
              prevPrice: currentPrice,
              lastNotified: timestampSeconds,
              upPrice: currentPrice > prevPrice ? "⬆️" : "🔻",
              side: side === "s" ? "S" : "R",
            },
            {
              merge: true,
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
        //update ticker data
        //const previousMessageData = event.data.before.data();
        //const timestampSeconds = Math.round(Date.now() / 1000);
        // const silent15min =
        //   !ticker.lastNotified ||
        //   timestampSeconds - ticker.lastNotified >= 15 * 60;
        //const currentPrice = ticker[`price`];
        //const prevPrice = ticker[`prevPrice`];
        //if diff 1% then alert
        // const silent =
        //   !prevPrice ||
        //   Math.abs((currentPrice - prevPrice) / prevPrice) >= 0.01;
        // const nearCount = { S: 0, R: 0 };
        // for (const timeframe of ["15min", "30min", "1h", "2h", "4h"]) {
        //   for (const side of ["S", "R"]) {
        //     const price = ticker[`price_pattern${side}_${timeframe}`];
        //     const difference = Math.abs((currentPrice - price) / price);
        //     //diff 0.25% levels
        //     if (difference <= 0.0025) nearCount[side]++; // Увеличиваем счетчик
        //   }
        // }
        //const side = nearCount["S"] > nearCount["R"] ? "s" : "r";
        //levels near
        //if ((nearCount["S"] >= 3 || nearCount["R"] >= 3) && silent) {
        // Then return a promise of a set operation to update the count
        //channel bybitLevels
        // await bot.telegram.sendMessage(
        //   "-1002687531775",
        //   `<b><code>${symbol.slice(0, -4)}</code> ${currentPrice}$ ${currentPrice > prevPrice ? "⬆️" : "🔻"} ` +
        //     `${side === "s" ? "Support" : "Ressistance"} ${new Date(timestampSeconds * 1000).toLocaleString("ru", { timeZone: "Europe/Moscow" })}</b>\n` +
        //     `Trade Smarter, Not Harder. #${symbol.slice(0, -4)}`,
        //   {
        //     parse_mode: "HTML",
        //     ...Markup.inlineKeyboard([
        //       [
        //         Markup.button.url(
        //           `Public site ${symbol}`,
        //           `https://bybit-telegram-bot.pages.dev/${symbol}/1h?price=${ticker["price"]}&time=${timestampSeconds}&side=${side}`,
        //         ),
        //       ],
        //       [
        //         Markup.button.url(
        //           `Terminal ${symbol}`,
        //           `https://bybit.rzk.com.ru/chart/${symbol}/1h?price=${ticker["price"]}&time=${timestampSeconds}&side=${side}`,
        //         ),
        //       ],
        //     ]),
        //   },
        // );
        //set prev price
        // return event.data.after.ref.set(
        //   {
        //     prevPrice: currentPrice,
        //     lastNotified: timestampSeconds,
        //     upPrice: currentPrice > prevPrice ? "⬆️" : "🔻",
        //     side: side === "s" ? "S" : "R",
        //   },
        //   {
        //     merge: true,
        //   },
        // );
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
        //}
      } else {
        //delete ticker
        await db.doc(`crypto/${symbol}/alerts/triggers`).delete();
        await db.doc(`crypto/${symbol}/message-alert/alert`).delete();
        //delete pump crypto-alerts
        // const snapshot = await db
        //   .collection(`crypto/${symbol}/message-levels`)
        //   .get();
        // if (!snapshot.empty) {
        //   const batch = db.batch();
        //   snapshot.docs.forEach((doc) => {
        //     batch.delete(doc.ref);
        //   });
        //   await batch.commit();
        // }
        //await db.doc(`crypto/${symbol}`).delete();
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
