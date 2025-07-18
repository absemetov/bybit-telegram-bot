//import Scan from "../models/Scan.js";
import { Markup } from "telegraf";
import Ticker from "../models/Ticker.js";
import { getCandles, convertCandles } from "../helpers/bybitV5.js";
import { checkLevels } from "../helpers/levels.js";
import Indicators from "../helpers/indicators.js";

export const checkAlerts = async (bot) => {
  try {
    //const interval = "1min";
    const interval = "15min";
    const tickerNotifyArray = [];
    let direction = null;
    let lastVisibleId = null;
    //"alerts" or "all" "favorites"
    do {
      const paginate = await Ticker.paginate(
        50,
        direction,
        lastVisibleId,
        "all",
      );
      for (const ticker of paginate.tickers) {
        const { symbol, alert, priceScale } = ticker;
        //get candles
        //reverse!!! old->new
        const candlesArray = await getCandles(symbol, interval, 1000);
        //calc indicators 1h
        if (candlesArray.length < 1000) {
          continue;
        }
        const currentPrice = candlesArray[candlesArray.length - 1].close;
        const candles1h = convertCandles(candlesArray, "1h");
        const rsiData = Indicators.calculateRSI(candles1h);
        // const ema9Data = Indicators.calculateEMA(candles1h, 9);
        // const ema21Data = Indicators.calculateEMA(candles1h, 21);
        const currentRsi = rsiData[rsiData.length - 1].value;
        // const currentEma9 = ema9Data[ema9Data.length - 1].value;
        // const currentEma21 = ema21Data[ema21Data.length - 1].value;
        // const currentEma9Prev = ema9Data[ema9Data.length - 2].value;
        // const currentEma21Prev = ema21Data[ema21Data.length - 2].value;
        //CHECK LEVELS, TODO create orders near level Buy stop and Sell stop!!!
        //calc Levels
        //const { candlesCount, tolerancePercent, touchCount } = patterns.levels;
        const candlesLevelSlice = candles1h.slice(-16);
        const { support, resistance } = Indicators.calculateLevels(
          candlesLevelSlice,
          1.5,
          4,
        );
        await checkLevels(
          ticker,
          candles1h,
          bot,
          support,
          resistance,
          currentRsi,
        );
        //check indicators
        const {
          lastNotified = null,
          alertIndex = null,
          priceLevel = 0,
        } = await Ticker.getAlertMessage(symbol);
        const { high, low, localTime } = candlesArray[candlesArray.length - 1];
        const alerts = await Ticker.getOnlyAlerts(symbol);
        const timestampSeconds = Math.round(Date.now() / 1000);
        const silent10min =
          !lastNotified || timestampSeconds - lastNotified._seconds >= 60 * 20;
        const newPriceLevelSupport =
          (!priceLevel && !support) ||
          (Math.abs(priceLevel - support) / support) * 100 > 0.5;
        const newPriceLevelResistance =
          (!priceLevel && !support) ||
          (Math.abs(priceLevel - resistance) / resistance) * 100 > 0.5;
        //support zone
        if (
          Math.abs((currentPrice - support) / support) * 100 <= 0.5 &&
          currentRsi < 100 &&
          newPriceLevelSupport
        ) {
          //telegram bybit channel -1002687531775 absemetov 94899148
          await bot.telegram.sendMessage(
            "-1002687531775",
            `<code>${symbol.slice(0, -4)}</code> <b>[#SUPPORT ZONE] ${support.toFixed(priceScale)}$ RSI ${currentRsi.toFixed(2)}% 1h</b>\n` +
              `#${symbol.slice(0, -4)} #${symbol}`,
            {
              parse_mode: "HTML",
              ...Markup.inlineKeyboard([
                [Markup.button.callback(`🗑 Delete message`, "delete/msg")],
                [
                  Markup.button.url(
                    `${symbol} chart`,
                    `https://bybit-telegram-bot.pages.dev/${symbol}/1h`,
                  ),
                ],
              ]),
            },
          );
          tickerNotifyArray.push({
            symbol,
            data: {
              lastNotified: new Date(),
              alertIndex: 6,
              priceLevel: support,
            },
          });
        }
        //resistance
        if (
          Math.abs((currentPrice - resistance) / resistance) * 100 <= 0.5 &&
          currentRsi > 0 &&
          newPriceLevelResistance
        ) {
          await bot.telegram.sendMessage(
            "-1002687531775",
            `<code>${symbol.slice(0, -4)}</code> <b>[#RESISTANCE ZONE] ${resistance.toFixed(priceScale)}$ RSI ${currentRsi.toFixed(2)}% 1h</b>\n` +
              `#${symbol.slice(0, -4)} #${symbol}`,
            {
              parse_mode: "HTML",
              ...Markup.inlineKeyboard([
                [Markup.button.callback(`🗑 Delete message`, "delete/msg")],
                [
                  Markup.button.url(
                    `${symbol} chart`,
                    `https://bybit-telegram-bot.pages.dev/${symbol}/1h`,
                  ),
                ],
              ]),
            },
          );
          tickerNotifyArray.push({
            symbol,
            data: {
              lastNotified: new Date(),
              alertIndex: 6,
              priceLevel: resistance,
            },
          });
        }
        // //ema9 ema21
        // if (
        //   currentEma9Prev < currentEma21Prev &&
        //   currentEma9 > currentEma21 &&
        //   silent10min
        // ) {
        //   await bot.telegram.sendMessage(
        //     94899148,
        //     `<code>${symbol.slice(0, -4)}</code> <b>[SIGNAL LONG EMA9/EMA21 RSI ${currentRsi.toFixed(2)}% 1h]</b>\n` +
        //       `#${symbol.slice(0, -4)} #ALERT_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
        //     {
        //       parse_mode: "HTML",
        //       ...Markup.inlineKeyboard([
        //         [Markup.button.callback(`🗑 Delete message`, "delete/msg")],
        //       ]),
        //     },
        //   );
        //   tickerNotifyArray.push({
        //     symbol,
        //     data: {
        //       lastNotified: new Date(),
        //       alertIndex: 6,
        //     },
        //   });
        // }
        // if (
        //   currentEma9Prev > currentEma21Prev &&
        //   currentEma9 < currentEma21 &&
        //   silent10min
        // ) {
        //   await bot.telegram.sendMessage(
        //     94899148,
        //     `<code>${symbol.slice(0, -4)}</code> <b>[SIGNAL SHORT EMA9/EMA21 RSI ${currentRsi.toFixed(2)}%] 1h</b>\n` +
        //       `#${symbol.slice(0, -4)} #ALERT_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
        //     {
        //       parse_mode: "HTML",
        //       ...Markup.inlineKeyboard([
        //         [Markup.button.callback(`🗑 Delete message`, "delete/msg")],
        //       ]),
        //     },
        //   );
        //   tickerNotifyArray.push({
        //     symbol,
        //     data: {
        //       lastNotified: new Date(),
        //       alertIndex: 6,
        //     },
        //   });
        // }
        if (alert) {
          //todo check RSI[5,6]
          for (const [index, value] of alerts.alerts.entries()) {
            if (index > 5) {
              if ((Math.abs(value - currentRsi) / currentRsi) * 100 < 0.2) {
                if (silent10min) {
                  await bot.telegram.sendMessage(
                    94899148,
                    `<code>${symbol.slice(0, -4)}</code> <b>[ALERT RSI CROSS ${value.toFixed(2)}]</b>\n` +
                      `#${symbol.slice(0, -4)} #ALERT_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
                    {
                      parse_mode: "HTML",
                      ...Markup.inlineKeyboard([
                        [
                          Markup.button.callback(
                            `🗑 Delete message`,
                            "delete/msg",
                          ),
                        ],
                      ]),
                    },
                  );
                  tickerNotifyArray.push({
                    symbol,
                    data: {
                      lastNotified: new Date(),
                      alertIndex: index + 1,
                    },
                  });
                }
              }
            }
          }
          //check alerts [0,5]
          for (const [index, value] of alerts.alerts.entries()) {
            if (low <= value && value <= high && index <= 5) {
              if (silent10min || alertIndex !== index + 1) {
                await bot.telegram.sendMessage(
                  94899148,
                  `<b><code>${symbol.slice(0, -4)}</code> #${index + 1} Alert cross at ${value.toFixed(priceScale)}$ ` +
                    `${localTime} ${interval} candle</b> #ALERT_${symbol.slice(0, -4)}\n/${symbol}`,
                  {
                    parse_mode: "HTML",
                    ...Markup.inlineKeyboard([
                      [
                        Markup.button.callback(
                          `🗑 Delete message`,
                          "delete/msg",
                        ),
                      ],
                    ]),
                  },
                );
                tickerNotifyArray.push({
                  symbol,
                  data: {
                    lastNotified: new Date(),
                    alertIndex: index + 1,
                  },
                });
              }
            }
          }
        }
      }
      direction = paginate.hasNext ? "next" : null;
      lastVisibleId = paginate.lastVisibleId;
      await Ticker.sendNotifyAlert(tickerNotifyArray);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } while (direction);
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error in cron job checkAlerts:`,
      error.message,
    );
    console.log(error);
    await bot.telegram.sendMessage(
      94899148,
      `Error in Check Alerts and Levels ${error}`,
      {
        parse_mode: "HTML",
      },
    );
  }
};
