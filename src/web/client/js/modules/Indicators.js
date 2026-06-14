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
  findLevels(candles, touchCount = 4, tolerance = 3) {
    const max = Math.max(...candles.map((c) => c.high));
    const min = Math.min(...candles.map((c) => c.low));
    const levelsHigh = [];
    const levelsLow = [];
    candles.forEach((candle) => {
      const touchesLow = candles.filter(
        (c) =>
          candle.low >= c.low && candle.low <= c.low + (c.high - c.low) / tolerance,
      ).length;
      const touchesHigh = candles.filter(
        (c) =>
          candle.high <= c.high && candle.high >= c.high - (c.high - c.low) / tolerance,
      ).length;
      if (touchesLow >= touchCount) {
        levelsLow.push(candle.low);
      }
      if (touchesHigh >= touchCount) {
        levelsHigh.push(candle.high);
      }
    });
    const support = levelsLow.length > 0 ? Math.min(...levelsLow) : 0;
    const resistance = levelsHigh.length > 0 ? Math.max(...levelsHigh) : 0;
    return { support, resistance, min, max };
  }
  calculateLevels(candles, candlesCount = 10, touchCount = 3, tolerance = 3) {
    const candlesSlice = candles.slice(-candlesCount);
    return this.findLevels(candlesSlice, touchCount, tolerance);
  }
}
