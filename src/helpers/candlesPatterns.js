export const volumePattern = (candles, volumePcnt) => {
  const volumesArray = [];
  // check only 2 last candles
  for (let i = 0; i < 2; i += 1) {
    if (candles[i + 1]) {
      let side = 1;
      // if price dump check volume!!! TODO
      if (candles[i].color === "red") {
        side = -1;
      }
      const volumeChange =
        (candles[i].volume - candles[i + 1].volume) / candles[i + 1].volume;
      if (volumeChange > 0 && Number.isFinite(volumeChange)) {
        volumesArray.push(Math.round(volumeChange * side));
      }
    }
  }
  for (const candleVolume of volumesArray) {
    if (Math.abs(candleVolume) >= volumePcnt) return candleVolume;
  }
};
