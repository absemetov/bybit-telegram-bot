import { checkTriggers } from "./checkAlerts.js";

let isRunning = false;
let intervalId = null;
let isProcessing = false;

async function checkTriggersOnce() {
  if (isProcessing) return;
  isProcessing = true;
  try {
    console.log(`[1min] Экстренное сканирование запущено`);
    await checkTriggers();
  } finally {
    isProcessing = false;
  }
}

// Запустить циклическое сканирование
function startScanner() {
  if (intervalId) return;
  isRunning = true;
  intervalId = setInterval(checkTriggersOnce, 1000);
  console.log('[Scanner] Started');
}

// Остановить сканирование
function stopScanner() {
  if (!intervalId) return;
  clearInterval(intervalId);
  intervalId = null;
  isRunning = false;
  console.log('[Scanner] Stopped');
}

function getScannerStatus() {
  return isRunning;
}

export { startScanner, stopScanner, getScannerStatus };