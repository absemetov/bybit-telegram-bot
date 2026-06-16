import { checkTriggers } from "./checkAlerts.js";

// export const tasks = () => {
//   let isProcessing1min = false;
//   setInterval(async () => {
//     if (!isProcessing1min) {
//       isProcessing1min = true;
//       console.log(`[1min] Экстренное сканирование запущено`);
//       await checkTriggers();
//       isProcessing1min = false;
//     }
//   }, 1000);
// };

let isRunning = true;       // флаг состояния
let intervalId = null;      // идентификатор таймера
let isProcessing = false;

// Основная функция сканирования (одиночный проход)
async function checkTriggersOnce() {
  if (isProcessing) return;
  isProcessing = true;
  try {
    console.log(`[1min] Экстренное сканирование запущено`);
    await checkTriggers();   // ваша существующая функция
  } finally {
    isProcessing = false;
  }
}

// Запустить циклическое сканирование
function startScanner() {
  if (intervalId) return;   // уже запущен
  isRunning = true;
  intervalId = setInterval(checkTriggersOnce, 1000);
  console.log('[Scanner] Started');
}

// Остановить сканирование
function stopScanner() {
  if (!intervalId) return;  // уже остановлен
  clearInterval(intervalId);
  intervalId = null;
  isRunning = false;
  console.log('[Scanner] Stopped');
}

// Получить текущий статус
function getScannerStatus() {
  return isRunning;
}

// Экспортируем функции управления
export { startScanner, stopScanner, getScannerStatus };