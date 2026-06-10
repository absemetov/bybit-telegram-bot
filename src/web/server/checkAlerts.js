import Ticker from "./Ticker.js";
import { bybitUsers } from "./bybitV5.js";
import { algoTrading } from "./levels.js";
import Indicators from "./indicators.js";
import bot from "./telegram.js";
//new algotrading and triggers
export const checkTriggers = async () => {
  try {
    for (const user of ["main", "sub"]) {
      let direction = null;
      let lastVisible = null;
      do {
        const { tickers, hasNext, lastVisibleId } = await Ticker.paginate(
          100,
          direction,
          lastVisible,
          "trading",
          user,
        );
        const arrayNotify = [];
        for (const ticker of tickers) {
          try {
            const {
              symbol,
              priceScale,
              triggers = {},
              lastNotified,
              algoSettings = {},
            } = ticker;
            const {
              attemptsCount = 0,
              autoLevelsTf = "off",
              tolerance = 0.05,
              candlesCount = 5,
              touchCount = 3,
            } = algoSettings;
            const bybit = bybitUsers[user];
            //get candles
            const candles = await bybit.getCandles(
              symbol,
              autoLevelsTf === "off" ? "2h" : autoLevelsTf,
              candlesCount,
            );
            if (candles.length === 0) {
              continue;
            }
            const { close } = candles[candles.length - 1];
            const triggersArray = Object.entries(triggers);
            const toleranceTrigger = 0.1;
            //find cross
            const triggersRun = triggersArray.find((trigger) => {
              if (user === "main") {
                return (
                  trigger[1].active &&
                  (trigger[1].price - close) / close >= toleranceTrigger / 100
                );
              } else {
                return (
                  trigger[1].active &&
                  (trigger[1].price - close) / close <= -toleranceTrigger / 100
                );
              }
            });
            //attempts from [0-5] algotrading
            if (attemptsCount <= 5) {
              await algoTrading(
                ticker,
                close,
                bybit,
                user,
                triggersRun,
                attemptsCount,
                triggersArray.filter((t) => t[1].active).length || 1,
              );
            }
            //set new enter levels
            if (autoLevelsTf !== "off") {
              const { support, resistance } = Indicators.calculateLevels(
                candles,
                touchCount,
              );
              const triggerSupport =
                triggersArray.length === 0 ||
                triggersArray.find((trigger) => {
                  return (
                    trigger[0] === "2" &&
                    Math.abs(trigger[1].price - support) / support > 0.5 / 100
                  );
                });
              const triggerResistance =
                triggersArray.length === 0 ||
                triggersArray.find((trigger) => {
                  return (
                    trigger[0] === "2" &&
                    Math.abs(trigger[1].price - resistance) / resistance > 0.5 / 100
                  );
                });
              //support zone
              if (support && triggerSupport && user === "main") {
                await Ticker.setTriggers(
                  symbol,
                  support,
                  resistance,
                  user,
                  tolerance,
                );
                const pricePersent =
                  ((support - triggerSupport[1].price) / triggerSupport[1].price) * 100;
                await bot.sendMessage({
                  text:
                    `🟰[${user}] html<code>${symbol.slice(0, -4)}</code>html\n` +
                    `autoLevels ${autoLevelsTf} Support ${support.toFixed(priceScale)}$` +
                    `(${pricePersent > 0 ? "🔺+" : "🔻"}${pricePersent.toFixed(1)}%)\n` +
                    `#${symbol.slice(0, -4)}_auto`,
                });
              }
              //resistance zone
              if (resistance && triggerResistance && user === "sub") {
                await Ticker.setTriggers(
                  symbol,
                  support,
                  resistance,
                  user,
                  tolerance,
                );
                const pricePersent =
                  ((resistance - triggerResistance[1].price) / triggerResistance[1].price) *
                  100;
                await bot.sendMessage({
                  text:
                    `🟰[${user}] html<code>${symbol.slice(0, -4)}</code>html\n` +
                    `autoLevels ${autoLevelsTf} Resistance ${resistance.toFixed(priceScale)}$` +
                    `(${pricePersent > 0 ? "🔺+" : "🔺"}${pricePersent.toFixed(1)}%)\n` +
                    `#${symbol.slice(0, -4)}_auto`,
                });
              }
            }
            //only alert
            if (attemptsCount === 6) {
              const timestampSeconds = Math.round(Date.now() / 1000);
              const silent10min =
                !lastNotified ||
                timestampSeconds - lastNotified._seconds >= 600;
              if (triggersRun && silent10min) {
                await bot.sendMessage({
                  text:
                    `🔔[${user}] html<code>${symbol.slice(0, -4)}</code>html\n` +
                    `Trigger #${triggersRun[0]} cross price ${triggersRun[1].price.toFixed(priceScale)}$, toleranceTriggerUp: ${toleranceTrigger}%\n` +
                    `#${symbol.slice(0, -4)}_trigger`,
                });
                arrayNotify.push({
                  symbol,
                  data: {
                    [`${user}LastNotified`]: new Date(),
                  },
                });
              }
            }
            //rate limits set pause 1sec!!!
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`Error AlgoTrading ${ticker.symbol}:`, error.message);
            await bot.sendMessage({
              text: `Error in AlgoTrading ${ticker.symbol} ${error.message}`,
            });
          }
        }
        //save batch
        await Ticker.saveBatch(arrayNotify);
        direction = hasNext ? "next" : null;
        lastVisible = lastVisibleId;
      } while (direction);
    }
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error in cron job checkTriggers:`,
      error.message,
    );
    await bot.sendMessage({
      text: `Error in checkAlerts ${error.message}`,
    });
  }
};
