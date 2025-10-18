import { db } from "../firebase.js";

class Scan {
  static scanCronPaginateRef(timeframe) {
    return db.doc(`settings/scanCronPaginate/scanner/${timeframe}`);
  }
  static scanPath() {
    return db
      .collection("settings")
      .doc("scanCronPaginate")
      .collection("scanner");
  }
  static scanFields() {
    return [{ name: "name" }, { name: "active" }, { name: "schedule" }];
  }
  //new scan config
  static async getConfig(timeframe) {
    const settingsDoc = await Scan.scanCronPaginateRef(timeframe).get();
    if (settingsDoc.exists) {
      return { timeframe: settingsDoc.id, ...settingsDoc.data() };
    }
    return null;
  }
  //get all cron jobs
  static async all() {
    const snapshot = await Scan.scanPath().orderBy("orderNumber", "desc").get();
    const intervals = [];
    snapshot.forEach((doc) => {
      //const data = doc.data();
      //const scan = new Scan(doc.id, data.volumePcnt, data.chunkNumber);
      intervals.push({ id: doc.id, ...doc.data() });
    });
    return intervals;
  }
  //new cron update
  static async updateField(interval, fieldName, fieldData) {
    //for bot
    if (fieldName === "active" && typeof fieldData !== "boolean") {
      fieldData = fieldData === "true";
    }
    if (fieldName === "notify" && typeof fieldData !== "boolean") {
      fieldData = fieldData === "true";
    }
    const editScanField = {
      [fieldName]: fieldData,
    };
    await Scan.scanCronPaginateRef(interval).update(editScanField);
  }
}

export default Scan;
