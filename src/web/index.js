import express from "express";
import { create } from "express-handlebars";
import Ticker from "../models/Ticker.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { createHash } from "crypto";
import dotenv from "dotenv";
import { bybitKline } from "../helpers/bybitV5.js";
dotenv.config();

const app = express();
// GET /foo.js etc
app.use(express.static("./src/web/src"));
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
//new alerts
app.get("/", protectPage, async (req, res) => {
  const title = "Dev Bot Web";
  const { direction, lastVisibleId } = req.query;
  const paginate = await Ticker.paginate(25, direction, lastVisibleId);
  res.render("index", { title, paginate, user: req.user });
});
//ticker page
app.get("/t/:symbol", protectPage, async (req, res) => {
  const { symbol } = req.params;
  const title = `${symbol} - Dev Bot Web`;
  const ticker = await Ticker.find(symbol);
  res.render("ticker", { title, ticker, user: req.user });
});
//favorites
app.get("/favorites", protectPage, async (req, res) => {
  const title = "Favorites - Dev Bot Web";
  const { direction, lastVisibleId } = req.query;
  const paginate = await Ticker.paginate(15, direction, lastVisibleId, true);
  res.render("favorites", { title, paginate, user: req.user });
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
// edit alert
app.post("/edit-alert/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const { alertName, alertValue } = req.body;
    await Ticker.updateAlert(symbol, alertName, alertValue);
    return res.json({ ok: "ok" });
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//add to favorites
app.post("/favorites/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const { favorites } = req.body;
    await Ticker.updateField(symbol, "favorites", favorites);
    return res.json({ ok: "ok" });
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//get candles data
app.post("/candles/:symbol", async (req, res) => {
  const { interval } = req.body;
  try {
    const { symbol } = req.params;
    const candlesArray = await bybitKline(symbol, interval, 300);
    return res.json({ candlesArray });
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});
//get alerts
app.post("/alerts/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const alerts = await Ticker.getAlerts(symbol);
    return res.json({ alerts });
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }
});

app.get("/logout", protectPage, (req, res) => {
  return res.clearCookie("__session").redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Bot-Web app listening on port ${PORT}`);
});
