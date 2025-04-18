import { db } from "../firebase.js";
import Joi from "joi";
import { getCandles, createLimitOrder } from "../helpers/bybitV5.js";
import Scan from "../models/Scan.js";

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
  // create limit order
  static async createLimitOrder(symbol, side, price, tpPercent, slPercent) {
    await createLimitOrder(symbol, side, price, tpPercent, slPercent);
  }
  //create New ticker
  static async create(symbol) {
    // const snapshotCount = await db.collection("crypto").count().get();
    // const tickersCount = snapshotCount.data().count;
    // if (tickersCount > 100) {
    //   throw new Error("Tickers limit 100!");
    // }
    const kline = await getCandles(symbol, "1d", 1);
    if (kline.length == 0) {
      throw new Error(`Ticker ${symbol} not found in Bybit`);
    }
    // validate
    //const { close } = kline[0];
    //set alert +/-5%
    //create alerts
    //await Ticker.createAlerts(symbol);
    const newTickerData = {
      // price24h: open,
      // price24hPcnt: ((close - open) / open) * 100,
      // lastPrice: close,
      alert: false,
      star: false,
    };
    // const { error } = Ticker.validate(newTickerData);
    // if (error) {
    //   throw new Error(`Invalid ticker data: ${error.message}`);
    // }
    // lastPrice: Joi.number().min(0).allow(null),
    // price24hPcnt
    await db.doc(`crypto/${symbol}`).set(newTickerData);
    //return tickersCount + 1;
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
  static async createAlerts(symbol) {
    const kline = await getCandles(symbol, "1d", 1);
    if (kline.length == 0) {
      throw new Error(`Ticker ${symbol} not found in Bybit`);
    }
    // validate
    const { close } = kline[0];
    const step = symbol === "BTCUSDT" ? 0.01 : 0.02;
    const alerts = {
      alert0: close * (1 - step * 3),
      alert1: close * (1 - step * 2),
      alert2: close * (1 - step),
      alert3: close * (1 + step),
      alert4: close * (1 + step * 2),
      alert5: close * (1 + step * 3),
    };
    await db.doc(`crypto/${symbol}/alerts/triggers`).set(alerts);
  }
  static async alertsExist(symbol) {
    const alertsDoc = await db.doc(`crypto/${symbol}/alerts/triggers`).get();
    return alertsDoc.exists;
  }
  // get all alerts
  static async getAlerts(symbol, timeframe) {
    const symbolDoc = await db.doc(`crypto/${symbol}`).get();
    const alertsDoc = await db.doc(`crypto/${symbol}/alerts/triggers`).get();
    const config = await Scan.getConfig(timeframe);
    const snapshotPumpMsg = await db
      .collection("crypto-pump")
      .doc(symbol)
      .collection("message")
      .orderBy("lastNotified", "desc")
      .get();
    let pumpMsg = [];
    if (!snapshotPumpMsg.empty) {
      pumpMsg = snapshotPumpMsg.docs.map((doc) => {
        return { timeframe: doc.id, ...doc.data() };
      });
    }
    return {
      alerts: alertsDoc.exists
        ? [
            alertsDoc.data().alert0,
            alertsDoc.data().alert1,
            alertsDoc.data().alert2,
            alertsDoc.data().alert3,
            alertsDoc.data().alert4,
            alertsDoc.data().alert5,
            alertsDoc.data().alert6,
          ]
        : [],
      exists: symbolDoc.exists,
      star: symbolDoc.exists ? symbolDoc.data().star : false,
      alert: symbolDoc.exists ? symbolDoc.data().alert : false,
      message: symbolDoc.exists ? symbolDoc.data().message : false,
      pumpMsg,
      patternLevel: config?.patterns?.patternS || config?.patterns?.patternR,
    };
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
    await db.doc(`crypto/${symbol}/alerts/triggers`).update(editTickerField);
  }
  //new update
  static async update(symbol, data) {
    await db.doc(`crypto/${symbol}`).update(data);
  }
  //update field
  static async updateField(symbol, fieldName, fieldData) {
    //for bot
    if (fieldName === "star" && typeof fieldData !== "boolean") {
      fieldData = fieldData === "true";
    }
    const editTickerField = {
      [fieldName]: fieldData,
    };
    await db.doc(`crypto/${symbol}`).update(editTickerField);
  }
  //delete Ticker
  static async delete(symbol) {
    await db.doc(`crypto/${symbol}`).delete();
  }
  static async paginate(
    limit,
    direction = null,
    lastVisibleId = null,
    tab = "favorites",
  ) {
    if (["15min", "30min", "1h", "4h", "1d"].includes(tab)) {
      return await this.paginatePump(limit, direction, lastVisibleId, tab);
    }
    //.orderBy("price24hPcnt", order)
    const mainQuery =
      tab === "favorites"
        ? db.collection("crypto").where("star", "==", true)
        : tab === "alerts"
          ? db.collection("crypto").where("alert", "==", true)
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
  //paginate Pump message
  static async paginatePump(
    limit,
    direction = null,
    lastVisibleId = null,
    timeframe,
  ) {
    //.orderBy("price24hPcnt", order)
    const mainQuery = db
      .collection("crypto-pump")
      .orderBy(`lastNotified_${timeframe}`, "desc");
    let query = mainQuery;
    const lastVisibleDoc = await db.doc(`crypto-pump/${lastVisibleId}`).get();
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
        return { symbol: doc.id, exists: false, ...doc.data() };
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
  //new update notify telegram
  static async sendNotifyAlert(batchArray) {
    const batch = db.batch();
    for (const ticker of batchArray) {
      const { symbol, data } = ticker;
      if (symbol) {
        batch.set(db.doc(`crypto/${symbol}/message/alert`), data, {
          merge: true,
        });
      }
    }
    await batch.commit();
  }
  //TODO make new pump collection
  static async sendNotifyPump(batchArray) {
    const batch = db.batch();
    //const algoliaObjects = [];
    for (const ticker of batchArray) {
      const { symbol, timeframe, arrayNotify, lastNotified } = ticker;
      if (symbol) {
        //for ordering
        batch.set(
          db.doc(`crypto-pump/${symbol}`),
          {
            [`lastNotified_${timeframe}`]: lastNotified,
          },
          { merge: true },
        );
        //notify user tg
        for (const notify of arrayNotify) {
          batch.set(
            db.doc(`crypto-pump/${symbol}/message/${timeframe}_${notify.name}`),
            {
              text: notify.text,
              lastNotified,
            },
            {
              merge: true,
            },
          );
        }
        //algolia batch
        // algoliaObjects.push({
        //   objectID: symbol,
        //   symbol,
        //   [`lastNotified_${timeframe}`]: new Date(),
        //   //arrayNotify: data.arrayNotify,
        // });
      }
    }
    await batch.commit();
  }
}

export default Ticker;
