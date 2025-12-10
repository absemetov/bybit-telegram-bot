import express from "express";
import cors from "cors";
import { create } from "express-handlebars";
import Ticker from "../models/Ticker.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { createHash } from "crypto";
import { bybitUsers } from "../helpers/bybitV5.js";
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
app.get("/chart/:symbol?/", protectPage, async (req, res) => {
  const title = "Bybit terminal";
  res.render("ticker", { title, user: req.user });
});
//AlgoTrading
app.post("/algo-trading/:symbol", protectPage, async (req, res) => {
  try {
    const { symbol } = req.params;
    const {
      tradingType,
      tradingTypeShort,
      tp,
      sl,
      size,
      attemptsCount,
      candlesCount,
      touchCount,
      tolerance,
      breakeven,
      user,
    } = req.body;
    await Ticker.update(symbol, {
      [user]: {
        attemptsCount,
        tradingType,
        tradingTypeShort,
        tp,
        sl,
        size,
        candlesCount,
        touchCount,
        tolerance,
        breakeven,
      },
    });
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
    const { defaultAlerts, support, resistance, read, user } = req.body;
    if (defaultAlerts) {
      //set default alerts
      await Ticker.createAlerts(symbol, support, resistance);
    }
    //if (read) {
    //  await Ticker.updateField(symbol, "read", !read);
    //}
    const alerts = await Ticker.getAlerts(symbol, user, read);
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
//create limit or stop orders
app.post("/order/create/:symbol", protectPage, async (req, res) => {
  try {
    const { symbol } = req.params;
    const {
      side,
      size,
      orderType,
      startBuy,
      stopBuy,
      slBuy,
      startSell,
      stopSell,
      slSell,
      user,
    } = req.body;
    const ordersOld = await bybitUsers[user].getTickerOrders(symbol);
    //create orders Long
    //const alerts = await Ticker.getOnlyAlerts(symbol);
    if (side === "Buy") {
      for (const order of ordersOld.filter((o) => o.side === side)) {
        await bybitUsers[user].cancelOrder(symbol, order.orderId);
      }
      if (orderType === "limit") {
        await bybitUsers[user].createLimitOrder(
          symbol,
          side,
          startBuy,
          size / 3,
          stopSell,
          slBuy,
        );
        await bybitUsers[user].createLimitOrder(
          symbol,
          side,
          (startBuy + stopBuy) / 2,
          size / 3,
          stopSell,
          slBuy,
        );
        await bybitUsers[user].createLimitOrder(
          symbol,
          side,
          stopBuy,
          size / 3,
          stopSell,
          slBuy,
        );
      } else {
        await bybitUsers[user].createStopLimitOrder(
          symbol,
          side,
          startBuy,
          size / 3,
          stopSell,
          slBuy,
        );
        await bybitUsers[user].createStopLimitOrder(
          symbol,
          side,
          (startBuy + stopBuy) / 2,
          size / 3,
          stopSell,
          slBuy,
        );
        await bybitUsers[user].createStopLimitOrder(
          symbol,
          side,
          stopBuy,
          size / 3,
          stopSell,
          slBuy,
        );
      }
    }
    //create Short orders
    if (side === "Sell") {
      for (const order of ordersOld.filter((o) => o.side === side)) {
        await bybitUsers[user].cancelOrder(symbol, order.orderId);
      }
      if (orderType === "limit") {
        await bybitUsers[user].createLimitOrder(
          symbol,
          side,
          startSell,
          size / 3,
          stopBuy,
          slSell,
        );
        await bybitUsers[user].createLimitOrder(
          symbol,
          side,
          (startSell + stopSell) / 2,
          size / 3,
          stopBuy,
          slSell,
        );
        await bybitUsers[user].createLimitOrder(
          symbol,
          side,
          stopSell,
          size / 3,
          stopBuy,
          slSell,
        );
      } else {
        await bybitUsers[user].createStopLimitOrder(
          symbol,
          side,
          startSell,
          size / 3,
          stopBuy,
          slSell,
        );
        await bybitUsers[user].createStopLimitOrder(
          symbol,
          side,
          (startSell + stopSell) / 2,
          size / 3,
          stopBuy,
          slSell,
        );
        await bybitUsers[user].createStopLimitOrder(
          symbol,
          side,
          stopSell,
          size / 3,
          stopBuy,
          slSell,
        );
      }
    }
    const orders = await bybitUsers[user].getTickerOrders(symbol);
    return res.json({ orders });
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//get limit orders
app.post("/order/list", protectPage, async (req, res) => {
  try {
    //const { symbol } = req.params;
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
    //return res.json({ orders });
    const response = await bybitUsers[user].getLimitOrders();
    return res.json({ ...response, tickerOrders: orders });
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
    return res.json({ ...response, tickerOrders: orders });
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
  console.log(`Web app listening on port ${PORT}`);
});
