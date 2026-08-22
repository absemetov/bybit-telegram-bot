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
              candlesCount = 4,
              touchesCount = 3,
              candlePart = 4,
              size = 1000,
              triggersCount = 4,
              triggersStep = 0.1,
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
                trigger[1].size > 10 &&
                trigger[1].active &&
                (trigger[1].price - close) / close >= toleranceTrigger / 100
              );
            });
            const triggersRunSell = triggersArraySell.find((trigger) => {
              return (
                trigger[1].size > 10 &&
                trigger[1].active &&
                (trigger[1].price - close) / close <= -toleranceTrigger / 100
              );
            });
            //Anti-degen detector
            if (attemptsCount > 0 && attemptsCount <= 5) {
              const winRate = await bybitUsers[user].getDailyWinRate(1);
              const DAILY_LOSS_LIMIT =
                parseFloat(process.env.DAILY_LOSS_LIMIT) || 50;
              if (winRate[0].totalPnl < -DAILY_LOSS_LIMIT) {
                await Ticker.update(symbol, {
                  [`${user}.attemptsCount`]: 0,
                });
                await bot.sendMessage({
                  text:
                    `☢️[${user}] html<code>${symbol.slice(0, -4)}</code>html\n` +
                    `🛑 Anti-Degen daily loss more ${DAILY_LOSS_LIMIT}$: DailyWinRate is ${winRate[0].totalPnl.toFixed(1)}$. Algotrading stoped!\n` +
                    `#${symbol.slice(0, -4)}_alert`,
                });
              }
            }
            //get s/r levels
            const { support, resistance } = Indicators.calculateLevels(
              candles,
              touchesCount,
              candlePart,
            );
            //Algotrading attempts from [0-5]
            if (attemptsCount <= 5) {
              await algoTrading(
                ticker,
                close,
                bybit,
                user,
                trend,
                triggersRunBuy,
                triggersRunSell,
                support,
                resistance,
              );
            }
            //set new triggers
            const triggerSupport =
              triggersArrayBuy.length === 0 ||
              triggersArrayBuy.find((trigger) => {
                return (
                  trigger[0] === "2" &&
                  Math.abs(trigger[1].price - support) / support >
                    toleranceTrigger / 100
                );
              });
            const triggerResistance =
              triggersArraySell.length === 0 ||
              triggersArraySell.find((trigger) => {
                return (
                  trigger[0] === "2" &&
                  Math.abs(trigger[1].price - resistance) / resistance >
                    toleranceTrigger / 100
                );
              });
            //delete triggers, if no levels
            if (triggersArrayBuy.length > 0 && support === 0) {
              await bybitUsers[user].cancelAllOrders(symbol, "Buy");
              arrayNotify.push({
                symbol,
                data: {
                  [`${user}TriggersBuy`]: {},
                },
              });
            }
            if (triggersArraySell.length > 0 && resistance === 0) {
              await bybitUsers[user].cancelAllOrders(symbol, "Sell");
              arrayNotify.push({
                symbol,
                data: {
                  [`${user}TriggersSell`]: {},
                },
              });
            }
            //support zone
            if (support && triggerSupport && ["up", "flat"].includes(trend)) {
              await Ticker.setTriggers(
                symbol,
                support,
                user,
                triggersStep,
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
                triggersStep,
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
              const triggersAlertBuy = triggersArrayBuy.find((trigger) => {
                return (
                  trigger[1].size > 10 &&
                  trigger[1].active &&
                  Math.abs((trigger[1].price - close) / close) <= 0.5 / 100
                );
              });
              const triggersAlertSell = triggersArraySell.find((trigger) => {
                return (
                  trigger[1].size > 10 &&
                  trigger[1].active &&
                  Math.abs((trigger[1].price - close) / close) <= 0.5 / 100
                );
              });
              if (triggersAlertBuy && silent10min) {
                await bot.sendMessage({
                  text:
                    `🔔[${user}] html<code>${symbol.slice(0, -4)}</code>html\n` +
                    `Trigger Buy #${triggersAlertBuy[0]} cross price ${triggersAlertBuy[1].price.toFixed(priceScale)}$\n` +
                    `#${symbol.slice(0, -4)}_alert`,
                });
                arrayNotify.push({
                  symbol,
                  data: {
                    [`${user}LastNotified`]: new Date(),
                  },
                });
              }
              if (triggersAlertSell && silent10min) {
                await bot.sendMessage({
                  text:
                    `🔔[${user}] html<code>${symbol.slice(0, -4)}</code>html\n` +
                    `Trigger Sell #${triggersAlertSell[0]} cross price ${triggersAlertSell[1].price.toFixed(priceScale)}$\n` +
                    `#${symbol.slice(0, -4)}_alert`,
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
            //await new Promise((resolve) => setTimeout(resolve, 1000));
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
