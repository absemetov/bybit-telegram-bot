import Indicators from "../helpers/indicators.js";
import { getActiveSymbols } from "../helpers/bybitV5.js";
//import { uploadDataToAlgolia } from "../helpers/algoliaIndex.js";
import Ticker from "../models/Ticker.js";
//import Scan from "../models/Scan.js";
import { Markup } from "telegraf";

import { getCandles } from "../helpers/bybitV5.js";
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
  if (timeframe === "1d") {
    let cursor = null;
    //await configureAlgoliaIndex();
    do {
      const { tickers, nextCursor } = await getActiveSymbols(cursor, 30);
      //algolia set "1d" for upload
      //await uploadDataToAlgolia(symbols);
      await processBatch(tickers, timeframe, bot);
      cursor = nextCursor;
      // Пауза между пагинациями
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } while (cursor);
    return;
  }
  //my tickers search
  let direction = null;
  let lastVisible = null;
  //search params "alerts" or "all" "favorites"
  do {
    const { tickers, hasNext, lastVisibleId } = await Ticker.paginate(
      20,
      direction,
      lastVisible,
      "all",
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
  //const tickerChangeArray = [];
  for (const ticker of tickers) {
    try {
      const { symbol } = ticker;
      const candles = await getCandles(symbol, timeframe, 300);
      if (candles.length < 300) {
        continue;
      }
      //calculate indicators levels, rsi, rsiEma
      const { close } = candles[candles.length - 1];
      const arrayNotify = [];
      const { support, resistance, rangePercent } = Indicators.calculateLevels(
        candles.slice(-12),
        4,
      );
      console.log(symbol, support, resistance, rangePercent, close);
      //support zone
      const supportZone =
        Math.abs((close - support) / support) * 100 <= rangePercent;
      if (supportZone) {
        arrayNotify.push({
          tf: `Support zone ${timeframe} Price ${close}$ #support`,
        });
      }
      //resistance
      const resistanceZone =
        Math.abs((close - resistance) / resistance) * 100 < rangePercent;
      if (resistanceZone) {
        //arrayNotify.push({
        //  tf: `Resistance Zone ${timeframe} Price ${close}$ #resistance`,
        //});
      }
      if (arrayNotify.length > 0) {
        //telegram bybit channel -1002687531775 absemetov 94899148
        const info = arrayNotify.map((obj) => Object.values(obj)).join();
        await bot.telegram.sendMessage(
          "-1002687531775",
          `<code>${symbol.slice(0, -4)}</code> <b>[${info}]</b>\n` +
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
  //await Ticker.changeFields(tickerChangeArray);
}
