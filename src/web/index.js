import express from "express";
import { Telegraf } from "telegraf";
import cors from "cors";
import { create } from "express-handlebars";
import Ticker from "../models/Ticker.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { createHash } from "crypto";
import { bybitUsers } from "../helpers/bybitV5.js";
import dotenv from "dotenv";
dotenv.config();
import { tasks } from "../schedule.js";
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
//algoTrading 4/03/2026
tasks(bot);
const app = express();
// Use CORS middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());
const PORT = 3003;
// handlebars engine
const handlebars = create({
  helpers: {
    greater(value) {
      return value > 0;
    },
    formatNumber(value) {
      if (value) {
        return value.toFixed(4);
      }
      return "";
    },
  },
});
app.engine("handlebars", handlebars.engine);
app.set("view engine", "handlebars");
app.set("views", "./src/web/views");
// auth midleware
const auth = (req, res, next) => {
  req.user = {};
  try {
    const token = req.cookies.__session;
    const authData = jwt.verify(token, process.env.TELEGRAM_BOT_TOKEN);
    req.user.auth = true;
    req.user.uid = authData.uid;
    req.user.userName = authData.userName;
  } catch {
    req.user.auth = false;
    req.user.uid = null;
  }
  return next();
};
const protectPage = (req, res, next) => {
  if (req.user.uid !== "94899148") {
    return res.redirect("/login");
  }
  return next();
};
app.use(auth);
app.get("/:symbol?/", protectPage, async (req, res) => {
  const title = "Bybit terminal";
  res.render("ticker", { title, user: req.user });
});
//AlgoTrading
app.post("/algo-trading/:symbol", protectPage, async (req, res) => {
  try {
    const { symbol } = req.params;
    const {
      tp,
      sl,
      size,
      attemptsCount,
      trend,
      candlesCount,
      touchCount,
      tolerance,
      breakeven,
      trailing,
      part,
      user,
      priceScale,
    } = req.body;
    await Ticker.update(symbol, {
      [user]: {
        attemptsCount,
        trend,
        tp,
        sl,
        size,
        candlesCount,
        touchCount,
        tolerance,
        breakeven,
        trailing,
        part,
      },
    });
    //part50
    await bybitUsers[user].setPart50(symbol, part, priceScale);
    return res.json({ ok: "Googluck!" });
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//get PnL
app.post("/positions-history/:symbol?", protectPage, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { cursor, user } = req.body;
    const closedPositions = await bybitUsers[user].getClosedPositionsHistory(
      symbol,
      cursor,
    );
    return res.json({ closedPositions });
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//win rate
app.post("/win-rate/:symbol?", protectPage, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { user } = req.body;
    const winRate = await bybitUsers[user].getDailyWinRate(7, symbol);
    return res.json({ winRate });
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
app.get("/api/tickers", protectPage, async (req, res) => {
  const { direction, lastVisibleId, tab, user } = req.query;
  const paginate = await Ticker.paginate(
    10,
    direction,
    lastVisibleId,
    tab,
    user,
  );
  return res.json({ paginate });
});
//simple auth
app.get("/login", (req, res) => {
  const title = "Login";
  if (req.user.auth) {
    return res.redirect("/");
  }
  res.render("login", { title });
});

app.post("/login", async (req, res) => {
  const title = "Login";
  const { email, password } = req.body;
  const hashedPassword = createHash("sha256").update(password).digest("hex");
  if (email === process.env.EMAIL && hashedPassword === process.env.PASSWORD) {
    // create token
    const token = jwt.sign(
      { uid: "94899148", userName: "absemetov" },
      process.env.TELEGRAM_BOT_TOKEN,
    );
    // save token to cookie
    // for localhost disable secure opt
    return res
      .cookie("__session", token, {
        httpOnly: true,
        // secure: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      })
      .redirect("/");
  }
  const errorLogin = "Wrong password or email";
  res.render("login", { title, errorLogin });
});
app.get("/logout", protectPage, (req, res) => {
  return res.clearCookie("__session").redirect("/login");
});
//get alerts
app.post("/alerts/:symbol", protectPage, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { defaultAlerts, support, resistance, user, sl } = req.body;
    if (defaultAlerts) {
      await Ticker.createAlerts(symbol, support, resistance, user, sl);
    }
    const alerts = await Ticker.getAlerts(symbol, user);
    return res.json(alerts);
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//save ticker
app.post("/add/:symbol", protectPage, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { add } = req.body;
    if (add) {
      await Ticker.create(symbol);
      return res.json({ create: true });
    } else {
      await Ticker.delete(symbol);
      return res.json({ deleted: "ok" });
    }
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//edit ticker
app.post("/edit/:symbol", protectPage, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { fieldName, fieldData } = req.body;
    await Ticker.updateField(symbol, fieldName, fieldData);
    return res.json({ ok: "ok" });
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//get limit orders
app.post("/order/list", protectPage, async (req, res) => {
  try {
    const { cursor, user } = req.body;
    const response = await bybitUsers[user].getLimitOrders(cursor);
    return res.json(response);
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//cancel all order
app.post("/order/cancel-all/:symbol/:side", protectPage, async (req, res) => {
  try {
    const { symbol, side } = req.params;
    const { user } = req.body;
    await bybitUsers[user].cancelAllOrders(symbol, side);
    const orders = await bybitUsers[user].getTickerOrders(symbol);
    const response = await bybitUsers[user].getLimitOrders();
    return res.json({ ...response, tickerOrders: orders.all });
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//cancel order
app.post("/order/cancel/:symbol", protectPage, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { orderId, user } = req.body;
    await bybitUsers[user].cancelOrder(symbol, orderId);
    const response = await bybitUsers[user].getLimitOrders();
    const orders = await bybitUsers[user].getTickerOrders(symbol);
    return res.json({ ...response, tickerOrders: orders.all });
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//get positions
app.post("/position/list", protectPage, async (req, res) => {
  try {
    //const { symbol } = req.params;
    const { cursor, user } = req.body;
    const response = await bybitUsers[user].getPositions(cursor);
    return res.json(response);
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//edit position
app.post("/position/edit/:field/:symbol", protectPage, async (req, res) => {
  try {
    const { symbol, field } = req.params;
    const { side, stopLoss, takeProfit, user, tp, sl } = req.body;
    if (field === "sl") {
      if (sl) {
        await Ticker.updateField(symbol, `${user}.sl`, sl);
      } else {
        await bybitUsers[user].editStopLoss(symbol, side, stopLoss);
      }
    }
    if (field === "tp") {
      if (tp) {
        await Ticker.updateField(symbol, `${user}.tp`, tp);
      } else {
        await bybitUsers[user].editTakeProfit(symbol, side, takeProfit);
      }
    }
    const response = await bybitUsers[user].getPositions();
    return res.json(response);
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//cancel position
app.post("/position/close/:symbol", protectPage, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { side, qty, user } = req.body;
    await bybitUsers[user].closePosition(symbol, side, qty);
    const response = await bybitUsers[user].getPositions();
    return res.json(response);
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//run app
app.listen(PORT, () => {
  console.log(`Web 2.5.0 app listening on port ${PORT}`);
});
