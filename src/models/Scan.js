import { db } from "../firebase.js";
import Joi from "joi";

class Scan {
  constructor(numberPaginate = 1, direction = null, lastVisibleId = null) {
    this.numberPaginate = numberPaginate;
    this.direction = direction;
    this.lastVisibleId = lastVisibleId;
  }
  static validate(scan) {
    const schema = Joi.object({
      numberPaginate: Joi.number().integer().min(0).required(),
      direction: Joi.string().allow(null).required(),
      lastVisibleId: Joi.string().allow(null).required(),
    });
    return schema.validate(scan);
  }
  static validateInterval(interval) {
    return Joi.number().integer().min(0).validate(interval);
  }
  static scanCronPaginateRef() {
    return db.collection("settings").doc("scanCronPaginate");
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
  static async paginateData(numberPaginate) {
    const settingsDoc = await Scan.scanCronPaginateRef().get();
    if (settingsDoc.exists) {
      const settings = settingsDoc.data()[`paginate${numberPaginate}`];
      return new Scan(
        numberPaginate,
        settings?.direction,
        settings?.lastVisibleId,
      );
    }
    return null;
  }
  async update() {
    const { error } = Scan.validate(this);
    if (error) {
      throw new Error(`Invalid Scan settings data: ${error.message}`);
    }
    await Scan.scanCronPaginateRef().update({
      [`paginate${this.numberPaginate}`]: {
        direction: this.direction,
        lastVisibleId: this.lastVisibleId,
      },
    });
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
