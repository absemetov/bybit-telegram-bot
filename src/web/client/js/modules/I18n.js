import Handlebars from "handlebars/runtime";
export class I18n {
  constructor(app) {
    this.app = app;
    this.translations = {};
    this.seoTranslations = {};
  }

  async init() {
    this.currentLocale =
      localStorage.getItem("app_locale") ||
      this.app.state.get("settings.locale");
    this.app.state.set("settings.locale", this.currentLocale);
    await this.loadTranslations(this.currentLocale);
    await this.loadSeoTranslations(this.currentLocale);

    Handlebars.registerHelper("t", (key, context = {}) => {
      let text = this.translations[key] || key;
      if (context.hash) {
        Object.entries(context.hash).forEach(([k, v]) => {
          text = text.replace(`{${k}}`, v);
        });
      }
      return text;
    });
  }

  async loadSeoTranslations(locale) {
    try {
      const response = await fetch(`/locales/${locale}-seo.json`);
      if (!response.ok) throw new Error("Failed to load SEO translations");
      this.seoTranslations = await response.json();
      this.currentLocale = locale;
    } catch (err) {
      console.error(`[I18n] Cannot load SEO translations for ${locale}`, err);
    }
  }

  updateMetaTags(symbol = null) {
    const seo = this.seoTranslations;
    if (!seo) return;

    let title, description, keywords;

    if (symbol) {
      title = seo.ticker_title.replace(/\{\{symbol\}\}/g, symbol);
      description = seo.ticker_description.replace(/\{\{symbol\}\}/g, symbol);
      keywords = seo.default_keywords + `, ${symbol}`;
    } else {
      title = seo.default_title;
      description = seo.default_description;
      keywords = seo.default_keywords;
    }

    document.title = title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", description);
    document
      .querySelector('meta[name="keywords"]')
      ?.setAttribute("content", keywords);
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute("content", title);
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute("content", description);
    document
      .querySelector('meta[name="twitter:title"]')
      ?.setAttribute("content", title);
    document
      .querySelector('meta[name="twitter:description"]')
      ?.setAttribute("content", description);
  }

  async loadTranslations(locale) {
    try {
      const response = await fetch(`/locales/${locale}.json`);
      if (!response.ok) throw new Error("Failed to load");
      const data = await response.json();
      this.translations = data;
      this.currentLocale = locale;
      localStorage.setItem("app_locale", locale);
      return data;
    } catch (err) {
      console.error(`[I18n] Cannot load translations for ${locale}`, err);
      return {};
    }
  }

  async setLocale(locale) {
    if (locale === this.currentLocale) return;
    await this.loadTranslations(locale);
    await this.loadSeoTranslations(locale);
    this.app.state.set("settings.locale", locale);
    const ui = this.app.get("ui");
    if (ui) {
      ui.render();
      this.app.emit("symbolChanged", this.app.state.get("symbol"));
    }
    //this.app.emit("localeChanged", locale);
  }
  //for js
  t(key, params = {}) {
    let text = this.translations[key] || key;
    Object.entries(params).forEach(
      ([k, v]) => (text = text.replace(`{${k}}`, v)),
    );
    return text;
  }
}
