import { db } from "../firebase.js";
import Joi from "joi";

class Alert {
  constructor(userId, symbol, price, message = null, lastNotified = null) {
    this.userId = userId;
    this.symbol = symbol;
    this.price = price;
    // set this fields when nessecary
    this.message = message;
    this.lastNotified = lastNotified;
  }
  static validate(alert) {
    const schema = Joi.object({
      id: Joi.string(),
      userId: Joi.string().required(),
      symbol: Joi.string().required(),
      price: Joi.number().min(0).required(),
      message: Joi.string().allow(null),
      lastNotified: Joi.alternatives([
        Joi.object().keys({
          _seconds: Joi.number(),
          _nanoseconds: Joi.number(),
        }),
        Joi.date(),
        null,
      ]),
    });
    return schema.validate(alert);
  }
  static validatePrice(price) {
    return Joi.number().min(0).validate(price);
  }
  static collectionPath(userId, symbol) {
    return db
      .collection("users")
      .doc(userId)
      .collection("subscriptions")
      .doc(symbol)
      .collection("alerts");
  }
  static async findById(userId, symbol, alertId) {
    const alertDoc = await Alert.collectionPath(userId, symbol)
      .doc(alertId)
      .get();
    if (alertDoc.exists) {
      const data = alertDoc.data();
      const alert = new Alert(
        data.userId,
        data.symbol,
        data.price,
        data.message,
        data.lastNotified,
      );
      alert.id = alertDoc.id;
      return alert;
    }
    return null;
  }
  static async findDocById(userId, symbol, alertId) {
    const alertDoc = await Alert.collectionPath(userId, symbol)
      .doc(alertId)
      .get();
    return alertDoc;
  }
  async create() {
    const { error } = Alert.validate(this);
    if (error) {
      throw new Error(`Invalid alert data: ${error.message}`);
    }
    const alertRef = Alert.collectionPath(this.userId, this.symbol).doc();
    const newAlert = {
      userId: this.userId,
      symbol: this.symbol,
      price: this.price,
    };
    if (this.message) newAlert.message = this.message;
    if (this.lastNotified) newAlert.lastNotified = this.lastNotified;
    await alertRef.set(newAlert);
    this.id = alertRef.id;
  }
  async update() {
    const { error } = Alert.validate(this);
    if (error) {
      throw new Error(`Invalid alert data: ${error.message}`);
    }
    const editAlert = {
      userId: this.userId,
      symbol: this.symbol,
      price: this.price,
    };
    if (this.message) editAlert.message = this.message;
    if (this.lastNotified) editAlert.lastNotified = this.lastNotified;
    await Alert.collectionPath(this.userId, this.symbol)
      .doc(this.id)
      .update(editAlert);
  }

  async delete() {
    await Alert.collectionPath(this.userId, this.symbol).doc(this.id).delete();
  }

  static async findBySubscriptionId(
    userId,
    symbol,
    limit,
    startAfter = null,
    endBefore = null,
  ) {
    let query = Alert.collectionPath(userId, symbol).orderBy("price");
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
    const alerts = snapshot.docs.map((doc) => {
      return { id: doc.id, ...doc.data() };
    });
    // Check for previous and next subscriptions
    // TODO set group index
    if (snapshot.empty) {
      return { alerts };
    } else {
      const firstVisible = snapshot.docs[0];
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const hasPrevSnap = await Alert.collectionPath(userId, symbol)
        .orderBy("price")
        .endBefore(firstVisible)
        .limitToLast(1)
        .get();
      const hasNextSnap = await Alert.collectionPath(userId, symbol)
        .orderBy("price")
        .startAfter(lastVisible)
        .limit(1)
        .get();
      // console
      const hasPrev = !hasPrevSnap.empty;
      const hasNext = !hasNextSnap.empty;
      const firstVisibleId = firstVisible.id;
      const lastVisibleId = lastVisible.id;
      return { alerts, firstVisibleId, lastVisibleId, hasPrev, hasNext };
    }
  }

  static async findAll(userId, symbol) {
    const snapshot = await Alert.collectionPath(userId, symbol).get();
    const alerts = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const alert = new Alert(
        data.userId,
        data.symbol,
        data.price,
        data.message,
        data.lastNotified,
      );
      alert.id = doc.id;
      alerts.push(alert);
    });
    return alerts;
  }

  static async mustNotify(userId, symbol, lowPrice, highPrice) {
    const snapshot = await Alert.collectionPath(userId, symbol)
      .where("price", ">=", lowPrice)
      .where("price", "<=", highPrice)
      .get();
    const alerts = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const alert = new Alert(
        data.userId,
        data.symbol,
        data.price,
        data.message,
        data.lastNotified,
      );
      alert.id = doc.id;
      alerts.push(alert);
    });
    return alerts;
  }
}

export default Alert;
