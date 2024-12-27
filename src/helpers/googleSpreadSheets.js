import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { creds } from "../../config/rzk-warsaw-ru-7e70642e408f.js";
// add data to google sheet
export const googleSheet = async (id, title) => {
  // use subject opt for my email
  const serviceAccountAuth = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    subject: "nadir@absemetov.org.ua",
  });
  const doc = new GoogleSpreadsheet(id, serviceAccountAuth);
  await doc.loadInfo();
  return doc.sheetsByTitle[title];
  // await sheet.addRows(tickers);
  // await doc.resetLocalCache();
};
