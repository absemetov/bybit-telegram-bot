import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { bybitUsers } from "./bybitV5.js";
import Ticker from "./Ticker.js";
//import { tasks } from "./schedule.js";
import { startScanner, stopScanner, getScannerStatus } from "./schedule.js";
import dotenv from "dotenv";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());
const PORT = 3003;
startScanner();
//firebase rest api
async function firebaseRequest(endpoint, body) {
  const url = `https://identitytoolkit.googleapis.com/v1/${endpoint}?key=${process.env.FIREBASE_API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = data.error || { message: "Unknown error" };
    throw new Error(error.message);
  }
  return data;
}
// ===== Middleware JWT =====
function auth(req, res, next) {
  const authHeader = req.get("authorization");
  const bybitUser = req.get("bybitUser");
  req.bybitUser = bybitUser;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Токен не предоставлен" });
  }
  jwt.verify(token, process.env.TELEGRAM_BOT_TOKEN, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Неверный или просроченный токен" });
    }
    req.user = user;
    next();
  });
}
// API для управления сканером
app.get("/api/scanner/status", (req, res) => {
  res.json({ running: getScannerStatus() });
});

app.post("/api/scanner/start", (req, res) => {
  startScanner();
  res.json({ running: true });
});

app.post("/api/scanner/stop", (req, res) => {
  stopScanner();
  res.json({ running: false });
});

app.get("/api/health", (req, res) =>
  res.json({ status: "ok", uptime: process.uptime() }),
);
//new firebase rest api auth
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email и пароль обязательны" });
  }
  try {
    // signInWithPassword через Firebase REST
    const data = await firebaseRequest("accounts:signInWithPassword", {
      email,
      password,
      returnSecureToken: true,
    });
    // data содержит: idToken, localId, email, expiresIn
    // Генерируем свой JWT для клиента
    const payload = {
      userId: data.localId,
      email: data.email,
    };
    const token = jwt.sign(payload, process.env.TELEGRAM_BOT_TOKEN);
    res.json({ token, email });
  } catch {
    res.status(401).json({ error: "Неверный email или пароль" });
  }
});
app.post("/api/profile", auth, (req, res) => {
  res.json({ email: req.user.email, userId: req.user.userId });
});
//new route vite chart:load
app.post("/api/:symbol/info", auth, async (req, res) => {
  try {
    const { symbol } = req.params;
    const info = await Ticker.getInfo(symbol, req.bybitUser);
    return res.json({ ...info, getScannerStatus });
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//NEw set triggers 17/04/2026 vite
app.post("/api/tickers", auth, async (req, res) => {
  const { direction, lastVisibleId, tab, limit = 10 } = req.query;
  const data = await Ticker.paginate(
    +limit,
    direction,
    lastVisibleId,
    tab,
    req.bybitUser,
  );
  return res.json(data);
});
app.post("/api/:symbol/triggers/set", auth, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { support, resistance, tolerance } = req.body;
    const triggers = await Ticker.setTriggers(
      symbol,
      support,
      resistance,
      req.bybitUser,
      tolerance,
    );
    return res.json(triggers);
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//AlgoTrading
app.post("/api/algo-trading/:symbol", auth, async (req, res) => {
  try {
    const { symbol } = req.params;
    const {
      tp,
      sl,
      slOpen,
      size,
      attemptsCount,
      candlesCount,
      touchCount,
      tolerance,
      candlesPart,
      breakeven,
      trailing,
      part,
      priceScale,
    } = req.body;
    await Ticker.update(symbol, {
      [req.bybitUser]: {
        attemptsCount,
        tp,
        sl,
        slOpen,
        size,
        candlesCount,
        touchCount,
        tolerance,
        candlesPart,
        breakeven,
        trailing,
        part,
      },
    });
    //set Part50
    const side = req.bybitUser === "main" ? "Buy" : "Sell";
    await bybitUsers[req.bybitUser].setPart50All(
      symbol,
      part,
      priceScale,
      side,
    );
    return res.json({ ok: "Goodluck!" });
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//edit algo sl tp part
app.post("/api/algo-trading/:symbol/edit/:field", auth, async (req, res) => {
  try {
    const { symbol, field } = req.params;
    const { priceScale } = req.body;
    await Ticker.update(symbol, {
      [`${req.bybitUser}.${field}`]: +req.body[field],
    });
    if (field === "part") {
      //set Part50
      const side = req.bybitUser === "main" ? "Buy" : "Sell";
      await bybitUsers[req.bybitUser].setPart50All(
        symbol,
        req.body[field],
        priceScale,
        side,
      );
    }
    return res.json({ ok: "ok" });
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//get limit orders
app.post("/api/orders", auth, async (req, res) => {
  try {
    const { cursor } = req.body;
    const response = await bybitUsers[req.bybitUser].getLimitOrders(cursor);
    return res.json(response);
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//cancel all order
app.post("/api/order/cancel-all/:symbol/:side", auth, async (req, res) => {
  try {
    const { symbol, side } = req.params;
    await bybitUsers[req.bybitUser].cancelAllOrders(symbol, side);
    const orders = await bybitUsers[req.bybitUser].getTickerOrders(symbol);
    const response = await bybitUsers[req.bybitUser].getLimitOrders();
    return res.json({ ...response, tickerOrders: orders.all });
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//cancel order
app.post("/api/order/cancel/:symbol", auth, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { orderId } = req.body;
    await bybitUsers[req.bybitUser].cancelOrder(symbol, orderId);
    const response = await bybitUsers[req.bybitUser].getLimitOrders();
    const orders = await bybitUsers[req.bybitUser].getTickerOrders(symbol);
    return res.json({ ...response, tickerOrders: orders.all });
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//get positions
app.post("/api/positions", auth, async (req, res) => {
  try {
    const { cursor } = req.body;
    const response = await bybitUsers[req.bybitUser].getPositions(cursor);
    return res.json(response);
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//cancel position
app.post("/api/position/close/:symbol", auth, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { side, qty } = req.body;
    await bybitUsers[req.bybitUser].closePosition(symbol, side, qty);
    const response = await bybitUsers[req.bybitUser].getPositions();
    return res.json(response);
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//get PnL
app.post("/api/positions-history/:symbol?", auth, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { cursor } = req.body;
    const closedPositions = await bybitUsers[
      req.bybitUser
    ].getClosedPositionsHistory(symbol, cursor);
    return res.json(closedPositions);
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//win rate
app.post("/api/win-rate/:symbol?", auth, async (req, res) => {
  try {
    const { symbol } = req.params;
    const winRate = await bybitUsers[req.bybitUser].getDailyWinRate(7, symbol);
    return res.json(winRate);
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//create ticker
app.post("/api/create/", auth, async (req, res) => {
  try {
    let { symbol } = req.body;
    symbol = symbol.trim().toUpperCase();
    // Если нет суффикса USDT, добавляем
    if (!symbol.endsWith("USDT")) {
      symbol = symbol + "USDT";
    }
    await Ticker.create(symbol);
    return res.json({ create: true });
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//edit ticker
app.post("/api/edit/:symbol", auth, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { fieldName, fieldData } = req.body;
    await Ticker.updateField(symbol, fieldName, fieldData);
    return res.json({ ok: "ok" });
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//delete ticker
app.post("/api/delete/:symbol", auth, async (req, res) => {
  try {
    const { symbol } = req.params;
    await Ticker.delete(symbol);
    return res.json({ deleted: "ok" });
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//run app
app.listen(PORT, () => {
  console.log(`v3.0.0 app listening on port ${PORT}`);
});
