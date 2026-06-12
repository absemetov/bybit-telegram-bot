import { Templates } from "@js/generated/templates.js";
import Handlebars from "handlebars/runtime";
import {
  createChart,
  CandlestickSeries,
  createSeriesMarkers,
  HistogramSeries,
  CrosshairMode,
} from "lightweight-charts";

export class Chart {
  constructor(app) {
    this.app = app;
    this.intervalBybit = {
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
    this.isDroped = true;
    this.flagTriggers = true;
    this.flagLevels = false;
    this.flagPositions = true;
    this.candles = [];
    this.templates = {
      chartTemplate: Templates["widgets/chart"],
      algotradingSettingsTemplate: Templates["modals/algo-trading"],
    };
  }
  init() {
    this.app.on("dashboardReady", () => this.mountWidget());
    this.app.on("symbolChanged", (symbol) =>
      this.load(symbol, this.app.state.get("timeframe")),
    );
    this.app.on("kline:update", (data) => {
      this.updateRealtimeCandle(data);
    });
  }
  mountWidget() {
    this.destroy();
    console.log("[Chart:mountWidget]");
    this.container = document.getElementById("chartWidgetContainer");
    const { symbol, isAuth } = this.app.state.get();
    this.container.innerHTML = this.templates.chartTemplate({
      symbol,
      isAuth,
    });
    this.mount();
  }
  async mount() {
    this.chartContainer = document.getElementById("chart");
    this.containerBody = document.getElementById("chartBody");
    this.containerRect = this.containerBody.getBoundingClientRect();
    this.candleContainer = document.getElementById("candle-info");
    this.chart = createChart(this.chartContainer, {
      height: this.containerRect.height,
      layout: {
        textColor: "black",
        background: { type: "solid", color: "white" },
        panes: {
          separatorColor: "rgba(55, 198, 241, 0.97)",
          separatorHoverColor: "rgba(155, 185, 180, 0.97)",
          enableResize: true,
        },
      },
      timeScale: {
        timeVisible: true,
      },
      localization: {
        timeFormatter: (timestamp) => {
          const date = new Date(timestamp * 1000);
          return `${date.toLocaleDateString("ru-RU")}, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
    });
    this.candlestickSeries = this.chart.addSeries(
      CandlestickSeries,
      {
        priceFormat: {
          type: "price",
          precision: 2,
          minMove: 0.01,
        },
      },
      0,
    );
    this.candlestickSeries.priceScale().applyOptions({
      autoScale: true,
      scaleMargins: {
        top: 0.1,
        bottom: 0.15,
      },
    });
    this.markerSeries = createSeriesMarkers(this.candlestickSeries);
    this.volumeSeries = this.chart.addSeries(
      HistogramSeries,
      {
        priceFormat: { type: "volume" },
        priceScaleId: "",
      },
      0,
    );
    this.volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    //priceLines
    this.levelsLines = {
      support: this.candlestickSeries.createPriceLine({
        price: 1,
        color: "green",
        lineWidth: 2,
        lineStyle: 3,
        title: "Long",
        lineVisible: false,
        axisLabelVisible: false,
      }),
      resistance: this.candlestickSeries.createPriceLine({
        price: 1,
        color: "red",
        lineWidth: 2,
        lineStyle: 3,
        title: "Short",
        lineVisible: false,
        axisLabelVisible: false,
      }),
    };
    //price lines fir triggers
    this.triggersLines = {
      1: this.candlestickSeries.createPriceLine({
        price: 1,
        color: "green",
        lineWidth: 2,
        lineStyle: 1,
        lineVisible: false,
        axisLabelVisible: false,
      }),
      2: this.candlestickSeries.createPriceLine({
        price: 1,
        color: "green",
        lineWidth: 2,
        lineStyle: 1,
        lineVisible: false,
        axisLabelVisible: false,
      }),
      3: this.candlestickSeries.createPriceLine({
        price: 1,
        color: "green",
        lineWidth: 2,
        lineStyle: 1,
        lineVisible: false,
        axisLabelVisible: false,
      }),
    };
    //price lines for position
    this.positionLines = {
      sl: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "red",
        lineWidth: 2,
        lineStyle: 3,
        lineVisible: false,
        axisLabelVisible: false,
      }),
      enter: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "green",
        lineWidth: 2,
        lineStyle: 3,
        lineVisible: false,
        axisLabelVisible: false,
      }),
      tp: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "green",
        lineWidth: 2,
        lineStyle: 3,
        lineVisible: false,
        axisLabelVisible: false,
      }),
      part: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "green",
        lineWidth: 2,
        lineStyle: 0,
        lineVisible: false,
        axisLabelVisible: false,
      }),
      stop0: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "green",
        lineWidth: 2,
        lineStyle: 0,
        lineVisible: false,
        axisLabelVisible: false,
      }),
      stop1: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "green",
        lineWidth: 2,
        lineStyle: 0,
        lineVisible: false,
        axisLabelVisible: false,
      }),
      stop2: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "green",
        lineWidth: 2,
        lineStyle: 0,
        lineVisible: false,
        axisLabelVisible: false,
      }),
    };
    //simulator lines
    this.longLines = {
      enter1: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "black",
        lineWidth: 2,
        lineStyle: 1,
        lineVisible: false,
        axisLabelVisible: false,
        title: "Long",
      }),
      enter2: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "black",
        lineWidth: 2,
        lineStyle: 1,
        lineVisible: false,
        axisLabelVisible: false,
        title: "Long",
      }),
      enter3: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "black",
        lineWidth: 2,
        lineStyle: 1,
        lineVisible: false,
        axisLabelVisible: false,
        title: "Long",
      }),
      sl: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "black",
        lineWidth: 2,
        lineStyle: 0,
        lineVisible: false,
        axisLabelVisible: false,
      }),
      part: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "black",
        lineWidth: 2,
        lineStyle: 2,
        lineVisible: false,
        axisLabelVisible: false,
      }),
      tp: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "black",
        lineWidth: 2,
        lineStyle: 3,
        lineVisible: false,
        axisLabelVisible: false,
      }),
    };
    this.shortLines = {
      enter1: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "black",
        lineWidth: 2,
        lineStyle: 1,
        lineVisible: false,
        axisLabelVisible: false,
        title: "Short",
      }),
      enter2: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "black",
        lineWidth: 2,
        lineStyle: 1,
        lineVisible: false,
        axisLabelVisible: false,
        title: "Short",
      }),
      enter3: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "black",
        lineWidth: 2,
        lineStyle: 1,
        lineVisible: false,
        axisLabelVisible: false,
        title: "Short",
      }),
      sl: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "black",
        lineWidth: 2,
        lineStyle: 0,
        lineVisible: false,
        axisLabelVisible: false,
      }),
      part: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "black",
        lineWidth: 2,
        lineStyle: 2,
        lineVisible: false,
        axisLabelVisible: false,
      }),
      tp: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "black",
        lineWidth: 2,
        lineStyle: 3,
        lineVisible: false,
        axisLabelVisible: false,
      }),
    };
    //drug and drop lines
    this.dragLines = {
      support: this.levelsLines["support"],
      resistance: this.levelsLines["resistance"],
      sl: this.positionLines["sl"],
      tp: this.positionLines["tp"],
      part: this.positionLines["part"],
      simSlLong: this.longLines["sl"],
      simTpLong: this.longLines["tp"],
      simPartLong: this.longLines["part"],
      simSlShort: this.shortLines["sl"],
      simTpShort: this.shortLines["tp"],
      simPartShort: this.shortLines["part"],
    };
    //this.chart.subscribeClick(() => this.defaultLines());
    //use arrow functions
    this.chart.subscribeCrosshairMove((param) => {
      this.handleCrosshairMove(param);
    });
    this.chart.subscribeDblClick(() => {
      const candlesCount = this.app.state.get("algoSettings.candlesCount") || 5;
      const touchCount = this.app.state.get("algoSettings.touchCount") || 3;
      if (this.app.state.get("chartMode") == "live")
        this.updateIndicators(this.candles, candlesCount, touchCount);
      this.visibleLevels(!this.flagLevels);
    });
    //mouse events
    this.initEventListeners();
    window.addEventListener("resize", () => {
      this.chart?.applyOptions({ width: this.containerRect.width });
      this.chart?.applyOptions({ height: this.containerRect.height });
    });
    console.log("emit[Chart:ready]");
    this.app.emit("chart:ready");
  }
  async load(symbol, timeframe) {
    this.app.state.set("chartMode", "live");
    document.querySelector(`[data-bind="symbol"]`).textContent = symbol;
    const data = await this.app
      .get("api")
      .get(
        `https://api.bybit.com/v5/market/instruments-info?category=linear&symbol=${symbol}`,
      );
    if (data.retCode !== 0) {
      alert(`Error API: ${data.retMsg}`);
      throw new Error(`Error API: ${data.retMsg}`);
    }
    const instrument = data.result.list[0];
    if (instrument.status !== "Trading") {
      throw new Error(`Error API instrument.status: ${instrument.status}`);
    }
    const {
      priceFilter: { tickSize },
      priceScale,
    } = instrument;
    this.app.state.set("priceScale", priceScale);
    this.candlestickSeries.applyOptions({
      priceFormat: {
        type: "price",
        precision: priceScale,
        minMove: tickSize,
      },
    });
    //get candles
    this.candles = await this.getCandles(symbol, timeframe);
    //set data
    this.setChartData(this.candles);

    //get ticker data
    if (this.app.state.get("isAuth")) {
      await this.loadTickerData(symbol);
    }
    //calc Indicators
    const candlesCount = this.app.state.get("algoSettings.candlesCount") || 8;
    const touchCount = this.app.state.get("algoSettings.touchCount") || 3;
    this.updateIndicators(this.candles, candlesCount, touchCount);
    this.visibleLevels(false);
    console.log(`[chart:render ${symbol}]`);
    this.app.emit("chart:loadedSymbol", symbol);
  }
  setChartData(candles) {
    this.candlestickSeries.setData([]);
    this.volumeSeries.setData([]);
    this.candlestickSeries.setData(candles);
    this.volumeSeries.setData(
      candles.map((c) => ({
        time: c.time,
        value: c.volume,
        color: c.close > c.open ? "#26A69A" : "#EF5350",
      })),
    );
    this.candlestickSeries.priceScale().applyOptions({
      autoScale: true,
    });
    this.chart.timeScale().scrollToPosition(11);
  }
  async loadTickerData(symbol) {
    this.updateAlgoPanel(null);
    this.visiblePositions(false);
    this.visibleTriggers(false);
    this.app.get("simulator").closeAllPositions();
    this.app.get("simulator").updateSimilatorPanel();
    this.markerSeries.setMarkers([]);
    this.position = null;
    //load ticker data algo-trading
    const tickerData = await this.getTickerInfo(symbol);
    this.app.state.set("tickerData", tickerData);
    const tickerInfo = await this.app.get("api").post(`/api/${symbol}/info`);
    if (!tickerInfo) return;
    const {
      sl = -1,
      slOpen = -1,
      tp = 3,
      size = 1000,
      attemptsCount = -1,
      breakeven = 0,
      trailing = 0,
      part = 0,
      candlesCount = 8,
      touchCount = 3,
      tolerance = 0.2,
    } = tickerInfo?.algoSettings || {};
    this.app.state.set("algoSettings", {
      sl,
      slOpen,
      tp,
      size,
      attemptsCount,
      breakeven,
      trailing,
      part,
      candlesCount,
      touchCount,
      tolerance,
      balance: tickerInfo?.balance || 0,
    });
    this.updateAlgoPanel(this.app.state.get("algoSettings"));
    //show triggers
    this.showTriggers(tickerInfo?.triggers);
    this.showPositions(
      tickerInfo.positions,
      tickerInfo.partOrders,
      tickerInfo.stopOrders,
    );
  }
  updateAlgoPanel(algoSettings) {
    if (!this.container) return;
    const panels = this.container.querySelectorAll(".algo-panel");
    if (!panels.length) return;

    if (algoSettings) {
      panels.forEach((panel) => {
        panel.innerHTML = `
          <div class="d-flex justify-content-start algo-info">
            <div class="btn-group btn-group-sm">
              <button class="btn btn-sm" data-action="setTriggers">🪮</button>
              <button class="btn btn-sm" data-action="openAlgoSettings">${Handlebars.helpers.tradingIcon(algoSettings)}</button>
            </div>
          </div>
        `;
      });
    } else {
      panels.forEach((panel) => {
        panel.innerHTML = "";
      });
    }
  }
  initEventListeners() {
    let isMouseDown = false;
    this.chartContainer.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        isMouseDown = true;
        e.preventDefault();
      }
    });
    this.chartContainer.addEventListener("mousemove", () => {
      if (isMouseDown) {
        this.dragLine();
      }
    });
    this.chartContainer.addEventListener("mouseup", () => {
      this.dropLine();
      isMouseDown = false;
    });
    //touch events
    //drag
    this.chartContainer.addEventListener("touchmove", () => this.dragLine());
    //drop
    this.chartContainer.addEventListener(
      "touchend",
      async () => await this.dropLine(),
    );
    //attachWidgetEvents
    this.container.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === "setTriggers") await this.setTriggers();
      if (action === "openAlgoSettings") {
        this.showAlgotradingSettingsModal();
      }
      if (action === "triggersToggle") {
        this.visibleTriggers(!this.flagTriggers);
      }
      if (action === "levelsToggle") {
        this.visibleLevels(!this.flagLevels);
      }
      if (action === "positionsToggle") {
        this.visiblePositions(!this.flagPositions);
      }
      //simulator
      if (action === "startSimulator") {
        this.app.get("simulator").start();
      }
      if (action === "stopSimulator") {
        this.app.get("simulator").stop();
      }
      if (action === "openSimulatorSettings") {
        this.app.get("simulator").showSimulatorSettingsModal();
      }
      if (action === "resetSimulator") {
        this.app.get("simulator").close();
      }
      if (action === "closeAll") {
        this.app.get("simulator").closeAllPositions();
      }
      if (action === "openSimulatorLong") {
        this.app.get("simulator").showOpenOrderModal("Long");
      }
      if (action === "openSimulatorShort") {
        this.app.get("simulator").showOpenOrderModal("Short");
      }
      if (action === "tickSimulator") {
        this.app.get("simulator").tick();
      }
      if (action === "deleteCandleSimulator") {
        this.app.get("simulator").removeLastCandle();
      }
    });
    //change timeframe
    this.container
      .querySelector(".tf-select")
      .addEventListener("change", async (e) => {
        const tf = e.target.value;
        this.app.state.set("timeframe", tf);
        e.target.blur();
        await this.load(
          this.app.state.get("symbol"),
          this.app.state.get("timeframe"),
        );
        this.container
          .querySelectorAll("[data-tf]")
          .forEach((n) => n.classList.remove("bg-success"));
        document
          .querySelector(`[data-tf="${tf}"]`)
          ?.classList.add("bg-success");
      });
    this.container.querySelectorAll("[data-tf]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        this.container
          .querySelectorAll("[data-tf]")
          .forEach((b) => b.classList.remove("bg-success"));
        btn.classList.add("bg-success");
        const { tf } = btn.dataset;
        this.container.querySelector(".tf-select").value = tf;
        this.app.state.set("timeframe", tf);
        await this.load(
          this.app.state.get("symbol"),
          this.app.state.get("timeframe"),
        );
      });
    });
  }
  async setTriggers() {
    if (this.app.state.get("chartMode") == "simulator") return;
    const { support, resistance } = this.levelsLines;
    const tolerance = this.app.state.get("algoSettings.tolerance") || 0.1;
    const data = {
      support: support.options().price,
      resistance: resistance.options().price,
      tolerance,
      user: this.app.state.get("bybitUser"),
    };
    try {
      const res = await this.app
        .get("api")
        .post(`/api/${this.app.state.get("symbol")}/triggers/set`, data);
      this.showTriggers(res);
    } catch (err) {
      alert(err);
    }
  }
  visibleTriggers(visible) {
    this.flagTriggers = visible;
    Object.values(this.triggersLines).forEach((item) => {
      item.applyOptions({
        lineVisible: visible,
      });
    });
  }
  showTriggers(triggers) {
    this.visiblePositions(false);
    this.flagTriggers = true;
    for (const [name, triiger] of Object.entries(triggers || {})) {
      const color =
        this.app.state.get("bybitUser") === "main" ? "green" : "red";
      this.triggersLines[name].applyOptions({
        price: triiger.price,
        lineVisible: true,
        lineStyle: triiger.active ? 1 : 0,
        color,
      });
    }
  }
  //new visible
  visiblePositions(visible) {
    this.flagPositions = visible;
    Object.values(this.positionLines).forEach((item) => {
      item.applyOptions({
        lineVisible: visible,
        axisLabelVisible: visible,
      });
    });
  }
  showPositions(positions, partOrders, stopOrders) {
    for (const position of positions) {
      const { avgPrice, unrealisedPnl, stopLoss, takeProfit, side } = position;
      this.position = position;
      this.flagPositions = true;
      this.positionLines["enter"].applyOptions({
        price: avgPrice,
        lineVisible: true,
        axisLabelVisible: true,
        title: `${side === "Buy" ? "Long" : "Short"}: ${unrealisedPnl.toFixed(1)}$`,
        color: this.app.state.get("bybitUser") === "main" ? "green" : "red",
      });
      const slPercent = ((stopLoss - avgPrice) / avgPrice) * 100;
      this.positionLines["sl"].applyOptions({
        price: stopLoss,
        title: `SL:${slPercent.toFixed(2)}%`,
        lineVisible: true,
        axisLabelVisible: true,
      });
      const tpPercent = ((takeProfit - avgPrice) / avgPrice) * 100;
      this.positionLines["tp"].applyOptions({
        price: position.takeProfit,
        title: `TP:${tpPercent.toFixed(2)}%`,
        lineVisible: true,
        axisLabelVisible: true,
        color: this.app.state.get("bybitUser") === "main" ? "green" : "red",
      });
    }
    for (const partOrder of partOrders) {
      const { price } = partOrder;
      const { avgPrice } = this.position;
      const tpPercent = ((price - avgPrice) / avgPrice) * 100;
      this.positionLines["part"].applyOptions({
        price,
        title: `Part:${tpPercent.toFixed(2)}%`,
        lineVisible: true,
        axisLabelVisible: true,
        color: this.app.state.get("bybitUser") === "main" ? "green" : "red",
      });
    }
    for (const [index, stopLimitOrder] of stopOrders.entries()) {
      const { price, qty } = stopLimitOrder;
      this.positionLines[`stop${index}`].applyOptions({
        price,
        title: `Order:${(price * qty).toFixed(2)}$`,
        lineVisible: true,
        axisLabelVisible: true,
        color: this.app.state.get("bybitUser") === "main" ? "green" : "red",
      });
    }
  }
  updateIndicators(candles, candlesCount, touchCount) {
    if (candles.length === 0) return;
    const { support, resistance, min, max } = this.app
      .get("indicators")
      .calculateLevels(candles, candlesCount, touchCount);
    const sPrice = support || min;
    const rPrice = resistance || max;
    this.levelsLines["support"].applyOptions({
      price: sPrice,
      color: support ? "green" : "black",
      title: `▲ ${(((sPrice - rPrice) / rPrice) * 100).toFixed(2)}%`,
    });
    this.levelsLines["resistance"].applyOptions({
      price: rPrice,
      color: resistance ? "red" : "black",
      title: `▼ ${(((rPrice - sPrice) / sPrice) * 100).toFixed(2)}%`,
    });
  }
  visibleLevels(visible) {
    this.flagLevels = visible;
    for (const line of Object.values(this.levelsLines)) {
      line.applyOptions({
        lineVisible: visible,
        axisLabelVisible: visible,
      });
    }
  }
  //cross events
  handleCrosshairMove(param) {
    if (!param.point) return;
    //volume values and candle changes
    const candle = param.seriesData.get(this.candlestickSeries);
    //update volume
    if (param.time && candle) {
      const datapoints = param.seriesData.get(this.volumeSeries);
      if (datapoints) {
        const candlesCount =
          this.app.state.get("algoSettings.candlesCount") || 5;
        const touchCount = this.app.state.get("algoSettings.touchCount") || 3;
        document.querySelector(`[data-bind="candleInfo"]`).textContent =
          `${this.volumeSeries.priceFormatter().format(datapoints.value)}
        (${
          candle.close > candle.open
            ? `+${(((candle.high - candle.low) / candle.low) * 100).toFixed(2)}`
            : `${(((candle.low - candle.high) / candle.high) * 100).toFixed(2)}`
        }%) [${candlesCount}, ${touchCount}]`;
      }
    }
    //drag and drop priceLines
    if (this.candlestickSeries) {
      this.currentPriceMove = this.candlestickSeries.coordinateToPrice(
        param.point.y,
      );
      if (this.currentPriceMove > 0) {
        this.checkHover(param.point.y, this.dragLines);
      }
    }
    if (this.isDroped) {
      return;
    }
    for (const [name, line] of Object.entries(this.dragLines)) {
      if (this.selectedLine === name) {
        line.applyOptions({
          price: this.currentPriceMove,
        });
        if (["tp", "sl", "part"].includes(this.selectedLine)) {
          const enter = this.positionLines["enter"].options().price;
          const tp = this.positionLines["tp"].options().price;
          const part = this.positionLines["part"].options().price;
          const sl = this.positionLines["sl"].options().price;
          this.positionLines["tp"].applyOptions({
            title: `tp${(((tp - enter) / enter) * 100).toFixed(2)}%`,
          });
          this.positionLines["part"].applyOptions({
            title: `part${(((part - enter) / enter) * 100).toFixed(2)}%`,
          });
          this.positionLines["sl"].applyOptions({
            title: `sl${(((sl - enter) / enter) * 100).toFixed(2)}%`,
          });
        }
        if (["resistance", "support"].includes(this.selectedLine)) {
          const resistance = this.levelsLines["resistance"].options().price;
          const support = this.levelsLines["support"].options().price;
          this.levelsLines["support"].applyOptions({
            title: `▲ ${(((support - resistance) / resistance) * 100).toFixed(2)}%`,
          });
          this.levelsLines["resistance"].applyOptions({
            title: `▼ ${(((resistance - support) / support) * 100).toFixed(2)}%`,
          });
        }
        if (
          ["simTpLong", "simPartLong", "simSlLong"].includes(this.selectedLine)
        ) {
          const enter = this.longLines["enter1"].options().price;
          const tp = this.longLines["tp"].options().price;
          const part = this.longLines["part"].options().price;
          const sl = this.longLines["sl"].options().price;
          this.longLines["tp"].applyOptions({
            title: `LT${(((tp - enter) / enter) * 100).toFixed(2)}%`,
          });
          this.longLines["part"].applyOptions({
            title: `LP${(((part - enter) / enter) * 100).toFixed(2)}%`,
          });
          this.longLines["sl"].applyOptions({
            title: `LS${(((sl - enter) / enter) * 100).toFixed(2)}%`,
          });
        }
        if (
          ["simTpShort", "simPartShort", "simSlShort"].includes(
            this.selectedLine,
          )
        ) {
          const enter = this.shortLines["enter1"].options().price;
          const tp = this.shortLines["tp"].options().price;
          const part = this.shortLines["part"].options().price;
          const sl = this.shortLines["sl"].options().price;
          this.shortLines["tp"].applyOptions({
            title: `ST${(((tp - enter) / enter) * -1 * 100).toFixed(2)}%`,
          });
          this.shortLines["part"].applyOptions({
            title: `SP${(((part - enter) / enter) * -1 * 100).toFixed(2)}%`,
          });
          this.shortLines["sl"].applyOptions({
            title: `SS${(((sl - enter) / enter) * -1 * 100).toFixed(2)}%`,
          });
        }
        this.chart.applyOptions({
          handleScroll: false,
          handleScale: false,
        });
        return;
      }
    }
  }
  checkHover(cursorY, lines) {
    if (this.isDroped) {
      for (const [name, line] of Object.entries(lines)) {
        let minDistance = Infinity;
        const PIXEL_TOLERANCE = 3;
        const lineY = this.candlestickSeries.priceToCoordinate(
          line.options().price,
        );
        const distance = Math.abs(lineY - cursorY);
        const isLineHover =
          name &&
          line.options().lineVisible &&
          line.options().price &&
          distance < minDistance &&
          distance <= PIXEL_TOLERANCE;
        if (isLineHover) {
          minDistance = distance;
          //set name hover
          this.hoveredLine = name;
          // line.applyOptions({
          //   color: "orange",
          // });
          this.container.style.cursor = "pointer";
          return true;
        }
      }
      this.defaultLines();
    }
  }
  async findAvailableEndpoint() {
    const CANDIDATES = [
      "https://api.bybit.com",
      "https://api.bytick.com",
      "https://api.bybit.nl",
      "https://api.bybit.tr",
      "https://api.bybit.kz",
      "https://api.bybitgeorgia.ge",
      "https://api.bybit.ae",
      "https://api.bybit.eu",
      "https://api.bybit.id",
    ];
    for (const url of CANDIDATES) {
      try {
        const res = await fetch(url + "/v5/market/time", { mode: "no-cors" });
        if (res.ok || res.type === "opaque") return url;
      } catch {
        //
      }
    }
    throw new Error("Все эндпоинты Bybit недоступны");
  }
  async getCandles(symbol, timeframe, start, end, limit = 1000) {
    const endPoint = await this.findAvailableEndpoint();
    const data = await this.app
      .get("api")
      .get(
        `${endPoint}/v5/market/kline?category=linear&symbol=${symbol}&interval=${this.intervalBybit[timeframe]}&limit=${limit}${start ? `&start=${start}` : ""}${end ? `&end=${end}` : ""}`,
      );
    return data.result.list.reverse().map((candle) => ({
      time: parseInt(candle[0]) / 1000,
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5]),
    }));
  }
  dragLine() {
    this.selectedLine = this.hoveredLine;
    this.dragStart(this.dragLines);
  }
  dragStart(lines) {
    for (const name of Object.keys(lines)) {
      if (this.selectedLine === name) {
        this.isDroped = false;
      }
    }
  }
  async dropLine() {
    this.isDroped = true;
    //save position settings deprecated
    const lineName = this.selectedLine;
    this.selectedLine = null;
    //real position edit lines
    if (["tp", "sl", "part"].includes(lineName)) {
      const enter = this.positionLines["enter"].options().price;
      const tp = this.positionLines["tp"].options().price;
      const part = this.positionLines["part"].options().price;
      const sl = this.positionLines["sl"].options().price;
      let newSl = ((sl - enter) / enter) * 100;
      const slMax = -1.5;
      const { side } = this.position;
      const saveParams = {};
      const tpPercent = Math.abs((((tp - enter) / enter) * 100).toFixed(2));
      saveParams.tp = tpPercent;
      this.app.state.set("algoSettings.tp", tpPercent);
      if (part > 0) {
        const tpPart = Math.abs((((part - enter) / enter) * 100).toFixed(2));
        saveParams.part = tpPart;
        this.app.state.set("algoSettings.part", tpPart);
      }
      if (side === "Buy") {
        if (newSl > slMax) {
          this.app.state.set("algoSettings.sl", newSl.toFixed(2));
        } else {
          this.positionLines["sl"].applyOptions({
            price: enter * (1 + slMax / 100),
            title: `LS${slMax}%!`,
          });
          newSl = slMax;
          this.app.state.set("algoSettings.sl", slMax);
        }
      }
      if (side === "Sell") {
        newSl = newSl * -1;
        if (newSl > slMax) {
          this.app.state.set("algoSettings.sl", newSl.toFixed(2));
        } else {
          this.positionLines["sl"].applyOptions({
            price: enter * (1 - slMax / 100),
            title: `LS${slMax}%!`,
          });
          newSl = slMax;
          this.app.state.set("algoSettings.sl", slMax);
        }
      }
      saveParams.sl = +newSl.toFixed(2);
      //save api
      try {
        const { symbol, priceScale } = this.app.state.get();
        saveParams.priceScale = priceScale;
        await this.app
          .get("api")
          .post(`/api/algo-trading/${symbol}/edit/${lineName}`, saveParams);
      } catch (err) {
        alert(err.message || "Ошибка сохранения настроек");
      }
    }
    this.defaultLines();
  }
  updateRealtimeCandle(data) {
    const newCandle = data.kline;
    if (data.symbol !== this.app.state.get("symbol")) return;
    const prevCandle = this.candles[this.candles.length - 1];
    if (!prevCandle) return;
    if (newCandle.time !== prevCandle.time) {
      this.candles.push(newCandle);
    } else {
      this.candles[this.candles.length - 1] = newCandle;
    }
    //Simulator TODO
    //if (this.app.get("simulator").state === "idle") {
    this.candlestickSeries.update(newCandle);
    this.volumeSeries.update({
      time: newCandle.time,
      value: newCandle.volume,
      color: newCandle.close > newCandle.open ? "#26A69A" : "#EF5350",
    });
    //}
    //positions
    if (this.position) {
      const { avgPrice, size, side } = this.position;
      const pnl =
        size * (newCandle.close - avgPrice) * (side === "Buy" ? 1 : -1);
      const pnlPercent =
        ((newCandle.close - avgPrice) / avgPrice) *
        100 *
        (side === "Buy" ? 1 : -1);
      this.positionLines["enter"].applyOptions({
        title: `${side === "Buy" ? "Long" : "Short"} ${pnl.toFixed(1)}$ (${pnlPercent.toFixed(1)}%)`,
      });
    }
  }
  defaultLines() {
    // this.positionLines["tp"].applyOptions({
    //   color: "green",
    // });
    // this.positionLines["sl"].applyOptions({
    //   color: "red",
    // });
    // //todo
    // this.levelsLines["support"].applyOptions({
    //   color: "green",
    // });
    // this.levelsLines["resistance"].applyOptions({
    //   color: "red",
    // });
    this.container.style.cursor = "default";
    this.chart.applyOptions({
      handleScroll: true,
      handleScale: true,
    });
    this.hoveredLine = null;
  }
  showAlgotradingSettingsModal() {
    const { symbol, algoSettings, priceScale, tickerData } =
      this.app.state.get();
    const { balance } = algoSettings;
    const modal = this.app.get("modal");
    const attemptsList = [
      { value: 6, name: "🔔 Alert on" },
      { value: -1, name: "🔴 off AlgoTrading" },
      { value: 0, name: "🟠 Check positions" },
      { value: 1, name: "1 attempt" },
      { value: 2, name: "2 attempts" },
      { value: 3, name: "3 attempts" },
      { value: 4, name: "4 attempts" },
      { value: 5, name: "5 attempts" },
    ].map((el) => {
      if (el.value === algoSettings.attemptsCount) {
        el.selected = true;
      } else {
        el.selected = false;
      }
      return el;
    });
    modal.show({
      title: `Алготрейдинг – ${symbol} ($${balance.toFixed(1)})`,
      body: this.templates.algotradingSettingsTemplate({
        attemptsList,
        ...algoSettings,
        fundingRate: tickerData.fundingRate,
        countDownTime: tickerData.countDownTime,
      }),
      size: "md",
      actions: {
        buttons: [
          { text: "Отмена", class: "btn-secondary", dismiss: true },
          { text: "Сохранить", class: "btn-primary", action: "submit" },
        ],
        onAction: async (action) => {
          if (action === "submit") {
            const form = document.querySelector("#algotradingForm");
            const isValid = form.checkValidity();
            if (isValid) {
              const data = new FormData(form);
              const newSettings = {
                tp: parseFloat(data.get("tp")),
                sl: parseFloat(data.get("sl")),
                slOpen: parseFloat(data.get("slOpen")),
                size: parseFloat(data.get("size")),
                attemptsCount: parseFloat(data.get("attemptsCount")),
                breakeven: parseFloat(data.get("breakeven")),
                trailing: parseFloat(data.get("trailing")),
                part: parseFloat(data.get("part")),
                candlesCount: parseFloat(data.get("candlesCount")),
                touchCount: parseFloat(data.get("touchCount")),
                tolerance: parseFloat(data.get("tolerance")),
                //autoLevels: !!data.get("autoLevels"),
                balance,
                priceScale,
              };

              try {
                await this.app
                  .get("api")
                  .post(`/api/algo-trading/${symbol}`, newSettings);
                modal.hide();
                this.app.state.set("algoSettings", newSettings);
                this.app.get("chart").updateAlgoPanel(newSettings);
                //this.app.emit("algo:settingsUpdated", { symbol, ...newSettings });
              } catch (err) {
                alert(err.message || "Ошибка сохранения настроек");
              }
            } else {
              form.reportValidity();
            }
          }
        },
      },
    });

    // Навешиваем динамический пересчёт
    const form = document.querySelector("#algotradingForm");
    if (!form) return;

    const posInput = form.querySelector('[name="size"]');
    const slInput = form.querySelector('[name="slOpen"]');
    const attemptsDisplay = document.getElementById("calculatedAttempts");
    const attemptsSelect = form.querySelector('[name="attemptsCount"]');

    const updateCalculations = () => {
      const pos = parseFloat(posInput.value);
      const sl = parseFloat(slInput.value);
      const attemptsCount = parseFloat(attemptsSelect.value);
      let isValid = true;
      if (isNaN(pos) || pos <= 0) isValid = false;
      if (isNaN(sl) || sl < -1.5 || sl > 0) isValid = false;
      //modal.updateButton("save", !isValid);

      if (isValid) {
        const risk = pos * ((Math.abs(sl) + 0.2) / 100);
        const attempts = Math.max(1, Math.floor(balance / risk));
        const used = risk * attemptsCount;
        attemptsDisplay.textContent = `Attempts: ${attempts},
          Loss1: $${risk.toFixed(2)},
          Loss${attemptsCount}: $${used.toFixed(2)}`;
      } else {
        attemptsDisplay.textContent = "—";
      }
    };

    posInput.addEventListener("input", updateCalculations);
    slInput.addEventListener("input", updateCalculations);
    attemptsSelect.addEventListener("change", updateCalculations);
    updateCalculations();
  }
  async getTickerInfo(symbol) {
    const responseInfo = await fetch(
      `https://api.bybit.com/v5/market/tickers?category=linear&symbol=${symbol}`,
    );
    const dataInfo = await responseInfo.json();
    if (dataInfo.retCode !== 0) {
      throw new Error(`Error API getTickerInfo: ${dataInfo.retMsg}`);
    }
    const ticker = dataInfo.result.list[0];
    const { fundingRate, fundingIntervalHour } = ticker;
    const nextFundingTimeMs = parseInt(ticker.nextFundingTime);
    const nowMs = Date.now();
    const timeUntilMs = Math.max(0, nextFundingTimeMs - nowMs);
    const nextTimeDate = new Date(nextFundingTimeMs);
    const nextFundingTime = nextTimeDate.toLocaleString("ru-RU", {
      timeZone: "Europe/Moscow",
    });
    const hours = Math.floor(timeUntilMs / 3_600_000);
    const minutes = Math.floor((timeUntilMs % 3_600_000) / 60_000);
    const countDownTime = `${hours}h ${minutes}m`;
    return {
      fundingRate: (fundingRate * 100).toFixed(4),
      fundingIntervalHour,
      nextFundingTime,
      countDownTime,
    };
  }
  destroy() {
    if (this.chart) {
      this.chart.remove();
      this.chart = null;
    }
    this.markers = [];
  }
}
