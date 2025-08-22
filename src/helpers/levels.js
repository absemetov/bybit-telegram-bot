import {
  createLimitOrder,
  getBybitBalance,
  getTickerOrders,
  getTickerPositions,
  editStopLoss,
  editTakeProfit,
  cancelOrder,
} from "../helpers/bybitV5.js";
const balance = await getBybitBalance();
const MAX_POSITION_USDT = balance / 8;
const TAKE_PROFIT = 8;
const STOP_LOSS = 2;
//check TP SL set default values
export const checkPositions = async (
  ticker,
  currentPrice,
  bot,
  support,
  resistance,
) => {
  //openLong
  const { symbol, priceScale, trading, flat } = ticker;
  //get positions
  const positions = await getTickerPositions(symbol);
  const orders = await getTickerOrders(symbol);
  //edit TP, SL set breakeven
  for (const position of positions) {
    const { side, avgPrice, markPrice, stopLoss, takeProfit, positionValue } =
      position;
    const slPersent = ((stopLoss - avgPrice) / avgPrice) * 100;
    const pnlPersent = ((markPrice - avgPrice) / avgPrice) * 100;
    //check position size max
    if (positionValue > MAX_POSITION_USDT && orders.length > 0) {
      for (const order of orders) {
        await cancelOrder(symbol, order.orderId);
      }
      await bot.telegram.sendMessage(
        94899148,
        `<b>[Worning positions size increase ${MAX_POSITION_USDT}$ ${positionValue}$] <code>${symbol.slice(0, -4)}</code></b>` +
          `#${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
        { parse_mode: "HTML" },
      );
    }
    if (side === "Sell") {
      //set default sl
      const newStopLoss = avgPrice * (1 + STOP_LOSS / 100);
      if (
        !stopLoss ||
        (Math.abs(((newStopLoss - stopLoss) / stopLoss) * 100) >= 0.1 &&
          slPersent > 0)
      ) {
        await editStopLoss(symbol, side, newStopLoss.toFixed(priceScale));
        await bot.telegram.sendMessage(
          94899148,
          `<b>[Set default SL ${STOP_LOSS}% 🔴 Short] <code>${symbol.slice(0, -4)}</code> slPersent before ${slPersent.toFixed(2)}%\n` +
            `${stopLoss} => ${newStopLoss.toFixed(priceScale)}</b>` +
            `#${symbol.slice(0, -4)} #SHORT_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
          { parse_mode: "HTML" },
        );
      }
      //breakeven 20%
      if (pnlPersent < -2) {
        const newStopLoss = avgPrice * (1 + (pnlPersent * 0.2) / 100);
        if (((newStopLoss - stopLoss) / stopLoss) * 100 < -0.1) {
          await editStopLoss(symbol, side, newStopLoss.toFixed(priceScale));
          await bot.telegram.sendMessage(
            94899148,
            `<b>[Breakeven 20% 🔴 Short pnl > 5%] <code>${symbol.slice(0, -4)}</code> pnlPersent ${pnlPersent.toFixed(2)}%\n` +
              `${stopLoss} => ${newStopLoss.toFixed(priceScale)}</b>\n` +
              `#${symbol.slice(0, -4)} #SHORT_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
            { parse_mode: "HTML" },
          );
        }
      }
      //set TP in support zone if Algotrading
      if (trading && flat) {
        const tpPercent = support
          ? ((support - avgPrice) / avgPrice) * 100
          : -TAKE_PROFIT;
        const newTakeProfit = avgPrice * (1 + tpPercent / 100);
        if (
          (Math.abs(newTakeProfit - takeProfit) / takeProfit) * 100 > 0.1 &&
          tpPercent < -1
        ) {
          await editTakeProfit(symbol, side, newTakeProfit.toFixed(priceScale));
          await bot.telegram.sendMessage(
            94899148,
            `<b>[TAKE_PROFIT changed to ${tpPercent.toFixed(2)}% 🔴 Short] <code>${symbol.slice(0, -4)}</code> pnlPersent ${pnlPersent.toFixed(2)}%\n` +
              `TP value: ${takeProfit} => ${newTakeProfit.toFixed(priceScale)}</b>\n` +
              `#${symbol.slice(0, -4)} #SHORT_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
            { parse_mode: "HTML" },
          );
        }
      }
    }
    if (side === "Buy") {
      //set default SL
      const newStopLoss = avgPrice * (1 - STOP_LOSS / 100);
      if (
        !stopLoss ||
        (Math.abs(((newStopLoss - stopLoss) / stopLoss) * 100) >= 0.1 &&
          slPersent < 0)
      ) {
        await editStopLoss(symbol, side, newStopLoss.toFixed(priceScale));
        await bot.telegram.sendMessage(
          94899148,
          `<b>[Set default SL ${STOP_LOSS}% 🟢 Long] <code>${symbol.slice(0, -4)}</code> slPersent before ${slPersent.toFixed(2)}%\n` +
            `${stopLoss} => ${newStopLoss.toFixed(priceScale)}</b>\n` +
            `#${symbol.slice(0, -4)} #LONG_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
          { parse_mode: "HTML" },
        );
      }
      //breakeven 20%
      if (pnlPersent > 2) {
        const newStopLoss = avgPrice * (1 + (pnlPersent * 0.2) / 100);
        if (((newStopLoss - stopLoss) / stopLoss) * 100 > 0.1) {
          await editStopLoss(symbol, side, newStopLoss.toFixed(priceScale));
          await bot.telegram.sendMessage(
            94899148,
            `<b>[Breakeven 20% 🟢 Long pnl >2%] <code>${symbol.slice(0, -4)}</code> pnlPersent ${pnlPersent.toFixed(2)}%\n` +
              `${stopLoss} => ${newStopLoss.toFixed(priceScale)}</b>\n` +
              `#${symbol.slice(0, -4)} #LONG_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
            { parse_mode: "HTML" },
          );
        }
      }
      //TODO Change TP to support zone or default value!!!
      if (trading && flat) {
        const tpPercent = resistance
          ? ((resistance - avgPrice) / avgPrice) * 100
          : TAKE_PROFIT;
        const newTakeProfit = avgPrice * (1 + tpPercent / 100);
        if (
          (Math.abs(newTakeProfit - takeProfit) / takeProfit) * 100 > 0.1 &&
          tpPercent > 1
        ) {
          await editTakeProfit(symbol, side, newTakeProfit.toFixed(priceScale));
          await bot.telegram.sendMessage(
            94899148,
            `<b>[TAKE_PROFIT changed to ${tpPercent.toFixed(2)}% 🟢 Long] <code>${symbol.slice(0, -4)}</code> pnlPersent ${pnlPersent.toFixed(2)}%\n` +
              `TP value: ${takeProfit} => ${newTakeProfit.toFixed(priceScale)}</b>\n` +
              `#${symbol.slice(0, -4)} #SHORT_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
            { parse_mode: "HTML" },
          );
        }
      }
    }
  }
  //check levels create stop orders
  //get Long Short positions
};
//create Long order
export const createLongOrder = async (symbol, price, bot) => {
  //Support Zone
  const positions = await getTickerPositions(symbol);
  const longPosition = positions.find((p) => p.side === "Buy");
  //open Long && openLong
  if (!longPosition || longPosition.positionValue < MAX_POSITION_USDT) {
    //cancel all old orders
    const orders = await getTickerOrders(symbol);
    for (const order of orders) {
      await cancelOrder(symbol, order.orderId);
    }
    await createLimitOrder(
      symbol,
      "Buy",
      price,
      MAX_POSITION_USDT / 3,
      TAKE_PROFIT,
      STOP_LOSS,
    );
    await bot.telegram.sendMessage(
      94899148,
      `<b><code>${symbol.slice(0, -4)}</code> [Created orders grid 🟢 Long on Support Zone]\n` +
        `Price ${price}$ Max position / 3 ${MAX_POSITION_USDT.toFixed(2)}$</b>\n` +
        `#${symbol.slice(0, -4)} #LONG_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
      { parse_mode: "HTML" },
    );
  }
};
//create Short order
export const createShortOrder = async (symbol, price, bot) => {
  //Resistance Zone
  const positions = await getTickerPositions(symbol);
  const shortPosition = positions.find((p) => p.side === "Sell");
  //open Short && !openLong
  if (!shortPosition || shortPosition.positionValue < MAX_POSITION_USDT) {
    const orders = await getTickerOrders(symbol);
    for (const order of orders) {
      await cancelOrder(symbol, order.orderId);
    }
    await createLimitOrder(
      symbol,
      "Sell",
      price,
      MAX_POSITION_USDT / 3,
      TAKE_PROFIT,
      STOP_LOSS,
    );
    await bot.telegram.sendMessage(
      94899148,
      `<b><code>${symbol.slice(0, -4)}</code> [Created order 🔴 Short on Resistance Zone]\n` +
        `Price ${price}$ Map position / 3 ${MAX_POSITION_USDT.toFixed(2)}$</b>\n` +
        `#${symbol.slice(0, -4)} #SHORT_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
      { parse_mode: "HTML" },
    );
  }
};
