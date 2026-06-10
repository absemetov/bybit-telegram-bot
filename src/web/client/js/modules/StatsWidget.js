import { Templates } from "@js/generated/templates.js";

export class StatsWidget {
  constructor(app) {
    this.app = app;
    this.container = null;
    this.activeTab = "positions"; // orders | positions
  }
  tabUrl(symbol) {
    const urls = {
      positions: "api/positions",
      orders: `api/positions-history/${symbol}`,
    };
    return urls[this.activeTab];
  }
  init() {
    this.app.on("dashboardReady", () => {
      this.container = document.getElementById("statsWidgetContainer");
      if (this.container) {
        //this.render();
        this.attachEvents();
        //this.loadTab(this.activeTab);
      }
    });

    this.app.on("symbolChanged", (symbol) => {
      if (this.app.state.get("isAuth")) {
        this.activeTab = "positions";
        this.hideMarkers = false;
        this.loadTab(this.activeTab, symbol);
      } else {
        this.renderSimulatorTab();
      }
    });
  }

  async loadTab(tab, symbol) {
    if (!this.container) return;
    this.activeTab = tab;
    this.symbol = symbol;
    const url = this.tabUrl(symbol);
    if (!url) {
      console.error(`[StatsWidget] No URL template for tab '${tab}'`);
      return;
    }

    try {
      let cursor = null;
      this.data = await this.app.get("api").post(url, {
        cursor,
      });
      cursor = this.data.nextPageCursor;
      this.renderTab(tab);
    } catch (err) {
      this.container.innerHTML = `<div class="alert alert-danger m-2">Ошибка загрузки ${err}</div>`;
    }
  }
  renderSimulatorTab() {
    this.activeTab = "simulator";
    const { trades, shortPosition, longPosition, symbol, stats } =
      this.app.get("simulator");
    const positions = [...trades].reverse();
    const { profitableTrades, lossTrades } = stats;
    const winRate = ((profitableTrades / positions.length) * 100).toFixed(2);
    stats.totalPrcnt = stats.profPrcnt - stats.lossPrcnt;
    this.container.innerHTML = Templates["widgets/stats-widget"]({
      shortPosition,
      longPosition,
      positions,
      totalData: stats,
      lossTrades,
      profitableTrades,
      winRate,
      activeTab: this.activeTab,
      isAuth: this.app.state.get("isAuth"),
      symbol,
    });
  }
  renderTab(tab) {
    this.container.innerHTML = Templates["widgets/stats-widget"]({
      activeTab: tab,
      ...this.data,
      symbol: this.symbol,
      isAuth: this.app.state.get("isAuth"),
    });
  }

  attachEvents() {
    this.container.addEventListener("click", (e) => {
      const row = e.target.closest("tr[data-action]");
      if (row) {
        const action = row.dataset.action;
        const symbol = row.dataset.symbol;
        if (action === "showTicker") {
          this.app.get("router").navigateToSymbol(symbol);
          return;
        }
        if (action === "showMarkers") {
          if (this.app.state.get("chartMode") == "live") {
            this.showHistoryMarkers();
          }
        }
        if (action === "showSimulatorMarkers") {
          if (this.app.state.get("chartMode") == "simulator") {
            this.showHistoryMarkers();
          }
        }
        if (action === "showHistoryPosition") {
          if (this.app.state.get("chartMode") == "live") {
            const { updatedTime, exitPrice, entryPrice, closedPnl, side } =
              row.dataset;
            const updatedTimeSec = Math.floor(updatedTime / 1000);
            this.showHistoryPriceLines(
              updatedTimeSec,
              +entryPrice,
              +exitPrice,
              side,
              closedPnl,
            );
          }
        }
        if (action === "showHistoryPositionSimulator") {
          if (this.app.state.get("chartMode") == "simulator") {
            const {
              updatedTime,
              exitPrice,
              entryPrice,
              closedPnl,
              side,
              createdTime,
              size,
            } = row.dataset;
            const updatedTimeSec = Math.floor(updatedTime / 1000);
            const createdTimeSec = Math.floor(createdTime / 1000);
            this.showHistoryPriceLines(
              updatedTimeSec,
              +entryPrice,
              +exitPrice,
              side,
              closedPnl,
              createdTimeSec,
              +size,
            );
          }
        }
      }

      const tab = e.target.closest("[data-tab]");
      if (tab) {
        if (tab.dataset.tab == "simulator") {
          this.renderSimulatorTab();
        } else {
          this.loadTab(tab.dataset.tab, this.symbol);
        }
      }
      const btn = e.target.closest("[data-modal]");
      if (btn) {
        const all = btn.dataset.all;
        const modal = btn.dataset.modal;
        if (this.app.state.get("isAuth")) {
          if (modal === "showPositions")
            this.app.get("header").showPositionsModal();
          if (modal === "showOrders") this.app.get("header").showOrdersModal();
          if (modal === "showHistory")
            this.app.get("header").showHistoryModal(all);
          if (modal === "showWinrate")
            this.app.get("header").showWinrateModal(all);
        }
      }
    });
  }
  //show history orders
  showHistoryMarkers() {
    let positions;
    let interval;
    if (this.app.state.get("chartMode") == "simulator") {
      positions = this.app.get("simulator").trades;
      interval =
        this.app.get("simulator").historicalCandles[1].time -
        this.app.get("simulator").historicalCandles[0].time;
    } else {
      positions = this.data.positions;
      interval =
        this.app.get("chart").candles[1].time -
        this.app.get("chart").candles[0].time;
    }
    this.app.get("chart").visibleTriggers(false);
    this.app.get("chart").visiblePositions(false);
    this.app.get("chart").visibleLevels(false);
    const markLevels = [];
    this.app.get("simulator").closeAllPositions();
    this.app.get("chart").markerSeries.setMarkers([]);
    this.hideMarkers = !this.hideMarkers;
    if (this.hideMarkers) return;
    for (const position of positions) {
      const { updatedTime, closedPnl, side } = position;
      //const createdTimeSec = Math.floor(createdTime / 1000);
      const updatedTimeSec = Math.floor(updatedTime / 1000);
      // const createdCandle = this.app
      //   .get("chart")
      //   .candles.find(
      //     (c) => createdTimeSec >= c.time && createdTimeSec < c.time + interval,
      //   );
      const targetCandle = this.app
        .get("chart")
        .candles.find(
          (c) => updatedTimeSec >= c.time && updatedTimeSec < c.time + interval,
        );
      // if (createdCandle) {
      //   markLevels.push({
      //     time: createdCandle.time,
      //     position: "atPriceMiddle",
      //     color: "black",
      //     shape: "circle",
      //     text: `@${side !== "Sell" ? "Short" : "Long"}`,
      //     price: entryPrice || updatedTime,
      //   });
      // }
      if (targetCandle) {
        markLevels.push({
          time: targetCandle.time,
          position: side !== "Sell" ? "aboveBar" : "belowBar",
          color: closedPnl > 0 ? "green" : "red",
          shape: side !== "Sell" ? "arrowDown" : "arrowUp",
          text: `${closedPnl > 0 ? "+" : ""}${(+closedPnl).toFixed(1)}$`,
        });
      }
    }
    this.app.get("chart").markerSeries.setMarkers(markLevels);
  }
  showHistoryPriceLines(
    updatedTime,
    entryPrice,
    exitPrice,
    side,
    closedPnl,
    createdTime,
    size,
  ) {
    let interval;
    let targetCandle;
    let openCandle;
    if (this.app.state.get("chartMode") == "simulator") {
      interval =
        this.app.get("simulator").historicalCandles[1].time -
        this.app.get("simulator").historicalCandles[0].time;
      targetCandle = this.app
        .get("simulator")
        .historicalCandles.find(
          (c) => updatedTime >= c.time && updatedTime < c.time + interval,
        );
      openCandle = this.app
        .get("simulator")
        .historicalCandles.find(
          (c) => createdTime >= c.time && createdTime < c.time + interval,
        );
    } else {
      interval =
        this.app.get("chart").candles[1].time -
        this.app.get("chart").candles[0].time;
      targetCandle = this.app
        .get("chart")
        .candles.find(
          (c) => updatedTime >= c.time && updatedTime < c.time + interval,
        );
    }
    this.app.get("chart").markerSeries.setMarkers([]);
    this.app.get("simulator").closeAllPositions();
    this.app.get("chart").visibleTriggers(false);
    this.app.get("chart").visiblePositions(false);
    this.app.get("chart").visibleLevels(false);
    const markLevels = [];
    if (targetCandle) {
      const timeScale = this.app.get("chart").chart.timeScale();
      const x = timeScale.timeToCoordinate(targetCandle.time);
      if (x === null) return;
      const targetLogical = timeScale.coordinateToLogical(x);
      if (targetLogical === null) return;

      const visibleRange = timeScale.getVisibleLogicalRange();
      if (visibleRange === null) return;
      // Сдвигаем так, чтобы целевой индекс оказался у края (например, слева)
      const rangeWidth = visibleRange.to - visibleRange.from;
      const newFrom = targetLogical - rangeWidth + 15;
      const newTo = targetLogical + 15;
      timeScale.setVisibleLogicalRange({ from: newFrom, to: newTo });
    }
    if (side === "Sell") {
      //set marker
      if (openCandle) {
        markLevels.push({
          time: openCandle.time,
          position: "atPriceMiddle",
          color: "black",
          shape: "circle",
          text: `@${size.toFixed(2)}`,
          price: entryPrice,
        });
      }
      markLevels.push({
        time: targetCandle.time,
        position: "aboveBar",
        color: exitPrice < entryPrice ? "green" : "red",
        shape: "arrowDown",
        text: `PnL ${exitPrice < entryPrice ? "+" : ""}${closedPnl}$`,
      });
      this.app.get("chart").shortLines["sl"].applyOptions({
        color: exitPrice < entryPrice ? "green" : "red",
        price: exitPrice,
        lineVisible: true,
        axisLabelVisible: true,
        title: `${(((exitPrice - entryPrice) / entryPrice) * 100).toFixed(2)}%`,
      });
      this.app.get("chart").shortLines["enter1"].applyOptions({
        price: entryPrice,
        lineVisible: true,
        axisLabelVisible: true,
        title: "Short",
      });
    } else {
      //Long
      //set marker
      if (openCandle) {
        markLevels.push({
          time: openCandle.time,
          position: "atPriceMiddle",
          color: "black",
          shape: "circle",
          text: `@${size.toFixed(2)}`,
          price: entryPrice,
        });
      }
      markLevels.push({
        time: targetCandle.time,
        position: "belowBar",
        color: exitPrice > entryPrice ? "green" : "red",
        shape: "arrowUp",
        text: `PnL ${exitPrice > entryPrice ? "+" : ""}${closedPnl}$`,
      });
      this.app.get("chart").longLines["sl"].applyOptions({
        color: exitPrice > entryPrice ? "green" : "red",
        price: exitPrice,
        lineVisible: true,
        axisLabelVisible: true,
        title: `${(((exitPrice - entryPrice) / entryPrice) * 100).toFixed(2)}%`,
      });
      this.app.get("chart").longLines["enter1"].applyOptions({
        price: entryPrice,
        lineVisible: true,
        axisLabelVisible: true,
        title: "Long",
      });
    }
    this.app.get("chart").markerSeries.setMarkers(markLevels);
  }
  destroy() {
    this.container = null;
  }
}
