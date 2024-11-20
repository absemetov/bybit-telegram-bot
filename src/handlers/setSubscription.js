import Subscription from "../models/Subscription.js";
import { Markup } from "telegraf";
import Session from "../models/Session.js";

export const createSubs = async (ctx) => {
  const session = new Session(ctx.from.id);
  session.sessionData.scene = "createSubs";
  session.sessionData.cursor = "symbol";
  await session.save("bybit-scene");
  ctx.replyWithHTML(
    "Please enter the symbol of the cryptocurrency (e.g., <b>BTCUSDT</b>):",
  );
};

export const handleSymbolInput = async (ctx, session) => {
  //session.sessionData.symbol = ctx.message.text.toUpperCase();
  const symbol = ctx.message.text.toUpperCase();
  const subscriptionIsExist = await Subscription.findById(ctx.from.id, symbol);
  if (subscriptionIsExist !== null) {
    await ctx.reply(`Symbol ${symbol} is exist, use /list to find it`);
    return;
  }
  try {
    const subscription = new Subscription(ctx.from.id, symbol, 0);
    await subscription.create();
    await ctx.reply(
      `Subscription set for ${symbol} with an interval of 0 minutes. Use /list`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            `Show subs ${symbol}`,
            `viewsubscription/${symbol}/clear`,
          ),
        ],
      ]),
    );
  } catch (error) {
    ctx.reply(`Error creating subscription: ${error.message}`);
  }
  // clear session
  await session.delete("bybit-scene");

  // try {
  //   const kline = await bybitKline(session.sessionData.symbol, "1min", 1);
  //   const candle1 = kline[0];
  //   const lastPrice = candle1[4];
  //   session.sessionData.currentPrice = lastPrice;
  //   session.sessionData.cursor = "interval"; // Обновляем курсор на следующий шаг
  //   await session.save("bybit-scene");
  //   await ctx.reply(
  //     `Current ${session.sessionData.symbol} price is $${lastPrice}. Please enter the interval (in minutes) to notify for the subscription:`,
  //   );
  // } catch {
  //   await ctx.reply(
  //     "Invalid symbol or error fetching price. Please try again.",
  //   );
  // }
};

export const handleIntervalInput = async (ctx, session) => {
  const interval = +ctx.message.text;
  const { error } = Subscription.validateInterval(interval);
  if (error) {
    return ctx.reply(
      `Invalid interval ${interval}. Please enter a positive integer value.`,
    );
  }
  const subscription = new Subscription(
    ctx.from.id,
    session.sessionData.symbol,
    interval,
  );
  try {
    await subscription.create();
    await ctx.reply(
      `Subscription set for ${session.sessionData.symbol} with an interval of ${interval} minutes. Use /list`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            `Show subs ${session.sessionData.symbol}`,
            `viewsubscription/${session.sessionData.symbol}/clear`,
          ),
        ],
      ]),
    );
    // clear session
    await session.delete("bybit-scene");
    // bybit bot session set default prev page
    // session.sessionData.SubscriptionsPreviousPage = "view_subscriptions";
    // await session.save();
  } catch (error) {
    ctx.reply(`Error creating subscription: ${error.message}`);
  }
  // session.sessionData.interval = +ctx.message.text;
  // session.sessionData.cursor = "message"; // Обновляем курсор на следующий шаг
  // await session.save("bybit-scene");
  // await ctx.reply(
  //   "Interval set. Please enter a message for this subscription (or press 'skip' to skip):",
  //   Markup.inlineKeyboard([
  //     [Markup.button.callback("Skip Subs msg", "skip_subscription_msg")],
  //   ]),
  // );
};

export const handleMessageInput = async (ctx, session) => {
  try {
    const message = ctx.message.text;
    const subscription = new Subscription(
      ctx.from.id,
      session.sessionData.symbol,
      session.sessionData.interval,
      message,
    );
    await subscription.create();
  } catch (error) {
    ctx.reply(`Error creating subscription: ${error.message}`);
  }
  await ctx.reply(
    `Subscription set for ${session.sessionData.symbol} with an interval of ${session.sessionData.interval} minutes. Use /list`,
  );
  // clear session
  await session.delete("bybit-scene");
};
