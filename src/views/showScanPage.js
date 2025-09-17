import { Markup } from "telegraf";
//new cron jobs
export const viewScans = async (ctx, intervals, edit = false) => {
  let message = "Choose interval for editing\n";
  const buttons = [];
  for (const interval of intervals) {
    buttons.push([
      Markup.button.callback(
        `${interval.active ? "🟢" : "🔴"}`,
        `cron/${interval.id}/edit/active/${!interval.active}/redirect`,
      ),
      Markup.button.callback(
        `${interval.id} (${interval.schedule || "-"})`,
        `cron/${interval.id}`,
      ),
    ]);
  }
  //render
  if (edit) {
    await ctx.editMessageText(message, {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard(buttons),
    });
  } else {
    await ctx.replyWithHTML(message, Markup.inlineKeyboard(buttons));
  }
};

export const showScanPage = async (ctx, interval, scan, scanFields) => {
  let message = `Edit interval: <b>${interval}</b>\n`;
  const buttons = [];
  buttons.push([Markup.button.callback("<Back", "cron")]);
  for (const field of scanFields) {
    if (field.name === "patterns") {
      message += `${field.name}: <code>${JSON.stringify(scan[field.name])}</code>\n`;
    } else {
      message += `${field.name}: <code>${scan[field.name]}</code>\n`;
    }
    if (field.name === "active" || field.name === "notify") {
      buttons.push([
        Markup.button.callback(
          `Edit ${field.name}`,
          `cron/${interval}/edit/${field.name}/${!scan[field.name]}`,
        ),
      ]);
    } else {
      buttons.push([
        Markup.button.callback(
          `Edit ${field.name}`,
          `cron/${interval}/edit/${field.name}`,
        ),
      ]);
    }
  }
  //render
  //await renderMsg(ctx, message, Markup.inlineKeyboard(buttons));
  await ctx.editMessageText(message, {
    parse_mode: "HTML",
    ...Markup.inlineKeyboard(buttons),
  });
};
