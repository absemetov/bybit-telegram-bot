import { db, FieldValue, Filter } from "../firebase.js";
import Joi from "joi";
import { getTicker, bybitUsers } from "../helpers/bybitV5.js";

class Ticker {
  // constructor(symbol) {
  //   this.symbol = symbol;
  //   //this.lastNotified = lastNotified;
  // }
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
      alert: false,
      star: false,
      updatedAt: new Date(),
      priceScale,
    };
    await db.doc(`crypto/${symbol}`).set(newTickerData);
    //create alerts
    //await Ticker.createAlerts(symbol);
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
  static async createAlerts(symbol, support, resistance) {
    const alerts = {
      alert0: support * (1 - 1.5 / 100),
      alert1: support,
      alert2: support * (1 + 1 / 100),
      alert3: resistance * (1 - 1 / 100),
      alert4: resistance,
      alert5: resistance * (1 + 1.5 / 100),
    };
    await db.doc(`crypto/${symbol}/alerts/triggers`).set(alerts);
  }
  static async alertsExist(symbol) {
    const alertsDoc = await db.doc(`crypto/${symbol}/alerts/triggers`).get();
    return alertsDoc.exists;
  }
  //for check cross
  static async getOnlyAlerts(symbol) {
    const alertsDoc = await db.doc(`crypto/${symbol}/alerts/triggers`).get();
    return alertsDoc.exists
      ? [
          alertsDoc.data().alert0,
          alertsDoc.data().alert1,
          alertsDoc.data().alert2,
          alertsDoc.data().alert3,
          alertsDoc.data().alert4,
          alertsDoc.data().alert5,
        ]
      : [];
  }
  // get all alerts
  static async getAlerts(symbol, user, read) {
    const symbolDoc = await db.doc(`crypto/${symbol}`).get();
    const alertsDoc = await db.doc(`crypto/${symbol}/alerts/triggers`).get();
    //const config = await Scan.getConfig(timeframe);
    //const pumpMsg = await this.getLevels(symbol);
    //get limit orders
    const orders = await bybitUsers[user].getTickerOrders(symbol);
    const positions = await bybitUsers[user].getTickerPositions(symbol);
    if (symbolDoc.exists && read) {
      await Ticker.updateField(symbol, "read", !read);
    }
    //const closedPositions =
    //  await bybitUsers[user].getClosedPositionsHistory(symbol);
    return {
      alerts: alertsDoc.exists
        ? [
            alertsDoc.data().alert0,
            alertsDoc.data().alert1,
            alertsDoc.data().alert2,
            alertsDoc.data().alert3,
            alertsDoc.data().alert4,
            alertsDoc.data().alert5,
          ]
        : [],
      exists: symbolDoc.exists,
      ...(symbolDoc.exists ? symbolDoc.data() : {}),
      orders,
      positions,
      //closedPositions,
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
  ) {
    const mainQuery =
      tab === "favorites"
        ? db.collection("crypto").where("star", "==", true)
        : tab === "alerts"
          ? db.collection("crypto").where("alert", "==", true)
          : tab === "trading"
            ? db
                .collection("crypto")
                .where(
                  Filter.or(
                    Filter.where("tradingType", ">", 0),
                    Filter.where("tradingTypeSub", ">", 0),
                  ),
                )
            : db.collection("crypto").orderBy("updatedAt", "desc");
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
  //new update notify telegram
  static async getAlertMessage(ticker) {
    if (ticker) {
      const alertDoc = await db.doc(`crypto/${ticker}/alerts/message`).get();
      if (alertDoc.exists) {
        return { ...alertDoc.data() };
      }
    }
    return {};
  }
  static async getLevelMessage(symbol) {
    if (symbol) {
      const alertDoc = await db.doc(`crypto/${symbol}`).get();
      if (alertDoc.exists) {
        return { ...alertDoc.data() };
      }
    }
    return {};
  }
  //levels
  static async saveLevelBatch(batchArray) {
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
  //alert
  static async sendNotifyAlert(batchArray) {
    const batch = db.batch();
    for (const ticker of batchArray) {
      const { symbol, data } = ticker;
      if (symbol) {
        batch.set(db.doc(`crypto/${symbol}/alerts/message`), data, {
          merge: true,
        });
      }
    }
    await batch.commit();
  }
  static async changeFields(batchArray) {
    const batch = db.batch();
    for (const ticker of batchArray) {
      //data
      const { symbol } = ticker;
      if (symbol) {
        //batch.update(db.doc(`crypto/${symbol}`), data);
        batch.update(db.doc(`crypto/${symbol}`), {
          entryLevel: FieldValue.delete(),
        });
      }
    }
    await batch.commit();
  }
}

export default Ticker;
