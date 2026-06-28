export function registerHelpers(Handlebars) {
 
  Handlebars.registerHelper("change", (c) => {
    if (c === undefined || c === null) return "";
    return Number(c) >= 0 ? "▲" : "▼";
  });

  Handlebars.registerHelper("changeClass", (c) => {
    if (c === undefined || c === null) return "";
    return Number(c) >= 0 ? "text-success" : "text-danger";
  });

  Handlebars.registerHelper("tradingIcon", (algoSettings = {}, options) => {
    const { attemptsCount, size } = algoSettings;
    const btn = options.hash?.btn;
    if (attemptsCount === 6) {
      return "🔔";
    }
    if (attemptsCount >= 0) {
      return `${size}<span class="badge text-bg-success rounded-pill">${attemptsCount}</span>`;
    }
    if (btn) {
      return "🔴";
    }
  });
  Handlebars.registerHelper("formatNumber", (value = 0, decimals) => {
    if (value === undefined || value === null) return "—";
    const num = Number(value);
    const precision = typeof decimals === "number" ? decimals : 2;
    return isNaN(num) ? "—" : num.toFixed(precision);
  });
  Handlebars.registerHelper("formatPrice", (value = 0, decimals) => {
    const precision = typeof decimals === "number" ? decimals : 2;
    const str = (+value).toFixed(precision);
    return str.replace(/\./g, ",");
  });
  Handlebars.registerHelper("changePercent", (a, b) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (isNaN(numA) || isNaN(numB) || numB === 0) return "—";
    return ((Math.abs(numA - numB) / numB) * 100).toFixed(2);
  });
  Handlebars.registerHelper("formatDate", (dateString) => {
    if (!dateString) return "";
    const date = new Date(+dateString);
    return date.toLocaleString("ru-RU");
  });
  Handlebars.registerHelper("inc", (value) => parseInt(value) + 1);
  Handlebars.registerHelper("multiply", (a, b) => (a * b).toFixed(2));
  Handlebars.registerHelper("eq", (a, b) => a === b);
  Handlebars.registerHelper("gte", (a, b) => a >= b);
  Handlebars.registerHelper("gt", (a, b) => a > b);
  Handlebars.registerHelper("uppercase", (s) => String(s).toUpperCase());
  Handlebars.registerHelper("json", (ctx) => JSON.stringify(ctx, null, 2));
}
