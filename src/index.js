// firestore database
import dotenv from "dotenv";
import { Telegraf } from "telegraf";
import express from "express";
import inlineButtonRouter from "./routers/inlineButtonRouter.js";
import textMessageRouter from "./routers/textMessageRouter.js";
import { tasks } from "./schedule.js";

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 3000;
// mutators
bot.use((ctx, next) => {
  ctx.state.isAdmin = ctx.from.id === 94899148;
  // userId must be string for firestore database
  ctx.from.id = ctx.from.id.toString();
  return next();
});
// for inline bts
bot.on("callback_query", (ctx) => {
  //console.log(ctx.callbackQuery.data);
  inlineButtonRouter(ctx);
});
textMessageRouter(bot);
// cron 1 min update
// Express routes
// app.get("/", (req, res) => res.send("Crypto Price Alert Bot is running."));
const SECRET_PATH = `/bybit-bot`;
app.use(bot.webhookCallback(SECRET_PATH));

// set webhook to bot
// bot.telegram.setWebhook(`https://dev.rzk.com.ru${SECRET_PATH}`);
// Cron tasks
tasks(bot);
app.listen(PORT, () => console.log(`Bot is running on port ${PORT}`));
// Enable graceful stop
// const gracefulStop = (signal) => {
//   console.log(`Bot and server stopped gracefully (${signal})`);
//   bot.stop(signal);
//   server.close(() => console.log("HTTP server closed"));
// };

// process.once("SIGINT", () => gracefulStop("SIGINT"));
// process.once("SIGTERM", () => gracefulStop("SIGTERM"));
