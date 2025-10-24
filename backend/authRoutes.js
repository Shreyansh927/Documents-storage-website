// authRoutes.js
import express from "express";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import CryptoJS from "crypto-js";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
const router = express.Router();

// ---------- Supabase Setup ----------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET;
if (!SUPABASE_BUCKET) console.error("❌ Missing Supabase bucket name");

// ---------- AES Key Generator ----------
const createCryptoSecretKey = () => crypto.randomBytes(32).toString("hex");

// ---------- Multer Setup ----------
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "video/mp4",
    "video/mkv",
    "application/pdf",
  ];
  cb(null, allowedTypes.includes(file.mimetype));
};
const upload = multer({ storage, fileFilter });

// ---------- Backup users.db ----------
const backupUsersDB = async () => {
  if (fs.existsSync("users.db")) {
    const fileBuffer = fs.readFileSync("users.db");
    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload("users.db", fileBuffer, { cacheControl: "3600", upsert: true });
    if (error) console.error("⚠️ Supabase backup failed:", error.message);
  }
};

// ---------- Routes ----------
const authRoutes = (db) => {
  // SIGNUP
  router.post("/signup", async (req, res) => {
    const { username, name, password, email, location } = req.body;
    try {
      if (!username || !name || !password || !email || !location)
        return res.status(400).json({ message: "All fields are required" });

      if (password.length < 5)
        return res
          .status(400)
          .json({ message: "Password must be at least 5 characters" });

      const existingUser = await db.get(
        "SELECT * FROM user WHERE username = ? OR email = ?",
        [username, email]
      );
      if (existingUser)
        return res
          .status(400)
          .json({ message: "Username or Email already exists" });

      const hashedPassword = await bcrypt.hash(password, 10);
      const finalSecretKey = createCryptoSecretKey();

      await db.run(
        "INSERT INTO user (secretCryptoKey, username, name, password, email, location, documents) VALUES (?,?,?,?,?,?,?)",
        [finalSecretKey, username, name, hashedPassword, email, location, "[]"]
      );

      await backupUsersDB();
      res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  });

  // LOGIN
  router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
      const user = await db.get("SELECT * FROM user WHERE email = ?", [email]);
      if (!user) return res.status(400).json({ message: "Invalid user" });

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid)
        return res.status(400).json({ message: "Invalid password" });

      const jwtToken = jwt.sign(
        { email: user.email },
        process.env.JWT_SECRET || "My_SECRET_KEY",
        { expiresIn: "1h" }
      );

      res.cookie("jwtToken", jwtToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 60 * 60 * 1000,
      });

      res.json({
        message: "Login successful",
        name: user.name,
        email: user.email,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  });

  // CHANGE PASSWORD
  router.put("/change-password", async (req, res) => {
    try {
      let { email, newPassword } = req.body;
      if (email.includes("%40")) email = decodeURIComponent(email);

      const user = await db.get("SELECT * FROM user WHERE email = ?", [email]);
      if (!user) return res.status(404).json({ message: "User not found" });

      const newHashedPassword = await bcrypt.hash(newPassword, 10);
      await db.run("UPDATE user SET password = ? WHERE email = ?", [
        newHashedPassword,
        email,
      ]);

      res.json({ message: "Password updated successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // UPLOAD DOCUMENT
  router.post(
    "/upload-document",
    upload.single("document"),
    async (req, res) => {
      const { email, documentName } = req.body;
      if (!email || !req.file)
        return res.status(400).json({ error: "Email and file required" });

      try {
        const user = await db.get(
          "SELECT documents, secretCryptoKey FROM user WHERE email = ?",
          [email]
        );
        if (!user) return res.status(404).json({ error: "User not found" });

        const { data, error } = await supabase.storage
          .from(SUPABASE_BUCKET)
          .upload(
            `documents/${Date.now()}-${req.file.originalname.replace(
              /\s+/g,
              "_"
            )}`,
            req.file.buffer,
            {
              cacheControl: "3600",
              upsert: true,
              contentType: req.file.mimetype,
            }
          );

        if (error)
          return res.status(500).json({ success: false, error: error.message });

        const { data: publicData } = supabase.storage
          .from(SUPABASE_BUCKET)
          .getPublicUrl(data.path);
        const publicUrl = publicData.publicUrl;

        let docsArray = [];
        try {
          docsArray = JSON.parse(user.documents || "[]");
        } catch {}

        const newDoc = {
          link: CryptoJS.AES.encrypt(
            publicUrl,
            user.secretCryptoKey
          ).toString(),
          documentName: CryptoJS.AES.encrypt(
            documentName,
            user.secretCryptoKey
          ).toString(),
          documentLock: false,
        };

        docsArray.push(newDoc);

        await db.run("UPDATE user SET documents = ? WHERE email = ?", [
          JSON.stringify(docsArray),
          email,
        ]);

        await backupUsersDB();

        res.json({ success: true, documents: docsArray });
      } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
      }
    }
  );

  // GET DOCUMENTS
  router.get("/get-documents/:email", async (req, res) => {
    const { email } = req.params;
    try {
      const user = await db.get(
        "SELECT documents, secretCryptoKey FROM user WHERE email = ?",
        [email]
      );
      if (!user) return res.status(404).json({ documents: [] });

      let docs = [];
      try {
        docs = JSON.parse(user.documents || "[]");
      } catch {}

      res.json({ documents: docs, cryptoSecretKey: user.secretCryptoKey });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ANALYTICS
  router.get("/analytics", async (req, res) => {
    const { email } = req.query;

    try {
      const result = await db.get(`SELECT COUNT(*) AS count FROM user`);
      const user = await db.get("SELECT * FROM user WHERE email = ?", [
        decodeURIComponent(email),
      ]);

      const totalDocuments = JSON.parse(user.documents || "[]");
      const protectedDocs = totalDocuments.filter((d) => d.documentLock);
      const unprotectedDocs = totalDocuments.length - protectedDocs.length;

      res.json({
        totalUsers: result.count,
        totalDocuments: totalDocuments.length,
        protectedDocuments: protectedDocs.length,
        unprotectedDocuments: unprotectedDocs,
      });
    } catch (err) {
      console.error("Error fetching analytics:", err);
      res.status(500).json({ message: "Error fetching analytics" });
    }
  });

  return router;
};

export default authRoutes;
