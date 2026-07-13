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
              triggersBuy = {},
              triggersSell = {},
              lastNotified,
              algoSettings = {},
            } = ticker;
            const {
              attemptsCount = 0,
              timeframe = "4h",
              tolerance = 0.15,
              candlesCount = 5,
              touchCount = 3,
              candlesPart = 0.5,
              size = 1000,
              triggersCount = 3,
              trend = "up",
            } = algoSettings;
            const bybit = bybitUsers[user];
            //get timeframe candles
            const candles = await bybit.getCandles(
              symbol,
              timeframe,
              candlesCount,
            );
            if (candles.length === 0) {
              continue;
            }
            const { close } = candles[candles.length - 1];
            const triggersArrayBuy = Object.entries(triggersBuy);
            const triggersArraySell = Object.entries(triggersSell);
            const toleranceTrigger = 0.1;
            //activate triggers
            const triggersRunBuy = triggersArrayBuy.find((trigger) => {
              return (
                trigger[1].size > 0 &&
                trigger[1].active &&
                (trigger[1].price - close) / close >= toleranceTrigger / 100
              );
            });
            const triggersRunSell = triggersArraySell.find((trigger) => {
              return (
                trigger[1].size > 0 &&
                trigger[1].active &&
                (trigger[1].price - close) / close <= -toleranceTrigger / 100
              );
            });
            //attempts from [0-5] algotrading
            if (attemptsCount <= 5) {
              await algoTrading(
                ticker,
                close,
                bybit,
                user,
                trend,
                triggersRunBuy,
                triggersRunSell,
              );
            }
            //set new triggers
            const { support, resistance } = Indicators.calculateLevels(
              candles,
              touchCount,
              candlesPart,
            );
            const triggerSupport =
              triggersArrayBuy.length === 0 ||
              triggersArrayBuy.find((trigger) => {
                return (
                  trigger[0] === "3" &&
                  Math.abs(trigger[1].price - support) / support >
                    toleranceTrigger / 100
                );
              });
            const triggerResistance =
              triggersArraySell.length === 0 ||
              triggersArraySell.find((trigger) => {
                return (
                  trigger[0] === "3" &&
                  Math.abs(trigger[1].price - resistance) / resistance >
                    toleranceTrigger / 100
                );
              });
            //support zone
            if (support && triggerSupport && ["up", "flat"].includes(trend)) {
              await Ticker.setTriggers(
                symbol,
                support,
                user,
                tolerance,
                size,
                triggersCount,
                "Buy",
              );
            }
            //resistance zone
            if (
              resistance &&
              triggerResistance &&
              ["down", "flat"].includes(trend)
            ) {
              await Ticker.setTriggers(
                symbol,
                resistance,
                user,
                tolerance,
                size,
                triggersCount,
                "Sell",
              );
            }
            //only alert [6]
            if (attemptsCount === 6) {
              const timestampSeconds = Math.round(Date.now() / 1000);
              const silent10min =
                !lastNotified ||
                timestampSeconds - lastNotified._seconds >= 600;
              if (triggersRunBuy && silent10min) {
                await bot.sendMessage({
                  text:
                    `🔔[${user}] html<code>${symbol.slice(0, -4)}</code>html\n` +
                    `Trigger Buy #${triggersRunBuy[0]} cross price ${triggersRunBuy[1].price.toFixed(priceScale)}$, toleranceTriggerUp: ${toleranceTrigger}%\n` +
                    `#${symbol.slice(0, -4)}_trigger`,
                });
                arrayNotify.push({
                  symbol,
                  data: {
                    [`${user}LastNotified`]: new Date(),
                  },
                });
              }
              if (triggersRunSell && silent10min) {
                await bot.sendMessage({
                  text:
                    `🔔[${user}] html<code>${symbol.slice(0, -4)}</code>html\n` +
                    `Trigger Sell Buy #${triggersRunSell[0]} cross price ${triggersRunSell[1].price.toFixed(priceScale)}$, toleranceTriggerUp: ${toleranceTrigger}%\n` +
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
      `[${new Date().toISOString()}] Error in checkAlerts:`,
      error.message,
    );
    await bot.sendMessage({
      text: `Error in checkAlerts ${error.message}`,
    });
  }
};
