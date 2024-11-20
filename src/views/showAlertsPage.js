import { Markup } from "telegraf";
// no alert page
export const noAlertPage = async (ctx, symbol, AlertsPreviousPage) => {
  const buttons = [
    [Markup.button.callback("New Alert", `new_alert/${symbol}`)],
    [Markup.button.callback("<Back", AlertsPreviousPage)],
  ];
  await ctx.editMessageText(
    "You have no alerts set.",
    Markup.inlineKeyboard(buttons),
  );
};

// veiw alert
export const showAlertPage = async (ctx, alert, AlertsPreviousPage) => {
  let message = `Alert:\nSymbol: ${alert.symbol}\nPrice: $${alert.price}\nMessage: ${alert.message || "None"}`;

  const buttons = [
    [Markup.button.callback("< Back", AlertsPreviousPage)],
    [
      Markup.button.callback(
        "Edit Price",
        `editalert/price/${alert.symbol}/${alert.id}`,
      ),
    ],
    [
      Markup.button.callback(
        "Edit Message",
        `editalert/message/${alert.symbol}/${alert.id}`,
      ),
    ],
    [
      Markup.button.callback(
        "Delete Alert",
        `deletealert/${alert.symbol}/${alert.id}`,
      ),
    ],
  ];

  await ctx.editMessageText(message, Markup.inlineKeyboard(buttons));
};
// view alerts TODO add back btn
export const showAlertsPage = async (
  ctx,
  symbol,
  alerts,
  lastVisibleId,
  firstVisibleId,
  hasPrev,
  hasNext,
  AlertsPreviousPage,
) => {
  let message = `Alerts for ${symbol}:\n\n`;
  const keyboardArray = [];
  // back btn
  keyboardArray.push([Markup.button.callback("<Back", AlertsPreviousPage)]);
  alerts.forEach((alert) => {
    keyboardArray.push([
      Markup.button.callback(
        `${alert.symbol} - Price: ${alert.price}`,
        `viewalert/${alert.symbol}/${alert.id}`,
      ),
    ]);
  });

  const keyboardPrevNext = [];

  if (hasPrev) {
    keyboardPrevNext.push(
      Markup.button.callback(
        "⬅️ Previous",
        `viewalerts/prev/${symbol}/${firstVisibleId}`,
      ),
    );
  }

  if (hasNext) {
    keyboardPrevNext.push(
      Markup.button.callback(
        "Next ➡️",
        `viewalerts/next/${symbol}/${lastVisibleId}`,
      ),
    );
  }

  if (keyboardPrevNext.length) {
    keyboardArray.push(keyboardPrevNext);
  }
  const inlineKeyboard = Markup.inlineKeyboard(keyboardArray);
  await ctx.editMessageText(message, inlineKeyboard);
};
