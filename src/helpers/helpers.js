//escape Html
export const escapeHtml = (text) => {
  if (typeof text !== "string") {
    text = String(text);
  }
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};
// format time
export const timeConvert = (timestamp) => {
  return new Date(timestamp).toLocaleString("ru-RU", {
    timeZone: "Europe/Moscow",
  });
};

// format price
export const formatNumber = (price) => {
  return price.toLocaleString("ru-RU");
};

//sleep
export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const renderMsg = async (ctx, message, inlineKeyboard, edit = true) => {
  if (edit) {
    await ctx.editMessageText(message, {
      parse_mode: "HTML",
      ...inlineKeyboard,
    });
  } else {
    await ctx.replyWithHTML(message, inlineKeyboard);
  }
};
//send msg to the channel
export const sendMsgChannel = async (bot, message, inlineKeyboard) => {
  const { header = "", msg = "", footer = "" } = message;
  await bot.telegram.sendMessage(
    "-1002687531775",
    `${header} <b>${escapeHtml(msg)}</b>\n${footer}`,
    {
      parse_mode: "HTML",
      ...inlineKeyboard,
    },
  );
};
//send msg to me
export const sendMsgMe = async (bot, message, inlineKeyboard) => {
  const { header = "", msg = "", footer = "" } = message;
  await bot.telegram.sendMessage(
    94899148,
    `${header} <b>${escapeHtml(msg)}</b>\n${footer}`,
    {
      parse_mode: "HTML",
      ...inlineKeyboard,
    },
  );
};
