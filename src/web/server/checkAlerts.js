import Ticker from "./Ticker.js";
import { bybitUsers, resample1hCandles } from "./bybitV5.js";
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
              lastNotifiedPriceBuy,
              lastNotifiedPriceSell,
              algoSettings = {},
              resistancePrice = 0,
              supportPrice = 0,
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
            const candles = await bybit.getCandles(symbol, timeframe, 100);
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
            if (attemptsCount > 0) {
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
            // get s/r levels
            let { support, resistance } = Indicators.calculateLevels(
              candles.slice(-candlesCount),
              touchesCount,
              candlePart,
            );
            // new 4h 6h 12h levels
            if (timeframe === "1h") {
              const resample = resample1hCandles(candles);
              const level4h = Indicators.calculateLevels(
                resample["candles4h"].slice(-candlesCount),
                touchesCount,
                candlePart,
              );
              const level6h = Indicators.calculateLevels(
                resample["candles6h"].slice(-candlesCount),
                touchesCount,
                candlePart,
              );
              const level12h = Indicators.calculateLevels(
                resample["candles12h"].slice(-candlesCount),
                touchesCount,
                candlePart,
              );
              support = pickBestLevel(
                [level4h["support"], level6h["support"], level12h["support"]],
                1.5,
              );
              resistance = pickBestLevel(
                [
                  level4h["resistance"],
                  level6h["resistance"],
                  level12h["resistance"],
                ],
                1.5,
              );
            }
            // fixed levels 1d
            if (timeframe === "1w") {
              support = supportPrice;
              resistance = resistancePrice;
            }
            //Algotrading attempts from [0-5]
            if (attemptsCount >= 0) {
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
                  trigger[0] === "0" &&
                  Math.abs(trigger[1].price - support) / support >
                    toleranceTrigger / 100
                );
              });
            const triggerResistance =
              triggersArraySell.length === 0 ||
              triggersArraySell.find((trigger) => {
                return (
                  trigger[0] === "0" &&
                  Math.abs(trigger[1].price - resistance) / resistance >
                    toleranceTrigger / 100
                );
              });
            //delete triggers, if no levels
            // if (triggersArrayBuy.length > 0 && support === 0) {
            //   await bybitUsers[user].cancelAllOrders(symbol, "Buy");
            //   arrayNotify.push({
            //     symbol,
            //     data: {
            //       [`${user}TriggersBuy`]: {},
            //     },
            //   });
            // }
            // if (triggersArraySell.length > 0 && resistance === 0) {
            //   await bybitUsers[user].cancelAllOrders(symbol, "Sell");
            //   arrayNotify.push({
            //     symbol,
            //     data: {
            //       [`${user}TriggersSell`]: {},
            //     },
            //   });
            // }
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
            //only alert [0]
            if (attemptsCount === 0) {
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
              if (triggersAlertBuy) {
                const newPriceAlert =
                  !lastNotifiedPriceBuy ||
                  Math.abs(triggersAlertBuy[1].price - lastNotifiedPriceBuy) /
                    lastNotifiedPriceBuy >
                    0.3 / 100;
                if (newPriceAlert) {
                  await bot.sendMessage({
                    text:
                      `🔔[${user}] html<code>${symbol.slice(0, -4)}</code>html\n` +
                      `Trigger Buy #${triggersAlertBuy[0]} cross price ${triggersAlertBuy[1].price.toFixed(priceScale)}$\n` +
                      `Levels ${timeframe} [${candlesCount}/${touchesCount}/${candlePart}]\n` +
                      `Triggers [${triggersCount}/${triggersStep}]\n` +
                      `#${symbol.slice(0, -4)} #alert`,
                  });
                  arrayNotify.push({
                    symbol,
                    data: {
                      [`${user}LastNotifiedPriceBuy`]:
                        triggersAlertBuy[1].price,
                    },
                  });
                }
              }
              if (triggersAlertSell) {
                const newPriceAlert =
                  !lastNotifiedPriceSell ||
                  Math.abs(triggersAlertSell[1].price - lastNotifiedPriceSell) /
                    lastNotifiedPriceSell >
                    0.3 / 100;
                if (newPriceAlert) {
                  await bot.sendMessage({
                    text:
                      `🔔[${user}] html<code>${symbol.slice(0, -4)}</code>html\n` +
                      `Trigger Sell #${triggersAlertSell[0]} cross price ${triggersAlertSell[1].price.toFixed(priceScale)}$\n` +
                      `Levels ${timeframe} [${candlesCount}/${touchesCount}/${candlePart}]\n` +
                      `Triggers [${triggersCount}/${triggersStep}]\n` +
                      `#${symbol.slice(0, -4)} #alert`,
                  });
                  arrayNotify.push({
                    symbol,
                    data: {
                      [`${user}LastNotifiedPriceSell`]:
                        triggersAlertSell[1].price,
                    },
                  });
                }
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

function pickBestLevel(levels, confluencePercent = 0.5) {
  // levels = [level4h, level6h, level12h]
  const valid = levels.filter((l) => l > 0);
  if (valid.length === 0) return 0;
  if (valid.length === 1) return valid[0];

  // Проверяем конфлюэнс: все валидные уровни в одной зоне?
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const spread = ((max - min) / min) * 100;

  if (spread <= confluencePercent) {
    // Конфлюэнс есть — берём среднее
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  }

  // Конфлюэнса нет — берём по приоритету ТФ (4h > 6h > 12h)
  return levels[0] || levels[1] || levels[2];
}
