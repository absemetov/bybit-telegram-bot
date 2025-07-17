import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    credential: cert(
      "./config/rzk-warsaw-dev-firebase-adminsdk-27ucx-06b7770842.json",
    ),
  });
}
const db = getFirestore();

export { db, FieldValue };
