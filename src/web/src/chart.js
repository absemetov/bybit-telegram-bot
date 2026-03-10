//universal modal
class ModalManager {
  constructor() {
    this.modal = new window.bootstrap.Modal("#universalModal");
    this.modalElement = document.getElementById("universalModal");
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
      <ul class="list-group mb-2">
        {{#each data}}
          <li class="list-group-item">
            {{field}}: {{value}} {{unit}}
          </li>
        {{/each}}
      </ul>
      <div class="list-group">
        {{#each links}}
          <a href="{{url}}" 
            class="list-group-item list-group-item-action" 
            {{#if blank}}target="_blank"{{/if}}>
            {{text}}
          </a>
        {{/each}}
      </div>`),
      scanerForm: window.Handlebars.compile(`
      <form data-form-type="scaner">
        <div class="row">
            <div class="col-md-4 mb-3">
              <label class="form-label text-primary" for="volumePercent">📊volumePercent Up, %</label>
              <input type="number" class="form-control-plaintext" name="volumePercent" id="volumePercent" value="{{volumePercent}}" min="0">
            </div>
        </div>
        <div class="row">
            <div class="col-md-4 mb-3">
                <label class="form-label text-primary" for="candlesCount">🕯Candles count</label>
                <input type="number" class="form-control-plaintext" name="candlesCount" id="candlesCount" value="{{candlesCount}}" min="2">
            </div>
            <div class="col-md-4 mb-3">
                <label class="form-label text-primary" for="touchCount">🧲Touch count</label>
                <input type="number" class="form-control" name="touchCount" id="touchCount" value="{{touchCount}}" min="2">
            </div>
            <div class="col-md-4 mb-3">
                <label class="form-label text-primary" for="tolerance">🎚Tolerance (%)</label>
                <input type="number" class="form-control" name="tolerance" id="tolerance" value="{{tolerance}}" step="0.1" min="0.1">
            </div>
        </div>
        
        <div class="d-grid gap-2">
          <button type="submit" class="btn btn-success">Save</button>
        </div>
      </form>`),
      algoForm: window.Handlebars.compile(`
      <form data-form-type="algo">
        <div class="row">
            <div class="col-md-4 mb-3">
                <label class="form-label text-success" for="attemptsCount">🎲Attempts <span id="attemptsSpan" class="h5">{{attemptsSpan}}</span></label>
                <select class="form-select" name="attemptsCount" id="attemptsCount">
                  {{#each attemptsList}}
                    <option value="{{value}}"{{#if selected}} selected{{/if}}>{{name}}</option>
                  {{/each}}
                </select>
            </div>
            <div class="col-md-4 mb-3">
                <label class="form-label text-primary" for="sizeAlgo">💰Position size ($)</label>
                <input type="number" class="form-control" id="sizeAlgo" name="size" value="{{size}}" max="{{maxSize}}" min="0" required>
            </div>
            <div class="col-md-4 mb-3">
                <label class="form-label text-success" for="trend">📈Trend</label>
                <select class="form-select" name="trend" id="trend">
                  {{#each trendList}}
                    <option value="{{value}}"{{#if selected}} selected{{/if}}>{{name}}</option>
                  {{/each}}
                </select>
            </div>
        </div>
        <div class="row">
          <h6>Position settings</h6>
        </div>
        <div class="row">
            <div class="col-md-4 mb-3">
                <label class="form-label text-success" for="tp">💵TP(%)</label>
                <input type="number" class="form-control" name="tp" id="tp" value="{{tp}}" step="0.01" min="0.1" required>
            </div>
            <div class="col-md-4 mb-3">
                <label class="form-label text-danger" for="part">✂️PartTP50(%)</label>
                <input type="number" class="form-control" id="part" name="part" value="{{part}}" step="0.01" min="0" required>
            </div>
            <div class="col-md-4 mb-3">
                <label class="form-label text-danger" for="sl">💸Stop Loss(%)</label>
                <input type="number" class="form-control is-invalid" name="sl" id="sl" value="{{sl}}" step="0.01" max="3" min="0.1" required>
            </div>
        </div>
        <div class="row">
            <div class="col-md-4 mb-3">
                <label class="form-label text-danger" for="breakeven">🤟ActiveBreak(%)</label>
                <input type="number" class="form-control" id="breakeven" name="breakeven" value="{{breakeven}}" step="0.01" min="0" required>
            </div>
            <div class="col-md-4 mb-3">
                <label class="form-label text-danger" for="trailing">⚙️TrailingStop(%)</label>
                <input type="number" class="form-control" id="trailing" name="trailing" value="{{trailing}}" step="0.01" min="0.1" required>
            </div>
            <div class="col-md-4 mb-3">
                <label class="form-label text-danger">⚖️MAX LOSS ($)</label>
                <input type="number" class="form-control is-invalid" id="loss" value="{{loss}}" disabled>
            </div>
        </div>
        <div class="row">
          <h6>Levels settings</h6>
        </div>
        <div class="row">
            <div class="col-md-4 mb-3">
                <label class="form-label text-primary" for="candlesCount">🕯Candles</label>
                <input type="number" class="form-control-plaintext" name="candlesCount" id="candlesCount" value="{{candlesCount}}" min="2">
            </div>
            <div class="col-md-4 mb-3">
                <label class="form-label text-primary" for="touchCount">🧲Touch</label>
                <input type="number" class="form-control" name="touchCount" id="touchCount" value="{{touchCount}}" min="2">
            </div>
            <div class="col-md-4 mb-3">
                <label class="form-label text-primary" for="tolerance">🎚Tolerance (%)</label>
                <input type="number" class="form-control" name="tolerance" id="tolerance" value="{{tolerance}}" step="0.01" max="0.4" min="0.01">
            </div>
        </div>
        <div class="row">
           <h6>Funding rate: {{fundingRate}}%, Time left: {{countDownTime}}</h6>
        </div>
        <div class="d-grid gap-2">
          <button type="submit" class="btn btn-primary">📥Save settings</button>
        </div>
      </form>`),
      win: window.Handlebars.templates["win-rate"],
      orders: window.Handlebars.templates["orders"],
      positions: window.Handlebars.templates["positions"],
      history: window.Handlebars.templates["history-positions"],
    };
    this.modalElement.addEventListener("hide.bs.modal", function () {
      // Remove the focus from the active element
      if (document.activeElement) {
        document.activeElement.blur();
      }
    });
    this.modalElement.addEventListener("input", this.handleInput.bind(this));
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
          data: config.data,
          links: config.links,
        });
      case "scaner-form":
        return this.templates.scanerForm({
          timeframe: App.state.timeframe,
          ...App.state.scaner,
        });
      case "algo-form":
        return this.templates.algoForm({
          ...config,
          ...App.state.algoTrading,
          maxSize: Order.state.MAX_POSITION,
          attemptsSpan:
            App.state.algoTrading.size > 0
              ? Math.floor(
                  App.state.algoTrading.balance /
                    ((App.state.algoTrading.size * App.state.algoTrading.sl) /
                      100),
                ) < 999
                ? Math.floor(
                    App.state.algoTrading.balance /
                      ((App.state.algoTrading.size * App.state.algoTrading.sl) /
                        100),
                  )
                : ">999"
              : "",
          loss:
            (App.state.algoTrading.size *
              App.state.algoTrading.sl *
              (Math.abs(App.state.algoTrading.attemptsCount) || 1)) /
            100,
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
          ...config,
        });
      case "win":
        return this.templates.win({
          ...config,
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
  handleInput(e) {
    if (e.target.id === "sizeOrder") {
      const lossOrder =
        Order.state.side === "Buy"
          ? (e.target.value * Order.state.slBuyPercent) / 100
          : (e.target.value * Order.state.slSellPercent) / 100;
      document.querySelector("#loss").value = lossOrder.toFixed(2);
    }
    if (e.target.id === "sizeAlgo" && e.target.value > 0) {
      const attemptsCount = Math.floor(
        App.state.algoTrading.balance /
          ((e.target.value * document.querySelector("#sl").value) / 100),
      );
      document.querySelector("#attemptsSpan").textContent =
        attemptsCount < 999 ? attemptsCount : ">999";
      const lossAlgo =
        (e.target.value *
          document.querySelector("#sl").value *
          (Math.abs(document.querySelector("#attemptsCount").value) || 1)) /
        100;
      document.querySelector("#loss").value =
        attemptsCount > 0
          ? lossAlgo.toFixed(2)
          : App.state.algoTrading.balance.toFixed(1);
      if (!attemptsCount) {
        alert("Liquidation! Stop!");
      }
    }
    if (e.target.id === "attemptsCount") {
      const lossAlgo =
        ((Math.abs(e.target.value) || 1) *
          document.querySelector("#sl").value *
          document.querySelector("#sizeAlgo").value) /
        100;
      document.querySelector("#loss").value = lossAlgo.toFixed(2);
    }
    if (e.target.id === "sl" && e.target.value > 0) {
      const attemptsCount = Math.floor(
        App.state.algoTrading.balance /
          ((e.target.value * document.querySelector("#sizeAlgo").value) / 100),
      );
      document.querySelector("#attemptsSpan").textContent =
        attemptsCount < 999 ? attemptsCount : ">999";
      const lossAlgo =
        (e.target.value *
          (Math.abs(document.querySelector("#attemptsCount").value) || 1) *
          document.querySelector("#sizeAlgo").value) /
        100;
      document.querySelector("#loss").value = lossAlgo.toFixed(2);
      if (!attemptsCount) {
        alert("Liquidation! Stop!");
      }
    }
  }
  handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    if (form.dataset.formType === "algo") {
      this._handleAlgoSubmit(formData);
    }
    if (form.dataset.formType === "scaner") {
      this._handleScanerSubmit(formData);
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
      await Order.fetchWin(allCoins);
      App.state.statsTab = allCoins ? "winAll" : "win";
      return;
    }
  }
  async _handleHistoryClick(item, e) {
    const loadMore = e.target.closest(".load-more");
    if (loadMore) {
      const allCoins = e.target.closest(".all");
      const cursor = loadMore.dataset.cursor;
      await Order.fetchHistory(cursor, allCoins);
      App.state.statsTab = allCoins ? "historyAll" : "history";
      return;
    }
    const symbol = item.dataset.symbol;
    const updatedTime = Math.floor(item.dataset.updatedTime / 1000);
    const exitPrice = +item.dataset.exitPrice;
    const entryPrice = +item.dataset.entryPrice;
    const closedPnl = item.dataset.closedPnl;
    const side = item.dataset.side;
    if (symbol !== App.state.symbol) {
      App.router.navigate(`/${symbol}`);
    }
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
    const interval =
      ChartManager.state.candles[1].time - ChartManager.state.candles[0].time;
    const targetCandle = ChartManager.state.candles.find(
      (c) => updatedTime >= c.time && updatedTime < c.time + interval,
    );
    if (targetCandle) {
      const timeScale = ChartManager.state.chart.timeScale();
      const x = timeScale.timeToCoordinate(targetCandle.time);
      if (x === null) return;
      const targetLogical = timeScale.coordinateToLogical(x);
      if (targetLogical === null) return;

      const visibleRange = timeScale.getVisibleLogicalRange();
      if (visibleRange === null) return;
      // Сдвигаем так, чтобы целевой индекс оказался у края (например, слева)
      const rangeWidth = visibleRange.to - visibleRange.from;
      const newFrom = targetLogical - rangeWidth + 10;
      const newTo = targetLogical + 10;
      timeScale.setVisibleLogicalRange({ from: newFrom, to: newTo });
      //set marker
      ChartManager.state.markLevels.push({
        time: targetCandle.time,
        position: side === "Sell" ? "aboveBar" : "belowBar",
        color: "black",
        shape: side === "Sell" ? "arrowDown" : "arrowUp",
        text: `${side} PnL ${closedPnl}$`,
      });
    }
    if (side === "Sell") {
      ChartManager.state.levelsArray[0].line.applyOptions({
        price: exitPrice,
        lineVisible: true,
        axisLabelVisible: true,
        color: exitPrice < entryPrice ? "red" : "black",
        title: `${(((exitPrice - entryPrice) / entryPrice) * 100).toFixed(2)}%`,
      });
      ChartManager.state.levelsArray[1].line.applyOptions({
        price: entryPrice,
        lineVisible: true,
        color: "red",
        axisLabelVisible: true,
        title: "Short",
      });
    } else {
      ChartManager.state.levelsArray[0].line.applyOptions({
        price: entryPrice,
        lineVisible: true,
        color: "green",
        axisLabelVisible: true,
        title: "Long",
      });
      ChartManager.state.levelsArray[1].line.applyOptions({
        price: exitPrice,
        lineVisible: true,
        color: exitPrice > entryPrice ? "green" : "black",
        axisLabelVisible: true,
        title: `${(((exitPrice - entryPrice) / entryPrice) * 100).toFixed(2)}%`,
      });
    }
    ChartManager.state.markerSeries.setMarkers(ChartManager.state.markLevels);
  }
  async _handleOrderClick(item, e) {
    const symbol = item.dataset.symbol;
    const getOrders = e.target.closest(".get-orders");
    const cancelOrder = e.target.closest(".cancel-order");
    const cancelAllOrder = e.target.closest(".cancel-all-orders");
    //open orders
    if (getOrders) {
      const cursor = getOrders.dataset.cursor;
      await Order.fetchOrders(cursor);
      App.state.statsTab = "orders";
      return;
    }
    //cancel all orders
    const side = e.target.dataset.side;
    if (cancelAllOrder) {
      if (confirm(`Delete all order ${symbol}?`)) {
        try {
          const response = await fetch(`/order/cancel-all/${symbol}/${side}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user: App.state.user,
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
          Order.orderPriceLines(resJson.tickerOrders);
          App.state.bsOffcanvas.hide();
          return;
        } catch (error) {
          alert(`Error: ${error.message}`);
        }
      }
    }
    //cancel orders
    if (cancelOrder) {
      const orderId = e.target.dataset.orderId;
      const price = e.target.dataset.price;
      if (confirm(`Delete order ${side} ${symbol} by ${price}$?`)) {
        try {
          const response = await fetch(`/order/cancel/${symbol}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderId,
              user: App.state.user,
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
          Order.orderPriceLines(resJson.tickerOrders);
          App.state.bsOffcanvas.hide();
          return;
        } catch (error) {
          alert(`Error: ${error.message}`);
        }
      }
    }
    //navigate to ticker
    App.router.navigate(`/${symbol}`);
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
      App.state.statsTab = "positions";
      return;
    }
    //close position
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
              user: App.state.user,
            }),
          });
          const resJson = await response.json();
          if (!response.ok) {
            alert(resJson.message);
            return false;
          }
          this.render({
            type: "positions",
            title: `Positions, Balance ${resJson.balance.toFixed(2).replace(/\./g, ",")}`,
            positions: resJson.positions,
            cursor: resJson.nextPageCursor,
            size: "lg",
          });
          //SHOW positions in chart
          Order.positionPriceLines(resJson.positions);
          App.state.bsOffcanvas.hide();
          return;
        } catch (error) {
          alert(`Error: ${error.message}`);
        }
      }
    }
    //navigate to ticker
    App.router.navigate(`/${symbol}`);
    App.state.bsOffcanvas.hide();
  }
  async _handleScanerSubmit(data) {
    const candlesCount = parseFloat(data.get("candlesCount"));
    const touchCount = parseFloat(data.get("touchCount"));
    const tolerance = parseFloat(data.get("tolerance"));
    const volumePercent = parseFloat(data.get("volumePercent"));
    try {
      App.state.scaner = {
        candlesCount,
        touchCount,
        tolerance,
        volumePercent,
      };
      this.modal.hide();
      await App.scanLevels(App.state.coins);
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }
  async _handleAlgoSubmit(data) {
    const { symbol } = Order.state;
    const tp = parseFloat(data.get("tp"));
    const sl = parseFloat(data.get("sl"));
    const size = parseFloat(data.get("size"));
    const attemptsCount = parseFloat(data.get("attemptsCount"));
    const trend = data.get("trend");
    const breakeven = parseFloat(data.get("breakeven"));
    const trailing = parseFloat(data.get("trailing"));
    const part = parseFloat(data.get("part"));
    const candlesCount = parseFloat(data.get("candlesCount"));
    const touchCount = parseFloat(data.get("touchCount"));
    const tolerance = parseFloat(data.get("tolerance"));
    if (attemptsCount > 0 && size <= 0) {
      alert("Please, set order size > 0");
      document.getElementById("sizeAlgo").focus();
      return;
    }
    App.state.algoTrading = {
      breakeven,
      trailing,
      part,
      tp,
      sl,
      size,
      attemptsCount,
      trend,
      candlesCount,
      touchCount,
      tolerance,
      balance: App.state.algoTrading.balance,
      user: App.state.user,
      priceScale: App.state.priceScale,
    };
    App.setState({});
    try {
      const response = await fetch(`/algo-trading/${symbol}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(App.state.algoTrading),
      });
      const resJson = await response.json();
      if (!response.ok) {
        alert(resJson.message);
        return false;
      }
      document.querySelector(".trading-btn").textContent = App.renderTradingBtn(
        attemptsCount,
        trend,
      );
      Indicators.calculateLevels(
        ChartManager.state.candles,
        App.state.algoTrading.candlesCount,
        App.state.algoTrading.touchCount,
      );
      this.modal.hide();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }
}
//Orders
class Order {
  static state = {
    TAKE_PROFIT: 10,
    STOP_LOSS: 3,
    MAX_POSITION: 10000,
  };
  //render position price lines
  static async positionPriceLines(positions) {
    for (const positionsLine of ChartManager.state.positions) {
      ChartManager.state.candlestickSeries.removePriceLine(positionsLine.line);
    }
    //find ticker positions
    const positionLong = positions.find((p) => p.side === "Buy");
    const positionShort = positions.find((p) => p.side === "Sell");
    //clear old data
    ChartManager.state.positions = [];
    if (positionLong) {
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
          lineVisible: App.state.hideOrders,
          axisLabelVisible: App.state.hideOrders,
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
          lineVisible: App.state.hideOrders,
          axisLabelVisible: App.state.hideOrders,
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
          lineVisible: App.state.hideOrders,
          axisLabelVisible: App.state.hideOrders,
        }),
      });
    }
    if (positionShort) {
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
          lineVisible: App.state.hideOrders,
          axisLabelVisible: App.state.hideOrders,
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
          lineVisible: App.state.hideOrders,
          axisLabelVisible: App.state.hideOrders,
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
          lineVisible: App.state.hideOrders,
          axisLabelVisible: App.state.hideOrders,
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
      const { price, side, qty, triggerPrice } = limitOrder;
      ChartManager.state.orders.push(
        ChartManager.state.candlestickSeries.createPriceLine({
          price,
          color: side === "Sell" ? "red" : "green",
          lineWidth: 2,
          lineStyle: 0,
          title: `${triggerPrice ? "S" : "L"}:${side} ${(price * qty).toFixed(2)}$`,
          lineVisible: App.state.hideOrders,
          axisLabelVisible: App.state.hideOrders,
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
          user: App.state.user,
        }),
      });
      const resJson = await response.json();
      if (!response.ok) {
        alert(resJson.message);
        return false;
      }
      App.modal.render({
        type: "orders",
        title: `Limit orders - User ${App.state.user}`,
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
          user: App.state.user,
        }),
      });
      const resJson = await response.json();
      if (!response.ok) {
        alert(resJson.message);
        return false;
      }
      App.modal.render({
        type: "positions",
        title: `Positions, Balance ${resJson.balance.toFixed(2).replace(/\./g, ",")} - User ${App.state.user}`,
        positions: resJson.positions,
        cursor: resJson.nextPageCursor,
        size: "lg",
      });
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }
  static async fetchWin(allCoins = null) {
    try {
      const response = await fetch(
        `/win-rate/${allCoins ? "" : App.state.symbol}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user: App.state.user,
          }),
        },
      );
      const resJson = await response.json();
      if (!response.ok) {
        alert(resJson.message);
        return false;
      }
      const { winRate } = resJson;
      App.modal.render({
        type: "win",
        title: `Win rate ${allCoins ? "" : App.state.symbol} - User ${App.state.user}`,
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
      const response = await fetch(
        `/positions-history/${allCoins ? "" : App.state.symbol}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cursor: cursorLink,
            user: App.state.user,
          }),
        },
      );
      const resJson = await response.json();
      if (!response.ok) {
        alert(resJson.message);
        return false;
      }
      const { positions, cursor } = resJson.closedPositions;
      const profitableTrades = positions.filter(
        (trade) => parseFloat(trade.closedPnl) > 0,
      ).length;
      const lossTrades = positions.filter(
        (trade) => parseFloat(trade.closedPnl) < 0,
      ).length;
      const winRate = ((profitableTrades / positions.length) * 100).toFixed(2);
      const total = {
        pnl: 0,
        lossPrcnt: 0,
        profPrcnt: 0,
      };
      const totalData = positions.reduce((acc, trade) => {
        acc.pnl = acc.pnl + +trade.closedPnl;
        const changePrcnt =
          Math.abs(
            (trade.avgExitPrice - trade.avgEntryPrice) / trade.avgEntryPrice,
          ) * 100;
        if (trade.closedPnl > 0) {
          acc.profPrcnt += changePrcnt;
        } else {
          acc.lossPrcnt = acc.lossPrcnt + changePrcnt;
        }
        return acc;
      }, total);
      totalData.totalPrcnt = totalData.profPrcnt - totalData.lossPrcnt;
      App.modal.render({
        type: "history",
        title: `Trade history ${allCoins ? "" : App.state.symbol} - User ${App.state.user}`,
        size: "lg",
        positions,
        cursor,
        allCoins,
        totalData,
        lossTrades,
        profitableTrades,
        winRate,
      });
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }
}
//simple router
class Router {
  constructor() {
    this.router = new window.Navigo("/", true);
    this.initRoutes();
  }

  initRoutes() {
    this.router
      .on({
        "/": async () => this.defaultRoute(),
        "/:symbol": async ({ data }) => await this.handleRoute(data),
      })
      .resolve();
  }
  defaultRoute() {
    this.navigate(`/BTCUSDT`);
  }
  async handleRoute(data) {
    const state = {
      symbol: data.symbol || "BTCUSDT",
      timeframe: App.state.timeframe,
      intervalKline: App.state.intervalToKline[App.state.timeframe],
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
  static findLevels(candles, touchCount = 4) {
    const levelsHigh = [];
    const levelsLow = [];
    candles.forEach((candle) => {
      const touchesLow = candles.filter(
        (c) =>
          candle.low >= c.low && candle.low <= c.low + (c.high - c.low) / 3,
      ).length;
      const touchesHigh = candles.filter(
        (c) =>
          candle.high <= c.high && candle.high >= c.high - (c.high - c.low) / 3,
      ).length;
      if (touchesLow >= touchCount) {
        levelsLow.push(candle.low);
      }
      if (touchesHigh >= touchCount) {
        levelsHigh.push(candle.high);
      }
    });
    const support = levelsLow.length > 0 ? Math.min(...levelsLow) : 0;
    const resistance = levelsHigh.length > 0 ? Math.max(...levelsHigh) : 0;
    return { support, resistance };
  }
  //find pump volumes
  static findPumpVolumes(candles, percent = 100) {
    try {
      const previousVolumes = candles.slice(-5, -1);
      const { volume } = candles[candles.length - 1];
      const averageVolume =
        previousVolumes.reduce((sum, candle) => sum + candle.volume, 0) /
        previousVolumes.length;
      const volumeChange = ((volume - averageVolume) / averageVolume) * 100;
      const isSpike = volumeChange >= percent;
      if (isSpike) {
        return `📊${volumeChange.toFixed(1)}%`;
      }
      return "";
    } catch (error) {
      console.error(`Error in findPumpvolumes`, error.message);
    }
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
    if (firstIndex < 0) {
      return;
    }
    const candlesSlice = candles.slice(firstIndex, lastIndex);
    ChartManager.state.markerSeries.setMarkers([]);
    ChartManager.state.markLevels = [];
    const max = Math.max(...candlesSlice.map((c) => c.high));
    const min = Math.min(...candlesSlice.map((c) => c.low));
    const currentLevels = this.findLevels(candlesSlice, touchCount);
    App.state.support = currentLevels.support;
    App.state.resistance = currentLevels.resistance;
    const currentTime = new Date(lastCandle.time * 1000);
    ChartManager.state.markLevels.push({
      time: firstCandle.time,
      position: firstCandle.high > lastCandle.high ? "aboveBar" : "belowBar",
      color: "black",
      shape: firstCandle.high > lastCandle.high ? "arrowDown" : "arrowUp",
      text: `${currentTime.getDate()}, ${currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
    });
    ChartManager.state.markLevels.push({
      time: lastCandle.time,
      position: firstCandle.high < lastCandle.high ? "aboveBar" : "belowBar",
      color: "black",
      shape: firstCandle.high < lastCandle.high ? "arrowDown" : "arrowUp",
    });
    ChartManager.state.markerSeries.setMarkers(ChartManager.state.markLevels);
    //resistance line
    App.state.resistanceMax = App.state.resistance || max;
    //support line
    App.state.supportMin = App.state.support || min;
    ChartManager.state.levelsArray[0].line.applyOptions({
      price: App.state.supportMin,
      color: App.state.support ? "green" : "black",
      lineVisible: true,
      axisLabelVisible: true,
      title: `${(((App.state.resistanceMax - App.state.supportMin) / App.state.supportMin) * 100).toFixed(2)}%`,
    });
    ChartManager.state.levelsArray[1].line.applyOptions({
      price: App.state.resistanceMax,
      color: App.state.resistance ? "red" : "black",
      lineVisible: true,
      axisLabelVisible: true,
      title: `S ${(((App.state.supportMin - App.state.resistanceMax) / App.state.resistanceMax) * 100).toFixed(2)}%`,
    });
  }
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
    levelsArray: [],
    orders: [],
    positions: [],
    messages: [],
    markers: [],
    container: document.getElementById("chart"),
    candleContainer: document.getElementById("candleEl"),
    prevSymbolKlineTopic: null,
    ws: new WebSocket("wss://stream.bybit.com/v5/public/linear"),
    activeSubscriptions: new Set(),
  };
  async init() {
    ChartManager.state.chart = window.LightweightCharts.createChart(
      ChartManager.state.container,
      {
        autoSize: true,
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
        top: 0.87,
        bottom: 0,
      },
    });
    ChartManager.state.chart.subscribeClick(this.defaultAlerts);
    ChartManager.state.chart.subscribeCrosshairMove(this.handleCrosshairMove);
    ChartManager.state.chart.subscribeDblClick(this.handleDblClick);
    //start WS
    this.initEventListeners();
    await this.initWebSocket();
  }
  dragAlert() {
    ChartManager.state.selectedAlert = ChartManager.state.hoveredAlert;
    for (const alert of ChartManager.state.alerts) {
      if (ChartManager.state.selectedAlert === alert.name) {
        ChartManager.state.isDroped = false;
      }
    }
    for (const alert of ChartManager.state.levelsArray) {
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
      const { close } =
        ChartManager.state.candles[ChartManager.state.candles.length - 1];
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
      //change tp sl Long position
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
        if (pricePercent < -Order.state.STOP_LOSS && alertName === "slLong") {
          ChartManager.state.positions
            .find((p) => p.name === "slLong")
            .line.applyOptions({
              price: stopLoss,
              title: `SL/Long: ${(((stopLoss - avgPrice) / avgPrice) * 100).toFixed(2)}%`,
            });
          return alert(`SL Long > ${Order.state.STOP_LOSS}%!!!`);
        }
        const params = { side };
        if (alertName === "slLong") {
          if (stopLossNew === stopLoss) {
            return;
          }
          params.stopLoss = stopLossNew;
          if (price > close) {
            ChartManager.state.positions
              .find((p) => p.name === "slLong")
              .line.applyOptions({
                price: stopLoss,
                title: `SL/Long: ${(((stopLoss - avgPrice) / avgPrice) * 100).toFixed(2)}%`,
              });
            return alert(`SL Long ${price}$ > ${close}$!!!`);
          }
          //change algo trading settings
          if (pricePercent < 0) {
            params.sl = +Math.abs(pricePercent).toFixed(1);
            App.state.algoTrading.sl = +Math.abs(pricePercent).toFixed(1);
          }
        } else {
          if (takeProfitNew === takeProfit) {
            return;
          }
          if (price < close) {
            ChartManager.state.positions
              .find((p) => p.name === "tpLong")
              .line.applyOptions({
                price: takeProfit,
                title: `TP/Long: ${(((takeProfit - avgPrice) / avgPrice) * 100).toFixed(2)}%`,
              });
            return alert(`TP ${price}$ < ${close}$!!!`);
          }
          params.takeProfit = takeProfitNew;
          params.tp = +Math.abs(pricePercent).toFixed(1);
          App.state.algoTrading.tp = +Math.abs(pricePercent).toFixed(1);
        }
        try {
          const response = await fetch(
            `/position/edit/${alertName === "slLong" ? "sl" : "tp"}/${App.state.symbol}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...params,
                user: App.state.user,
              }),
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
        if (pricePercent > Order.state.STOP_LOSS && alertName === "slShort") {
          ChartManager.state.positions
            .find((p) => p.name === "slShort")
            .line.applyOptions({
              price: stopLoss,
              title: `SL/Short: ${(((stopLoss - avgPrice) / avgPrice) * 100).toFixed(2)}%`,
            });
          return alert(`SL Short > ${Order.state.STOP_LOSS}%!!!`);
        }
        const params = { side };
        if (alertName === "slShort") {
          if (stopLossNew === stopLoss) {
            return;
          }
          if (price < close) {
            ChartManager.state.positions
              .find((p) => p.name === "slShort")
              .line.applyOptions({
                price: stopLoss,
                title: `SL/Short: ${(((stopLoss - avgPrice) / avgPrice) * 100).toFixed(2)}%`,
              });
            return alert(`SL Short ${price}$ < ${close}$!!!`);
          }
          //change algo trading SL
          params.stopLoss = stopLossNew;
          if (pricePercent > 0) {
            params.sl = +pricePercent.toFixed(1);
            App.state.algoTrading.sl = +pricePercent.toFixed(1);
          }
        } else {
          if (takeProfitNew === takeProfit) {
            return;
          }
          if (price > close) {
            ChartManager.state.positions
              .find((p) => p.name === "tpShort")
              .line.applyOptions({
                price: takeProfit,
                title: `TP/Short: ${(((takeProfit - avgPrice) / avgPrice) * 100).toFixed(2)}%`,
              });
            return alert(`TP Short ${price}$ > ${close}$!!!`);
          }
          params.takeProfit = takeProfitNew;
          params.tp = +Math.abs(pricePercent).toFixed(1);
          App.state.algoTrading.tp = +Math.abs(pricePercent).toFixed(1);
        }
        try {
          const response = await fetch(
            `/position/edit/${alertName === "slShort" ? "sl" : "tp"}/${App.state.symbol}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...params,
                user: App.state.user,
              }),
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

    ChartManager.state.container.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        isMouseDown = true;
        e.preventDefault();
      }
    });

    ChartManager.state.container.addEventListener("mousemove", () => {
      if (isMouseDown) {
        this.dragAlert();
      }
    });

    document.addEventListener("mouseup", () => {
      this.dropAlert();
      isMouseDown = false;
    });
    //touch events
    //drag
    ChartManager.state.container.addEventListener("touchmove", () =>
      this.dragAlert(),
    );
    //drop
    ChartManager.state.container.addEventListener(
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
        user: App.state.user,
      }),
    });
    const resJson = await response.json();
    //error msg
    if (!response.ok) {
      alert(resJson.message);
    }
  }
  static async getCandles(symbol, timeframe, limit = 1000) {
    try {
      const response = await fetch(
        `https://api.bybit.com/v5/market/kline?category=linear&symbol=${symbol}&interval=${App.state.intervalToKline[timeframe]}&limit=${limit}`,
      );
      const data = await response.json();
      if (data.retCode !== 0) {
        throw new Error(`Error API: ${data.retMsg}`);
      }
      return data.result.list.reverse().map((candle) => ({
        time: parseInt(candle[0]) / 1000,
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5]),
      }));
    } catch (error) {
      alert(`Error loading chart data:, ${error}`);
      console.error("Error loading chart data:", error);
    }
  }
  async loadChartData() {
    try {
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
      ChartManager.state.candles = await ChartManager.getCandles(
        App.state.symbol,
        App.state.timeframe,
      );
      ChartManager.state.candlestickSeries.setData([]);
      ChartManager.state.volumeSeries.setData([]);
      this.updateData(ChartManager.state.candles);
      ChartManager.state.chart.timeScale().scrollToPosition(11);
    } catch (error) {
      alert(`Error loading chart data:, ${error}`);
      console.error("Error loading chart data:", error);
    }
  }
  checkHover(cursorY, lines) {
    if (ChartManager.state.isDroped) {
      for (const alert of lines) {
        let minDistance = Infinity;
        const PIXEL_TOLERANCE = 3;
        const lineY = ChartManager.state.candlestickSeries.priceToCoordinate(
          alert.line.options().price,
        );
        const distance = Math.abs(lineY - cursorY);
        const isAlertHover =
          alert.name &&
          alert.line.options().lineVisible &&
          alert.line.options().price &&
          distance < minDistance &&
          distance <= PIXEL_TOLERANCE;
        if (isAlertHover) {
          minDistance = distance;
          ChartManager.state.hoveredAlert = alert.name;
          alert.line.applyOptions({
            color: "orange",
          });
          ChartManager.state.container.style.cursor = "pointer";
          return true;
        }
      }
      this.defaultAlerts();
    }
  }
  initWebSocket() {
    return new Promise((resolve, reject) => {
      ChartManager.state.ws.onopen = () => {
        console.log("WebSocket connected");
        resolve();
      };
      ChartManager.state.ws.onmessage = (e) => this.handleMessage(e);
      ChartManager.state.ws.onclose = () => {
        setTimeout(() => this.initWebSocket(), 3000);
      };
      ChartManager.state.ws.onerror = (error) => {
        reject(error);
      };
    });
  }
  updateWebsocketSymbol() {
    if (ChartManager.state.prevSymbolKlineTopic) {
      const subscribeMsg = {
        op: "unsubscribe",
        args: ChartManager.state.prevSymbolKlineTopic,
      };
      ChartManager.sendSubscription(subscribeMsg);
    }
    const subscribeMsg = {
      op: "subscribe",
      args: [`kline.${App.state.intervalKline}.${App.state.symbol}`],
    };
    ChartManager.state.prevSymbolKlineTopic = [
      `kline.${App.state.intervalKline}.${App.state.symbol}`,
    ];
    ChartManager.sendSubscription(subscribeMsg);
  }
  static updateWebsocketSubs() {
    this.unsubscribeAll();
    this.subscribeToData();
  }

  static subscribeToData() {
    const args = App.state.coins.map((coin) => `kline.D.${coin.symbol}`);
    const subscribeMsg = {
      op: "subscribe",
      args,
    };
    this.sendSubscription(subscribeMsg);
    args.forEach((topic) => this.state.activeSubscriptions.add(topic));
  }
  static unsubscribeAll() {
    const unsubscribeMsg = {
      op: "unsubscribe",
      args: Array.from(this.state.activeSubscriptions),
    };

    if (this.state.activeSubscriptions.size > 0) {
      this.sendSubscription(unsubscribeMsg);
      this.state.activeSubscriptions.clear();
    }
  }
  static sendSubscription(message) {
    if (this.state.ws?.readyState === WebSocket.OPEN) {
      this.state.ws.send(JSON.stringify(message));
    }
  }
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
    const element = document.querySelector(
      `.coin-item[data-symbol="${symbol}"]`,
    );
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
        //set doc title
        if (App.state.symbol === symbol) {
          document.title = `${close}$ ${change < 0 ? "🔻" : "⬆️"}${change.toFixed(2)}% ${symbol}`;
        }
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
  }
  updateRealtime(newCandle) {
    if (!ChartManager.state.point) {
      ChartManager.state.candleContainer.textContent = `${ChartManager.state.volumeSeries.priceFormatter().format(newCandle.volume)} (${newCandle.close > newCandle.open ? `+${(((newCandle.high - newCandle.low) / newCandle.low) * 100).toFixed(2)}` : `${(((newCandle.low - newCandle.high) / newCandle.high) * 100).toFixed(2)}`}%)`;
    }
    const prevCandle =
      ChartManager.state.candles[ChartManager.state.candles.length - 1];
    if (!prevCandle) return;
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
    if (!param.point) return;
    const candle = param.seriesData.get(ChartManager.state.candlestickSeries);
    //update volume
    if (param.time && candle) {
      const datapoints = param.seriesData.get(ChartManager.state.volumeSeries);
      if (datapoints) {
        ChartManager.state.candleContainer.textContent = `${ChartManager.state.volumeSeries.priceFormatter().format(datapoints.value)} (${candle.close > candle.open ? `+${(((candle.high - candle.low) / candle.low) * 100).toFixed(2)}` : `${(((candle.low - candle.high) / candle.high) * 100).toFixed(2)}`}%)`;
      }
    }
    //price lines
    if (ChartManager.state.candlestickSeries) {
      ChartManager.state.currentPriceMove =
        ChartManager.state.candlestickSeries.coordinateToPrice(param.point.y);
      if (ChartManager.state.currentPriceMove > 0) {
        App.chartManager.checkHover(param.point.y, [
          ...ChartManager.state.alerts,
          ...ChartManager.state.levelsArray,
          ...ChartManager.state.positions,
        ]);
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
        App.updateAlertsTitle();
        return;
      }
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
        ChartManager.state.levelsArray[1].line.applyOptions({
          title: `S ${(((support - resistance) / resistance) * 100).toFixed(2)}%`,
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
        color: [1, 3, 5].includes(alert.name) ? "green" : "red",
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
    ChartManager.state.levelsArray[0].line.applyOptions({
      color: App.state.support ? "green" : "black",
    });
    ChartManager.state.levelsArray[1].line.applyOptions({
      color: App.state.resistance ? "red" : "black",
      //title: "Short",
    });
    ChartManager.state.container.style.cursor = "default";
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
    timeframe: "4h",
    cursorPrev: null,
    cursorNext: null,
    coins: [],
    activeTab: "favorites",
    hideAlerts: false,
    hideOrders: true,
    bsOffcanvas: new window.bootstrap.Offcanvas("#offcanvasResponsive"),
    user: "main",
    statsTab: "positions",
    scaner: {
      candlesCount: 6,
      touchCount: 3,
      tolerance: 0.5,
      volumePercent: 50,
    },
    intervalToKline: {
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
    },
  };

  static async init() {
    window.Handlebars.registerHelper("inc", function (value) {
      return parseInt(value) + 1;
    });
    window.Handlebars.registerHelper("date", function (updatedAt) {
      if (!updatedAt) return "";
      return new Date(updatedAt._seconds * 1000).toLocaleString("ru-RU", {
        timeZone: "Europe/Moscow",
      });
    });
    window.Handlebars.registerHelper("algoIcon", function (ticker) {
      const { attemptsCount = -1, size, trend } = ticker[App.state.user] || {};
      if (attemptsCount < 0) return "";
      return `AlgoTrading ${App.renderTradingBtn(attemptsCount, trend)} ${size}$`;
    });
    window.Handlebars.registerHelper("multiply", function (a, b) {
      return (a * b).toFixed(2);
    });

    window.Handlebars.registerHelper("changePercent", function (a, b) {
      return ((Math.abs(a - b) / b) * 100).toFixed(2);
    });

    window.Handlebars.registerHelper(
      "formatPrice",
      function (value = 0, decimals) {
        const precision = typeof decimals === "number" ? decimals : 2;
        const str = (+value).toFixed(precision);
        return str.replace(/\./g, ",");
      },
    );

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
    this.chartManager = new ChartManager();
    this.initAutocomplete();
    this.initEventListeners();
    await this.chartManager.init();
    this.modal = new ModalManager();
    await this.loadCoins();
    this.router = new Router();
    //find levels
    await this.scanLevels(this.state.coins);
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
              `/${symbol}${symbol.endsWith("USDT") ? "" : "USDT"}`,
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
      insights: false,
      plugins: [recentSearchesPlugin],
      onSubmit({ state }) {
        const symbol = state.query.toUpperCase();
        if (symbol) {
          App.router.navigate(
            `/${symbol}${symbol.endsWith("USDT") ? "" : "USDT"}`,
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
                `/${symbol}${symbol.endsWith("USDT") ? "" : "USDT"}`,
              );
            },
          },
        ];
      },
    });
  }
  static async scanLevels(coins) {
    //scan coin levels
    for (const ticker of coins) {
      const { symbol } = ticker;
      const { candlesCount, touchCount, tolerance, volumePercent } =
        App.state.scaner;
      const elementHtml = document.querySelector(
        `.coin-item[data-symbol="${symbol}"]`,
      );
      if (elementHtml) {
        const levelsElem = elementHtml.querySelector(".coin-levels");
        if (levelsElem) {
          levelsElem.textContent = "⌛️";
        }
      }
      const candles = await ChartManager.getCandles(
        symbol,
        App.state.timeframe,
        candlesCount,
      );
      const { support, resistance } = Indicators.findLevels(
        candles,
        touchCount,
      );
      const { close } = candles[candles.length - 1];
      const supportZone = Math.abs(support - close) / close <= tolerance / 100;
      const resistanceZone =
        Math.abs(resistance - close) / close <= tolerance / 100;
      //check volumes
      const volumeUp = Indicators.findPumpVolumes(candles, volumePercent);
      if (elementHtml) {
        const levelsElem = elementHtml.querySelector(".coin-levels");
        if (levelsElem) {
          levelsElem.textContent = `${supportZone ? `⤴️` : ""}${resistanceZone ? `⤵️` : ""}${volumeUp}`;
        }
      }
    }
  }
  //load Bybit tickers
  static async loadCoinsBybit(cursorNext = "") {
    const url = `https://api.bybit.com/v5/market/instruments-info?category=linear&limit=13${cursorNext ? `&cursor=${cursorNext}` : ""}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      this.state.coins = data.result.list.filter(
        (c) => c.status === "Trading" && c.symbol.endsWith("USDT"),
      );
      this.state.cursorNext = data.result.nextPageCursor;
      this.renderCoinList();
      //await this.scanLevels(this.state.coins);
    } catch (error) {
      console.error("Error loading Bybit coins:", error);
    }
  }
  //my coins
  static async loadCoins(direction = null, lastVisibleId = null) {
    const url = `/api/tickers?direction=${direction}&lastVisibleId=${lastVisibleId}&tab=${this.state.activeTab}&user=${this.state.user}`;
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
      document
        .querySelectorAll(".tab-link")
        .forEach((n) => n.classList.remove("active"));
      document
        .querySelector(`[data-tab='${this.state.activeTab}']`)
        .classList.add("active");
      this.renderCoinList();
    } catch (error) {
      console.error("Error loading My coins:", error);
    }
  }
  static setActiveTicker(symbol) {
    document
      .querySelectorAll(".coin-item")
      .forEach((n) => n.classList.remove("list-group-item-primary"));
    document
      .querySelector(`.coin-item[data-symbol="${symbol}"]`)
      ?.classList.add("list-group-item-primary");
  }
  static renderCoinList() {
    const coinList = document.querySelector(".coin-list");
    const templateHbs = window.Handlebars.templates["coins-list"];
    coinList.innerHTML = templateHbs({
      coins: this.state.coins,
      cursorPrev: !this.state.cursorPrev,
      cursorNext: !this.state.cursorNext,
      bybit: this.state.activeTab === "bybit",
    });
    this.setActiveTicker(App.state.symbol);
    ChartManager.updateWebsocketSubs();
  }

  static setState(newState) {
    this.state = { ...this.state, ...newState };
    document.querySelector(".hide-btn").textContent = this.state.hideAlerts
      ? "🔔"
      : "🔕";
    document.querySelector(".order-btn").textContent = this.state.hideOrders
      ? "📬"
      : "📭";
    if (this.state.algoTrading) {
      document.querySelector(".display-symbol").textContent =
        `${this.state.symbol} [${this.state.algoTrading.candlesCount}, ${this.state.algoTrading.touchCount}, ${this.state.algoTrading.tolerance}]`;
      document.querySelector(".switch-user").textContent =
        `${App.state.user === "main" ? "🐮Main" : "🐻Sub"} (${App.state.algoTrading.balance.toFixed(1)}$)`;
    }
  }
  static async renderChart() {
    await this.chartManager.loadChartData();
    await this.loadAlerts();
    this.renderLevels();
    this.chartManager.updateWebsocketSymbol();
  }
  static hideAlerts() {
    this.state.hideAlerts = !this.state.hideAlerts;
    document.querySelector(".hide-btn").textContent = this.state.hideAlerts
      ? "🔔"
      : "🔕";
    for (const alert of ChartManager.state.alerts) {
      alert.line.applyOptions({
        lineVisible: this.state.hideAlerts,
        axisLabelVisible: this.state.hideAlerts,
      });
    }
  }
  static hideOrders() {
    this.state.hideOrders = !this.state.hideOrders;
    for (const alert of ChartManager.state.positions) {
      alert.line.applyOptions({
        lineVisible: this.state.hideOrders,
        axisLabelVisible: this.state.hideOrders,
      });
    }
    for (const alert of ChartManager.state.orders) {
      alert.applyOptions({
        lineVisible: this.state.hideOrders,
        axisLabelVisible: this.state.hideOrders,
      });
    }
    document.querySelector(".order-btn").textContent = this.state.hideOrders
      ? "📬"
      : "📭";
  }
  static renderLevels() {
    if (App.state.algoTrading.candlesCount) {
      Indicators.state.countLoads = 0;
      Indicators.calculateLevels(
        ChartManager.state.candles,
        App.state.algoTrading.candlesCount,
        App.state.algoTrading.touchCount,
      );
    }
  }
  static updateAlertsTitle() {
    if (ChartManager.state.alerts.length === 0) {
      return;
    }
    const alert1 = ChartManager.state.alerts
      .find((alert) => alert.name === 1)
      .line.options().price;
    const alert3 = ChartManager.state.alerts
      .find((alert) => alert.name === 3)
      .line.options().price;
    ChartManager.state.alerts
      .find((alert) => alert.name === 3)
      .line.applyOptions({
        title: `3| ${(((alert3 - alert1) / alert1) * 100).toFixed(2)}%`,
      });
    const alert5 = ChartManager.state.alerts
      .find((alert) => alert.name === 5)
      .line.options().price;
    ChartManager.state.alerts
      .find((alert) => alert.name === 5)
      .line.applyOptions({
        title: `5| ${(((alert5 - alert3) / alert3) * 100).toFixed(2)}%`,
      });
    const alert2 = ChartManager.state.alerts
      .find((alert) => alert.name === 2)
      .line.options().price;
    ChartManager.state.alerts
      .find((alert) => alert.name === 1)
      .line.applyOptions({
        title: `1| ${(((alert2 - alert1) / alert1) * 100).toFixed(2)}%`,
      });
    ChartManager.state.alerts
      .find((alert) => alert.name === 2)
      .line.applyOptions({
        title: `2| ${(((alert1 - alert2) / alert2) * 100).toFixed(2)}%`,
      });
    const alert4 = ChartManager.state.alerts
      .find((alert) => alert.name === 4)
      .line.options().price;
    ChartManager.state.alerts
      .find((alert) => alert.name === 4)
      .line.applyOptions({
        title: `4| ${(((alert4 - alert2) / alert2) * 100).toFixed(2)}%`,
      });
    const alert6 = ChartManager.state.alerts
      .find((alert) => alert.name === 6)
      .line.options().price;
    ChartManager.state.alerts
      .find((alert) => alert.name === 6)
      .line.applyOptions({
        title: `6| ${(((alert6 - alert4) / alert4) * 100).toFixed(2)}%`,
      });
  }
  static async getTickerInfo(symbol) {
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
  static async loadAlerts(defaultAlerts = false) {
    //Indicators.state.countLoads = 0;
    if (defaultAlerts) {
      App.state.supportMin =
        ChartManager.state.levelsArray[0].line.options().price;
      if (!ChartManager.state.levelsArray[0].line.options().lineVisible) {
        alert("Show support line!");
        return;
      }
      App.state.resistanceMax =
        ChartManager.state.levelsArray[1].line.options().price;
      if (!ChartManager.state.levelsArray[1].line.options().lineVisible) {
        alert("Show resistance line!");
        return;
      }
      if (!App.state.hideAlerts) {
        App.hideAlerts();
      }
    }
    document.querySelector(".trading-btn").classList.add("d-none");
    const alertsData = await fetch(`/alerts/${App.state.symbol}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        defaultAlerts,
        support: App.state.supportMin,
        resistance: App.state.resistanceMax,
        sl: App.state.algoTrading?.sl,
        user: App.state.user,
      }),
    });
    const alertsDataJson = await alertsData.json();
    if (!alertsData.ok) {
      alert(alertsDataJson.message);
      return false;
    }
    if (ChartManager.state.alerts.length) {
      for (const alert of ChartManager.state.alerts) {
        ChartManager.state.candlestickSeries.removePriceLine(alert.line);
      }
    }
    ChartManager.state.alerts = [];
    for (const [index, value] of Object.entries(
      alertsDataJson[`${App.state.user}Alerts`] || {},
    )) {
      ChartManager.state.alerts.push({
        name: +index,
        line: ChartManager.state.candlestickSeries.createPriceLine({
          price: value,
          color: [1, 3, 5].includes(+index) ? "green" : "red",
          lineWidth: 2,
          lineStyle: 2,
          title: index,
          lineVisible: this.state.hideAlerts,
          axisLabelVisible: this.state.hideAlerts,
        }),
      });
    }
    this.updateAlertsTitle();
    const {
      sl = 1,
      tp = Order.state.TAKE_PROFIT,
      size = 0,
      attemptsCount = -1,
      trend = "up",
      breakeven = 5,
      trailing = 2,
      part = 6,
      candlesCount = 12,
      touchCount = 3,
      tolerance = 0.05,
    } = alertsDataJson[App.state.user] || {};
    App.state.algoTrading = {
      sl,
      tp,
      size,
      attemptsCount,
      trend,
      breakeven,
      trailing,
      part,
      candlesCount,
      touchCount,
      tolerance,
      balance: alertsDataJson.balance || 0,
    };
    App.setState({});
    const tickerItem = document.querySelector(
      `.coin-item[data-symbol="${App.state.symbol}"]`,
    );
    const newTicker = document.getElementById("load-coin");
    const item = tickerItem || newTicker;
    //loaded coin
    if (!tickerItem) {
      newTicker.classList.remove("d-none");
      newTicker.dataset.symbol = App.state.symbol;
      newTicker.querySelector(".coin-symbol").textContent = App.state.symbol;
    }
    if (item) {
      item.querySelector(".add-btn").classList.remove("d-none");
      item
        .querySelector(".star-btn")
        .classList.toggle("d-none", !alertsDataJson.exists);
      if (alertsDataJson.exists) {
        item.querySelector(".add-btn").textContent = "🗑";
        item.querySelector(".add-btn").dataset.add = true;
        //star
        item.querySelector(".star-btn").dataset.star = alertsDataJson.star;
        item.querySelector(".star-btn").textContent = alertsDataJson.star
          ? "❤️"
          : "🖤";
      } else {
        item.querySelector(".add-btn").textContent = "➕";
        item.querySelector(".add-btn").dataset.add = false;
      }
    }
    this.setActiveTicker(App.state.symbol);
    //SHOW limit orders in chart
    Order.orderPriceLines(alertsDataJson.orders);
    //SHOW positions in chart
    Order.positionPriceLines(alertsDataJson.positions);
    //show hide algo btn
    if (alertsDataJson.exists) {
      document.querySelector(".trading-btn").textContent =
        this.renderTradingBtn(
          App.state.algoTrading.attemptsCount,
          App.state.algoTrading.trend,
        );
    }
    document
      .querySelector(".trading-btn")
      .classList.toggle("d-none", !alertsDataJson.exists);
    document
      .querySelector(".reset-btn")
      .classList.toggle("d-none", !alertsDataJson.exists);
    document
      .querySelector(".hide-btn")
      .classList.toggle("d-none", !alertsDataJson.exists);
    document
      .querySelector(".order-btn")
      .classList.toggle("d-none", !alertsDataJson.exists);
    //tf active
    document
      .querySelectorAll(".tf-btn")
      .forEach((n) => n.classList.remove("bg-primary"));
    document
      .querySelector(`[data-tf="${App.state.timeframe}"]`)
      ?.classList.add("bg-primary");
  }
  //trading btn render
  static renderTradingBtn(attemptsCount, trend) {
    const icons = { up: "↗️", down: "↘️", flat: "↕️" };
    if (attemptsCount === 0) {
      return `🟠${icons[trend]}`;
    }
    if (attemptsCount > 0 && attemptsCount <= 5) {
      return `🟢${icons[trend]}(${attemptsCount})`;
    }
    if (attemptsCount === 6) {
      return "🔔";
    }
    return "🔴";
  }
  static handleKeyPress(event) {
    switch (event.key) {
      case "ArrowLeft":
        if (
          Indicators.state.countLoads + App.state.algoTrading.candlesCount <
          ChartManager.state.candles.length
        ) {
          ++Indicators.state.countLoads;
        }
        break;
      case "ArrowRight":
        if (Indicators.state.countLoads) {
          --Indicators.state.countLoads;
        }
        break;
    }
    ChartManager.state.chart
      .timeScale()
      .scrollToPosition(-Indicators.state.countLoads + 12);
    Indicators.calculateLevels(
      ChartManager.state.candles,
      App.state.algoTrading.candlesCount,
      App.state.algoTrading.touchCount,
    );
  }
  static initEventListeners() {
    //algo-trading
    document
      .querySelector(".trading-btn")
      .addEventListener("click", async () => {
        Order.state.symbol = App.state.symbol;
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
          if (el.value === App.state.algoTrading.attemptsCount) {
            el.selected = true;
          } else {
            el.selected = false;
          }
          return el;
        });
        const trendList = [
          { value: "up", name: "↗️ Up trend" },
          { value: "down", name: "↘️ Down trend" },
          { value: "flat", name: "↕️ Flat" },
        ].map((el) => {
          if (el.value === App.state.algoTrading.trend) {
            el.selected = true;
          } else {
            el.selected = false;
          }
          return el;
        });
        const symbol = App.state.symbol;
        const tickerInfo = await App.getTickerInfo(symbol);
        App.modal.render({
          type: "algo-form",
          title: `AlgoTrading [${App.state.user}=${App.state.user === "main" ? "🐮Swing" : "🐻Scalp"}] ${Order.state.symbol}, ${App.state.algoTrading.balance.toFixed(1)}$`,
          attemptsList,
          trendList,
          fundingRate: tickerInfo.fundingRate,
          countDownTime: tickerInfo.countDownTime,
        });
      });
    document.addEventListener("keydown", this.handleKeyPress);
    //tabs
    document.querySelectorAll(".tab-link").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        document
          .querySelectorAll(".tab-link")
          .forEach((n) => n.classList.remove("active"));
        e.target.classList.add("active");
        const { tab } = e.target.dataset;
        this.state.activeTab = tab;
        if (tab === "bybit") {
          await this.loadCoinsBybit();
        } else {
          await this.loadCoins();
        }
        //find levels
        await this.scanLevels(this.state.coins);
      });
    });
    document
      .querySelector(".coin-list")
      .addEventListener("click", async (event) => {
        event.preventDefault();
        const item = event.target.closest(".coin-item");
        const addBtn = event.target.closest(".add-btn");
        const starBtn = event.target.closest(".star-btn");
        const prevBtn = event.target.closest(".prev-btn");
        const nextBtn = event.target.closest(".next-btn");
        const nextBtnBybit = event.target.closest(".next-btn-bybit");
        if (prevBtn) {
          await this.loadCoins("prev", this.state.cursorPrev);
          //find levels
          await this.scanLevels(this.state.coins);
          return;
        }
        if (nextBtn) {
          await this.loadCoins("next", this.state.cursorNext);
          //find levels
          await this.scanLevels(this.state.coins);
          return;
        }
        if (nextBtnBybit) {
          await this.loadCoinsBybit(this.state.cursorNext);
          //find levels
          await this.scanLevels(this.state.coins);
          return;
        }
        if (!item) {
          return;
        }
        const symbol = item.dataset.symbol;
        //add ticker
        if (addBtn) {
          const { add } = addBtn.dataset;
          const fieldData = !(add === "true");
          //confirm delete ticker
          if (!fieldData) {
            if (!confirm(`Delete ticker ${symbol}?`)) {
              return;
            }
          }
          const response = await fetch(`/add/${symbol}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              add: fieldData,
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
            document.querySelector(".reset-btn").classList.remove("d-none");
            document.querySelector(".hide-btn").classList.remove("d-none");
            document.querySelector(".order-btn").classList.remove("d-none");
            await this.loadAlerts();
          } else {
            addBtn.textContent = "➕";
            addBtn.dataset.add = false;
            item.querySelector(".star-btn").classList.add("d-none");
            document.querySelector(".reset-btn").classList.add("d-none");
            document.querySelector(".hide-btn").classList.add("d-none");
            document.querySelector(".order-btn").classList.add("d-none");
            document.querySelector(".trading-btn").classList.add("d-none");
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
          starBtn.innerText = fieldData ? "❤️" : "🖤";
          return;
        }
        if (item) {
          this.setActiveTicker(symbol);
          this.router.navigate(`/${symbol}`);
          this.state.bsOffcanvas.hide();
        }
      });
    //short tf
    document
      .getElementById("tf-select")
      .addEventListener("change", async (e) => {
        const tf = e.target.value;
        App.state.timeframe = tf;
        document
          .querySelectorAll(".tf-btn")
          .forEach((n) => n.classList.remove("bg-primary"));
        document
          .querySelector(`[data-tf="${App.state.timeframe}"]`)
          ?.classList.add("bg-primary");
        e.target.blur();
        App.state.intervalKline = App.state.intervalToKline[tf];
        await App.chartManager.loadChartData();
        App.renderLevels();
        App.chartManager.updateWebsocketSymbol();
        await this.scanLevels(this.state.coins);
      });
    document.querySelectorAll(".tf-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        document
          .querySelectorAll(".tf-btn")
          .forEach((n) => n.classList.remove("bg-primary"));
        e.target.classList.add("bg-primary");
        const { tf } = event.target.dataset;
        App.state.timeframe = tf;
        document.getElementById("tf-select").value = tf;
        App.state.intervalKline = App.state.intervalToKline[tf];
        await App.chartManager.loadChartData();
        App.renderLevels();
        App.chartManager.updateWebsocketSymbol();
        await this.scanLevels(this.state.coins);
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
        ChartManager.state.markerSeries.setMarkers([]);
        ChartManager.state.hideSr = !ChartManager.state.hideSr;
        e.target.textContent = ChartManager.state.hideSr ? "🚫" : "🟰";
        Indicators.calculateLevels(
          ChartManager.state.candles,
          App.state.algoTrading.candlesCount,
          App.state.algoTrading.touchCount,
        );
      });
    document
      .querySelector(".show-positions")
      .addEventListener("click", async (event) => {
        event.preventDefault();
        if (App.state.statsTab === "orders") await Order.fetchOrders();
        if (App.state.statsTab === "positions") await Order.fetchPositions();
        if (App.state.statsTab === "history") await Order.fetchHistory();
        if (App.state.statsTab === "historyAll")
          await Order.fetchHistory("", "all");
        if (App.state.statsTab === "win") await Order.fetchWin();
        if (App.state.statsTab === "winAll") await Order.fetchWin("all");
      });
    document.querySelector(".scaner").addEventListener("click", (event) => {
      event.preventDefault();
      App.modal.render({
        type: "scaner-form",
        title: `Scan levels settings, timeframe ${App.state.timeframe}`,
      });
    });
    document
      .querySelector(".switch-user")
      .addEventListener("click", async (event) => {
        event.preventDefault();
        App.state.user = App.state.user === "main" ? "sub" : "main";
        event.target.textContent =
          App.state.user === "main" ? "🐂Main" : "🐻Sub";
        await this.loadCoins();
        await this.loadAlerts();
        App.renderLevels();
      });
    //reset hide info btns
    document.querySelector(".reset-btn").addEventListener("click", async () => {
      await this.loadAlerts(true);
    });
    document.querySelector(".hide-btn").addEventListener("click", async () => {
      this.hideAlerts();
    });
    document.querySelector(".order-btn").addEventListener("click", async () => {
      this.hideOrders();
    });
    document.querySelector(".info-btn").addEventListener("click", async () => {
      const symbol = this.state.symbol;
      const tickerInfo = await this.getTickerInfo(symbol);
      //set title
      App.modal.render({
        type: "links",
        title: "Торговые инструменты",
        data: [
          {
            field: "Funding rate",
            value: tickerInfo.fundingRate,
            unit: "%",
          },
          {
            field: "Next funding time",
            value: tickerInfo.nextFundingTime,
          },
          {
            field: "Funding interval",
            value: tickerInfo.fundingIntervalHour,
            unit: "hours",
          },
          {
            field: "Count down",
            value: tickerInfo.countDownTime,
          },
        ],
        links: [
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
      });
    });
  }
}

App.init();
