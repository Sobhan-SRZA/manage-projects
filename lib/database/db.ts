import { MySQLDriver, QuickDB } from "quick.db";

let db: QuickDB | null = null;

function getDB(): QuickDB {
  if (!db) {
    db = new QuickDB({
      driver: new MySQLDriver({
        localAddress: process.env.MYSQL_LOCAL_ADDRESS,
        database: process.env.MYSQL_LOCAL_DATABASE,
        password: process.env.MYSQL_LOCAL_PASSWORD,
        user: process.env.MYSQL_LOCAL_USERNAME
      }),
      filePath: process.env.QUICKDB_PATH || "./data/auth.sqlite",
    });
  }
  return db;
}

export const quickdb = getDB();
export default getDB;