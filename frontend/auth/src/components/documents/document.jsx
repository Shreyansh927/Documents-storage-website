import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";
import imageCompression from "browser-image-compression";
import { PiLockKeyFill } from "react-icons/pi";
import { SiGooglegemini } from "react-icons/si";
import { MdDelete } from "react-icons/md";
import { IoMdDownload } from "react-icons/io";
import "./document.css";

const Document = () => {
  const { encryptedLink, cryptoSecretKey, documentName } = useParams();
  const BASE_URL = "https://documents-storage-website-backend-2.onrender.com"; // local server
  const navigate = useNavigate();

  const [fileUrl, setFileUrl] = useState("");
  const [compressedUrl, setCompressedUrl] = useState("");
  const [enhancedUrl, setEnhancedUrl] = useState("");
  const [displayWidth, setDisplayWidth] = useState(50000);
  const [originalFileSize, setOriginalFileSize] = useState(null);
  const [compressedFileSize, setCompressedFileSize] = useState(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [extractedText, setExtractedText] = useState("");

  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // 🔐 Decrypt the file link
  useEffect(() => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedLink, cryptoSecretKey);
      const decryptedLink = bytes.toString(CryptoJS.enc.Utf8);
      const url = `${BASE_URL}/${decryptedLink}`;
      setFileUrl(url);
    } catch (err) {
      console.error("Error decrypting link:", err);
    }
  }, [encryptedLink, cryptoSecretKey]);

  // 🧮 Calculate file size
  const calculateFileSize = async (url) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      setOriginalFileSize(blob.size);
      return blob;
    } catch (err) {
      console.error("Error calculating file size:", err);
    }
  };

  // ⚡ Compress image
  useEffect(() => {
    if (!fileUrl) return;

    let prevUrl;

    const compressImage = async () => {
      try {
        const blob = await calculateFileSize(fileUrl);
        if (!blob || !blob.type.startsWith("image")) return;

        const file = new File([blob], "image", { type: blob.type });

        const options = {
          maxSizeMB: 6,
          maxWidthOrHeight: displayWidth,
          useWebWorker: true,
        };

        const compressedFile = await imageCompression(file, options);
        const compressedBlobUrl = URL.createObjectURL(compressedFile);

        if (prevUrl) URL.revokeObjectURL(prevUrl);
        prevUrl = compressedBlobUrl;

        setCompressedUrl(compressedBlobUrl);
        setCompressedFileSize(compressedFile.size);
      } catch (err) {
        console.error("Compression error:", err);
      }
    };

    compressImage();
  }, [fileUrl, displayWidth]);

  // 📥 Download
  const handleDownload = async () => {
    try {
      const res = await fetch(enhancedUrl || compressedUrl || fileUrl);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = documentName || "document";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  // 🗑 Delete
  const handleDelete = async () => {
    try {
      const email = localStorage.getItem("userEmail");
      if (!email) return alert("User not logged in");

      const relativePath = fileUrl.replace(BASE_URL, "");
      const apiUrl = `https://documents-storage-website-backend-2.onrender.com/api/auth/check-auth?deleteFilePath=${encodeURIComponent(
        relativePath
      )}&email=${encodeURIComponent(email)}`;

      const res = await fetch(apiUrl, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ File deleted successfully!");
        navigate("/home");
      } else {
        alert("⚠️ Error deleting file");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting file");
    }
  };

  // 🧾 Fetch document summary
  const fetchSummary = async () => {
    const relativePath = fileUrl.replace(BASE_URL, "");
    setIsSummaryLoading(true);
    try {
      const res = await fetch(
        `https://documents-storage-website-backend-2.onrender.com/document-summary?filePath=${encodeURIComponent(
          relativePath
        )}`
      );
      const data = await res.json();
      setExtractedText(data.extractedSummary || "No summary available.");
      setIsSummaryLoading(false);
    } catch (err) {
      console.error("Summary error:", err);
    }
  };

  const action = () => {
    if (!extractedText) {
      fetchSummary();
    } else {
      setExtractedText("");
    }
  };

  const documentLock = () => navigate(`/lock-documents/${documentName}`);

  const formatBytes = (bytes) =>
    bytes ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` : "Unknown";

  const isPdf = fileUrl.endsWith(".pdf");
  const isVideo = fileUrl.endsWith(".mp4") || fileUrl.endsWith(".mkv");
  const isImage = fileUrl.match(/\.(jpg|jpeg|png|gif)$/i);

  if (!fileUrl) return <p>Loading document...</p>;

  return (
    <div
      className={
        extractedText
          ? "searching-time-main-document-container"
          : "main-document-container"
      }
      style={{ textAlign: "center", fontFamily: "Poppins" }}
      role="button"
      onClick={() => {
        setExtractedText("");
      }}
    >
      {isPdf ? (
        <iframe
          src={fileUrl}
          allowFullScreen
          style={{ height: "100vh", width: "100vw", border: "1px solid #ccc" }}
        />
      ) : isVideo ? (
        <video
          src={fileUrl}
          controls
          style={{
            height: "100vh",
            width: "100vw",
            borderRadius: "10px",
            background: "#000",
          }}
        >
          Your browser does not support the video tag.
        </video>
      ) : isImage ? (
        <>
          <img
            src={enhancedUrl || compressedUrl || fileUrl}
            alt="Enhanced Document"
            style={{
              borderRadius: "10px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              objectFit: "cover",
              transition: "all 0.4s ease-in-out",
            }}
            className="document-image"
          />
          <div style={{ marginTop: "1rem" }}>
            <label>
              Adjust Width:
              <input
                type="range"
                min="100"
                max="16000"
                value={displayWidth}
                onChange={(e) => setDisplayWidth(e.target.value)}
                style={{ margin: "0 10px" }}
              />
              {displayWidth}px
            </label>
          </div>

          {isEnhancing && (
            <p style={{ color: "#ff4d4d", fontWeight: "bold" }}>
              🔄 AI Enhancement in progress...
            </p>
          )}

          <p style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
            Original: {formatBytes(originalFileSize)} | Compressed:{" "}
            {formatBytes(compressedFileSize)}
          </p>
        </>
      ) : (
        <p>Unsupported file type</p>
      )}

      <div className="buttons-container" style={{ marginTop: "20px" }}>
        <button
          style={{ fontFamily: "poppins" }}
          className="download-button"
          onClick={handleDownload}
        >
          <IoMdDownload />
        </button>
        <button
          style={{ fontFamily: "poppins" }}
          className="delete-button"
          onClick={handleDelete}
        >
          <MdDelete />
        </button>
        {isPdf && (
          <button
            style={{ fontFamily: "poppins" }}
            className={
              isSummaryLoading ? "searching-summary-button" : "summary-button"
            }
            onClick={() => action()}
          >
            <SiGooglegemini />
          </button>
        )}

        <button
          style={{ fontFamily: "poppins" }}
          className="lock-button"
          onClick={documentLock}
        >
          <PiLockKeyFill />
        </button>
      </div>
      <p>{fileUrl}</p>
      <div
        className={
          extractedText ? "visible-summary-container" : "summary-container"
        }
      >
        {extractedText && (
          <>
            {extractedText.split("*").map((PointerEvent, index) => (
              <li key={index}>{PointerEvent}</li>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default Document;
