import Subscription from "../models/Subscription.js";
import Session from "../models/Session.js";
import {
  showSubscriptionPage,
  showSubscriptionsPage,
} from "../views/showSubscriptionsPage.js";
import { bybitKline } from "../helpers/bybitV5.js";
import { sleep } from "../helpers/functions.js";
// set deprecated!!!
// export const setSubscription = async (ctx) => {
//   const session = new Session(ctx.from.id);
//   session.sessionData.scene = "createSubs";
//   session.sessionData.cursor = "symbol";
//   await session.save("bybit-scene");
//   await ctx.editMessageText(
//     "Please enter the symbol of the cryptocurrency (e.g., <b>BTCUSDT</b>):",
//     { parse_mode: "HTML" },
//   );
//   await ctx.answerCbQuery();
// };
// create new subs from Alert msg
export const createSubs = async (ctx, params) => {
  const { symbol } = params;
  const subscriptionIsExist = await Subscription.findById(ctx.from.id, symbol);
  if (subscriptionIsExist !== null) {
    await ctx.reply(`Symbol ${symbol} is exist, use /list to find it`);
    return;
  }
  const subscription = new Subscription(ctx.from.id, symbol, 0);
  try {
    await subscription.create();
    await ctx.answerCbQuery(
      `Symbol ${symbol} subscribed. Set interval and price alerts.`,
    );
    await showSubscription(ctx, { symbol, clear: true });
  } catch (error) {
    ctx.reply(`Error creating subscription: ${error.message}`);
  }
};
// skip msg deprecated!!!
export const skipSubscriptionMsg = async (ctx) => {
  const session = await Session.findById(ctx.from.id, "bybit-scene");
  const subscription = new Subscription(
    ctx.from.id,
    session.sessionData.symbol,
    session.sessionData.interval,
    "",
  );
  await subscription.create();
  await ctx.replyWithHTML(
    `Subscription set for <b>${session.sessionData.symbol}</b> with an interval of ${session.sessionData.interval} minutes. Use /list`,
  );
  await session.delete();
  await ctx.deleteMessage();
};
// index page
export const viewSubscriptions = async (ctx, edit = true) => {
  const session = new Session(ctx.from.id);
  session.sessionData.SubscriptionsPreviousPage = "view_subscriptions";
  await session.save();
  const firstPageSnapshot = await Subscription.findByUserId(ctx.from.id, 5);
  if (firstPageSnapshot.subscriptions.length === 0)
    return ctx.reply("You have no subscriptions set.");

  await showSubscriptionsPage(
    ctx,
    firstPageSnapshot.subscriptions,
    firstPageSnapshot.lastVisibleId,
    firstPageSnapshot.firstVisibleId,
    firstPageSnapshot.hasPrev,
    firstPageSnapshot.hasNext,
    edit,
  );
};
// paginate Subscriptions
export const viewSubscriptionsPaginate = async (ctx, params) => {
  const session = new Session(ctx.from.id);
  session.sessionData.SubscriptionsPreviousPage = ctx.callbackQuery.data;
  await session.save();
  const { direction, lastVisibleId } = params;
  let subscriptionsSnapshot;
  const lastVisibleDoc = await Subscription.findDocById(
    ctx.from.id,
    lastVisibleId,
  );
  if (direction === "prev") {
    subscriptionsSnapshot = await Subscription.findByUserId(
      ctx.from.id,
      5,
      null,
      lastVisibleDoc,
    );
  } else if (direction === "next") {
    subscriptionsSnapshot = await Subscription.findByUserId(
      ctx.from.id,
      5,
      lastVisibleDoc,
    );
  }

  if (subscriptionsSnapshot && subscriptionsSnapshot.subscriptions.length > 0) {
    await showSubscriptionsPage(
      ctx,
      subscriptionsSnapshot.subscriptions,
      subscriptionsSnapshot.lastVisibleId,
      subscriptionsSnapshot.firstVisibleId,
      subscriptionsSnapshot.hasPrev,
      subscriptionsSnapshot.hasNext,
    );
  }
};
// show coin info
// TODO ADD KLINE DATA
export const showSubscription = async (ctx, params) => {
  const { symbol, clear } = params;
  const session = await Session.findById(ctx.from.id);
  const prevPage = clear
    ? "view_subscriptions"
    : session.sessionData.SubscriptionsPreviousPage;
  // const subscriptionSymbol = ctx.match[1];
  const subscription = await Subscription.findById(ctx.from.id, symbol);
  if (!subscription) return ctx.reply("Subscription not found.");
  const kline = await bybitKline(symbol, "15min", 1);
  const lastPrice = kline[0] ? kline[0][4] : null;
  showSubscriptionPage(ctx, subscription, prevPage, lastPrice);
};
// edit interval
export const editSubsInterval = async (ctx, params) => {
  const subscriptionId = params.symbol;
  const session = await Session.findById(ctx.from.id);

  const subscription = await Subscription.findById(ctx.from.id, subscriptionId);
  if (!subscription) {
    await ctx.reply("Subscription not found.");
    return;
  }
  session.sessionData.scene = "editSubs";
  session.sessionData.field = "interval";
  session.sessionData.subscriptionId = subscriptionId;
  await session.save("bybit-scene");
  await ctx.reply(
    `Editing subscription for ${subscription.symbol} with interval ${subscription.interval} mins. Please enter a new interval:`,
  );
  await ctx.answerCbQuery();
};
// edit msg deprecated!!!
// export const editSubsMsg = async (ctx) => {
//   const subscriptionId = ctx.match[1];
//   const session = await Session.findById(ctx.from.id);

//   const subscription = await Subscription.findById(ctx.from.id, subscriptionId);
//   if (!subscription) {
//     await ctx.reply("Subscription not found.");
//     return;
//   }

//   session.sessionData.scene = "editSubs";
//   session.sessionData.field = "message";
//   session.sessionData.subscriptionId = subscriptionId;
//   await session.save("bybit-scene");
//   await ctx.reply(
//     `Editing subscription for ${subscription.symbol} with msg ${subscription.message || "None"}. Please enter a new message:`,
//   );
//   await ctx.answerCbQuery();
// };

export const deleteSubscription = async (ctx, params) => {
  const { symbol } = params;
  const subscription = await Subscription.findById(ctx.from.id, symbol);
  await subscription.delete();
  await ctx.editMessageText(`Subscription for ${symbol} deleted successfully.`);
  await sleep(500);
  await viewSubscriptions(ctx, true);
};
