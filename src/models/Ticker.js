import { db, FieldValue, FieldPath } from "../firebase.js";
import Joi from "joi";
import { getTicker, bybitUsers } from "../helpers/bybitV5.js";

class Ticker {
  static validate(ticker) {
    const schema = Joi.object({
      alerts: Joi.object({
        alert1: Joi.number().min(0).allow(null),
        alert2: Joi.number().min(0).allow(null),
        alert3: Joi.number().min(0).allow(null),
        alert4: Joi.number().min(0).allow(null),
        alert5: Joi.number().min(0).allow(null),
        alert6: Joi.number().min(0).allow(null),
      }),
      lastPrice: Joi.number().min(0).allow(null),
      price24h: Joi.number().min(0).allow(null),
      price24hPcnt: Joi.number().allow(null),
      lastNotified: Joi.alternatives([
        Joi.object().keys({
          _seconds: Joi.number(),
          _nanoseconds: Joi.number(),
        }),
        Joi.date(),
        null,
      ]),
    });
    return schema.validate(ticker);
  }
  static validateAlertPrice(price) {
    return Joi.number().min(0).validate(price);
  }
  //create New ticker
  static async create(symbol) {
    const ticker = await getTicker(symbol);
    if (ticker.length == 0) {
      throw new Error(`Ticker ${symbol} not found in Bybit`);
    }
    const priceScale = ticker.length ? +ticker[0].priceScale : 4;
    const newTickerData = {
      star: false,
      createdAt: new Date(),
      priceScale,
    };
    await db.doc(`crypto/${symbol}`).set(newTickerData);
  }
  static async find(ticker, getDoc = false) {
    if (ticker) {
      const tickerDoc = await db.doc(`crypto/${ticker}`).get();
      if (tickerDoc.exists) {
        if (getDoc) {
          return tickerDoc;
        } else {
          return { symbol: ticker, ...tickerDoc.data() };
        }
      }
    }
    return null;
  }
  //create default Alerts
  static async createAlerts(symbol, support, resistance, user, sl) {
    const step = sl / 5 / 100;
    const alerts = {
      1: support * (1 + step),
      3: support,
      5: support * (1 - step),
      2: resistance * (1 - step),
      4: resistance,
      6: resistance * (1 + step),
    };
    await Ticker.update(symbol, { [`${user}Alerts`]: { ...alerts } });
  }
  static async alertsExist(symbol) {
    const alertsDoc = await db.doc(`crypto/${symbol}/alerts/triggers`).get();
    return alertsDoc.exists;
  }
  // get all alerts
  static async getAlerts(symbol, user) {
    const symbolDoc = await db.doc(`crypto/${symbol}`).get();
    const orders = await bybitUsers[user].getTickerOrders(symbol);
    const positions = await bybitUsers[user].getTickerPositions(symbol);
    const balance = await bybitUsers[user].getBybitBalance();
    return {
      exists: symbolDoc.exists,
      ...(symbolDoc.exists ? symbolDoc.data() : {}),
      orders: [...orders.stop, ...orders.part],
      positions,
      balance,
    };
  }
  //update alert
  static async updateAlert(symbol, alertName, value, user) {
    const { error } = Ticker.validateAlertPrice(value);
    if (error) {
      throw new Error(`Invalid ticker data ${alertName} must be numeric!`);
    }
    const alerts = {
      [`${user}Alerts.${alertName}`]: value,
    };
    await Ticker.update(symbol, alerts);
  }
  //new update
  static async update(symbol, data) {
    await db.doc(`crypto/${symbol}`).update(data);
  }
  static async incrementField(symbol, fieldName, number) {
    const editTickerField = {
      [fieldName]: FieldValue.increment(number),
    };
    await db.doc(`crypto/${symbol}`).update(editTickerField);
  }
  //update field text
  static async updateField(symbol, fieldName, fieldData) {
    if (fieldName === "patterns") {
      fieldData = JSON.parse(fieldData);
    }
    const editTickerField = {
      [fieldName]: fieldData,
    };
    await db.doc(`crypto/${symbol}`).update(editTickerField);
  }
  //delete Ticker
  static async delete(symbol) {
    await db.doc(`crypto/${symbol}/alerts/triggers`).delete();
    await db.doc(`crypto/${symbol}/alerts/message`).delete();
    await db.doc(`crypto/${symbol}`).delete();
  }
  static async paginate(
    limit,
    direction = null,
    lastVisibleId = null,
    tab = "favorites",
    user = "main",
  ) {
    const mainQuery =
      tab === "favorites"
        ? db
            .collection("crypto")
            .where("star", "==", true)
            .orderBy(FieldPath.documentId())
        : tab === "alerts"
          ? db
              .collection("crypto")
              .where(`${user}.attemptsCount`, "==", 6)
              .orderBy(FieldPath.documentId())
          : tab === "trading"
            ? db
                .collection("crypto")
                .where(`${user}.attemptsCount`, ">=", 0)
                .where(`${user}.attemptsCount`, "<", 5)
                .orderBy(`${user}.attemptsCount`)
            : //.where(
              //  Filter.or(
              //    Filter.where("tradingType", ">", 0),
              //    Filter.where("tradingTypeSub", ">", 0),
              //  ),
              //)
              //db.collection("crypto").orderBy("updatedAt", "desc");
              db.collection("crypto").orderBy(FieldPath.documentId());
    let query = mainQuery;
    const lastVisibleDoc = await Ticker.find(lastVisibleId, true);
    if (direction && !lastVisibleDoc) {
      direction = null;
      //throw new Error("lastVisibleDoc is empty!");
    }
    if (direction === "next") {
      query = query.startAfter(lastVisibleDoc);
    } else if (direction === "prev") {
      query = query.endBefore(lastVisibleDoc);
    }
    // set limit
    if (direction === "prev") {
      query = query.limitToLast(limit);
    } else {
      query = query.limit(limit);
    }
    const snapshot = await query.get();
    // for doc use exists for qyery empty opt
    if (!snapshot.empty) {
      const tickers = snapshot.docs.map((doc) => {
        return { symbol: doc.id, exists: true, ...doc.data() };
      });
      const firstVisible = snapshot.docs[0];
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      // Check for previous and next tickers
      const hasPrevSnap = await mainQuery
        .endBefore(firstVisible)
        .limitToLast(1)
        .get();
      const hasNextSnap = await mainQuery
        .startAfter(lastVisible)
        .limit(1)
        .get();
      const hasPrev = !hasPrevSnap.empty;
      const hasNext = !hasNextSnap.empty;
      const firstVisibleId = firstVisible.id;
      const lastVisibleId = lastVisible.id;
      return { tickers, firstVisibleId, lastVisibleId, hasPrev, hasNext };
    }
    return { tickers: [] };
  }
  //batch save
  static async saveBatch(batchArray) {
    const batch = db.batch();
    for (const ticker of batchArray) {
      const { symbol, data } = ticker;
      if (symbol) {
        batch.set(db.doc(`crypto/${symbol}`), data, {
          merge: true,
        });
      }
    }
    await batch.commit();
  }
}

export default Ticker;
