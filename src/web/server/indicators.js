class Indicators {
  //levels
  static calculateLevels(candles, touchCount = 4, tolerance = 3) {
    const max = Math.max(...candles.map((c) => c.high));
    const min = Math.min(...candles.map((c) => c.low));
    const range = max - min;
    const step = range / 20;
    const levelsLow = [];
    const levelsHigh = [];

    for (let level = min; level <= max; level += step) {
      const lowBound = level;
      const highBound = level + step;

      // Поддержка
      const supportCandles = candles.filter((c) => {
        const zoneLow = c.low;
        const zoneHigh = c.low + (c.high - c.low) / tolerance;
        return Math.max(zoneLow, lowBound) < Math.min(zoneHigh, highBound);
      });

      if (supportCandles.length >= touchCount) {
        const overlapLow = Math.max(...supportCandles.map((c) => c.low));
        const overlapHigh = Math.min(
          ...supportCandles.map((c) => c.low + (c.high - c.low) / tolerance),
        );
        const mid = (overlapLow + overlapHigh) / 2;
        levelsLow.push(mid);
      }

      // Сопротивление
      const resistCandles = candles.filter((c) => {
        const zoneLow = c.high - (c.high - c.low) / tolerance;
        const zoneHigh = c.high;
        return Math.max(zoneLow, lowBound) < Math.min(zoneHigh, highBound);
      });

      if (resistCandles.length >= touchCount) {
        const overlapLow = Math.max(
          ...resistCandles.map((c) => c.high - (c.high - c.low) / tolerance),
        );
        const overlapHigh = Math.min(...resistCandles.map((c) => c.high));
        const mid = (overlapLow + overlapHigh) / 2;
        levelsHigh.push(mid);
      }
    }

    const support = levelsLow.length > 0 ? Math.min(...levelsLow) : 0;
    const resistance = levelsHigh.length > 0 ? Math.max(...levelsHigh) : 0;

    return { support, resistance };
  }
}

export default Indicators;
