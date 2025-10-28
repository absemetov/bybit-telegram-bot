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
//leverage
const MAX_POSITION_USDT = balance * 5;
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
    if (positionValue >= MAX_POSITION_USDT * 1.2) {
      await sendMsgMe(bot, {
        header: `<code>${symbol.slice(0, -4)}</code>`,
        msg: `FOMO!!! Close position!!! Emotions!!! Worning positions size increase ${MAX_POSITION_USDT.toFixed(2)}$ < ${positionValue}$`,
        footer: `#${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
      });
    }
    if (positionValue > MAX_POSITION_USDT * 1.2 && orders.length > 0) {
      for (const order of orders) {
        await cancelOrder(symbol, order.orderId);
      }
      await sendMsgMe(bot, {
        header: `<code>${symbol.slice(0, -4)}</code>`,
        msg: `Worning positions size increase ${MAX_POSITION_USDT.toFixed(2)}$  ${positionValue}$`,
        footer: `#${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
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
        await editStopLoss(symbol, side, newStopLoss.toFixed(priceScale));
        await sendMsgMe(bot, {
          header: `<code>${symbol.slice(0, -4)}</code>`,
          msg: `${renderTradingBtn(tradingType)} Set default SL ${tickerStopLoss}% 🔴 Short] slPersent before ${slPersent.toFixed(2)}%`,
          footer: `${stopLoss}  ${newStopLoss.toFixed(priceScale)} ${enterTf} [${candlesCount}, ${touchCount}]\n#${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
        });
      }
      //breakeven 20%
      if (pnlPersent < -4) {
        const newStopLoss = avgPrice * (1 + (pnlPersent * 0.2) / 100);
        if (((newStopLoss - stopLoss) / stopLoss) * 100 < -0.1) {
          await editStopLoss(symbol, side, newStopLoss.toFixed(priceScale));
          await sendMsgMe(bot, {
            header: `<code>${symbol.slice(0, -4)}</code>`,
            msg: `${renderTradingBtn(tradingType)} Breakeven 20% 🔴 Short pnl  4%] pnlPersent ${pnlPersent.toFixed(2)}%`,
            footer: `${stopLoss}  ${newStopLoss.toFixed(priceScale)} ${enterTf} [${candlesCount}, ${touchCount}]\n#${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
          });
        }
      }
      //flat with auto TP mode
      let newTakeProfit = takeProfit;
      let levelPrcnt = 0;
      if (tradingType === 4 && levels.support) {
        levelPrcnt = ((levels.support - avgPrice) / avgPrice) * 100 + tolerance;
        if (levelPrcnt <= -0.5) {
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
        await sendMsgMe(bot, {
          header: `<code>${symbol.slice(0, -4)}</code>`,
          msg: `${renderTradingBtn(tradingType)} TAKE_PROFIT changed to ${levelPrcnt <= -0.5 ? levelPrcnt.toFixed(2) : tickerTakeProfit}% 🔴 Short] pnlPersent ${pnlPersent.toFixed(2)}%`,
          footer: `TP value: ${takeProfit}  ${newTakeProfit.toFixed(priceScale)} ${enterTf} [${candlesCount}, ${touchCount}]\n#${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
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
        await editStopLoss(symbol, side, newStopLoss.toFixed(priceScale));
        await sendMsgMe(bot, {
          header: `<code>${symbol.slice(0, -4)}</code>`,
          msg: `${renderTradingBtn(tradingType)} Set default SL ${tickerStopLoss}% 🟢 Long] slPersent before ${slPersent.toFixed(2)}%`,
          footer: `${stopLoss}  ${newStopLoss.toFixed(priceScale)} ${enterTf} [${candlesCount}, ${touchCount}]\n#${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
        });
      }
      //breakeven 20%
      if (pnlPersent > 4) {
        const newStopLoss = avgPrice * (1 + (pnlPersent * 0.2) / 100);
        if (((newStopLoss - stopLoss) / stopLoss) * 100 > 0.1) {
          await editStopLoss(symbol, side, newStopLoss.toFixed(priceScale));
          await sendMsgMe(bot, {
            header: `<code>${symbol.slice(0, -4)}</code>`,
            msg: `${renderTradingBtn(tradingType)} Breakeven 20% 🟢 Long pnl 4%] pnlPersent ${pnlPersent.toFixed(2)}%`,
            footer: `${stopLoss}  ${newStopLoss.toFixed(priceScale)} ${enterTf} [${candlesCount}, ${touchCount}]\n#${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
          });
        }
      }
      //flat with auto TP mode
      let newTakeProfit = takeProfit;
      let levelPrcnt = 0;
      if (tradingType === 4 && levels.resistance) {
        levelPrcnt =
          ((levels.resistance - avgPrice) / avgPrice) * 100 - tolerance;
        if (levelPrcnt >= 0.5) {
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
        await sendMsgMe(bot, {
          header: `<code>${symbol.slice(0, -4)}</code>`,
          msg: `${renderTradingBtn(tradingType)} TAKE_PROFIT changed to ${levelPrcnt >= 0.5 ? levelPrcnt.toFixed(2) : tickerTakeProfit}% 🟢 Long] pnlPersent ${pnlPersent.toFixed(2)}%`,
          footer: `TP value: ${takeProfit}  ${newTakeProfit.toFixed(priceScale)} ${enterTf} [${candlesCount}, ${touchCount}]\n#${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
        });
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
      size,
      sl,
      tp,
      candlesCount,
      touchCount,
      tolerance,
      attemptsCount,
      priceScale,
    } = ticker;
    //your trading account must not drop below 90% of the initial account balance!!!
    //const balance = await getBybitBalance();
    //const size = MAX_POSITION_USDT;
    //get limit orders
    const orders = await getTickerOrders(symbol);
    const longOrders = orders.filter((o) => o.side === "Buy");
    const shortOrders = orders.filter((o) => o.side === "Sell");
    const positions = await getTickerPositions(symbol);
    const longPosition = positions.find((p) => p.side === "Buy");
    const shortPosition = positions.find((p) => p.side === "Sell");
    if (attemptsCount === 0) {
      await Ticker.updateField(symbol, "tradingType", 1);
      await sendMsgMe(bot, {
        header: `<code>${symbol.slice(0, -4)}</code>`,
        msg: `The number of attempts has been exhausted. Trading closed!`,
        footer: `#${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
      });
    }
    //notify price near level change mode? what do?
    //if (longPosition) {
    //  if ((longLevels.resistance - price) / price < 2 / 100) {
    //    await sendMsgMe(bot, {
    //      header: `<code>${symbol.slice(0, -4)}</code>`,
    //      msg: `Price near resistance 2% what do? Close #long, or change mode?`,
    //      footer: `#${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
    //    });
    //  }
    //}
    //if (shortPosition) {
    //  if ((longLevels.support - price) / price > -2 / 100) {
    //    await sendMsgMe(bot, {
    //      header: `<code>${symbol.slice(0, -4)}</code>`,
    //      msg: `Price near support 2% what do? Close #short,or change mode?`,
    //      footer: `#${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
    //    });
    //  }
    //}
    //delete old orders price tolerance > 1%
    for (const order of orders) {
      if (Math.abs(order.price - price) / price > tolerance / 100) {
        await cancelOrder(symbol, order.orderId);
      }
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
          size * (1 - 1 / 100) > longPosition.positionValue
        ) {
          const sizeTotal = longPosition
            ? size - longPosition.positionValue
            : size;
          const triggerPrice = price * (1 + tolerance / 100);
          await createStopLimitOrder(
            symbol,
            "Buy",
            triggerPrice,
            sizeTotal,
            price * (1 + tp / 100),
            price * (1 - sl / 100),
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
          await sendMsgMe(bot, {
            header: `<code>${symbol.slice(0, -4)}</code>`,
            msg: `🟢 Open Long ${triggerPrice.toFixed(priceScale)}$ Size ${sizeTotal.toFixed(2)}$ Attempts ${attemptsCount} ${renderTradingBtn(tradingType)}\n${enterTf} [${candlesCount} ${touchCount}, ${tolerance}]`,
            footer: `#${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
          });
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
          size * (1 - 1 / 100) > shortPosition.positionValue
        ) {
          const sizeTotal = shortPosition
            ? size - shortPosition.positionValue
            : size;
          const triggerPrice = price * (1 - tolerance / 100);
          await createStopLimitOrder(
            symbol,
            "Sell",
            triggerPrice,
            sizeTotal,
            price * (1 - tp / 100),
            price * (1 + sl / 100),
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
          await sendMsgMe(bot, {
            header: `<code>${symbol.slice(0, -4)}</code>`,
            msg: `🔴 Open Short ${triggerPrice.toFixed(priceScale)}$ Size ${sizeTotal.toFixed(2)}$ Attempts ${attemptsCount} ${renderTradingBtn(tradingType)}\n${enterTf} [${candlesCount} ${touchCount}, ${tolerance}]`,
            footer: `#${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error processing:`, error.message);
    await sendMsgMe(bot, { msg: `AlgoTrading Error ${error.message}` });
  }
};
