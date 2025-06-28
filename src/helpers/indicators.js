class Indicators {
  //levels
  static calculateLevels(candles, tolerancePercent = 0.4, touchCount = 3) {
    const highs = candles.map((c) => c.high).sort((a, b) => b - a);
    const lows = candles.map((c) => c.low).sort((a, b) => a - b);
    // Рассчитываем уровень сопротивления
    let resistance = 0;
    //highs.slice(0, 2)
    for (const high of highs) {
      const touchesHigh = candles.filter(
        (candle) =>
          (Math.abs(candle.high - high) / high) * 100 <= tolerancePercent,
      ).length;
      if (touchesHigh >= touchCount) {
        resistance = high;
        break;
      }
    }
    // Рассчитываем уровень поддержки
    let support = 0;
    //lows.slice(0, 2)
    for (const low of lows) {
      const touchesLow = candles.filter(
        (candle) =>
          (Math.abs(candle.low - low) / low) * 100 <= tolerancePercent,
      ).length;
      if (touchesLow >= touchCount) {
        support = low;
        break;
      }
    }
    return {
      support,
      resistance,
    };
  }
  // RSI для всех свечей
  static calculateRSI(candles, period = 14) {
    if (candles.length < period + 1) return [];
    const results = [];
    let gains = 0;
    let losses = 0;

    // Рассчитываем начальные средние gain/loss
    for (let i = 1; i <= period; i++) {
      const change = candles[i].close - candles[i - 1].close;
      if (change >= 0) gains += change;
      else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    let rsi = 100 - 100 / (1 + rs);
    results.push({
      time: candles[period].time,
      value: rsi,
    });

    // Рассчитываем последующие значения RSI
    for (let i = period + 1; i < candles.length; i++) {
      const change = candles[i].close - candles[i - 1].close;
      let currentGain = 0;
      let currentLoss = 0;

      if (change >= 0) currentGain = change;
      else currentLoss = -change;

      // Сглаживаем средние значения
      avgGain = (avgGain * (period - 1) + currentGain) / period;
      avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi = 100 - 100 / (1 + rs);
      results.push({
        time: candles[i].time,
        value: rsi,
      });
    }

    return results;
  }
  // Вспомогательная функция для расчета EMA
  static calculateEMA(candles, period = 10) {
    const k = 2 / (period + 1);
    const emaArray = [];
    let ema =
      candles
        .slice(0, period)
        .reduce(
          (sum, item) => sum + (item.close ? item.close : item.value),
          0,
        ) / period;

    emaArray.push({ time: candles[period - 1].time, value: ema });

    for (let i = period; i < candles.length; i++) {
      ema =
        (candles[i].close ? candles[i].close : candles[i].value) * k +
        ema * (1 - k);
      emaArray.push({ time: candles[i].time, value: ema });
    }

    return emaArray;
  }
  static calculateMACD(
    candles,
    shortPeriod = 12,
    longPeriod = 26,
    signalPeriod = 9,
  ) {
    // Рассчитываем EMA для короткого и длинного периодов
    const shortEMA = Indicators.calculateEMA(candles, shortPeriod);
    const longEMA = Indicators.calculateEMA(candles, longPeriod);

    // Выравниваем массивы EMA по времени
    const macdLine = [];
    for (let i = 0; i < longEMA.length; i++) {
      const longItem = longEMA[i];
      const shortItem = shortEMA.find((s) => s.time === longItem.time);
      if (shortItem) {
        macdLine.push({
          time: longItem.time,
          value: shortItem.value - longItem.value,
        });
      }
    }

    // Рассчитываем сигнальную линию (EMA от MACD)
    const signalLine = Indicators.calculateEMA(macdLine, signalPeriod);

    // Создаем гистограмму с цветами
    const histogram = [];
    for (let i = 0; i < signalLine.length; i++) {
      const macdItem = macdLine[i + signalPeriod - 1]; // Смещение для выравнивания
      const diff = macdItem.value - signalLine[i].value;
      histogram.push({
        time: signalLine[i].time,
        value: diff,
        color: diff >= 0 ? "green" : "red",
      });
    }

    return {
      macdLine,
      signalLine,
      histogram,
    };
  }
  //check cross lines
  static findIntersections(lineA, lineB) {
    if (lineA.length !== lineB.length) {
      console.error("Линии имеют разную длину");
      return [];
    }
    const intersections = [];
    for (let i = 1; i < lineA.length; i++) {
      // Проверка совпадения временных меток
      if (
        lineA[i].time !== lineB[i].time ||
        lineA[i - 1].time !== lineB[i - 1].time
      ) {
        console.warn("Несовпадение временных меток в точке", i);
        continue;
      }

      // Текущая и предыдущая разница значений
      const prevDiff = lineA[i - 1].value - lineB[i - 1].value;
      const currDiff = lineA[i].value - lineB[i].value;
      // Проверка смены знака (пересечение)
      if (Math.sign(prevDiff) !== Math.sign(currDiff)) {
        // Параметры для линейной интерполяции
        const timeA = lineA[i].time;
        const timeB = lineB[i].time;
        console.log(timeA, timeB);
        // const valueA1 = lineA[i - 1].value;
        const valueA2 = lineA[i].value;
        // const valueB1 = lineB[i - 1].value;
        const valueB2 = lineB[i].value;
        console.log(valueA2, valueB2);
        // // Вычисление времени пересечения
        // const denominator = valueA1 - valueA2 - (valueB1 - valueB2);
        // if (Math.abs(denominator) < 1e-10) continue; // Защита от деления на 0
        // const t = (valueB1 - valueA1) / denominator;
        // const intersectionTime = timeA + t * (timeB - timeA);
        // // Вычисление значения в точке пересечения
        // const intersectionValue = valueA1 + t * (valueA2 - valueA1);
        // Определение типа пересечения
        const type = prevDiff > 0 ? "bearish" : "bullish";
        intersections.push({
          time: timeB,
          value: valueB2,
          type,
        });
      }
    }
    return intersections;
  }
}

export default Indicators;
