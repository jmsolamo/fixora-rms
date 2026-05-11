import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

/**
 * MySQL pool for Laragon / local MySQL.
 * Set DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME in `.env.local`.
 */
export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DATABASE_HOST ?? "127.0.0.1",
      port: Number(process.env.DATABASE_PORT ?? "3306"),
      user: process.env.DATABASE_USER ?? "root",
      password: process.env.DATABASE_PASSWORD ?? "",
      database: process.env.DATABASE_NAME ?? "fixora_db",
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
}
