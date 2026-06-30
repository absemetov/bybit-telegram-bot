import Ticker from "./Ticker.js";
import bot from "./telegram.js";
const MAX_POSITION_USDT = 10000;
const TAKE_PROFIT = 3;
const STOP_LOSS = -0.5;
//check TP SL break set default values
const checkPositions = async (
  ticker,
  currentPrice,
  bybit,
  user,
  positions,
  orders,
) => {
  const { symbol, priceScale, algoSettings = {} } = ticker;
  const { sl, tp, breakeven, trailing } = algoSettings || {};
  //const tolerance = 0.1;
  const tickerStopLoss = sl || STOP_LOSS;
  const tickerTakeProfit = tp || TAKE_PROFIT;
  //edit TP, SL set breakeven
  for (const position of positions) {
    const { side, avgPrice, markPrice, stopLoss, takeProfit, positionValue } =
      position;
    const pnlPersent = ((markPrice - avgPrice) / avgPrice) * 100;
    //check position size max and FOMO!!!
    if (positionValue >= MAX_POSITION_USDT * 1.2) {
      await bot.sendMessage({
        text:
          `☢️[${user}] html<code>${symbol.slice(0, -4)}</code>html\n` +
          `FOMO!!! Close position!!! Emotions!!! Worning positions size increase ${MAX_POSITION_USDT.toFixed(2)}$  ${positionValue}$` +
          `#${symbol.slice(0, -4)} #FOMO`,
      });
    }
    if (positionValue > MAX_POSITION_USDT * 1.2 && orders.stop.length > 0) {
      for (const order of orders.stop) {
        await bybit.cancelOrder(symbol, order.orderId);
      }
      await bot.sendMessage({
        text:
          `☢️[${user}] html<code>${symbol.slice(0, -4)}</code>html\n` +
          `Orders closed! Worning positions size increase ${MAX_POSITION_USDT.toFixed(2)}$  ${positionValue}$\n` +
          `#${symbol.slice(0, -4)} #${symbol.slice(0, -4)}_Fomo`,
      });
    }
    //short side
    if (side === "Sell") {
      //set default sl
      const newStopLoss = avgPrice * (1 - tickerStopLoss / 100);
      if (
        !stopLoss ||
        Math.abs(((newStopLoss - stopLoss) / stopLoss) * 100) >= 0.03
      ) {
        await bybit.editStopLoss(symbol, side, newStopLoss.toFixed(priceScale));
      }
      //breakeven trailing stop
      if (breakeven !== 0 && pnlPersent < -breakeven) {
        const newStopLoss = markPrice * (1 + trailing / 100);
        if (((newStopLoss - stopLoss) / stopLoss) * 100 < -0.2) {
          const slPersent = ((newStopLoss - avgPrice) / avgPrice) * 100;
          await bybit.editStopLoss(
            symbol,
            side,
            newStopLoss.toFixed(priceScale),
          );
          await Ticker.update(symbol, {
            [`${user}.sl`]: +slPersent.toFixed(2),
          });
          await bot.sendMessage({
            text:
              `📝[${user}] html<code>${symbol.slice(0, -4)}</code>html\n` +
              `Breakeven ${breakeven}%, TrailingStop ${trailing}% 🔴 Short Size: ${positionValue.toFixed(1)}$, pnlPersent ${pnlPersent.toFixed(2)}%\n` +
              `SL value: ${stopLoss}$ == ${newStopLoss.toFixed(priceScale)}$\n` +
              `#${symbol.slice(0, -4)}_${user}`,
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
      const newStopLoss = avgPrice * (1 + tickerStopLoss / 100);
      if (
        !stopLoss ||
        Math.abs(((newStopLoss - stopLoss) / stopLoss) * 100) >= 0.03
      ) {
        await bybit.editStopLoss(symbol, side, newStopLoss.toFixed(priceScale));
      }
      //breakeven
      if (breakeven !== 0 && pnlPersent > breakeven) {
        const newStopLoss = markPrice * (1 - trailing / 100);
        if (((newStopLoss - stopLoss) / stopLoss) * 100 > 0.2) {
          const slPersent = ((newStopLoss - avgPrice) / avgPrice) * 100;
          await bybit.editStopLoss(
            symbol,
            side,
            newStopLoss.toFixed(priceScale),
          );
          await Ticker.update(symbol, {
            [`${user}.sl`]: +slPersent.toFixed(2),
          });
          await bot.sendMessage({
            text:
              `📝[${user}] html<code>${symbol.slice(0, -4)}</code>html\n` +
              `Breakeven ${breakeven}%, TrailingStop ${trailing}% 🟢 Long Size: ${positionValue.toFixed(1)}$ pnlPersent ${pnlPersent.toFixed(2)}%\n` +
              `SL value: ${stopLoss}$ == ${newStopLoss.toFixed(priceScale)}$\n` +
              `#${symbol.slice(0, -4)}_${user}`,
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
async function sendTelegramReport(symbol, bybit, user, priceScale, attemptsCount) {
  const closedPositions = await bybit.getClosedPositionsHistory(symbol);
  const lastClosedPosition = closedPositions.positions[0];
  const { closedPnl, side } = lastClosedPosition;
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
  const balance = await bybit.getBybitBalance();
  await bot.sendMessage({
    text:
      `${closedPnl > 0 ? "✅" : "⛔️"}[${user}] html<code>${symbol.slice(0, -4)}</code>html\n` +
      `${closedPnl > 0 ? "👍Profit" : "☝️Loss"} ${side !== "Buy" ? "📈 Long" : "📉 Short"} position closed\n` +
      `💰Balance: ${balance.toFixed(2)}$\n` +
      `html<b>attemptsCount: ${attemptsCount}</b>html\n` +
      `${positions.length} trades analytics\n` +
      `Total Pnl: ${totalData.pnl.toFixed(2)}$ (${totalData.totalPrcnt > 0 ? "+" : ""}${totalData.totalPrcnt.toFixed(2)}%), WinRate: ${winRate}%, profitTrades: +${profitableTrades}(+${totalData.profPrcnt.toFixed(2)}%), lossTrades: -${lossTrades}(-${totalData.lossPrcnt.toFixed(2)}%)\n` +
      closedPositions.positions
        .slice(0, 10)
        .map(
          (item, index) =>
            `${index + 1}) ${item.closedPnl > 0 ? "🟢" : "🔴"} ` +
            `html<b>${(+item.closedPnl).toFixed(1)}$</b>html |` +
            `${formatDate(item.updatedTime)} |` +
            `Entry ${(+item.avgEntryPrice).toFixed(priceScale)}$ |` +
            `${(+item.cumExitValue).toFixed(1)}$ |` +
            `${item.closedPnl > 0 ? "+" : "-"}${changePercent(item.avgExitPrice, item.avgEntryPrice)}%`,
        )
        .join("\n") +
      `\n#${symbol.slice(0, -4)}_${user} #${closedPnl > 0 ? "profit" : "loss"}`,
    button: {
      text: `${symbol} chart`,
      url: `https://bybit.rzk.com.ru/#/${symbol}`,
    },
  });
}
//core 2/03/2026 4/03/2026 26/06/2026 only algotrading
//The bot acts strictly according to predefined rules: no greed, fear, or hope. It will not move a stop-loss "because it feels right,"
//nor will it enter a trade out of euphoria after news events.
//Emotions are the primary reason retail traders blow up their accounts, and an algorithm completely removes them from the equation.
export const algoTrading = async (ticker, price, bybit, user, trigger) => {
  const { symbol, priceScale, algoSettings = {} } = ticker;
  try {
    const { size, slOpen, tp, part, attemptsCount } = algoSettings || {};
    const orders = await bybit.getTickerOrders(symbol);
    const positions = await bybit.getTickerPositions(symbol);
    const currentMap = {};
    positions.forEach((p) => {
      currentMap[p.side] = p;
    });
    //positions events new 6/03/2026
    for (const side of ["Buy", "Sell"]) {
      const posIcon = side === "Buy" ? "🟢 Long" : "🔴 Short";
      //position created
      const currentPosition = positions.find((p) => p.side === side);
      if (!ticker[`position${side}Value`] && currentPosition) {
        const posValue = currentPosition.avgPrice * currentPosition.size;
        await Ticker.update(symbol, {
          [`${user}.attemptsCount`]: attemptsCount - 1,
          [`${user}Position${side}Value`]: posValue,
          [`${user}.sl`]: slOpen,
        });
        //part50
        await bybit.setPart50(
          symbol,
          part,
          priceScale,
          side,
          orders,
          positions,
        );
        await bot.sendMessage({
          text:
            `🆕[${user}] html<code>${symbol.slice(0, -4)}</code>html\n` +
            `Position ${posIcon} Opened +${posValue.toFixed(1)}$\n` +
            `avgPrice ${currentPosition.avgPrice.toFixed(priceScale)}$\n` +
            `Size: ${posValue.toFixed(1)} (${size})$\n` +
            `#${symbol.slice(0, -4)}_${user}`,
        });
      }
      //position updated size
      if (ticker[`position${side}Value`] && currentPosition) {
        const posValue = currentPosition.avgPrice * currentPosition.size;
        const diff = posValue - ticker[`position${side}Value`];
        //close extra orders
        if (posValue > size) {
          for (const order of orders.stop) {
            await bybit.cancelOrder(symbol, order.orderId);
          }
        }
        if (Math.abs(diff) > 50) {
          await Ticker.update(symbol, {
            [`${user}Position${side}Value`]: posValue,
          });
          //if position increased change part50
          if (diff > 0) {
            await bybit.setPart50(
              symbol,
              part,
              priceScale,
              side,
              orders,
              positions,
            );
          }
          await bot.sendMessage({
            text:
              `💰[${user}] html<code>${symbol.slice(0, -4)}</code>html\n` +
              `Position ${posIcon} ${diff > 0 ? "increased +" : "decreased "}${diff.toFixed(2)}$\n` +
              `avgPrice ${currentPosition.avgPrice.toFixed(priceScale)}$\n` +
              `posValue: ${posValue.toFixed(1)} (${size})$.\n` +
              `#${symbol.slice(0, -4)}_${user}`,
          });
        }
      }
      //position closed
      if (ticker[`position${side}Value`] && !currentMap[side]) {
        await Ticker.update(symbol, {
          [`${user}Position${side}Value`]: 0,
        });
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await sendTelegramReport(symbol, bybit, user, priceScale, attemptsCount);
      }
    }
    //create LONG orders by alerts 4/03/2026
    if (trigger && user === "main" && attemptsCount > 0) {
      const triggerId = trigger[0];
      const triggerPrice = trigger[1].price;
      const triggerSize = trigger[1].size;
      if (triggerSize && triggerPrice)
        await bybit.createStopLimitOrder(
          symbol,
          "Buy",
          triggerPrice,
          triggerSize,
          triggerPrice * (1 + tp / 100),
          triggerPrice * (1 - Math.abs(slOpen) / 100),
        );
      //disable trigger
      await Ticker.update(symbol, {
        [`${user}Triggers.${triggerId}.active`]: false,
      });
    }
    //create SHORT order min size 20$
    if (trigger && user === "sub" && attemptsCount > 0) {
      //const triggerPrice = trigger[0] * (1 - tolerance / 100);
      const triggerId = trigger[0];
      const triggerPrice = trigger[1].price;
      const triggerSize = trigger[1].size;
      if (triggerSize && triggerPrice)
        await bybit.createStopLimitOrder(
          symbol,
          "Sell",
          triggerPrice,
          triggerSize,
          triggerPrice * (1 - tp / 100),
          triggerPrice * (1 + Math.abs(slOpen) / 100),
        );
      //disable trigger
      await Ticker.update(symbol, {
        [`${user}Triggers.${triggerId}.active`]: false,
      });
    }
    //set TP/SL break trailing control FOMO
    await checkPositions(ticker, price, bybit, user, positions, orders);
  } catch (error) {
    console.error(`Error processing:`, error.message);
    await bot.sendMessage({
      text: `AlgoTrading Error [${user}] ${symbol} ${error.message}`,
    });
  }
};
