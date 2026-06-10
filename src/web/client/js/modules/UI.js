import { Templates } from "@js/generated/templates.js";
import "@styles/main.scss";

export class UI {
  constructor(app) {
    this.app = app;
    this.root = document.getElementById("app");
    this.templates = {
      mainLayout: Templates["layouts/main"],
      dashboardPage: Templates["pages/dashboard"],
    };
  }

  init() {
    this.render();
    //optimizer progress bar
    this.app.on("optimization:start", ({ total }) => {
      // Показываем прогресс-бар (можно заменить на модалку или статусную строку)
      const progressHtml = `
        <div class="text-center py-5">
          <h5>Оптимизация запущена</h5>
          <p>Комбинаций: <span id="optTotal">${total}</span></p>
          <div class="progress">
            <div id="optProgressBar" class="progress-bar" role="progressbar" style="width: 0%;"></div>
          </div>
          <p class="mt-2">Завершено: <span id="optCompleted">0</span></p>
        </div>
      `;
      // Открываем маленькое модальное окно с прогрессом
      this.app.get("modal").show({
        title: "Прогресс оптимизации",
        body: progressHtml,
        size: "sm",
        actions: {
          buttons: [
            { text: "Закрыть", class: "btn-secondary", dismiss: true },
            { text: "Остановить", class: "btn-primary", action: "stop" },
          ],
          onAction: (action) => {
            if (action === "stop") {
              this.app.get("simulator").stopOptimization();
            }
          },
        },
      });
    });

    this.app.on("optimization:progress", ({ completed, total }) => {
      const percent = Math.round((completed / total) * 100);
      const bar = document.getElementById("optProgressBar");
      const compEl = document.getElementById("optCompleted");
      if (bar) bar.style.width = percent + "%";
      if (compEl) compEl.textContent = completed;
    });
  }

  render() {
    const s = this.app.state.get();
    this.root.innerHTML = this.templates.mainLayout({
      isAuth: s.isAuth,
      user: s.user,
      body: this.templates.dashboardPage({
        symbol: s.symbol,
        isAuth: s.isAuth,
      }),
    });
    console.log("[Ui:emit > dashboardReady]");
    this.app.emit("dashboardReady");
    const i18n = this.app.get("i18n");
    if (i18n) i18n.updateMetaTags(s.symbol);
    this.updateWidgetHeights();
  }
  updateWidgetHeights() {
    const headerHeight =
      document.getElementById("headerWidgetContainer")?.offsetHeight || 48;
    const gap = 16; // 1rem (gap-3)
    const viewportHeight = window.innerHeight - headerHeight;
    const widgetCount = 2;
    const widgetHeight =
      (viewportHeight - gap * (widgetCount - 1)) / widgetCount;

    const rightCol = this.root.querySelector(".col-lg-3.d-flex.flex-column");
    if (rightCol) {
      rightCol.style.height = viewportHeight + "px";
      const cards = rightCol.querySelectorAll(".card");
      cards.forEach((card) => {
        card.style.maxHeight = widgetHeight + "px";
        card.style.height = widgetHeight + "px";
      });
    }
  }
  // updateDataBindings() {
  //   const s = this.app.state.get();
  //   document.querySelectorAll("[data-bind]").forEach(el => {
  //     const val = el.dataset.bind.split(".").reduce((o, k) => o?.[k], s);
  //     el.textContent = el.dataset.bind.includes("price") ? Number(val).toFixed(2) : val || "";
  //   });
  // }
}
