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
        "favorites",
      );
      for (const ticker of paginate.tickers) {
        const { symbol, alert, priceScale } = ticker;
        const { lastNotified = null, alertIndex = null } =
          await Ticker.getAlertMessage(symbol);
        const candlesArray = await getCandles(symbol, interval, 600);
        if (candlesArray.length < 600) {
          continue;
        }
        const { close, high, low, localTime } =
          candlesArray[candlesArray.length - 1];
        const alerts = await Ticker.getOnlyAlerts(symbol);
        const timestampSeconds = Math.round(Date.now() / 1000);
        const silent10min =
          !lastNotified || timestampSeconds - lastNotified._seconds >= 60 * 30;
        //get candles
        //reverse!!! old->new
        const arrayNotify = [];
        //scan timeframe array
        const candles1h = convertCandles(candlesArray, "1h");
        const rsiData = Indicators.calculateRSI(candles1h);
        const currentRsi = rsiData[rsiData.length - 1].value;
        const { support, resistance, rangePercent } =
          Indicators.calculateLevels(candles1h.slice(-60), 6);
        const ema21Data = Indicators.calculateEMA(candles1h, 21);
        const currentEma21 = ema21Data[ema21Data.length - 1].value;
        //set default order params
        await checkLevels(ticker, close, bot);
        //ema21 cross price
        const ema21cross =
          Math.abs((currentEma21 - close) / close) * 100 <= 0.1;
        if (ema21cross) {
          arrayNotify.push({
            tf: `ema21cross ${close}$`,
          });
        }
        //support zone
        const supportZone =
          Math.abs((close - support) / support) * 100 <= rangePercent;
        //create order
        if (supportZone && currentRsi < 55) {
          await checkLevels(ticker, close, bot, support, resistance, "long");
        }
        if (supportZone && currentRsi < 55) {
          arrayNotify.push({
            tf: `Support zone 1h ${support.toFixed(priceScale)}$`,
          });
        }
        //resistance
        const resistanceZone =
          Math.abs((close - resistance) / resistance) * 100 < rangePercent;
        //create grid orders short
        if (resistanceZone && currentRsi > 55) {
          await checkLevels(ticker, close, bot, support, resistance, "short");
        }
        if (resistanceZone && currentRsi > 55) {
          arrayNotify.push({
            tf: `Resistance Zone 1h ${resistance.toFixed(priceScale)}$`,
          });
        }
        if (arrayNotify.length > 0 && silent10min) {
          //telegram bybit channel -1002687531775 absemetov 94899148
          const info = arrayNotify.map((obj) => Object.values(obj)).join();
          await bot.telegram.sendMessage(
            "94899148",
            `<code>${symbol.slice(0, -4)}</code> <b>[#INFO ${info}]</b>\n` +
              `#${symbol.slice(0, -4)} #${symbol}`,
            {
              parse_mode: "HTML",
              ...Markup.inlineKeyboard([
                [Markup.button.callback(`🗑 Delete message`, "delete/msg")],
                [
                  Markup.button.url(
                    `${symbol} chart`,
                    `https://bybit.rzk.com.ru/chart/${symbol}/1h`,
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
        // const currentEma9 = ema9Data[ema9Data.length - 1].value;
        // const currentEma21 = ema21Data[ema21Data.length - 1].value;
        // const currentEma9Prev = ema9Data[ema9Data.length - 2].value;
        // const currentEma21Prev = ema21Data[ema21Data.length - 2].value;
        //CHECK LEVELS, TODO create orders near level Buy stop and Sell stop!!!
        //calc Levels
        //const { candlesCount, tolerancePercent, touchCount } = patterns.levels;
        // const analysis = Indicators.analyzeMarketWithRegression(
        //   ema21Data1h.map((v) => v.value),
        //   {
        //     lookbackPeriod: 5,
        //     trendSlopeThreshold: 0.12,
        //   },
        // );
        // //get 1h levels
        //create order when market in flat
        // await checkLevels(
        //   ticker,
        //   currentPrice,
        //   bot,
        //   support,
        //   resistance,
        //   analysis,
        // );
        // //check indicators
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
                    `<code>${symbol.slice(0, -4)}</code> <b>[ALERT RSI 15min CROSS ${value.toFixed(2)}]</b>\n` +
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
                  `<b><code>${symbol.slice(0, -4)}</code> #${index + 1} Alert 15min cross at ${value.toFixed(priceScale)}$ ` +
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
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      direction = paginate.hasNext ? "next" : null;
      lastVisibleId = paginate.lastVisibleId;
      await Ticker.sendNotifyAlert(tickerNotifyArray);
    } while (direction);
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error in cron job checkAlerts:`,
      error.message,
    );
    await bot.telegram.sendMessage(
      94899148,
      `Error in Check Alerts and Levels ${error.message}`,
      {
        parse_mode: "HTML",
      },
    );
  }
};
