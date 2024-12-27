export const volumePattern = (candles, volumePcnt) => {
  // check only pre last candles
  if (candles[2] && candles[1] && volumePcnt > 0) {
    const volumeChange =
      ((candles[1].volume - candles[2].volume) / candles[2].volume) * 100;
    if (volumeChange > volumePcnt && Number.isFinite(volumeChange)) {
      return [Math.round(volumeChange), candles[1].startTime];
    }
  }
  return [];
};
