import Session from "../models/Session.js";
import {
  viewTickers,
  showTicker,
  getAllOrders,
} from "../actions/tickerActions.js";
import { showAllScans } from "../actions/scanActions.js";
import {
  handleCreateTicker,
  handleTickerInput,
} from "../handlers/setTicker.js";
import { handleEditTickerField } from "../handlers/editTicker.js";
import { handleEditScanField } from "../handlers/editScan.js";

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
  //create New ticker upload deprecated!!!
  bot.command("addtickers", async (ctx) => {
    await handleCreateTicker(ctx);
  });
  //show tickers
  bot.command("tickers", async (ctx) => {
    await viewTickers(ctx, { edit: false, tab: "all" });
  });
  //star coins
  bot.command("favorites", async (ctx) => {
    await viewTickers(ctx, { edit: false, tab: "favorites" });
  });
  //show alerts
  bot.command("alerts", async (ctx) => {
    await viewTickers(ctx, { edit: false, tab: "alerts" });
  });
  //show cron jobs
  bot.command("cron", async (ctx) => {
    await showAllScans(ctx);
  });
  //show limit orders
  bot.command("orders", async (ctx) => {
    await getAllOrders(ctx, { edit: false });
  });
  //show all positions
  bot.command("positions", async (ctx) => {
    await showAllScans(ctx);
  });
  //show ticker
  bot.hears(/^\/(\w+)$/, async (ctx) => {
    const symbolTxt = ctx.match[1].toUpperCase();
    // const symbol = /^(\w+)USDT/.test(symbolTxt)
    //   ? symbolTxt
    //   : symbolTxt + "USDT";
    const symbol = symbolTxt.endsWith("USDT") ? symbolTxt : symbolTxt + "USDT";
    // todo use endsWith
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
    if (session.sessionData.scene === "editScan") {
      await handleEditScanField(ctx, session);
    }
  });
};

export default textMessageRouter;
