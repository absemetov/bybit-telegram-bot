import { googleSheet } from "../helpers/googleSpreadSheets.js";
import Ticker from "../models/Ticker.js";
import Session from "../models/Session.js";
import { showTickerPage, showTickersPage } from "../views/showTickersPage.js";
import { sleep } from "../helpers/functions.js";

export const uploadTickersAction = async (ctx) => {
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
    try {
      await Ticker.setBatch(setBatchArray);
      await Ticker.deleteBatch(deleteBatchArray);
    } catch (error) {
      console.log(error);
      ctx.reply(`Error creating ticker: ${error.message}`);
    }
    // clear cache
    sheet.resetLocalCache(true);
  }
  // await ctx.answerCbQuery(
  //   `Scan ${limitRows} rows. ${setBatchArray.length} Tickers added, deleted: ${deleteBatchArray.length}`,
  // );
  //await viewTickers(ctx);
};
// index page
export const viewTickers = async (ctx, edit = true) => {
  const session = new Session(ctx.from.id);
  session.sessionData.TickersPreviousPage = "show-tickers";
  await session.save();
  const firstPageSnapshot = await Ticker.paginate(10);
  await showTickersPage(
    ctx,
    firstPageSnapshot.tickers,
    firstPageSnapshot.lastVisibleId,
    firstPageSnapshot.firstVisibleId,
    firstPageSnapshot.hasPrev,
    firstPageSnapshot.hasNext,
    edit,
  );
};
// paginate Tickers
export const viewTickersPaginate = async (ctx, params) => {
  const session = new Session(ctx.from.id);
  session.sessionData.TickersPreviousPage = ctx.callbackQuery.data;
  await session.save();
  const { direction, lastVisibleId } = params;
  try {
    const tickersSnapshot = await Ticker.paginate(10, direction, lastVisibleId);
    await showTickersPage(
      ctx,
      tickersSnapshot.tickers,
      tickersSnapshot.lastVisibleId,
      tickersSnapshot.firstVisibleId,
      tickersSnapshot.hasPrev,
      tickersSnapshot.hasNext,
    );
  } catch (error) {
    console.log(error);
    ctx.reply(`Error paginate tickers: ${error.message}`);
  }
};
// show ticker info
export const showTicker = async (ctx, params) => {
  const { symbol, clear } = params;
  const session = await Session.findById(ctx.from.id);
  const prevPage = clear
    ? "show-tickers"
    : session.sessionData.TickersPreviousPage;
  const ticker = await Ticker.find(symbol);
  showTickerPage(ctx, symbol, ticker, prevPage);
};
// show ticker info
export const editTicker = async (ctx, params) => {
  const { symbol, field } = params;
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
  await viewTickers(ctx, true);
};
