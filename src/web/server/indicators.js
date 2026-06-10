class Indicators {
  //levels
  static calculateLevels(candles, touchCount = 4) {
    const levelsLow = [];
    const levelsHigh = [];
    candles.forEach((candle) => {
      const touchesLow = candles.filter(
        (c) =>
          candle.low >= c.low && candle.low <= c.low + (c.high - c.low) / 3,
      ).length;
      const touchesHigh = candles.filter(
        (c) =>
          candle.high <= c.high && candle.high >= c.high - (c.high - c.low) / 3,
      ).length;
      if (touchesLow >= touchCount) {
        levelsLow.push(candle.low);
      }
      if (touchesHigh >= touchCount) {
        levelsHigh.push(candle.high);
      }
    });
    let support = levelsLow.length > 0 ? Math.min(...levelsLow) : 0;
    let resistance = levelsHigh.length > 0 ? Math.max(...levelsHigh) : 0;
    return {
      support,
      resistance,
    };
  }
}

export default Indicators;
