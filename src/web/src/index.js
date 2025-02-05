//algolia search
const { autocomplete, getAlgoliaResults } = window["@algolia/autocomplete-js"];
const { liteClient } = window["algoliasearch/lite"];
const { createLocalStorageRecentSearchesPlugin } =
  window["@algolia/autocomplete-plugin-recent-searches"];
const searchClient = liteClient(
  "YSHMAC99ZS",
  "c9f2ff23faccc8a423feb221fdbfdb53",
);
const recentSearchesPlugin = createLocalStorageRecentSearchesPlugin({
  key: "navbar",
  transformSource({ source }) {
    return {
      ...source,
      onSelect({ item }) {
        window.location.href = `https://bybit.rzk.com.ru/#${item.label}`;
      },
    };
  },
});
autocomplete({
  debug: true,
  container: "#autocomplete",
  placeholder: "Search for tickers",
  detachedMediaQuery: "(max-width: 991.98px)",
  openOnFocus: true,
  plugins: [recentSearchesPlugin],
  onSubmit({ state }) {
    window.location.href = `https://bybit.rzk.com.ru/#${state.query}`;
  },
  getSources() {
    return [
      {
        sourceId: "querySuggestions",
        getItemInputValue: ({ item }) => item.symbol,
        getItems({ query }) {
          return getAlgoliaResults({
            searchClient,
            queries: [
              {
                indexName: "crypto",
                params: {
                  query,
                  hitsPerPage: 4,
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
                    ${components.Highlight({ hit: item, attribute: "symbol" })}
                  </div>
                  <b>${item.lastPrice}$ (${item.price24hPcnt.toFixed(2)}%)</b>
                </div>
              </div>
            </div>`;
          },
        },
        onSelect({ item }) {
          recentSearchesPlugin.data.addItem({
            id: item.symbol,
            label: item.symbol,
          });
          window.location.href = `https://bybit.rzk.com.ru/#${item.symbol}`;
        },
      },
    ];
  },
});
//add to favorites
// eslint-disable-next-line no-unused-vars
async function likeTicker(event, symbol) {
  const likeButton = event.target;
  const { favorites } = likeButton.dataset;
  const fieldData = !(favorites === "true");
  const response = await fetch(`/favorites/${symbol}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
    body: JSON.stringify({
      favorites: fieldData,
    }),
  });
  const resJson = await response.json();
  if (!response.ok) {
    alert(resJson.message);
    return;
  }
  likeButton.setAttribute("data-favorites", fieldData);
  likeButton.innerText = fieldData ? "🔔" : "🔕";
}
const tickerForm = document.getElementById("tickerFormEdit");
const tickerEditModalEl = document.getElementById("tickerEditModal");
const tickerEditModal = new window.bootstrap.Modal(tickerEditModalEl);
const bsOffcanvas = new window.bootstrap.Offcanvas("#offcanvasResponsive");

const chartModalEl = document.getElementById("chartModal");
//const chartModal = new window.bootstrap.Modal(chartModalEl);
let editButton;
// set form data deprecated!!!
tickerEditModalEl.addEventListener("shown.bs.modal", (event) => {
  editButton = event.relatedTarget;
  const { symbol, alertDown, alertUp } = editButton.dataset;
  const modalTitle = tickerEditModalEl.querySelector(".modal-title");
  modalTitle.textContent = symbol;
  const alertDownField = document.getElementById("alertDown");
  const alertUpField = document.getElementById("alertUp");
  alertDownField.value = alertDown ? parseFloat(alertDown).toFixed(4) : "";
  alertUpField.value = alertUp ? parseFloat(alertUp).toFixed(4) : "";
  tickerForm.action = `/edit/${symbol}`;
  alertDownField.focus();
  alertDownField.select();
});
//submit edit form
tickerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const alertUp = formData.get("alertUp");
  const alertDown = formData.get("alertDown");
  const response = await fetch(tickerForm.action, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
    body: JSON.stringify({
      alertUp,
      alertDown,
    }),
  });
  const resJson = await response.json();
  if (!response.ok) {
    alert(resJson.message);
    return false;
  }
  editButton.setAttribute("data-alert-up", alertUp);
  editButton.setAttribute("data-alert-down", alertDown);
  const alertsDom = document.getElementById("alerts");
  alertsDom.innerHTML = `Alerts ${alertDown} - ${alertUp}`;
  // hide modal
  tickerEditModal.hide();
});

// simle chart with alerts
//set Alert lines
let alerts = [];
//let alertUpLine;
//let alertDownLine;
let chartInterval = "1h";
let hoveredAlert = null;
let selectedAlert = null;
let currentPriceMove = null;
let isDroped = true;
let openButton;
let symbol;
let candlestickSeries = null;
let volumeSeries;
//let idInterval;
const chartContainer = document.getElementById("simpleChart");
//add legend
// const legend = document.createElement("div");
// legend.style = `position: absolute; left: 25px; top: 80px; z-index: 100; font-size: 20px; font-family: sans-serif; line-height: 18px; font-weight: 300;`;
// chartContainer.appendChild(legend);
const volumeEl = document.getElementById("volumeEl");
const symbolEl = document.getElementById("symbolEl");
//legend.appendChild(firstRow);
//timeframes btns
const buttonsContainer = document.getElementById("chartButtons");
const intervals = ["15min", "1h", "4h", "1d", "1w"];
if (buttonsContainer.innerHTML === "") {
  intervals.forEach((interval) => {
    const button = document.createElement("button");
    button.id = interval;
    button.classList.add("btn");
    button.innerText = interval;
    button.addEventListener("click", () => setChartInterval(interval));
    buttonsContainer.appendChild(button);
  });
  const updateButton = document.createElement("button");
  updateButton.classList.add("btn");
  updateButton.innerText = "🔃";
  updateButton.addEventListener("click", () => showChart(symbol));
  buttonsContainer.appendChild(updateButton);
}

//default colors
function defaultAlerts() {
  for (const alert of alerts) {
    alert.applyOptions({
      color: "blue",
    });
  }
  chartContainer.style.cursor = "default";
  chart.applyOptions({ handleScroll: true, handleScale: true });
  hoveredAlert = null;
}
//hover alerts
function checkHover(checkPrice) {
  if (isDroped) {
    for (const [index, alert] of alerts.entries()) {
      const isAlertHover =
        alert?.options().price &&
        Math.abs(checkPrice - alert?.options().price) / checkPrice < 0.005;
      if (isAlertHover) {
        hoveredAlert = `alert${index + 1}`;
        alert.applyOptions({
          color: "orange",
        });
        chartContainer.style.cursor = "pointer";
        return;
      }
    }
    defaultAlerts();
  }
}
//save alerts
async function saveAlert(symbol, alertName, alertValue) {
  const response = await fetch(`/edit-alert/${symbol}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
    body: JSON.stringify({
      alertName,
      alertValue,
    }),
  });
  const resJson = await response.json();
  //error msg
  if (!response.ok) {
    alert(resJson.message);
  }
}
//cross events
function handleCrosshairMove(param) {
  if (!param.point) {
    return;
  }
  //update volume
  if (param.time) {
    const datapoints = param.seriesData.get(volumeSeries);
    if (datapoints) {
      volumeEl.innerHTML = `Volume: ${volumeSeries.priceFormatter().format(datapoints.value)}`;
    }
  }
  currentPriceMove = candlestickSeries.coordinateToPrice(param.point.y);
  checkHover(currentPriceMove);
  //drag effect
  if (isDroped) {
    return;
  }
  for (const [index, alert] of alerts.entries()) {
    if (selectedAlert === `alert${index + 1}`) {
      alert.applyOptions({
        price: currentPriceMove,
      });
      chart.applyOptions({ handleScroll: false, handleScale: false });
      return;
    }
  }
}
function handleClick() {
  defaultAlerts();
}
//drag
chartContainer.addEventListener("mousedown", () => {
  //choose alert
  selectedAlert = hoveredAlert;
  for (const index of alerts.keys()) {
    if (selectedAlert === `alert${index + 1}`) {
      isDroped = false;
    }
  }
});
//drop
chartContainer.addEventListener("mouseup", async () => {
  isDroped = true;
  //save alert
  if (selectedAlert) {
    //stop drop
    for (const index of alerts.keys()) {
      if (selectedAlert === `alert${index + 1}`) {
        await saveAlert(symbol, selectedAlert, currentPriceMove);
      }
    }
  }
  defaultAlerts();
  selectedAlert = null;
});
//touch events
//drag
chartContainer.addEventListener("touchmove", () => {
  //choose alert
  selectedAlert = hoveredAlert;
  for (const index of alerts.keys()) {
    if (selectedAlert === `alert${index + 1}`) {
      isDroped = false;
    }
  }
});
//drop
chartContainer.addEventListener("touchend", async () => {
  isDroped = true;
  //save alert
  if (selectedAlert) {
    //stop drop
    for (const index of alerts.keys()) {
      if (selectedAlert === `alert${index + 1}`) {
        await saveAlert(symbol, selectedAlert, currentPriceMove);
      }
    }
  }
  defaultAlerts();
  selectedAlert = null;
});
//show chart
//let chart;
const chart = window.LightweightCharts.createChart(chartContainer, {
  timeScale: {
    timeVisible: true,
    secondsVisible: false,
  },
  localization: {
    //priceFormatter: (p) => p.toFixed(5),
    timeFormatter: (timestamp) => {
      return new Date(timestamp * 1000).toLocaleString("ru-RU");
    },
  },
  crosshair: {
    // Change mode from default 'magnet' to 'normal'.
    // Allows the crosshair to move freely without snapping to datapoints
    mode: window.LightweightCharts.CrosshairMode.Normal,
    // Vertical crosshair line (showing Date in Label)
  },
});
//chart.resize(window.innerWidth - 15, window.innerHeight - 200);
chart.applyOptions({ height: window.innerHeight - 100 });
chart.subscribeClick(handleClick);
chart.subscribeCrosshairMove(handleCrosshairMove);
//show modal fullscreen
async function showChart(ticker) {
  symbol = ticker;
  await setChartInterval(chartInterval);
}
//deprecated
chartModalEl.addEventListener("show.bs.modal", async (event) => {
  openButton = event.relatedTarget;
  if (openButton) {
    symbol = openButton.dataset.symbol;
    //set title
    const modalTitle = chartModalEl.querySelector(".modal-title");
    const modalBody = chartModalEl.querySelector(".modal-body");
    modalTitle.innerHTML = `Ticker ${symbol}`;
    modalBody.innerHTML = `
    <div class="list-group">
      <a class="list-group-item list-group-item-action" href="https://www.tradingview.com/chart/8qtrvOgg/?symbol=BYBIT:${symbol}.P" target="_blank">📈 Tradingview chart</a>
      <a class="list-group-item list-group-item-action" href="https://www.coinglass.com/tv/ru/Bybit_${symbol}" target="_blank">📈 Coinglass chart</a>
      <a class="list-group-item list-group-item-action" href="https://www.tradingview.com/symbols/${symbol}/ideas/" target="_blank">🔭 TV Idea</a>
      <a class="list-group-item list-group-item-action" href="https://bybit.onelink.me/EhY6?af_web_dp=https://www.bybit.com/trade/usdt/${symbol}&af_xp=custom&pid=tradegpt&c=tele_share&af_dp=bybitapp://open/home?tab=2&symbol=${symbol}&page=chart&type=usdt&&source=GPT&orderType=Limit&af_force_deeplink=true" target="_blank">📟 Bybit</a>
      <a class="list-group-item list-group-item-action" href="https://t.me/WarsawDevBot?start=${symbol}" target="_blank">@Bot</a>
    </div>`;
  }
});
//render timeframes
async function setChartInterval(interval) {
  chartInterval = interval;
  //set active btn
  intervals.forEach((intervalId) => {
    document.getElementById(intervalId).classList.remove("btn-primary");
  });
  document.getElementById(interval).classList.add("btn-primary");
  //get ticker data
  const response = await fetch(`/candles/${symbol}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
    body: JSON.stringify({
      interval,
    }),
  });
  const resJson = await response.json();
  if (!response.ok) {
    alert(resJson.message);
    return false;
  }
  //order by time use reverse!
  if (candlestickSeries) {
    chart.removeSeries(candlestickSeries);
    chart.removeSeries(volumeSeries);
    candlestickSeries = null;
  }
  candlestickSeries = chart.addCandlestickSeries({
    priceFormat: {
      type: "price",
      //precision: 5,
      minMove: 0.00001,
    },
    //borderVisible: false,
  });
  //volume
  volumeSeries = chart.addHistogramSeries({
    color: "#26a69a",
    priceFormat: {
      type: "volume",
      // formatter: (price) => {
      //   return `${(price / 1000000).toFixed(2)}M`;
      // },
    },
    priceScaleId: "", // set as an overlay by setting a blank priceScaleId
    // set the positioning of the volume series
    scaleMargins: {
      top: 0.9, // highest point of the series will be 70% away from the top
      bottom: 0,
    },
  });
  volumeSeries.priceScale().applyOptions({
    scaleMargins: {
      top: 0.9, // highest point of the series will be 70% away from the top
      bottom: 0,
    },
  });
  candlestickSeries.setData(resJson.candlesArray.reverse());
  volumeSeries.setData(resJson.candlesArray);
  //set alerts
  //set alerts
  const alertsData = await fetch(`/alerts/${symbol}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
  });
  const alertsDataJson = await alertsData.json();
  if (!alertsData.ok) {
    alert(alertsDataJson.message);
    return false;
  }
  //clear alerts
  if (alerts.length) {
    for (const alert of alerts) {
      candlestickSeries.removePriceLine(alert);
    }
  }
  alerts = [];
  for (const value of alertsDataJson.alerts) {
    alerts.push(
      candlestickSeries.createPriceLine({
        price: value,
        color: "blue",
        lineWidth: 2,
        lineStyle: window.LightweightCharts.LineStyle.Dashed,
        axisLabelVisible: true,
      }),
    );
  }
  //hide lines in 1d 1w interval
  for (const alert of alerts) {
    alert.applyOptions({
      lineVisible:
        interval === "15min" || interval === "1h" || interval === "4h",
    });
  }
  //chart.timeScale().fitContent();
  chart.timeScale().scrollToPosition(3);
  symbolEl.innerHTML = `<button type="button" class="btn btn-outline-light" onclick="likeTicker(event, '${symbol}')" data-favorites="${resJson.ticker.favorites}">
    ${resJson.ticker.favorites ? "🔔" : "🔕"}
  </button>
  <a class="d-lg-none" data-bs-toggle="offcanvas" href="#offcanvasResponsive" role="button" aria-controls="offcanvasExample">
    ${symbol}
  </a> <span class="d-none d-lg-inline">${symbol}</span>
  <button type="button" data-symbol="${symbol}" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#chartModal">Info</button>`;
}
//hide chart
// chartModalEl.addEventListener("hide.bs.modal", () => {
//   if (candlestickSeries) {
//     chart.removeSeries(candlestickSeries);
//     chart.removeSeries(volumeSeries);
//     //chart.remove();
//     //chart = null;
//   }
// });
//open chart by hash
const loadFunction = async () => {
  if (window.location.hash) {
    symbol = window.location.hash.substring(1);
  }
  await showChart(symbol || "BTCUSDT");
  bsOffcanvas.hide();
};

document.addEventListener("DOMContentLoaded", async () => {
  await loadFunction();
});

window.addEventListener(
  "hashchange",
  async () => {
    await loadFunction();
  },
  false,
);
