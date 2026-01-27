//import cron from "node-cron";
//import { runTimeframeScan } from "./helpers/checkPumpTickers.js";
//import { db } from "./firebase.js";
import { checkAlerts } from "./helpers/checkAlerts.js";

export const tasks = (bot) => {
  //const jobs = new Map();
  //const queue = [];
  //let isProcessing = false;
  let isProcessing1min = false;
  // every 11 sec scan
  setInterval(async () => {
    if (!isProcessing1min) {
      isProcessing1min = true;
      console.log(`[1min] Экстренное сканирование запущено`);
      await checkAlerts(bot);
      isProcessing1min = false;
    }
  }, 5000);
  // Слушатель изменений в Firestore
  //db.collection("settings")
  //  .doc("scanCronPaginate")
  //  .collection("scanner")
  //  .onSnapshot((snapshot) => {
  //    snapshot.docChanges().forEach((change) => {
  //      const timeframe = change.doc.id;
  //      const config = change.doc.data();
  //      timeframe === "1min"
  //        ? update1minJob(config)
  //        : updateQueuedJob(timeframe, config);
  //    });
  //  });
  // AlgoTrading + Alerts
  //update1minJob({
  //  active: true,
  //  schedule: "*/10 * * * * *",
  //});
  // Scan 4h 1d levels disable
  //updateQueuedJob("4h", {
  //  active: true,
  //  schedule: "16 */15 * * * *",
  //});
  //function update1minJob(config) {
  //  removeJob("1min");
  //  if (config.active && config.schedule) {
  //    const job = cron.schedule(
  //      config.schedule,
  //      async () => {
  //        if (!isProcessing1min) {
  //          isProcessing1min = true;
  //          console.log(`[1min] Экстренное сканирование запущено`);
  //          await checkAlerts(bot);
  //          isProcessing1min = false;
  //        }
  //      },
  //      {
  //        scheduled: true,
  //        timezone: "Europe/Moscow",
  //      },
  //    );
  //    jobs.set("1min", job);
  //    console.log(`[1min] Задача обновлена: ${config.schedule}`);
  //  }
  //}
  // Обновление cron-заданий
  //function updateQueuedJob(timeframe, config) {
  //  removeJob(timeframe);
  //  if (config.active && config.schedule) {
  //    const job = cron.schedule(
  //      config.schedule,
  //      () => {
  //        if (!queue.includes(timeframe)) {
  //          queue.push(timeframe);
  //          console.log(`[Queue] Добавлен ${timeframe}`);
  //          processQueue();
  //        }
  //      },
  //      {
  //        scheduled: true,
  //        timezone: "Europe/Moscow",
  //      },
  //    );
  //    jobs.set(timeframe, job);
  //    console.log(
  //      `[${timeframe}] Задача добавлена в очередь: ${config.schedule}`,
  //    );
  //  }
  //}
  //function removeJob(timeframe) {
  //  if (jobs.has(timeframe)) {
  //    jobs.get(timeframe).stop();
  //    jobs.delete(timeframe);
  //    console.log(`[${timeframe}] Задача удалена`);
  //  }
  //}
  //async function processQueue() {
  //  if (isProcessing || queue.length === 0) return;
  //  isProcessing = true;
  //  const timeframe = queue.shift();
  //  try {
  //    console.log(`[Start] Обработка ${timeframe}`);
  //    await runTimeframeScan(timeframe, bot);
  //    console.log(`[End] Завершено ${timeframe}`);
  //  } catch (error) {
  //    console.error(`[Error] ${timeframe}:`, error);
  //  }
  //  isProcessing = false;
  //  // 1000 = 1second
  //  setTimeout(processQueue, 1000);
  //}
};
