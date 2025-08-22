import express from "express";
import cors from "cors";
import { create } from "express-handlebars";
import Ticker from "../models/Ticker.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { createHash } from "crypto";
import {
  createLimitOrder,
  getLimitOrders,
  cancelOrder,
  cancelAllOrders,
  getPositions,
  closePosition,
  editStopLoss,
  editTakeProfit,
  getClosedPositionsHistory,
  getDailyWinRate,
  getTickerOrders,
} from "../helpers/bybitV5.js";
import dotenv from "dotenv";
dotenv.config();

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
app.get("/", protectPage, async (req, res) => {
  return res.redirect("/chart");
});
app.get("/chart/:symbol?/:timeframe?/:tab?", protectPage, async (req, res) => {
  const title = "Bybit terminal";
  res.render("ticker", { title, user: req.user });
});
//get PnL
app.post("/positions-history/:symbol?", protectPage, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { cursor } = req.body;
    const closedPositions = await getClosedPositionsHistory(symbol, cursor);
    return res.json({ closedPositions });
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//win rate
app.post("/win-rate/:symbol?", protectPage, async (req, res) => {
  try {
    const { symbol } = req.params;
    const winRate = await getDailyWinRate(7, symbol);
    return res.json({ winRate });
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
app.get("/api/tickers", protectPage, async (req, res) => {
  const { direction, lastVisibleId, tab, timeframe } = req.query;
  const paginate = await Ticker.paginate(
    10,
    direction,
    lastVisibleId,
    tab,
    timeframe,
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
    const { defaultAlerts } = req.body;
    if (defaultAlerts) {
      //set default alerts
      await Ticker.createAlerts(symbol);
    }
    const alerts = await Ticker.getAlerts(symbol);
    return res.json(alerts);
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
// edit alert
app.post("/edit-alert/:symbol", protectPage, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { alertName, alertValue } = req.body;
    await Ticker.updateAlert(symbol, alertName, alertValue);
    return res.json({ ok: "ok" });
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//add to subs
app.post("/add/:symbol", protectPage, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { star } = req.body;
    if (star) {
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
//Edit symbol
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
//create limit order
app.post("/order/create/:symbol", protectPage, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { price, side, tpPercent, slPercent, MAX_POSITION } = req.body;
    //first delete old orders
    const ordersOld = await getTickerOrders(symbol);
    for (const order of ordersOld.filter((o) => o.side === side)) {
      await cancelOrder(symbol, order.orderId);
    }
    //grid orders
    let newPrice = price;
    for (const step of [0.2, 0.2, 0.2]) {
      newPrice =
        side === "Buy"
          ? newPrice * (1 - step / 100)
          : newPrice * (1 + step / 100);
      await createLimitOrder(
        symbol,
        side,
        newPrice,
        MAX_POSITION,
        tpPercent,
        slPercent,
      );
    }
    const orders = await getTickerOrders(symbol);
    return res.json({ orders });
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//get limit orders
app.post("/order/list", protectPage, async (req, res) => {
  try {
    //const { symbol } = req.params;
    const { cursor } = req.body;
    const response = await getLimitOrders(cursor);
    return res.json(response);
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//cancel all order
app.post("/order/cancel-all/:symbol", protectPage, async (req, res) => {
  try {
    const { symbol } = req.params;
    await cancelAllOrders(symbol);
    const response = await getLimitOrders();
    return res.json(response);
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//cancel order
app.post("/order/cancel/:symbol", protectPage, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { orderId } = req.body;
    await cancelOrder(symbol, orderId);
    const orders = await getTickerOrders(symbol);
    return res.json({ orders });
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//get positions
app.post("/position/list", protectPage, async (req, res) => {
  try {
    //const { symbol } = req.params;
    const { cursor } = req.body;
    const response = await getPositions(cursor);
    return res.json(response);
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//edit position
app.post("/position/edit/:field/:symbol", protectPage, async (req, res) => {
  try {
    const { symbol, field } = req.params;
    const { side, stopLoss, takeProfit } = req.body;
    if (field === "sl") {
      await editStopLoss(symbol, side, stopLoss);
    }
    if (field === "tp") {
      await editTakeProfit(symbol, side, takeProfit);
    }
    const response = await getPositions();
    return res.json(response);
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//cancel position
app.post("/position/close/:symbol", protectPage, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { side, qty } = req.body;
    await closePosition(symbol, side, qty);
    const response = await getPositions();
    return res.json(response);
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//run app
app.listen(PORT, () => {
  console.log(`Bot-Web app listening on port ${PORT}`);
});
