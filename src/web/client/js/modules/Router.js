export class Router {
  constructor(app) {
    this.app = app;
  }
  init() {
    window.addEventListener("hashchange", () => this.handleRoute());
    this.handleRoute();
  }
  handleRoute() {
    const hash = window.location.hash.slice(2) || "";
    const parts = hash.split("/");
    const symbol = parts[0] || this.app.state.get("symbol");
    this.app.state.set("symbol", symbol);
    console.log(`[Router: emit symbolChanged ${symbol}`);
    this.app.emit("symbolChanged", symbol);
  }
  navigateToSymbol(symbol) {
    window.location.hash = `#/${symbol}`;
  }
  navigateToHome() {
    window.location.hash = "#/";
  }
}
