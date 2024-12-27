import Session from "../models/Session.js";
import { startMessage } from "../handlers/start.js";
import {
  handlePriceInput,
  handleMessageInput as handleMessageInputAlert,
} from "../handlers/setAlert.js";
import {
  createSubs,
  handleSymbolInput as handleSymbolInputSubscription,
} from "../handlers/setSubscription.js";

import { viewSubscriptions } from "../actions/subscriptionActions.js";
import { viewTickers } from "../actions/tickerActions.js";
import { handlePriceInput as handlePriceInputEditAlert } from "../handlers/editAlert.js";
import { handleEditSubs } from "../handlers/editSubscription.js";
import {
  showScans,
  handleEditScanField,
  scanTickers,
} from "../handlers/editScan.js";
import { createTicker, handleTickerInput } from "../handlers/setTicker.js";
import { handleEditTickerField } from "../handlers/editTicker.js";
import { message } from "telegraf/filters";

const textMessageRouter = (bot) => {
  bot.start((ctx) => {
    startMessage(ctx);
  });
  // create Subs
  bot.command("pump", async (ctx) => {
    await showScans(ctx);
    // pumpForm(ctx);
    // await analyticCoinCandles(bot, "1h", 3, 150, 5, "chunk2");
    // await analyticCoinCandles(bot, "5min", 5);
    // await analyticCoinCandles(bot, "15min", 5);
    // await analyticCoinCandles(bot, "30min", 5);
    // await analyticCoinCandles(bot, "1h", 5);
    //await analyticCoinCandles(bot, "4h", 3, 150, 10, "chunk1");
    //await analyticCoinCandles(bot, "1d", 3, volumeChange, limit);
    // await analyticCoinCandles(bot, "1d", 5);
  });
  //upload and show tickers NEW
  //create New ticker upload deprecated!!!
  bot.command("addticker", async (ctx) => {
    await createTicker(ctx);
  });
  //show tickers
  bot.command("tickers", async (ctx) => {
    await viewTickers(ctx, false);
  });
  // create Subs
  bot.command("create", async (ctx) => {
    // console.log(ctx.from);
    await createSubs(ctx);
    // await checkAlertsAndSubscriptions(ctx)
  });
  // show all coins in new message
  bot.command("list", async (ctx) => {
    await viewSubscriptions(ctx, false);
  });

  bot.on(message("text"), async (ctx) => {
    const session = await Session.findById(ctx.from.id, "bybit-scene");

    if (!session.sessionData.scene) {
      return ctx.reply("Please start a new alert or subscription.");
    }
    // create Subscription scene
    if (session.sessionData.scene === "createSubs") {
      if (session.sessionData.cursor === "symbol")
        await handleSymbolInputSubscription(ctx, session);
    }
    // edit Subscription
    if (session.sessionData.scene === "editSubs") {
      await handleEditSubs(ctx, session);
    }
    // create Alert scene
    if (session.sessionData.scene === "createAlert") {
      if (session.sessionData.cursor === "price")
        await handlePriceInput(ctx, session);
      else if (session.sessionData.cursor === "message")
        await handleMessageInputAlert(ctx, session);
    }
    // edit Alert scene
    if (session.sessionData.scene === "editAlert") {
      await handlePriceInputEditAlert(ctx, session);
    }
    // edit Alert scene
    if (session.sessionData.scene === "editScan") {
      await handleEditScanField(ctx, session);
    }
    // get scan chunk
    if (session.sessionData.scene === "getChunkNumber") {
      await scanTickers(ctx, session);
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
