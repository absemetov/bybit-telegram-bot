//import Scan from "../models/Scan.js";
import { Markup } from "telegraf";
import Ticker from "../models/Ticker.js";
import { getCandles } from "../helpers/bybitV5.js";
import { checkLevels } from "../helpers/levels.js";

export const checkAlerts = async (bot) => {
  try {
    //const interval = "1min";
    const interval = "1h";
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
        const { symbol, alert, priceScale, trading } = ticker;
        //get candles
        //reverse!!! old->new
        const candlesArray = await getCandles(symbol, interval, 100);
        //CHECK LEVELS, TODO create orders near level Buy stop and Sell stop!!!
        if (candlesArray.length > 5 && trading) {
          await checkLevels(ticker, candlesArray, bot);
        }
        //check pre last candle
        if (candlesArray.length > 1 && alert) {
          const { lastNotified = null, alertIndex = null } =
            await Ticker.getAlertMessage(symbol);
          const { high, low, localTime } =
            candlesArray[candlesArray.length - 1];
          const timestampSeconds = Math.round(Date.now() / 1000);
          //check alerts
          const alerts = await Ticker.getOnlyAlerts(symbol);
          for (const [index, value] of alerts.alerts.entries()) {
            if (low <= value && value <= high) {
              const silent60min =
                !lastNotified ||
                timestampSeconds - lastNotified._seconds >= 60 * 60 ||
                alertIndex !== index + 1;
              if (silent60min) {
                await bot.telegram.sendMessage(
                  94899148,
                  `<b><code>${symbol.slice(0, -4)}</code> #${index + 1} Alert cross at ${value.toFixed(priceScale)}$ ` +
                    `${localTime} ${interval} candle</b> #ALERT_${symbol.slice(0, -4)}\n/${symbol}`,
                  {
                    parse_mode: "HTML",
                    ...Markup.inlineKeyboard([
                      [
                        Markup.button.url(
                          symbol,
                          `https://bybit.rzk.com.ru/chart/${symbol}/30min`,
                        ),
                      ],
                      [
                        Markup.button.url(
                          `📈 Tradingview chart: ${symbol}`,
                          `https://www.tradingview.com/chart/8qtrvOgg/?symbol=BYBIT:${symbol}.P&interval=D`,
                        ),
                      ],
                      [
                        Markup.button.url(
                          `📈 Coinglass chart: ${symbol}`,
                          `https://www.coinglass.com/tv/ru/Bybit_${symbol}`,
                        ),
                      ],
                      [
                        Markup.button.url(
                          `📟 Bybit: ${symbol}`,
                          `https://bybit.onelink.me/EhY6?af_web_dp=https://www.bybit.com/trade/usdt/${symbol}&af_xp=custom&pid=tradegpt&c=tele_share&af_dp=bybitapp://open/home?tab=2&symbol=${symbol}&page=chart&type=usdt&&source=GPT&orderType=Limit&af_force_deeplink=true`,
                        ),
                      ],
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
      //notify user
      await Ticker.sendNotifyAlert(tickerNotifyArray);
      //save levels
      //await Ticker.saveLevelAlertBatch(tickerLevelArray);
      // Пауза между пагинациями 1sec
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
