import Scan from "../models/Scan.js";
import Session from "../models/Session.js";
import { viewScanForm, editScanFormPage } from "../views/showScanPage.js";
import { analyticCoinCandles } from "../helpers/checkTickersPump.js";

//show intervals
export const showAllScans = async (ctx) => {
  const intervals = await Scan.all();
  viewScanForm(ctx, intervals);
};
//set chunk from message
export const getChunkNumber = async (ctx, params) => {
  const { interval } = params;
  const { tickersLength, countPumpTickers, chunkNumber } =
    await analyticCoinCandles(ctx, interval, 50);
  // const session = new Session(ctx.from.id);
  // session.sessionData.interval = interval;
  // session.sessionData.scene = "getChunkNumber";
  // await session.save("bybit-scene");
  // await ctx.replyWithHTML(
  //   `Please enter chunk number [0-8] for scaning interval <b>${interval}</b>`,
  // );
  await ctx.answerCbQuery(
    `Scan from ${tickersLength}, find ${countPumpTickers} coins Chunk Number ${chunkNumber}`,
  );
};
// edit scan fields
export const showScanEditForm = async (ctx, params) => {
  const { interval } = params;
  const scan = await Scan.find(interval);
  const scanFields = Scan.scanFields();
  await editScanFormPage(ctx, interval, scan, scanFields);
};
// edit scan settings fields
export const editScanField = async (ctx, params) => {
  const { interval, field } = params;
  const session = new Session(ctx.from.id);
  session.sessionData.scanId = interval;
  session.sessionData.scene = "editScan";
  session.sessionData.field = field;
  await session.save("bybit-scene");
  await ctx.replyWithHTML(
    `Editing Scan interval <b>${interval}</b> fieldName <b>${field}</b>. Please enter a new value:`,
  );
  await ctx.answerCbQuery();
};
