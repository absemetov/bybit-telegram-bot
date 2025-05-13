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
                <label class="form-label">Take Profit (%)</label>
                <input type="number" class="form-control" name="takeProfit" value="5" step="0.1" required>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label">Stop Loss (%)</label>
                <input type="number" class="form-control" name="stopLoss" value="1" step="0.1" max="2" required>
            </div>
        </div>
        <div class="d-grid gap-2">
          <button type="submit" class="btn btn-{{buttonType}}">{{buttonText}}</button>
        </div>
      </form>`),
      orders: window.Handlebars.compile(`
      <a href="#" class="order-item get-orders">
        Update
      </a>
      <div class="list-group">
        {{#each orders}}
          <div class="list-group-item list-group-item-{{color}} order-item cursor-pointer" data-symbol="{{symbol}}">
            <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                  {{localTime}} {{symbol}} {{side}}
                </div>
                <div class="text-end">
                  {{price}} = {{sum}}$
                    <div class="btn-group" role="group" aria-label="Basic example">
                      <button type="button" class="btn btn-sm btn-light cancel-order" data-order-id="{{orderId}}" data-price="{{price}}" data-side="{{side}}">🗑</button>
                    </div>
                </div>
            </div>
          </div>
        {{/each}}
      </div>
        {{#if cursor}}
          <a href="#" class="order-item get-orders" data-cursor="{{cursor}}">
            Next
          </a>
        {{/if}}`),
      positions: window.Handlebars.compile(`
        <a href="#" class="position-item get-positions">
          Update
        </a>
        <div class="list-group">
          {{#each positions}}
            <div class="list-group-item list-group-item-{{color}} position-item cursor-pointer" data-symbol="{{symbol}}">
              <div class="d-flex w-100 justify-content-between align-items-center">
                  <div class="d-flex align-items-center">
                    {{localTime}} {{size}} {{symbol}} {{side}}
                    Pnl {{unrealisedPnl}}$ Pos {{positionValue}}$ {{avgPrice}} {{markPrice}}
                  </div>
                  <div class="text-end">
                    <div class="btn-group" role="group" aria-label="Basic example">
                      <button type="button" class="btn btn-sm btn-light cancel-position" data-side="{{side}}" data-qty="{{size}}">🗑</button>
                    </div>
                  </div>
              </div>
            </div>
          {{/each}}
        </div>
        {{#if cursor}}
          <a href="#" class="position-item get-positions" data-cursor="{{cursor}}">
            Next
          </a>
        {{/if}}`),
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
          // links: config.data.map((link) => ({
          //   ...link,
          //   icon: this._getIcon(link.type),
          // })),
        });
      case "order-form":
        return this.templates.orderForm({
          buttonType: config.orderType === "long" ? "success" : "danger",
          buttonText: config.orderType.toUpperCase(),
        });
      case "orders":
        return this.templates.orders({
          orders: config.orders.map((order) => ({
            ...order,
            color: order.side === "Buy" ? "success" : "danger",
          })),
          cursor: config.cursor,
        });
      case "positions":
        return this.templates.positions({
          positions: config.positions.map((position) => ({
            ...position,
            color: position.unrealisedPnl > 0 ? "success" : "danger",
          })),
          cursor: config.cursor,
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
    const orderElement = e.target.closest(".order-item");
    if (orderElement) {
      this._handleOrderClick(orderElement, e);
    }
    const positionElement = e.target.closest(".position-item");
    if (positionElement) {
      this._handlePositionClick(positionElement, e);
    }
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
            //size: "lg",
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
    const { side, symbol, price } = Order.state;
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
        }),
      });
      const resJson = await response.json();
      if (!response.ok) {
        alert(resJson.message);
        return false;
      }
      alert(`Order created ${resJson.orderId}`);
      //this.modal.hide();
      this.render({
        type: "orders",
        title: "Limit orders",
        orders: resJson.orders,
        cursor: resJson.nextPageCursor,
        //size: "lg",
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
    ORDER_SIZE: 50,
    TAKE_PROFIT: 5,
    STOP_LOSS: 1,
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
      App.modal.render({
        type: "order-form",
        title: `LONG ${Order.state.symbol} ${Order.state.price.toFixed(5)}$`,
        orderType: "long",
        //size: "sm",
      });
    });
    //short btn
    document.querySelector(".short-btn").addEventListener("click", async () => {
      Order.state.side = "Sell";
      Order.state.symbol = App.state.symbol;
      Order.state.price = ChartManager.state.linesSr[1].line.options().price;
      App.modal.render({
        type: "order-form",
        title: `SHORT ${Order.state.symbol} ${Order.state.price.toFixed(5)}$`,
        orderType: "short",
        //size: "sm",
      });
    });
  }
  //render position price lines
  static async positionPriceLines(positions) {
    for (const positionsLine of ChartManager.state.positions) {
      ChartManager.state.candlestickSeries.removePriceLine(positionsLine);
    }
    for (const position of positions) {
      const { avgPrice, side, size, unrealisedPnl, stopLoss, takeProfit } =
        position;
      ChartManager.state.positions.push(
        ChartManager.state.candlestickSeries.createPriceLine({
          price: avgPrice,
          color: side === "Sell" ? "red" : "green",
          lineWidth: 2,
          lineStyle: 4,
          title: `Pnl:${side} ${size.toFixed(2)} ${unrealisedPnl.toFixed(2)}$`,
          //lineVisible: false,
          //axisLabelVisible: false,
        }),
      );
      ChartManager.state.positions.push(
        ChartManager.state.candlestickSeries.createPriceLine({
          price: stopLoss,
          color: side === "Sell" ? "red" : "green",
          lineWidth: 2,
          lineStyle: 4,
          title: "SL",
          //lineVisible: false,
          //axisLabelVisible: false,
        }),
      );
      ChartManager.state.positions.push(
        ChartManager.state.candlestickSeries.createPriceLine({
          price: takeProfit,
          color: side === "Sell" ? "red" : "green",
          lineWidth: 2,
          lineStyle: 4,
          title: "TP",
          //lineVisible: false,
          //axisLabelVisible: false,
        }),
      );
    }
  }
  //render price liens
  static orderPriceLines(orders) {
    for (const orderLine of ChartManager.state.orders) {
      ChartManager.state.candlestickSeries.removePriceLine(orderLine);
    }
    for (const limitOrder of orders) {
      const { price, side, sum } = limitOrder;
      ChartManager.state.orders.push(
        ChartManager.state.candlestickSeries.createPriceLine({
          price,
          color: side === "Sell" ? "red" : "green",
          lineWidth: 2,
          lineStyle: 2,
          title: `L:${side} ${sum.toFixed(2)}$`,
          //lineVisible: false,
          //axisLabelVisible: false,
        }),
      );
    }
  }
  //render messages liens
  static messagePriceLines(messages) {
    for (const message of messages) {
      const { price, timeframe, lastNotified } = message;
      ChartManager.state.messages.push(
        ChartManager.state.candlestickSeries.createPriceLine({
          price,
          color: timeframe.endsWith("R") ? "red" : "green",
          lineWidth: 2,
          lineStyle: 1,
          title: timeframe.split("_")[0],
          lineVisible: ChartManager.state.hideMsg,
          axisLabelVisible: ChartManager.state.hideMsg,
        }),
      );
      ChartManager.state.markers.push({
        time: lastNotified._seconds,
        //position: timeframe.endsWith("R") ? "atPriceTop" : "atPriceBottom",
        position: timeframe.endsWith("R") ? "aboveBar" : "belowBar",
        color: timeframe.endsWith("R") ? "red" : "green",
        shape: timeframe.endsWith("R") ? "arrowDown" : "arrowUp",
        //size: 1.5,
        //price,
        text: timeframe.split("_")[0],
      });
    }
    //notify marker
    if (App.state.markerPrice && App.state.markerTime) {
      ChartManager.state.messages.push(
        ChartManager.state.candlestickSeries.createPriceLine({
          price: App.state.markerPrice,
          color: "black",
          lineWidth: 2,
          lineStyle: 1,
          title: "Level",
          lineVisible: ChartManager.state.hideMsg,
          axisLabelVisible: ChartManager.state.hideMsg,
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
    }
    if (ChartManager.state.hideMsg) {
      ChartManager.state.markerSeries.setMarkers(ChartManager.state.markers);
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
        //size: "lg",
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
        //size: "lg",
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
      //lineStyle: resistance ? 1 : 2,
      lineVisible: true,
      axisLabelVisible: true,
    });
    resistance = resistance || highs[highs.length - 1];
    //support line
    const supportV = support || lows[0];
    ChartManager.state.linesSr[0].line.applyOptions({
      price: support || lows[0],
      color: support ? "green" : "black",
      //lineStyle: support ? 1 : 2,
      lineVisible: true,
      axisLabelVisible: true,
      title: `${(((resistance - supportV) / supportV) * 100).toFixed(2)}%`,
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
    hideSr: true,
    linesSr: [],
    orders: [],
    positions: [],
    messages: [],
    hideMsg: true,
    markers: [],
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
        height: 600,
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
      this.updateData(formattedData);
      ChartManager.state.chart.timeScale().scrollToPosition(9);
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
        const isAlertHover =
          alert.line.options().price &&
          Math.abs(checkPrice - alert.line.options().price) / checkPrice <
            0.001;
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
      }
    }
  }
  updateData(history) {
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
    //scroll chart
    // ChartManager.state.chart
    //   .timeScale()
    //   .setVisibleLogicalRange({ from: 0, to: 50 });
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
    ChartManager.state.volumeSeries.update({
      time: newCandle.time,
      value: newCandle.volume,
      color: newCandle.close > newCandle.open ? "#26A69A" : "#EF5350",
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
    this.initAutocomplete();
    this.initChart();
    await this.loadCoins();
    this.initEventListeners();
    this.modal = new ModalManager();
    this.order = new Order();
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
    //TODO render handlebars
    const templateHbs = window.Handlebars.compile(`
    <ul class="list-group">
      {{#each coins}}
      <div class="list-group-item cursor-pointer coin-item{{#if active}} active{{/if}}" data-symbol="{{symbol}}">
        <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
              <span class="coin-symbol">{{symbol}} {{updatedAt}}</span>
            </div>
            <div class="text-end">
                <span class="coin-price"></span>
                (<span class="coin-change"></span>)
                <div class="btn-group" role="group" aria-label="Basic example">
                  {{#if exists}}
                    <button type="button" class="btn btn-sm btn-light star-btn{{#if updatedAt}} d-none{{/if}}"{{#if star}} data-star="true"{{/if}}>{{#if star}}❤️{{else}}🖤{{/if}}</button>
                    <button type="button" class="btn btn-sm btn-light alert-btn{{#if updatedAt}} d-none{{/if}}"{{#if alert}} data-alert="true"{{/if}}>{{#if alert}}🔔{{else}}🔕{{/if}}</button>
                    <button type="button" class="btn btn-sm btn-light add-btn" data-add="true">🗑</button>
                  {{else}}
                    <button type="button" class="btn btn-sm btn-light star-btn d-none"></button>
                    <button type="button" class="btn btn-sm btn-light alert-btn d-none"></button>
                    <button type="button" class="btn btn-sm btn-light add-btn" data-add="false">➕</button>
                  {{/if}}
                </div>
            </div>
        </div>
      </div>
      {{/each}}
    </ul>
    <nav aria-label="Page navigation example">
      <ul class="pagination mt-4 pagination-container">
        <li class="page-item{{#if cursorPrev}} d-none{{/if}}">
            <a href="#" class="page-link prev-btn">⏪ Prev Page</a>
        </li>
        <li class="page-item {{#if cursorNext}} d-none{{/if}}">
            <a href="#" class="page-link next-btn">Next Page ⏩</a>
        </li>
      </ul>
    </nav>`);
    //set active coin
    this.state.coins = this.state.coins.map((coin) => ({
      ...coin,
      active: this.state.symbol === coin.symbol,
      updatedAt: coin[`lastNotified_${this.state.activeTab}`]
        ? window
            .moment(
              coin[`lastNotified_${this.state.activeTab}`]._seconds * 1000,
            )
            .fromNow()
        : "",
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
        "Content-Type": "application/json",
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
          star: alertsDataJson.star,
          alert: alertsDataJson.alert,
          exists: alertsDataJson.exists,
          loaded: true,
        };
        if (this.state.coins[0].loaded) {
          this.state.coins[0] = loadedCoin;
        } else {
          this.state.coins.unshift(loadedCoin);
        }
      } else {
        const symbol = this.state.symbol;
        this.state.coins = this.state.coins.map((coin) => {
          if (coin.symbol === symbol) {
            return {
              symbol,
              star: alertsDataJson.star,
              alert: alertsDataJson.alert,
              exists: alertsDataJson.exists,
            };
          } else {
            return coin;
          }
        });
      }
      this.renderCoinList();
      // if (!App.state.alertBtn) {
      //   this.renderCoinList();
      // }
      // App.state.alertBtn = false;
    }
    App.state.item = false;
    //SHOW limit orders in chart
    Order.orderPriceLines(alertsDataJson.orders);
    //SHOW positions in chart
    Order.positionPriceLines(alertsDataJson.positions);
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
    //delete old lines and markers
    ChartManager.state.markerSeries.setMarkers([]);
    ChartManager.state.markers = [];
    for (const messageLine of ChartManager.state.messages) {
      ChartManager.state.candlestickSeries.removePriceLine(messageLine);
    }
    ChartManager.state.messages = [];
    if (alertsDataJson.pumpMsg.length) {
      Order.messagePriceLines(alertsDataJson.pumpMsg);
      const templateHbs = window.Handlebars.compile(`
        {{#each messages}}
          <div class="card mb-2{{#if isLong}} text-bg-success{{else}} text-bg-danger{{/if}}">
            <h5 class="card-header">{{title}}</h5>
            <ul class="list-group list-group-flush">
              <li class="list-group-item">{{text}}</li>
            </ul>
          </div>
        {{/each}}`);
      const messages = alertsDataJson.pumpMsg.map((message) => ({
        ...message,
        title: `${new Date(message.lastNotified._seconds * 1000).toLocaleString("ru-Ru")} = ${message.timeframe} = ${message.price}$ = ${App.state.symbol}`,
        isLong: message.timeframe.endsWith("S"),
      }));
      messageList.innerHTML = templateHbs({ messages });
    }
    document
      .querySelector(".reset-btn")
      .classList.toggle("d-none", !ChartManager.state.alerts.length);
    document
      .querySelector(".hide-btn")
      .classList.toggle("d-none", !ChartManager.state.alerts.length);
    this.state.bsOffcanvas.hide();
    //tf active
    document
      .querySelectorAll(".tf-btn")
      .forEach((n) => n.classList.remove("bg-primary"));
    document
      .querySelector(`[data-tf="${App.state.timeframe}"]`)
      ?.classList.add("bg-primary");
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
        //const add = event.target.classList.contains("add-btn");
        //const star = event.target.classList.contains("star-btn");
        //const alert = event.target.classList.contains("alert-btn");
        //subs ticker
        if (addBtn) {
          //const addBtn = event.target;
          const symbol = item.dataset.symbol;
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
        if (starBtn) {
          //const starBtn = event.target;
          //const symbol = starBtn.dataset.symbolTitle;
          const symbol = item.dataset.symbol;
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
          starBtn.innerText = fieldData ? "❤️" : "🖤";
          return;
        }
        if (alertBtn) {
          //const alertButton = event.target;
          //const symbol = alertButton.dataset.symbolTitle;
          const symbol = item.dataset.symbol;
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
          alertBtn.innerText = fieldData ? "🔔" : "🔕";
          this.state.alertBtn = true;
          await this.loadAlerts();
          return;
        }
        if (item) {
          const symbol = item.dataset.symbol;
          document
            .querySelectorAll(".coin-item")
            .forEach((n) => n.classList.remove("active"));
          item.classList.add("active");
          this.state.item = item;
          this.router.navigate(`/chart/${symbol}/${this.state.timeframe}`);
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
    //hide message lines
    document
      .querySelector(".hide-msg-btn")
      .addEventListener("click", async (e) => {
        //
        ChartManager.state.hideMsg = !ChartManager.state.hideMsg;
        e.target.textContent = ChartManager.state.hideMsg ? "🟰" : "🚫";
        for (const message of ChartManager.state.messages) {
          message.applyOptions({
            lineVisible: ChartManager.state.hideMsg,
            axisLabelVisible: ChartManager.state.hideMsg,
          });
        }
        if (ChartManager.state.hideMsg) {
          ChartManager.state.markerSeries.setMarkers(
            ChartManager.state.markers,
          );
        } else {
          ChartManager.state.markerSeries.setMarkers([]);
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
