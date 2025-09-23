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
const MAX_POSITION_USDT = balance / 1;
const TAKE_PROFIT = 6;
const STOP_LOSS = 2;
//check TP SL set default values
export const checkPositions = async (ticker, currentPrice, bot) => {
  //openLong
  const { symbol, priceScale, tradingType, sl } = ticker;
  const tickerStopLoss = sl || STOP_LOSS;
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
        `<b>[Worning positions size increase ${MAX_POSITION_USDT}$ ${positionValue}$] <code>${symbol.slice(0, -4)}</code></b>\n` +
          `#${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
        { parse_mode: "HTML" },
      );
    }
    if (side === "Sell") {
      //set default sl
      const newStopLoss = avgPrice * (1 + tickerStopLoss / 100);
      if (
        !stopLoss ||
        (Math.abs(((newStopLoss - stopLoss) / stopLoss) * 100) >= 0.1 &&
          slPersent > 0)
      ) {
        await editStopLoss(symbol, side, newStopLoss.toFixed(priceScale));
        await bot.telegram.sendMessage(
          94899148,
          `<b>[Set default SL ${tickerStopLoss}% 🔴 Short] <code>${symbol.slice(0, -4)}</code> slPersent before ${slPersent.toFixed(2)}%\n` +
            `${stopLoss} => ${newStopLoss.toFixed(priceScale)}</b>` +
            `#${symbol.slice(0, -4)} #SHORT_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
          { parse_mode: "HTML" },
        );
      }
      //breakeven 50%
      if (pnlPersent < -3) {
        const newStopLoss = avgPrice * (1 + (pnlPersent * 0.5) / 100);
        if (((newStopLoss - stopLoss) / stopLoss) * 100 < -0.1) {
          await editStopLoss(symbol, side, newStopLoss.toFixed(priceScale));
          await bot.telegram.sendMessage(
            94899148,
            `<b>[Breakeven 50% 🔴 Short pnl > 3%] <code>${symbol.slice(0, -4)}</code> pnlPersent ${pnlPersent.toFixed(2)}%\n` +
              `${stopLoss} => ${newStopLoss.toFixed(priceScale)}</b>\n` +
              `#${symbol.slice(0, -4)} #SHORT_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
            { parse_mode: "HTML" },
          );
        }
      }
      //set TP in support zone if Algotrading disabled
      if (tradingType === 5) {
        const tpPercent = currentPrice
          ? ((currentPrice - avgPrice) / avgPrice) * 100
          : -TAKE_PROFIT;
        const newTakeProfit = avgPrice * (1 + tpPercent / 100);
        if (
          (Math.abs(newTakeProfit - takeProfit) / takeProfit) * 100 > 0.1 &&
          tpPercent < -3
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
      const newStopLoss = avgPrice * (1 - tickerStopLoss / 100);
      if (
        !stopLoss ||
        (Math.abs(((newStopLoss - stopLoss) / stopLoss) * 100) >= 0.1 &&
          slPersent < 0)
      ) {
        await editStopLoss(symbol, side, newStopLoss.toFixed(priceScale));
        await bot.telegram.sendMessage(
          94899148,
          `<b>[Set default SL ${tickerStopLoss}% 🟢 Long] <code>${symbol.slice(0, -4)}</code> slPersent before ${slPersent.toFixed(2)}%\n` +
            `${stopLoss} => ${newStopLoss.toFixed(priceScale)}</b>\n` +
            `#${symbol.slice(0, -4)} #LONG_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
          { parse_mode: "HTML" },
        );
      }
      //breakeven 50%
      if (pnlPersent > 3) {
        const newStopLoss = avgPrice * (1 + (pnlPersent * 0.5) / 100);
        if (((newStopLoss - stopLoss) / stopLoss) * 100 > 0.1) {
          await editStopLoss(symbol, side, newStopLoss.toFixed(priceScale));
          await bot.telegram.sendMessage(
            94899148,
            `<b>[Breakeven 50% 🟢 Long pnl >3%] <code>${symbol.slice(0, -4)}</code> pnlPersent ${pnlPersent.toFixed(2)}%\n` +
              `${stopLoss} => ${newStopLoss.toFixed(priceScale)}</b>\n` +
              `#${symbol.slice(0, -4)} #LONG_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
            { parse_mode: "HTML" },
          );
        }
      }
      //TODO Change TP to support zone or default value!!! disabled
      if (tradingType === 5) {
        const tpPercent = currentPrice
          ? ((currentPrice - avgPrice) / avgPrice) * 100
          : TAKE_PROFIT;
        const newTakeProfit = avgPrice * (1 + tpPercent / 100);
        if (
          (Math.abs(newTakeProfit - takeProfit) / takeProfit) * 100 > 0.1 &&
          tpPercent > 3
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
//Algo Trading 15.09.2025
export const algoTrading = async (
  ticker,
  longLevels,
  shortLevels,
  price,
  bot,
  enterTf
) => {
  const { symbol, tradingType, size, sl, tp } = ticker;
  //get limit orders
  const orders = await getTickerOrders(symbol);
  const longOrders = orders.filter((o) => o.side === "Buy");
  const shortOrders = orders.filter((o) => o.side === "Sell");
  const positions = await getTickerPositions(symbol);
  const longPosition = positions.find((p) => p.side === "Buy");
  const shortPosition = positions.find((p) => p.side === "Sell");
  //create LONG orders
  if (
    longLevels.support > 0 &&
    shortLevels.support > 0 &&
    [2, 4].includes(tradingType) &&
    longOrders.length === 0 &&
    !longPosition
  ) {
    if (Math.abs(longLevels.support - price) / price <= 0.7 / 100) {
      for (const step of [0.2, 0.4, 0.6]) {
        await createLimitOrder(
          symbol,
          "Buy",
          price * (1 - step / 100),
          size / 3,
          tp,
          sl,
        );
      }
      await bot.telegram.sendMessage(
        94899148,
        `<b><code>${symbol.slice(0, -4)}</code> [Created 3 orders grid 🟢 Long on Support Zone ${enterTf}]\n` +
          `Price ${price}$ Size ${size}$</b>\n` +
          `#${symbol.slice(0, -4)} #LONG_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
        { parse_mode: "HTML" },
      );
    }
  }
  //create SHORT orders
  if (
    longLevels.resistance > 0 &&
    shortLevels.resistance > 0 &&
    [3, 4].includes(tradingType) &&
    shortOrders.length === 0 &&
    !shortPosition
  ) {
    if (Math.abs(longLevels.resistance - price) / price <= 0.7 / 100) {
      for (const step of [0.2, 0.4, 0.6]) {
        await createLimitOrder(
          symbol,
          "Sell",
          price * (1 + step / 100),
          size / 3,
          tp || TAKE_PROFIT,
          sl || STOP_LOSS,
        );
      }
      await bot.telegram.sendMessage(
        94899148,
        `<b><code>${symbol.slice(0, -4)}</code> [Created 3 orders grid 🔴 Short on Resistance Zone ${enterTf}]\n` +
          `Price ${price}$ Size ${size}$</b>\n` +
          `#${symbol.slice(0, -4)} #SHORT_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
        { parse_mode: "HTML" },
      );
    }
  }
};
