import { db } from "../firebase.js";

class Session {
  constructor(userId, sessionData = {}) {
    this.userId = userId.toString();
    this.sessionData = sessionData;
  }

  static async findById(userId, sessionName = "bybit-bot") {
    if (!userId) {
      throw new Error("Invalid arguments: userId is required.");
    }
    const userIdStr = userId.toString();
    const sessionDoc = await db
      .collection("users")
      .doc(userIdStr)
      .collection("sessions")
      .doc(sessionName)
      .get();
    return sessionDoc.exists
      ? new Session(userIdStr, sessionDoc.data())
      : new Session(userIdStr);
  }

  async save(sessionName = "bybit-bot") {
    if (!this.userId) {
      throw new Error("Invalid arguments: userId is required.");
    }
    // const plainData = JSON.parse(JSON.stringify(this.sessionData));
    // await db
    //   .collection("users")
    //   .doc(this.userId)
    //   .collection("sessions")
    //   .doc("current")
    //   .set(plainData, { merge: true });
    await db
      .collection("users")
      .doc(this.userId)
      .collection("sessions")
      .doc(sessionName)
      .set(this.sessionData, { merge: true });
  }

  async delete(sessionName = "bybit-bot") {
    if (!this.userId) {
      throw new Error("Invalid arguments: userId is required.");
    }
    await db
      .collection("users")
      .doc(this.userId)
      .collection("sessions")
      .doc(sessionName)
      .delete();
  }
}

export default Session;
