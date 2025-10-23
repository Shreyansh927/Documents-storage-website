import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import multer from "multer";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";

import { createRequire } from "module";
const require = createRequire(import.meta.url);

//  Import pdf-parse (CommonJS module)
const pdfParse = require("pdf-parse");

import initDB from "./db.js"; // make sure db.js also uses ESM exports
import authRoutesFactory from "./authRoutes.js";

const __dirname = path.resolve(); // ESM replacement for __dirname
const app = express();
const PORT = 4000;

// ------------------- Middlewares -------------------
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ------------------- Multer Setup -------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

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

// ------------------- Initialize DB -------------------
let db;

// ------------------- Start Server -------------------
const startServer = async () => {
  try {
    db = await initDB();

    const authRoutes = authRoutesFactory(db);
    app.use("/api/auth", authRoutes);

    app.get("/", (req, res) => res.send(" Auth backend is running..."));

    // ---------- All Registrations ----------
    app.get("/allRegistrations", async (req, res) => {
      try {
        const allUsers = await db.all("SELECT * FROM user");
        res.status(200).json(allUsers);
      } catch (err) {
        console.error(" Error retrieving users:", err);
        res.status(500).send("Error retrieving users");
      }
    });

    // ---------- TODOS ----------
    app.get("/api/todos/:email", async (req, res) => {
      const email = decodeURIComponent(req.params.email);
      console.log(" GET todos request for:", email);
      try {
        const user = await db.get("SELECT todos FROM user WHERE email = ?", [
          email,
        ]);
        if (!user) return res.status(404).json({ error: "User not found" });

        let todos = [];
        try {
          todos = user.todos ? JSON.parse(user.todos) : [];
        } catch {
          todos = [];
        }

        res.json({ todos });
      } catch (err) {
        console.error(" Error fetching todos:", err);
        res.status(500).json({ error: "Error fetching todos" });
      }
    });

    app.post("/api/todos/:email", async (req, res) => {
      const email = decodeURIComponent(req.params.email);
      const { task } = req.body;
      console.log(" Add todo request:", email, task);

      try {
        const user = await db.get("SELECT todos FROM user WHERE email = ?", [
          email,
        ]);
        if (!user) return res.status(404).send("User not found");

        let todos = [];
        try {
          todos = user.todos ? JSON.parse(user.todos) : [];
        } catch {
          todos = [];
        }

        todos.push(task);
        await db.run("UPDATE user SET todos = ? WHERE email = ?", [
          JSON.stringify(todos),
          email,
        ]);

        res.json(todos);
      } catch (err) {
        console.error(" Error updating todos:", err);
        res.status(500).send("Error updating todos");
      }
    });

    // ---------- User Info ----------
    app.get("/api/userinfo/:email", async (req, res) => {
      const email = decodeURIComponent(req.params.email);
      try {
        const user = await db.get("SELECT * FROM user WHERE email = ?", [
          email,
        ]);
        if (!user) return res.status(404).send("User not found");

        res.json({
          nameInfo: user.name || "",
          emailInfo: user.email || "",
          locationInfo: user.location || "",
          profileImage: user.profileImage || "",
          profileVideo: user.profileVideo || "",
        });
      } catch (err) {
        console.error(" Error fetching user info:", err);
        res.status(500).send("Error fetching user info");
      }
    });

    // ---------- Document Summary ----------

    app.get("/document-summary", async (req, res) => {
      // ensure you get the function
      try {
        const { filePath } = req.query;
        if (!filePath)
          return res
            .status(400)
            .json({ error: "filePath query param required" });

        const actualPath = path.join(__dirname, filePath);

        if (!fs.existsSync(actualPath)) {
          return res.status(404).json({ error: "File not found" });
        }

        const dataBuffer = fs.readFileSync(actualPath);
        const data = await pdfParse(dataBuffer);

        console.log(" Extracted Text:", data.text);

        const response = await axios.post(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyBE9xbENPJURmat3usnhN8TNeGvioRSQeY",
          {
            contents: [
              {
                parts: [
                  {
                    text: `Summarize the following resume in short points and highlight between ** **:\n${data.text} and alos hightlight key points with blue color`,
                  },
                ],
              },
            ],
          }
        );

        const summary = response.data.candidates[0].content.parts[0].text;
        const finalSummary = summary;
        console.log("\n Summary:\n", summary);

        res.json({ extractedSummary: finalSummary });
      } catch (err) {
        console.error(" Error processing PDF:", err);
        res.status(500).json({ error: err.message });
      }
    });

    app.listen(PORT, () => {
      console.log(` Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error(" Failed to start server:", err);
  }
};

startServer();
