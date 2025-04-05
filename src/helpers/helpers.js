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
