//Orders
class Order {
  static state = {
    ORDER_SIZE: 50,
    TAKE_PROFIT: 5,
    STOP_LOSS: 1,
  };
  constructor() {
    this.container = document.getElementById("createOrderModal");
    this.createOrderModal = new window.bootstrap.Modal(this.container);
    this.initEventListeners();
  }
  initEventListeners() {
    //long btn
    document.querySelector(".long-btn").addEventListener("click", async () => {
      Order.state.side = "Buy";
      Order.state.symbol = App.state.symbol;
      Order.state.price = ChartManager.state.linesSr[0].line.options().price;
      this.container.querySelector(".modal-title").textContent =
        `LONG ${Order.state.symbol} ${Order.state.price.toFixed(5)}$`;
      this.container
        .querySelector("#submitOrder")
        .classList.remove("btn-danger");
      this.container.querySelector("#submitOrder").classList.add("btn-success");
      this.container.querySelector("#submitOrder").textContent = "Long";
      this.createOrderModal.show();
    });
    //short btn
    document.querySelector(".short-btn").addEventListener("click", async () => {
      Order.state.side = "Sell";
      Order.state.symbol = App.state.symbol;
      Order.state.price = ChartManager.state.linesSr[1].line.options().price;
      this.container.querySelector(".modal-title").textContent =
        `SHORT ${Order.state.symbol} ${Order.state.price.toFixed(5)}$`;
      this.container
        .querySelector("#submitOrder")
        .classList.remove("btn-success");
      this.container.querySelector("#submitOrder").classList.add("btn-danger");
      this.container.querySelector("#submitOrder").textContent = "Short";
      this.createOrderModal.show();
    });
    //create order
    document
      .getElementById("createOrderForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const { side, symbol, price } = Order.state;
        const formData = new FormData(e.target);
        const tpPercent = parseFloat(formData.get("takeProfit"));
        const slPercent = parseFloat(formData.get("stopLoss"));
        try {
          const response = await fetch(`/order/create/${symbol}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json;charset=utf-8",
            },
            body: JSON.stringify({
              price,
              side,
              tpPercent,
              slPercent,
            }),
          });
          const resJson = await response.json();
          if (!response.ok) {
            alert(resJson.message);
            return false;
          }
          this.createOrderModal.hide();
          //TODO
          //fetchOrders();
        } catch (error) {
          alert(`Error: ${error.message}`);
        }
      });
  }
  async createOrder() {
    alert("dfdf");
  }
}
//simple order
class Router {
  constructor() {
    this.router = new window.Navigo("/", true);
    this.initRoutes();
  }

  initRoutes() {
    this.router
      .on({
        "/chart": async () => this.defaultRoute(),
        "/chart/:symbol/:timeframe": async ({ data }) =>
          await this.handleRoute(data),
        "/chart/:symbol/:timeframe/message": async ({ data }) =>
          this.handleMessage(data),
      })
      .resolve();
  }
  defaultRoute() {
    this.navigate(`/chart/BTCUSDT/${App.state.timeframe}`);
  }
  handleMessage(params = {}) {
    App.state.activeTab = params.timeframe;
    this.navigate(`/chart/${params.symbol}/${params.timeframe}`);
  }
  async handleRoute(params = {}) {
    const intervalKline = {
      "1min": "1",
      "5min": "5",
      "15min": "15",
      "30min": "30",
      "1h": "60",
      "2h": "120",
      "4h": "240",
      "6h": "360",
      "12h": "720",
      "1d": "D",
      "1w": "W",
      "1m": "M",
    };
    const state = {
      symbol: params.symbol || "BTCUSDT",
      timeframe: params.timeframe || "1h",
      intervalKline: intervalKline[params.timeframe],
    };
    App.setState(state);
    await App.renderChart();
  }

  navigate(path) {
    this.router.navigate(path);
  }
}

class Indicators {
  //levels
  static calculateLevels(
    candles,
    candlesCount = 24,
    extrCount = 3,
    tolerancePercent = 0.2,
    touchCount = 4,
  ) {
    if (ChartManager.state.hideSr) {
      for (const alert of ChartManager.state.linesSr) {
        alert.line.applyOptions({
          lineVisible: false,
          axisLabelVisible: false,
        });
      }
      return;
    }
    const tolerance = tolerancePercent / 100;
    const candlesSlice = candles.slice(-candlesCount);
    const highs = candlesSlice.map((c) => c.high).sort((a, b) => a - b);
    const lows = candlesSlice.map((c) => c.low).sort((a, b) => a - b);
    // Рассчитываем уровень сопротивления
    let resistance = null;
    for (const high of highs.slice(-extrCount)) {
      const threshold = high * (1 - tolerance);
      const touches = candlesSlice.filter(
        (c) => c.low <= threshold && threshold <= c.high,
      ).length;
      if (touches >= touchCount) {
        resistance = threshold;
      }
    }
    // Рассчитываем уровень поддержки
    let support = null;
    for (const low of lows.slice(0, extrCount)) {
      const threshold = low * (1 + tolerance);
      const touches = candlesSlice.filter(
        (c) => c.low <= threshold && threshold <= c.high,
      ).length;
      if (touches >= touchCount) {
        support = threshold;
      }
    }
    //resistance line
    ChartManager.state.linesSr[1].line.applyOptions({
      price: resistance || highs[highs.length - 1],
      color: resistance ? "red" : "black",
      lineStyle: resistance ? 1 : 2,
      lineVisible: true,
      axisLabelVisible: true,
    });
    resistance = resistance || highs[highs.length - 1];
    //support line
    const supportV = support || lows[0];
    ChartManager.state.linesSr[0].line.applyOptions({
      price: support || lows[0],
      color: support ? "green" : "black",
      lineStyle: support ? 1 : 2,
      lineVisible: true,
      axisLabelVisible: true,
      title: `${(((supportV - resistance) / resistance) * 100).toFixed(1)}%`,
    });
  }
  // RSI для всех свечей
  static calculateRSI(closes, period = 14) {
    if (closes.length < period + 1) return [];
    const rsi = [];
    let avgGain = 0;
    let avgLoss = 0;
    // Инициализация первых значений
    for (let i = 1; i <= period; i++) {
      const delta = closes[i] - closes[i - 1];
      avgGain += Math.max(delta, 0);
      avgLoss += Math.abs(Math.min(delta, 0));
    }

    avgGain /= period;
    avgLoss /= period;
    // Первое значение RSI
    rsi.push(100 - 100 / (1 + (avgLoss === 0 ? Infinity : avgGain / avgLoss)));

    // Расчет последующих значений
    for (let i = period + 1; i < closes.length; i++) {
      const delta = closes[i] - closes[i - 1];
      const gain = Math.max(delta, 0);
      const loss = Math.abs(Math.min(delta, 0));
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
      rsi.push(100 - 100 / (1 + rs));
    }

    return new Array(period).fill(null).concat(rsi);
  }

  static calculateMACD(
    closes,
    fastPeriod = 12,
    slowPeriod = 26,
    signalPeriod = 9,
  ) {
    const calculateEMA = (data, period) => {
      if (data.length < period) return new Array(data.length).fill(null);
      const ema = [];
      // Инициализация SMA
      let sma =
        data.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
      ema.push(...new Array(period - 1).fill(null));
      ema.push(sma);
      // Расчет EMA
      const k = 2 / (period + 1);
      for (let i = period; i < data.length; i++) {
        sma = data[i] * k + sma * (1 - k);
        ema.push(sma);
      }
      return ema;
    };

    // Рассчитываем EMA
    const emaFast = calculateEMA(closes, fastPeriod);
    const emaSlow = calculateEMA(closes, slowPeriod);

    // Рассчитываем MACD Line
    const macdLine = emaFast.map((fast, i) => {
      if (fast === null || emaSlow[i] === null) return null;
      return fast - emaSlow[i];
    });

    // Рассчитываем Signal Line
    const validMacdValues = macdLine.filter((v) => v !== null);
    const signalLineEMA = calculateEMA(validMacdValues, signalPeriod);
    const signalLine = new Array(macdLine.length - validMacdValues.length)
      .fill(null)
      .concat(signalLineEMA);

    // Рассчитываем Histogram
    const histogram = macdLine.map((macd, i) => {
      if (macd === null || signalLine[i] === null) return null;
      return macd - signalLine[i];
    });

    return { macd: macdLine, signal: signalLine, histogram };
  }
}
//LightweightCharts
class ChartManager {
  static state = {
    chart: null,
    candlestickSeries: null,
    volumeSeries: null,
    rsiSeries: null,
    macdLineSeries: null,
    signalLineSeries: null,
    macdHistogramSeries: null,
    alerts: [],
    hoveredAlert: null,
    selectedAlert: null,
    currentPriceMove: null,
    isDroped: true,
    candles: [],
    hideSr: false,
    linesSr: [],
  };
  constructor() {
    this.container = document.getElementById("chart");
    this.volumeContainer = document.getElementById("volumeEl");
    this.candleContainer = document.getElementById("candleEl");
    this.prevSymbolKlineTopic = null;
    this.ws = new WebSocket("wss://stream.bybit.com/v5/public/linear");
    this.activeSubscriptions = new Set();
  }

  init() {
    ChartManager.state.chart = window.LightweightCharts.createChart(
      this.container,
      {
        //width: this.container.offsetWidth,
        height: 800,
        layout: {
          textColor: "black",
          background: { type: "solid", color: "white" },
          panes: {
            separatorColor: "rgba(55, 198, 241, 0.97)",
            separatorHoverColor: "rgba(155, 185, 180, 0.97)",
            // setting this to false will disable the resize of the panes by the user
            enableResize: true,
          },
        },
        timeScale: {
          timeVisible: true,
          //borderColor: "#25282D",
          //secondsVisible: false,
        },
        localization: {
          //priceFormatter: (p) => p.toFixed(5),
          timeFormatter: (timestamp) => {
            return new Date(timestamp * 1000).toLocaleString("ru-RU");
          },
        },
        crosshair: {
          mode: window.LightweightCharts.CrosshairMode.Normal,
        },
      },
    );
    //main series
    ChartManager.state.candlestickSeries = ChartManager.state.chart.addSeries(
      window.LightweightCharts.CandlestickSeries,
      {
        priceFormat: {
          type: "price",
          precision: 2,
          minMove: 0.01,
        },
      },
      0,
    );
    ChartManager.state.candlestickSeries.priceScale().applyOptions({
      scaleMargins: {
        autoScale: true,
        top: 0.1,
        bottom: 0.15,
      },
    });
    //Support lines
    ChartManager.state.linesSr.push({
      name: "supportLine",
      line: ChartManager.state.candlestickSeries.createPriceLine({
        price: 1,
        color: "green",
        lineWidth: 2,
        lineStyle: 2,
        title: "Long",
        lineVisible: false,
        axisLabelVisible: false,
      }),
    });
    ChartManager.state.linesSr.push({
      name: "resistanceLine",
      line: ChartManager.state.candlestickSeries.createPriceLine({
        price: 1,
        color: "red",
        lineWidth: 2,
        lineStyle: 2,
        title: "Short",
        lineVisible: false,
        axisLabelVisible: false,
      }),
    });
    ChartManager.state.volumeSeries = ChartManager.state.chart.addSeries(
      window.LightweightCharts.HistogramSeries,
      {
        priceFormat: { type: "volume" },
        priceScaleId: "",
      },
      0,
    );
    ChartManager.state.volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.85, // highest point of the series will be 70% away from the top
        bottom: 0,
      },
    });
    //indicators
    ChartManager.state.rsiSeries = ChartManager.state.chart.addSeries(
      window.LightweightCharts.LineSeries,
      {
        color: "#FF6D00",
        lineWidth: 2,
        priceLineVisible: false,
      },
      1,
    );
    ChartManager.state.macdLineSeries = ChartManager.state.chart.addSeries(
      window.LightweightCharts.LineSeries,
      {
        color: "#2962FF",
        lineWidth: 1,
        priceLineVisible: false,
        priceFormat: {
          type: "price",
          minMove: 0.00001,
        },
      },
      2,
    );
    ChartManager.state.signalLineSeries = ChartManager.state.chart.addSeries(
      window.LightweightCharts.LineSeries,
      {
        color: "#FF6D00",
        lineWidth: 1,
        priceLineVisible: false,
        priceFormat: {
          type: "price",
          //precision: 5,
          minMove: 0.00001,
        },
      },
      2,
    );
    ChartManager.state.macdHistogramSeries = ChartManager.state.chart.addSeries(
      window.LightweightCharts.HistogramSeries,
      {
        color: "rgba(76, 175, 80, 0.5)",
        negativeColor: "rgba(255, 82, 82, 0.5)",
        priceLineVisible: false,
        priceFormat: {
          type: "price",
          //precision: 5,
          minMove: 0.00001,
        },
      },
      2,
    );
    ChartManager.state.chart.panes()[0].setHeight(550);
    ChartManager.state.chart.subscribeClick(this.defaultAlerts);
    ChartManager.state.chart.subscribeCrosshairMove(this.handleCrosshairMove);
    //start WS
    this.initEventListeners();
    this.initWebSocket();
  }
  dragAlert() {
    //choose alert
    ChartManager.state.selectedAlert = ChartManager.state.hoveredAlert;
    for (const alert of ChartManager.state.alerts) {
      if (ChartManager.state.selectedAlert === alert.name) {
        ChartManager.state.isDroped = false;
      }
    }
    for (const alert of ChartManager.state.linesSr) {
      if (ChartManager.state.selectedAlert === alert.name) {
        ChartManager.state.isDroped = false;
      }
    }
  }
  async dropAlert() {
    ChartManager.state.isDroped = true;
    //save alert
    if (ChartManager.state.selectedAlert) {
      //stop drop
      for (const alert of ChartManager.state.alerts) {
        if (ChartManager.state.selectedAlert === alert.name) {
          await this.saveAlert(
            App.state.symbol,
            ChartManager.state.selectedAlert,
            ChartManager.state.currentPriceMove,
          );
        }
      }
    }
    this.defaultAlerts();
    ChartManager.state.selectedAlert = null;
  }
  initEventListeners() {
    let isMouseDown = false;

    // Обработчик нажатия кнопки мыши
    this.container.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        isMouseDown = true;
        e.preventDefault(); // Предотвращаем стандартное поведение
      }
    });

    // Обработчик движения мыши
    this.container.addEventListener("mousemove", () => {
      if (isMouseDown) {
        // Получаем координаты мыши
        // const x = e.clientX;
        // const y = e.clientY;
        this.dragAlert();
        // Ваш код здесь (например, рисуем или перемещаем объект)
        //console.log(`Mouse moved to: ${x}, ${y}`);
      }
    });

    // Обработчик отпускания кнопки мыши (на весь документ)
    document.addEventListener("mouseup", () => {
      this.dropAlert();
      isMouseDown = false;
    });
    //drag
    //this.container.addEventListener("mouseenter", () => this.dragAlert());
    //drop
    // this.container.addEventListener(
    //   "mouseup",
    //   async () => await this.dropAlert(),
    // );
    //touch events
    //drag
    this.container.addEventListener("touchmove", () => this.dragAlert());
    //drop
    this.container.addEventListener(
      "touchend",
      async () => await this.dropAlert(),
    );
  }
  //save alerts
  async saveAlert(symbol, alertName, alertValue) {
    const response = await fetch(`/edit-alert/${symbol}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
      body: JSON.stringify({
        alertName,
        alertValue,
      }),
    });
    const resJson = await response.json();
    //error msg
    if (!response.ok) {
      alert(resJson.message);
    }
  }
  async loadChartData() {
    try {
      const response = await fetch(
        `https://api.bybit.com/v5/market/kline?category=linear&symbol=${App.state.symbol}&interval=${App.state.intervalKline}&limit=300`,
      );
      const data = await response.json();
      if (data.retCode !== 0) {
        throw new Error(`Error API: ${data.retMsg}`);
      }
      const responseInfo = await fetch(
        `https://api.bybit.com/v5/market/instruments-info?category=linear&symbol=${App.state.symbol}`,
      );
      const dataInfo = await responseInfo.json();
      if (dataInfo.retCode !== 0) {
        throw new Error(`Error API: ${dataInfo.retMsg}`);
      }
      const instrument = dataInfo.result.list[0];
      if (instrument.status !== "Trading") {
        throw new Error(`Error API instrument.status: ${instrument.status}`);
      }
      const {
        priceFilter: { tickSize },
        priceScale,
      } = instrument;
      ChartManager.state.candlestickSeries.applyOptions({
        priceFormat: {
          type: "price",
          precision: priceScale,
          minMove: tickSize,
        },
      });
      const formattedData = data.result.list.reverse().map((candle) => ({
        time: parseInt(candle[0]) / 1000,
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5]),
      }));
      ChartManager.state.candles = formattedData;
      ChartManager.state.candlestickSeries.setData([]);
      ChartManager.state.volumeSeries.setData([]);
      ChartManager.state.rsiSeries.setData([]);
      ChartManager.state.macdLineSeries.setData([]);
      ChartManager.state.signalLineSeries.setData([]);
      ChartManager.state.macdHistogramSeries.setData([]);
      await this.updateData(formattedData);
      this.updateWebsocketSymbol();
    } catch (error) {
      alert(`Error loading chart data:, ${error}`);
      console.error("Error loading chart data:", error);
    }
  }
  checkHover(checkPrice, lines) {
    if (ChartManager.state.isDroped) {
      for (const alert of lines) {
        const isAlertHover =
          alert.line.options().price &&
          Math.abs(checkPrice - alert.line.options().price) / checkPrice <
            0.005;
        if (isAlertHover) {
          ChartManager.state.hoveredAlert = alert.name;
          alert.line.applyOptions({
            color: "orange",
          });
          this.container.style.cursor = "pointer";
          return;
        }
      }
      this.defaultAlerts();
    }
  }
  // Инициализация WebSocket
  initWebSocket() {
    this.ws.onopen = () => {
      console.log("WebSocket connected");
      //this.resubscribe();
    };
    this.ws.onmessage = (e) => this.handleMessage(e);
    this.ws.onclose = () => {
      setTimeout(() => this.initWebSocket(), 3000);
    };
  }
  updateWebsocketSymbol() {
    if (this.prevSymbolKlineTopic) {
      const subscribeMsg = {
        op: "unsubscribe",
        args: this.prevSymbolKlineTopic,
      };
      this.sendSubscription(subscribeMsg);
    }
    const subscribeMsg = {
      op: "subscribe",
      args: [`kline.${App.state.intervalKline}.${App.state.symbol}`],
    };
    this.prevSymbolKlineTopic = [
      `kline.${App.state.intervalKline}.${App.state.symbol}`,
    ];
    //this.ws.send(JSON.stringify(subscribeMsg));
    this.sendSubscription(subscribeMsg);
  }
  // Обновление параметров графика
  updateWebsocketSubs() {
    this.unsubscribeAll();
    this.subscribeToData();
  }

  // Подписка на данные
  subscribeToData() {
    //const args = App.state.coins.map((coin) => `tickers.${coin.symbol}`);
    //todo use D timeframe % by 03:00
    const args = App.state.coins.map((coin) => `kline.D.${coin.symbol}`);
    const subscribeMsg = {
      op: "subscribe",
      args,
    };
    this.sendSubscription(subscribeMsg);
    args.forEach((topic) => this.activeSubscriptions.add(topic));
  }
  // Отписка от всех активных подписок
  unsubscribeAll() {
    const unsubscribeMsg = {
      op: "unsubscribe",
      args: Array.from(this.activeSubscriptions),
    };

    if (this.activeSubscriptions.size > 0) {
      // this.ws.send(JSON.stringify(unsubscribeMsg));
      this.sendSubscription(unsubscribeMsg);
      this.activeSubscriptions.clear();
    }
  }
  sendSubscription(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
  // Обработка сообщений
  handleMessage(event) {
    const message = JSON.parse(event.data);
    if (message.topic) {
      if (message.topic.startsWith("kline")) {
        const timeframe = message.topic.split(".")[1];
        const symbol = message.topic.split(".")[2];
        if (
          App.state.intervalKline === timeframe &&
          App.state.symbol === symbol
        ) {
          this.handleKlineData(message.data[0]);
        }
        if (timeframe === "D") {
          this.handleTickerData(symbol, message.data[0]);
        }
      }
      // if (data.topic.startsWith("tickers")) {
      //   this.handleTickerData(data);
      // }
    }
  }
  handleKlineData(candle) {
    this.updateRealtime({
      time: parseInt(candle.start) / 1000,
      open: parseFloat(candle.open),
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close),
      volume: parseFloat(candle.volume),
    });
  }
  handleTickerData(symbol, candle) {
    const { close, open } = candle;
    const element = document.querySelector(`[data-symbol="${symbol}"]`);
    if (element) {
      const priceElem = element.querySelector(".coin-price");
      const changeElem = element.querySelector(".coin-change");
      if (priceElem && close) {
        priceElem.textContent = `$${parseFloat(close).toFixed(4)}`;
      }
      if (changeElem && close) {
        const change = parseFloat(((close - open) / open) * 100);
        changeElem.textContent = `${change.toFixed(2)}%`;
        //changeElem.className = `coin-change ${change >= 0 ? 'positive' : 'negative'}`;
      }
    }
  }
  async updateData(history) {
    //set Data
    ChartManager.state.candlestickSeries.priceScale().applyOptions({
      autoScale: true,
    });
    ChartManager.state.candlestickSeries.setData(history);
    ChartManager.state.volumeSeries.setData(
      history.map((c) => ({
        time: c.time,
        value: c.volume,
        color: c.close > c.open ? "#26A69A" : "#EF5350",
      })),
    );
    // Рассчитываем и отображаем исторические индикаторы
    const closes = history.map((c) => c.close);
    if (closes.length > 14) {
      const rsiData = Indicators.calculateRSI(closes);
      ChartManager.state.rsiSeries.setData(
        history.slice(14).map((c, i) => {
          return {
            time: c.time,
            value: rsiData[i + 14],
          };
        }),
      );
    }

    if (closes.length >= 35) {
      const macdData = Indicators.calculateMACD(closes);
      ChartManager.state.macdLineSeries.setData(
        history.slice(34).map((c, i) => {
          return {
            time: c.time,
            value: macdData.macd[i + 34],
          };
        }),
      );
      ChartManager.state.signalLineSeries.setData(
        history.slice(34).map((c, i) => {
          return {
            time: c.time,
            value: macdData.signal[i + 34],
          };
        }),
      );
      ChartManager.state.macdHistogramSeries.setData(
        history.slice(34).map((c, i) => {
          return {
            time: c.time,
            value: macdData.histogram[i + 34],
            color: macdData.histogram[i + 34] >= 0 ? "#4CAF50" : "#EF5350",
          };
        }),
      );
    }

    //scroll chart
    ChartManager.state.chart.timeScale().scrollToPosition(8); //fitContent();//scrollToPosition(5);
    //load Alerts
    await App.loadAlerts();
  }
  updateRealtime(newCandle) {
    if (!ChartManager.state.point) {
      const date = new Date(newCandle.time * 1000).toLocaleString("ru-RU");
      App.chartManager.volumeContainer.textContent = `Volume: ${ChartManager.state.volumeSeries.priceFormatter().format(newCandle.volume)}`;
      App.chartManager.candleContainer.textContent = `${(((newCandle.close - newCandle.open) / newCandle.open) * 100).toFixed(2)}%, ${date}`;
    }
    const prevCandle =
      ChartManager.state.candles[ChartManager.state.candles.length - 1];
    if (newCandle.time !== prevCandle.time) {
      ChartManager.state.candles.push(newCandle);
    } else {
      ChartManager.state.candles[ChartManager.state.candles.length - 1] =
        newCandle;
    }
    const closes = ChartManager.state.candles.map((c) => c.close);
    ChartManager.state.candlestickSeries.update(newCandle);
    ChartManager.state.volumeSeries.update({
      time: newCandle.time,
      value: newCandle.volume,
      color: newCandle.close > newCandle.open ? "#26A69A" : "#EF5350",
    });
    // Расчет и обновление RSI
    if (closes.length > 14) {
      const rsi = Indicators.calculateRSI(closes);
      ChartManager.state.rsiSeries.update({
        time: newCandle.time,
        value: rsi[rsi.length - 1],
      });
    }

    // // Расчет и обновление MACD
    if (closes.length > 35) {
      const macd = Indicators.calculateMACD(closes);
      const last = macd.macd.length - 1;
      ChartManager.state.macdLineSeries.update({
        time: newCandle.time,
        value: macd.macd[last],
      });
      ChartManager.state.signalLineSeries.update({
        time: newCandle.time,
        value: macd.signal[last],
      });
      ChartManager.state.macdHistogramSeries.update({
        time: newCandle.time,
        value: macd.histogram[last],
        color: macd.histogram[last] >= 0 ? "#4CAF50" : "#EF5350",
      });
    }
  }
  //cross events
  handleCrosshairMove(param) {
    ChartManager.state.point = param.point;
    if (!param.point) {
      return;
    }
    const candle = param.seriesData.get(ChartManager.state.candlestickSeries);
    if (candle) {
      const date = new Date(candle.time * 1000).toLocaleString("ru-RU");
      App.chartManager.candleContainer.textContent = `${(((candle.close - candle.open) / candle.open) * 100).toFixed(2)}%, ${date}`;
    }
    //update volume
    if (param.time) {
      const datapoints = param.seriesData.get(ChartManager.state.volumeSeries);
      if (datapoints) {
        App.chartManager.volumeContainer.textContent = `Volume: ${ChartManager.state.volumeSeries.priceFormatter().format(datapoints.value)}`;
      }
    }
    if (ChartManager.state.candlestickSeries) {
      ChartManager.state.currentPriceMove =
        ChartManager.state.candlestickSeries.coordinateToPrice(param.point.y);
      if (App.state.hideAlerts && ChartManager.state.currentPriceMove > 0) {
        App.chartManager.checkHover(
          ChartManager.state.currentPriceMove,
          ChartManager.state.alerts,
        );
      }
      if (
        !ChartManager.state.hideSr &&
        ChartManager.state.currentPriceMove > 0
      ) {
        App.chartManager.checkHover(
          ChartManager.state.currentPriceMove,
          ChartManager.state.linesSr,
        );
      }
    }
    //drag effect
    if (ChartManager.state.isDroped) {
      return;
    }
    for (const alert of ChartManager.state.alerts) {
      if (ChartManager.state.selectedAlert === alert.name) {
        alert.line.applyOptions({
          price: ChartManager.state.currentPriceMove,
        });
        ChartManager.state.chart.applyOptions({
          handleScroll: false,
          handleScale: false,
        });
        return;
      }
    }
    for (const alert of ChartManager.state.linesSr) {
      if (ChartManager.state.selectedAlert === alert.name) {
        alert.line.applyOptions({
          price: ChartManager.state.currentPriceMove,
        });
        const resistance = ChartManager.state.linesSr[1].line.options().price;
        const support = ChartManager.state.linesSr[0].line.options().price;
        ChartManager.state.linesSr[0].line.applyOptions({
          title: `${(((support - resistance) / resistance) * 100).toFixed(1)}%`,
        });
        ChartManager.state.chart.applyOptions({
          handleScroll: false,
          handleScale: false,
        });
        return;
      }
    }
  }
  defaultAlerts() {
    for (const alert of ChartManager.state.alerts) {
      alert.line.applyOptions({
        color:
          alert.name === "alert0" || alert.name === "alert5" ? "red" : "blue",
      });
    }
    ChartManager.state.linesSr[0].line.applyOptions({ color: "green" });
    ChartManager.state.linesSr[1].line.applyOptions({ color: "red" });
    App.chartManager.container.style.cursor = "default";
    ChartManager.state.chart.applyOptions({
      handleScroll: true,
      handleScale: true,
    });
    ChartManager.state.hoveredAlert = null;
  }
}

class App {
  static state = {
    symbol: "BTCUSDT",
    timeframe: "1h",
    cursorPrev: null,
    cursorNext: null,
    coins: [],
    activeTab: "favorites",
    hideAlerts: false,
    bsOffcanvas: new window.bootstrap.Offcanvas("#offcanvasResponsive"),
  };

  static async init() {
    this.chartManager = new ChartManager();
    this.router = new Router();
    this.order = new Order();
    this.initAutocomplete();
    this.initChart();
    await this.loadCoins();
    this.initEventListeners();
  }
  static initAutocomplete() {
    //algolia search
    const { autocomplete, getAlgoliaResults } =
      window["@algolia/autocomplete-js"];
    const { liteClient } = window["algoliasearch/lite"];
    const { createLocalStorageRecentSearchesPlugin } =
      window["@algolia/autocomplete-plugin-recent-searches"];
    const searchClient = liteClient(
      "YSHMAC99ZS",
      "c9f2ff23faccc8a423feb221fdbfdb53",
    );
    const recentSearchesPlugin = createLocalStorageRecentSearchesPlugin({
      key: "navbar",
      transformSource({ source }) {
        return {
          ...source,
          onSelect({ item }) {
            //window.location.href = `/${item.label}`;
            const symbol = item.label.toUpperCase();
            // App.setState({
            //   symbol: `${symbol}${symbol.endsWith("USDT") ? "" : "USDT"}`,
            // });
            App.router.navigate(
              `/chart/${symbol}${symbol.endsWith("USDT") ? "" : "USDT"}/${App.state.timeframe}`,
            );
            //App.setState({ symbol: item.label });
          },
        };
      },
    });
    autocomplete({
      debug: false,
      container: "#autocomplete",
      placeholder: "Search for tickers",
      detachedMediaQuery: "(max-width: 991.98px)",
      openOnFocus: true,
      plugins: [recentSearchesPlugin],
      onSubmit({ state }) {
        //window.location.href = `/${state.query}`;
        const symbol = state.query.toUpperCase();
        // App.setState({
        //   symbol: `${symbol}${symbol.endsWith("USDT") ? "" : "USDT"}`,
        // });
        if (symbol) {
          App.router.navigate(
            `/chart/${symbol}${symbol.endsWith("USDT") ? "" : "USDT"}/${App.state.timeframe}`,
          );
        }
      },
      getSources() {
        return [
          {
            sourceId: "querySuggestions",
            getItemInputValue: ({ item }) => item.symbol,
            getItems({ query }) {
              return getAlgoliaResults({
                searchClient,
                queries: [
                  {
                    indexName: "crypto",
                    params: {
                      query,
                      hitsPerPage: 4,
                    },
                  },
                ],
              });
            },
            templates: {
              item({ item, html, components }) {
                return html`<div class="aa-ItemWrapper">
                  <div class="aa-ItemContent">
                    <div class="aa-ItemContentBody">
                      <div class="aa-ItemContentTitle text-wrap">
                        ${components.Highlight({
                          hit: item,
                          attribute: "symbol",
                        })}
                      </div>
                    </div>
                  </div>
                </div>`;
              },
            },
            onSelect({ item }) {
              recentSearchesPlugin.data.addItem({
                id: item.symbol,
                label: item.symbol,
              });
              //window.location.href = `/${item.symbol}`;
              const symbol = item.symbol.toUpperCase();
              // App.setState({
              //   symbol: `${symbol}${symbol.endsWith("USDT") ? "" : "USDT"}`,
              // });
              App.router.navigate(
                `/chart/${symbol}${symbol.endsWith("USDT") ? "" : "USDT"}/${App.state.timeframe}`,
              );
            },
          },
        ];
      },
    });
  }
  static initChart() {
    this.chartManager.init();
  }

  static async loadCoinsBybit(cursorNext = "") {
    const url = `https://api.bybit.com/v5/market/instruments-info?category=linear&limit=10${cursorNext ? `&cursor=${cursorNext}` : ""}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      this.state.coins = data.result.list.filter(
        (c) => c.status === "Trading" && c.symbol.endsWith("USDT"),
      );
      this.state.cursorPrev = null;
      this.state.cursorNext = data.result.nextPageCursor;
      this.renderCoinList();
      this.updatePagination();
    } catch (error) {
      console.error("Error loading Bybit coins:", error);
    }
  }
  //my coins
  static async loadCoins(direction = null, lastVisibleId = null) {
    const url = `/api/tickers?direction=${direction}&lastVisibleId=${lastVisibleId}&tab=${this.state.activeTab}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      this.state.coins = data.paginate.tickers;
      this.state.cursorNext = null;
      this.state.cursorPrev = null;
      if (data.paginate.hasNext) {
        this.state.cursorNext = data.paginate.lastVisibleId;
      }
      if (data.paginate.hasPrev) {
        this.state.cursorPrev = data.paginate.firstVisibleId;
      }
      //set message tab
      document
        .querySelectorAll(".tab-link")
        .forEach((n) => n.classList.remove("active"));
      document
        .querySelector(`[data-tab='${this.state.activeTab}']`)
        .classList.add("active");
      this.renderCoinList();
      this.updatePagination();
    } catch (error) {
      console.error("Error loading Bybit coins:", error);
    }
  }
  static renderCoinList() {
    const coinList = document.querySelector(".coin-list");
    coinList.replaceChildren();
    const template = document.getElementById("coin-template");
    const fragment = document.createDocumentFragment();
    this.state.coins.forEach((coin) => {
      const updatedAt = coin[`lastNotified_${this.state.activeTab}`]
        ? window
            .moment(
              coin[`lastNotified_${this.state.activeTab}`]._seconds * 1000,
            )
            .fromNow()
        : "";
      const clone = template.content.cloneNode(true);
      const root = clone.firstElementChild;
      root.dataset.symbol = coin.symbol;
      clone.querySelector(".coin-symbol").textContent =
        `${coin.symbol} ${["15min", "30min", "1h"].includes(this.state.activeTab) ? `${updatedAt}` : ""}`;
      clone.querySelector(".add-btn").dataset.symbolTitle = coin.symbol;
      clone.querySelector(".star-btn").dataset.symbolTitle = coin.symbol;
      clone.querySelector(".alert-btn").dataset.symbolTitle = coin.symbol;
      if (coin.exists) {
        //add
        clone.querySelector(".add-btn").textContent = "🗑";
        clone.querySelector(".add-btn").dataset.add = true;
        clone.querySelector(".add-btn").classList.remove("d-none");
        //star
        clone.querySelector(".star-btn").dataset.star = coin.star;
        clone.querySelector(".star-btn").textContent = coin.star ? "❤️" : "🖤";
        clone.querySelector(".star-btn").classList.remove("d-none");
        //alert
        clone.querySelector(".alert-btn").dataset.alert = coin.alert;
        clone.querySelector(".alert-btn").textContent = coin.alert
          ? "🔔"
          : "🔕";
        clone.querySelector(".alert-btn").classList.remove("d-none");
      }
      //for load from autocomplete
      if (coin.loaded) {
        clone.querySelector(".add-btn").textContent = "➕";
        clone.querySelector(".add-btn").dataset.add = false;
        clone.querySelector(".add-btn").classList.remove("d-none");
      }
      if (this.state.symbol === coin.symbol) {
        root.classList.add("active");
      }
      fragment.appendChild(clone);
    });
    coinList.replaceChildren(fragment);
    //ws subs
    this.chartManager.updateWebsocketSubs();
  }

  static updatePagination() {
    //const container = document.querySelector(".pagination-container");
    //const template = document.getElementById("pagination-template");
    //const fragment = document.createDocumentFragment();
    //const clone = template.content.cloneNode(true);
    document
      .querySelector(".prev-btn")
      .classList.toggle("d-none", !this.state.cursorPrev);
    document
      .querySelector(".next-btn")
      .classList.toggle("d-none", !this.state.cursorNext);
    //fragment.appendChild(clone);
    //container.replaceChildren(fragment);
    // container.innerHTML = `<button class="btn page-link prev-btn mt-3" ${!this.state.cursorPrev ? "disabled" : ""}>Prev</button>
    // <button class="btn page-link next-btn mt-3" ${!this.state.cursorNext ? "disabled" : ""}>Next</button>
    // {{#if paginate.hasPrev}}
    //                 {{/if}}`;
  }
  static setState(newState) {
    this.state = { ...this.state, ...newState };
    document.querySelector(".timeframe-select").value = this.state.timeframe;
    document.querySelector(".hide-btn").textContent = this.state.hideAlerts
      ? "📝"
      : "🔏";
  }
  static async renderChart() {
    await this.chartManager.loadChartData();
  }
  static hideAlerts() {
    this.state.hideAlerts = !this.state.hideAlerts;
    document.querySelector(".hide-btn").textContent = this.state.hideAlerts
      ? "📝"
      : "🔏";
    for (const alert of ChartManager.state.alerts) {
      alert.line.applyOptions({
        lineVisible: this.state.hideAlerts,
        axisLabelVisible: this.state.hideAlerts,
      });
    }
  }
  static async loadAlerts(defaultAlerts = false) {
    //get alerts
    const alertsData = await fetch(`/alerts/${App.state.symbol}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
      body: JSON.stringify({
        defaultAlerts,
        timeframe: App.state.timeframe,
      }),
    });
    const alertsDataJson = await alertsData.json();
    if (!alertsData.ok) {
      alert(alertsDataJson.message);
      return false;
    }
    //symbol msg
    document.getElementById("messageSymbol").textContent =
      alertsDataJson.message || "";
    //Level SR
    App.state.patternLevel = alertsDataJson.patternLevel;
    if (App.state.patternLevel) {
      const {
        candlesCount,
        extCount,
        tolerancePercent,
        touchCount,
        pricePercent = 0.002,
      } = App.state.patternLevel;
      Indicators.calculateLevels(
        ChartManager.state.candles,
        candlesCount,
        extCount,
        tolerancePercent,
        touchCount,
      );
      const paramsSR = `${App.state.symbol} ${candlesCount}, ${extCount}, ${tolerancePercent}, ${touchCount}, ${pricePercent}`;
      document.querySelector(".display-symbol").textContent = paramsSR;
    } else {
      Indicators.calculateLevels(ChartManager.state.candles);
      document.querySelector(".display-symbol").textContent = App.state.symbol;
    }
    //show hide btns
    if (App.state.item) {
      App.state.item.querySelector(".add-btn").classList.remove("d-none");
      App.state.item
        .querySelector(".star-btn")
        .classList.toggle("d-none", !alertsDataJson.exists);
      App.state.item
        .querySelector(".alert-btn")
        .classList.toggle("d-none", !alertsDataJson.exists);
      if (alertsDataJson.exists) {
        App.state.item.querySelector(".add-btn").textContent = "🗑";
        App.state.item.querySelector(".add-btn").dataset.add = true;
        //star
        App.state.item.querySelector(".star-btn").dataset.star =
          alertsDataJson.star;
        App.state.item.querySelector(".star-btn").textContent =
          alertsDataJson.star ? "❤️" : "🖤";
        //alert
        App.state.item.querySelector(".alert-btn").dataset.alert =
          alertsDataJson.alert;
        App.state.item.querySelector(".alert-btn").textContent =
          alertsDataJson.alert ? "🔔" : "🔕";
      } else {
        App.state.item.querySelector(".add-btn").textContent = "➕";
        App.state.item.querySelector(".add-btn").dataset.add = false;
      }
    } else {
      if (!this.state.coins.find((coin) => coin.symbol === this.state.symbol)) {
        this.state.coins.unshift({
          symbol: this.state.symbol,
          star: alertsDataJson.star,
          alert: alertsDataJson.alert,
          exists: alertsDataJson.exists,
          loaded: !alertsDataJson.exists,
        });
      } else {
        const symbol = this.state.symbol;
        this.state.coins = this.state.coins.map((coin) => {
          if (coin.symbol === symbol) {
            return {
              symbol,
              star: alertsDataJson.star,
              alert: alertsDataJson.alert,
              exists: alertsDataJson.exists,
              loaded: !alertsDataJson.exists,
            };
          } else {
            return coin;
          }
        });
      }
      if (!App.state.alertBtn) {
        this.renderCoinList();
      }
      App.state.alertBtn = false;
    }
    App.state.item = false;
    //clear alerts
    if (ChartManager.state.alerts.length) {
      for (const alert of ChartManager.state.alerts) {
        ChartManager.state.candlestickSeries.removePriceLine(alert.line);
      }
    }
    ChartManager.state.alerts = [];
    for (const [index, value] of alertsDataJson.alerts.entries()) {
      ChartManager.state.alerts.push({
        name: `alert${index}`,
        line: ChartManager.state.candlestickSeries.createPriceLine({
          price: value,
          color: index === 0 || index === 5 ? "red" : "blue",
          lineWidth: 2,
          lineStyle: window.LightweightCharts.LineStyle.Dashed,
          title: index + 1,
          lineVisible: this.state.hideAlerts,
          axisLabelVisible: this.state.hideAlerts,
        }),
      });
    }
    //set pump messages
    const messageList = document.querySelector(".message");
    messageList.replaceChildren();
    if (alertsDataJson.pumpMsg.length) {
      const template = document.getElementById("message-template");
      const fragment = document.createDocumentFragment();
      for (const message of alertsDataJson.pumpMsg) {
        //${message.arrayNotify.join("<br/>")}</p>`;
        const clone = template.content.cloneNode(true);
        clone.querySelector(".card-header").textContent =
          `${message.timeframe} ${App.state.symbol} ${new Date(message.lastNotified._seconds * 1000).toLocaleString("ru-Ru")}`;
        // clone.querySelector(".list-group").innerHTML = message.arrayNotify
        //   .map((n) => `<li class="list-group-item">${n}</li>`)
        //   .join("");
        clone.querySelector(".list-group").innerHTML =
          `<li class="list-group-item">${message.text}</li>`;
        fragment.appendChild(clone);
      }
      messageList.replaceChildren(fragment);
    }
    document
      .querySelector(".reset-btn")
      .classList.toggle("d-none", !ChartManager.state.alerts.length);
    document
      .querySelector(".hide-btn")
      .classList.toggle("d-none", !ChartManager.state.alerts.length);
    this.state.bsOffcanvas.hide();
  }
  static initEventListeners() {
    //tabs
    document.querySelectorAll(".tab-link").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        document
          .querySelectorAll(".tab-link")
          .forEach((n) => n.classList.remove("active"));
        e.target.classList.add("active");
        //this.setState({ activeTab: e.target.dataset.tab });
        this.state.activeTab = e.target.dataset.tab;
        await this.loadCoins();
      });
    });
    // Выбор монеты
    document
      .querySelector(".coin-list")
      .addEventListener("click", async (event) => {
        event.preventDefault();
        const item = event.target.closest(".coin-item");
        const add = event.target.classList.contains("add-btn");
        const star = event.target.classList.contains("star-btn");
        const alert = event.target.classList.contains("alert-btn");
        //subs ticker
        if (add) {
          const addBtn = event.target;
          const symbol = addBtn.dataset.symbolTitle;
          const { add } = addBtn.dataset;
          const fieldData = !(add === "true");
          const response = await fetch(`/add/${symbol}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json;charset=utf-8",
            },
            body: JSON.stringify({
              star: fieldData,
            }),
          });
          const resJson = await response.json();
          if (!response.ok) {
            alert(resJson.message);
            return;
          }
          if (resJson.create) {
            addBtn.textContent = `🗑`;
            addBtn.dataset.add = true;
            item.querySelector(".star-btn").classList.remove("d-none");
            item.querySelector(".star-btn").textContent = "🖤";
            item.querySelector(".star-btn").dataset.star = false;
            item.querySelector(".alert-btn").classList.remove("d-none");
            item.querySelector(".alert-btn").textContent = "🔕";
            item.querySelector(".alert-btn").dataset.alert = false;
          } else {
            addBtn.textContent = "➕";
            addBtn.dataset.add = false;
            item.querySelector(".star-btn").classList.add("d-none");
            item.querySelector(".alert-btn").classList.add("d-none");
            document.querySelector(".reset-btn").classList.add("d-none");
            document.querySelector(".hide-btn").classList.add("d-none");
          }
          return;
        }
        if (star) {
          const starBtn = event.target;
          const symbol = starBtn.dataset.symbolTitle;
          const { star } = starBtn.dataset;
          const fieldData = !(star === "true");
          const response = await fetch(`/edit/${symbol}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json;charset=utf-8",
            },
            body: JSON.stringify({
              fieldName: "star",
              fieldData,
            }),
          });
          const resJson = await response.json();
          if (!response.ok) {
            alert(resJson.message);
            return;
          }
          starBtn.dataset.star = fieldData;
          starBtn.innerText = fieldData ? "❤️" : "🖤";
          return;
        }
        if (alert) {
          const alertButton = event.target;
          const symbol = alertButton.dataset.symbolTitle;
          const { alert } = alertButton.dataset;
          const fieldData = !(alert === "true");
          const response = await fetch(`/edit/${symbol}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json;charset=utf-8",
            },
            body: JSON.stringify({
              fieldName: "alert",
              fieldData,
            }),
          });
          const resJson = await response.json();
          if (!response.ok) {
            alert(resJson.message);
            return;
          }
          alertButton.dataset.alert = fieldData;
          alertButton.innerText = fieldData ? "🔔" : "🔕";
          // document
          //   .querySelector(".reset-btn")
          //   .classList.toggle("d-none", !fieldData);
          // document
          //   .querySelector(".hide-btn")
          //   .classList.toggle("d-none", !fieldData);
          this.state.alertBtn = true;
          await this.loadAlerts();
          return;
        }
        if (item) {
          document
            .querySelectorAll(".coin-item")
            .forEach((n) => n.classList.remove("active"));
          item.classList.add("active");
          if (item) {
            //this.setState({ item });
            this.state.item = item;
            this.router.navigate(
              `/chart/${item.dataset.symbol}/${this.state.timeframe}`,
            );
          }
        }
      });

    // Изменение таймфрейма
    document
      .querySelector(".timeframe-select")
      .addEventListener("change", async (event) => {
        //this.setState({ timeframe: event.target.value });
        this.router.navigate(
          `/chart/${this.state.symbol}/${event.target.value}`,
        );
        document
          .querySelectorAll(".tf-btn")
          .forEach((n) => n.classList.remove("bg-primary"));
        document
          .querySelector(`[data-tf="${event.target.value}"]`)
          ?.classList.add("bg-primary");
        // if (this.state.activeTab === "message") {
        //   await this.loadCoins();
        // }
      });
    //short tf
    document.querySelectorAll(".tf-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        document
          .querySelectorAll(".tf-btn")
          .forEach((n) => n.classList.remove("bg-primary"));
        e.target.classList.add("bg-primary");
        const { tf } = event.target.dataset;
        document.querySelector(".timeframe-select").value = tf;
        this.router.navigate(`/chart/${this.state.symbol}/${tf}`);
        // if (this.state.activeTab === "message") {
        //   await this.loadCoins();
        // }
      });
    });
    // Пагинация
    document
      .querySelector(".prev-btn")
      .addEventListener("click", async (event) => {
        event.preventDefault();
        await this.loadCoins("prev", this.state.cursorPrev);
      });
    document
      .querySelector(".next-btn")
      .addEventListener("click", async (event) => {
        event.preventDefault();
        await this.loadCoins("next", this.state.cursorNext);
      });
    //panel
    document
      .querySelector(".panel-show-btn")
      .addEventListener("click", async () => {
        document.querySelector(".panel-symbol").classList.toggle("d-none");
        document.querySelector(".panel-show-btn").classList.toggle("d-none");
      });
    document
      .querySelector(".panel-hide-btn")
      .addEventListener("click", async () => {
        document.querySelector(".panel-symbol").classList.toggle("d-none");
        document.querySelector(".panel-show-btn").classList.toggle("d-none");
      });
    //indicators
    document
      .querySelector(".indicators-btn")
      .addEventListener("click", async (e) => {
        //
        ChartManager.state.hideSr = !ChartManager.state.hideSr;
        e.target.textContent = ChartManager.state.hideSr ? "🚫" : "🟰";
        if (App.state.patternLevel) {
          const { candlesCount, extCount, tolerancePercent, touchCount } =
            App.state.patternLevel;
          Indicators.calculateLevels(
            ChartManager.state.candles,
            candlesCount,
            extCount,
            tolerancePercent,
            touchCount,
          );
        } else {
          Indicators.calculateLevels(ChartManager.state.candles);
        }
      });
    //reset hide info btns
    document.querySelector(".reset-btn").addEventListener("click", async () => {
      await this.loadAlerts(true);
    });
    document.querySelector(".hide-btn").addEventListener("click", async () => {
      this.hideAlerts();
    });
    const chartModalEl = document.getElementById("chartModal");
    chartModalEl.addEventListener("show.bs.modal", async () => {
      const symbol = this.state.symbol;
      //GET /v5/market/tickers
      const responseInfo = await fetch(
        `https://api.bybit.com/v5/market/tickers?category=linear&symbol=${App.state.symbol}`,
      );
      const dataInfo = await responseInfo.json();
      if (dataInfo.retCode !== 0) {
        throw new Error(`Error API: ${dataInfo.retMsg}`);
      }
      const ticker = dataInfo.result.list[0];
      console.log(ticker);
      //set title
      const modalTitle = chartModalEl.querySelector(".modal-title");
      const modalBody = chartModalEl.querySelector(".modal-body");
      modalTitle.textContent = `Ticker ${symbol}`;
      modalBody.innerHTML = `
      <ul class="list-group">
        <li class="list-group-item">turnover24h ${(+ticker.turnover24h).toLocaleString("ru-Ru")}</li>
        <li class="list-group-item">volume24h ${(+ticker.volume24h).toLocaleString("ru-Ru")}</li>
      </ul>
      <div class="list-group">
        <a class="list-group-item list-group-item-action" href="https://www.tradingview.com/chart/8qtrvOgg/?symbol=BYBIT:${symbol}.P" target="_blank">📈 Tradingview chart</a>
        <a class="list-group-item list-group-item-action" href="https://www.coinglass.com/tv/ru/Bybit_${symbol}" target="_blank">📈 Coinglass chart</a>
        <a class="list-group-item list-group-item-action" href="https://www.tradingview.com/symbols/${symbol}/ideas/" target="_blank">🔭 TV Idea</a>
        <a class="list-group-item list-group-item-action" href="https://bybit.onelink.me/EhY6?af_web_dp=https://www.bybit.com/trade/usdt/${symbol}&af_xp=custom&pid=tradegpt&c=tele_share&af_dp=bybitapp://open/home?tab=2&symbol=${symbol}&page=chart&type=usdt&&source=GPT&orderType=Limit&af_force_deeplink=true" target="_blank">📟 Bybit</a>
        <a class="list-group-item list-group-item-action" href="https://t.me/WarsawDevBot?start=${symbol}" target="_blank">@Bot</a>
      </div>`;
    });
  }
}

// Инициализация приложения
App.init();
