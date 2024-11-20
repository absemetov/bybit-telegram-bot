import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";

dotenv.config();

let db;

// Инициализация Firebase
if (!getApps().length) {
  initializeApp({
    credential: cert(
      "./rzk-warsaw-dev-firebase-adminsdk-27ucx-06b7770842.json",
    ),
  });
  db = getFirestore();
}

export { db };
