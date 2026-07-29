class Indicators {
  //levels
  static calculateLevels(candles, touchCount = 4, tolerance = 3) {
    const max = Math.max(...candles.map((c) => c.high));
    const min = Math.min(...candles.map((c) => c.low));
    const levelsLow = [];
    const levelsHigh = [];
    let level = min;
    const step = 0.1;
    do {
      const lowBound = level;
      level = level * (1 + step / 100);
      const highBound = level;
      const supportCandles = candles.filter((c) => {
        const zoneLow = c.low;
        const zoneHigh = c.low + (c.high - c.low) / tolerance;
        return Math.max(zoneLow, lowBound) < Math.min(zoneHigh, highBound);
      });

      if (supportCandles.length >= touchCount) {
        levelsLow.push(highBound * (1 + step / 100));
      }

      const resistCandles = candles.filter((c) => {
        const zoneLow = c.high - (c.high - c.low) / tolerance;
        const zoneHigh = c.high;
        return Math.max(zoneLow, lowBound) < Math.min(zoneHigh, highBound);
      });

      if (resistCandles.length >= touchCount) {
        levelsHigh.push(lowBound * (1 - step / 100));
      }
    } while (level <= max);
    const support = levelsLow.length > 0 ? Math.min(...levelsLow) : 0;
    const resistance = levelsHigh.length > 0 ? Math.max(...levelsHigh) : 0;

    return { support, resistance };
  }
}

export default Indicators;
