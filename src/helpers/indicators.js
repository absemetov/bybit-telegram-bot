class Indicators {
  //levels
  static calculateLevels(
    candles,
    extrCount = 3,
    tolerancePercent = 0.01,
    touchCount = 3,
  ) {
    const tolerance = tolerancePercent / 100;
    const highs = candles.map((c) => c.high).sort((a, b) => a - b);
    const lows = candles.map((c) => c.low).sort((a, b) => a - b);
    // Рассчитываем уровень сопротивления
    let resistance = null;
    for (const high of highs.slice(-extrCount)) {
      const threshold = high * (1 - tolerance);
      const touches = candles.filter(
        (c) => c.low <= threshold && threshold <= c.high,
      ).length;
      if (touches >= touchCount) {
        resistance = threshold;
      }
    }
    // Рассчитываем уровень поддержки
    let support = null;
    for (const low of lows.slice(0, extrCount)) {
      const threshold = low * (1 + tolerance);
      const touches = candles.filter(
        (c) => c.low <= threshold && threshold <= c.high,
      ).length;
      if (touches >= touchCount) {
        support = threshold;
      }
    }
    return {
      support,
      resistance,
    };
  }
  // Паттерн MACD для лонга
  static calculateMACDSignal(closes) {
    const macdData = this.calculateMACD(closes);
    // const macd = macdData.macd.slice(-3);
    // const signal = macdData.signal.slice(-3);
    const histogram = macdData.histogram.slice(-3);
    // Получаем последние 3 значения для анализа
    // 1. Основное условие: MACD пересекает сигнальную линию снизу вверх
    //const crossover = macd[2] > signal[2] && macd[1] <= signal[1];
    // 2. Гистограмма меняет направление
    const histogramGrowth =
      histogram[2] < 0 &&
      (histogram[2] >= histogram[1] || histogram[1] >= histogram[0]);
    // 3. Положение относительно нулевой линии
    // const aboveZero = macd[2] > 0 && signal[2] > 0;
    const zeroCross =
      (histogram[2] > 0 && histogram[1] <= 0) ||
      (histogram[1] > 0 && histogram[0] <= 0);
    // Комбинированные условия
    // const strongSignal =
    //   crossover && histogramGrowth && (aboveZero || zeroCross);
    // const weakSignal = crossover && !aboveZero;
    return {
      histogramGrowth,
      zeroCross,
      histogram,
    };
  }

  // Паттерн RSI для лонга
  static calculateRSISignal(closes, longRSI = 35, shortRSI = 70) {
    const rsi = this.calculateRSI(closes);
    const last = rsi.length - 1;
    return {
      signalLong: rsi[last - 1] <= longRSI || rsi[last] <= longRSI,
      signalShort: rsi[last - 1] >= shortRSI || rsi[last] >= shortRSI,
      details: {
        currentRSI: rsi[last],
        previousRSI: rsi[last - 1],
      },
    };
  }
  // RSI для всех свечей
  static calculateRSI(closes, period = 14) {
    if (closes.length < period + 1) return [];
    const rsi = [];
    let avgGain = 0;
    let avgLoss = 0;
    // Инициализация первых значений
    for (let i = 1; i <= period; i++) {
      const delta = closes[i] - closes[i - 1];
      avgGain += Math.max(delta, 0);
      avgLoss += Math.abs(Math.min(delta, 0));
    }

    avgGain /= period;
    avgLoss /= period;
    // Первое значение RSI
    rsi.push(100 - 100 / (1 + (avgLoss === 0 ? Infinity : avgGain / avgLoss)));

    // Расчет последующих значений
    for (let i = period + 1; i < closes.length; i++) {
      const delta = closes[i] - closes[i - 1];
      const gain = Math.max(delta, 0);
      const loss = Math.abs(Math.min(delta, 0));
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
      rsi.push(100 - 100 / (1 + rs));
    }

    return new Array(period).fill(null).concat(rsi);
  }

  static calculateMACD(
    closes,
    fastPeriod = 12,
    slowPeriod = 26,
    signalPeriod = 9,
  ) {
    const calculateEMA = (data, period) => {
      if (data.length < period) return new Array(data.length).fill(null);
      const ema = [];
      // Инициализация SMA
      let sma =
        data.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
      ema.push(...new Array(period - 1).fill(null));
      ema.push(sma);
      // Расчет EMA
      const k = 2 / (period + 1);
      for (let i = period; i < data.length; i++) {
        sma = data[i] * k + sma * (1 - k);
        ema.push(sma);
      }
      return ema;
    };

    // Рассчитываем EMA
    const emaFast = calculateEMA(closes, fastPeriod);
    const emaSlow = calculateEMA(closes, slowPeriod);

    // Рассчитываем MACD Line
    const macdLine = emaFast.map((fast, i) => {
      if (fast === null || emaSlow[i] === null) return null;
      return fast - emaSlow[i];
    });

    // Рассчитываем Signal Line
    const validMacdValues = macdLine.filter((v) => v !== null);
    const signalLineEMA = calculateEMA(validMacdValues, signalPeriod);
    const signalLine = new Array(macdLine.length - validMacdValues.length)
      .fill(null)
      .concat(signalLineEMA);

    // Рассчитываем Histogram
    const histogram = macdLine.map((macd, i) => {
      if (macd === null || signalLine[i] === null) return null;
      return macd - signalLine[i];
    });

    return { macd: macdLine, signal: signalLine, histogram };
  }
}

export default Indicators;
