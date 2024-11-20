import express from "express";
import { create } from "express-handlebars";
import Scan from "../models/Scan.js";
import moment from "moment";

const app = express();
const PORT = 3003;
// handlebars engine
const handlebars = create({
  helpers: {
    more(value) {
      if (value > 0) return true;
    },
    equals(value1, value2) {
      return value1 === value2;
    },
    formatNumber(value) {
      return value.toLocaleString("ru-Ru");
    },
    moment(seconds) {
      return moment.unix(seconds).fromNow();
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

app.get("/", (req, res) => {
  const title = "Bybit pump tickers";
  res.render("index", { title });
});

app.get("/:interval", async (req, res) => {
  const { interval } = req.params;
  const { startAfter, endBefore } = req.query;
  const title = `Scan interval ${interval} - Bybit`;
  let paginate;
  if (endBefore) {
    const ticker = await Scan.tickerDoc(interval, endBefore);
    paginate = await Scan.paginateScan(interval, 25, null, ticker);
  } else if (startAfter) {
    const ticker = await Scan.tickerDoc(interval, startAfter);
    paginate = await Scan.paginateScan(interval, 25, ticker);
    console.log(ticker);
  } else {
    paginate = await Scan.paginateScan(interval, 25);
  }

  res.render("scan", { title, interval, paginate });
});

app.get("/:interval/:symbol", async (req, res) => {
  const { interval, symbol } = req.params;
  const ticker = await Scan.ticker(interval, symbol);
  const title = `${symbol} - ${interval} - Bybit`;
  res.render("ticker", { title, interval, ticker });
});

app.listen(PORT, () => {
  console.log(`Bot-Web app listening on port ${PORT}`);
});
