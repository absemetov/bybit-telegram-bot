import Scan from "../models/Scan.js";
import Session from "../models/Session.js";
import { viewScans, showScanPage } from "../views/showScanPage.js";

//show intervals
export const showAllScans = async (ctx, edit) => {
  const intervals = await Scan.all();
  viewScans(ctx, intervals, edit);
};
// scan page
export const showScanEditPage = async (ctx, params) => {
  const { interval } = params;
  const scan = await Scan.getConfig(interval);
  const scanFields = Scan.scanFields();
  await showScanPage(ctx, interval, scan, scanFields);
};
// edit scan settings fields
export const editScanField = async (ctx, params) => {
  const { interval, field, value, redirect } = params;
  if (field === "active" || field === "notify") {
    await Scan.updateField(interval, field, value);
    if (redirect) {
      await showAllScans(ctx, true);
    } else {
      await showScanEditPage(ctx, { interval });
    }
    return;
  }
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
