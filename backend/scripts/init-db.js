require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

function sslConfig() {
  if (process.env.DB_SSL !== "true") return undefined;
  if (process.env.DB_CA_CERT) {
    return { ca: process.env.DB_CA_CERT.replace(/\\n/g, "\n") };
  }
  if (process.env.DB_CA_PATH && fs.existsSync(process.env.DB_CA_PATH)) {
    return { ca: fs.readFileSync(process.env.DB_CA_PATH, "utf8") };
  }
  return { rejectUnauthorized: true };
}

function configFromUrl(url) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, "") || process.env.DB_NAME || "senegram",
  };
}

function splitSql(schema) {
  return schema
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
}

async function initDatabase() {
  const url = process.env.MYSQL_URL || process.env.DATABASE_URL;
  const dbName = process.env.DB_NAME || "senegram";
  const baseConfig = url
    ? configFromUrl(url)
    : {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
      };

  let connection;
  try {
    console.log(`🔧 Connexion à MySQL: ${baseConfig.host}:${baseConfig.port}`);
    connection = await mysql.createConnection({
      ...baseConfig,
      multipleStatements: false,
      ssl: sslConfig(),
    });
    console.log("✅ Connecté à MySQL");

    const schemaPath = path.join(__dirname, "..", "database", "schema.sql");
    const statements = splitSql(fs.readFileSync(schemaPath, "utf8"))
      .filter((stmt) => {
        if (url && /^CREATE DATABASE/i.test(stmt)) return false;
        if (url && /^USE /i.test(stmt)) return false;
        return true;
      });

    console.log(`📋 Exécution de ${statements.length} statements...`);
    for (const stmt of statements) {
      try {
        await connection.query(stmt);
      } catch (err) {
        if (!/already exists|Duplicate|exists/i.test(err.message)) {
          console.error("⚠️ Erreur statement:", err.message);
          throw err;
        }
      }
    }

    const [tables] = await connection.query("SHOW TABLES");
    console.log("✅ Schéma MySQL initialisé");
    console.log("\n📊 Tables:");
    tables.forEach((t) => console.log(`  - ${Object.values(t)[0]}`));
  } catch (err) {
    console.error("❌ Erreur initialisation DB:", err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

initDatabase();
