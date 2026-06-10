export class Api {
  constructor(app) {
    this.app = app;
    //this.baseURL = "https://api.rzk.com.ru";
  }

  init() {
    console.log("[Api:init]");
  }

  async request(url, opts = {}) {
    const token = this.app.state.get("token");
    const bybitUser = localStorage.getItem("bybitUser") || "main";
    const headers = { "Content-Type": "application/json", ...opts.headers };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (bybitUser) headers.bybitUser = bybitUser;
    //const fullUrl = url.startsWith("http") ? url : `${this.baseURL}${url}`;
    const res = await fetch(url, { ...opts, headers });

    if (res.ok) {
      return res.json();
    }

    let errorData = {};
    try {
      errorData = await res.json();
    } catch {
      errorData = { message: res.statusText || "Ошибка сервера" };
    }

    if (res.status === 401) {
      console.warn("[Api] Unauthorized, logging out");
      this.app.get("header")?.showLoginModal();
    }

    const error = new Error(
      errorData.message || errorData.error || `HTTP ${res.status}`,
    );
    error.status = res.status;
    error.data = errorData;
    throw error;
  }

  get(url) {
    return this.request(url);
  }
  post(url, data) {
    return this.request(url, { method: "POST", body: JSON.stringify(data) });
  }
}
