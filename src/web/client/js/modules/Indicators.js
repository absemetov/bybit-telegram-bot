export class Indicators {
  constructor(app) {
    this.app = app;
    this.chartModule = null;
  }
  init() {
    this.app.on("chart:ready", () => this.attachToChart());
  }
  attachToChart() {
    this.chartModule = this.app.get("chart");
  }
  findLevels(
    candles,
    touchCount,
    tolerance,
    type = "live",
    allowFallback = true,
  ) {
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
        const zoneHigh = c.low + (c.high - c.low) * (tolerance / 100);
        return Math.max(zoneLow, lowBound) < Math.min(zoneHigh, highBound);
      });

      if (supportCandles.length >= touchCount) {
        levelsLow.push(highBound * (1 + step / 100));
      }

      const resistCandles = candles.filter((c) => {
        const zoneLow = c.high - (c.high - c.low) * (tolerance / 100);
        const zoneHigh = c.high;
        return Math.max(zoneLow, lowBound) < Math.min(zoneHigh, highBound);
      });

      if (resistCandles.length >= touchCount) {
        levelsHigh.push(lowBound * (1 - step / 100));
      }
    } while (level <= max);
    let support = levelsLow.length > 0 ? Math.min(...levelsLow) : 0;
    let resistance = levelsHigh.length > 0 ? Math.max(...levelsHigh) : 0;
    if (
      type === "sim" &&
      allowFallback &&
      (support === 0 || resistance === 0) &&
      candles.length >= touchCount &&
      touchCount > 2
    ) {
      const lastCandle = candles[candles.length - 1];
      const withoutLast = candles.slice(0, -1);

      const prev = this.findLevels(
        withoutLast,
        touchCount - 1,
        tolerance,
        "sim",
        false,
      );

      if (
        support === 0 &&
        prev.support > 0 &&
        lastCandle.low <= prev.support &&
        lastCandle.open > prev.support
      ) {
        support = prev.support;
      }

      if (
        resistance === 0 &&
        prev.resistance > 0 &&
        lastCandle.high >= prev.resistance &&
        prev.resistance > lastCandle.open
      ) {
        resistance = prev.resistance;
      }
    }

    return { support, resistance, min, max };
  }
}
