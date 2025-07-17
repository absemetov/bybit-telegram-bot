import {
  createLimitOrder,
  getBybitBalance,
  getTickerOrders,
  getTickerPositions,
  editStopLoss,
} from "../helpers/bybitV5.js";
export const checkLevels = async (
  ticker,
  candles,
  bot,
  support,
  resistance,
  currentRsi,
) => {
  const { symbol, priceScale, trading, openLong } = ticker;
  //get positions
  const balance = await getBybitBalance();
  const MAX_POSITION_USDT = balance / 5;
  const TAKE_PROFIT = 7.5;
  const STOP_LOSS = 2;
  const positions = await getTickerPositions(symbol);
  const orders = await getTickerOrders(symbol);
  const currentPrice = candles[candles.length - 1].close;
  //calculate indicators levels, rsi, rsiEma 1h timeframe!!!
  //TODO detect trend
  //edit TP, SL set breakeven
  for (const position of positions) {
    const { side, avgPrice, markPrice, stopLoss } = position;
    const slPersent = ((stopLoss - avgPrice) / avgPrice) * 100;
    const pnlPersent = ((markPrice - avgPrice) / avgPrice) * 100;
    if (side === "Sell") {
      //set default sl
      const newStopLoss = avgPrice * (1 + STOP_LOSS / 100);
      if (
        Math.abs(((newStopLoss - stopLoss) / stopLoss) * 100) >= 0.1 &&
        slPersent > 0
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
      //breakeven 40%
      if (pnlPersent < -5) {
        const newStopLoss = avgPrice * (1 + (pnlPersent * 0.4) / 100);
        if (((newStopLoss - stopLoss) / stopLoss) * 100 < -0.1) {
          await editStopLoss(symbol, side, newStopLoss.toFixed(priceScale));
          await bot.telegram.sendMessage(
            94899148,
            `<b>[Breakeven 40% 🔴 Short pnl > 5%] <code>${symbol.slice(0, -4)}</code> pnlPersent ${pnlPersent.toFixed(2)}%\n` +
              `${stopLoss} => ${newStopLoss.toFixed(priceScale)}</b>\n` +
              `#${symbol.slice(0, -4)} #SHORT_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
            { parse_mode: "HTML" },
          );
        }
      }
      //if rsi up close order
      // const tpPercent = longSignal
      //   ? ((currentPrice - avgPrice) / avgPrice) * 100
      //   : TAKE_PROFIT;
      // const newTakeProfit = avgPrice * (1 + (tpPercent * 1.002) / 100);
      // if (
      //   (Math.abs(newTakeProfit - takeProfit) / takeProfit) * 100 > 0.1 &&
      //   tpPercent < -3
      // ) {
      //   await editTakeProfit(symbol, side, newTakeProfit.toFixed(priceScale));
      //   await bot.telegram.sendMessage(
      //     94899148,
      //     `<b>[TAKE_PROFIT changed to ${tpPercent.toFixed(2)}% 🔴 Short] <code>${symbol.slice(0, -4)}</code> pnlPersent ${pnlPersent.toFixed(2)}%\n` +
      //       `TP value: ${takeProfit} => ${newTakeProfit.toFixed(priceScale)}</b>\n` +
      //       `#${symbol.slice(0, -4)} #SHORT_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
      //     { parse_mode: "HTML" },
      //   );
      // }
    }
    if (side === "Buy") {
      //set default SL
      const newStopLoss = avgPrice * (1 - STOP_LOSS / 100);
      if (
        Math.abs(((newStopLoss - stopLoss) / stopLoss) * 100) >= 0.1 &&
        slPersent < 0
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
      //breakeven 40%
      if (pnlPersent > 5) {
        const newStopLoss = avgPrice * (1 + (pnlPersent * 0.4) / 100);
        if (((newStopLoss - stopLoss) / stopLoss) * 100 > 0.1) {
          await editStopLoss(symbol, side, newStopLoss.toFixed(priceScale));
          await bot.telegram.sendMessage(
            94899148,
            `<b>[Breakeven 40% 🟢 Long pnl >3%] <code>${symbol.slice(0, -4)}</code> pnlPersent ${pnlPersent.toFixed(2)}%\n` +
              `${stopLoss} => ${newStopLoss.toFixed(priceScale)}</b>\n` +
              `#${symbol.slice(0, -4)} #LONG_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
            { parse_mode: "HTML" },
          );
        }
      }
      //TODO Change TP to support zone or default value!!!
      // const tpPercent = shortSignal
      //   ? ((currentPrice - avgPrice) / avgPrice) * 100
      //   : TAKE_PROFIT;
      // const newTakeProfit = avgPrice * (1 + (tpPercent * 1.002) / 100);
      // if (
      //   (Math.abs(newTakeProfit - takeProfit) / takeProfit) * 100 > 0.1 &&
      //   tpPercent > 1
      // ) {
      //   await editTakeProfit(symbol, side, newTakeProfit.toFixed(priceScale));
      //   await bot.telegram.sendMessage(
      //     94899148,
      //     `<b>[TAKE_PROFIT changed to ${tpPercent.toFixed(2)}% 🟢 Long] <code>${symbol.slice(0, -4)}</code> pnlPersent ${pnlPersent.toFixed(2)}%\n` +
      //       `TP value: ${takeProfit} => ${newTakeProfit.toFixed(priceScale)}</b>\n` +
      //       `#${symbol.slice(0, -4)} #SHORT_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
      //     { parse_mode: "HTML" },
      //   );
      // }
    }
  }
  //check levels create stop orders
  //get Long Short positions
  const longPosition = positions.find((p) => p.side === "Buy");
  const shortPosition = positions.find((p) => p.side === "Sell");
  const longOrder = orders.find((p) => p.side === "Buy");
  const shortOrder = orders.find((p) => p.side === "Sell");
  //Support Zone
  if (
    Math.abs((currentPrice - support) / support) * 100 <= 0.5 &&
    trading &&
    currentRsi < 55
  ) {
    //cancel all old orders
    // for (const order of orders) {
    //   await cancelOrder(symbol, order.orderId);
    // }
    //TODO edit stop limit order!!!
    //open Long
    if (!longPosition && openLong) {
      if (longOrder) {
        const triggerPrice = currentPrice * (1 + 0.0015);
        const percentChangeTrigger =
          ((triggerPrice - longOrder.triggerPrice) / longOrder.triggerPrice) *
          100;
        if (percentChangeTrigger < -0.01) {
          await createLimitOrder(
            symbol,
            "Buy",
            currentPrice,
            MAX_POSITION_USDT,
            TAKE_PROFIT,
            STOP_LOSS,
            longOrder.orderId,
          );
          await bot.telegram.sendMessage(
            94899148,
            `<b>[Edited order 🟢 Long on Support 🟰 ${support}$] <code>${symbol.slice(0, -4)}</code>\n` +
              `Price ${currentPrice}$ Sum ${MAX_POSITION_USDT.toFixed(2)}$</b>\n` +
              `#${symbol.slice(0, -4)} #LONG_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
            { parse_mode: "HTML" },
          );
        }
      } else {
        await createLimitOrder(
          symbol,
          "Buy",
          currentPrice,
          MAX_POSITION_USDT,
          TAKE_PROFIT,
          STOP_LOSS,
        );
        await bot.telegram.sendMessage(
          94899148,
          `<b>[Created order 🟢 Long on Support 🟰 ${support}$] <code>${symbol.slice(0, -4)}</code>\n` +
            `Price ${currentPrice}$ Sum ${MAX_POSITION_USDT.toFixed(2)}$</b>\n` +
            `#${symbol.slice(0, -4)} #LONG_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
          { parse_mode: "HTML" },
        );
      }
    }
  }
  //Resistance Zone
  if (
    Math.abs((currentPrice - resistance) / resistance) * 100 <= 0.5 &&
    trading &&
    currentRsi > 55
  ) {
    //cancel all old orders
    // for (const order of orders) {
    //   await cancelOrder(symbol, order.orderId);
    // }
    //open Short
    if (!shortPosition && !openLong) {
      if (shortOrder) {
        const triggerPrice = currentPrice * (1 - 0.0015);
        const percentChangeTrigger =
          ((triggerPrice - shortOrder.triggerPrice) / shortOrder.triggerPrice) *
          100;
        if (percentChangeTrigger > 0.01) {
          await createLimitOrder(
            symbol,
            "Sell",
            currentPrice,
            MAX_POSITION_USDT,
            TAKE_PROFIT,
            STOP_LOSS,
            shortOrder.orderId,
          );
          await bot.telegram.sendMessage(
            94899148,
            `<b>[Edited order 🔴 Short on Resistance 🟰 ${resistance}$] <code>${symbol.slice(0, -4)}</code>\n` +
              `Price ${currentPrice}$ Sum ${MAX_POSITION_USDT.toFixed(2)}$</b>\n` +
              `#${symbol.slice(0, -4)} #SHORT_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
            { parse_mode: "HTML" },
          );
        }
      } else {
        await createLimitOrder(
          symbol,
          "Sell",
          currentPrice,
          MAX_POSITION_USDT,
          TAKE_PROFIT,
          STOP_LOSS,
        );
        await bot.telegram.sendMessage(
          94899148,
          `<b>[Created order 🔴 Short on Resistance 🟰 ${resistance}$] <code>${symbol.slice(0, -4)}</code>\n` +
            `Price ${currentPrice}$ Sum ${MAX_POSITION_USDT.toFixed(2)}$</b>\n` +
            `#${symbol.slice(0, -4)} #SHORT_${symbol.slice(0, -4)} /${symbol.slice(0, -4)}`,
          { parse_mode: "HTML" },
        );
      }
    }
  }
};
