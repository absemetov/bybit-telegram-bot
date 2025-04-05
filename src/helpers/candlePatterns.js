class CandlePatterns {
  static analyze(candles) {
    return {
      isDoji: this.isDoji(candles[candles.length - 2]),
    };
  }
  //support and resistance
  static calculateVolumeClusters(candles, clusterThreshold = 0.5) {
    const clusters = [];
    candles.forEach((candle) => {
      let found = false;
      for (const cluster of clusters) {
        const diff =
          (Math.abs(cluster.price - candle.close) / candle.close) * 100;
        if (diff <= clusterThreshold) {
          cluster.totalVolume += candle.volume;
          cluster.count++;
          found = true;
          break;
        }
      }
      if (!found) {
        clusters.push({
          price: candle.close,
          totalVolume: candle.volume,
          count: 1,
        });
      }
    });
    return clusters
      .filter((c) => c.count > 1)
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .map((c) => c.price);
  }
  static calculateSupportResistance(candles, windowSize = 3, mergePercent = 2) {
    // Внутренние функции-помощники
    const isHighPeak = (index) => {
      const start = Math.max(0, index - windowSize);
      const end = Math.min(candles.length - 1, index + windowSize);
      for (let i = start; i <= end; i++) {
        if (i === index) continue;
        if (candles[i].high >= candles[index].high) return false;
      }
      return true;
    };

    const isLowTrough = (index) => {
      const start = Math.max(0, index - windowSize);
      const end = Math.min(candles.length - 1, index + windowSize);
      for (let i = start; i <= end; i++) {
        if (i === index) continue;
        if (candles[i].low <= candles[index].low) return false;
      }
      return true;
    };

    // Поиск первоначальных уровней
    const supports = [];
    const resistances = [];
    for (let i = 0; i < candles.length; i++) {
      if (isLowTrough(i)) supports.push(candles[i].low);
      if (isHighPeak(i)) resistances.push(candles[i].high);
    }

    // Функция объединения уровней
    const mergeLevels = (levels, type) => {
      if (levels.length === 0) return [];
      levels.sort((a, b) => (type === "support" ? a - b : b - a));
      const merged = [];
      let currentGroup = [levels[0]];
      for (let i = 1; i < levels.length; i++) {
        const diff =
          (Math.abs(levels[i] - currentGroup[0]) / currentGroup[0]) * 100;
        if (diff <= mergePercent) {
          currentGroup.push(levels[i]);
        } else {
          merged.push(
            type === "support"
              ? Math.min(...currentGroup)
              : Math.max(...currentGroup),
          );
          currentGroup = [levels[i]];
        }
      }
      merged.push(
        type === "support"
          ? Math.min(...currentGroup)
          : Math.max(...currentGroup),
      );
      return merged;
    };

    // Возвращаем обработанные уровни
    return {
      support: mergeLevels(supports, "support"),
      resistance: mergeLevels(resistances, "resistance"),
    };
  }
  // Volume Up
  static isVolumeUp(candles, threshold = 5) {
    const [candle1, candle2, candle3, candle4, candle5, candle6, candle7] =
      candles;
    return (
      (candle1.volume /
        ((candle2.volume +
          candle3.volume +
          candle4.volume +
          candle5.volume +
          candle6.volume +
          candle7.volume) /
          6) >
        threshold &&
        candle1.color === "green") ||
      (candle2.volume /
        ((candle3.volume +
          candle4.volume +
          candle5.volume +
          candle6.volume +
          candle7.volume) /
          5) >
        threshold &&
        candle2.color === "green")
    );
  }
  // Price Up
  static isPriceUp(candlesPrices, threshold = 0.05) {
    const [price1, price2, price3, price4, price5, price6] = candlesPrices;
    return (
      Math.abs(price1 / ((price2 + price3 + price4 + price5 + price6) / 5)) >
      threshold
    );
  }
  static isDoji(candle, maxBodyPercent = 0.4) {
    const body = Math.abs(candle.open - candle.close);
    const avgPrice = (candle.open + candle.close) / 2;
    // Защита от нулевой средней цены
    if (avgPrice === 0) return false;
    const bodySizePercent = (body / avgPrice) * 100;
    return bodySizePercent <= maxBodyPercent;
  }

  // Определение Молота (Hammer)
  static isHammer(candle) {
    const bodySize = Math.abs(candle.open - candle.close);
    const lowerShadow =
      candle.close > candle.open
        ? candle.open - candle.low
        : candle.close - candle.low;
    const upperShadow = candle.high - Math.max(candle.open, candle.close);
    return (
      bodySize <= candle.high - candle.low * 0.3 &&
      lowerShadow >= bodySize * 2 &&
      upperShadow <= bodySize * 0.1
    );
  }

  // Бычье/медвежье поглощение (Engulfing)
  static isEngulfing(candles) {
    if (candles.length < 2) return false;
    const prev = candles[0];
    const current = candles[1];
    const isBullish = current.close > current.open;
    const isBearish = current.close < current.open;
    return (
      (isBullish && current.open < prev.close && current.close > prev.open) ||
      (isBearish && current.open > prev.close && current.close < prev.open)
    );
  }

  // Утренняя звезда (Morning Star)
  static isMorningStar(candles) {
    if (candles.length < 3) return false;
    const [first, second, third] = candles;
    return (
      first.close < first.open && // Нисходящая свеча
      Math.abs(second.close - second.open) < (second.high - second.low) * 0.3 && // Маленькое тело
      third.close > third.open && // Восходящая свеча
      third.close > first.open
    );
  }

  // Вечерняя звезда (Evening Star)
  static isEveningStar(candles) {
    if (candles.length < 3) return false;
    const [first, second, third] = candles;
    return (
      first.close > first.open && // Восходящая свеча
      Math.abs(second.close - second.open) < (second.high - second.low) * 0.3 && // Маленькое тело
      third.close < third.open && // Нисходящая свеча
      third.close < first.open
    );
  }

  // Определение Пин-бара (Pin Bar)
  static isPinBar(candle) {
    const bodySize = Math.abs(candle.open - candle.close);
    const totalRange = candle.high - candle.low;
    const shadowRatio = bodySize / totalRange <= 0.3;
    if (candle.close > candle.open) {
      // Бычий пин-бар
      return shadowRatio && candle.high - candle.close <= bodySize * 0.1;
    }
    return shadowRatio && candle.open - candle.low <= bodySize * 0.1; // Медвежий пин-бар
  }
}

export default CandlePatterns;
