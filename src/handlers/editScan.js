import Scan from "../models/Scan.js";
import { Markup } from "telegraf";
import { viewScanForm } from "../views/showScanPage.js";
import { renderMsg } from "../helpers/functions.js";
import { analyticCoinCandles } from "../helpers/checkTickersPump.js";

export const showScans = async (ctx) => {
  const intervals = await Scan.all();
  viewScanForm(ctx, intervals, false);
};

export const handleEditScanField = async (ctx, session) => {
  let fieldData = ctx.message.text;
  const fieldName = session.sessionData.field;
  const scanId = session.sessionData.scanId;
  const scanInterval = await Scan.find(scanId);
  if (fieldName === "dojiPcnt" || fieldName === "volumePcnt") {
    fieldData = ctx.message.text.replace(/,/g, ".");
  }
  scanInterval[fieldName] = fieldData;
  try {
    await scanInterval.update();
    await session.delete("bybit-scene");
    const message = `Scan field <b>[${fieldName}]</b> updated to <b>${fieldData}</b>.`;
    const buttons = Markup.inlineKeyboard([
      [Markup.button.callback(`Show Scan ${scanId}`, `scanform/${scanId}`)],
    ]);
    await renderMsg(ctx, message, buttons, false);
  } catch (error) {
    ctx.reply(`Error updating Scan interval: ${error.message}`);
  }
};
// scan interval
// pump scan
export const scanTickers = async (ctx, session) => {
  const { interval } = session.sessionData;
  const chunkNumber = +ctx.message.text;
  const { tickersLength, countPumpTickers } = await analyticCoinCandles(
    ctx,
    interval,
    10,
    chunkNumber,
  );
  const message = `Scan ${tickersLength} on interval ${interval} done! Find pump coins: ${countPumpTickers}`;
  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback("Go to Scan page", "scan")],
    [
      Markup.button.url(
        `Bybit.rzk.com.ru: ${interval}`,
        `https://bybit.rzk.com.ru/${interval}`,
      ),
    ],
  ]);
  await renderMsg(ctx, message, buttons, false);
  // clear session
  await session.delete("bybit-scene");
};
