import Scan from "../models/Scan.js";
import { Markup } from "telegraf";
import { viewScans } from "../views/showScanPage.js";

export const showScans = async (ctx) => {
  const intervals = await Scan.all();
  viewScans(ctx, intervals, false);
};

export const handleEditScanField = async (ctx, session) => {
  let value = ctx.message.text;
  const field = session.sessionData.field;
  const interval = session.sessionData.scanId;
  //const scanInterval = await Scan.find(scanId);
  // if (fieldName === "dojiPcnt" || fieldName === "volumePcnt") {
  //   fieldData = ctx.message.text.replace(/,/g, ".");
  // }
  try {
    if (field === "patterns") {
      value = JSON.parse(value);
    }
    await Scan.updateField(interval, field, value);
    await session.delete("bybit-scene");
    const message = `Scan field <b>[${field}]</b> updated to <b>${value}</b>.`;
    const buttons = Markup.inlineKeyboard([
      [Markup.button.callback(`Show cron job ${interval}`, `cron/${interval}`)],
    ]);
    await ctx.replyWithHTML(message, buttons);
  } catch (error) {
    ctx.reply(`Error updating Scan interval: ${error.message}`);
  }
};
