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
    this.flagLevels = true;
    this.flagTriggers = true;
    this.flagPositions = true;
    this.candles = [];
    this.templates = {
      chartTemplate: Templates["widgets/chart"],
      algotradingSettingsTemplate: Templates["modals/algo-trading"],
    };
  }
  init() {
    this.app.on("dashboardReady", () => this.mountWidget());
    this.app.on("symbolChanged", (symbol) => {
      //fist hide lines
      this.flagPositions = false;
      this.visiblePositions();
      this.load(symbol, this.app.state.get("timeframe"));
    });
    this.app.on("kline:update", (data) => {
      this.updateRealtimeCandle(data);
    });
  }
  mountWidget() {
    this.destroy();
    console.log("[Chart:mountWidget]");
    this.container = document.getElementById("chartWidgetContainer");
    const { symbol, isAuth, timeframe } = this.app.state.get();
    this.container.innerHTML = this.templates.chartTemplate({
      symbol,
      isAuth,
      timeframe,
    });
    this.mount();
    this.visibleLevels();
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
    //price lines for triggers
    this.triggersLines = {};
    //price lines for position
    this.buyPositionLines = {
      sl: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "green",
        lineWidth: 2,
        lineStyle: 0,
        lineVisible: false,
        axisLabelVisible: false,
      }),
      enter: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "green",
        lineWidth: 2,
        lineStyle: 1,
        lineVisible: false,
        axisLabelVisible: false,
      }),
      tp: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "green",
        lineWidth: 2,
        lineStyle: 2,
        lineVisible: false,
        axisLabelVisible: false,
      }),
      part: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "green",
        lineWidth: 2,
        lineStyle: 3,
        lineVisible: false,
        axisLabelVisible: false,
      }),
    };
    this.sellPositionLines = {
      sl: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "red",
        lineWidth: 2,
        lineStyle: 0,
        lineVisible: false,
        axisLabelVisible: false,
      }),
      enter: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "red",
        lineWidth: 2,
        lineStyle: 1,
        lineVisible: false,
        axisLabelVisible: false,
      }),
      tp: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "red",
        lineWidth: 2,
        lineStyle: 2,
        lineVisible: false,
        axisLabelVisible: false,
      }),
      part: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "red",
        lineWidth: 2,
        lineStyle: 3,
        lineVisible: false,
        axisLabelVisible: false,
      }),
    };
    //simulator lines
    this.longLines = {
      enter: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "black",
        lineWidth: 2,
        lineStyle: 0,
        lineVisible: false,
        axisLabelVisible: false,
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
      enter: this.candlestickSeries.createPriceLine({
        price: 0,
        color: "black",
        lineWidth: 2,
        lineStyle: 0,
        lineVisible: false,
        axisLabelVisible: false,
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
      buySl: this.buyPositionLines["sl"],
      buyTp: this.buyPositionLines["tp"],
      buyPart: this.buyPositionLines["part"],
      sellSl: this.sellPositionLines["sl"],
      sellTp: this.sellPositionLines["tp"],
      sellPart: this.sellPositionLines["part"],
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
      const { candlesCount, touchesCount, candlePart } =
        this.app.state.get("algoSettings");
      if (this.app.state.get("chartMode") == "simulator") {
        const candles = this.app
          .get("chart")
          .candles.slice(0, this.app.get("simulator").candleIndex);
        this.updateIndicators(candles, candlesCount, touchesCount, candlePart);
      } else {
        this.updateIndicators(
          this.candles,
          candlesCount,
          touchesCount,
          candlePart,
        );
      }
      this.visibleLevels();
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
    //clear data
    this.app.get("simulator").closeAllPositions();
    this.app.get("simulator").updateSimilatorPanel();
    this.markerSeries.setMarkers([]);
    this.positionLong = null;
    this.positionShort = null;
    //get ticker data
    if (this.app.state.get("isAuth")) {
      await this.loadTickerData(symbol);
    }
    //calc Indicators
    const { candlesCount, touchesCount, candlePart } =
      this.app.state.get("algoSettings");
    this.updateIndicators(this.candles, candlesCount, touchesCount, candlePart);
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
    //load ticker data algo-trading
    const tickerData = await this.getTickerInfo(symbol);
    this.app.state.set("tickerData", tickerData);
    const tickerInfo = await this.app.get("api").post(`/api/${symbol}/info`);
    if (!tickerInfo) return;
    const {
      size = 1000,
      attemptsCount = -1,
      trend = "up",
      triggersCount = 4,
      triggersStep = 0.1,
      timeframe = "4h",
      candlesCount = 4,
      touchesCount = 3,
      candlePart = 40,
      longSl = -1,
      longPart = 2,
      longTp = 5,
      longBreakeven = 0,
      longTrailing = 0,
      shortSl = -1,
      shortPart = 2,
      shortTp = 5,
      shortBreakeven = 0,
      shortTrailing = 0,
    } = tickerInfo?.algoSettings || {};
    this.app.state.set("algoSettings", {
      size,
      attemptsCount,
      trend,
      triggersCount,
      triggersStep,
      balance: tickerInfo?.balance || 0,
      timeframe,
      candlesCount,
      touchesCount,
      candlePart,
      longSl,
      longPart,
      longTp,
      longBreakeven,
      longTrailing,
      shortSl,
      shortPart,
      shortTp,
      shortBreakeven,
      shortTrailing,
    });
    this.updateAlgoPanel(this.app.state.get("algoSettings"));
    //show triggers
    this.createTriggers(tickerInfo);
    this.createPositions(tickerInfo.positions, tickerInfo.partOrders);
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
              <button class="btn btn-sm" data-action="openAlgoSettings">${Handlebars.helpers.tradingIcon(algoSettings, { hash: { btn: true } })}</button>
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
      if (action === "openAlgoSettings") {
        this.showAlgotradingSettingsModal();
      }
      if (action === "triggersToggle") {
        this.visibleTriggers();
      }
      if (action === "levelsToggle") {
        this.visibleLevels();
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
        this.app.get("simulator").setTriggers("Long");
      }
      if (action === "openSimulatorShort") {
        this.app.get("simulator").setTriggers("Short");
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
  visibleTriggers() {
    Object.values(this.triggersLines).forEach((item) => {
      item.applyOptions({
        lineVisible: this.flagTriggers,
        axisLabelVisible: this.flagTriggers,
      });
    });
    this.flagTriggers = !this.flagTriggers;
  }
  createTriggers(triggers) {
    //first delete old price lines
    Object.values(this.triggersLines).forEach((item) => {
      this.candlestickSeries.removePriceLine(item);
    });
    this.triggersLines = {};
    for (const [name, triger] of Object.entries(triggers?.triggersBuy || {})) {
      this.triggersLines[`${name}Buy`] = this.candlestickSeries.createPriceLine(
        {
          price: triger.price,
          color: "green",
          title: triger.size.toFixed(1) || 0,
          lineWidth: 2,
          lineStyle: triger.active ? 1 : 0,
          lineVisible: !this.flagTriggers,
          axisLabelVisible: !this.flagTriggers,
        },
      );
    }
    for (const [name, triger] of Object.entries(triggers?.triggersSell || {})) {
      this.triggersLines[`${name}Sell`] =
        this.candlestickSeries.createPriceLine({
          price: triger.price,
          color: "red",
          title: triger.size.toFixed(1) || 0,
          lineWidth: 2,
          lineStyle: triger.active ? 1 : 0,
          lineVisible: !this.flagTriggers,
          axisLabelVisible: !this.flagTriggers,
        });
    }
  }
  //new visible
  visiblePositions(side = "all") {
    if (side === "Buy" || side === "all")
      Object.values(this.buyPositionLines).forEach((item) => {
        item.applyOptions({
          lineVisible: this.flagPositions,
          axisLabelVisible: this.flagPositions,
        });
      });
    if (side === "Sell" || side === "all")
      Object.values(this.sellPositionLines).forEach((item) => {
        item.applyOptions({
          lineVisible: this.flagPositions,
          axisLabelVisible: this.flagPositions,
        });
      });
    this.flagPositions = !this.flagPositions;
  }
  createPositions(positions, partOrders) {
    for (const position of positions) {
      const { avgPrice, unrealisedPnl, stopLoss, takeProfit, side } = position;
      if (side === "Buy") {
        this.positionLong = position;
        this.buyPositionLines["enter"].applyOptions({
          price: avgPrice,
          title: `Long: ${unrealisedPnl.toFixed(1)}$`,
        });
        const slPercent = ((stopLoss - avgPrice) / avgPrice) * 100;
        this.buyPositionLines["sl"].applyOptions({
          price: stopLoss,
          title: `buySL:${slPercent.toFixed(2)}%`,
        });
        const tpPercent = ((takeProfit - avgPrice) / avgPrice) * 100;
        this.buyPositionLines["tp"].applyOptions({
          price: position.takeProfit,
          title: `buyTP:${tpPercent.toFixed(2)}%`,
        });
      }
      if (side === "Sell") {
        this.positionShort = position;
        this.sellPositionLines["enter"].applyOptions({
          price: avgPrice,
          title: `Short: ${unrealisedPnl.toFixed(1)}$`,
        });
        const slPercent = ((stopLoss - avgPrice) / avgPrice) * 100;
        this.sellPositionLines["sl"].applyOptions({
          price: stopLoss,
          title: `sellSL:${slPercent.toFixed(2)}%`,
        });
        const tpPercent = ((takeProfit - avgPrice) / avgPrice) * 100;
        this.sellPositionLines["tp"].applyOptions({
          price: position.takeProfit,
          title: `sellTP:${tpPercent.toFixed(2)}%`,
        });
      }
    }
    for (const partOrder of partOrders) {
      const { price, side } = partOrder;
      if (side === "Sell") {
        const { avgPrice } = this.positionLong;
        const tpPercent = ((price - avgPrice) / avgPrice) * 100;
        this.buyPositionLines["part"].applyOptions({
          price,
          title: `buyPart:${tpPercent.toFixed(2)}%`,
        });
      }
      if (side === "Buy") {
        const { avgPrice } = this.positionShort;
        const tpPercent = ((price - avgPrice) / avgPrice) * 100;
        this.sellPositionLines["part"].applyOptions({
          price,
          title: `sellPart:${tpPercent.toFixed(2)}%`,
        });
      }
    }
  }
  updateIndicators(candles, candlesCount, touchesCount, candlePart) {
    if (candles.length === 0) return;
    const candlesSlice = candles.slice(-candlesCount);
    const { support, resistance, min, max } = this.app
      .get("indicators")
      .findLevels(candlesSlice, touchesCount, candlePart);
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
  visibleLevels() {
    for (const line of Object.values(this.levelsLines)) {
      line.applyOptions({
        lineVisible: this.flagLevels,
        axisLabelVisible: this.flagLevels,
      });
    }
    this.flagLevels = !this.flagLevels;
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
        const { candlesCount, touchesCount, candlePart } =
          this.app.state.get("algoSettings");
        document.querySelector(`[data-bind="candleInfo"]`).textContent =
          `${this.volumeSeries.priceFormatter().format(datapoints.value)}
        (${
          candle.close > candle.open
            ? `+${(((candle.high - candle.low) / candle.low) * 100).toFixed(2)}`
            : `${(((candle.low - candle.high) / candle.high) * 100).toFixed(2)}`
        }%) [${candlesCount}, ${touchesCount}, ${candlePart}]`;
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
        if (["buyTp", "buySl", "buyPart"].includes(this.selectedLine)) {
          const enter = this.buyPositionLines["enter"].options().price;
          const tp = this.buyPositionLines["tp"].options().price;
          const part = this.buyPositionLines["part"].options().price;
          const sl = this.buyPositionLines["sl"].options().price;
          this.buyPositionLines["tp"].applyOptions({
            title: `buyTp${(((tp - enter) / enter) * 100).toFixed(2)}%`,
          });
          this.buyPositionLines["part"].applyOptions({
            title: `buyPart${(((part - enter) / enter) * 100).toFixed(2)}%`,
          });
          this.buyPositionLines["sl"].applyOptions({
            title: `buySl${(((sl - enter) / enter) * 100).toFixed(2)}%`,
          });
        }
        if (["sellTp", "sellSl", "sellPart"].includes(this.selectedLine)) {
          const enter = this.sellPositionLines["enter"].options().price;
          const tp = this.sellPositionLines["tp"].options().price;
          const part = this.sellPositionLines["part"].options().price;
          const sl = this.sellPositionLines["sl"].options().price;
          this.sellPositionLines["tp"].applyOptions({
            title: `sellTp${(((tp - enter) / enter) * 100).toFixed(2)}%`,
          });
          this.sellPositionLines["part"].applyOptions({
            title: `sellPart${(((part - enter) / enter) * 100).toFixed(2)}%`,
          });
          this.sellPositionLines["sl"].applyOptions({
            title: `sellSl${(((sl - enter) / enter) * 100).toFixed(2)}%`,
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
          const enter = this.longLines["enter"].options().price;
          const tp = this.longLines["tp"].options().price;
          const part = this.longLines["part"].options().price;
          const sl = this.longLines["sl"].options().price;
          this.longLines["tp"].applyOptions({
            title: `Long TP ${(((tp - enter) / enter) * 100).toFixed(2)}%`,
          });
          this.longLines["part"].applyOptions({
            title: `Long Part ${(((part - enter) / enter) * 100).toFixed(2)}%`,
          });
          this.longLines["sl"].applyOptions({
            title: `Long SL ${(((sl - enter) / enter) * 100).toFixed(2)}%`,
          });
        }
        if (
          ["simTpShort", "simPartShort", "simSlShort"].includes(
            this.selectedLine,
          )
        ) {
          const enter = this.shortLines["enter"].options().price;
          const tp = this.shortLines["tp"].options().price;
          const part = this.shortLines["part"].options().price;
          const sl = this.shortLines["sl"].options().price;
          this.shortLines["tp"].applyOptions({
            title: `Short TP ${(((tp - enter) / enter) * -1 * 100).toFixed(2)}%`,
          });
          this.shortLines["part"].applyOptions({
            title: `Short Part ${(((part - enter) / enter) * -1 * 100).toFixed(2)}%`,
          });
          this.shortLines["sl"].applyOptions({
            title: `Short SL${(((sl - enter) / enter) * -1 * 100).toFixed(2)}%`,
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
    // const linesTransform = {
    //   buyTp: "tp",
    //   buySl: "sl",
    //   buyPart: "part",
    //   sellTp: "tp",
    //   sellSl: "sl",
    //   sellPart: "part",
    // };
    if (["buyTp", "buySl", "buyPart"].includes(lineName)) {
      const enter = this.buyPositionLines["enter"].options().price;
      const tp = this.buyPositionLines["tp"].options().price;
      const part = this.buyPositionLines["part"].options().price;
      const sl = this.buyPositionLines["sl"].options().price;
      let newSl = ((sl - enter) / enter) * 100;
      const slMax = -1.5;
      const saveParams = {};
      const tpPercent = Math.abs((((tp - enter) / enter) * 100).toFixed(2));
      saveParams.tp = tpPercent;
      //this.app.state.set("algoSettings.tp", tpPercent);
      if (part > 0) {
        const tpPart = Math.abs((((part - enter) / enter) * 100).toFixed(2));
        saveParams.part = tpPart;
        //this.app.state.set("algoSettings.part", tpPart);
      }
      if (newSl > slMax) {
        //this.app.state.set("algoSettings.sl", newSl.toFixed(2));
      } else {
        this.buyPositionLines["sl"].applyOptions({
          price: enter * (1 + slMax / 100),
          title: `LS${slMax}%!`,
        });
        newSl = slMax;
        //this.app.state.set("algoSettings.sl", slMax);
      }
      saveParams.sl = +newSl.toFixed(2);
      //save api
      // try {
      //   const { symbol, priceScale } = this.app.state.get();
      //   saveParams.priceScale = priceScale;
      //   await this.app
      //     .get("api")
      //     .post(
      //       `/api/algo-trading/${symbol}/edit/${linesTransform[lineName]}`,
      //       saveParams,
      //     );
      // } catch (err) {
      //   alert(err.message || "Ошибка сохранения настроек");
      // }
    }
    if (["sellTp", "sellSl", "sellPart"].includes(lineName)) {
      const enter = this.sellPositionLines["enter"].options().price;
      const tp = this.sellPositionLines["tp"].options().price;
      const part = this.sellPositionLines["part"].options().price;
      const sl = this.sellPositionLines["sl"].options().price;
      let newSl = ((sl - enter) / enter) * 100;
      const slMax = -1.5;
      const saveParams = {};
      const tpPercent = Math.abs((((tp - enter) / enter) * 100).toFixed(2));
      saveParams.tp = tpPercent;
      //this.app.state.set("algoSettings.tp", tpPercent);
      if (part > 0) {
        const tpPart = Math.abs((((part - enter) / enter) * 100).toFixed(2));
        saveParams.part = tpPart;
        //this.app.state.set("algoSettings.part", tpPart);
      }
      newSl = newSl * -1;
      if (newSl > slMax) {
        //this.app.state.set("algoSettings.sl", newSl.toFixed(2));
      } else {
        this.sellPositionLines["sl"].applyOptions({
          price: enter * (1 - slMax / 100),
          title: `LS${slMax}%!`,
        });
        newSl = slMax;
        //this.app.state.set("algoSettings.sl", slMax);
      }
      saveParams.sl = +newSl.toFixed(2);
      //save api
      // try {
      //   const { symbol, priceScale } = this.app.state.get();
      //   saveParams.priceScale = priceScale;
      //   await this.app
      //     .get("api")
      //     .post(
      //       `/api/algo-trading/${symbol}/edit/${linesTransform[lineName]}`,
      //       saveParams,
      //     );
      // } catch (err) {
      //   alert(err.message || "Ошибка сохранения настроек");
      // }
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
    if (this.positionLong) {
      const { avgPrice, size } = this.positionLong;
      const pnl = size * (newCandle.close - avgPrice);
      const pnlPercent = ((newCandle.close - avgPrice) / avgPrice) * 100;
      this.buyPositionLines["enter"].applyOptions({
        title: `Long ${pnl.toFixed(1)}$ (${pnlPercent.toFixed(1)}%)`,
      });
    }
    if (this.positionShort) {
      const { avgPrice, size } = this.positionShort;
      const pnl = size * (newCandle.close - avgPrice) * -1;
      const pnlPercent = ((newCandle.close - avgPrice) / avgPrice) * -100;
      this.sellPositionLines["enter"].applyOptions({
        title: `Short ${pnl.toFixed(1)}$ (${pnlPercent.toFixed(1)}%)`,
      });
    }
  }
  defaultLines() {
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
      { value: -1, name: "🔴 Off" },
      { value: 0, name: "🟢 0 attempts" },
      { value: 1, name: "🟢 1 attempts" },
      { value: 2, name: "🟢 2 attempts" },
      { value: 3, name: "🟢 3 attempts" },
      { value: 4, name: "🟢 4 attempts" },
      { value: 5, name: "🟢 5 attempts" },
      { value: 6, name: "🔔 Only alerts" },
    ].map((el) => {
      if (el.value === algoSettings.attemptsCount) {
        el.selected = true;
      } else {
        el.selected = false;
      }
      return el;
    });
    const timeframeList = [
      { value: "2h", name: "2h" },
      { value: "4h", name: "4h" },
      { value: "6h", name: "6h" },
      { value: "12h", name: "12h" },
      { value: "1d", name: "1d" },
      { value: "1w", name: "1w" },
    ].map((el) => {
      if (el.value === algoSettings.timeframe) {
        el.selected = true;
      } else {
        el.selected = false;
      }
      return el;
    });
    const trendList = [
      { value: "up", name: "↗️Up" },
      { value: "down", name: "↘️Down" },
      { value: "flat", name: "↕️Flat" },
    ].map((el) => {
      if (el.value === algoSettings.trend) {
        el.selected = true;
      } else {
        el.selected = false;
      }
      return el;
    });
    modal.show({
      title: `Racket – ${symbol} ($${balance.toFixed(1)})`,
      body: this.templates.algotradingSettingsTemplate({
        attemptsList,
        timeframeList,
        trendList,
        ...algoSettings,
        fundingRate: tickerData.fundingRate,
        countDownTime: tickerData.countDownTime,
      }),
      size: "md",
      actions: {
        buttons: [
          { text: "Cancel", class: "btn-secondary", dismiss: true },
          { text: "Save", class: "btn-primary", action: "submit" },
        ],
        onAction: async (action) => {
          if (action === "submit") {
            const form = document.querySelector("#algotradingForm");
            const isValid = form.checkValidity();
            if (isValid) {
              const data = new FormData(form);
              const newSettings = {
                size: parseFloat(data.get("size")),
                attemptsCount: parseFloat(data.get("attemptsCount")),
                trend: data.get("trend"),
                triggersCount: parseFloat(data.get("triggersCount")),
                triggersStep: parseFloat(data.get("triggersStep")),
                balance,
                priceScale,
                timeframe: data.get("timeframe"),
                candlesCount: parseFloat(data.get("candlesCount")),
                touchesCount: parseFloat(data.get("touchesCount")),
                candlePart: parseFloat(data.get("candlePart")),
                longTp: parseFloat(data.get("longTp")),
                longPart: parseFloat(data.get("longPart")),
                longSl: parseFloat(data.get("longSl")),
                longBreakeven: parseFloat(data.get("longBreakeven")),
                longTrailing: parseFloat(data.get("longTrailing")),
                shortTp: parseFloat(data.get("shortTp")),
                shortPart: parseFloat(data.get("shortPart")),
                shortSl: parseFloat(data.get("shortSl")),
                shortBreakeven: parseFloat(data.get("shortBreakeven")),
                shortTrailing: parseFloat(data.get("shortTrailing")),
              };
              this.updateIndicators(
                this.candles,
                newSettings.candlesCount,
                newSettings.touchesCount,
                newSettings.candlePart,
              );
              try {
                await this.app
                  .get("api")
                  .post(`/api/algo-trading/${symbol}`, newSettings);
                modal.hide();
                this.app.state.set("algoSettings", newSettings);
                this.app.get("chart").updateAlgoPanel(newSettings);
                //calc new triggers
                //await this.setTriggers();
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
    const slInput = form.querySelector('[name="longSl"]');
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
