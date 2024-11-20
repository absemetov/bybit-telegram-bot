import { Markup } from "telegraf";
import { renderMsg } from "../helpers/functions.js";

export const viewScanForm = async (ctx, intervals, edit = true) => {
  let message = "Choose interval for scaning\n";
  const buttons = [];
  for (const interval of intervals) {
    buttons.push([
      Markup.button.callback(
        `${interval.id} (${interval.volumePcnt}, ${interval.dojiPcnt})`,
        `scan/${interval.id}`,
      ),
      Markup.button.callback(`Edit`, `scanform/${interval.id}`),
    ]);
  }
  //render
  await renderMsg(ctx, message, Markup.inlineKeyboard(buttons), edit);
};

export const editScanFormPage = async (ctx, interval, scan, scanFields) => {
  let message = `Edit interval: <b>${interval}</b>\n`;
  const buttons = [];
  buttons.push([Markup.button.callback("<Back", "scan")]);
  for (const field of scanFields) {
    message += `${field.name}: <b>${scan[field.name] || null}</b>${field.unit}\n`;
    buttons.push([
      Markup.button.callback(
        `Edit ${field.name}`,
        `scan/${interval}/edit/${field.name}`,
      ),
    ]);
  }
  //render
  await renderMsg(ctx, message, Markup.inlineKeyboard(buttons));
};
