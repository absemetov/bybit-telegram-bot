import Indicators from "../helpers/indicators.js";
import {
  getActiveSymbols,
  getCandles,
  convertCandles,
} from "../helpers/bybitV5.js";
//import { uploadDataToAlgolia } from "../helpers/algoliaIndex.js";
import Ticker from "../models/Ticker.js";
import { Markup } from "telegraf";
import { algoTrading, checkPositions } from "../helpers/levels.js";
// Основная функция сканирования
export const runTimeframeScan = async (timeframe, bot) => {
  //const config = await Scan.getConfig(timeframe);
  //let count = 0;
  //let findTickers = 0;
  //bybit all tickers
  //=================
  // let cursor = null;
  // do {
  //   const { symbols, nextCursor } = await getActiveSymbols(cursor, 20);
  //   await processBatch(symbols, timeframe, bot);
  //   //findTickers += response.count;
  //   //count += symbols.length;
  //   cursor = nextCursor;
  //   // Пауза между пагинациями
  //   await new Promise((resolve) => setTimeout(resolve, 1000));
  // } while (cursor);
  //================
  //bybit ALL tickers
  if (timeframe === "======") {
    let cursor = null;
    //await configureAlgoliaIndex();
    do {
      const { tickers, nextCursor } = await getActiveSymbols(cursor, 50);
      //algolia set "1d" for upload
      //await uploadDataToAlgolia(symbols);
      await processBatch(tickers, timeframe, bot);
      cursor = nextCursor;
      // Пауза между пагинациями
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } while (cursor);
  }
  //my tickers search
  let direction = null;
  let lastVisible = null;
  //search params "alerts" or "all" "favorites" "trading"
  let tab = "all";
  if (timeframe === "15min") {
    tab = "trading";
  }
  do {
    const { tickers, hasNext, lastVisibleId } = await Ticker.paginate(
      20,
      direction,
      lastVisible,
      tab,
    );
    await processBatch(tickers, timeframe, bot);
    //findTickers += response.count;
    //count += tickers.length;
    direction = hasNext ? "next" : null;
    lastVisible = lastVisibleId;
    // Пауза между пагинациями 1sec
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } while (direction);
};
// Обработка батча символов
async function processBatch(tickers, timeframe, bot) {
  const arrayNotify = [];
  for (const ticker of tickers) {
    try {
      const { symbol, priceScale, tradingType } = ticker;
      let candles10;
      if (timeframe === "15min") {
        const candles15min = await getCandles(symbol, timeframe, 160);
        candles10 = convertCandles(candles15min, "4h");
      } else {
        candles10 = await getCandles(symbol, timeframe, 10);
      }
      if (candles10.length < 10) {
        continue;
      }
      //calculate indicators levels, rsi, rsiEma
      const { high, low, close } = candles10[candles10.length - 1];
      const longLevels = Indicators.calculateLevels(candles10, 4);
      const shortLevels = Indicators.calculateLevels(candles10.slice(-2), 2);
      //new algo trading
      if (tradingType > 1 && timeframe === "15min") {
        await checkPositions(ticker, close, bot);
        await algoTrading(ticker, longLevels, shortLevels, close, bot);
      }
      //support zone
      let telegramText = "";
      //check cross line
      const supportZone =
        longLevels.support <= high * (1 + 0.5 / 100) &&
        longLevels.support >= low * (1 - 0.5 / 100);
      //get prev level data
      const prevLevel = await Ticker.getLevelMessage(symbol);
      if (supportZone && shortLevels.support > 0) {
        const notify =
          !prevLevel[`levelPriceS${timeframe}`] ||
          Math.abs(prevLevel[`levelPriceS${timeframe}`] - longLevels.support) /
            longLevels.support >=
            2 / 100;
        if (notify) {
          const changePercnt = prevLevel[`levelPriceS${timeframe}`]
            ? ((longLevels.support - prevLevel[`levelPriceS${timeframe}`]) /
                prevLevel[`levelPriceS${timeframe}`]) *
              100
            : 0;
          telegramText = `Support zone ${timeframe} Price ${longLevels.support.toFixed(priceScale)}$ ${changePercnt.toFixed(2)}% #support`;
          arrayNotify.push({
            symbol,
            data: {
              telegramText,
              [`levelPriceS${timeframe}`]: longLevels.support,
              updatedAt: new Date(),
            },
          });
        }
      }
      //resistance
      const resistanceZone =
        longLevels.resistance <= high * (1 + 0.5 / 100) &&
        longLevels.resistance >= low * (1 - 0.5 / 100);
      if (resistanceZone && shortLevels.resistance > 0) {
        const notify =
          !prevLevel[`levelPriceR${timeframe}`] ||
          Math.abs(
            prevLevel[`levelPriceR${timeframe}`] - longLevels.resistance,
          ) /
            longLevels.resistance >=
            2 / 100;
        if (notify) {
          const changePercnt = prevLevel[`levelPriceR${timeframe}`]
            ? ((longLevels.resistance - prevLevel[`levelPriceR${timeframe}`]) /
                prevLevel[`levelPriceR${timeframe}`]) *
              100
            : 0;
          telegramText = `Resistance Zone ${timeframe} Price ${longLevels.resistance.toFixed(priceScale)}$ ${changePercnt.toFixed(2)}% #resistance`;
          arrayNotify.push({
            symbol,
            data: {
              telegramText,
              [`levelPriceR${timeframe}`]: longLevels.resistance,
              updatedAt: new Date(),
            },
          });
        }
      }
      if (telegramText) {
        //telegram bybit channel -1002687531775 absemetov 94899148
        await bot.telegram.sendMessage(
          "-1002687531775",
          `<code>${symbol.slice(0, -4)}</code> <b>[${telegramText}]</b>\n` +
            `#${symbol.slice(0, -4)} #${symbol}`,
          {
            parse_mode: "HTML",
            ...Markup.inlineKeyboard([
              [
                Markup.button.url(
                  `${symbol} chart`,
                  `https://bybit-telegram-bot.pages.dev/${symbol}/1h`,
                ),
              ],
            ]),
          },
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1second pause
    } catch (error) {
      console.error(`Error processing ${ticker.symbol}:`, error.message);
    }
  }
  //save batch
  await Ticker.saveLevelBatch(arrayNotify);
}
