import Subscription from "../models/Subscription.js";
import { Markup } from "telegraf";

export const handleEditSubs = async (ctx, session) => {
  let fieldData = ctx.message.text;
  const fieldName = session.sessionData.field;
  if (fieldName === "interval") {
    const interval = +fieldData;
    const { error } = Subscription.validateInterval(interval);
    if (error) {
      await ctx.reply(
        "Invalid interval. Please enter a positive integer value.",
      );
      return;
    }
    fieldData = interval;
  }
  const subscription = await Subscription.findById(
    ctx.from.id,
    session.sessionData.subscriptionId,
  );
  if (!subscription) {
    await ctx.reply("Subscription not found.");
    return;
  }

  subscription[fieldName] = fieldData;
  await subscription.update();
  await ctx.reply(
    `Subscription field [${fieldName}] updated to ${fieldData}`,
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          `Show subs ${session.sessionData.subscriptionId}`,
          `viewsubscription/${session.sessionData.subscriptionId}`,
        ),
      ],
    ]),
  );
  // Clear session data after saving
  await session.delete("bybit-scene");
};
