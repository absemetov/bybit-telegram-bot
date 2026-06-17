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
    const levelsLow = [];
    const levelsHigh = [];

    candles.forEach((candle, index) => {
      // ---------- Поддержка (нижняя 1/5) ----------
      const zoneLow = candle.low;
      const zoneHigh = candle.low + (candle.high - candle.low) / tolerance;

      // Находим все свечи, пересекающиеся с зоной текущей свечи (включая саму свечу)
      const intersectingLow = candles.filter((c, i) => {
        //if (i === index) return true; // включаем саму себя
        const cLow = c.low;
        const cHigh = c.low + (c.high - c.low) / tolerance;
        return Math.max(zoneLow, cLow) < Math.min(zoneHigh, cHigh);
      });

      if (intersectingLow.length >= touchCount) {
        // Вычисляем общее пересечение
        const overlapLow = Math.max(...intersectingLow.map((c) => c.low));
        const overlapHigh = Math.min(
          ...intersectingLow.map((c) => c.low + (c.high - c.low) / tolerance),
        );
        const mid = (overlapLow + overlapHigh) / 2;
        levelsLow.push(mid);
      }

      // ---------- Сопротивление (верхняя 1/5) ----------
      const resistLow = candle.high - (candle.high - candle.low) / tolerance;
      const resistHigh = candle.high;

      const intersectingHigh = candles.filter((c, i) => {
        //if (i === index) return true;
        const cLow = c.high - (c.high - c.low) / tolerance;
        const cHigh = c.high;
        return Math.max(resistLow, cLow) < Math.min(resistHigh, cHigh);
      });

      if (intersectingHigh.length >= touchCount) {
        const overlapLow = Math.max(
          ...intersectingHigh.map((c) => c.high - (c.high - c.low) / tolerance),
        );
        const overlapHigh = Math.min(...intersectingHigh.map((c) => c.high));
        const mid = (overlapLow + overlapHigh) / 2;
        levelsHigh.push(mid);
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
