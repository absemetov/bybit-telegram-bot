class Indicators {
  //detect trend
  static analyzeMarketWithRegression(emaValues, options = {}) {
    const {
      lookbackPeriod = 14, // Количество свечей для анализа
      volatilityThreshold = 1.5, // Порог волатильности для боковика (%)
      trendSlopeThreshold = 0.15, // Порог наклона тренда (% за период)
    } = options;

    const data = emaValues.slice(-lookbackPeriod);
    // Линейная регрессия
    const xValues = Array.from({ length: lookbackPeriod }, (_, i) => i);
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = data.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((a, x, i) => a + x * data[i], 0);
    const sumXX = xValues.reduce((a, x) => a + x * x, 0);
    const slope =
      (lookbackPeriod * sumXY - sumX * sumY) /
      (lookbackPeriod * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / lookbackPeriod;
    // Рассчитываем относительный наклон (% за период)
    const firstValue = intercept; // Значение линии регрессии в начале периода
    const lastValue = intercept + slope * (lookbackPeriod - 1);
    const relativeSlope = ((lastValue - firstValue) / firstValue) * 100;
    // Рассчитываем волатильность
    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const volatility = ((maxValue - minValue) / minValue) * 100;
    // Рассчитываем угол наклона в градусах (для визуализации)
    //const angleRad = Math.atan(slope);
    //const angleDeg = angleRad * (180 / Math.PI);
    // Определяем состояние рынка
    let marketCondition;
    if (
      Math.abs(relativeSlope) < trendSlopeThreshold &&
      volatility < volatilityThreshold
    ) {
      marketCondition = "flat";
    } else if (relativeSlope > 0) {
      marketCondition = "uptrend";
    } else {
      marketCondition = "downtrend";
    }
    // Сила тренда/флэта
    let strength;
    if (marketCondition === "flat") {
      strength = volatility < volatilityThreshold / 2 ? "strong" : "moderate";
    } else {
      const absSlope = Math.abs(relativeSlope);
      if (absSlope > trendSlopeThreshold * 3) strength = "strong";
      else if (absSlope > trendSlopeThreshold * 1.5) strength = "moderate";
      else strength = "weak";
    }

    return {
      marketCondition,
      strength,
      regressionSlope: slope,
      relativeSlope: parseFloat(relativeSlope.toFixed(3)),
      volatility: parseFloat(volatility.toFixed(3)),
      lookbackPeriod,
      trendSlopeThreshold,
      firstRegressionValue: firstValue,
      lastRegressionValue: lastValue,
      actualFirstValue: data[0],
      actualLastValue: data[data.length - 1],
      regressionValues: xValues.map((x) => intercept + slope * x),
    };
  }
  //atr
  static calculateATR(data, period = 14) {
    if (data.length < period + 1) return [];
    const trValues = [];
    const atrResults = [];
    // Рассчитываем True Range (TR) для всех свечей
    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        // Для первой свечи: TR = High - Low
        trValues.push(data[i].high - data[i].low);
      } else {
        // Для последующих свечей:
        const prevClose = data[i - 1].close;
        const tr = Math.max(
          data[i].high - data[i].low,
          Math.abs(data[i].high - prevClose),
          Math.abs(data[i].low - prevClose),
        );
        trValues.push(tr);
      }
    }
    // Первое значение ATR - среднее за начальный период
    let atrSum = 0;
    for (let i = 0; i < period; i++) {
      atrSum += trValues[i];
    }
    // Записываем первый результат ATR
    atrResults.push({
      time: data[period - 1].time,
      value: atrSum / period,
    });
    // Рассчитываем последующие значения ATR
    for (let i = period; i < data.length; i++) {
      const atr =
        (atrResults[atrResults.length - 1].value * (period - 1) + trValues[i]) /
        period;
      atrResults.push({
        time: data[i].time,
        value: atr,
      });
    }
    return atrResults;
  }
  static findExtremeCandles(candles) {
    if (candles.length === 0)
      return { maxHighCandle: null, minLowCandle: null };

    const initial = {
      maxHighCandle: candles[0],
      minLowCandle: candles[0],
    };

    return candles.reduce((acc, candle) => {
      // Обновляем свечу с максимальным high
      if (candle.high > acc.maxHighCandle.high) {
        acc.maxHighCandle = candle;
      }
      // Обновляем свечу с минимальным low
      if (candle.low < acc.minLowCandle.low) {
        acc.minLowCandle = candle;
      }
      return acc;
    }, initial);
  }
  //levels
  static calculateLevels(candles, touchCount = 4) {
    const max = Math.max(...candles.map((c) => c.high));
    const min = Math.min(...candles.map((c) => c.low));
    let checkPercent = 0;
    const levelsLow = [];
    const levelsHigh = [];
    let crossLine = min;
    do {
      crossLine = crossLine * (1 + checkPercent / 100);
      const touchesLow = candles.filter(
        (candle) =>
          crossLine >= candle.low &&
          crossLine <= candle.low + (candle.high - candle.low) / 2.5,
        //crossLine <= (candle.high + candle.low) / 2,
      ).length;
      const touchesHigh = candles.filter(
        (candle) =>
          crossLine <= candle.high &&
          crossLine >= candle.high - (candle.high - candle.low) / 2.5,
        //crossLine >= (candle.high + candle.low) / 2,
      ).length;
      if (touchesLow >= touchCount) {
        levelsLow.push({
          crossLine,
          touchesLow,
        });
      }
      if (touchesHigh >= touchCount) {
        levelsHigh.push({
          crossLine,
          touchesHigh,
        });
      }
      checkPercent += 0.001;
    } while (crossLine <= max);
    let support =
      levelsLow.length > 0 ? Math.min(...levelsLow.map((l) => l.crossLine)) : 0;
    let resistance =
      levelsHigh.length > 0
        ? Math.max(...levelsHigh.map((l) => l.crossLine))
        : 0;
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
  static calculateEMA(candles, period = 14) {
    if (candles.length < period + 1) return [];
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
