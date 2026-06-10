export class WebSocketManager {
  constructor(app) {
    this.app = app;
    this.ws = null;
    this.symbols = [];
    this.currentSymbol = null;
    this.timer = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.activeSubscriptions = {
      tickers: new Set(),
      kline: null,
    };
  }

  init() {
    this.app.on("watchlist:symbols", (symbols) => this.updateSymbols(symbols));
    this.app.on("chart:loadedSymbol", (symbol) => {
      this.onMainSymbolChange(symbol);
    });
  }
  onMainSymbolChange(newSymbol) {
    console.log(`WebSocket:>chart:loadedSymbol ${newSymbol}`);
    if (newSymbol === this.currentSymbol) return;
    this.currentSymbol = newSymbol;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.subscribeToKline(newSymbol);
    }
  }
  updateSymbols(newSymbols) {
    console.log("WebSocket:>watchlist:symbols");
    if (this.arraysEqual(this.symbols, newSymbols)) return;
    this.symbols = [...newSymbols];

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.subscribeToTickers(newSymbols);
    } else {
      this.reconnect();
    }
  }

  arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    const sa = [...a].sort(),
      sb = [...b].sort();
    return sa.every((v, i) => v === sb[i]);
  }

  reconnect() {
    this.disconnect();
    this.connect();
  }

  connect() {
    if (this.symbols.length === 0 && !this.currentSymbol) return;

    this.ws = new WebSocket("wss://stream.bybit.com/v5/public/linear");

    this.ws.onopen = () => {
      console.log("[WS] Connected to Bybit");
      this.reconnectAttempts = 0;
      this.app.emit("ws:connected");
      this.activeSubscriptions.tickers.clear();
      this.activeSubscriptions.kline = null;

      if (this.symbols.length) {
        this.subscribeToTickers(this.symbols);
      }
      if (this.currentSymbol) {
        this.subscribeToKline(this.currentSymbol);
      }
    };

    this.ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.topic) this.handleMessage(msg);
    };

    this.ws.onclose = () => {
      console.log("[WS] Disconnected, scheduling reconnect...");
      this.scheduleReconnect();
    };

    this.ws.onerror = (err) => console.error("[WS] Error:", err);
  }

  subscribeToTickers(symbols) {
    const newSet = new Set(symbols);
    const toUnsubscribe = [...this.activeSubscriptions.tickers].filter(
      (s) => !newSet.has(s),
    );
    if (toUnsubscribe.length) {
      const msg = {
        op: "unsubscribe",
        args: toUnsubscribe.map((s) => `kline.D.${s}`),
      };
      this.ws.send(JSON.stringify(msg));
    }

    const toSubscribe = symbols.filter(
      (s) => !this.activeSubscriptions.tickers.has(s),
    );
    if (toSubscribe.length) {
      const msg = {
        op: "subscribe",
        args: toSubscribe.map((s) => `kline.D.${s}`),
      };
      this.ws.send(JSON.stringify(msg));
    }

    this.activeSubscriptions.tickers = newSet;
  }

  subscribeToKline(symbol) {
    const intervalKline =
      this.app.get("chart").intervalBybit[this.app.state.get("timeframe")];
    const newTopic = `kline.${intervalKline}.${symbol}`;

    if (
      this.activeSubscriptions.kline &&
      this.activeSubscriptions.kline !== newTopic
    ) {
      const msg = { op: "unsubscribe", args: [this.activeSubscriptions.kline] };
      this.ws.send(JSON.stringify(msg));
    }

    if (this.activeSubscriptions.kline !== newTopic) {
      const msg = { op: "subscribe", args: [newTopic] };
      this.ws.send(JSON.stringify(msg));
      this.activeSubscriptions.kline = newTopic;
    }
  }

  handleMessage(message) {
    if (message.topic) {
      if (message.topic.startsWith("kline")) {
        const timeframe = message.topic.split(".")[1];
        const symbol = message.topic.split(".")[2];
        const intervalKline =
          this.app.get("chart").intervalBybit[this.app.state.get("timeframe")];
        if (
          intervalKline === timeframe &&
          this.app.state.get("symbol") === symbol
        ) {
          this.handleKlineMessage(message.data[0]);
        }
        if (timeframe === "D") {
          this.handleTickerMessage(symbol, message.data[0]);
        }
      }
    }
  }
  handleTickerMessage(symbol, candle) {
    // Bybit ticker format
    const { close, open } = candle;
    const change = parseFloat(((close - open) / open) * 100);

    const row = document.querySelector(
      `#watchlistContainer tr[data-symbol="${symbol}"]`,
    );
    if (row) {
      const priceCell = row.querySelector("td:nth-child(2)");
      const changeCell = row.querySelector("td:nth-child(3)");
      if (priceCell) priceCell.innerHTML = `$${close}`;
      if (changeCell) {
        changeCell.className = `${change >= 0 ? "text-success" : "text-danger"}`;
        changeCell.innerHTML = `${change >= 0 ? "▲" : "▼"}${Math.abs(change).toFixed(2)}%`;
      }
    }
  }

  handleKlineMessage(candle) {
    const kline = {
      time: parseInt(candle.start) / 1000,
      open: parseFloat(candle.open),
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close),
      volume: parseFloat(candle.volume),
    };
    if (this.app.state.get("chartMode") !== "live") return;
    this.app.emit("kline:update", { symbol: this.currentSymbol, kline });
    document.title = `${candle.close}$ ${this.app.state.get("symbol")}`;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.timer) clearTimeout(this.timer);
  }

  scheduleReconnect() {
    if (this.timer) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[WS] Max reconnect attempts reached");
      return;
    }
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    this.timer = setTimeout(() => {
      this.timer = null;
      this.connect();
    }, delay);
  }

  destroy() {
    this.disconnect();
  }
}
