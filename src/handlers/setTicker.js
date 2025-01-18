import Ticker from "../models/Ticker.js";
import { Markup } from "telegraf";
import Session from "../models/Session.js";

export const handleCreateTicker = async (ctx) => {
  const session = new Session(ctx.from.id);
  session.sessionData.scene = "createTicker";
  await session.save("bybit-scene");
  ctx.replyWithHTML(
    "Please enter the symbols of the cryptocurrency (e.g., <b>BTC\nETH</b>):",
  );
};

export const handleTickerInput = async (ctx, session) => {
  const tickersArray = ctx.message.text.split("\n");
  for (const symbol of tickersArray) {
    const symbolUsdt = symbol.trim().toUpperCase() + "USDT";
    const tickerIsExists = await Ticker.find(symbolUsdt);
    if (tickerIsExists) {
      await ctx.reply(
        `Symbol ${symbolUsdt} is exist, use /s${symbolUsdt} to find it`,
      );
    } else {
      try {
        const numberTicker = await Ticker.create(symbolUsdt);
        await ctx.reply(
          `Ticker ${symbolUsdt} created. Total Tickers Number ${numberTicker} Check in /tickers`,
          Markup.inlineKeyboard([
            [
              Markup.button.callback(
                `Show ticker ${symbolUsdt}`,
                `show-ticker/${symbolUsdt}/clear`,
              ),
            ],
          ]),
        );
      } catch (error) {
        await ctx.reply(error);
      }
    }
  }
  // clear session
  await session.delete("bybit-scene");
};
