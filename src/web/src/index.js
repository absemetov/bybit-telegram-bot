//algolia search
const { autocomplete, getAlgoliaResults } = window["@algolia/autocomplete-js"];
const { liteClient } = window["algoliasearch/lite"];
const searchClient = liteClient(
  "YSHMAC99ZS",
  "c9f2ff23faccc8a423feb221fdbfdb53",
);
autocomplete({
  debug: true,
  container: "#autocomplete",
  placeholder: "Search for tickers",
  detachedMediaQuery: "(max-width: 991.98px)",
  openOnFocus: true,
  onSubmit({ state }) {
    window.location.href = `https://bybit.rzk.com.ru/t/${state.query}`;
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
          window.location.href = `https://bybit.rzk.com.ru/t/${item.symbol}`;
        },
      },
    ];
  },
});
//add to favorites
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
  likeButton.innerText = fieldData ? "❤️" : "🖤";
}
const tickerForm = document.getElementById("tickerFormEdit");
const tickerEditModalEl = document.getElementById("tickerEditModal");
const tickerEditModal = new window.bootstrap.Modal(tickerEditModalEl);

const chartModalEl = document.getElementById("chartModal");
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
let candlestickSeries;
let volumeSeries;
//let idInterval;
const chartContainer = document.getElementById("simpleChart");
//add legend
const legend = document.createElement("div");
legend.style = `position: absolute; left: 25px; top: 80px; z-index: 100; font-size: 20px; font-family: sans-serif; line-height: 18px; font-weight: 300;`;
chartContainer.appendChild(legend);
const firstRow = document.createElement("div");
firstRow.innerHTML = "Volume:";
legend.appendChild(firstRow);
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
}
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
  candlestickSeries.setData(resJson.candlesArray.reverse());
  volumeSeries.setData(resJson.candlesArray);
  //chart.timeScale().fitContent();
  chart.timeScale().scrollToPosition(9);
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
  for (const [index, alert] of alerts.entries()) {
    const isAlertHover =
      alert?.options().price &&
      Math.abs(checkPrice - alert?.options().price) / checkPrice < 0.01;
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
      firstRow.innerHTML = `Volume: ${volumeSeries.priceFormatter().format(datapoints.value)}`;
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
chart.resize(window.innerWidth - 15, window.innerHeight - 95);
//show modal fullscreen
chartModalEl.addEventListener("show.bs.modal", async (event) => {
  openButton = event.relatedTarget;
  symbol = openButton.dataset.symbol;
  //set title
  const modalTitle = chartModalEl.querySelector(".modal-title");
  modalTitle.textContent = `Chart ${symbol}`;
  candlestickSeries = chart.addCandlestickSeries({
    priceFormat: {
      type: "price",
      //precision: 5,
      minMove: 0.00001,
    },
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
  //set alerts
  const response = await fetch(`/alerts/${symbol}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
  });
  const resJson = await response.json();
  if (!response.ok) {
    alert(resJson.message);
    return false;
  }
  alerts = [];
  for (const value of resJson.alerts) {
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
  chart.subscribeClick(handleClick);
  chart.subscribeCrosshairMove(handleCrosshairMove);
  await setChartInterval(chartInterval);
});

//hide chart
chartModalEl.addEventListener("hide.bs.modal", () => {
  if (candlestickSeries) {
    chart.removeSeries(candlestickSeries);
    chart.removeSeries(volumeSeries);
    //chart.remove();
    //chart = null;
  }
});
