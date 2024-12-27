import Alert from "../models/Alert.js";
import Subscription from "../models/Subscription.js";
import { bybitKline } from "../helpers/bybitV5.js";
import { Markup } from "telegraf";

export const checkAlertsAndSubscriptions = async (bot) => {
  // alert Price depricated !!! notify for 1859859047 account
  const subscriptions = await Subscription.findAll();
  // Check subscriptions
  for (const subscription of subscriptions) {
    try {
      const { userId, symbol, interval, lastNotified } = subscription;
      const kline = await bybitKline(symbol, "1min", 2);
      const candle1 = kline[0];
      const candle2 = kline[1];
      if (candle1 && candle2) {
        const lastPrice = candle1[4];
        if (
          interval > 0 &&
          Date.now() - lastNotified.toMillis() >= interval * 60000
        ) {
          // get last coin price
          const message = `<b>${symbol}</b> price is currently <b>$${lastPrice}</b> in <b>${interval}</b> min ago\n`;
          bot.telegram.sendMessage(userId, message, {
            parse_mode: "HTML",
            ...Markup.inlineKeyboard([
              [
                Markup.button.callback(
                  `Show subs ${symbol}`,
                  `viewsubscription/${symbol}/clear`,
                ),
              ],
            ]),
          });
          subscription.lastNotified = new Date();
          await subscription.update();
        }
        // TODO kline alerts
        const lowPrice = +candle2[3];
        const highPrice = +candle2[2];
        const alerts = await Alert.mustNotify(
          userId,
          symbol,
          lowPrice,
          highPrice,
        );
        // alert set a another account change notify music!!!!
        for (const alert of alerts) {
          const { userId, symbol, price, message, lastNotified } = alert;
          // repeat after 10min
          if (
            lastNotified === null ||
            Date.now() - lastNotified.toMillis() >= 10 * 60000
          ) {
            let alertMessage =
              `<b>${symbol}</b> price has cross <b>$${price}</b>! Current price: <b>$${lastPrice}</b>\n` +
              `Candle2 [${lowPrice}, ${highPrice}]`;
            if (message) alertMessage += `\nMessage: ${message}`;
            await bot.telegram.sendMessage(userId, alertMessage, {
              parse_mode: "HTML",
              ...Markup.inlineKeyboard([
                [
                  Markup.button.callback(
                    `Show subs ${symbol}`,
                    `viewsubscription/${symbol}/clear`,
                  ),
                ],
              ]),
            });
            alert.lastNotified = new Date();
            await alert.update();
          }
          // await alert.delete();
          // TODO set lastNotified field!!!
        }
      }
    } catch (error) {
      console.log(error.message);
      await bot.telegram.sendMessage(94899148, error.message, {
        parse_mode: "HTML",
      });
    }
  }
};
