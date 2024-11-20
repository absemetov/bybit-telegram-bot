import { db } from "../firebase.js";
import Alert from "../models/Alert.js";
import Joi from "joi";

class Subscription {
  constructor(userId, symbol, interval, lastNotified = new Date()) {
    this.userId = userId;
    this.symbol = symbol;
    this.interval = interval;
    this.lastNotified = lastNotified;
  }
  static validate(subs) {
    const schema = Joi.object({
      userId: Joi.string().required(),
      symbol: Joi.string().required(),
      interval: Joi.number().integer().min(0).required(),
      lastNotified: Joi.alternatives([
        Joi.object().keys({
          _seconds: Joi.number(),
          _nanoseconds: Joi.number(),
        }),
        Joi.date(),
        null,
      ]),
    });
    return schema.validate(subs);
  }
  static validateInterval(interval) {
    return Joi.number().integer().min(0).validate(interval);
  }
  static collectionPath(userId) {
    return db.collection("users").doc(userId).collection("subscriptions");
  }
  static async findById(userId, symbol) {
    const subscriptionDoc = await Subscription.collectionPath(userId)
      .doc(symbol)
      .get();
    if (subscriptionDoc.exists) {
      const data = subscriptionDoc.data();
      const subscription = new Subscription(
        data.userId,
        data.symbol,
        data.interval,
        data.lastNotified,
      );
      return subscription;
    }
    return null;
  }
  static async findDocById(userId, symbol) {
    const subscriptionDoc = await Subscription.collectionPath(userId)
      .doc(symbol)
      .get();
    return subscriptionDoc;
  }
  async create() {
    // validate
    const { error } = Subscription.validate(this);
    if (error) {
      throw new Error(`Invalid subscription data: ${error.message}`);
    }
    // duplicate symbol field for collectionGroup query
    const newSubs = {
      userId: this.userId,
      symbol: this.symbol,
      interval: this.interval,
      lastNotified: this.lastNotified,
    };
    // if (this.lastNotified) newSubs.lastNotified = this.lastNotified;
    await Subscription.collectionPath(this.userId)
      .doc(this.symbol)
      .set(newSubs);
  }

  async update() {
    const { error } = Subscription.validateInterval(this.interval);
    if (error) {
      throw new Error(
        `Invalid interval ${this.interval}. Please enter a positive integer value.`,
      );
    }
    const editSubs = {
      userId: this.userId,
      symbol: this.symbol,
      interval: this.interval,
      lastNotified: this.lastNotified,
    };
    // if (this.lastNotified) editSubs.lastNotified = this.lastNotified;
    await Subscription.collectionPath(this.userId)
      .doc(this.symbol)
      .update(editSubs);
  }

  async delete() {
    // const userIdStr = this.userId.toString();
    await Subscription.collectionPath(this.userId).doc(this.symbol).delete();
    // TODO delete all alerts
    const alerts = await Alert.findAll(this.userId, this.symbol);
    for (const alert of alerts) {
      await alert.delete();
    }
  }

  static async findByUserId(
    userId,
    limit,
    startAfter = null,
    endBefore = null,
  ) {
    // const userIdStr = userId.toString();
    let query = Subscription.collectionPath(userId).orderBy("symbol");

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
    //const tickers = await bybitTickers();
    // TODO set lastPrice !!!
    const subscriptions = snapshot.docs.map((doc) => {
      // const coinData = tickers.filter(function (el) {
      //   return el.symbol === doc.data().symbol;
      // });
      return { ...doc.data() };
    });
    if (snapshot.empty) {
      return { subscriptions };
    } else {
      const firstVisible = snapshot.docs[0];
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      // Check for previous and next subscriptions
      const hasPrevSnap = await Subscription.collectionPath(userId)
        .orderBy("symbol")
        .endBefore(firstVisible)
        .limitToLast(1)
        .get();
      const hasNextSnap = await Subscription.collectionPath(userId)
        .orderBy("symbol")
        .startAfter(lastVisible)
        .limit(1)
        .get();
      const hasPrev = !hasPrevSnap.empty;
      const hasNext = !hasNextSnap.empty;
      const firstVisibleId = firstVisible.id;
      const lastVisibleId = lastVisible.id;
      return { subscriptions, firstVisibleId, lastVisibleId, hasPrev, hasNext };
    }
  }

  static async findAll() {
    // TODO add group index "interval" asc
    // .where("interval", ">", 0)
    // TODO use diff ID like user_id_symbol!!!!
    // const snapshot = await db.collectionGroup("subscriptions").get();
    // 94899148 user absemetov
    const snapshot = await Subscription.collectionPath("94899148").get();
    const subscriptions = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      subscriptions.push(
        new Subscription(
          data.userId,
          data.symbol,
          data.interval,
          data.lastNotified,
        ),
      );
    });
    return subscriptions;
  }
}

export default Subscription;
