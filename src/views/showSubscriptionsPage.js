import { Markup } from "telegraf";

export const showSubscriptionPage = async (
  ctx,
  subscription,
  SubscriptionsPreviousPage,
  lastPrice,
) => {
  let message =
    `Subscription symbol: <b>${subscription.symbol}</b>\n` +
    `Interval price alert: <b>${subscription.interval}</b> minutes\n` +
    `Last price: <b>${lastPrice}$</b>`;
  const buttons = [
    [Markup.button.callback("<Back", SubscriptionsPreviousPage)],
    [
      Markup.button.callback("New Alert", `new_alert/${subscription.symbol}`),
      Markup.button.callback(
        "Show Alerts",
        `showalerts/${subscription.symbol}`,
      ),
    ],
    [
      Markup.button.callback(
        "Edit Interval",
        `editsubsinterval/${subscription.symbol}`,
      ),
    ],
    [
      Markup.button.callback(
        "Delete Subscription",
        `deletesubscription/${subscription.symbol}`,
      ),
    ],
    [
      Markup.button.url(
        `Bybit: ${subscription.symbol}`,
        `https://bybit.onelink.me/EhY6?af_web_dp=https://www.bybit.com/trade/usdt/${subscription.symbol}&af_xp=custom&pid=tradegpt&c=tele_share&af_dp=bybitapp://open/home?tab=2&symbol=${subscription.symbol}&page=chart&type=usdt&&source=GPT&orderType=Limit&af_force_deeplink=true`,
      ),
    ],
    [
      Markup.button.url(
        `TV ideas: ${subscription.symbol}`,
        `https://www.tradingview.com/symbols/${subscription.symbol}/ideas`,
      ),
    ],
    [
      Markup.button.url(
        `TV chart: ${subscription.symbol}`,
        `https://www.tradingview.com/chart/?symbol=BYBIT:${subscription.symbol}.P&interval=D`,
      ),
    ],
  ];

  await ctx.editMessageText(message, {
    parse_mode: "HTML",
    ...Markup.inlineKeyboard(buttons),
  });
};
// paginate
export const showSubscriptionsPage = async (
  ctx,
  subscriptions,
  lastVisibleId,
  firstVisibleId,
  hasPrev,
  hasNext,
  edit = true,
) => {
  let message = "Your <b>Subscriptions</b> coins:\n\n";
  const keyboardArray = [];
  // upload btn
  keyboardArray.push([
    Markup.button.callback("Upload Tickers", "upload-tickers"),
  ]);
  subscriptions.forEach((subscription) => {
    keyboardArray.push([
      Markup.button.callback(
        `${subscription.symbol}`,
        `viewsubscription/${subscription.symbol}`,
      ),
    ]);
  });
  // todo hide prev next
  const keyboardPrevNext = [];
  if (hasPrev) {
    keyboardPrevNext.push(
      Markup.button.callback(
        "⬅️ Previous",
        `viewsubscriptions/prev/${firstVisibleId}`,
      ),
    );
  }

  if (hasNext) {
    keyboardPrevNext.push(
      Markup.button.callback(
        "Next ➡️",
        `viewsubscriptions/next/${lastVisibleId}`,
      ),
    );
  }
  if (keyboardPrevNext.length) {
    keyboardArray.push(keyboardPrevNext);
  }
  const inlineKeyboard = Markup.inlineKeyboard(keyboardArray);
  if (edit) {
    await ctx.editMessageText(message, {
      parse_mode: "HTML",
      ...inlineKeyboard,
    });
  } else {
    await ctx.replyWithHTML(message, inlineKeyboard);
  }
};
