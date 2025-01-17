import Ticker from "../models/Ticker.js";
import { Markup } from "telegraf";

export const handleEditTickerField = async (ctx, session) => {
  const fieldData = ctx.message.text;
  const { symbol, field } = session.sessionData;
  await Ticker.updateField(symbol, field, fieldData, session);
  await ctx.reply(
    `Ticker field [${field}] updated to ${fieldData}.`,
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          `Show ticker ${symbol}`,
          `show-ticker/${symbol}`,
        ),
      ],
    ]),
  );
  if (field === "alertDown") {
    //next step to set alert2
    session.sessionData.field = "alertUp";
    await session.save("bybit-scene");
    await ctx.replyWithHTML(
      `Editing <b>${symbol}</b>, please set <b>Alert Up</b>. Please enter a new value:`,
    );
  } else {
    await session.delete("bybit-scene");
  }
};
