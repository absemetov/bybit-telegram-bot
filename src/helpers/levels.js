import {
  createStopLimitOrder,
  getBybitBalance,
  getTickerOrders,
  getTickerPositions,
  editStopLoss,
  editTakeProfit,
  cancelOrder,
} from "../helpers/bybitV5.js";
import Ticker from "../models/Ticker.js";
import { sendMsgMe } from "../helpers/helpers.js";
const balance = await getBybitBalance();
const MAX_POSITION_USDT = balance * 1;
const TAKE_PROFIT = 6;
const STOP_LOSS = 2;
//trading btn render
function renderTradingBtn(tradingType) {
  switch (tradingType) {
    case 2:
      return "↗️ Long";
    case 3:
      return "↘️ Short";
    case 4:
      return "🔀 Boxing - TP auto";
    case 5:
      return "↕️  Boxing - TP fix";
    case 6:
      return "⭕️";
    default:
      return "🔴";
  }
}
//check TP SL set default values
export const checkPositions = async (ticker, currentPrice, bot, levels) => {
  const {
    symbol,
    priceScale,
    tradingType,
    sl,
    tp,
    tolerance,
    candlesCount,
    touchCount,
    enterTf,
  } = ticker;
  const tickerStopLoss = sl || STOP_LOSS;
  const tickerTakeProfit = tp || TAKE_PROFIT;
  //get positions
  const positions = await getTickerPositions(symbol);
  const orders = await getTickerOrders(symbol);
  //edit TP, SL set breakeven
  for (const position of positions) {
    const { side, avgPrice, markPrice, stopLoss, takeProfit, positionValue } =
      position;
    const slPersent = ((stopLoss - avgPrice) / avgPrice) * 100;
    const pnlPersent = ((markPrice - avgPrice) / avgPrice) * 100;
    //check position size max and FOMO!!!
    if (positionValue >= MAX_POSITION_USDT * (1 + 10 / 100)) {
      await sendMsgMe(
        bot,
        `<b>[<code>${symbol.slice(0, -4)}</code> FOMO!!! Close position!!! Emotions!!! Worning positions size increase ${MAX_POSITION_USDT.toFixed(2)}$  ${positionValue}$]</b>\n` +
          `#${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
      );
    }
    if (positionValue > MAX_POSITION_USDT && orders.length > 0) {
      for (const order of orders) {
        await cancelOrder(symbol, order.orderId);
      }
      await sendMsgMe(
        bot,
        `<b>[<code>${symbol.slice(0, -4)}</code> Worning positions size increase ${MAX_POSITION_USDT.toFixed(2)}$  ${positionValue}$]</b>\n` +
          `#${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
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
        await sendMsgMe(
          bot,
          `<b>[<code>${symbol.slice(0, -4)}</code> ${renderTradingBtn(tradingType)} Set default SL ${tickerStopLoss}% 🔴 Short] slPersent before ${slPersent.toFixed(2)}%\n` +
            `${stopLoss}  ${newStopLoss.toFixed(priceScale)} ${enterTf} [${candlesCount}, ${touchCount}]</b>` +
            `#${symbol.slice(0, -4)} #SHORT_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
        );
      }
      //breakeven 20%
      if (pnlPersent < -4) {
        const newStopLoss = avgPrice * (1 + (pnlPersent * 0.2) / 100);
        if (((newStopLoss - stopLoss) / stopLoss) * 100 < -0.1) {
          await editStopLoss(symbol, side, newStopLoss.toFixed(priceScale));
          await sendMsgMe(
            bot,
            `<b>[<code>${symbol.slice(0, -4)}</code> ${renderTradingBtn(tradingType)} Breakeven 20% 🔴 Short pnl  4%] pnlPersent ${pnlPersent.toFixed(2)}%\n` +
              `${stopLoss}  ${newStopLoss.toFixed(priceScale)} ${enterTf} [${candlesCount}, ${touchCount}]</b>\n` +
              `#${symbol.slice(0, -4)} #SHORT_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
          );
        }
      }
      //flat with auto TP mode
      let newTakeProfit = takeProfit;
      let levelPrcnt = 0;
      if (tradingType === 4 && levels.support) {
        levelPrcnt = ((levels.support - avgPrice) / avgPrice) * 100 + tolerance;
        if (levelPrcnt <= -3) {
          newTakeProfit = avgPrice * (1 + levelPrcnt / 100);
        } else {
          newTakeProfit = avgPrice * (1 - tickerTakeProfit / 100);
        }
      } else {
        newTakeProfit = avgPrice * (1 - tickerTakeProfit / 100);
      }
      if (
        !takeProfit ||
        (Math.abs(newTakeProfit - takeProfit) / takeProfit) * 100 >= 0.1
      ) {
        await editTakeProfit(symbol, side, newTakeProfit.toFixed(priceScale));
        await sendMsgMe(
          bot,
          `<b>[<code>${symbol.slice(0, -4)}</code> ${renderTradingBtn(tradingType)} TAKE_PROFIT changed to ${levelPrcnt <= -3 ? levelPrcnt.toFixed(2) : tickerTakeProfit}% 🔴 Short] pnlPersent ${pnlPersent.toFixed(2)}%\n` +
            `TP value: ${takeProfit}  ${newTakeProfit.toFixed(priceScale)} ${enterTf} [${candlesCount}, ${touchCount}]</b>\n` +
            `#${symbol.slice(0, -4)} #SHORT_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
        );
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
        await sendMsgMe(
          bot,
          `<b>[<code>${symbol.slice(0, -4)}</code> ${renderTradingBtn(tradingType)} Set default SL ${tickerStopLoss}% 🟢 Long] slPersent before ${slPersent.toFixed(2)}%\n` +
            `${stopLoss}  ${newStopLoss.toFixed(priceScale)} ${enterTf} [${candlesCount}, ${touchCount}]</b>\n` +
            `#${symbol.slice(0, -4)} #LONG_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
        );
      }
      //breakeven 20%
      if (pnlPersent > 4) {
        const newStopLoss = avgPrice * (1 + (pnlPersent * 0.2) / 100);
        if (((newStopLoss - stopLoss) / stopLoss) * 100 > 0.1) {
          await editStopLoss(symbol, side, newStopLoss.toFixed(priceScale));
          await sendMsgMe(
            bot,
            `<b>[<code>${symbol.slice(0, -4)}</code> ${renderTradingBtn(tradingType)} Breakeven 20% 🟢 Long pnl 4%] pnlPersent ${pnlPersent.toFixed(2)}%\n` +
              `${stopLoss}  ${newStopLoss.toFixed(priceScale)} ${enterTf} [${candlesCount}, ${touchCount}]</b>\n` +
              `#${symbol.slice(0, -4)} #LONG_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
          );
        }
      }
      //flat with auto TP mode
      let newTakeProfit = takeProfit;
      let levelPrcnt = 0;
      if (tradingType === 4 && levels.resistance) {
        levelPrcnt =
          ((levels.resistance - avgPrice) / avgPrice) * 100 - tolerance;
        if (levelPrcnt >= 3) {
          newTakeProfit = avgPrice * (1 + levelPrcnt / 100);
        } else {
          newTakeProfit = avgPrice * (1 + tickerTakeProfit / 100);
        }
      } else {
        newTakeProfit = avgPrice * (1 + tickerTakeProfit / 100);
      }
      if (
        !takeProfit ||
        (Math.abs(newTakeProfit - takeProfit) / takeProfit) * 100 > 0.1
      ) {
        await editTakeProfit(symbol, side, newTakeProfit.toFixed(priceScale));
        await sendMsgMe(
          bot,
          `<b>[<code>${symbol.slice(0, -4)}</code> ${renderTradingBtn(tradingType)} TAKE_PROFIT changed to ${levelPrcnt >= 3 ? levelPrcnt.toFixed(2) : tickerTakeProfit}% 🟢 Long] pnlPersent ${pnlPersent.toFixed(2)}%\n` +
            `TP value: ${takeProfit}  ${newTakeProfit.toFixed(priceScale)} ${enterTf} [${candlesCount}, ${touchCount}]</b>\n` +
            `#${symbol.slice(0, -4)} #LONG_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
        );
      }
    }
  }
  //check levels create stop orders
  //get Long Short positions
};
//Algo Trading 15.09.2025
export const algoTrading = async (ticker, longLevels, price, bot, enterTf) => {
  try {
    const {
      symbol,
      tradingType,
      //size,
      sl,
      tp,
      candlesCount,
      touchCount,
      tolerance,
      attemptsCount,
    } = ticker;
    //your trading account must not drop below 90% of the initial account balance!!!
    const balance = await getBybitBalance();
    const size = balance * 1;
    //get limit orders
    const orders = await getTickerOrders(symbol);
    const longOrders = orders.filter((o) => o.side === "Buy");
    const shortOrders = orders.filter((o) => o.side === "Sell");
    const positions = await getTickerPositions(symbol);
    const longPosition = positions.find((p) => p.side === "Buy");
    const shortPosition = positions.find((p) => p.side === "Sell");
    if (attemptsCount === 0) {
      await sendMsgMe(
        bot,
        `<b><code>${symbol.slice(0, -4)}</code> The number of attempts has been exhausted\n</b>` +
          `#${symbol.slice(0, -4)} #LONG_${symbol.slice(0, -4)} #ORDER_${symbol.slice(0, -4)}`,
      );
    }
    //create LONG orders
    if (
      longLevels.support > 0 &&
      [2, 4, 5].includes(tradingType) &&
      longOrders.length === 0 &&
      attemptsCount > 0
    ) {
      if (Math.abs(longLevels.support - price) / price <= tolerance / 100) {
        if (
          !longPosition ||
          size * (1 - 0.5 / 100) > longPosition.positionValue
        ) {
          const sizeTotal = longPosition
            ? size - longPosition.positionValue
            : size;
          await createStopLimitOrder(
            symbol,
            "Buy",
            price * (1 + 0.18 / 100),
            sizeTotal,
            tp || TAKE_PROFIT,
            sl || STOP_LOSS,
          );
          await Ticker.incrementField(symbol, "attemptsCount", -1);
          //for (const step of [0.17, 0.19, 0.21]) {
          //  await createStopLimitOrder(
          //    symbol,
          //    "Buy",
          //    price * (1 + step / 100),
          //    sizeTotal / 3,
          //    tp || TAKE_PROFIT,
          //    sl || STOP_LOSS,
          //  );
          //}
          await sendMsgMe(
            bot,
            `<b><code>${symbol.slice(0, -4)}</code> Attempts ${attemptsCount} ${renderTradingBtn(tradingType)} [Created Stop order ${enterTf} 🟢 Long [${candlesCount} ${touchCount}, ${tolerance}]]\n` +
              `Price ${price * (1 + 0.18 / 100)}$ Size ${sizeTotal.toFixed(2)}$</b>\n` +
              `#${symbol.slice(0, -4)} #LONG_${symbol.slice(0, -4)} #ORDER_${symbol.slice(0, -4)}`,
          );
        }
      }
    }
    //create SHORT orders
    if (
      longLevels.resistance > 0 &&
      [3, 4, 5].includes(tradingType) &&
      shortOrders.length === 0 &&
      attemptsCount > 0
    ) {
      if (Math.abs(longLevels.resistance - price) / price <= tolerance / 100) {
        if (
          !shortPosition ||
          size * (1 - 0.5 / 100) > shortPosition.positionValue
        ) {
          const sizeTotal = shortPosition
            ? size - shortPosition.positionValue
            : size;
          await createStopLimitOrder(
            symbol,
            "Sell",
            price * (1 - 0.18 / 100),
            sizeTotal,
            tp || TAKE_PROFIT,
            sl || STOP_LOSS,
          );
          //for (const step of [0.17, 0.19, 0.21]) {
          await Ticker.incrementField(symbol, "attemptsCount", -1);
          //  await createStopLimitOrder(
          //    symbol,
          //    "Sell",
          //    price * (1 - step / 100),
          //    sizeTotal / 3,
          //    tp || TAKE_PROFIT,
          //    sl || STOP_LOSS,
          //  );
          //}
          await sendMsgMe(
            bot,
            `<b><code>${symbol.slice(0, -4)}</code> Attempts ${attemptsCount} ${renderTradingBtn(tradingType)} [Created Stop order ${enterTf} 🔴 Short [${candlesCount} ${touchCount}, ${tolerance}]]\n` +
              `Price ${price * (1 - 0.18 / 100)}$ Size ${sizeTotal.toFixed(2)}$</b>\n` +
              `#${symbol.slice(0, -4)} #SHORT_${symbol.slice(0, -4)} #ORDER_${symbol.slice(0, -4)}`,
          );
        }
      }
    }
  } catch (error) {
    console.error(`Error processing:`, error.message);
    await sendMsgMe(bot, `AlgoTrading Error ${error.message}`);
  }
};
