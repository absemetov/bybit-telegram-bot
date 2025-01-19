import { Markup } from "telegraf";
import { formatNumber } from "../helpers/functions.js";
export const showTickerPage = async (
  ctx,
  symbol,
  ticker,
  TickersPreviousPage,
  editMessageText = true,
) => {
  let message =
    `${ticker.favorites ? "❤️" : ""} <b>${symbol} <code>${ticker.lastPrice}</code>$ (${ticker.price24hPcnt > 0 ? "↗️" : "🔻"}${formatNumber(ticker.price24hPcnt)}%)</b>\n` +
    `<b>Message:</b> ${ticker.message}`;
  const buttons = [
    [Markup.button.callback("⤴️ <Back", TickersPreviousPage)],
    [
      Markup.button.callback(
        `${ticker.favorites ? "❤️ Favorites" : "Add to favorites"}`,
        `edit-ticker/${symbol}/favorites/${!ticker.favorites}`,
      ),
    ],
    [
      Markup.button.callback(
        `📃 Edit message`,
        `edit-ticker/${symbol}/message`,
      ),
    ],
    [Markup.button.callback(`🗑 Delete ${symbol}`, `delete-ticker/${symbol}`)],
    [Markup.button.url(`${symbol}`, `https://bybit.rzk.com.ru/t/${symbol}`)],
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
  favorites = false,
) => {
  let message = `${favorites ? "Your ❤️ favorites tickers" : "Your tickers"} ${new Date().toLocaleString("ru-RU")}\n`;
  const keyboardArray = [];
  // upload btn deprecated!!!
  // keyboardArray.push([
  //   Markup.button.callback("Upload Tickers", "upload-tickers"),
  // ]);
  tickers?.forEach((ticker) => {
    keyboardArray.push([
      Markup.button.callback(
        `${ticker.favorites ? "❤️" : ""} ${ticker.symbol} ${ticker.lastPrice}$ (${ticker.price24hPcnt > 0 ? "↗️" : "🔻"}${formatNumber(ticker.price24hPcnt)}%)`,
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
        `show-tickers/prev/${firstVisibleId}/${favorites}`,
      ),
    );
  }

  if (hasNext) {
    keyboardPrevNext.push(
      Markup.button.callback(
        "Next ➡️",
        `show-tickers/next/${lastVisibleId}/${favorites}`,
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
