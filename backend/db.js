// db.js
import dotenv from "dotenv";
dotenv.config();

import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

// ---------- __dirname for ESM ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- Paths & Supabase Setup ----------
const dbPath = path.join(__dirname, "users.db");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET;

// ---------- Restore users.db from Supabase ----------
export const restoreUsersDB = async () => {
  if (!fs.existsSync(dbPath)) {
    console.log("⚡ users.db missing or empty. Restoring from Supabase...");
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .download("users.db");

    if (error) {
      console.warn("⚠️ Could not restore users.db:", error.message);
      return;
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    fs.writeFileSync(dbPath, buffer);
    console.log("✅ users.db restored from Supabase");
  }
};

// ---------- Initialize SQLite DB ----------
const initDB = async () => {
  await restoreUsersDB();

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.run(`
    CREATE TABLE IF NOT EXISTS user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      secretCryptoKey TEXT,
      username TEXT UNIQUE,
      name TEXT,
      password TEXT,
      email TEXT UNIQUE,
      location TEXT,
      otp TEXT DEFAULT "",
      profileImage TEXT,
      profileVideo TEXT,
      documentName TEXT,
      documents TEXT DEFAULT '[]'
    )
  `);

  return db;
};

export default initDB;
