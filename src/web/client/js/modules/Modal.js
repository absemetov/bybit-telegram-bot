import { Modal as BsModal } from "bootstrap";
export class Modal {
  constructor(app) {
    this.app = app;
    this._onAction = null;
    this._onRowClick = null;
  }
  init() {
    this.app.on("dashboardReady", () => this.mount());
  }
  mount() {
    this.el = document.getElementById("modal");
    this.bs = new BsModal(this.el);
    //click
    this.el.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (btn && this._onAction)
        this._onAction(btn.dataset.action, btn.dataset);
      const row = e.target.closest("tr[data-symbol]");
      if (row && this._onRowClick)
        this._onRowClick(row.dataset.symbol, row.dataset);
    });
    // Обработка Enter в форме
    this.el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        const form = e.target.closest("form");
        if (!form) return;
        // Не отправляем, если фокус на textarea (может быть нужно перенос строки)
        if (e.target.tagName === "TEXTAREA") return;

        e.preventDefault();
        // Ищем кнопку с action="submit" в футере
        const submitBtn = this.el.querySelector(
          '.modal-footer [data-action="submit"]',
        );
        if (submitBtn) {
          this._onAction("submit");
        }
      }
    });
    this.el.addEventListener("shown.bs.modal", () => {
      const firstInput = document.querySelector(
        "form input:not([type=hidden])",
      );
      if (firstInput) {
        firstInput.focus();
      }
    });
    // Когда модалка полностью скрыта
    this.el.addEventListener("hidden.bs.modal", () => {
      this._onAction = null;
      this._onRowClick = null;
    });
  }
  show(config) {
    const isVisible = this.el.classList.contains("show");
    this._applyConfig(config);
    if (!isVisible) {
      this.bs.show();
    }
  }
  _applyConfig({
    title,
    body,
    size = "",
    scrollable = true,
    actions,
    onRowClick,
  }) {
    const dialog = this.el.querySelector(".modal-dialog");
    dialog.className = "modal-dialog";
    if (size) dialog.classList.add(`modal-${size}`);
    if (scrollable) dialog.classList.add("modal-dialog-scrollable");
    this.el.querySelector(".modal-title").textContent = title;
    this.el.querySelector(".modal-body").innerHTML = body;
    const footer = this.el.querySelector(".modal-footer");
    footer.innerHTML = "";
    const btns = actions?.buttons || [
      { text: "Закрыть", class: "btn-secondary", dismiss: true },
    ];
    btns.forEach((b) => {
      const btn = document.createElement("button");
      btn.className = `btn ${b.class || "btn-secondary"}`;
      btn.textContent = b.text;
      if (b.action) btn.dataset.action = b.action;
      if (b.page) btn.dataset.page = b.page;
      if (b.disabled) btn.disabled = true;
      if (b.dismiss) btn.setAttribute("data-bs-dismiss", "modal");
      footer.appendChild(btn);
    });
    this._onAction = actions?.onAction || null;
    this._onRowClick = onRowClick || null;
  }
  updateBody(content) {
    this.el.querySelector(".modal-body").innerHTML = content;
  }
  updateButton(action, disabled) {
    const btn = this.el.querySelector(`[data-action="${action}"]`);
    if (btn) btn.disabled = disabled;
  }
  hide() {
    this.bs.hide();
  }
}
