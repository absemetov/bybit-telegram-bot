import { Templates } from "@js/generated/templates.js";

export class Header {
  constructor(app) {
    this.app = app;
    this.container = null;
    this.templates = {
      header: Templates["widgets/header"],
      loginModal: Templates["modals/login"],
      positionsTable: Templates["modals/positions"],
      ordersTable: Templates["modals/orders"],
      historyTable: Templates["modals/history-positions"],
      winrateTable: Templates["modals/win-rate"],
    };
  }

  init() {
    this.app.on("dashboardReady", () => {
      const bybitUser = localStorage.getItem("bybitUser") || "main";
      this.app.state.set("bybitUser", bybitUser);
      console.log("[Header: init]");
      this.container = document.getElementById("headerWidgetContainer");
      if (this.container) {
        this.render();
        this.attachEvents();
      }
    });

    this.app.state.subscribe((newState, oldState) => {
      if (!this.container) return;
      if (newState.algoSettings?.balance !== oldState?.algoSettings?.balance) {
        this.render();
      }
    });
  }

  render() {
    const state = this.app.state.get();
    this.container.innerHTML = this.templates.header({
      isAuth: state.isAuth,
      user: state.user,
      balance: state.algoSettings.balance,
      bybitUser: state.bybitUser || "main",
      locale: state.settings.locale,
    });
  }

  attachEvents() {
    this.container.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const action = btn.dataset.action;
      const all = btn.dataset.all;
      if (action === "login") this.showLoginModal();
      if (action === "logout") this.app.get("auth").logout();
      if (this.app.state.get("isAuth")) {
        if (action === "showPositions") this.showPositionsModal();
        if (action === "showOrders") this.showOrdersModal();
        if (action === "showHistory") this.showHistoryModal(all);
        if (action === "showWinrate") this.showWinrateModal(all);
        if (action === "showSettings") this.showSettingsModal();
        if (action === "toggleBybitUser") {
          const current = localStorage.getItem("bybitUser") || "main";
          const next = current === "main" ? "sub" : "main";
          this.app.state.set("bybitUser", next);
          localStorage.setItem("bybitUser", next);
          const ui = this.app.get("ui");
          if (ui) {
            ui.render();
            this.app.emit("symbolChanged", this.app.state.get("symbol"));
          }
        }
        if (action === "showScannerModal") {
          this.showScannerModal();
        }
      }
      if (action === "toggleLocale") {
        const current = this.app.state.get("settings.locale") || "ru";
        const next = current === "ru" ? "en" : "ru";
        this.app.get("i18n").setLocale(next);
      }
    });
  }
  async showScannerModal() {
    const modal = this.app.get("modal");

    // Показываем модалку с загрузкой
    modal.show({
      title: "Управление сканером",
      body: Templates["modals/scanner-control"]({ loading: true }),
      size: "sm",
      actions: {
        buttons: [{ text: "Закрыть", class: "btn-secondary", dismiss: true }],
        onAction: async (action) => {
          if (action === "toggleScanner") {
            const api = this.app.get("api");
            try {
              // Сначала получим текущий статус
              const status = await api.get("/api/scanner/status");
              if (status.running) {
                await api.post("/api/scanner/stop");
              } else {
                await api.post("/api/scanner/start");
              }
              const newStatus = !status.running;
              // Обновляем содержимое модалки
              modal.updateBody(Templates["modals/scanner-control"]({
                scannerRunning: newStatus,
              }));
            } catch (err) {
              alert("Ошибка переключения сканера: " + err.message);
            }
          }
        },
      },
    });

    // После открытия запрашиваем статус и обновляем модалку
    const api = this.app.get("api");
    try {
      const status = await api.get("/api/scanner/status");
      modal.updateBody(Templates["modals/scanner-control"]({
        scannerRunning: status.running,
      }));
    } catch (err) {
      modal.updateBody(Templates["modals/scanner-control"]({
        scannerRunning: false,
      }));
    }
  }
  showLoginModal() {
    this.app.get("modal").show({
      title: "Вход",
      body: this.templates.loginModal(),
      size: "md",
      actions: {
        buttons: [
          { text: "Отмена", class: "btn-secondary", dismiss: true },
          { text: "Войти", class: "btn-primary", action: "submit" },
        ],
        onAction: async (act) => {
          if (act === "submit") {
            const f = document.querySelector("#loginForm");
            await this.app.get("auth").login(f.email.value, f.password.value);
          }
        },
      },
    });
  }

  async showPositionsModal() {
    const modal = this.app.get("modal");
    let cursor = null;

    const load = async (cursor = "") => {
      modal.updateButton("next", true);

      try {
        const data = await this.app.get("api").post("/api/positions", {
          cursor,
        });
        cursor = data.nextPageCursor;
        modal.updateBody(
          this.templates.positionsTable({
            positions: data.positions || [],
            cursor: data.nextPageCursor,
          }),
        );

        modal.updateButton("next", !cursor);
      } catch (err) {
        console.log(err);
        // modal.updateBody(
        //   `<div class="alert alert-danger m-2">Ошибка загрузки ${err}</div>`,
        // );
      }
    };

    modal.show({
      title: "Открытые позиции",
      body: `<div class="text-center py-5"><div class="spinner-border"></div></div>`,
      size: "lg",
      actions: {
        buttons: [
          { text: "Update", class: "btn-outline-secondary", action: "update" },
          {
            text: "Вперёд →",
            class: "btn-outline-secondary",
            action: "next",
            disabled: true,
          },
          { text: "Закрыть", class: "btn-secondary", dismiss: true },
        ],
        onAction: (action, dataset) => {
          if (action === "update") load();
          if (action === "next") load(cursor);
          if (action === "closePosition") closePosition(dataset);
        },
      },
      onRowClick: (symbol) => {
        this.app.get("router").navigateToSymbol(symbol);
      },
    });

    const closePosition = async (dataset) => {
      const { symbol, side, qty } = dataset;
      if (confirm(`Delete position ${symbol} ${side} ${qty}?`)) {
        try {
          const data = await this.app
            .get("api")
            .post(`/api/position/close/${symbol}`, {
              side,
              qty,
            });
          modal.updateBody(
            this.templates.positionsTable({
              positions: data.positions || [],
              cursor: data.nextPageCursor,
            }),
          );
          //TODO delete positions from chart!!!
          this.app.get("chart").visiblePositions(false);
        } catch (error) {
          alert(`Error: ${error.message}`);
        }
      }
    };

    modal.el.addEventListener("shown.bs.modal", () => load(), { once: true });
  }
  // ---------- Ордера ----------
  async showOrdersModal() {
    const modal = this.app.get("modal");
    let cursor = null;

    const load = async (cursor = null) => {
      modal.updateButton("next", true);

      try {
        const data = await this.app.get("api").post("/api/orders", {
          cursor,
        });
        cursor = data.nextPageCursor;
        modal.updateBody(
          this.templates.ordersTable({
            orders: data.orders || [],
            cursor: data.nextPageCursor,
          }),
        );

        modal.updateButton("next", !cursor);
      } catch (err) {
        modal.updateBody(
          `<div class="alert alert-danger m-2">Ошибка загрузки ${err}</div>`,
        );
      }
    };

    modal.show({
      title: "Активные ордера",
      body: `<div class="text-center py-5"><div class="spinner-border"></div></div>`,
      size: "lg",
      actions: {
        buttons: [
          {
            text: "Вперёд →",
            class: "btn-outline-secondary",
            action: "next",
            disabled: true,
          },
          { text: "Закрыть", class: "btn-secondary", dismiss: true },
        ],
        onAction: (action, dataset) => {
          if (action === "next") load(cursor);
          if (action === "deleteOrder") deleteOrder(dataset);
        },
      },
      onRowClick: (symbol) => {
        this.app.get("router").navigateToSymbol(symbol);
      },
    });

    const deleteOrder = async (dataset) => {
      const { symbol, side, orderId, price } = dataset;
      if (confirm(`Delete order ${side} ${symbol} by ${price}$?`)) {
        try {
          const data = await this.app
            .get("api")
            .post(`/api/order/cancel/${symbol}`, {
              orderId,
            });
          modal.updateBody(
            this.templates.ordersTable({
              orders: data.orders || [],
              cursor: data.nextPageCursor,
            }),
          );
          //TODO delete orders from chart!!!
          // this.app.get("chart").positionLines["stop"].applyOptions({
          //   lineVisible: false,
          //   axisLabelVisible: false,
          // });
        } catch (error) {
          alert(`Error: ${error.message}`);
        }
      }
    };

    modal.el.addEventListener("shown.bs.modal", () => load(), { once: true });
  }
  // ---------- History ----------
  async showHistoryModal(allCoins = false) {
    this.allCoins = allCoins;
    const modal = this.app.get("modal");
    const bybitUser = this.app.state.get("bybitUser");
    const symbol = this.app.state.get("symbol");
    const load = async (cursor = null) => {
      modal.updateButton("next", true);
      try {
        const data = await this.app
          .get("api")
          .post(`/api/positions-history/${this.allCoins ? "" : symbol}`, {
            cursor,
          });
        const {
          positions,
          totalData,
          lossTrades,
          profitableTrades,
          winRate,
          nextPageCursor,
        } = data;
        cursor = nextPageCursor;
        modal.updateBody(
          this.templates.historyTable({
            positions,
            allCoins: this.allCoins,
            totalData,
            lossTrades,
            profitableTrades,
            winRate,
          }),
        );

        modal.updateButton("next", !cursor);
      } catch (err) {
        modal.updateBody(
          `<div class="alert alert-danger m-2">Ошибка загрузки ${err}</div>`,
        );
      }
    };

    modal.show({
      title: `Trade history ${allCoins ? "" : symbol} - User ${bybitUser}`,
      body: `<div class="text-center py-5"><div class="spinner-border"></div></div>`,
      size: "lg",
      onRowClick: (symbol) => {
        this.app.get("router").navigateToSymbol(symbol);
      },
    });

    modal.el.addEventListener("shown.bs.modal", () => load(), { once: true });
  }
  // ---------- Винрейт ----------
  async showWinrateModal(allCoins = false) {
    const modal = this.app.get("modal");
    const symbol = this.app.state.get("symbol");
    const bybitUser = this.app.state.get("bybitUser");

    modal.show({
      title: `Win rate ${allCoins ? "ALL" : symbol} - User ${bybitUser}`,
      body: `<div class="text-center py-5"><div class="spinner-border"></div></div>`,
      size: "lg",
      buttons: [{ text: "Закрыть", class: "btn-secondary", dismiss: true }],
    });

    try {
      const data = await this.app
        .get("api")
        .post(`/api/win-rate/${allCoins ? "" : symbol}`);
      modal.updateBody(
        this.templates.winrateTable({
          winRate: data,
          allCoins,
        }),
      );
    } catch (err) {
      modal.updateBody(
        `<div class="alert alert-danger m-2">Ошибка загрузки ${err}</div>`,
      );
    }
  }
}
