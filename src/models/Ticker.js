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
    const { openPrice, closePrice, barChange } = kline[0];
    const newTickerData = {
      price24h: openPrice,
      price24hPcnt: barChange,
      lastPrice: closePrice,
    };
    const { error } = Ticker.validate(newTickerData);
    if (error) {
      throw new Error(`Invalid ticker data: ${error.message}`);
    }
    // lastPrice: Joi.number().min(0).allow(null),
    // price24hPcnt
    await db.doc(`crypto/${symbol}`).set(newTickerData);
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
  //new update
  static async updateField(symbol, fieldName, fieldData) {
    if (
      fieldName === "alert1" ||
      fieldName === "alert2" ||
      fieldName === "volumePcnt"
    ) {
      fieldData = +fieldData.replace(/,/g, ".");
      const { error } = Ticker.validateAlertPrice(fieldData);
      if (error) {
        throw new Error(`Invalid ticker data ${fieldName} must be numeric!`);
      }
    }
    const editTickerField = {
      [fieldName]: fieldData,
    };
    await db.doc(`crypto/${symbol}`).update(editTickerField);
  }
  static async delete(symbol) {
    await db.doc(`crypto/${symbol}`).delete();
  }
  static async paginate(limit, direction = null, lastVisibleId = null) {
    //if scan 50 ticker dont order!!!
    const mainQuery =
      limit === 50
        ? db.collection("crypto")
        : db.collection("crypto").orderBy("price24hPcnt", "desc");
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
