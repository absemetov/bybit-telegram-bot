import Session from "../models/Session.js";
import { viewTickers, showTicker } from "../actions/tickerActions.js";
import {
  handleCreateTicker,
  handleTickerInput,
} from "../handlers/setTicker.js";
import { handleEditTickerField } from "../handlers/editTicker.js";
import { message } from "telegraf/filters";

const textMessageRouter = (bot) => {
  bot.start(async (ctx) => {
    //share
    const symbol = ctx.message.text.substring(7);
    if (symbol) {
      await showTicker(ctx, { symbol, clear: true, editMessageText: false });
    } else {
      await ctx.replyWithHTML("Welcome to the <b>Crypto</b> Price Alert Bot!");
    }
  });
  //upload and show tickers NEW
  //create New ticker upload deprecated!!!
  bot.command("addtickers", async (ctx) => {
    await handleCreateTicker(ctx);
  });
  //show tickers
  bot.command("tickers", async (ctx) => {
    await viewTickers(ctx, { edit: false });
  });
  //show favorites
  bot.command("favorites", async (ctx) => {
    await viewTickers(ctx, { edit: false, favorites: true });
  });
  //show ticker
  bot.hears(/^\/(\w+)$/, async (ctx) => {
    const symbolTxt = ctx.match[1].toUpperCase();
    const symbol = /^(\w+)USDT/.test(symbolTxt)
      ? symbolTxt
      : symbolTxt + "USDT";
    await showTicker(ctx, { symbol, clear: true, editMessageText: false });
  });
  //sessions text
  bot.on(message("text"), async (ctx) => {
    const session = await Session.findById(ctx.from.id, "bybit-scene");
    if (!session.sessionData.scene) {
      return ctx.reply("Please use commands /addtickers /tickers");
    }
    //New Ticker
    if (session.sessionData.scene === "createTicker") {
      await handleTickerInput(ctx, session);
    }
    if (session.sessionData.scene === "editTicker") {
      await handleEditTickerField(ctx, session);
    }
  });
};

export default textMessageRouter;
