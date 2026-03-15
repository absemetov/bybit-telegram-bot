import { Markup } from "telegraf";
import Ticker from "../models/Ticker.js";
import { sendMsgMe } from "../helpers/helpers.js";
const MAX_POSITION_USDT = 10000;
const TAKE_PROFIT = 5;
const STOP_LOSS = 1;
//check TP SL break set default values
const checkPositions = async (
  ticker,
  currentPrice,
  bot,
  bybit,
  user,
  positions,
  orders,
) => {
  const { symbol, priceScale } = ticker;
  const { sl, tp, breakeven, trailing, tolerance } = ticker[user] || {};
  const tickerStopLoss = sl || STOP_LOSS;
  const tickerTakeProfit = tp || TAKE_PROFIT;
  for (const order of orders.stop) {
    if (
      Math.abs(order.price - currentPrice) / currentPrice >
      (tolerance * 3) / 100
    ) {
      await bybit.cancelOrder(symbol, order.orderId);
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
        header: `☢️[${user}] <code>${symbol.slice(0, -4)}</code>`,
        msg: `FOMO!!! Close position!!! Emotions!!! Worning positions size increase ${MAX_POSITION_USDT.toFixed(2)}$ < ${positionValue}$`,
        footer: `#${symbol.slice(0, -4)} #FOMO`,
      });
    }
    if (positionValue > MAX_POSITION_USDT * 1.2 && orders.length > 0) {
      for (const order of orders.stop) {
        await bybit.cancelOrder(symbol, order.orderId);
      }
      await sendMsgMe(bot, {
        header: `☢️[${user}] <code>${symbol.slice(0, -4)}</code>`,
        msg: `Orders closed! Worning positions size increase ${MAX_POSITION_USDT.toFixed(2)}$  ${positionValue}$`,
        footer: `#${symbol.slice(0, -4)} #${symbol.slice(0, -4)}_Fomo`,
      });
    }
    //short side
    if (side === "Sell") {
      //set default sl
      const newStopLoss = avgPrice * (1 + tickerStopLoss / 100);
      if (
        !stopLoss ||
        (Math.abs(((newStopLoss - stopLoss) / stopLoss) * 100) >= 0.03 &&
          slPersent > 0)
      ) {
        await bybit.editStopLoss(symbol, side, newStopLoss.toFixed(priceScale));
      }
      //breakeven trailing stop
      if (breakeven !== 0 && pnlPersent < -breakeven) {
        const newStopLoss = avgPrice * (1 + trailing / 100);
        if (((newStopLoss - stopLoss) / stopLoss) * 100 < -0.1) {
          await bybit.editStopLoss(
            symbol,
            side,
            newStopLoss.toFixed(priceScale),
          );
          await sendMsgMe(bot, {
            header: `📝[${user}] <code>${symbol.slice(0, -4)}</code>`,
            msg:
              `Breakeven ${breakeven}%, TrailingStop ${(pnlPersent * (trailing / 100)).toFixed(2)}% 🔴 Short Size: ${positionValue}$, pnlPersent ${pnlPersent.toFixed(2)}%\n` +
              `SL value: ${stopLoss}$ => ${newStopLoss.toFixed(priceScale)}$`,
            footer: `#${symbol.slice(0, -4)}_${user}`,
          });
        }
      }
      //set TP
      const newTakeProfit = avgPrice * (1 - tickerTakeProfit / 100);
      if (
        !takeProfit ||
        (Math.abs(newTakeProfit - takeProfit) / takeProfit) * 100 >= 0.03
      ) {
        await bybit.editTakeProfit(
          symbol,
          side,
          newTakeProfit.toFixed(priceScale),
        );
      }
    }
    if (side === "Buy") {
      //set default SL
      const newStopLoss = avgPrice * (1 - tickerStopLoss / 100);
      if (
        !stopLoss ||
        (Math.abs(((newStopLoss - stopLoss) / stopLoss) * 100) >= 0.03 &&
          slPersent < 0)
      ) {
        await bybit.editStopLoss(symbol, side, newStopLoss.toFixed(priceScale));
      }
      //breakeven
      if (breakeven !== 0 && pnlPersent > breakeven) {
        const newStopLoss = avgPrice * (1 - trailing / 100);
        if (((newStopLoss - stopLoss) / stopLoss) * 100 > 0.1) {
          await bybit.editStopLoss(
            symbol,
            side,
            newStopLoss.toFixed(priceScale),
          );
          await sendMsgMe(bot, {
            header: `📝[${user}] <code>${symbol.slice(0, -4)}</code>`,
            msg:
              `Breakeven ${breakeven}%, TrailingStop ${(pnlPersent * (trailing / 100)).toFixed(2)}% 🟢 Long Size: ${positionValue}$ pnlPersent ${pnlPersent.toFixed(2)}%\n` +
              `SL value: ${stopLoss}$ => ${newStopLoss.toFixed(priceScale)}$`,
            footer: `#${symbol.slice(0, -4)}_${user}`,
          });
        }
      }
      //set TP
      const newTakeProfit = avgPrice * (1 + tickerTakeProfit / 100);
      if (
        !takeProfit ||
        (Math.abs(newTakeProfit - takeProfit) / takeProfit) * 100 > 0.03
      ) {
        await bybit.editTakeProfit(
          symbol,
          side,
          newTakeProfit.toFixed(priceScale),
        );
      }
    }
  }
};
//telegram close position msg
async function sendTelegramReport(symbol, bybit, user, bot) {
  const closedPositions = await bybit.getClosedPositionsHistory(symbol);
  const lastClosedPosition = closedPositions.positions[0];
  const { closedPnl, side } = lastClosedPosition;
  //
  function changePercent(a, b) {
    return ((Math.abs(a - b) / b) * 100).toFixed(2);
  }

  function formatDate(timestamp) {
    if (!timestamp) return "";
    return new Date(+timestamp).toLocaleString("ru-RU");
  }
  const { positions, balance } = closedPositions;
  const profitableTrades = positions.filter(
    (trade) => parseFloat(trade.closedPnl) > 0,
  ).length;
  const lossTrades = positions.filter(
    (trade) => parseFloat(trade.closedPnl) < 0,
  ).length;
  const winRate = ((profitableTrades / positions.length) * 100).toFixed(2);
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
      header: `${closedPnl > 0 ? "✅" : "⛔️"}[${user}] <code>${symbol.slice(0, -4)}</code>`,
      msg:
        `${closedPnl > 0 ? "👍Profit" : "☝️Loss"} ${side !== "Buy" ? "📈 Long" : "📉 Short"} position closed\n` +
        `💰Balance: ${balance.toFixed(2)}$\n` +
        `${positions.length} trades analytics\n` +
        `Total Pnl: ${totalData.pnl.toFixed(2)}$ (${totalData.totalPrcnt > 0 ? "+" : ""}${totalData.totalPrcnt.toFixed(2)}%), WinRate: ${winRate}%, profitTrades: +${profitableTrades}(+${totalData.profPrcnt.toFixed(2)}%), lossTrades: -${lossTrades}(-${totalData.lossPrcnt.toFixed(2)}%)\n` +
        closedPositions.positions
          .slice(0, 10)
          .map(
            (item, index) =>
              `${index + 1}) ${item.closedPnl > 0 ? "🟢" : "🔴"} | ${formatDate(item.updatedTime)} | ${item.side !== "Buy" ? "Long" : "Short"} | ${(+item.cumExitValue).toFixed(1)}$ | ${(+item.closedPnl).toFixed(1)}$ | ${item.closedPnl > 0 ? "+" : "-"}${changePercent(item.avgExitPrice, item.avgEntryPrice)}%`,
          )
          .join("\n"),
      footer: `#${symbol.slice(0, -4)}_${user} #${closedPnl > 0 ? "profit" : "loss"}`,
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
}
//core 2/03/2026 4/03/2026
export const algoTrading = async (
  ticker,
  price,
  bot,
  bybit,
  user,
  longAlert,
  shortAlert,
  attemptsCount,
) => {
  const { symbol, priceScale } = ticker;
  try {
    const { size, sl, tp, tolerance, trend, part } = ticker[user] || {};
    //your trading account must not drop below 90% of the initial account balance!!!
    const orders = await bybit.getTickerOrders(symbol);
    const longOrders = orders.stop.filter((o) => o.side === "Buy");
    const shortOrders = orders.stop.filter((o) => o.side === "Sell");
    const positions = await bybit.getTickerPositions(symbol);
    const longPosition = positions.find((p) => p.side === "Buy");
    const shortPosition = positions.find((p) => p.side === "Sell");
    //calc grid enter 1/3 size
    const longSize = longPosition
      ? 1 - longPosition.positionValue / size < 0.35
        ? size - longPosition.positionValue
        : (size - longPosition.positionValue) * 0.5
      : size * 0.33;
    const shortSize = shortPosition
      ? 1 - shortPosition.positionValue / size < 0.35
        ? size - shortPosition.positionValue
        : (size - shortPosition.positionValue) * 0.5
      : size * 0.33;
    //New 28/02/2026 add open close event save position value in firestore
    const currentMap = {};
    positions.forEach((p) => {
      currentMap[p.side] = p;
    });
    //positions events new 6/03/2026
    for (const side of ["Buy", "Sell"]) {
      const posIcon = side === "Buy" ? "🟢 Long" : "🔴 Short";
      //position created
      if (!ticker[`${user}Position${side}Value`] && currentMap[side]) {
        const { positionValue, avgPrice } = currentMap[side];
        await Ticker.update(symbol, {
          [`${user}.attemptsCount`]: --attemptsCount,
          [`${user}Position${side}Value`]: positionValue,
        });
        //part50
        await bybit.setPart50(symbol, part, priceScale);
        await sendMsgMe(bot, {
          header: `🆕[${user}] <code>${symbol.slice(0, -4)}</code>`,
          msg:
            `Position ${posIcon} Opened +${positionValue}$\n` +
            `avgPrice ${(+avgPrice).toFixed(priceScale)}$\n` +
            `Size: ${positionValue} (${size})$\n` +
            `Attempts left: ${attemptsCount}`,
          footer: `#${symbol.slice(0, -4)}_${user}`,
        });
      }
      //position updated size
      if (ticker[`${user}Position${side}Value`] && currentMap[side]) {
        const { positionValue, avgPrice } = currentMap[side];
        const diff = positionValue - ticker[`${user}Position${side}Value`];
        if (Math.abs(diff) > 50) {
          await Ticker.update(symbol, {
            [`${user}Position${side}Value`]: positionValue,
          });
          //if position increased change part50
          if (diff > 0) {
            await bybit.setPart50(symbol, part, priceScale);
          }
          await sendMsgMe(bot, {
            header: `💰[${user}] <code>${symbol.slice(0, -4)}</code>`,
            msg:
              `Position ${posIcon} ${diff > 0 ? "increased +" : "decreased "}${diff.toFixed(2)}$\n` +
              `avgPrice ${(+avgPrice).toFixed(priceScale)}$\n` +
              `Size: ${positionValue} (${size})$.`,
            footer: `#${symbol.slice(0, -4)}_${user}`,
          });
        }
      }
      //position closed
      if (ticker[`${user}Position${side}Value`] && !currentMap[side]) {
        await Ticker.update(symbol, {
          [`${user}Position${side}Value`]: 0,
        });
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await sendTelegramReport(symbol, bybit, user, bot);
      }
    }
    //create LONG orders by alerts 4/03/2026
    if (
      longAlert &&
      longOrders.length === 0 &&
      longSize > 20 &&
      (attemptsCount > 0 || longPosition) &&
      ["up", "flat"].includes(trend)
    ) {
      const triggerPrice = price * (1 + tolerance / 100);
      await bybit.createStopLimitOrder(
        symbol,
        "Buy",
        triggerPrice,
        longSize,
        price * (1 + tp / 100),
        price * (1 - sl / 100),
      );
    }
    //create SHORT order min size 20$
    if (
      shortAlert &&
      shortOrders.length === 0 &&
      shortSize > 20 &&
      (attemptsCount > 0 || shortPosition) &&
      ["down", "flat"].includes(trend)
    ) {
      const triggerPrice = price * (1 - tolerance / 100);
      await bybit.createStopLimitOrder(
        symbol,
        "Sell",
        triggerPrice,
        shortSize,
        price * (1 - tp / 100),
        price * (1 + sl / 100),
      );
    }
    //set TP/SL break trailing control FOMO
    await checkPositions(ticker, price, bot, bybit, user, positions, orders);
  } catch (error) {
    console.error(`Error processing:`, error.message);
    await sendMsgMe(bot, {
      msg: `AlgoTrading Error ${symbol} ${error.message}`,
    });
  }
};
