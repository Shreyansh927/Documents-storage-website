// index.js
import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// ✅ Import pdf-parse (CommonJS module)
const pdfParse = require("pdf-parse");

// Path to your PDF file
const filePath = "nxt wave resume.pdf";

async function extractTextFromPDF() {
  try {
    console.log("📘 Reading PDF...");
    const pdfBuffer = fs.readFileSync(filePath);

    // ✅ Extract text using pdf-parse
    const parsed = await pdfParse(pdfBuffer);
    const text = parsed.text.trim();

    if (!text) {
      console.log("⚠ No text extracted from PDF!");
    } else {
      console.log("✅ Text Extracted Successfully!");
      console.log(text.slice(0, 500), "...\n"); // preview first 500 chars
    }

    // Optional: Save to file
    fs.writeFileSync("extracted_text.txt", text);
    console.log("💾 Saved extracted text to extracted_text.txt");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

extractTextFromPDF();
