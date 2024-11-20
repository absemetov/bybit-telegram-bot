import Alert from "../models/Alert.js";
import { Markup } from "telegraf";

export const handlePriceInput = async (ctx, session) => {
  const price = +ctx.message.text.replace(/,/g, ".");
  const { error } = Alert.validatePrice(price);
  if (error) return ctx.reply("Invalid price. Please enter a numeric value.");
  session.sessionData.price = price;
  session.sessionData.cursor = "message";
  await session.save("bybit-scene");
  await ctx.reply(
    "Price set. Please enter a message for this alert (or press 'skip' to skip):",
    Markup.inlineKeyboard([
      [Markup.button.callback("Skip Alert msg", "skip_alert_msg")],
    ]),
  );
};

export const handleMessageInput = async (ctx, session) => {
  const message = ctx.message.text;
  const alert = new Alert(
    ctx.from.id,
    session.sessionData.subscriptionId,
    session.sessionData.price,
    message,
  );
  await alert.create();
  await session.delete("bybit-scene");
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
