import { checkTriggers } from "./checkAlerts.js";

export const tasks = () => {
  let isProcessing1min = false;
  setInterval(async () => {
    if (!isProcessing1min) {
      isProcessing1min = true;
      console.log(`[1min] Экстренное сканирование запущено`);
      await checkTriggers();
      isProcessing1min = false;
    }
  }, 1000);
};
