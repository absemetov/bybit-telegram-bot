import { db, FieldValue, FieldPath } from "./firebase.js";
import { getTicker, bybitUsers } from "./bybitV5.js";

class Ticker {
  //create New ticker
  static async create(symbol) {
    const ticker = await getTicker(symbol);
    if (ticker.length == 0) {
      throw new Error(`Ticker ${symbol} not found in Bybit`);
    }
    const newTickerData = {
      star: false,
      createdAt: new Date(),
      priceScale: +ticker[0].priceScale || 4,
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
  //create Triggers
  static async setTriggers(symbol, support, resistance, user, tolerance, size, triggersCount = 3) {
    //clear All stop orders
    const side = user === "main" ? "Buy" : "Sell";
    const price = user === "main" ? support : resistance;
    const toleranceSide = user === "main" ? tolerance : -tolerance;
    await bybitUsers[user].cancelAllOrders(symbol, side);
    const positions = await bybitUsers[user].getTickerPositions(symbol);
    const position = positions.find((p) => p.side === side);
    const triggerSize = position
      ? (size - position.avgPrice * position.size) / triggersCount
      : size / triggersCount;
    if (price) {
      const triggers = {
        [`${user}Triggers`]: {
          1: {
            price: price * (1 + (toleranceSide * 2) / 100),
            active: true,
            size: triggerSize > 0 ? triggerSize : 0,
          },
          2: {
            price: price * (1 + toleranceSide / 100),
            active: true,
            size: triggerSize > 0 ? triggerSize : 0,
          },
          3: {
            price: price,
            active: true,
            size: triggerSize > 0 ? triggerSize : 0,
          },
        },
      };
      let index = 1;
      for (let i = 4; i <= triggersCount; i++) {
        triggers[`${user}Triggers`][i] = {
          price: price * (1 - (toleranceSide * index++) / 100),
          active: true,
          size: triggerSize > 0 ? triggerSize : 0,
        }
      }
      await Ticker.update(symbol, triggers);
      return triggers[`${user}Triggers`];
    }
  }
  //get ticker info
  static async getInfo(symbol, user) {
    const tickerDoc = await db.doc(`crypto/${symbol}`).get();
    if (tickerDoc.exists) {
      const orders = await bybitUsers[user].getTickerOrders(symbol);
      const positions = await bybitUsers[user].getTickerPositions(symbol);
      const balance = await bybitUsers[user].getBybitBalance();
      return {
        algoSettings: tickerDoc.data()[user],
        triggers: tickerDoc.data()[`${user}Triggers`],
        stopOrders: orders.stop,
        partOrders: orders.part,
        positions,
        balance,
      };
    }
    return null;
  }
  //update data
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
        : tab === "trading"
          ? db
              .collection("crypto")
              .where(`${user}.attemptsCount`, ">=", 0)
              .orderBy(`${user}.attemptsCount`)
          : db.collection("crypto").orderBy(FieldPath.documentId());
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
        return {
          symbol: doc.id,
          star: doc.data().star,
          triggers: doc.data()[`${user}Triggers`],
          lastNotified: doc.data()[`${user}LastNotified`],
          positionBuyValue: doc.data()[`${user}PositionBuyValue`],
          positionSellValue: doc.data()[`${user}PositionSellValue`],
          algoSettings: doc.data()[user],
          priceScale: doc.data().priceScale,
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
