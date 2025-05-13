class Router {
  constructor() {
    this.router = new window.Navigo("/", true);
    this.initRoutes();
  }

  initRoutes() {
    this.router
      .on({
        "/": async ({ data, params }) => await this.handleRoute(data, params),
        "/:symbol/:timeframe": async ({ data, params }) =>
          await this.handleRoute(data, params),
      })
      .resolve();
  }
  async handleRoute(data, params) {
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
    App.state = {
      symbol: data?.symbol || "BTCUSDT",
      timeframe: data?.timeframe || "1h",
      intervalKline: intervalKline[data?.timeframe || "1h"],
      markerTime: +params?.time,
      markerPrice: params?.price,
      markerSide: params?.side,
    };
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
    tolerancePercent = 0.05,
    touchCount = 3,
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
      title: `${(((supportV - resistance) / resistance) * 100).toFixed(2)}%`,
    });
    //notify marker
    //first delete lines and markers
    ChartManager.state.markerSeries.setMarkers([]);
    ChartManager.state.markers = [];
    for (const messageLine of ChartManager.state.messages) {
      ChartManager.state.candlestickSeries.removePriceLine(messageLine);
    }
    ChartManager.state.messages = [];
    if (App.state.markerPrice && App.state.markerTime) {
      ChartManager.state.messages.push(
        ChartManager.state.candlestickSeries.createPriceLine({
          price: App.state.markerPrice,
          color: "black",
          lineWidth: 2,
          lineStyle: 1,
          title: "Level",
        }),
      );
      //marker
      ChartManager.state.markers.push({
        time: App.state.markerTime,
        position: App.state.markerSide === "s" ? "belowBar" : "aboveBar",
        color: "black",
        shape: App.state.markerSide === "s" ? "arrowUp" : "arrowDown",
        size: 2,
        //price: App.state.markerPrice,
        text: "Key",
      });
      ChartManager.state.markerSeries.setMarkers(ChartManager.state.markers);
    }
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
    candles: [],
    hideSr: false,
    linesSr: [],
    hoveredAlert: null,
    selectedAlert: null,
    currentPriceMove: null,
    isDroped: true,
    messages: [],
    markers: [],
  };
  constructor() {
    this.container = document.getElementById("chart");
    this.volumeContainer = document.getElementById("volumeEl");
    this.candleContainer = document.getElementById("candleEl");
    this.prevSymbolKlineTopic = null;
    this.ws = new WebSocket("wss://stream.bybit.com/v5/public/linear");
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
    //markers
    ChartManager.state.markerSeries =
      window.LightweightCharts.createSeriesMarkers(
        ChartManager.state.candlestickSeries,
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
    ChartManager.state.chart.subscribeCrosshairMove(this.handleCrosshairMove);
    //start WS
    this.initEventListeners();
    this.initWebSocket();
  }
  dragAlert() {
    //choose alert
    ChartManager.state.selectedAlert = ChartManager.state.hoveredAlert;
    for (const alert of ChartManager.state.linesSr) {
      if (ChartManager.state.selectedAlert === alert.name) {
        ChartManager.state.isDroped = false;
      }
    }
  }
  async dropAlert() {
    ChartManager.state.isDroped = true;
    this.defaultAlerts();
    ChartManager.state.selectedAlert = null;
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
  defaultAlerts() {
    ChartManager.state.linesSr[0].line.applyOptions({ color: "green" });
    ChartManager.state.linesSr[1].line.applyOptions({ color: "red" });
    App.chartManager.container.style.cursor = "default";
    ChartManager.state.chart.applyOptions({
      handleScroll: true,
      handleScale: true,
    });
    ChartManager.state.hoveredAlert = null;
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
        this.dragAlert();
      }
    });

    // Обработчик отпускания кнопки мыши (на весь документ)
    document.addEventListener("mouseup", () => {
      this.dropAlert();
      isMouseDown = false;
    });
    //touch events
    //drag
    this.container.addEventListener("touchmove", () => this.dragAlert());
    //drop
    this.container.addEventListener(
      "touchend",
      async () => await this.dropAlert(),
    );
  }
  async loadChartData() {
    try {
      const response = await fetch(
        `https://api.bybit.com/v5/market/kline?category=linear&symbol=${App.state.symbol}&interval=${App.state.intervalKline}&limit=1000`,
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
    this.sendSubscription(subscribeMsg);
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
      }
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
    //calc Levels
    Indicators.calculateLevels(ChartManager.state.candles);
    document.querySelector(".display-symbol").textContent = App.state.symbol;
    //tf active
    document
      .querySelectorAll(".tf-btn")
      .forEach((n) => n.classList.remove("bg-primary"));
    document
      .querySelector(`[data-tf="${App.state.timeframe}"]`)
      ?.classList.add("bg-primary");
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
    for (const alert of ChartManager.state.linesSr) {
      if (ChartManager.state.selectedAlert === alert.name) {
        alert.line.applyOptions({
          price: ChartManager.state.currentPriceMove,
        });
        const resistance = ChartManager.state.linesSr[1].line.options().price;
        const support = ChartManager.state.linesSr[0].line.options().price;
        ChartManager.state.linesSr[0].line.applyOptions({
          title: `${(((support - resistance) / resistance) * 100).toFixed(2)}%`,
        });
        ChartManager.state.chart.applyOptions({
          handleScroll: false,
          handleScale: false,
        });
        return;
      }
    }
  }
}

class App {
  static state = {
    symbol: "BTCUSDT",
    timeframe: "1h",
  };

  static async init() {
    this.chartManager = new ChartManager();
    this.router = new Router();
    this.initAutocomplete();
    this.initChart();
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
      "YZIFWJVE7R",
      "a56bd432142fc9813846fa737167eeef",
    );
    const recentSearchesPlugin = createLocalStorageRecentSearchesPlugin({
      key: "navbar",
      transformSource({ source }) {
        return {
          ...source,
          onSelect({ item }) {
            const symbol = item.label.toUpperCase();
            App.router.navigate(
              `/${symbol}${symbol.endsWith("USDT") ? "" : "USDT"}/${App.state.timeframe}`,
            );
          },
        };
      },
    });
    autocomplete({
      debug: false,
      container: "#autocomplete",
      placeholder: "Search cryptocurrencies...",
      detachedMediaQuery: "(max-width: 991.98px)",
      openOnFocus: true,
      plugins: [recentSearchesPlugin],
      onSubmit({ state }) {
        const symbol = state.query.toUpperCase();
        if (symbol) {
          App.router.navigate(
            `/${symbol}${symbol.endsWith("USDT") ? "" : "USDT"}/${App.state.timeframe}`,
          );
        }
      },
      getSources() {
        return [
          {
            sourceId: "crypto",
            getItemInputValue: ({ item }) => item.name,
            getItems({ query }) {
              return getAlgoliaResults({
                searchClient,
                queries: [
                  {
                    indexName: "crypto",
                    params: {
                      query,
                      hitsPerPage: 4,
                      attributesToRetrieve: [
                        "exactMatch",
                        "name",
                        "textPart",
                        "keywords",
                      ],
                      restrictSearchableAttributes: [
                        "exactMatch",
                        "name",
                        "textPart",
                        "keywords",
                      ],
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
                          attribute: "name",
                        })}
                      </div>
                    </div>
                  </div>
                </div>`;
              },
            },
            onSelect({ item }) {
              recentSearchesPlugin.data.addItem({
                id: item.name,
                label: item.name,
              });
              const symbol = item.name.toUpperCase();
              App.router.navigate(
                `/${symbol}${symbol.endsWith("USDT") ? "" : "USDT"}/${App.state.timeframe}`,
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
  static async renderChart() {
    await this.chartManager.loadChartData();
  }
  static initEventListeners() {
    //short tf
    document.querySelectorAll(".tf-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        document
          .querySelectorAll(".tf-btn")
          .forEach((n) => n.classList.remove("bg-primary"));
        e.target.classList.add("bg-primary");
        const { tf } = event.target.dataset;
        this.router.navigate(`/${this.state.symbol}/${tf}`);
      });
    });
    //indicators
    document
      .querySelector(".indicators-btn")
      .addEventListener("click", async (e) => {
        //
        ChartManager.state.hideSr = !ChartManager.state.hideSr;
        e.target.textContent = ChartManager.state.hideSr ? "🚫" : "🟰";
        Indicators.calculateLevels(ChartManager.state.candles);
      });
    // info modal
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
