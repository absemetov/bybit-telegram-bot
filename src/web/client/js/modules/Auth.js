export class Auth {
  constructor(app) {
    this.app = app;
  }
  init() {
    console.log("[Auth:init]");
    const saved = localStorage.getItem("auth");
    if (saved) {
      try {
        const session = JSON.parse(saved);
        this.app.state.set({
          isAuth: true,
          token: session.token,
          user: session.user,
        });
      } catch {
        localStorage.removeItem("auth");
      }
    }
  }
  async login(email, password) {
    try {
      const res = await this.app
        .get("api")
        .post("/api/login", { email, password });
      if (res.token && res.email) {
        const session = { token: res.token, user: res.email };
        localStorage.setItem("auth", JSON.stringify(session));
        //first hide
        this.app.get("modal").hide();
        //then render new template data
        this.app.state.set({ isAuth: true, token: res.token, user: res.email });
        const ui = this.app.get("ui");
        if (ui) {
          ui.render();
          this.app.emit("symbolChanged", this.app.state.get("symbol"));
        }
      }
    } catch (err) {
      console.error("[Auth] Login error:", err);
    }
  }
  logout() {
    localStorage.removeItem("auth");
    this.app.state.set({ isAuth: false, token: null, user: null });
    const ui = this.app.get("ui");
    if (ui) {
      this.app.get("modal").hide();
      ui.render();
      this.app.emit("symbolChanged", this.app.state.get("symbol"));
    }
  }
}
