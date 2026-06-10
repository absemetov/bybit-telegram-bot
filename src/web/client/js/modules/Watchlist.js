import { Templates } from "@js/generated/templates.js";
import { Offcanvas } from "bootstrap";

export class Watchlist {
  constructor(app) {
    this.app = app;
    this.container = null;
    this.currentTab = "favorites";
    this.template = Templates["widgets/watchlist"];
  }
  init() {
    console.log("[Watchlist:init]");
    this.app.on("symbolChanged", () => {
      this._highlightActiveSymbol();
      this.offcanvas.hide();
    });
    this.app.on("dashboardReady", () => {
      this.container = document.getElementById("watchlistContainer");
      if (this.container) {
        this.offcanvas = new Offcanvas("#offcanvasResponsive");
        this.attachEvents();
        console.log("[Watchlist:>dashboardReady>loadTab]");
        this.loadTab();
      }
    });
  }
  attachEvents() {
    this.container.addEventListener("click", (e) => this.handleClick(e));
  }
  handleClick(e) {
    const tab = e.target.closest("[data-tab]");
    if (tab) {
      e.preventDefault();
      this.switchTab(tab.dataset.tab);
      return;
    }
    const btn = e.target.closest("[data-action]");
    if (btn) {
      const { action, symbol, firstVisibleId, lastVisibleId } = btn.dataset;
      switch (action) {
        case "addTicker":
          this.showAddTickerModal();
          break;
        case "toggleFavorite":
          this.toggleFavorite(symbol, btn);
          break;
        case "deleteTicker":
          this.deleteTicker(symbol);
          break;
        case "prevPage":
          this.loadTab("prev", firstVisibleId);
          break;
        case "nextPage":
          this.loadTab("next", lastVisibleId);
          break;
      }
    }
  }
  switchTab(tab) {
    this.currentTab = tab;
    this.loadTab();
  }
  async loadTab(direction = null, lastVisibleId = null) {
    if (!this.app.state.get("isAuth")) {
      this.renderGuestMode();
      return;
    }
    const data = await this.app
      .get("api")
      .post(
        `/api/tickers?direction=${direction}&lastVisibleId=${lastVisibleId}&tab=${this.currentTab}&user=${this.app.state.get("bybitUser")}&limit=7`,
      );
    this.app.state.set("watchlist.tickers", data.tickers);
    this.render(data);
    this.app.emit(
      "watchlist:symbols",
      data.tickers.map((t) => t.symbol),
    );
  }
  renderGuestMode() {
    if (!this.container) return;
    const guestTickers = this.app.state.get("guestWatchlist.tickers");
    const isAuth = false;
    this.container.innerHTML = this.template({
      activeTab: "all",
      tickers: guestTickers,
      isAuth,
    });
    // Запускаем WebSocket для гостевых тикеров (опционально)
    const symbols = guestTickers.map((t) => t.symbol);
    this.app.emit("watchlist:symbols", symbols);
  }
  render(data) {
    const isAuth = this.app.state.get("isAuth");
    if (!isAuth) {
      this.renderGuestMode();
      return;
    }
    this.container.innerHTML = this.template({
      activeTab: this.currentTab,
      isAuth: this.app.state.get("isAuth"),
      ...data,
    });
    this._highlightActiveSymbol();
  }
  showAddTickerModal() {
    this.app.get("modal").show({
      title: "Добавить тикер",
      body: Templates["modals/add-ticker"](),
      size: "md",
      actions: {
        buttons: [
          { text: "Отмена", class: "btn-secondary", dismiss: true },
          { text: "Перейти", class: "btn-primary", action: "route" },
          { text: "Добавить", class: "btn-primary", action: "submit" },
        ],
        onAction: async (act) => {
          if (act === "submit") {
            const form = document.querySelector("#addTickerForm");
            let symbol = form.symbol.value.toUpperCase().trim();
            if (!symbol) return;
            if (!symbol.endsWith("USDT")) {
              symbol = symbol + "USDT";
            }
            try {
              await this.app.get("api").post("/api/create", { symbol });
              this.app.get("modal").hide();
              // Перезагружаем текущую вкладку
              this.currentTab = "all";
              this.loadTab();
              this.app.get("router").navigateToSymbol(symbol);
            } catch (err) {
              alert(err.message);
            }
          }
          if (act === "route") {
            const form = document.querySelector("#addTickerForm");
            let symbol = form.symbol.value.toUpperCase().trim();
            if (!symbol) return;
            if (!symbol.endsWith("USDT")) {
              symbol = symbol + "USDT";
            }
            const data = await this.app
              .get("api")
              .get(
                `https://api.bybit.com/v5/market/instruments-info?category=linear&symbol=${symbol}`,
              );
            if (data.retCode !== 0) {
              alert(`Error API: ${data.retMsg}`);
              return false;
            }
            this.app.get("modal").hide();
            this.app.get("router").navigateToSymbol(symbol);
          }
        },
      },
    });
  }
  async toggleFavorite(symbol, btn) {
    const ticker = this.getTicker(symbol);
    if (!btn || !ticker) return;
    const fieldData = !ticker.star;
    await this.app
      .get("api")
      .post(`/api/edit/${symbol}`, { fieldName: "star", fieldData });
    btn.innerHTML = fieldData ? "❤️" : "🖤";
    ticker.star = fieldData;
  }
  async deleteTicker(symbol) {
    const row = this.container?.querySelector(`tr[data-symbol="${symbol}"]`);
    if (!row) return;
    const confirmed = await new Promise((res) => {
      this.app.get("modal").show({
        title: "Подтверждение",
        body: `<p>Удалить ${symbol}?</p>`,
        size: "sm",
        actions: {
          buttons: [
            { text: "Удалить", class: "btn-danger", action: "confirm" },
          ],
          onAction: (a) => res(a === "confirm"),
        },
      });
    });
    if (!confirmed) return;
    setTimeout(() => row.remove(), 200);
    try {
      await this.app.get("api").post(`/api/delete/${symbol}`);
      const currentSymbol = this.app.state.get("symbol");
      if (currentSymbol === symbol) {
        this.app.get("router").navigateToHome();
      }
      this.app.get("modal").hide();
      const tickers = this.app.state.get("watchlist.tickers");
      const filtered = tickers.filter((t) => t.symbol !== symbol);
      this.app.state.set("watchlist.tickers", filtered);
      row.style.transition = "opacity 0.2s";
      row.style.opacity = "0";
      setTimeout(() => row.remove(), 200);
    } catch {
      alert("Не удалось удалить тикер");
    }
  }
  getTicker(symbol) {
    return this.app.state
      .get("watchlist.tickers")
      ?.find((t) => t.symbol === symbol);
  }
  _highlightActiveSymbol() {
    if (!this.container) return;
    const currentSymbol = this.app.state.get("symbol");
    const rows = this.container.querySelectorAll("tr[data-symbol]");
    rows.forEach((row) => {
      if (row.dataset.symbol === currentSymbol) {
        row.classList.add("table-primary");
      } else {
        row.classList.remove("table-primary");
      }
    });
  }
}
