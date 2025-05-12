import { googleSheet } from "../helpers/googleSpreadSheets.js";
import Ticker from "../models/Ticker.js";
import Session from "../models/Session.js";
import { getLimitOrders } from "../helpers/bybitV5.js";
import {
  showTickerPage,
  showTickersPage,
  showTickerIndicators,
  showLimitOrders,
} from "../views/showTickersPage.js";
import { sleep } from "../helpers/helpers.js";
import { analyzeCoin } from "../helpers/checkPumpTickers.js";
//show all limit ordes
export const getAllOrders = async (ctx, params = {}) => {
  const { cursor, symbol, edit = true } = params;
  console.log(cursor, symbol);
  const { orders, nextPageCursor } = await getLimitOrders(cursor, 10, symbol);
  console.log(orders, nextPageCursor);
  await showLimitOrders(ctx, orders, nextPageCursor, edit);
};
//TODO test technical indicators
export const tickerIndicators = async (ctx, params) => {
  const { symbol, interval } = params;
  const indicators = await analyzeCoin(symbol, interval);
  await showTickerIndicators(ctx, symbol, interval, indicators);
};
export const uploadTickersAction = async () => {
  const sheet = await googleSheet(
    "18nQkKStuFuo-_XJcQstYd95O3Ck2ITr0xZ04zBQKHVw",
    "Tickers",
  );
  const perRows = 50;
  const limitRows = 100;
  const setBatchArray = [];
  const deleteBatchArray = [];
  for (let i = 2; i < limitRows; i += perRows) {
    await sheet.loadCells(`A${i}:C${i + perRows}`);
    for (let j = i; j < i + perRows && j < limitRows; j++) {
      const orderNumber = sheet.getCellByA1(`A${j}`).value;
      const symbol = sheet.getCellByA1(`B${j}`).value;
      //const volumePcnt = sheet.getCellByA1(`C${j}`).value;
      if (orderNumber === "delete") {
        deleteBatchArray.push(symbol);
      } else if (orderNumber && symbol) {
        setBatchArray.push({
          symbol,
          data: {
            orderNumber,
            chunkNumber: perRows / perRows,
          },
        });
      }
    }
    //save data
    await Ticker.setBatch(setBatchArray);
    await Ticker.deleteBatch(deleteBatchArray);
    // clear cache
    sheet.resetLocalCache(true);
  }
};
// index page
export const viewTickers = async (ctx, params = {}) => {
  //text params
  const { edit = true, tab = "" } = params;
  const session = new Session(ctx.from.id);
  session.sessionData.TickersPreviousPage = `show-tickers/${tab}`;
  //session.sessionData.favorites = favorites === "true" || favorites === true;
  await session.save();
  const firstPageSnapshot = await Ticker.paginate(10, null, null, tab);
  await showTickersPage(
    ctx,
    firstPageSnapshot.tickers,
    firstPageSnapshot.lastVisibleId,
    firstPageSnapshot.firstVisibleId,
    firstPageSnapshot.hasPrev,
    firstPageSnapshot.hasNext,
    edit,
    tab,
  );
};
// paginate Tickers
export const viewTickersPaginate = async (ctx, params) => {
  const { direction, lastVisibleId, tab } = params;
  const session = new Session(ctx.from.id);
  session.sessionData.TickersPreviousPage = ctx.callbackQuery.data;
  //session.sessionData.favorites = favorites === "true";
  await session.save();
  const tickersSnapshot = await Ticker.paginate(
    10,
    direction,
    lastVisibleId,
    tab,
  );
  await showTickersPage(
    ctx,
    tickersSnapshot.tickers,
    tickersSnapshot.lastVisibleId,
    tickersSnapshot.firstVisibleId,
    tickersSnapshot.hasPrev,
    tickersSnapshot.hasNext,
    true,
    tab,
  );
};
// show ticker info
export const showTicker = async (ctx, params) => {
  const { symbol, clear, editMessageText } = params;
  const session = await Session.findById(ctx.from.id);
  const prevPage = clear
    ? `show-tickers`
    : session.sessionData.TickersPreviousPage;
  const ticker = await Ticker.find(symbol);
  if (ticker) {
    await showTickerPage(ctx, symbol, ticker, prevPage, editMessageText);
  } else {
    ctx.replyWithHTML(`${symbol} not found. /tickers`);
  }
};
// show ticker info
export const editTicker = async (ctx, params) => {
  const { symbol, field, value } = params;
  if (field === "star") {
    await Ticker.updateField(symbol, field, value);
    await showTicker(ctx, { symbol, clear: false, editMessageText: true });
    return;
  }
  const session = new Session(ctx.from.id);
  session.sessionData.symbol = symbol;
  session.sessionData.scene = "editTicker";
  session.sessionData.field = field;
  await session.save("bybit-scene");
  await ctx.replyWithHTML(
    `Editing <b>${symbol}</b>, fieldName <b>${field}</b>. Please enter a new value:`,
  );
  await ctx.answerCbQuery();
};
// delete ticker
export const deleteTicker = async (ctx, params) => {
  const { symbol } = params;
  await Ticker.delete(symbol);
  await ctx.editMessageText(`Ticker ${symbol} deleted successfully.`);
  await sleep(500);
  await viewTickers(ctx);
};
