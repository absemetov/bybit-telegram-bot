import cron from "node-cron";
//import { checkAlertsAndSubscriptions } from "./helpers/checkAlertsAndSubscriptions.js";
import {
  analyticCoinCandles,
  checkAlerts,
} from "./helpers/checkTickersPump.js";

export const tasks = (bot) => {
  //1min alert notify
  //numberPaginate = 1
  cron.schedule("0 * * * * *", async () => {
    await checkAlerts(bot, "5min");
  });
  // 15min frame 1-9 chunk 6-23h
  // "15 1-9,16-25,31-40,46-55 6-23 * * *"
  //TODO paginate tickers!!!!
  //limit paginate 10 tickers
  //numberPaginate = 2, limit paginate 20 tickers per page
  cron.schedule(
    "15 1-2,16-17,31-32,46-47 6-23 * * *",
    async () => {
      await analyticCoinCandles(bot, "15min");
    },
    {
      timezone: "Europe/Moscow",
    },
  );
  // // // 30min frame 1-9 chunk
  //  "30 1-9,31-40 6-23 * * *",
  // cron.schedule(
  //   "30 2,32 6-23 * * *",
  //   async () => {
  //     await analyticCoinCandles(bot, "30min");
  //   },
  //   {
  //     timezone: "Europe/Moscow",
  //   },
  // );
  // // 1h frame
  //"45 1-9 6-23 * * *",
  // cron.schedule(
  //   "45 3 6-23 * * *",
  //   async () => {
  //     await analyticCoinCandles(bot, "1h");
  //   },
  //   {
  //     timezone: "Europe/Moscow",
  //   },
  // );
  // // 4h frame
  // cron.schedule(
  //   "0 1-9 3,7,11,15,19,23 * * *",
  //   async () => {
  //     await analyticCoinCandles(bot, "4h", 50);
  //   },
  //   {
  //     timezone: "Europe/Moscow",
  //   },
  // );
  // // 6h frame
  // cron.schedule(
  //   "15 1-9 3,9,15,21 * * *",
  //   async () => {
  //     await analyticCoinCandles(bot, "6h", 50);
  //   },
  //   {
  //     timezone: "Europe/Moscow",
  //   },
  // );
  // // 12h frame
  // cron.schedule(
  //   "30 1-9 3,15 * * *",
  //   async () => {
  //     await analyticCoinCandles(bot, "12h", 50);
  //   },
  //   {
  //     timezone: "Europe/Moscow",
  //   },
  // );
  // // 1d frame
  //paginate 2 pages!!!
  cron.schedule(
    "45 1-2 3 * * *",
    async () => {
      //await analyticCoinCandles(bot, "1d", 50);
      //set price24h and price24hPcnt
      await checkAlerts(bot, "1d");
    },
    {
      timezone: "Europe/Moscow",
    },
  );
  // // 1w timeframe on Monday
  // cron.schedule(
  //   "0 1-9 3 * * 1",
  //   async () => {
  //     await analyticCoinCandles(bot, "1w", 50);
  //   },
  //   {
  //     timezone: "Europe/Moscow",
  //   },
  // );
};
