import { Markup } from "telegraf";

export const startMessage = (ctx) => {
  ctx.replyWithHTML(
    "Welcome to the <b>Crypto</b> Price Alert Bot!",
    Markup.inlineKeyboard([
      [Markup.button.callback("New Subscription", "new_subscription")],
    ]),
  );
};
