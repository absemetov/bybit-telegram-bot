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
// Cron tasks
tasks(bot);
// mutators
bot.use(async (ctx, next) => {
  //admin absemetov
  //not channel
  if (!ctx.from) return;
  if (ctx.from.id != 94899148) {
    await ctx.reply("Access Denied!");
    return;
  }
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
bot.catch(async (error) => {
  console.log("Catch error:" + error);
  await bot.telegram.sendMessage(
    94899148,
    `Error in Dev bot ${error.message}`,
    {
      parse_mode: "HTML",
    },
  );
});
// cron 1 min update
// Express routes
// app.get("/", (req, res) => res.send("Crypto Price Alert Bot is running."));
const SECRET_PATH = `/bybit-bot`;
app.use(bot.webhookCallback(SECRET_PATH));

// set webhook to bot
// bot.telegram.setWebhook(`https://dev.rzk.com.ru${SECRET_PATH}`);
app.listen(PORT, () => console.log(`Bot is running on port ${PORT}`));
// Enable graceful stop
// const gracefulStop = (signal) => {
//   console.log(`Bot and server stopped gracefully (${signal})`);
//   bot.stop(signal);
//   server.close(() => console.log("HTTP server closed"));
// };

//process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
