import { Markup } from "telegraf";
import Alert from "../models/Alert.js";
import Session from "../models/Session.js";
import {
  showAlertPage,
  showAlertsPage,
  noAlertPage,
} from "../views/showAlertsPage.js";
import { bybitKline } from "../helpers/bybitV5.js";
import { sleep } from "../helpers/functions.js";

// set alert
export const setAlert = async (ctx, params) => {
  const session = new Session(ctx.from.id);
  const { symbol } = params; // Extract symbol from the callback data
  session.sessionData.scene = "createAlert"; // Устанавливаем сцену в alert
  session.sessionData.cursor = "price"; // Устанавливаем начальный курсор на price
  session.sessionData.subscriptionId = symbol;
  await session.save("bybit-scene");
  // Get last price
  const kline = await bybitKline(session.sessionData.subscriptionId, "1min", 1);
  const candle1 = kline[0];
  const lastPrice = candle1[4];
  await ctx.replyWithHTML(
    `${symbol} coin last price is <code>${lastPrice}</code>. Please enter the price for the alert:`,
  );
  await ctx.answerCbQuery();
};
// skip msg
export const skipAlertMsg = async (ctx) => {
  const session = await Session.findById(ctx.from.id, "bybit-scene");
  const alert = new Alert(
    ctx.from.id,
    session.sessionData.subscriptionId,
    session.sessionData.price,
  );
  await alert.create();
  await session.delete("bybit-scene");
  await ctx.deleteMessage();
  await ctx.reply(
    `Alert set for when ${session.sessionData.subscriptionId} price goes $${session.sessionData.price}`,
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          `Show alerts for ${session.sessionData.subscriptionId}`,
          `showalerts/${session.sessionData.subscriptionId}`,
        ),
        Markup.button.callback(
          `Show subs ${session.sessionData.subscriptionId}`,
          `viewsubscription/${session.sessionData.subscriptionId}`,
        ),
      ],
    ]),
  );
};
// show alerts
export const showAlerts = async (ctx, params) => {
  const { symbol } = params;
  const session = await Session.findById(ctx.from.id);
  session.sessionData.AlertsPreviousPage = `showalerts/${symbol}`;
  await session.save();

  const firstPageSnapshot = await Alert.findBySubscriptionId(
    ctx.from.id,
    symbol,
    5,
  );
  // return to SubscriptionsPreviousPage
  if (firstPageSnapshot.alerts.length === 0)
    return await noAlertPage(ctx, symbol, `viewsubscription/${symbol}`);
  await showAlertsPage(
    ctx,
    symbol,
    firstPageSnapshot.alerts,
    firstPageSnapshot.lastVisibleId,
    firstPageSnapshot.firstVisibleId,
    firstPageSnapshot.hasPrev,
    firstPageSnapshot.hasNext,
    `viewsubscription/${symbol}`,
  );
};
// paginate
export const showAlertsPaginate = async (ctx, params) => {
  // prev url
  // const session = new Session(ctx.from.id);
  const session = await Session.findById(ctx.from.id);
  session.sessionData.AlertsPreviousPage = ctx.callbackQuery.data;
  await session.save();
  const { direction, symbol, lastVisibleId } = params;
  let alertsSnapshot;
  // get doc to paginate!!!
  const lastVisibleDoc = await Alert.findDocById(
    ctx.from.id,
    symbol,
    lastVisibleId,
  );
  if (direction === "prev") {
    alertsSnapshot = await Alert.findBySubscriptionId(
      ctx.from.id,
      symbol,
      5,
      null,
      lastVisibleDoc,
    );
  } else if (direction === "next") {
    alertsSnapshot = await Alert.findBySubscriptionId(
      ctx.from.id,
      symbol,
      5,
      lastVisibleDoc,
    );
  }
  if (alertsSnapshot && alertsSnapshot.alerts.length > 0) {
    await showAlertsPage(
      ctx,
      symbol,
      alertsSnapshot.alerts,
      alertsSnapshot.lastVisibleId,
      alertsSnapshot.firstVisibleId,
      alertsSnapshot.hasPrev,
      alertsSnapshot.hasNext,
      session.sessionData.SubscriptionsPreviousPage,
    );
  }
};
// show
export const showAlert = async (ctx, params) => {
  const { symbol, alertId } = params;
  const alert = await Alert.findById(ctx.from.id, symbol, alertId);
  const session = await Session.findById(ctx.from.id);
  if (!alert) return ctx.reply("Alert not found.");
  await showAlertPage(ctx, alert, session.sessionData.AlertsPreviousPage);
};
// edit Alert Price
export const editAlert = async (ctx, params) => {
  const { alertId, symbol, field } = params;
  const alert = await Alert.findById(ctx.from.id, symbol, alertId);
  if (!alert) {
    await ctx.reply("Alert not found.");
    return;
  }
  const session = new Session(ctx.from.id);
  session.sessionData.alertId = alertId;
  session.sessionData.subscriptionId = symbol;
  session.sessionData.scene = "editAlert";
  session.sessionData.field = field;
  await session.save("bybit-scene");
  await ctx.reply(
    `Editing alert for ${alert.symbol} fieldName ${field}. Please enter a new value:`,
  );
  await ctx.answerCbQuery();
};

// delete
export const deleteAlert = async (ctx, params) => {
  const { symbol, alertId } = params;
  // const session = await Session.findById(ctx.from.id);
  // const { subscriptionId } = session.sessionData;
  // TODO use path params
  const alert = await Alert.findById(ctx.from.id, symbol, alertId);
  if (!alert) return ctx.reply("Alert not found.");

  await alert.delete();
  await ctx.editMessageText(
    `Alert to $${alert.price} for ${alert.symbol} deleted successfully.`,
  );
  await sleep(500);
  await showAlerts(ctx, { symbol });
};
// deprecated!!!
// export const deleteAllAlerts = async (ctx, params) => {
//   // const session = await Session.findById(ctx.from.id);
//   const { symbol } = params;
//   // TODO use path params
//   const alerts = await Alert.findAll(ctx.from.id, symbol);
//   for (const alert of alerts) {
//     await alert.delete();
//   }
//   await ctx.reply("All alerts deleted successfully.");
//   await ctx.answerCbQuery();
// };
