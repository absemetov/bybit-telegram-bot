//import { bybitUsers } from "../helpers/bybitV5.js";
import { Markup } from "telegraf";
import Ticker from "../models/Ticker.js";
import { sendMsgMe } from "../helpers/helpers.js";
//const balance = await getBybitBalance();
//leverage
const MAX_POSITION_USDT = 10000;
const TAKE_PROFIT = 10;
const STOP_LOSS = 0.7;
//trading btn render
function renderTradingBtn(tradingType, enterTf) {
  const icon =
    tradingType === "Buy" ? "↗️" : tradingType === "Sell" ? "↘️" : "↗️↘️";
  return `${icon} ${enterTf}`;
}
//check TP SL set default values
export const checkPositions = async (
  ticker,
  currentPrice,
  bot,
  levels,
  bybit,
  user,
  positions,
  orders,
) => {
  const { symbol, priceScale } = ticker;
  const {
    sl,
    tp,
    tolerance,
    candlesCount,
    touchCount,
    breakeven,
    tradingType,
    enterTf,
  } = ticker[user] || {};
  const tickerStopLoss = sl || STOP_LOSS;
  const tickerTakeProfit = tp || TAKE_PROFIT;
  //get positions
  //const bybit = bybitUsers[user];
  //const positions = await bybit.getTickerPositions(symbol);
  //const orders = await bybit.getTickerOrders(symbol);
  //delete old orders price tolerance x 5
  for (const order of orders) {
    if (
      Math.abs(order.price - currentPrice) / currentPrice >
      (tolerance * 5) / 100
    ) {
      await bybit.cancelOrder(symbol, order.orderId);
      //await Ticker.incrementField(symbol, `${user}.attemptsCount`, 1);
      await sendMsgMe(bot, {
        header: `<code>${symbol.slice(0, -4)}</code>`,
        msg: `[${user}] Cancel ${order.side} Current price ${currentPrice}$ Order Price ${order.price}$ Sum: ${order.sum}$ ${renderTradingBtn(tradingType, enterTf)}\n[${candlesCount}, ${touchCount}, ${tolerance}]`,
        footer: `#${symbol.slice(0, -4)}_${user}`,
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
        (Math.abs(((newStopLoss - stopLoss) / stopLoss) * 100) >= 0.05 &&
          slPersent > 0)
      ) {
        await bybit.editStopLoss(symbol, side, newStopLoss.toFixed(priceScale));
        await sendMsgMe(bot, {
          header: `<code>${symbol.slice(0, -4)}</code>`,
          msg:
            `Set default SL 🔴 Short [${user}] ${renderTradingBtn(tradingType, enterTf)} ${tickerStopLoss}% slPersent before ${slPersent.toFixed(2)}% pnlPersent ${pnlPersent.toFixed(2)}%\n` +
            `SL value: ${stopLoss}$ => ${newStopLoss.toFixed(priceScale)}$ [${candlesCount}, ${touchCount}]`,
          footer: `#${symbol.slice(0, -4)}_${user}`,
        });
      }
      //breakeven 20%
      if (pnlPersent < -breakeven) {
        const newStopLoss = avgPrice * (1 + (pnlPersent * 0.2) / 100);
        if (((newStopLoss - stopLoss) / stopLoss) * 100 < -0.05) {
          await bybit.editStopLoss(
            symbol,
            side,
            newStopLoss.toFixed(priceScale),
          );
          await sendMsgMe(bot, {
            header: `<code>${symbol.slice(0, -4)}</code>`,
            msg:
              `Breakeven20% ${(pnlPersent * 0.2).toFixed(2)}% 🔴 Short [${user}] ${renderTradingBtn(tradingType, enterTf)} breakeven start ${breakeven}%, pnlPersent ${pnlPersent.toFixed(2)}%\n` +
              `SL value: ${stopLoss}$ => ${newStopLoss.toFixed(priceScale)}$ [${candlesCount}, ${touchCount}]`,
            footer: `#${symbol.slice(0, -4)}_${user}`,
          });
        }
      }
      //set TP
      const newTakeProfit = avgPrice * (1 - tickerTakeProfit / 100);
      //tp auto for scalping
      //if (tp === 1 && levels.support > 0 && levels.support < avgPrice) {
      //  newTakeProfit = levels.support * (1 + (tolerance * 2) / 100);
      //}
      if (
        !takeProfit ||
        (Math.abs(newTakeProfit - takeProfit) / takeProfit) * 100 >= 0.05
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
            `Edit TP 🔴 Short ${tp === 1 ? "Scalping" : ""} [${user}] ${renderTradingBtn(tradingType, enterTf)} TAKE_PROFIT changed to ${takePrcnt.toFixed(2)}% pnlPersent ${pnlPersent.toFixed(2)}%\n` +
            `TP value: ${takeProfit}$ => ${newTakeProfit.toFixed(priceScale)}$ [${candlesCount}, ${touchCount}]`,
          footer: `#${symbol.slice(0, -4)}_${user}`,
        });
      }
    }
    if (side === "Buy") {
      //set default SL
      const newStopLoss = avgPrice * (1 - tickerStopLoss / 100);
      if (
        !stopLoss ||
        (Math.abs(((newStopLoss - stopLoss) / stopLoss) * 100) >= 0.05 &&
          slPersent < 0)
      ) {
        await bybit.editStopLoss(symbol, side, newStopLoss.toFixed(priceScale));
        await sendMsgMe(bot, {
          header: `<code>${symbol.slice(0, -4)}</code>`,
          msg:
            `Set default SL 🟢 Long [${user}] ${renderTradingBtn(tradingType, enterTf)} Set default SL ${tickerStopLoss}% slPersent before ${slPersent.toFixed(2)}% pnlPersent ${pnlPersent.toFixed(2)}%\n` +
            `SL value: ${stopLoss}$ => ${newStopLoss.toFixed(priceScale)}$ [${candlesCount}, ${touchCount}]`,
          footer: `#${symbol.slice(0, -4)}_${user}`,
        });
      }
      //breakeven 20%
      if (pnlPersent > breakeven) {
        const newStopLoss = avgPrice * (1 + (pnlPersent * 0.2) / 100);
        if (((newStopLoss - stopLoss) / stopLoss) * 100 > 0.05) {
          await bybit.editStopLoss(
            symbol,
            side,
            newStopLoss.toFixed(priceScale),
          );
          await sendMsgMe(bot, {
            header: `<code>${symbol.slice(0, -4)}</code>`,
            msg:
              `Breakeven20% ${(pnlPersent * 0.2).toFixed(2)}% 🟢 Long [${user}] ${renderTradingBtn(tradingType, enterTf)} breakeven start ${breakeven}% pnlPersent ${pnlPersent.toFixed(2)}%\n` +
              `SL value: ${stopLoss}$ => ${newStopLoss.toFixed(priceScale)}$ [${candlesCount}, ${touchCount}]`,
            footer: `#${symbol.slice(0, -4)}_${user}`,
          });
        }
      }
      //set TP
      const newTakeProfit = avgPrice * (1 + tickerTakeProfit / 100);
      //auto TP for scalping
      //if (tp === 1 && levels.resistance > avgPrice) {
      //  newTakeProfit = levels.resistance * (1 - (tolerance * 2) / 100);
      //}
      if (
        !takeProfit ||
        (Math.abs(newTakeProfit - takeProfit) / takeProfit) * 100 > 0.05
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
            `Edit TP 🟢 Long ${tp === 1 ? "Scalping" : ""} [${user}] ${renderTradingBtn(tradingType, enterTf)} TAKE_PROFIT changed to ${takePrcnt.toFixed(2)}% pnlPersent ${pnlPersent.toFixed(2)}%\n` +
            `TP value: ${takeProfit}$ => ${newTakeProfit.toFixed(priceScale)}$ [${candlesCount}, ${touchCount}]`,
          footer: `#${symbol.slice(0, -4)}_${user}`,
        });
      }
    }
  }
};
//Algo Trading 15.09.2025
export const algoTrading = async (ticker, levels, price, bot, bybit, user) => {
  const { symbol, priceScale } = ticker;
  try {
    const {
      size = 0,
      sl,
      tp,
      candlesCount,
      touchCount,
      tolerance,
      enterTf,
      attemptsCount = 0,
      tradingType = "Buy",
    } = ticker[user] || {};
    //your trading account must not drop below 90% of the initial account balance!!!
    //const balance = await getBybitBalance();
    //const size = MAX_POSITION_USDT;
    //get limit orders
    //const bybit = bybitUsers[user];
    const orders = await bybit.getTickerOrders(symbol);
    const longOrders = orders.filter((o) => o.side === "Buy");
    const shortOrders = orders.filter((o) => o.side === "Sell");
    const positions = await bybit.getTickerPositions(symbol);
    const longPosition = positions.find((p) => p.side === "Buy");
    const shortPosition = positions.find((p) => p.side === "Sell");
    //New 9/02/2026 increment attempts if last closed position win
    const closedPositions = await bybit.getClosedPositionsHistory(symbol);
    const lastClosedPosition = closedPositions.positions[0];
    if (lastClosedPosition) {
      const { updatedTime, closedPnl, side } = lastClosedPosition;
      const newClosedPosition =
        +updatedTime !== ticker[`${user}ClosedPositionTime`];
      if (newClosedPosition) {
        const increment = closedPnl > 0 ? 1 : -1;
        await Ticker.update(symbol, {
          [`${user}ClosedPositionTime`]: +updatedTime,
          [`${user}.attemptsCount`]: attemptsCount + increment,
        });
        //
        function changePercent(a, b) {
          return ((Math.abs(a - b) / b) * 100).toFixed(2);
        }

        function formatDate(timestamp) {
          if (!timestamp) return "";
          return new Date(+timestamp).toLocaleString("ru-RU");
        }
        const { positions } = closedPositions;
        const profitableTrades = positions.filter(
          (trade) => parseFloat(trade.closedPnl) > 0,
        ).length;
        const lossTrades = positions.filter(
          (trade) => parseFloat(trade.closedPnl) < 0,
        ).length;
        const winRate = ((profitableTrades / positions.length) * 100).toFixed(
          2,
        );
        const total = {
          pnl: 0,
          lossPrcnt: 0,
          profPrcnt: 0,
        };
        const totalData = positions.reduce((acc, trade) => {
          acc.pnl = acc.pnl + +trade.closedPnl;
          const changePrcnt =
            Math.abs(
              (trade.avgExitPrice - trade.avgEntryPrice) / trade.avgEntryPrice,
            ) * 100;
          if (trade.closedPnl > 0) {
            acc.profPrcnt += changePrcnt;
          } else {
            acc.lossPrcnt = acc.lossPrcnt + changePrcnt;
          }
          return acc;
        }, total);
        totalData.totalPrcnt = totalData.profPrcnt - totalData.lossPrcnt;
        await sendMsgMe(
          bot,
          {
            header: `<code>${symbol.slice(0, -4)}</code>`,
            msg:
              `${closedPnl > 0 ? "🟢Profit" : "🔴Loss"} ${side !== "Buy" ? "Long" : "Short"} [${user}] position closed\n` +
              `Attemts Count: ${attemptsCount} ${closedPnl > 0 ? "+ 1" : "- 1"} = ${attemptsCount + increment}\n` +
              `${positions.length} trades analytics\n` +
              `Pnl: ${totalData.pnl.toFixed(2)}$ (${totalData.totalPrcnt > 0 ? "+" : ""}${totalData.totalPrcnt.toFixed(2)}%), WinRate: ${winRate}%, profitTrades: +${profitableTrades}(+${totalData.profPrcnt.toFixed(2)}%), lossTrades: -${lossTrades}(-${totalData.lossPrcnt.toFixed(2)}%)\n` +
              closedPositions.positions
                .slice(0, 10)
                .map(
                  (item, index) =>
                    `${index + 1}) ${item.closedPnl > 0 ? "🟢" : "🔴"} | ${formatDate(item.updatedTime)} | ${item.side !== "Buy" ? "Long" : "Short"} | ${(+item.closedPnl).toFixed(2)}$ | ${item.closedPnl > 0 ? "+" : "-"}${changePercent(item.avgExitPrice, item.avgEntryPrice)}%`,
                )
                .join("\n"),
            footer: `#${symbol.slice(0, -4)}_${user} #${increment > 0 ? "profit" : "loss"}`,
          },
          Markup.inlineKeyboard([
            [
              Markup.button.url(
                `${symbol} chart`,
                `https://bybit.rzk.com.ru/chart/${symbol}`,
              ),
            ],
          ]),
        );
        if (attemptsCount + increment === 0) {
          await sendMsgMe(bot, {
            header: `<code>${symbol.slice(0, -4)}</code>`,
            msg: `[${user}] The number of attempts has been exhausted. Trading closed!`,
            footer: `#${symbol.slice(0, -4)}_${user}`,
          });
        }
      }
    }
    //console.log(symbol, closedPositions);
    //create LONG orders
    const longX = levels.support > price ? 3 : 1;
    if (
      Math.abs(levels.support - price) / price <= (tolerance * longX) / 100 &&
      levels.support > 0 &&
      (tradingType === "Buy" || tradingType === "Flat") &&
      longOrders.length === 0 &&
      attemptsCount > 0 &&
      size > 0
    ) {
      //limit positions
      if (positions.length >= 3) {
        await sendMsgMe(bot, {
          msg: `Positions limit 3 ${symbol} not open Buy order!`,
        });
        return;
      }
      if (!longPosition || size * (1 - 1 / 100) > longPosition.positionValue) {
        const sizeTotal = longPosition
          ? size - longPosition.positionValue
          : size;
        const triggerPrice = price * (1 + (tolerance * 2) / 100);
        await bybit.createStopLimitOrder(
          symbol,
          "Buy",
          triggerPrice,
          sizeTotal,
          price * (1 + tp / 100),
          price * (1 - sl / 100),
        );
        //await Ticker.incrementField(symbol, `${user}.attemptsCount`, -1);
        await sendMsgMe(bot, {
          header: `<code>${symbol.slice(0, -4)}</code>`,
          msg: `🟢 [${user}] Open Long ${renderTradingBtn(tradingType, levels.fastLevel ? "15min Fast" : enterTf)}\n${triggerPrice.toFixed(priceScale)}$ Size ${sizeTotal.toFixed(2)}$ Attempt ${attemptsCount}\n [${candlesCount}, ${touchCount}, ${tolerance}]`,
          footer: `#${symbol.slice(0, -4)}_${user}`,
        });
      }
    }
    //create SHORT orders
    const shortX = levels.resistance > 0 && levels.resistance < price ? 3 : 1;
    if (
      Math.abs(levels.resistance - price) / price <=
        (tolerance * shortX) / 100 &&
      (tradingType === "Sell" || tradingType === "Flat") &&
      shortOrders.length === 0 &&
      attemptsCount > 0 &&
      size > 0
    ) {
      //limit positions
      if (positions.length >= 3) {
        await sendMsgMe(bot, {
          msg: `Positions limit 3 ${symbol} not open Sell order!`,
        });
        return;
      }
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
          "Sell",
          triggerPrice,
          sizeTotal,
          price * (1 - tp / 100),
          price * (1 + sl / 100),
        );
        //await Ticker.incrementField(symbol, `${user}.attemptsCount`, -1);
        await sendMsgMe(bot, {
          header: `<code>${symbol.slice(0, -4)}</code>`,
          msg: `🔴 [${user}] Open Short ${renderTradingBtn(tradingType, levels.fastLevel ? "15min Fast" : enterTf)}\n${triggerPrice.toFixed(priceScale)}$ Size ${sizeTotal.toFixed(2)}$ Attempt ${attemptsCount}\n [${candlesCount}, ${touchCount}, ${tolerance}]`,
          footer: `#${symbol.slice(0, -4)}_${user}`,
        });
      }
    }
    //set TP/SL control FOMO
    await checkPositions(
      ticker,
      price,
      bot,
      levels,
      bybit,
      user,
      positions,
      orders,
    );
  } catch (error) {
    console.error(`Error processing:`, error.message);
    //await Ticker.incrementField(symbol, `${user}.attemptsCount`, 1);
    await sendMsgMe(bot, {
      msg: `AlgoTrading Error ${symbol} ${error.message}`,
    });
  }
};
