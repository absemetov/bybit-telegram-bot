class Indicators {
  //levels
  static calculateLevels(candles, touchCount = 4, tolerance = 3) {
    const levelsLow = [];
    const levelsHigh = [];

    candles.forEach((candle, index) => {
      const zoneLow = candle.low;
      const zoneHigh = candle.low + (candle.high - candle.low) / tolerance;
      const intersectingLow = candles.filter((c, i) => {
        const cLow = c.low;
        const cHigh = c.low + (c.high - c.low) / tolerance;
        return Math.max(zoneLow, cLow) < Math.min(zoneHigh, cHigh);
      });

      if (intersectingLow.length >= touchCount) {
        const overlapLow = Math.max(...intersectingLow.map((c) => c.low));
        const overlapHigh = Math.min(
          ...intersectingLow.map((c) => c.low + (c.high - c.low) / tolerance),
        );
        const mid = (overlapLow + overlapHigh) / 2;
        levelsLow.push(mid);
      }

      const resistLow = candle.high - (candle.high - candle.low) / tolerance;
      const resistHigh = candle.high;

      const intersectingHigh = candles.filter((c, i) => {
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

    return { support, resistance };
  }
}

export default Indicators;
