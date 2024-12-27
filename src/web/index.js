import express from "express";
import { create } from "express-handlebars";
import Ticker from "../models/Ticker.js";
import Alert from "../models/Alert.js";
import moment from "moment";

const app = express();
const PORT = 3003;
// handlebars engine
const handlebars = create({
  helpers: {
    greater(value) {
      return value > 0;
    },
    equals(value1, value2) {
      return value1 === value2;
    },
    formatNumber(value) {
      return value.toLocaleString("ru-Ru");
    },
    moment(timestampSeconds) {
      return moment.unix(timestampSeconds).fromNow();
    },
    formatDate(timestamp) {
      return new Date(timestamp).toLocaleString("ru-RU", {
        timeZone: "Europe/Moscow",
      });
    },
    intervalK(interval) {
      const textToMinutesK = {
        "1min": 1,
        "5min": 5,
        "15min": 15,
        "30min": 30,
        "1h": 60,
        "4h": 240,
        "6h": 360,
        "12h": 720,
        "1d": "D",
        "1w": "W",
      };
      return textToMinutesK[interval];
    },
  },
});
app.engine("handlebars", handlebars.engine);
app.set("view engine", "handlebars");
app.set("views", "./src/web/views");
//new alerts
app.get("/", async (req, res) => {
  const title = "Bybit pump alerts";
  const { symbol, direction, lastVisibleId } = req.query;
  const paginate = await Alert.paginate(10, direction, lastVisibleId, symbol);
  res.render("index", { title, paginate });
});
//tickers page
app.get("/tickers", async (req, res) => {
  const title = "Bybit pump tickers";
  const { direction, lastVisibleId } = req.query;
  const paginate = await Ticker.paginate(10, direction, lastVisibleId);
  res.render("tickers", { title, paginate });
});
//ticker page
app.get("/tickers/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const title = `${symbol} - Bybit pump tickers`;
  const ticker = await Ticker.find(symbol);
  const alerts = await Alert.all(symbol);
  res.render("ticker", { title, ticker, alerts });
});
//ticker tv
app.get("/tickers/:symbol/tv", async (req, res) => {
  const { symbol } = req.params;
  const title = `${symbol} chart - Bybit pump tickers`;
  const ticker = await Ticker.find(symbol);
  res.render("chart", { title, ticker });
});
// app.get("/:interval", async (req, res) => {
//   const { interval } = req.params;
//   const { startAfter, endBefore } = req.query;
//   const title = `Scan interval ${interval} - Bybit`;
//   let paginate;
//   if (endBefore) {
//     const ticker = await Scan.tickerDoc(interval, endBefore);
//     paginate = await Scan.paginateScan(interval, 25, null, ticker);
//   } else if (startAfter) {
//     const ticker = await Scan.tickerDoc(interval, startAfter);
//     paginate = await Scan.paginateScan(interval, 25, ticker);
//   } else {
//     paginate = await Scan.paginateScan(interval, 25);
//   }

//   res.render("scan", { title, interval, paginate });
// });

// app.get("/:interval/:symbol", async (req, res) => {
//   const { interval, symbol } = req.params;
//   const ticker = await Scan.ticker(interval, symbol);
//   const title = `${symbol} - ${interval} - Bybit`;
//   res.render("ticker", { title, interval, ticker });
// });

app.listen(PORT, () => {
  console.log(`Bot-Web app listening on port ${PORT}`);
});
