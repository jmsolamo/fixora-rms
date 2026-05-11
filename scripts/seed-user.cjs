/* eslint-disable @typescript-eslint/no-require-imports */
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const host = process.env.DATABASE_HOST || "127.0.0.1";
const port = Number(process.env.DATABASE_PORT || 3306);
const dbUser = process.env.DATABASE_USER || "root";
const dbPassword = process.env.DATABASE_PASSWORD || "";
const database = process.env.DATABASE_NAME || "fixora_db";

const username = process.argv[2] || "admin";
const plainPassword = process.argv[3] || "admin123";

async function main() {
  const pool = mysql.createPool({
    host,
    port,
    user: dbUser,
    password: dbPassword,
    database,
    waitForConnections: true,
    connectionLimit: 2,
  });
  const hash = await bcrypt.hash(plainPassword, 10);
  await pool.execute(
    "INSERT INTO users (lname, fname, role, username, password) VALUES ('-', '-', 2, ?, ?) ON DUPLICATE KEY UPDATE password = VALUES(password)",
    [username, hash],
  );
  console.log("User ready:", username);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
