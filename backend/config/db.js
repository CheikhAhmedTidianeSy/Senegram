/**
 * Pool MySQL (mysql2/promise).
 * On expose un `pool` utilisable partout avec await pool.query(...).
 */
const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "senegram",
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  charset: "utf8mb4",
  timezone: "Z",
  dateStrings: false,
});

// petit ping de démarrage
pool
  .getConnection()
  .then((conn) => {
    console.log(`✅ MySQL connecté (${process.env.DB_NAME || "senegram"})`);
    conn.release();
  })
  .catch((err) => {
    console.error("❌ Impossible de se connecter à MySQL :", err.message);
  });

module.exports = pool;
