import { db } from "../firebase.js";
import Joi from "joi";
import { bybitKline } from "../helpers/bybitV5.js";

class Ticker {
  // constructor(symbol) {
  //   this.symbol = symbol;
  //   //this.lastNotified = lastNotified;
  // }
  static validate(ticker) {
    const schema = Joi.object({
      //TODO Order by pcnt change!!!
      //orderNumber: Joi.number().integer().min(0).required(),
      //symbol: Joi.string().required(),
      //TODO use paginate!!! for scaning
      //chunkNumber: Joi.number().integer().min(0).required(),
      alerts: Joi.object({
        alert1: Joi.number().min(0).allow(null),
        alert2: Joi.number().min(0).allow(null),
        alert3: Joi.number().min(0).allow(null),
        alert4: Joi.number().min(0).allow(null),
        alert5: Joi.number().min(0).allow(null),
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
    //check limit max 100 tickers
    const snapshotCount = await db.collection("crypto").count().get();
    const tickersCount = snapshotCount.data().count;
    if (tickersCount > 100) {
      throw new Error("Tickers limit 100!");
    }
    const kline = await bybitKline(symbol, "1d", 1);
    if (kline.length == 0) {
      throw new Error(`Ticker ${symbol} not found in Bybit`);
    }
    // validate
    const { open, close } = kline[0];
    //set alert +/-5%
    const newTickerData = {
      price24h: open,
      price24hPcnt: ((close - open) / open) * 100,
      lastPrice: close,
    };
    const { error } = Ticker.validate(newTickerData);
    if (error) {
      throw new Error(`Invalid ticker data: ${error.message}`);
    }
    // lastPrice: Joi.number().min(0).allow(null),
    // price24hPcnt
    await db.doc(`crypto/${symbol}`).set(newTickerData);
    //create alerts
    await Ticker.createAlerts(symbol, close);
    return tickersCount + 1;
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
  static async createAlerts(symbol, price) {
    const alerts = {
      alert1: price * 0.98,
      alert2: price * 0.99,
      alert3: price * 1.01,
      alert4: price * 1.02,
      alert5: price * 1.03,
    };
    await db.doc(`crypto-alerts/${symbol}`).set(alerts);
  }
  // get all alerts
  static async getAlerts(symbol) {
    const alertsDoc = await db.doc(`crypto-alerts/${symbol}`).get();
    if (alertsDoc.exists) {
      return [
        alertsDoc.data().alert1,
        alertsDoc.data().alert2,
        alertsDoc.data().alert3,
        alertsDoc.data().alert4,
        alertsDoc.data().alert5,
      ];
    }
    return [];
  }
  //update alert
  static async updateAlert(symbol, alertName, value) {
    const { error } = Ticker.validateAlertPrice(value);
    if (error) {
      throw new Error(`Invalid ticker data ${alertName} must be numeric!`);
    }
    const editTickerField = {
      [alertName]: value,
    };
    await db.doc(`crypto-alerts/${symbol}`).update(editTickerField);
  }
  //new update
  static async update(symbol, data) {
    await db.doc(`crypto/${symbol}`).update(data);
  }
  static async updateField(symbol, fieldName, fieldData) {
    //for bot
    if (fieldName === "favorites" && typeof fieldData !== "boolean") {
      fieldData = fieldData === "true";
    }
    const editTickerField = {
      [fieldName]: fieldData,
    };
    await db.doc(`crypto/${symbol}`).update(editTickerField);
    //todo sync favorites to crypto alerts
    if (fieldName === "favorites") {
      await db.doc(`crypto-alerts/${symbol}`).update(editTickerField);
    }
  }
  //delete Ticker
  static async delete(symbol) {
    await db.doc(`crypto/${symbol}`).delete();
  }
  static async paginate(
    limit,
    direction = null,
    lastVisibleId = null,
    order = "desc",
    favorites = false,
  ) {
    //if scan 50 ticker dont order!!!
    const mainQuery = favorites
      ? db
          .collection("crypto")
          .where("favorites", "==", true)
          .orderBy("price24hPcnt", order)
      : db.collection("crypto");
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
        return { symbol: doc.id, ...doc.data() };
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
  //paginate alerts
  static async paginateAlerts(limit, direction = null, lastVisibleId = null) {
    const mainQuery = db
      .collection("crypto-alerts")
      .where("favorites", "==", true);
    let query = mainQuery;
    const lastVisibleDoc = await db.doc(`crypto-alerts/${lastVisibleId}`).get();
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
        return {
          symbol: doc.id,
          favorites: doc.data().favorites,
          alerts: [
            doc.data().alert1,
            doc.data().alert2,
            doc.data().alert3,
            doc.data().alert4,
            doc.data().alert5,
          ],
        };
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
  static async chunk(chunkNumber) {
    const tickerSnapshot = await db
      .collection("crypto")
      .where("chunkNumber", "==", chunkNumber)
      .get();
    if (!tickerSnapshot.empty) {
      return tickerSnapshot.docs.map((doc) => {
        return {
          symbol: doc.id,
          ...doc.data(),
        };
      });
    }
    return [];
  }
  //new update notify
  static async sendNotify(batchArray) {
    const batch = db.batch();
    for (const ticker of batchArray) {
      const { symbol, data } = ticker;
      batch.set(db.doc(`crypto/${symbol}`), data, {
        merge: true,
      });
    }
    await batch.commit();
  }
  static async setBatch(batchArray) {
    const batch = db.batch();
    for (const ticker of batchArray) {
      const { symbol, data } = ticker;
      const { error } = Ticker.validate({ symbol, ...data });
      if (error) {
        throw new Error(
          `Invalid Ticker #${data.orderNumber} ${symbol} data: ${error.message}`,
        );
      }
      const kline = await bybitKline(symbol, "15min", 1);
      if (kline.length == 0) {
        throw new Error(`Ticker ${symbol} not found in Bybit`);
      }
      batch.set(db.doc(`crypto/${symbol}`), data, {
        merge: true,
      });
    }
    await batch.commit();
  }
  static async deleteBatch(batchArray) {
    const batch = db.batch();
    for (const ticker of batchArray) {
      batch.delete(db.doc(`crypto/${ticker}`));
    }
    await batch.commit();
  }
}

export default Ticker;
