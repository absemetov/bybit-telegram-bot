//universal modal
class ModalManager {
  constructor() {
    this.modal = new window.bootstrap.Modal("#universalModal");
    this.modalElement = document.getElementById("universalModal");
    // Компиляция шаблонов
    this.templates = {
      modal: window.Handlebars.compile(`
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{title}}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            {{{body}}}
          </div>
        </div>
      </div>`),
      links: window.Handlebars.compile(`
      <div class="list-group">
        {{#each links}}
        <a href="{{url}}" 
          class="list-group-item list-group-item-action" 
          {{#if blank}}target="_blank"{{/if}}>
          {{text}}
        </a>
        {{/each}}
      </div>`),
      orderForm: window.Handlebars.compile(`
      <form data-form-type="order">
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label">Price ($)</label>
                <input type="number" class="form-control-plaintext" value="{{price}}" readonly>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label">Max position ($)</label>
                <input type="number" class="form-control-plaintext" value="{{maxPosition}}" readonly>
            </div>
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label">Take Profit (%)</label>
                <input type="number" class="form-control" name="takeProfit" value="{{takeProfit}}" step="0.1" required>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label">Stop Loss (%)</label>
                <input type="number" class="form-control" name="stopLoss" value="{{stopLoss}}" step="0.1" max="2" required>
            </div>
        </div>
        <div class="d-grid gap-2">
          <button type="submit" class="btn btn-{{#if (eq orderType 'long')}}success{{else}}danger{{/if}}">{{buttonText}}</button>
        </div>
      </form>`),
      win: window.Handlebars.templates["win-rate"],
      orders: window.Handlebars.templates["orders"],
      positions: window.Handlebars.templates["positions"],
      history: window.Handlebars.templates["history-positions"],
    };

    // Делегирование событий
    this.modalElement.addEventListener("submit", this.handleSubmit.bind(this));
    this.modalElement.addEventListener("click", this.handleClick.bind(this));
  }

  render(config) {
    const context = {
      title: config.title,
      body: this._renderBody(config),
    };

    this.modalElement.innerHTML = this.templates.modal(context);
    this._applyAdditionalSettings(config);
    this.modal.show();
  }

  _renderBody(config) {
    switch (config.type) {
      case "links":
        return this.templates.links({
          links: config.data,
        });
      case "order-form":
        return this.templates.orderForm({
          orderType: config.orderType,
          buttonText: config.orderType.toUpperCase(),
          price: Order.state.price.toFixed(5),
          stopLoss: Order.state.STOP_LOSS,
          takeProfit: Order.state.TAKE_PROFIT,
          maxPosition: Order.state.MAX_POSITION,
        });
      case "orders":
        return this.templates.orders({
          orders: config.orders,
          cursor: config.cursor,
        });
      case "positions":
        return this.templates.positions({
          positions: config.positions,
          cursor: config.cursor,
        });
      case "history":
        return this.templates.history({
          positions: config.positions,
          cursor: config.cursor,
          all: config.allCoins,
        });
      case "win":
        return this.templates.win({
          winRate: config.winRate,
          all: config.allCoins,
        });
      case "custom":
        return config.html;
      default:
        return "";
    }
  }

  _applyAdditionalSettings(config) {
    const dialog = this.modalElement.querySelector(".modal-dialog");
    dialog.className = `modal-dialog ${config.size ? "modal-" + config.size : ""}`;
  }

  handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    if (form.dataset.formType === "order") {
      this._handleOrderSubmit(formData);
    }
  }

  async handleClick(e) {
    // const clickedLink = e.target.closest('a.nav-link');
    // if (!clickedLink) return; // Если клик не по ссылке - выходим
    // // Находим контейнер меню (ближайший ul с классом nav)
    // const navContainer = clickedLink.closest('ul.nav');
    // // Находим все ссылки в текущем меню
    // const allLinks = navContainer.querySelectorAll('a.nav-link');
    // // Удаляем active у всех ссылок
    // allLinks.forEach(link => link.classList.remove('active'));
    // // Добавляем active кликнутой ссылке
    // clickedLink.classList.add('active');
    const orderElement = e.target.closest(".order-item");
    if (orderElement) {
      this._handleOrderClick(orderElement, e);
    }
    const positionElement = e.target.closest(".position-item");
    if (positionElement) {
      this._handlePositionClick(positionElement, e);
    }
    const historyElement = e.target.closest(".history-item");
    if (historyElement) {
      this._handleHistoryClick(historyElement, e);
    }
    const winElement = e.target.closest(".win-item");
    if (winElement) {
      this._handleWinClick(winElement, e);
    }
  }
  async _handleWinClick(item, e) {
    const loadMore = e.target.closest(".load-more");
    if (loadMore) {
      const allCoins = e.target.closest(".all");
      const cursor = loadMore.dataset.cursor;
      await Order.fetchWin(cursor, allCoins);
      return;
    }
  }
  async _handleHistoryClick(item, e) {
    const loadMore = e.target.closest(".load-more");
    if (loadMore) {
      const allCoins = e.target.closest(".all");
      const cursor = loadMore.dataset.cursor;
      await Order.fetchHistory(cursor, allCoins);
      return;
    }
    const symbol = item.dataset.symbol;
    const updatedTime = item.dataset.updatedTime / 1000;
    const exitPrice = +item.dataset.exitPrice;
    const entryPrice = +item.dataset.entryPrice;
    const closedPnl = item.dataset.closedPnl;
    const side = item.dataset.side;
    // Обработка кнопок внутри строки
    // if (e.target.classList.contains('btn-edit')) {
    //   handleEdit(itemId);
    // } else if (e.target.classList.contains('btn-delete')) {
    //   handleDelete(itemId);
    // }
    // Клик по всей строке
    if (symbol !== App.state.symbol) {
      App.router.navigate(`/chart/${symbol}/${App.state.timeframe}`);
    }
    document
      .querySelectorAll(".history-item")
      .forEach((n) => n.classList.remove("table-info"));
    item.classList.add("table-info");
    if (e.target.tagName === "TD") {
      this.showHistoryPriceLines(
        updatedTime,
        entryPrice,
        exitPrice,
        side,
        closedPnl,
      );
    }
  }
  showHistoryPriceLines(updatedTime, entryPrice, exitPrice, side, closedPnl) {
    ChartManager.state.markerSeries.setMarkers([]);
    ChartManager.state.markLevels = [];
    ChartManager.state.markLevels.push({
      time: updatedTime,
      position: side === "Sell" ? "aboveBar" : "belowBar",
      color: "black",
      shape: side === "Sell" ? "arrowDown" : "arrowUp",
      text: `${side} PnL ${closedPnl}$`,
    });
    if (side === "Sell") {
      ChartManager.state.linesSr[0].line.applyOptions({
        price: exitPrice,
        lineVisible: true,
        axisLabelVisible: true,
        title: `${(((exitPrice - entryPrice) / entryPrice) * 100).toFixed(2)}%`,
      });
      ChartManager.state.linesSr[1].line.applyOptions({
        price: entryPrice,
        lineVisible: true,
        axisLabelVisible: true,
      });
    } else {
      ChartManager.state.linesSr[0].line.applyOptions({
        price: entryPrice,
        lineVisible: true,
        axisLabelVisible: true,
        title: `${(((exitPrice - entryPrice) / entryPrice) * 100).toFixed(2)}%`,
      });
      ChartManager.state.linesSr[1].line.applyOptions({
        price: exitPrice,
        lineVisible: true,
        axisLabelVisible: true,
      });
    }
    ChartManager.state.markerSeries.setMarkers(ChartManager.state.markLevels);
  }
  async _handleOrderClick(item, e) {
    const symbol = item.dataset.symbol;
    const getOrders = e.target.closest(".get-orders");
    const cancelOrder = e.target.closest(".cancel-order");
    //open orders
    if (getOrders) {
      const cursor = getOrders.dataset.cursor;
      await Order.fetchOrders(cursor);
      return;
    }
    //cancel orders
    if (cancelOrder) {
      const orderId = e.target.dataset.orderId;
      const price = e.target.dataset.price;
      const side = e.target.dataset.side;
      if (confirm(`Delete order ${side} ${symbol} by ${price}$?`)) {
        try {
          const response = await fetch(`/order/cancel/${symbol}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderId,
            }),
          });
          const resJson = await response.json();
          if (!response.ok) {
            alert(resJson.message);
            return false;
          }
          this.render({
            type: "orders",
            title: "Limit orders",
            orders: resJson.orders,
            cursor: resJson.nextPageCursor,
            size: "lg",
          });
          Order.orderPriceLines(resJson.orders);
          App.state.bsOffcanvas.hide();
          return;
        } catch (error) {
          alert(`Error: ${error.message}`);
        }
      }
    }
    //navigate to ticker
    App.router.navigate(`/chart/${symbol}/${App.state.timeframe}`);
    App.state.bsOffcanvas.hide();
  }
  async _handlePositionClick(item, e) {
    const symbol = item.dataset.symbol;
    const getPositions = e.target.closest(".get-positions");
    const cancelPosition = e.target.closest(".cancel-position");
    //open orders
    if (getPositions) {
      const cursor = getPositions.dataset.cursor || "";
      await Order.fetchPositions(cursor);
      return;
    }
    //cancel orders
    if (cancelPosition) {
      const side = e.target.dataset.side;
      const qty = e.target.dataset.qty;
      if (confirm(`Delete position ${symbol} ${side} ${qty}?`)) {
        try {
          const response = await fetch(`/position/close/${symbol}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              side,
              qty,
            }),
          });
          const resJson = await response.json();
          if (!response.ok) {
            alert(resJson.message);
            return false;
          }
          this.render({
            type: "positions",
            title: `Positions, Balance ${resJson.balance}$`,
            positions: resJson.positions,
            cursor: resJson.nextPageCursor,
            //size: "lg",
          });
          App.state.bsOffcanvas.hide();
          return;
        } catch (error) {
          alert(`Error: ${error.message}`);
        }
      }
    }
    //navigate to ticker
    App.router.navigate(`/chart/${symbol}/${App.state.timeframe}`);
    App.state.bsOffcanvas.hide();
  }
  async _handleOrderSubmit(data) {
    const { side, symbol, price, MAX_POSITION } = Order.state;
    const tpPercent = parseFloat(data.get("takeProfit"));
    const slPercent = parseFloat(data.get("stopLoss"));
    try {
      const response = await fetch(`/order/create/${symbol}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price,
          side,
          tpPercent,
          slPercent,
          MAX_POSITION,
        }),
      });
      const resJson = await response.json();
      if (!response.ok) {
        alert(resJson.message);
        return false;
      }
      this.render({
        type: "orders",
        title: "Limit orders",
        orders: resJson.orders,
        cursor: resJson.nextPageCursor,
        size: "lg",
      });
      Order.orderPriceLines(resJson.orders);
      //TODO
      //fetchOrders();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }
}

//Orders
class Order {
  static state = {
    TAKE_PROFIT: 6,
    STOP_LOSS: 1.2,
    MAX_POSITION: 50,
  };
  constructor() {
    this.initEventListeners();
  }
  initEventListeners() {
    //long btn
    document.querySelector(".long-btn").addEventListener("click", async () => {
      Order.state.side = "Buy";
      Order.state.symbol = App.state.symbol;
      Order.state.price = ChartManager.state.linesSr[0].line.options().price;
      if (!ChartManager.state.linesSr[0].line.options().lineVisible) {
        alert("Show long line!");
        return;
      }
      App.modal.render({
        type: "order-form",
        title: `LONG ${Order.state.symbol}`,
        orderType: "long",
        //size: "sm",
      });
    });
    //short btn
    document.querySelector(".short-btn").addEventListener("click", async () => {
      Order.state.side = "Sell";
      Order.state.symbol = App.state.symbol;
      Order.state.price = ChartManager.state.linesSr[1].line.options().price;
      if (!ChartManager.state.linesSr[1].line.options().lineVisible) {
        alert("Show short line!");
        return;
      }
      App.modal.render({
        type: "order-form",
        title: `SHORT ${Order.state.symbol}`,
        orderType: "short",
        //size: "sm",
      });
    });
  }
  //render position price lines
  static async positionPriceLines(positions) {
    for (const positionsLine of ChartManager.state.positions) {
      ChartManager.state.candlestickSeries.removePriceLine(positionsLine.line);
    }
    //find ticker positions
    const positionLong = positions.find((p) => p.side === "Buy");
    const positionShort = positions.find((p) => p.side === "Sell");
    //console.log(positionLong, positionShort);
    //clear old data
    ChartManager.state.positions = [];
    if (positionLong) {
      //side opt
      const { avgPrice, unrealisedPnl, stopLoss, takeProfit, size, side } =
        positionLong;
      const slPercent = ((stopLoss - avgPrice) / avgPrice) * 100;
      const tpPercent = ((takeProfit - avgPrice) / avgPrice) * 100;
      ChartManager.state.positions.push({
        line: ChartManager.state.candlestickSeries.createPriceLine({
          price: avgPrice,
          color: "green",
          lineWidth: 2,
          lineStyle: 3,
          title: `Long: ${unrealisedPnl}$`,
          lineVisible: ChartManager.state.hideSr,
          axisLabelVisible: ChartManager.state.hideSr,
        }),
        avgPrice,
        size,
        side,
        stopLoss,
        takeProfit,
      });
      ChartManager.state.positions.push({
        name: "slLong",
        line: ChartManager.state.candlestickSeries.createPriceLine({
          price: stopLoss,
          color: "green",
          lineWidth: 2,
          lineStyle: 3,
          title: `SL/Long:${slPercent.toFixed(2)}%`,
          lineVisible: ChartManager.state.hideSr,
          axisLabelVisible: ChartManager.state.hideSr,
        }),
      });
      ChartManager.state.positions.push({
        name: "tpLong",
        line: ChartManager.state.candlestickSeries.createPriceLine({
          price: takeProfit,
          color: "green",
          lineWidth: 2,
          lineStyle: 3,
          title: `TP/Long:${tpPercent.toFixed(2)}%`,
          lineVisible: ChartManager.state.hideSr,
          axisLabelVisible: ChartManager.state.hideSr,
        }),
      });
    }
    if (positionShort) {
      //side opt
      const { avgPrice, unrealisedPnl, stopLoss, takeProfit, size, side } =
        positionShort;
      const slPercent = ((stopLoss - avgPrice) / avgPrice) * 100;
      const tpPercent = ((takeProfit - avgPrice) / avgPrice) * 100;
      ChartManager.state.positions.push({
        line: ChartManager.state.candlestickSeries.createPriceLine({
          price: avgPrice,
          color: "red",
          lineWidth: 2,
          lineStyle: 3,
          title: `Short: ${unrealisedPnl}$`,
          lineVisible: ChartManager.state.hideSr,
          axisLabelVisible: ChartManager.state.hideSr,
        }),
        avgPrice,
        size,
        side,
        stopLoss,
        takeProfit,
      });
      ChartManager.state.positions.push({
        name: "slShort",
        line: ChartManager.state.candlestickSeries.createPriceLine({
          price: stopLoss,
          color: "red",
          lineWidth: 2,
          lineStyle: 3,
          title: `SL/Short:${slPercent.toFixed(2)}%`,
          lineVisible: ChartManager.state.hideSr,
          axisLabelVisible: ChartManager.state.hideSr,
        }),
      });
      ChartManager.state.positions.push({
        name: "tpShort",
        line: ChartManager.state.candlestickSeries.createPriceLine({
          price: takeProfit,
          color: "red",
          lineWidth: 2,
          lineStyle: 3,
          title: `TP/Short:${tpPercent.toFixed(2)}%`,
          lineVisible: ChartManager.state.hideSr,
          axisLabelVisible: ChartManager.state.hideSr,
        }),
      });
    }
  }
  //render price lines
  static orderPriceLines(orders) {
    for (const orderLine of ChartManager.state.orders) {
      ChartManager.state.candlestickSeries.removePriceLine(orderLine);
    }
    for (const limitOrder of orders) {
      const { triggerPrice, side, sum } = limitOrder;
      ChartManager.state.orders.push(
        ChartManager.state.candlestickSeries.createPriceLine({
          price: triggerPrice,
          color: side === "Sell" ? "red" : "green",
          lineWidth: 2,
          lineStyle: 2,
          title: `L:${side} ${sum}$`,
          //lineVisible: false,
          //axisLabelVisible: false,
        }),
      );
    }
  }
  static async fetchOrders(cursor = "") {
    try {
      const response = await fetch("/order/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cursor,
        }),
      });
      const resJson = await response.json();
      if (!response.ok) {
        alert(resJson.message);
        return false;
      }
      App.modal.render({
        type: "orders",
        title: "Limit orders",
        orders: resJson.orders,
        cursor: resJson.nextPageCursor,
        size: "lg",
      });
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }
  static async fetchPositions(cursor = "") {
    try {
      const response = await fetch("/position/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cursor,
        }),
      });
      const resJson = await response.json();
      if (!response.ok) {
        alert(resJson.message);
        return false;
      }
      App.modal.render({
        type: "positions",
        title: `Positions, Balance ${resJson.balance.toFixed(2)}$`,
        positions: resJson.positions,
        cursor: resJson.nextPageCursor,
        size: "lg",
      });
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }
  static async fetchWin(cursorLink = "", allCoins = null) {
    try {
      const response = await fetch(`/win-rate/${allCoins ? "" : App.state.symbol}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const resJson = await response.json();
      if (!response.ok) {
        alert(resJson.message);
        return false;
      }
      const { winRate } = resJson;
      App.modal.render({
        type: "win",
        title: `Win rate ${allCoins ? "" : App.state.symbol}`,
        size: "lg",
        winRate,
        allCoins,
      });
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }
  static async fetchHistory(cursorLink = "", allCoins = null) {
    try {
      const response = await fetch(`/positions-history/${allCoins ? "" : App.state.symbol}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cursor: cursorLink,
        }),
      });
      const resJson = await response.json();
      if (!response.ok) {
        alert(resJson.message);
        return false;
      }
      const { positions, cursor } = resJson.closedPositions;
      App.modal.render({
        type: "history",
        title: `Positions history ${allCoins ? "" : App.state.symbol}`,
        size: "lg",
        positions,
        cursor,
        allCoins,
      });
      
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
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
        "/chart/:symbol": ({ data }) => {
          this.router.navigate(`/chart/${data.symbol}/1h`);
        },
        "/chart/:symbol/:timeframe": async ({ data, params }) =>
          await this.handleRoute(data, params),
        "/chart/:symbol/:timeframe/message": async ({ data }) =>
          this.handleMessage(data),
      })
      .resolve();
  }
  defaultRoute() {
    this.navigate(`/chart/BTCUSDT/${App.state.timeframe}`);
  }
  handleMessage(data) {
    App.state.activeTab = data.timeframe;
    this.navigate(`/chart/${data.symbol}/${data.timeframe}`);
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
    const state = {
      symbol: data.symbol || "BTCUSDT",
      timeframe: data.timeframe || "1h",
      intervalKline: intervalKline[data.timeframe],
      markerTime: +params?.time,
      markerPrice: params?.price,
      markerSide: params?.side,
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
  static state = {
    countLoads: 0,
  };
  static analyzeMarketWithRegression(emaValues, options = {}) {
    const {
      lookbackPeriod = 6, // Количество свечей для анализа
      volatilityThreshold = 1.5, // Порог волатильности для боковика (%)
      trendSlopeThreshold = 0.2, // Порог наклона тренда (% за период)
    } = options;

    const data = emaValues.slice(-lookbackPeriod);
    // Линейная регрессия
    const xValues = Array.from({ length: lookbackPeriod }, (_, i) => i);
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = data.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((a, x, i) => a + x * data[i], 0);
    const sumXX = xValues.reduce((a, x) => a + x * x, 0);
    const slope =
      (lookbackPeriod * sumXY - sumX * sumY) /
      (lookbackPeriod * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / lookbackPeriod;
    // Рассчитываем относительный наклон (% за период)
    const firstValue = intercept; // Значение линии регрессии в начале периода
    const lastValue = intercept + slope * (lookbackPeriod - 1);
    const relativeSlope = ((lastValue - firstValue) / firstValue) * 100;
    // Рассчитываем волатильность
    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const volatility = ((maxValue - minValue) / minValue) * 100;
    // Рассчитываем угол наклона в градусах (для визуализации)
    //const angleRad = Math.atan(slope);
    //const angleDeg = angleRad * (180 / Math.PI);
    // Определяем состояние рынка
    let marketCondition;
    if (
      Math.abs(relativeSlope) < trendSlopeThreshold &&
      volatility < volatilityThreshold
    ) {
      marketCondition = "flat";
    } else if (relativeSlope > 0) {
      marketCondition = "uptrend";
    } else {
      marketCondition = "downtrend";
    }
    // Сила тренда/флэта
    let strength;
    if (marketCondition === "flat") {
      strength = volatility < volatilityThreshold / 2 ? "strong" : "moderate";
    } else {
      const absSlope = Math.abs(relativeSlope);
      if (absSlope > trendSlopeThreshold * 3) strength = "strong";
      else if (absSlope > trendSlopeThreshold * 1.5) strength = "moderate";
      else strength = "weak";
    }

    return {
      marketCondition,
      strength,
      regressionSlope: slope,
      relativeSlope: parseFloat(relativeSlope.toFixed(3)),
      volatility: parseFloat(volatility.toFixed(3)),
      lookbackPeriod,
      trendSlopeThreshold,
      firstRegressionValue: firstValue,
      lastRegressionValue: lastValue,
      actualFirstValue: data[0],
      actualLastValue: data[data.length - 1],
      regressionValues: xValues.map((x) => intercept + slope * x),
    };
  }
  static findExtremeCandles(candles) {
    if (candles.length === 0)
      return { maxHighCandle: null, minLowCandle: null };

    const initial = {
      maxHighCandle: candles[0],
      minLowCandle: candles[0],
    };

    return candles.reduce((acc, candle) => {
      // Обновляем свечу с максимальным high
      if (candle.high > acc.maxHighCandle.high) {
        acc.maxHighCandle = candle;
      }
      // Обновляем свечу с минимальным low
      if (candle.low < acc.minLowCandle.low) {
        acc.minLowCandle = candle;
      }
      return acc;
    }, initial);
  }

  static calculateLevels(
    candles,
    candlesCount = 24,
    tolerancePercent = 1,
    touchCount = 5,
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
    const { maxHighCandle, minLowCandle } =
      Indicators.findExtremeCandles(candlesSlice);
    ChartManager.state.markerSeries.setMarkers([]);
    ChartManager.state.markLevels = [];
    // Рассчитываем уровень сопротивления
    App.state.resistance = 0;
    let checkPercent = 0;
    do {
      const lineCross = maxHighCandle.high * (1 - checkPercent / 100);
      const touchesHigh = candlesSlice.filter(
        (candle) => lineCross <= candle.high,
      ).length;
      if (touchesHigh >= touchCount) {
        App.state.resistance = lineCross;
        break;
      }
      checkPercent += 0.01;
    } while (checkPercent < tolerancePercent);
    // Рассчитываем уровень поддержки
    App.state.support = 0;
    checkPercent = 0;
    do {
      const lineCross = minLowCandle.low * (1 + checkPercent / 100);
      const touchesLow = candlesSlice.filter(
        (candle) => lineCross >= candle.low,
      ).length;
      if (touchesLow >= touchCount) {
        App.state.support = lineCross;
        break;
      }
      checkPercent += 0.01;
    } while (checkPercent <= tolerancePercent);
    const firstEma21 =
      firstIndex -
      (ChartManager.state.candles.length -
        ChartManager.state.emaData21.length +
        1);
    const lastEma21 =
      lastIndex -
      (ChartManager.state.candles.length -
        ChartManager.state.emaData21.length +
        1);
    const ema21Slice = ChartManager.state.emaData21
      .slice(firstEma21, lastEma21)
      .map((v) => v.value);
    const analysis = Indicators.analyzeMarketWithRegression(ema21Slice, {
      lookbackPeriod: 6,
      volatilityThreshold: 0.6,
      trendSlopeThreshold: 0.4,
    });
    App.chartManager.levelInfoContainer.textContent =
      `${analysis.marketCondition} (${analysis.strength}) ` +
      `6 0.6 0.4 Slope ${analysis.relativeSlope}% Volat ${analysis.volatility}%`;
    ChartManager.state.markLevels.push({
      time: firstCandle.time,
      position: firstCandle.high > lastCandle.high ? "aboveBar" : "belowBar",
      color: "black",
      shape: firstCandle.high > lastCandle.high ? "arrowDown" : "arrowUp",
      //text: `${analysis.marketCondition} (${analysis.strength})`,
    });
    ChartManager.state.markLevels.push({
      time: lastCandle.time,
      position: firstCandle.high < lastCandle.high ? "aboveBar" : "belowBar",
      color: "black",
      shape: firstCandle.high < lastCandle.high ? "arrowDown" : "arrowUp",
      text: `${new Date(lastCandle.time * 1000).toLocaleTimeString()}`,
    });
    ChartManager.state.markerSeries.setMarkers(ChartManager.state.markLevels);
    ChartManager.state.markerRsi.setMarkers([]);
    ChartManager.state.markRSI = [];
    ChartManager.state.markRSI.push({
      time: firstCandle.time,
      position: firstCandle.high > lastCandle.high ? "aboveBar" : "belowBar",
      color: "blue",
      shape: firstCandle.high > lastCandle.high ? "arrowDown" : "arrowUp",
      text: `${ChartManager.state.rsi[firstIndex - 14].value.toFixed(1)}`,
    });
    ChartManager.state.markRSI.push({
      time: lastCandle.time,
      position: firstCandle.high < lastCandle.high ? "aboveBar" : "belowBar",
      color: "blue",
      shape: firstCandle.high < lastCandle.high ? "arrowDown" : "arrowUp",
      text: `${ChartManager.state.rsi[lastIndex - 14 - 1].value.toFixed(1)}, ${new Date(lastCandle.time * 1000).toLocaleTimeString()}`,
    });
    //ChartManager.state.markerRsi.setMarkers(ChartManager.state.markRSI);
    //resistance line
    const resistanceV = App.state.resistance || maxHighCandle.high;
    ChartManager.state.linesSr[1].line.applyOptions({
      price: resistanceV,
      color: App.state.resistance ? "red" : "black",
      //lineStyle: resistance ? 1 : 2,
      lineVisible: true,
      axisLabelVisible: true,
    });
    //support line
    const supportV = App.state.support || minLowCandle.low;
    ChartManager.state.linesSr[0].line.applyOptions({
      price: supportV,
      color: App.state.support ? "green" : "black",
      //lineStyle: support ? 1 : 2,
      lineVisible: true,
      axisLabelVisible: true,
      title: `${(((resistanceV - supportV) / supportV) * 100).toFixed(2)}%`,
    });
    // const coordinateY = ChartManager.state.candlestickSeries.priceToCoordinate(
    //   Math.max(firstCandle.high, lastCandle.high),
    // );
    // const coordinateX = ChartManager.state.chart
    //   .timeScale()
    //   .timeToCoordinate(firstCandle.time);
    //Indicators.renderMarkersRSI(lastIndex);
  }
  //render markers bmw
  static renderMarkersRSI(lastIndex) {
    const lastRsiEma =
      ChartManager.state.rsiEMA[lastIndex - 14 - ChartManager.state.rsiPeriod];
    const firstRsiEma =
      ChartManager.state.rsiEMA[lastIndex - 14 - ChartManager.state.rsiPeriod];
    const lastRsi = ChartManager.state.rsi[lastIndex - 14 - 1];
    const firstRsi = ChartManager.state.rsi[lastIndex - 14 - 2];
    //const currentPrice = ChartManager.state.candles[lastIndex - 1].close;
    //set markers to rsi ema
    ChartManager.state.markerRsi.setMarkers([]);
    ChartManager.state.markRSI = [];
    //bmw series
    if (firstRsiEma && lastRsiEma && firstRsi && lastRsi) {
      // const rsiPercentFirst =
      //   ((firstRsi.value - firstRsiEma.value) / firstRsiEma.value) * 100;
      const rsiPercentLast =
        ((lastRsi.value - lastRsiEma.value) / lastRsiEma.value) * 100;
      const trend =
        ((lastRsiEma.value - firstRsiEma.value) / firstRsiEma.value) * 100;
      ChartManager.state.markRSI.push({
        price:
          rsiPercentLast < 0 ? lastRsiEma.value * 1.1 : lastRsiEma.value * 0.9,
        time: lastRsi.time,
        position: rsiPercentLast > 0 ? "atPriceBottom" : "atPriceTop",
        color: "black",
        shape: "circle",
        text: `Trend ${trend.toFixed(2)}`,
      });
    }
    ChartManager.state.markerRsi.setMarkers(ChartManager.state.markRSI);
  }
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
    if (candles.length < longPeriod + signalPeriod) return [];
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
    markerSeries: null,
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
    orders: [],
    positions: [],
    messages: [],
    markers: [],
  };
  constructor() {
    this.container = document.getElementById("chart");
    this.volumeContainer = document.getElementById("volumeEl");
    this.candleContainer = document.getElementById("candleEl");
    this.levelInfoContainer = document.getElementById("levelEl");
    this.prevSymbolKlineTopic = null;
    this.ws = new WebSocket("wss://stream.bybit.com/v5/public/linear");
    this.activeSubscriptions = new Set();
  }

  init() {
    ChartManager.state.chart = window.LightweightCharts.createChart(
      this.container,
      {
        //width: this.container.offsetWidth,
        height: document.documentElement.scrollHeight - 110,
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
        lineStyle: 3,
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
        lineStyle: 3,
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
    ChartManager.state.rsiSeriesEMA = ChartManager.state.chart.addSeries(
      window.LightweightCharts.LineSeries,
      {
        color: "green",
        lineWidth: 2,
        priceLineVisible: false,
      },
      1,
    );
    ChartManager.state.markerRsi = window.LightweightCharts.createSeriesMarkers(
      ChartManager.state.rsiSeries,
    );
    ChartManager.state.rsiSeries.createPriceLine({
      price: 30,
      color: "black",
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
      color: "black",
      lineWidth: 2,
      lineStyle: 1,
      axisLabelVisible: false,
    });
    ChartManager.state.chart
      .panes()[0]
      .setHeight(document.documentElement.scrollHeight - 300);
    ChartManager.state.chart.subscribeClick(this.defaultAlerts);
    ChartManager.state.chart.subscribeCrosshairMove(this.handleCrosshairMove);
    ChartManager.state.chart.subscribeDblClick(this.handleDblClick);
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
    for (const alert of ChartManager.state.positions) {
      if (ChartManager.state.selectedAlert === alert.name) {
        ChartManager.state.isDroped = false;
      }
    }
  }
  async dropAlert() {
    ChartManager.state.isDroped = true;
    //save alert
    const alertName = ChartManager.state.selectedAlert;
    ChartManager.state.selectedAlert = null;
    if (alertName) {
      //save alert
      for (const alert of ChartManager.state.alerts) {
        if (alertName === alert.name) {
          await this.saveAlert(
            App.state.symbol,
            alertName,
            ChartManager.state.currentPriceMove,
          );
        }
      }
      //change tp sl Long
      const positionLong = ChartManager.state.positions.find(
        (p) => p.side === "Buy",
      );
      const price = ChartManager.state.currentPriceMove;
      if (positionLong && (alertName === "slLong" || alertName === "tpLong")) {
        const { avgPrice, side, stopLoss, takeProfit } = positionLong;
        const stopLossNew = ChartManager.state.positions
          .find((p) => p.name === "slLong")
          .line.options()
          .price.toFixed(App.state.priceScale);
        const takeProfitNew = ChartManager.state.positions
          .find((p) => p.name === "tpLong")
          .line.options()
          .price.toFixed(App.state.priceScale);
        const pricePercent = ((price - avgPrice) / avgPrice) * 100;
        if (pricePercent < -1.5 && alertName === "slLong") {
          ChartManager.state.positions
            .find((p) => p.name === "slLong")
            .line.applyOptions({
              price: stopLoss,
              title: `SL/Short: ${(((stopLoss - avgPrice) / avgPrice) * 100).toFixed(2)}%`,
            });
          return alert("SL Long > 1.5%!!!");
        }
        const params = { side };
        if (alertName === "slLong") {
          if (stopLossNew === stopLoss) {
            return;
          }
          params.stopLoss = stopLossNew;
        } else {
          if (takeProfitNew === takeProfit) {
            return;
          }
          params.takeProfit = takeProfitNew;
        }
        try {
          const response = await fetch(
            `/position/edit/${alertName === "slLong" ? "sl" : "tp"}/${App.state.symbol}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(params),
            },
          );
          const resJson = await response.json();
          if (!response.ok) {
            alert(resJson.message);
            return false;
          }
        } catch (error) {
          alert(`Error: ${error.message}`);
        }
      }
      //change tp sl Short
      const positionShort = ChartManager.state.positions.find(
        (p) => p.side === "Sell",
      );
      if (
        positionShort &&
        (alertName === "slShort" || alertName === "tpShort")
      ) {
        const { avgPrice, side, stopLoss, takeProfit } = positionShort;
        const stopLossNew = ChartManager.state.positions
          .find((p) => p.name === "slShort")
          .line.options()
          .price.toFixed(App.state.priceScale);
        const takeProfitNew = ChartManager.state.positions
          .find((p) => p.name === "tpShort")
          .line.options()
          .price.toFixed(App.state.priceScale);
        const pricePercent = ((price - avgPrice) / avgPrice) * 100;
        if (pricePercent > 1.5 && alertName === "slShort") {
          ChartManager.state.positions
            .find((p) => p.name === "slShort")
            .line.applyOptions({
              price: stopLoss,
              title: `SL/Short: ${(((stopLoss - avgPrice) / avgPrice) * 100).toFixed(2)}%`,
            });
          return alert("SL Short > 1.5%!!!");
        }
        const params = { side };
        if (alertName === "slShort") {
          if (stopLossNew === stopLoss) {
            return;
          }
          params.stopLoss = stopLossNew;
        } else {
          if (takeProfitNew === takeProfit) {
            return;
          }
          params.takeProfit = takeProfitNew;
        }
        try {
          const response = await fetch(
            `/position/edit/${alertName === "slShort" ? "sl" : "tp"}/${App.state.symbol}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(params),
            },
          );
          const resJson = await response.json();
          if (!response.ok) {
            alert(resJson.message);
            return false;
          }
        } catch (error) {
          alert(`Error: ${error.message}`);
        }
      }
    }
    this.defaultAlerts();
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
  //save alerts
  async saveAlert(symbol, alertName, alertValue) {
    const response = await fetch(`/edit-alert/${symbol}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
      App.state.priceScale = priceScale;
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
      this.updateData(formattedData);
      ChartManager.state.chart.timeScale().scrollToPosition(10);
      //load Alerts
      await App.loadAlerts();
      this.updateWebsocketSymbol();
    } catch (error) {
      alert(`Error loading chart data:, ${error}`);
      console.error("Error loading chart data:", error);
    }
  }
  checkHover(checkPrice, lines) {
    if (ChartManager.state.isDroped) {
      for (const alert of lines) {
        const tolerancePercentHover =
          App.state.timeframe === "1d" || App.state.timeframe === "1w"
            ? 1.5
            : App.state.timeframe === "2h" || App.state.timeframe === "4h"
              ? 1.2
              : 1;
        const isAlertHover =
          alert.name &&
          alert.line.options().lineVisible &&
          alert.line.options().price &&
          Math.abs((alert.line.options().price - checkPrice) / checkPrice) *
            100 <=
            tolerancePercentHover;
        if (isAlertHover) {
          ChartManager.state.hoveredAlert = alert.name;
          alert.line.applyOptions({
            color: "orange",
          });
          this.container.style.cursor = "pointer";
          return true;
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
        priceElem.textContent = `$${close}`;
      }
      if (changeElem && close) {
        const change = parseFloat(((close - open) / open) * 100);
        if (change > 0) {
          changeElem.classList.remove("text-danger");
          changeElem.classList.add("text-success");
        } else {
          changeElem.classList.remove("text-success");
          changeElem.classList.add("text-danger");
        }
        changeElem.textContent = `${change.toFixed(2)}%`;
      }
    }
  }
  updateData(history) {
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
      //const adxData = Indicators.calculateBaseIndicators(history);
      ChartManager.state.rsiSeries.setData(ChartManager.state.rsi);
      ChartManager.state.rsiPeriod = 14;
      ChartManager.state.rsiEMA = Indicators.calculateEMA(
        ChartManager.state.rsi,
        ChartManager.state.rsiPeriod,
      );
      ChartManager.state.rsiSeriesEMA.setData(ChartManager.state.rsiEMA);
    }
    //scroll chart
    // ChartManager.state.chart
    //   .timeScale()
    //   .setVisibleLogicalRange({ from: 0, to: 50 });
  }
  updateRealtime(newCandle) {
    if (!ChartManager.state.point) {
      //const date = new Date(newCandle.time * 1000).toLocaleString("ru-RU");
      App.chartManager.volumeContainer.textContent = `Volume: ${ChartManager.state.volumeSeries.priceFormatter().format(newCandle.volume)}`;
      App.chartManager.candleContainer.textContent = `L${newCandle.low}$ H${newCandle.high}$ (${newCandle.close > newCandle.open ? `+${(((newCandle.high - newCandle.low) / newCandle.low) * 100).toFixed(2)}` : `${(((newCandle.low - newCandle.high) / newCandle.high) * 100).toFixed(2)}`}%)`;
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
      const rsiEma = Indicators.calculateEMA(rsi, ChartManager.state.rsiPeriod);
      ChartManager.state.rsiSeriesEMA.update(rsiEma[rsiEma.length - 1]);
    }
    //positions
    const positionLong = ChartManager.state.positions.find(
      (p) => p.side === "Buy",
    );
    if (positionLong) {
      const pnl = positionLong.size * (newCandle.close - positionLong.avgPrice);
      const pnlPercent = Math.abs(
        ((newCandle.close - positionLong.avgPrice) / positionLong.avgPrice) *
          100,
      );
      positionLong.line.applyOptions({
        title: `Long ${pnl.toFixed(2)}$ (${pnlPercent.toFixed(2)}%)`,
      });
    }
    const positionShort = ChartManager.state.positions.find(
      (p) => p.side === "Sell",
    );
    if (positionShort) {
      const pnl =
        positionShort.size * (positionShort.avgPrice - newCandle.close);
      const pnlPercent =
        ((newCandle.close - positionShort.avgPrice) / positionShort.avgPrice) *
        100;
      positionShort.line.applyOptions({
        title: `Short: ${pnl.toFixed(2)}$ (${pnlPercent.toFixed(2)}%)`,
      });
    }
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
      App.chartManager.candleContainer.textContent = `L${candle.low}$ H${candle.high}$ (${candle.close > candle.open ? `+${(((candle.high - candle.low) / candle.low) * 100).toFixed(2)}` : `${(((candle.low - candle.high) / candle.high) * 100).toFixed(2)}`}%)`;
    }
    //update volume
    if (param.time) {
      const datapoints = param.seriesData.get(ChartManager.state.volumeSeries);
      if (datapoints) {
        App.chartManager.volumeContainer.textContent = `Volume: ${ChartManager.state.volumeSeries.priceFormatter().format(datapoints.value)}`;
      }
    }
    //price lines
    if (ChartManager.state.candlestickSeries) {
      ChartManager.state.currentPriceMove =
        param.paneIndex === 0
          ? ChartManager.state.candlestickSeries.coordinateToPrice(
              param.point.y,
            )
          : ChartManager.state.rsiSeries.coordinateToPrice(param.point.y);
      //App.state.hideAlerts
      if (ChartManager.state.currentPriceMove > 0) {
        App.chartManager.checkHover(ChartManager.state.currentPriceMove, [
          ...ChartManager.state.alerts,
          ...ChartManager.state.linesSr,
          ...ChartManager.state.positions,
        ]);
      }
      //!ChartManager.state.hideSr
      // if (!hoverFind && ChartManager.state.currentPriceMove > 0) {
      //   App.chartManager.checkHover(
      //     ChartManager.state.currentPriceMove,
      //     ChartManager.state.linesSr,
      //   );
      // }
      //sl tp lines
      //!App.state.hideAlerts &&
      //ChartManager.state.hideSr &&
      // if (ChartManager.state.currentPriceMove > 0) {
      //   App.chartManager.checkHover(
      //     ChartManager.state.currentPriceMove,
      //     ChartManager.state.positions,
      //   );
      // }
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
          title: `${(((resistance - support) / support) * 100).toFixed(2)}%`,
        });
        ChartManager.state.chart.applyOptions({
          handleScroll: false,
          handleScale: false,
        });
        return;
      }
    }
    //sl tp live update
    const price = ChartManager.state.currentPriceMove;
    const positionLong = ChartManager.state.positions.find(
      (p) => p.side === "Buy",
    );
    if (
      positionLong &&
      ["slLong", "tpLong"].includes(ChartManager.state.selectedAlert)
    ) {
      const { avgPrice } = positionLong;
      const pricePercent = ((price - avgPrice) / avgPrice) * 100;
      if (ChartManager.state.selectedAlert === "slLong") {
        ChartManager.state.positions
          .find((p) => p.name === "slLong")
          .line.applyOptions({
            price,
            title: `SL/Long: ${pricePercent.toFixed(2)}%`,
          });
      }
      if (ChartManager.state.selectedAlert === "tpLong") {
        ChartManager.state.positions
          .find((p) => p.name === "tpLong")
          .line.applyOptions({
            price,
            title: `TP/Long: ${pricePercent.toFixed(2)}%`,
          });
      }
      ChartManager.state.chart.applyOptions({
        handleScroll: false,
        handleScale: false,
      });
      return;
    }
    const positionShort = ChartManager.state.positions.find(
      (p) => p.side === "Sell",
    );
    if (
      positionShort &&
      ["slShort", "tpShort"].includes(ChartManager.state.selectedAlert)
    ) {
      const { avgPrice } = positionShort;
      const pricePercent = ((price - avgPrice) / avgPrice) * 100;
      if (ChartManager.state.selectedAlert === "slShort") {
        ChartManager.state.positions
          .find((p) => p.name === "slShort")
          .line.applyOptions({
            price,
            title: `SL/Short: ${pricePercent.toFixed(2)}%`,
          });
      }
      if (ChartManager.state.selectedAlert === "tpShort") {
        ChartManager.state.positions
          .find((p) => p.name === "tpShort")
          .line.applyOptions({
            price,
            title: `TP/Short: ${pricePercent.toFixed(2)}%`,
          });
      }
      ChartManager.state.chart.applyOptions({
        handleScroll: false,
        handleScale: false,
      });
      return;
    }
  }
  defaultAlerts() {
    for (const alert of ChartManager.state.alerts) {
      alert.line.applyOptions({
        color:
          alert.name === "alert0" ||
          alert.name === "alert5" ||
          alert.name === "alert6"
            ? "red"
            : "blue",
      });
    }
    ChartManager.state.positions
      .find((p) => p.name === "slShort")
      ?.line.applyOptions({
        color: "red",
      });
    ChartManager.state.positions
      .find((p) => p.name === "tpShort")
      ?.line.applyOptions({
        color: "red",
      });
    ChartManager.state.positions
      .find((p) => p.name === "slLong")
      ?.line.applyOptions({
        color: "green",
      });
    ChartManager.state.positions
      .find((p) => p.name === "tpLong")
      ?.line.applyOptions({
        color: "green",
      });
    //todo
    // const supportColor = ChartManager.state.linesSr[0].line.options().color;
    // const resistanceColor = ChartManager.state.linesSr[1].line.options().color;
    ChartManager.state.linesSr[0].line.applyOptions({
      color: App.state.support ? "green" : "black",
    });
    ChartManager.state.linesSr[1].line.applyOptions({
      color: App.state.resistance ? "red" : "black",
    });
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
    activeTab: "all",
    hideAlerts: false,
    bsOffcanvas: new window.bootstrap.Offcanvas("#offcanvasResponsive"),
  };

  static async init() {
    this.chartManager = new ChartManager();
    this.router = new Router();
    this.initAutocomplete();
    this.initChart();
    await this.loadCoins();
    this.initEventListeners();
    this.modal = new ModalManager();
    this.order = new Order();
    // Помощники Handlebars
    window.Handlebars.registerHelper("multiply", function (a, b) {
      return (a * b).toFixed(2);
    });

    window.Handlebars.registerHelper("changepercent", function (a, b) {
      return (((a - b) / b) * 100).toFixed(2);
    });

    window.Handlebars.registerHelper("formatPrice", function (a) {
      return (+a).toFixed(2);
    });

    window.Handlebars.registerHelper("eq", function (a, b) {
      return a === b;
    });

    window.Handlebars.registerHelper("gt", function (a, b) {
      return a > b;
    });

    window.Handlebars.registerHelper("contains", function (array, value) {
      return array.includes(value);
    });

    window.Handlebars.registerHelper("formatDate", function (dateString) {
      if (!dateString) return "";
      const date = new Date(+dateString);
      return date.toLocaleString("ru-RU");
    });
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
              `/chart/${symbol}${symbol.endsWith("USDT") ? "" : "USDT"}/${App.state.timeframe}`,
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
            `/chart/${symbol}${symbol.endsWith("USDT") ? "" : "USDT"}/${App.state.timeframe}`,
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
      //this.updatePagination();
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
      //this.updatePagination();
    } catch (error) {
      console.error("Error loading Bybit coins:", error);
    }
  }
  static renderCoinList() {
    const coinList = document.querySelector(".coin-list");
    //set active coin
    const templateHbs = window.Handlebars.templates["coins-list"];
    this.state.coins = this.state.coins.map((coin) => ({
      ...coin,
      active: this.state.symbol === coin.symbol,
    }));
    //render
    coinList.innerHTML = templateHbs({
      coins: this.state.coins,
      cursorPrev: !this.state.cursorPrev,
      cursorNext: !this.state.cursorNext,
    });
    //ws subs
    this.chartManager.updateWebsocketSubs();
  }

  static setState(newState) {
    this.state = { ...this.state, ...newState };
    document.querySelector(".hide-btn").textContent = this.state.hideAlerts
      ? "📝"
      : "🔏";
  }
  static async renderChart() {
    await this.chartManager.loadChartData();
  }
  static hideAlerts() {
    this.state.hideAlerts = !this.state.hideAlerts;
    for (const alert of ChartManager.state.positions) {
      alert.line.applyOptions({
        lineVisible: !this.state.hideAlerts,
        axisLabelVisible: !this.state.hideAlerts,
      });
    }
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
    Indicators.state.countLoads = 0;
    //get alerts
    const alertsData = await fetch(`/alerts/${App.state.symbol}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        defaultAlerts,
      }),
    });
    const alertsDataJson = await alertsData.json();
    if (!alertsData.ok) {
      alert(alertsDataJson.message);
      return false;
    }
    //Level SR
    //App.state.patternLevel = alertsDataJson.patterns?.levels;
    // if (App.state.patternLevel) {
    //   const { candlesCount, tolerancePercent, touchCount } =
    //     App.state.patternLevel;
    //   Indicators.calculateLevels(
    //     ChartManager.state.candles,
    //     candlesCount,
    //     tolerancePercent,
    //     touchCount,
    //   );
    //   const paramsSR = `${App.state.symbol} ${candlesCount}, ${tolerancePercent}, ${touchCount}`;
    //   document.querySelector(".display-symbol").textContent = paramsSR;
    // } else {
    //set default value levels pattern
    App.state.patternLevel = {
      candlesCount: 18,
      tolerancePercent: 1,
      touchCount: 4,
    };
    const { candlesCount, tolerancePercent, touchCount } =
      App.state.patternLevel;
    Indicators.calculateLevels(
      ChartManager.state.candles,
      candlesCount,
      tolerancePercent,
      touchCount,
    );
    document.querySelector(".display-symbol").textContent =
      `${App.state.symbol} ${candlesCount}, ${tolerancePercent}, ${touchCount}`;
    //}
    //event click coin then load data from alert endpoint
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
      //add loaded coin
      if (!this.state.coins.find((coin) => coin.symbol === this.state.symbol)) {
        //TODO show only one coin!!!
        const loadedCoin = {
          symbol: this.state.symbol,
          ...alertsDataJson,
          loaded: true,
        };
        if (this.state.coins.length > 0 && this.state.coins[0].loaded) {
          this.state.coins[0] = loadedCoin;
        } else {
          this.state.coins.unshift(loadedCoin);
        }
      }
      //render new data
      this.renderCoinList();
    }
    App.state.item = false;
    //SHOW limit orders in chart
    Order.orderPriceLines(alertsDataJson.orders);
    //SHOW positions in chart
    Order.positionPriceLines(alertsDataJson.positions);
    //clear alerts
    if (ChartManager.state.alerts.length) {
      for (const [index, alert] of ChartManager.state.alerts.entries()) {
        if (index <= 5) {
          ChartManager.state.candlestickSeries.removePriceLine(alert.line);
        } else {
          ChartManager.state.rsiSeries.removePriceLine(alert.line);
        }
      }
    }
    ChartManager.state.alerts = [];
    for (const [index, value] of alertsDataJson.alerts.entries()) {
      if (index <= 5) {
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
      } else {
        ChartManager.state.alerts.push({
          name: `alert${index}`,
          line: ChartManager.state.rsiSeries.createPriceLine({
            price: value,
            color: index === 6 ? "red" : "blue",
            lineWidth: 2,
            lineStyle: window.LightweightCharts.LineStyle.Dashed,
            title: index + 1,
            lineVisible: this.state.hideAlerts,
            axisLabelVisible: this.state.hideAlerts,
          }),
        });
      }
    }
    document
      .querySelector(".reset-btn")
      .classList.toggle("d-none", !alertsDataJson.exists);
    document
      .querySelector(".hide-btn")
      .classList.toggle("d-none", !alertsDataJson.exists);
    this.state.bsOffcanvas.hide();
    //tf active
    document
      .querySelectorAll(".tf-btn")
      .forEach((n) => n.classList.remove("bg-primary"));
    document
      .querySelector(`[data-tf="${App.state.timeframe}"]`)
      ?.classList.add("bg-primary");
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
    if (App.state.patternLevel) {
      const { candlesCount, tolerancePercent, touchCount } =
        App.state.patternLevel;
      Indicators.calculateLevels(
        ChartManager.state.candles,
        candlesCount,
        tolerancePercent,
        touchCount,
      );
    }
  }
  static initEventListeners() {
    //arrows btn
    // Добавляем слушатель события нажатия клавиш
    document.addEventListener("keydown", this.handleKeyPress);
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
        const addBtn = event.target.closest(".add-btn");
        const starBtn = event.target.closest(".star-btn");
        const alertBtn = event.target.closest(".alert-btn");
        const prevBtn = event.target.closest(".prev-btn");
        const nextBtn = event.target.closest(".next-btn");
        if (prevBtn) {
          await this.loadCoins("prev", this.state.cursorPrev);
          return;
        }
        if (nextBtn) {
          await this.loadCoins("next", this.state.cursorNext);
          return;
        }
        const symbol = item.dataset.symbol;
        const coinInList = this.state.coins.find(
          (coin) => coin.symbol === symbol,
        );
        //add ticker
        if (addBtn) {
          const { add } = addBtn.dataset;
          const fieldData = !(add === "true");
          const response = await fetch(`/add/${symbol}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
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
            document.querySelector(".reset-btn").classList.remove("d-none");
            document.querySelector(".hide-btn").classList.remove("d-none");
            coinInList.exists = true;
            await this.loadAlerts();
          } else {
            addBtn.textContent = "➕";
            addBtn.dataset.add = false;
            item.querySelector(".star-btn").classList.add("d-none");
            item.querySelector(".alert-btn").classList.add("d-none");
            document.querySelector(".reset-btn").classList.add("d-none");
            document.querySelector(".hide-btn").classList.add("d-none");
            coinInList.exists = false;
          }
          return;
        }
        if (starBtn) {
          const { star } = starBtn.dataset;
          const fieldData = !(star === "true");
          const response = await fetch(`/edit/${symbol}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
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
          coinInList.star = fieldData;
          starBtn.innerText = fieldData ? "❤️" : "🖤";
          return;
        }
        if (alertBtn) {
          const { alert } = alertBtn.dataset;
          const fieldData = !(alert === "true");
          const response = await fetch(`/edit/${symbol}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
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
          alertBtn.dataset.alert = fieldData;
          coinInList.alert = fieldData;
          alertBtn.innerText = fieldData ? "🔔" : "🔕";
          //this.state.alertBtn = true;???
          if (fieldData && this.state.symbol === symbol) {
            this.state.item = item;
            //await this.loadAlerts();
          }
          return;
        }
        if (item) {
          if (this.state.symbol !== symbol) {
            document
              .querySelectorAll(".coin-item")
              .forEach((n) => n.classList.remove("list-group-item-primary"));
            item.classList.add("list-group-item-primary");
            this.state.item = item;
            this.router.navigate(`/chart/${symbol}/${this.state.timeframe}`);
          }
        }
      });

    //short tf
    document.querySelectorAll(".tf-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        document
          .querySelectorAll(".tf-btn")
          .forEach((n) => n.classList.remove("bg-primary"));
        e.target.classList.add("bg-primary");
        const { tf } = event.target.dataset;
        this.router.navigate(`/chart/${this.state.symbol}/${tf}`);
      });
    });
    //move level
    document.querySelectorAll(".level-move-btn").forEach((btn) => {
      btn.addEventListener("click", async (event) => {
        const { key } = event.target.dataset;
        App.handleKeyPress({ key });
      });
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
        ChartManager.state.markerSeries.setMarkers([]);
        ChartManager.state.hideSr = !ChartManager.state.hideSr;
        e.target.textContent = ChartManager.state.hideSr ? "🚫" : "🟰";
        //hide positions
        for (const alert of ChartManager.state.positions) {
          alert.line.applyOptions({
            lineVisible: ChartManager.state.hideSr,
            axisLabelVisible: ChartManager.state.hideSr,
          });
        }
        if (App.state.patternLevel) {
          const { candlesCount, tolerancePercent, touchCount } =
            App.state.patternLevel;
          Indicators.calculateLevels(
            ChartManager.state.candles,
            candlesCount,
            tolerancePercent,
            touchCount,
          );
        }
      });
    //show orders
    document
      .querySelector(".show-orders")
      .addEventListener("click", async (event) => {
        event.preventDefault();
        await Order.fetchOrders();
      });
    //show positions
    document
      .querySelector(".show-positions")
      .addEventListener("click", async (event) => {
        event.preventDefault();
        await Order.fetchPositions();
      });
    //show history
    document
      .querySelector(".show-history")
      .addEventListener("click", async (event) => {
        event.preventDefault();
        await Order.fetchHistory();
      });
    //reset hide info btns
    document.querySelector(".reset-btn").addEventListener("click", async () => {
      await this.loadAlerts(true);
    });
    document.querySelector(".hide-btn").addEventListener("click", async () => {
      this.hideAlerts();
    });
    document.querySelector(".info-btn").addEventListener("click", async () => {
      const symbol = this.state.symbol;
      //GET /v5/market/tickers
      // const responseInfo = await fetch(
      //   `https://api.bybit.com/v5/market/tickers?category=linear&symbol=${App.state.symbol}`,
      // );
      // const dataInfo = await responseInfo.json();
      // if (dataInfo.retCode !== 0) {
      //   throw new Error(`Error API: ${dataInfo.retMsg}`);
      // }
      //const ticker = dataInfo.result.list[0];
      //set title
      App.modal.render({
        type: "links",
        title: "Торговые инструменты",
        data: [
          {
            text: "📈 Bot chart",
            url: `https://cf.rzk.com.ru/${symbol}/1h`,
            blank: true,
          },
          {
            text: "📈 Tradingview chart",
            url: `https://www.tradingview.com/chart/8qtrvOgg/?symbol=BYBIT:${symbol}.P`,
            blank: true,
          },
          {
            text: "🔭 TV Idea",
            url: `https://www.tradingview.com/symbols/${symbol}/ideas`,
            blank: true,
          },
          {
            text: "📟 Bybit",
            url: `https://bybit.onelink.me/EhY6?af_web_dp=https://www.bybit.com/trade/usdt/${symbol}&af_xp=custom&pid=tradegpt&c=tele_share&af_dp=bybitapp://open/home?tab=2&symbol=${symbol}&page=chart&type=usdt&&source=GPT&orderType=Limit&af_force_deeplink=true`,
            blank: true,
          },
          {
            text: "@DevBot",
            url: `https://t.me/WarsawDevBot?start=${symbol}`,
            blank: true,
          },
        ],
        //size: "lg",
      });
    });
  }
}

// Инициализация приложения
App.init();
