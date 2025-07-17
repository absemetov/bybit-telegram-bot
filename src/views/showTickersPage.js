import { Markup } from "telegraf";
//show limit orders
export const showLimitOrders = async (ctx, orders, cursor, edit = true) => {
  const message = `Limit orders ${new Date().toLocaleString("ru-RU")}\n`;
  const keyboardArray = [];
  orders?.forEach((ticker) => {
    keyboardArray.push([
      Markup.button.callback(
        `${ticker.symbol} ${ticker.side} ${ticker.price}$ = ${ticker.sum}$`,
        `show-order/${ticker.symbol}`,
      ),
    ]);
  });
  // todo hide prev next
  const keyboardPrevNext = [];
  if (keyboardPrevNext.length) {
    keyboardArray.push(keyboardPrevNext);
  }
  const inlineKeyboard = Markup.inlineKeyboard(keyboardArray);
  if (edit) {
    await ctx.editMessageText(message, {
      parse_mode: "HTML",
      ...inlineKeyboard,
    });
  } else {
    await ctx.replyWithHTML(message, inlineKeyboard);
  }
};
//show indicators
export const showTickerIndicators = async (
  ctx,
  symbol,
  interval,
  indicators,
) => {
  const buttons = [
    [Markup.button.callback("⤴️ <Back", `show-ticker/${symbol}`)],
  ];
  //render
  await ctx.editMessageText(
    `Symbol: ${symbol}, Interval: ${interval}\n` +
      `${JSON.stringify(indicators.analyzeIndicators)}\n` +
      `First candle ${JSON.stringify(indicators.candles[0])}` +
      `Last candle ${JSON.stringify(indicators.candles[indicators.candles.length - 1])}`,
    {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard(buttons),
    },
  );
};
export const showTickerPage = async (
  ctx,
  symbol,
  ticker,
  TickersPreviousPage,
  editMessageText = true,
) => {
  const message = `${ticker.star ? "❤️" : "🖤"} ${ticker.alert ? "🔔" : "🔕"} <code>${symbol}</code> #${symbol}`;
  const buttons = [
    [Markup.button.callback("⤴️ <Back", TickersPreviousPage)],
    [
      Markup.button.callback(
        `${ticker.trading ? "🟢 Trading on" : "🔴 Trading off"}`,
        `edit-ticker-bool/${symbol}/trading/${!ticker.trading}`,
      ),
    ],
    [
      Markup.button.callback(
        `${ticker.openLong ? "↗️ Long side" : "↘️ Short side"}`,
        `edit-ticker-bool/${symbol}/openLong/${!ticker.openLong}`,
      ),
    ],
    [
      Markup.button.callback(
        `${ticker.star ? "❤️ Favorites" : "Add to favorites"}`,
        `edit-ticker-bool/${symbol}/star/${!ticker.star}`,
      ),
    ],
    [
      Markup.button.callback(
        `${ticker.alert ? "🔔" : "🔕"}`,
        `edit-ticker-bool/${symbol}/alert/${!ticker.alert}`,
      ),
    ],
    [
      Markup.button.url(
        `${symbol}`,
        `https://bybit.rzk.com.ru/chart/${symbol}/1h`,
      ),
    ],
    [
      Markup.button.url(
        `📈 Tradingview chart: ${symbol}`,
        `https://www.tradingview.com/chart/8qtrvOgg/?symbol=BYBIT:${symbol}.P&interval=D`,
      ),
    ],
    [
      Markup.button.url(
        `📈 Coinglass chart: ${symbol}`,
        `https://www.coinglass.com/tv/ru/Bybit_${symbol}`,
      ),
    ],
    [
      Markup.button.url(
        `🔭 TV ideas: ${symbol}`,
        `https://www.tradingview.com/symbols/${symbol}/ideas`,
      ),
    ],
    [
      Markup.button.url(
        `📟 Bybit: ${symbol}`,
        `https://bybit.onelink.me/EhY6?af_web_dp=https://www.bybit.com/trade/usdt/${symbol}&af_xp=custom&pid=tradegpt&c=tele_share&af_dp=bybitapp://open/home?tab=2&symbol=${symbol}&page=chart&type=usdt&&source=GPT&orderType=Limit&af_force_deeplink=true`,
      ),
    ],
    [Markup.button.callback(`🗑 Delete ${symbol}`, `delete-ticker/${symbol}`)],
  ];
  //render
  if (editMessageText) {
    await ctx.editMessageText(message, {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard(buttons),
    });
  } else {
    await ctx.replyWithHTML(message, Markup.inlineKeyboard(buttons));
  }
};
// paginate
export const showTickersPage = async (
  ctx,
  tickers,
  lastVisibleId,
  firstVisibleId,
  hasPrev,
  hasNext,
  edit = true,
  tab,
) => {
  let message = `${tab} tickers ${new Date().toLocaleString("ru-RU")}\n`;
  const keyboardArray = [];
  // upload btn deprecated!!!
  // keyboardArray.push([
  //   Markup.button.callback("Upload Tickers", "upload-tickers"),
  // ]);
  tickers?.forEach((ticker) => {
    keyboardArray.push([
      Markup.button.callback(
        `${ticker.trading ? "🟢" : "🔴"}`,
        `edit-ticker-bool/${ticker.symbol}/trading/${!ticker.trading}/redirect`,
      ),
      Markup.button.callback(
        `${ticker.openLong ? "↗️ Long" : "↘️ Short"}`,
        `edit-ticker-bool/${ticker.symbol}/openLong/${!ticker.openLong}/redirect`,
      ),
      Markup.button.callback(
        `${ticker.symbol}`,
        `show-ticker/${ticker.symbol}`,
      ),
    ]);
  });
  // todo hide prev next
  const keyboardPrevNext = [];
  if (hasPrev) {
    keyboardPrevNext.push(
      Markup.button.callback(
        "⬅️ Previous",
        `show-tickers/prev/${firstVisibleId}/${tab}`,
      ),
    );
  }

  if (hasNext) {
    keyboardPrevNext.push(
      Markup.button.callback(
        "Next ➡️",
        `show-tickers/next/${lastVisibleId}/${tab}`,
      ),
    );
  }
  if (keyboardPrevNext.length) {
    keyboardArray.push(keyboardPrevNext);
  }
  const inlineKeyboard = Markup.inlineKeyboard(keyboardArray);
  if (edit) {
    await ctx.editMessageText(message, {
      parse_mode: "HTML",
      ...inlineKeyboard,
    });
  } else {
    await ctx.replyWithHTML(message, inlineKeyboard);
  }
};
