import { db } from "../firebase.js";
import Joi from "joi";

class Scan {
  constructor(id, volumePcnt = 0, chunkNumber = 0) {
    this.id = id;
    this.volumePcnt = volumePcnt;
    this.chunkNumber = chunkNumber;
  }
  static validate(scan) {
    const schema = Joi.object({
      id: Joi.string().required(),
      volumePcnt: Joi.number().integer().min(0).required(),
      chunkNumber: Joi.number().integer().min(0).required(),
    });
    return schema.validate(scan);
  }
  static validateInterval(interval) {
    return Joi.number().integer().min(0).validate(interval);
  }
  static intervalRef(interval) {
    return db.collection("tickers-scan").doc(interval);
  }
  static scanPath() {
    return db.collection("tickers-scan");
  }
  static tickersPath(interval) {
    return db.collection("tickers-scan").doc(interval).collection("tickers");
  }
  static scanFields() {
    return [{ name: "volumePcnt", unit: "x" }];
  }
  static async find(interval) {
    const intervalDoc = await Scan.intervalRef(interval).get();
    if (intervalDoc.exists) {
      const data = intervalDoc.data();
      return new Scan(interval, data.volumePcnt, data.chunkNumber);
    }
    return null;
  }
  async create() {
    // validate
    const { error } = Scan.validate(this);
    if (error) {
      throw new Error(`Invalid Scan data: ${error.message}`);
    }
    // duplicate symbol field for collectionGroup query
    const newScan = {
      volumePcnt: this.volumePcnt,
    };
    await Scan.intervalRef(this.id).set(newScan);
  }

  async update() {
    const { error } = Scan.validate(this);
    if (error) {
      throw new Error(`Invalid Scan data: ${error.message}`);
    }
    const editScan = {
      volumePcnt: +this.volumePcnt,
      chunkNumber: this.chunkNumber,
    };
    await Scan.intervalRef(this.id).update(editScan);
  }
  static async all() {
    const snapshot = await Scan.scanPath().orderBy("orderNumber").get();
    const intervals = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const scan = new Scan(doc.id, data.volumePcnt, data.chunkNumber);
      intervals.push(scan);
    });
    return intervals;
  }
  static async tickersAll(interval) {
    const snapshot = await Scan.tickersPath(interval)
      .orderBy("updatedAt", "desc")
      .get();
    const tickers = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      tickers.push({
        symbol: doc.id,
        updatedAt: data.updatedAt.seconds,
        lastPrice: data.lastPrice,
        volumeUp: data.volumeUp,
      });
    });
    return tickers;
  }
  static async tickerDoc(interval, symbol) {
    const tickerDoc = await Scan.tickersPath(interval).doc(symbol).get();
    return tickerDoc;
  }
  static async ticker(interval, symbol) {
    const tickerDoc = await Scan.tickersPath(interval).doc(symbol).get();
    if (tickerDoc.exists) {
      const data = tickerDoc.data();
      return {
        symbol: tickerDoc.id,
        updatedAt: data.updatedAt.seconds,
        lastPrice: data.lastPrice,
        volumeUp: data.volumeUp,
      };
    }
    return null;
  }
  //TODO paginate Scans
  static async paginateScan(
    interval,
    limit,
    startAfter = null,
    endBefore = null,
  ) {
    const mainQuery = Scan.tickersPath(interval).orderBy("updatedAt", "desc");
    let query = mainQuery;
    if (startAfter) {
      query = query.startAfter(startAfter);
    }

    if (endBefore) {
      query = query.endBefore(endBefore);
    }
    // set limit
    if (endBefore) {
      query = query.limitToLast(limit);
    } else {
      query = query.limit(limit);
    }
    const snapshot = await query.get();
    const tickers = snapshot.docs.map((doc) => {
      return {
        symbol: doc.id,
        updatedAt: doc.data().updatedAt.seconds,
        lastPrice: doc.data().lastPrice,
        volumeUp: doc.data().volumeUp,
      };
    });
    if (snapshot.empty) {
      return { tickers };
    } else {
      const firstVisible = snapshot.docs[0];
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      // Check for previous and next subscriptions
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
  }
}

export default Scan;
