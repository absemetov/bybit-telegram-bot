import Indicators from "../helpers/indicators.js";
import {
  createLimitOrder,
  getBybitBalance,
  getTickerOrders,
  getTickerPositions,
  editStopLoss,
  editTakeProfit,
  cancelOrder,
} from "../helpers/bybitV5.js";
export const checkLevels = async (ticker, candles, bot) => {
  const { symbol, priceScale, patterns } = ticker;
  if (patterns?.levels) {
    const tolerancePercentLevelsNearPrice = 0.2;
    //get positions
    const balance = await getBybitBalance();
    const MAX_POSITION_USDT = balance / 40;
    //min tp then up!!!
    const TAKE_PROFIT = 0;
    const STOP_LOSS = 1.5;
    const positions = await getTickerPositions(symbol);
    const orders = await getTickerOrders(symbol);
    //calc Levels
    const { candlesCount, tolerancePercent, touchCount } = patterns.levels;
    const candlesSlice = candles.slice(-candlesCount);
    //calculate indicators levels, rsi, rsiEma
    const { support, resistance } = Indicators.calculateLevels(
      candlesSlice,
      tolerancePercent,
      touchCount,
    );
    //edit SL set breakeven
    for (const position of positions) {
      const { side, avgPrice, markPrice, stopLoss, takeProfit } = position;
      const slPersent = ((stopLoss - avgPrice) / avgPrice) * 100;
      const pnlPersent = ((markPrice - avgPrice) / avgPrice) * 100;
      if (side === "Sell") {
        //set default sl
        const newStopLoss = avgPrice * (1 + STOP_LOSS / 100);
        if (
          Math.abs(((newStopLoss - stopLoss) / stopLoss) * 100) >
            STOP_LOSS * 0.02 &&
          pnlPersent > 0
        ) {
          await editStopLoss(symbol, side, newStopLoss.toFixed(priceScale));
          await bot.telegram.sendMessage(
            94899148,
            `<b>[Set default SL ${STOP_LOSS}% side Sell] <code>${symbol.slice(0, -4)}</code> slPersent ${slPersent.toFixed(2)}% ${stopLoss} => ${newStopLoss.toFixed(priceScale)}</b>` +
              `#${symbol.slice(0, -4)} #SHORT_${symbol.slice(0, -4)}`,
            { parse_mode: "HTML" },
          );
        }
        //breakeven 30%
        if (pnlPersent < -5) {
          const newStopLoss = avgPrice * (1 - (pnlPersent * 0.4) / 100);
          if (((newStopLoss - stopLoss) / stopLoss) * 100 < -0.1) {
            await editStopLoss(symbol, side, newStopLoss.toFixed(priceScale));
            await bot.telegram.sendMessage(
              94899148,
              `<b>[Breakeven 40% side Sell pnl >3%] <code>${symbol.slice(0, -4)}</code> pnlPersent ${pnlPersent.toFixed(2)}% ${stopLoss} => ${newStopLoss.toFixed(priceScale)}</b>` +
                `#${symbol.slice(0, -4)} #SHORT_${symbol.slice(0, -4)}`,
              { parse_mode: "HTML" },
            );
          }
        }
        //TODO Change TP to support zone or default value!!!
        const tpPercent = support
          ? ((support - avgPrice) / avgPrice) * 100
          : TAKE_PROFIT;
        const newTakeProfit = avgPrice * (1 - tpPercent / 100);
        if (((newTakeProfit - takeProfit) / takeProfit) * 100 < -0.1) {
          await editTakeProfit(symbol, side, newTakeProfit.toFixed(priceScale));
          await bot.telegram.sendMessage(
            94899148,
            `<b>[TAKE_PROFIT changed to ${tpPercent}% side Sell] <code>${symbol.slice(0, -4)}</code> pnlPersent ${pnlPersent.toFixed(2)}%` +
              `${takeProfit} => ${newTakeProfit.toFixed(priceScale)}</b>\n` +
              `#${symbol.slice(0, -4)} #SHORT_${symbol.slice(0, -4)}`,
            { parse_mode: "HTML" },
          );
        }
      }
      if (side === "Buy") {
        //set default sl
        const newStopLoss = avgPrice * (1 - STOP_LOSS / 100);
        if (
          Math.abs(((newStopLoss - stopLoss) / stopLoss) * 100) >
            STOP_LOSS * 0.02 &&
          pnlPersent < 0
        ) {
          await editStopLoss(symbol, side, newStopLoss.toFixed(priceScale));
          await bot.telegram.sendMessage(
            94899148,
            `<b>[Set default SL ${STOP_LOSS}% side Buy] <code>${symbol.slice(0, -4)}</code> slPersent ${slPersent.toFixed(2)}% ${stopLoss} => ${newStopLoss.toFixed(priceScale)}</b>\n` +
              `#${symbol.slice(0, -4)} #LONG_${symbol.slice(0, -4)}`,
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
              `<b>[Breakeven 40% side Buy pnl >3%] <code>${symbol.slice(0, -4)}</code> pnlPersent ${pnlPersent.toFixed(2)}% ${stopLoss} => ${newStopLoss.toFixed(priceScale)}</b>\n` +
                `#${symbol.slice(0, -4)} #LONG_${symbol.slice(0, -4)}`,
              { parse_mode: "HTML" },
            );
          }
        }
        //TODO Change TP to support zone or default value!!!
        const tpPercent = resistance
          ? ((resistance - avgPrice) / avgPrice) * 100
          : TAKE_PROFIT;
        const newTakeProfit = avgPrice * (1 + tpPercent / 100);
        if (((newTakeProfit - takeProfit) / takeProfit) * 100 > 0.1) {
          await editTakeProfit(symbol, side, newTakeProfit.toFixed(priceScale));
          await bot.telegram.sendMessage(
            94899148,
            `<b>[TAKE_PROFIT changed to ${tpPercent}% side Buy] <code>${symbol.slice(0, -4)}</code> pnlPersent ${pnlPersent.toFixed(2)}%` +
              `${takeProfit} => ${newTakeProfit.toFixed(priceScale)}</b>\n` +
              `#${symbol.slice(0, -4)} #SHORT_${symbol.slice(0, -4)}`,
            { parse_mode: "HTML" },
          );
        }
      }
    }
    //check levels create stop orders
    const currentPrice = candles[candles.length - 1].close;
    //get Long Short positions
    const longPosition = positions.find((p) => p.side === "Buy");
    const shortPosition = positions.find((p) => p.side === "Sell");
    //Support Zone
    const priceNearSupport =
      Math.abs((currentPrice - support) / support) * 100 <=
      tolerancePercentLevelsNearPrice;
    if (priceNearSupport) {
      //cancel all old orders
      for (const order of orders) {
        await cancelOrder(symbol, order.orderId);
      }
      //open Long
      if (!longPosition && currentPrice > support) {
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
          `<b>[Created Stop Buy order] <code>${symbol.slice(0, -4)}</code> Price ${currentPrice}$\n` +
            `Sum ${MAX_POSITION_USDT.toFixed(2)}$</b>\n#${symbol.slice(0, -4)} #LONG_${symbol.slice(0, -4)}`,
          { parse_mode: "HTML" },
        );
      }
      //open Short
      if (!shortPosition && currentPrice < support) {
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
          `<b>[Created Stop Sell order] <code>${symbol.slice(0, -4)}</code> Price ${currentPrice}$\n` +
            `Sum ${MAX_POSITION_USDT.toFixed(2)}$</b>\n#${symbol.slice(0, -4)} #SHORT_${symbol.slice(0, -4)}`,
          { parse_mode: "HTML" },
        );
      }
    }
    //Resistance Zone
    const priceNearResistance =
      Math.abs((currentPrice - resistance) / resistance) * 100 <=
      tolerancePercentLevelsNearPrice;
    if (priceNearResistance && currentPrice < resistance) {
      //cancel all old orders
      for (const order of orders) {
        await cancelOrder(symbol, order.orderId);
      }
      //open Short
      if (!shortPosition) {
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
          `<b>[Created Stop Sell order] <code>${symbol.slice(0, -4)}</code> Price ${currentPrice}$\n` +
            `Sum ${MAX_POSITION_USDT.toFixed(2)}$</b>\n#${symbol.slice(0, -4)} #SHORT_${symbol.slice(0, -4)}`,
          { parse_mode: "HTML" },
        );
      }
      //open Long
      if (!longPosition && currentPrice > resistance) {
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
          `<b>[Created Stop Buy order] <code>${symbol.slice(0, -4)}</code> Price ${currentPrice}$\n` +
            `Sum ${MAX_POSITION_USDT.toFixed(2)}$</b>\n#${symbol.slice(0, -4)} #LONG_${symbol.slice(0, -4)}`,
          { parse_mode: "HTML" },
        );
      }
    }
  } else {
    await bot.telegram.sendMessage(
      94899148,
      `Levels pattern for #${symbol} not set! Use default config <code>{"levels":{"candlesCount":16,"tolerancePercent":0.15,"touchCount":4}}</code>`,
      { parse_mode: "HTML" },
    );
  }
  return null;
};
