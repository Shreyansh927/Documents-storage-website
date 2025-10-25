// authRoutes.js
import express from "express";
// import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import CryptoJS from "crypto-js";
import { createClient } from "@supabase/supabase-js";
import { restoreUsersDB } from "./db.js"; // ✅ important import

dotenv.config();
const router = express.Router();

// ---------- Supabase Setup ----------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET;

// ---------- AES Key Generator ----------
const createCryptoSecretKey = () => crypto.randomBytes(32).toString("hex");

// ---------- Ensure temporary uploads folder exists ----------
const TEMP_UPLOAD_DIR = "uploads";
if (!fs.existsSync(TEMP_UPLOAD_DIR))
  fs.mkdirSync(TEMP_UPLOAD_DIR, { recursive: true });

// ---------- Multer Setup ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TEMP_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const safeName = file.originalname.replace(/\s+/g, "_").replace(ext, "");
    cb(null, `${safeName}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "video/mp4",
    "video/mkv",
    "application/pdf",
  ];
  cb(null, allowedTypes.includes(file.mimetype));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 500 }, // 500 MB
});

// ---------- Backup users.db to Supabase ----------
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
  // ✅ Restore DB before all routes
  router.use(async (req, res, next) => {
    await restoreUsersDB();
    next();
  });
  // ---------- SIGNUP ----------
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

      //Send welcome email
      // const transporter = nodemailer.createTransport({
      //   service: "gmail",
      //   auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
      // });

      // await transporter.sendMail({
      //   from: process.env.GMAIL_USER,
      //   to: email,
      //   subject: "Welcome to Krish.com ",
      //   text: `Hello ${name},\n\nWelcome to Krish.com! Your account has been created successfully.\n\nBest Regards,\nTeam Krish`,
      // });

      await backupUsersDB();
      res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message, error: err.message });
    }
  });

  router.put("/change-password", async (req, res) => {
    try {
      let { email, newPassword } = req.body;

      // Decode if frontend sends encodedEmail
      if (email.includes("%40")) {
        email = decodeURIComponent(email);
      }

      const user = await db.get("SELECT * FROM user WHERE email = ?", [email]);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const newHashedPassword = await bcrypt.hash(newPassword, 10);

      await db.run("UPDATE user SET password = ? WHERE email = ?", [
        newHashedPassword,
        email,
      ]);
      await backupUsersDB();

      return res.status(200).json({ message: "Password updated successfully" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });

  router.post("/set-document-password", async (req, res) => {
    const { lock } = req.body;
    const { email, documentName } = req.query;

    try {
      if (!lock || !email || !documentName) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const user = await db.get("SELECT * FROM user WHERE email = ?", [email]);
      if (!user) return res.status(404).json({ message: "User not found" });

      const documents = JSON.parse(user.documents || "[]");
      const docIndex = documents.findIndex((doc) => {
        const decryptedName = CryptoJS.AES.decrypt(
          doc.documentName,
          user.secretCryptoKey
        ).toString(CryptoJS.enc.Utf8);
        return decryptedName === documentName; // compare with plain name
      });
      if (docIndex === -1)
        return res.status(404).json({ message: "Document not found" });

      documents[docIndex].documentLock = lock;

      await db.run("UPDATE user SET documents = ? WHERE email = ?", [
        JSON.stringify(documents),
        email,
      ]);

      await backupUsersDB();

      res.status(200).json({ message: "Document locked successfully" });
    } catch (err) {
      console.error("Error locking document:", err);
      res
        .status(500)
        .json({ message: "Error locking document", error: err.message });
    }
  });

  // ---------- LOGIN ----------
  router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await db.get("SELECT * FROM user WHERE email = ?", [email]);
      if (!user) return res.status(400).send("Invalid user");

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return res.status(400).send("Invalid password");

      const jwtToken = jwt.sign(
        { email: user.email },
        process.env.JWT_SECRET || "My_SECRET_KEY",
        { expiresIn: "1h" }
      );

      res.cookie("jwtToken", jwtToken, {
        httpOnly: false,
        sameSite: "none",
        secure: true,
        maxAge: 60 * 60 * 1000,
      });

      res.json({
        message: "Login successful",
        name: user.name,
        email: user.email,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Login error");
    }
  });

  router.post("/check-auth", async (req, res) => {
    const { deleteFilePath, email } = req.query;
    try {
      const user = await db.get(
        "SELECT documents, secretCryptoKey FROM user WHERE email = ?",
        [email]
      );
      if (!user) return res.status(404).json({ error: "User not found" });
      let docsArray = [];
      try {
        docsArray = JSON.parse(user.documents || "[]");
      } catch {
        docsArray = [];
      }
      if (deleteFilePath) {
        const updatedDocs = docsArray.filter((doc) => {
          const bytes = CryptoJS.AES.decrypt(doc.link, user.secretCryptoKey);
          const decryptedLink = bytes.toString(CryptoJS.enc.Utf8);
          return decryptedLink !== deleteFilePath;
        });
        await db.run("UPDATE user SET documents = ? WHERE email = ?", [
          JSON.stringify(updatedDocs),
          email,
        ]);
      }

      res.json({
        success: true,
      });
      await backupUsersDB();
    } catch (err) {
      console.error("🔥 Error checking auth:", err);
      res.status(500).json({ error: "Error checking auth" });
    }
  });

  // ---------- LOGOUT ----------
  router.post("/logout", (req, res) => {
    try {
      res.clearCookie("jwtToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      res.json({ result: true, message: "Logout successful" });
    } catch (err) {
      res.status(500).json({ result: false, message: "Logout error" });
    }
  });

  // ---------- EDIT PROFILE ----------
  router.put(
    "/edit-profile",
    upload.fields([
      { name: "profileImage", maxCount: 1 },
      { name: "profileVideo", maxCount: 1 },
    ]),
    async (req, res) => {
      const { email, location } = req.body;
      let query = "UPDATE user SET location = ?";
      const params = [location];

      if (req.files["profileImage"]) {
        query += ", profileImage = ?";
        params.push("/uploads/" + req.files["profileImage"][0].filename);
      }
      if (req.files["profileVideo"]) {
        query += ", profileVideo = ?";
        params.push("/uploads/" + req.files["profileVideo"][0].filename);
      }
      query += " WHERE email = ?";
      params.push(email);

      db.run(query, params, async (err) => {
        if (err)
          return res.status(500).json({ success: false, error: err.message });
        await backupUsersDB();
        res.json({ success: true });
      });
    }
  );
  // ---------- UPLOAD DOCUMENT ----------
  router.post(
    "/upload-document/:email",
    upload.single("document"),
    async (req, res) => {
      let email = decodeURIComponent(req.params.email);
      const { documentName } = req.body;

      if (!email) return res.status(400).json({ error: "Email required" });
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      if (!documentName)
        return res.status(400).json({ error: "Document name required" });

      try {
        const user = await db.get(
          "SELECT documents, secretCryptoKey FROM user WHERE email = ?",
          [email]
        );
        if (!user) return res.status(404).json({ error: "User not found" });

        let docsArray = [];
        try {
          docsArray = JSON.parse(user.documents || "[]");
        } catch {
          docsArray = [];
        }

        const newDoc = {
          link: CryptoJS.AES.encrypt(
            "uploads/" + req.file.filename,
            user.secretCryptoKey
          ).toString(),
          documentName: CryptoJS.AES.encrypt(
            documentName,
            user.secretCryptoKey
          ).toString(),
          documentLock: "",
        };

        docsArray.push(newDoc);
        await db.run("UPDATE user SET documents = ? WHERE email = ?", [
          JSON.stringify(docsArray),
          email,
        ]);

        await backupUsersDB();
        res.json({ success: true, documents: docsArray });
      } catch (err) {
        console.error("Upload document error:", err);
        res.status(500).json({ success: false, error: err.message });
      }
    }
  );

  // ---------- GET DOCUMENTS ----------
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
      } catch {
        docs = [];
      }

      res.json({ documents: docs, cryptoSecretKey: user.secretCryptoKey });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---------- GET ALL REGISTRATIONS ----------
  router.get("/allRegistrations", async (req, res) => {
    try {
      const users = await db.all("SELECT * FROM user");
      res.json(users || []);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---- Get analytical data
  router.get("/analytics", async (req, res) => {
    const { email } = req.query;

    try {
      // Get total users in DB
      const result = await db.get(`SELECT COUNT(*) AS count FROM user`);

      // Get total documents for the current user
      const user = await db.get("SELECT * FROM user WHERE email = ?", [
        decodeURIComponent(email),
      ]);

      let protectedDoc = [];

      let totalDocuments = [];
      totalDocuments = JSON.parse(user.documents) || [];
      protectedDoc = totalDocuments.filter((doc) => doc.documentLock);
      const unprotectedDocuments = totalDocuments.length - protectedDoc.length;

      res.json({
        totalUsers: result.count,
        totalDocuments: totalDocuments.length,
        protectedDocuments: protectedDoc.length,
        unprotectedDocuments: unprotectedDocuments,
      });
    } catch (err) {
      console.error("Error fetching analytics:", err);
      res.status(500).json({ message: "Error fetching analytics" });
    }
  });

  return router;
};

export default authRoutes;
