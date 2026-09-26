import { QuickDB } from "quick.db";

let db: QuickDB | null = null;

function getDB(): QuickDB {
  if (!db) {
    db = new QuickDB({
      filePath: process.env.QUICKDB_PATH || "./data/auth.sqlite",
    });
  }
  return db;
}

export const quickdb = getDB();
export default getDB;