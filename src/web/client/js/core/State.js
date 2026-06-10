export class State {
  constructor() {
    this.data = {
      isAuth: false,
      user: null,
      token: null,
      symbol: "ETHUSDT",
      timeframe: "4h",
      chartMode: "live",
      settings: { theme: "dark", sound: true, locale: "en" },
      algoSettings: {
        balance: 10000,
      },
      watchlist: {
        tickers: [],
      },
      guestWatchlist: {
        tickers: [
          { symbol: "BTCUSDT" },
          { symbol: "ETHUSDT" },
          { symbol: "BNBUSDT" },
          { symbol: "SOLUSDT" },
          { symbol: "XRPUSDT" },
          { symbol: "ADAUSDT" },
          { symbol: "DOGEUSDT" },
          { symbol: "AVAXUSDT" },
          { symbol: "LINKUSDT" },
          { symbol: "HBARUSDT" },
        ],
      },
    };
    this.subs = [];
  }
  get(key) {
    if (!key) return { ...this.data };
    return key.split(".").reduce((o, k) => o?.[k], this.data);
  }
  set(key, val) {
    const old = { ...this.data };
    if (typeof key === "string") {
      const keys = key.split(".");
      const last = keys.pop();
      let obj = this.data;
      keys.forEach((k) => (obj = obj[k] ||= {}));
      obj[last] = val;
    } else Object.assign(this.data, key);
    this.subs.forEach((fn) => fn(this.data, old));
    return this.data;
  }
  subscribe(fn) {
    this.subs.push(fn);
    fn(this.data, null);
    return () => (this.subs = this.subs.filter((f) => f !== fn));
  }
}
