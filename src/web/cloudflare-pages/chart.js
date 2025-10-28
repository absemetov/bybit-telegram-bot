class Router {
  constructor() {
    this.router = new window.Navigo("/", true);
    this.initRoutes();
  }

  initRoutes() {
    this.router
      .on({
        "/": async ({ data, params }) => await this.handleRoute(data, params),
        "/:symbol": ({ data }) => {
          this.router.navigate(`/${data.symbol}/1h`);
        },
        "/:symbol/:timeframe": async ({ data, params }) =>
          await this.handleRoute(data, params),
      })
      .resolve();
  }
  async handleRoute(data) {
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
    };
    await App.renderChart();
  }

  navigate(path) {
    this.router.navigate(path);
  }
}

class Indicators {
  //levels
  static state = {
    countLoads: 0,
  };
  static findLevels(candles, touchCount = 4) {
    const max = Math.max(...candles.map((c) => c.high));
    const min = Math.min(...candles.map((c) => c.low));
    let checkPercent = 0;
    const levelsHigh = [];
    const levelsLow = [];
    let crossLine = min;
    do {
      crossLine = crossLine * (1 + checkPercent / 100);
      const touchesLow = candles.filter(
        (candle) =>
          crossLine >= candle.low &&
          crossLine <= candle.low + (candle.high - candle.low) / 2,
      ).length;
      const touchesHigh = candles.filter(
        (candle) =>
          crossLine <= candle.high &&
          crossLine >= candle.high - (candle.high - candle.low) / 2,
      ).length;
      if (touchesLow >= touchCount) {
        levelsLow.push({
          crossLine,
          touchesLow,
        });
      }
      if (touchesHigh >= touchCount) {
        levelsHigh.push({
          crossLine,
          touchesHigh,
        });
      }
      checkPercent += 0.001;
    } while (crossLine <= max);
    const support =
      levelsLow.length > 0 ? Math.min(...levelsLow.map((l) => l.crossLine)) : 0;
    const resistance =
      levelsHigh.length > 0
        ? Math.max(...levelsHigh.map((l) => l.crossLine))
        : 0;
    return { support, resistance };
  }
  static calculateLevels(candles, candlesCount = 20, touchCount = 3) {
    if (ChartManager.state.hideSr) {
      for (const alert of ChartManager.state.levelsArray) {
        alert.line.applyOptions({
          lineVisible: false,
          axisLabelVisible: false,
        });
      }
      return;
    }
    //set markers
    const step = 1;
    const lastIndex = candles.length - step * this.state.countLoads; //not included!!!+1
    const lastCandle = candles[lastIndex - 1];
    const firstIndex =
      candles.length - candlesCount - step * this.state.countLoads;
    const firstCandle = candles[firstIndex];
    if (!firstCandle) {
      return;
    }
    const candlesSlice = candles.slice(firstIndex, lastIndex);
    ChartManager.state.markerSeries.setMarkers([]);
    ChartManager.state.markLevels = [];
    const max = Math.max(...candlesSlice.map((c) => c.high));
    const min = Math.min(...candlesSlice.map((c) => c.low));
    const currentLevels = this.findLevels(candlesSlice, touchCount);
    //const shortLevels = this.findLevels(candlesSlice.slice(-2), 2);
    App.state.support = currentLevels.support;
    App.state.resistance = currentLevels.resistance;
    const currentTime = new Date(lastCandle.time * 1000);
    ChartManager.state.markLevels.push({
      time: firstCandle.time,
      position: firstCandle.high > lastCandle.high ? "aboveBar" : "belowBar",
      color: "black",
      shape: firstCandle.high > lastCandle.high ? "arrowDown" : "arrowUp",
      text: `${currentTime.getDate()}, ${currentTime.toLocaleTimeString()}`,
      //text: `${analysis.marketCondition} (${analysis.strength})`,
    });
    ChartManager.state.markLevels.push({
      time: lastCandle.time,
      position: firstCandle.high < lastCandle.high ? "aboveBar" : "belowBar",
      color: "black",
      shape: firstCandle.high < lastCandle.high ? "arrowDown" : "arrowUp",
    });
    ChartManager.state.markerSeries.setMarkers(ChartManager.state.markLevels);
    ChartManager.state.markerRsi.setMarkers([]);
    ChartManager.state.markRSI = [];
    ChartManager.state.markRSI.push({
      time: firstCandle.time,
      //position: firstCandle.high > lastCandle.high ? "aboveBar" : "belowBar",
      position: "inBar",
      color: "blue",
      //shape: firstCandle.high > lastCandle.high ? "arrowDown" : "arrowUp",
      shape: "circle",
      text: `${ChartManager.state.rsi[firstIndex - 14]?.value.toFixed(1)}`,
    });
    ChartManager.state.markRSI.push({
      time: lastCandle.time,
      //position: firstCandle.high < lastCandle.high ? "aboveBar" : "belowBar",
      position: "inBar",
      color: "blue",
      //shape: firstCandle.high < lastCandle.high ? "arrowDown" : "arrowUp",
      shape: "circle",
      text: `${ChartManager.state.rsi[lastIndex - 14 - 1]?.value.toFixed(1)}`,
    });
    ChartManager.state.markerRsi.setMarkers(ChartManager.state.markRSI);
    //resistance line
    App.state.resistanceMax = App.state.resistance || max;
    ChartManager.state.levelsArray[1].line.applyOptions({
      price: App.state.resistanceMax,
      color: App.state.resistance ? "red" : "black",
      //lineStyle: resistance ? 1 : 2,
      lineVisible: true,
      axisLabelVisible: true,
    });
    //support line
    App.state.supportMin = App.state.support || min;
    ChartManager.state.levelsArray[0].line.applyOptions({
      price: App.state.supportMin,
      color: App.state.support ? "green" : "black",
      //lineStyle: support ? 1 : 2,
      lineVisible: true,
      axisLabelVisible: true,
      title: `${(((App.state.resistanceMax - App.state.supportMin) / App.state.supportMin) * 100).toFixed(2)}%`,
    });
    ChartManager.state.levelsArray[1].line.applyOptions({
      title: "Short",
    });
  }
  //levels
  // RSI для всех свечей
  static calculateRSI(candles, period = 14) {
    if (candles.length < period + 1) return [];
    const results = [];
    let gains = 0;
    let losses = 0;

    // Рассчитываем начальные средние gain/loss
    for (let i = 1; i <= period; i++) {
      const change = candles[i].close - candles[i - 1].close;
      if (change >= 0) gains += change;
      else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    let rsi = 100 - 100 / (1 + rs);
    results.push({
      time: candles[period].time,
      value: rsi,
    });

    // Рассчитываем последующие значения RSI
    for (let i = period + 1; i < candles.length; i++) {
      const change = candles[i].close - candles[i - 1].close;
      let currentGain = 0;
      let currentLoss = 0;

      if (change >= 0) currentGain = change;
      else currentLoss = -change;

      // Сглаживаем средние значения
      avgGain = (avgGain * (period - 1) + currentGain) / period;
      avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi = 100 - 100 / (1 + rs);
      results.push({
        time: candles[i].time,
        value: rsi,
      });
    }

    return results;
  }
  // Вспомогательная функция для расчета EMA
  static calculateEMA(candles, period) {
    if (candles.length < period + 1) return [];
    const k = 2 / (period + 1);
    const emaArray = [];
    let ema =
      candles
        .slice(0, period)
        .reduce(
          (sum, item) => sum + (item.close ? item.close : item.value),
          0,
        ) / period;

    emaArray.push({ time: candles[period - 1].time, value: ema });

    for (let i = period; i < candles.length; i++) {
      ema =
        (candles[i].close ? candles[i].close : candles[i].value) * k +
        ema * (1 - k);
      emaArray.push({ time: candles[i].time, value: ema });
    }

    return emaArray;
  }
  static calculateMACD(
    candles,
    shortPeriod = 12,
    longPeriod = 26,
    signalPeriod = 9,
  ) {
    // Рассчитываем EMA для короткого и длинного периодов
    const shortEMA = Indicators.calculateEMA(candles, shortPeriod);
    const longEMA = Indicators.calculateEMA(candles, longPeriod);

    // Выравниваем массивы EMA по времени
    const macdLine = [];
    for (let i = 0; i < longEMA.length; i++) {
      const longItem = longEMA[i];
      const shortItem = shortEMA.find((s) => s.time === longItem.time);
      if (shortItem) {
        macdLine.push({
          time: longItem.time,
          value: shortItem.value - longItem.value,
        });
      }
    }

    // Рассчитываем сигнальную линию (EMA от MACD)
    const signalLine = Indicators.calculateEMA(macdLine, signalPeriod);

    // Создаем гистограмму с цветами
    const histogram = [];
    for (let i = 0; i < signalLine.length; i++) {
      const macdItem = macdLine[i + signalPeriod - 1]; // Смещение для выравнивания
      const diff = macdItem.value - signalLine[i].value;
      histogram.push({
        time: signalLine[i].time,
        value: diff,
        color: diff >= 0 ? "green" : "red",
      });
    }

    return {
      macdLine,
      signalLine,
      histogram,
    };
  }
}
//LightweightCharts
class ChartManager {
  static state = {
    chart: null,
    candlestickSeries: null,
    volumeSeries: null,
    rsiSeries: null,
    // macdLineSeries: null,
    // signalLineSeries: null,
    // macdHistogramSeries: null,
    candles: [],
    hideSr: false,
    levelsArray: [],
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
        height: document.documentElement.scrollHeight - 80,
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
    //ema 9 21
    ChartManager.state.ema9Series = ChartManager.state.chart.addSeries(
      window.LightweightCharts.LineSeries,
      {
        color: "#FF6D00",
        lineWidth: 1.5,
        priceLineVisible: false,
      },
      0,
    );
    ChartManager.state.ema21Series = ChartManager.state.chart.addSeries(
      window.LightweightCharts.LineSeries,
      {
        color: "blue",
        lineWidth: 1.5,
        priceLineVisible: false,
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
    ChartManager.state.levelsArray = [
      {
        name: "supportLine",
        line: ChartManager.state.candlestickSeries.createPriceLine({
          price: 1,
          color: "green",
          lineWidth: 2,
          lineStyle: 3,
          title: "Long",
          lineVisible: false,
          axisLabelVisible: false,
        }),
      },
      {
        name: "resistanceLine",
        line: ChartManager.state.candlestickSeries.createPriceLine({
          price: 1,
          color: "red",
          lineWidth: 2,
          lineStyle: 3,
          title: "Short",
          lineVisible: false,
          axisLabelVisible: false,
        }),
      },
    ];
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
    ChartManager.state.markerRsi = window.LightweightCharts.createSeriesMarkers(
      ChartManager.state.rsiSeries,
    );
    ChartManager.state.rsiSeriesEMA = ChartManager.state.chart.addSeries(
      window.LightweightCharts.LineSeries,
      {
        color: "blue",
        lineWidth: 2,
        priceLineVisible: false,
      },
      1,
    );
    ChartManager.state.rsiSeries.createPriceLine({
      price: 30,
      color: "green",
      lineWidth: 2,
      lineStyle: 1,
      axisLabelVisible: false,
    });
    ChartManager.state.rsiSeries.createPriceLine({
      price: 50,
      color: "black",
      lineWidth: 2,
      lineStyle: 1,
      axisLabelVisible: false,
    });
    ChartManager.state.rsiSeries.createPriceLine({
      price: 70,
      color: "red",
      lineWidth: 2,
      lineStyle: 1,
      axisLabelVisible: false,
    });
    // ChartManager.state.macdLineSeries = ChartManager.state.chart.addSeries(
    //   window.LightweightCharts.LineSeries,
    //   {
    //     color: "#2962FF",
    //     lineWidth: 1,
    //     priceLineVisible: false,
    //     priceFormat: {
    //       type: "price",
    //       minMove: 0.00001,
    //     },
    //   },
    //   2,
    // );
    // ChartManager.state.signalLineSeries = ChartManager.state.chart.addSeries(
    //   window.LightweightCharts.LineSeries,
    //   {
    //     color: "#FF6D00",
    //     lineWidth: 1,
    //     priceLineVisible: false,
    //     priceFormat: {
    //       type: "price",
    //       //precision: 5,
    //       minMove: 0.00001,
    //     },
    //   },
    //   2,
    // );
    // ChartManager.state.macdHistogramSeries = ChartManager.state.chart.addSeries(
    //   window.LightweightCharts.HistogramSeries,
    //   {
    //     color: "rgba(76, 175, 80, 0.5)",
    //     negativeColor: "rgba(255, 82, 82, 0.5)",
    //     priceLineVisible: false,
    //     priceFormat: {
    //       type: "price",
    //       //precision: 5,
    //       minMove: 0.00001,
    //     },
    //   },
    //   2,
    // );
    ChartManager.state.chart
      .panes()[0]
      .setHeight(document.documentElement.scrollHeight - 300);
    ChartManager.state.chart.subscribeCrosshairMove(this.handleCrosshairMove);
    ChartManager.state.chart.subscribeDblClick(this.handleDblClick);
    //start WS
    this.initEventListeners();
    this.initWebSocket();
  }
  dragAlert() {
    //choose alert
    ChartManager.state.selectedAlert = ChartManager.state.hoveredAlert;
    for (const alert of ChartManager.state.levelsArray) {
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
    ChartManager.state.levelsArray[0].line.applyOptions({
      color: App.state.support ? "green" : "black",
    });
    ChartManager.state.levelsArray[1].line.applyOptions({
      color: App.state.resistance ? "red" : "black",
    });
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
      // ChartManager.state.macdLineSeries.setData([]);
      // ChartManager.state.signalLineSeries.setData([]);
      // ChartManager.state.macdHistogramSeries.setData([]);
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
    ChartManager.state.emaData9 = Indicators.calculateEMA(history, 9);
    ChartManager.state.ema9Series.setData(ChartManager.state.emaData9);
    ChartManager.state.emaData21 = Indicators.calculateEMA(history, 21);
    ChartManager.state.ema21Series.setData(ChartManager.state.emaData21);
    ChartManager.state.volumeSeries.setData(
      history.map((c) => ({
        time: c.time,
        value: c.volume,
        color: c.close > c.open ? "#26A69A" : "#EF5350",
      })),
    );
    // Рассчитываем и отображаем исторические индикаторы
    if (history.length > 14) {
      ChartManager.state.rsi = Indicators.calculateRSI(history);
      ChartManager.state.rsiSeries.setData(ChartManager.state.rsi);
      ChartManager.state.rsiEMA = Indicators.calculateEMA(
        ChartManager.state.rsi,
        14,
      );
      ChartManager.state.rsiSeriesEMA.setData(ChartManager.state.rsiEMA);
    }

    // if (history.length >= 35) {
    //   const macdData = Indicators.calculateMACD(history);
    //   ChartManager.state.macdLineSeries.setData(macdData.macdLine);
    //   ChartManager.state.signalLineSeries.setData(macdData.signalLine);
    //   ChartManager.state.macdHistogramSeries.setData(macdData.histogram);
    // }

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
    ChartManager.state.candlestickSeries.update(newCandle);
    const ema9 = Indicators.calculateEMA(ChartManager.state.candles, 9);
    const ema21 = Indicators.calculateEMA(ChartManager.state.candles, 21);
    ChartManager.state.ema9Series.update(ema9[ema9.length - 1]);
    ChartManager.state.ema21Series.update(ema21[ema21.length - 1]);
    ChartManager.state.volumeSeries.update({
      time: newCandle.time,
      value: newCandle.volume,
      color: newCandle.close > newCandle.open ? "#26A69A" : "#EF5350",
    });
    // Расчет и обновление RSI
    if (ChartManager.state.candles.length > 14) {
      const rsi = Indicators.calculateRSI(ChartManager.state.candles);
      ChartManager.state.rsiSeries.update(rsi[rsi.length - 1]);
      const rsiEma10 = Indicators.calculateEMA(rsi, 10);
      ChartManager.state.rsiSeriesEMA.update(rsiEma10[rsiEma10.length - 1]);
    }

    // // Расчет и обновление MACD
    // if (ChartManager.state.candles.length > 35) {
    //   const macd = Indicators.calculateMACD(ChartManager.state.candles);
    //   ChartManager.state.macdLineSeries.update(
    //     macd.macdLine[macd.macdLine.length - 1],
    //   );
    //   ChartManager.state.signalLineSeries.update(
    //     macd.signalLine[macd.signalLine.length - 1],
    //   );
    //   ChartManager.state.macdHistogramSeries.update(
    //     macd.histogram[macd.histogram.length - 1],
    //   );
    // }
  }
  //dbl clicks
  handleDblClick() {
    ChartManager.state.ema9Series.applyOptions({
      visible: !ChartManager.state.ema9Series.options().visible,
    });
    ChartManager.state.ema21Series.applyOptions({
      visible: !ChartManager.state.ema21Series.options().visible,
    });
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
          ChartManager.state.levelsArray,
        );
      }
    }
    //drag effect
    if (ChartManager.state.isDroped) {
      return;
    }
    for (const alert of ChartManager.state.levelsArray) {
      if (ChartManager.state.selectedAlert === alert.name) {
        alert.line.applyOptions({
          price: ChartManager.state.currentPriceMove,
        });
        const resistance =
          ChartManager.state.levelsArray[1].line.options().price;
        const support = ChartManager.state.levelsArray[0].line.options().price;
        ChartManager.state.levelsArray[0].line.applyOptions({
          title: `${(((resistance - support) / support) * 100).toFixed(2)}%`,
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
  // Функция для обработки нажатий клавиш
  static handleKeyPress(event) {
    // Проверяем, какая клавиша была нажата
    switch (event.key) {
      case "ArrowLeft":
        // Действие при нажатии ←
        ++Indicators.state.countLoads;
        ChartManager.state.chart
          .timeScale()
          .scrollToPosition(-Indicators.state.countLoads + 15);
        // Здесь можно добавить свою логику
        break;
      case "ArrowRight":
        // Действие при нажатии →
        if (Indicators.state.countLoads) {
          --Indicators.state.countLoads;
        }
        ChartManager.state.chart
          .timeScale()
          .scrollToPosition(-Indicators.state.countLoads + 15);
        // Здесь можно добавить свою логику
        break;
    }
    Indicators.calculateLevels(ChartManager.state.candles);
  }
  static initEventListeners() {
    //arrows btn
    // Добавляем слушатель события нажатия клавиш
    document.addEventListener("keydown", this.handleKeyPress);
    //move level
    document.querySelectorAll(".level-move-btn").forEach((btn) => {
      btn.addEventListener("click", async (event) => {
        const { key } = event.target.dataset;
        App.handleKeyPress({ key });
      });
    });
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
        <li class="list-group-item">EMA9 EMA21 RSI14/RSI-EMA14</li>
        <li class="list-group-item">Level 16 candles 1 perc 4 touches</li>
        <li class="list-group-item">turnover24h ${(+ticker.turnover24h).toLocaleString("ru-Ru")}</li>
        <li class="list-group-item">volume24h ${(+ticker.volume24h).toLocaleString("ru-Ru")}</li>
      </ul>
      <div class="list-group">
        <a class="list-group-item list-group-item-action" href="https://www.tradingview.com/chart/?symbol=BYBIT:${symbol}.P" target="_blank">📈 Tradingview chart</a>
        <a class="list-group-item list-group-item-action" href="https://www.coinglass.com/tv/ru/Bybit_${symbol}" target="_blank">📈 Coinglass chart</a>
        <a class="list-group-item list-group-item-action" href="https://www.tradingview.com/symbols/${symbol}/ideas/" target="_blank">🔭 TV Idea</a>
        <a class="list-group-item list-group-item-action" href="https://bybit.onelink.me/EhY6?af_web_dp=https://www.bybit.com/trade/usdt/${symbol}&af_xp=custom&pid=tradegpt&c=tele_share&af_dp=bybitapp://open/home?tab=2&symbol=${symbol}&page=chart&type=usdt&&source=GPT&orderType=Limit&af_force_deeplink=true" target="_blank">📟 Bybit</a>
      </div>`;
    });
  }
}

// Инициализация приложения
App.init();
