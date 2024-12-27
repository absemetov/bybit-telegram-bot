import Ticker from "../models/Ticker.js";
import { Markup } from "telegraf";

export const handleEditTickerField = async (ctx, session) => {
  const fieldData = ctx.message.text;
  const fieldName = session.sessionData.field;
  try {
    await Ticker.updateField(session.sessionData.symbol, fieldName, fieldData);
    await ctx.reply(
      `Ticker field [${fieldName}] updated to ${fieldData}.`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            `Show ticker ${session.sessionData.symbol}`,
            `show-ticker/${session.sessionData.symbol}`,
          ),
        ],
      ]),
    );
    await session.delete("bybit-scene");
  } catch (error) {
    console.log(error);
    ctx.reply(
      `Error edit ticker ${session.sessionData.symbol}: ${error.message}`,
    );
  }
};
