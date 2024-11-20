import cron from "node-cron";
import { checkAlertsAndSubscriptions } from "./helpers/checkAlertsAndSubscriptions.js";
import { analyticCoinCandles } from "./helpers/checkTickersPump.js";

export const tasks = (bot) => {
  //1min alert notify
  cron.schedule("0 * * * * *", async () => {
    await checkAlertsAndSubscriptions(bot);
  });
  // 15min frame 1-9 chunk 6-23h
  cron.schedule(
    "15 1-9,16-25,31-40,46-55 6-23 * * *",
    async () => {
      await analyticCoinCandles(bot, "15min", 50);
    },
    {
      timezone: "Europe/Moscow",
    },
  );
  // // 30min frame 1-9 chunk
  cron.schedule(
    "30 1-9,31-40 6-23 * * *",
    async () => {
      await analyticCoinCandles(bot, "30min", 50);
    },
    {
      timezone: "Europe/Moscow",
    },
  );
  // 1h frame
  cron.schedule(
    "45 1-9 6-23 * * *",
    async () => {
      await analyticCoinCandles(bot, "1h", 50);
    },
    {
      timezone: "Europe/Moscow",
    },
  );
  // 4h frame
  cron.schedule(
    "0 1-9 3,7,11,15,19,23 * * *",
    async () => {
      await analyticCoinCandles(bot, "4h", 50);
    },
    {
      timezone: "Europe/Moscow",
    },
  );
  // 6h frame
  cron.schedule(
    "15 1-9 3,9,15,21 * * *",
    async () => {
      await analyticCoinCandles(bot, "6h", 50);
    },
    {
      timezone: "Europe/Moscow",
    },
  );
  // 12h frame
  cron.schedule(
    "30 1-9 3,15 * * *",
    async () => {
      await analyticCoinCandles(bot, "12h", 50);
    },
    {
      timezone: "Europe/Moscow",
    },
  );
  // 1d frame
  cron.schedule(
    "45 1-9 3 * * *",
    async () => {
      await analyticCoinCandles(bot, "1d", 50);
    },
    {
      timezone: "Europe/Moscow",
    },
  );
  // 1w timeframe on Monday
  cron.schedule(
    "0 1-9 3 * * 1",
    async () => {
      await analyticCoinCandles(bot, "1w", 50);
    },
    {
      timezone: "Europe/Moscow",
    },
  );
};
