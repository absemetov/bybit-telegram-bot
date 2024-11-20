import Alert from "../models/Alert.js";
import { Markup } from "telegraf";

export const handlePriceInput = async (ctx, session) => {
  let fieldData = ctx.message.text;
  const fieldName = session.sessionData.field;
  if (fieldName === "price") {
    const price = +ctx.message.text.replace(/,/g, ".");
    const { error } = Alert.validatePrice(price);
    if (error) {
      await ctx.reply("Invalid price. Please enter a numeric value");
      return;
    }
    fieldData = price;
  }
  const alert = await Alert.findById(
    ctx.from.id,
    session.sessionData.subscriptionId,
    session.sessionData.alertId,
  );
  if (!alert) {
    await ctx.reply("Alert not found.");
    return;
  }

  alert[fieldName] = fieldData;
  await alert.update();
  await ctx.reply(
    `Alert field [${fieldName}] updated to ${fieldData}.`,
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          `Show alert for ${session.sessionData.subscriptionId}`,
          `viewalert/${session.sessionData.subscriptionId}/${session.sessionData.alertId}`,
        ),
      ],
    ]),
  );
  await session.delete("bybit-scene");
};
