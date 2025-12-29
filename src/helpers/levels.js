import { bybitUsers } from "../helpers/bybitV5.js";
import Ticker from "../models/Ticker.js";
import { sendMsgMe } from "../helpers/helpers.js";
//const balance = await getBybitBalance();
//leverage
const MAX_POSITION_USDT = 10000;
const TAKE_PROFIT = 10;
const STOP_LOSS = 0.7;
//trading btn render
function renderTradingBtn(tradingType, side) {
  if (tradingType !== "off") {
    const icon = side === "Buy" ? "↗️" : "↘️";
    return `${icon} ${tradingType}`;
  }
  return "🔴";
}
//check TP SL set default values
export const checkPositions = async (
  ticker,
  currentPrice,
  bot,
  levels,
  user,
  tradingType,
) => {
  const { symbol, priceScale } = ticker;
  const { sl, tp, tolerance, candlesCount, touchCount, breakeven } =
    ticker[user] || {};
  const tickerStopLoss = sl || STOP_LOSS;
  const tickerTakeProfit = tp || TAKE_PROFIT;
  //get positions
  const bybit = bybitUsers[user];
  const positions = await bybit.getTickerPositions(symbol);
  const orders = await bybit.getTickerOrders(symbol);
  //delete old orders price tolerance x 5
  for (const order of orders) {
    if (
      Math.abs(order.price - currentPrice) / currentPrice >
      (tolerance * 5) / 100
    ) {
      await bybit.cancelOrder(symbol, order.orderId);
      await Ticker.incrementField(symbol, `${user}.attemptsCount`, 1);
      await sendMsgMe(bot, {
        header: `<code>${symbol.slice(0, -4)}</code>`,
        msg: `[${user}] Cancel ${order.side} Current price ${currentPrice}$ Order Price ${order.price}$ Sum: ${order.sum}$ ${renderTradingBtn(tradingType, order.side)}\n[${candlesCount}, ${touchCount}, ${tolerance}]`,
        footer: `#${symbol.slice(0, -4)} #${symbol.slice(0, -4)}_Cancel_Order_${order.side}`,
      });
    }
  }
  //edit TP, SL set breakeven
  for (const position of positions) {
    const { side, avgPrice, markPrice, stopLoss, takeProfit, positionValue } =
      position;
    const slPersent = ((stopLoss - avgPrice) / avgPrice) * 100;
    const pnlPersent = ((markPrice - avgPrice) / avgPrice) * 100;
    //check position size max and FOMO!!!
    if (positionValue >= MAX_POSITION_USDT * 1.2) {
      await sendMsgMe(bot, {
        header: `<code>${symbol.slice(0, -4)}</code>`,
        msg: `[${user}] FOMO!!! Close position!!! Emotions!!! Worning positions size increase ${MAX_POSITION_USDT.toFixed(2)}$ < ${positionValue}$`,
        footer: `#${symbol.slice(0, -4)} #FOMO`,
      });
    }
    if (positionValue > MAX_POSITION_USDT * 1.2 && orders.length > 0) {
      for (const order of orders) {
        await bybit.cancelOrder(symbol, order.orderId);
      }
      await sendMsgMe(bot, {
        header: `<code>${symbol.slice(0, -4)}</code>`,
        msg: `[${user}] Orders closed! Worning positions size increase ${MAX_POSITION_USDT.toFixed(2)}$  ${positionValue}$`,
        footer: `#${symbol.slice(0, -4)} #${symbol.slice(0, -4)}_Fomo`,
      });
    }
    if (side === "Sell") {
      //set default sl
      const newStopLoss = avgPrice * (1 + tickerStopLoss / 100);
      if (
        !stopLoss ||
        (Math.abs(((newStopLoss - stopLoss) / stopLoss) * 100) >= 0.1 &&
          slPersent > 0)
      ) {
        await bybit.editStopLoss(symbol, side, newStopLoss.toFixed(priceScale));
        await sendMsgMe(bot, {
          header: `<code>${symbol.slice(0, -4)}</code>`,
          msg:
            `Set default SL 🔴 Short [${user}] ${renderTradingBtn(tradingType, side)} ${tickerStopLoss}% slPersent before ${slPersent.toFixed(2)}% pnlPersent ${pnlPersent.toFixed(2)}%\n` +
            `SL value: ${stopLoss}$ => ${newStopLoss.toFixed(priceScale)}$ [${candlesCount}, ${touchCount}]`,
          footer: `#${symbol.slice(0, -4)} #${symbol.slice(0, -4)}_Short_Default_SL`,
        });
      }
      //breakeven 20%
      if (pnlPersent < -breakeven) {
        const newStopLoss = avgPrice * (1 + (pnlPersent * 0.2) / 100);
        if (((newStopLoss - stopLoss) / stopLoss) * 100 < -0.1) {
          await bybit.editStopLoss(
            symbol,
            side,
            newStopLoss.toFixed(priceScale),
          );
          await sendMsgMe(bot, {
            header: `<code>${symbol.slice(0, -4)}</code>`,
            msg:
              `Breakeven20% ${(pnlPersent * 0.2).toFixed(2)}% 🔴 Short [${user}] ${renderTradingBtn(tradingType, side)} breakeven start ${breakeven}%, pnlPersent ${pnlPersent.toFixed(2)}%\n` +
              `SL value: ${stopLoss}$ => ${newStopLoss.toFixed(priceScale)}$ [${candlesCount}, ${touchCount}]`,
            footer: `#${symbol.slice(0, -4)} #${symbol.slice(0, -4)}_Short_Breakeven`,
          });
        }
      }
      //set TP
      //let newTakeProfit = takeProfit;
      //if (
      //  tp === 50 &&
      //  levels.support > 0 &&
      //  levels.support * (1 + (tolerance * 2) / 100) < currentPrice
      //) {
      //  newTakeProfit = levels.support * (1 + (tolerance * 2) / 100);
      //  //levelPrcnt = ((levels.support - avgPrice) / avgPrice) * 100;
      //  //if (levelPrcnt <= -0.5) {
      //  //  newTakeProfit = avgPrice * (1 + levelPrcnt / 100);
      //  //} else {
      //  //  newTakeProfit = avgPrice * (1 - tickerTakeProfit / 100);
      //  //}
      //} else {
      //  newTakeProfit = avgPrice * (1 - tickerTakeProfit / 100);
      //}
      const newTakeProfit = avgPrice * (1 - tickerTakeProfit / 100);
      if (
        !takeProfit ||
        (Math.abs(newTakeProfit - takeProfit) / takeProfit) * 100 >= 0.1
      ) {
        await bybit.editTakeProfit(
          symbol,
          side,
          newTakeProfit.toFixed(priceScale),
        );
        const takePrcnt = ((newTakeProfit - avgPrice) / avgPrice) * 100;
        await sendMsgMe(bot, {
          header: `<code>${symbol.slice(0, -4)}</code>`,
          msg:
            `Edit TP 🔴 Short [${user}] ${renderTradingBtn(tradingType, side)} TAKE_PROFIT changed to ${takePrcnt.toFixed(2)}% pnlPersent ${pnlPersent.toFixed(2)}%\n` +
            `TP value: ${takeProfit}$ => ${newTakeProfit.toFixed(priceScale)}$ [${candlesCount}, ${touchCount}]`,
          footer: `#${symbol.slice(0, -4)} #${symbol.slice(0, -4)}_Short_Edit_TP`,
        });
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
        await bybit.editStopLoss(symbol, side, newStopLoss.toFixed(priceScale));
        await sendMsgMe(bot, {
          header: `<code>${symbol.slice(0, -4)}</code>`,
          msg:
            `Set default SL 🟢 Long [${user}] ${renderTradingBtn(tradingType, side)} Set default SL ${tickerStopLoss}% slPersent before ${slPersent.toFixed(2)}% pnlPersent ${pnlPersent.toFixed(2)}%\n` +
            `SL value: ${stopLoss}$ => ${newStopLoss.toFixed(priceScale)}$ [${candlesCount}, ${touchCount}]`,
          footer: `#${symbol.slice(0, -4)} #${symbol.slice(0, -4)}_Long_Default_SL`,
        });
      }
      //breakeven 20%
      if (pnlPersent > breakeven) {
        const newStopLoss = avgPrice * (1 + (pnlPersent * 0.2) / 100);
        if (((newStopLoss - stopLoss) / stopLoss) * 100 > 0.1) {
          await bybit.editStopLoss(
            symbol,
            side,
            newStopLoss.toFixed(priceScale),
          );
          await sendMsgMe(bot, {
            header: `<code>${symbol.slice(0, -4)}</code>`,
            msg:
              `Breakeven20% ${(pnlPersent * 0.2).toFixed(2)}% 🟢 Long [${user}] ${renderTradingBtn(tradingType, side)} breakeven start ${breakeven}% pnlPersent ${pnlPersent.toFixed(2)}%\n` +
              `SL value: ${stopLoss}$ => ${newStopLoss.toFixed(priceScale)}$ [${candlesCount}, ${touchCount}]`,
            footer: `#${symbol.slice(0, -4)} #${symbol.slice(0, -4)}_Long_Breakeven`,
          });
        }
      }
      //if tp = 100 set resistance line value
      //let newTakeProfit = takeProfit;
      //if (
      //  tp === 50 &&
      //  levels.resistance * (1 - (tolerance * 2) / 100) > currentPrice
      //) {
      //  newTakeProfit = levels.resistance * (1 - (tolerance * 2) / 100);
      //} else {
      //  newTakeProfit = avgPrice * (1 + tickerTakeProfit / 100);
      //}
      const newTakeProfit = avgPrice * (1 + tickerTakeProfit / 100);
      if (
        !takeProfit ||
        (Math.abs(newTakeProfit - takeProfit) / takeProfit) * 100 > 0.1
      ) {
        await bybit.editTakeProfit(
          symbol,
          side,
          newTakeProfit.toFixed(priceScale),
        );
        const takePrcnt = ((newTakeProfit - avgPrice) / avgPrice) * 100;
        await sendMsgMe(bot, {
          header: `<code>${symbol.slice(0, -4)}</code>`,
          msg:
            `Edit TP 🟢 Long [${user}] ${renderTradingBtn(tradingType, side)} TAKE_PROFIT changed to ${takePrcnt.toFixed(2)}% pnlPersent ${pnlPersent.toFixed(2)}%\n` +
            `TP value: ${takeProfit}$ => ${newTakeProfit.toFixed(priceScale)}$ [${candlesCount}, ${touchCount}]`,
          footer: `#${symbol.slice(0, -4)} #${symbol.slice(0, -4)}_Long_Edit_TP`,
        });
      }
    }
  }
};
//Algo Trading 15.09.2025
export const algoTrading = async (
  ticker,
  longLevels,
  price,
  bot,
  user,
  tradingType,
  side,
  attemptsCount,
) => {
  const { symbol, priceScale } = ticker;
  try {
    const { size, sl, tp, candlesCount, touchCount, tolerance } =
      ticker[user] || {};
    //your trading account must not drop below 90% of the initial account balance!!!
    //const balance = await getBybitBalance();
    //const size = MAX_POSITION_USDT;
    //get limit orders
    const bybit = bybitUsers[user];
    const orders = await bybit.getTickerOrders(symbol);
    const longOrders = orders.filter((o) => o.side === "Buy");
    const shortOrders = orders.filter((o) => o.side === "Sell");
    const positions = await bybit.getTickerPositions(symbol);
    const longPosition = positions.find((p) => p.side === "Buy");
    const shortPosition = positions.find((p) => p.side === "Sell");
    //create LONG orders
    const longX = longLevels.support > price ? 3 : 1;
    if (
      Math.abs(longLevels.support - price) / price <=
        (tolerance * longX) / 100 &&
      longLevels.support > 0 &&
      side === "Buy" &&
      longOrders.length === 0
    ) {
      if (!longPosition || size * (1 - 1 / 100) > longPosition.positionValue) {
        const sizeTotal = longPosition
          ? size - longPosition.positionValue
          : size;
        const triggerPrice = price * (1 + (tolerance * 2) / 100);
        await bybit.createStopLimitOrder(
          symbol,
          side,
          triggerPrice,
          sizeTotal,
          price * (1 + tp / 100),
          price * (1 - sl / 100),
        );
        await Ticker.incrementField(symbol, `${user}.attemptsCount`, -1);
        await sendMsgMe(bot, {
          header: `<code>${symbol.slice(0, -4)}</code>`,
          msg: `🟢 [${user}] Open Long ${renderTradingBtn(tradingType, side)}\n${triggerPrice.toFixed(priceScale)}$ Size ${sizeTotal.toFixed(2)}$ Attempt ${attemptsCount}\n [${candlesCount}, ${touchCount}, ${tolerance}]`,
          footer: `#${symbol.slice(0, -4)} #${symbol.slice(0, -4)}_Open_Long_${user}`,
        });
        if (attemptsCount === 1) {
          await sendMsgMe(bot, {
            header: `<code>${symbol.slice(0, -4)}</code>`,
            msg: `${user} The number of attempts has been exhausted. Trading closed!`,
            footer: `#${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
          });
        }
      }
    }
    //create SHORT orders sub account
    const shortX =
      longLevels.resistance > 0 && longLevels.resistance < price ? 3 : 1;
    if (
      Math.abs(longLevels.resistance - price) / price <=
        (tolerance * shortX) / 100 &&
      side === "Sell" &&
      shortOrders.length === 0
    ) {
      if (
        !shortPosition ||
        size * (1 - 1 / 100) > shortPosition.positionValue
      ) {
        const sizeTotal = shortPosition
          ? size - shortPosition.positionValue
          : size;
        const triggerPrice = price * (1 - (tolerance * 2) / 100);
        await bybit.createStopLimitOrder(
          symbol,
          side,
          triggerPrice,
          sizeTotal,
          price * (1 - tp / 100),
          price * (1 + sl / 100),
        );
        await Ticker.incrementField(symbol, `${user}.attemptsCount`, -1);
        await sendMsgMe(bot, {
          header: `<code>${symbol.slice(0, -4)}</code>`,
          msg: `🔴 [${user}] Open Short ${renderTradingBtn(tradingType, side)}\n${triggerPrice.toFixed(priceScale)}$ Size ${sizeTotal.toFixed(2)}$ Attempt ${attemptsCount}\n [${candlesCount}, ${touchCount}, ${tolerance}]`,
          footer: `#${symbol.slice(0, -4)} #${symbol.slice(0, -4)}_Open_Short_${user}`,
        });
        if (attemptsCount === 1) {
          await sendMsgMe(bot, {
            header: `<code>${symbol.slice(0, -4)}</code>`,
            msg: `${user} The number of attempts has been exhausted. Trading closed!`,
            footer: `#${symbol.slice(0, -4)} #${symbol.slice(0, -4)}_Trading_Close`,
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error processing:`, error.message);
    await Ticker.incrementField(symbol, `${user}.attemptsCount`, 1);
    await sendMsgMe(bot, {
      msg: `AlgoTrading Error ${symbol} ${error.message}`,
    });
  }
};
