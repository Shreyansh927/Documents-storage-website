import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { IoCloudUpload } from "react-icons/io5";
import { PiLampPendantFill } from "react-icons/pi";
import { FaStar } from "react-icons/fa";
import Header from "../header/header";
import "./uploadDocuments.css";

const UploadDocuments = () => {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [files, setFiles] = useState([]);
  const [documentName, setDocumentName] = useState("");
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const BASE_URL = "https://documents-storage-website-backend-2.onrender.com";

  useEffect(() => {
    setUserName(localStorage.getItem("userName") || "Guest");
    setUserEmail(localStorage.getItem("userEmail") || "");
  }, []);

  const uploadDocument = async () => {
    if (!files.length || !documentName.trim()) {
      alert("Please provide a document name and select a file.");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("email", userEmail);
    formData.append("document", files[0]);
    formData.append("documentName", documentName);

    try {
      await axios.post(`${BASE_URL}/api/auth/upload-document`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFiles([]);
      setDocumentName("");
      setUploading(false);
      navigate("/home");
    } catch (err) {
      console.error("❌ Upload failed:", err);
      alert("Failed to upload document. Please try again.");
      setUploading(false);
    }
  };

  const uploader = () => {
    setUploading(true);
    setTimeout(() => uploadDocument(), 500);
  };

  return (
    <>
      <Header />
      <div className="main-uploading-container">
        <div className="uploading-image-container">
          <div className={uploading ? "active-lamp" : "lamp"}>
            <PiLampPendantFill />
          </div>
          {!uploading && (
            <img
              src="https://assets.ccbp.in/frontend/react-js/nxt-watch-no-saved-videos-img.png"
              alt="Upload"
              className="document-upload-image"
            />
          )}
        </div>
        <div className="uploading-container">
          <input
            type="text"
            value={documentName}
            placeholder="Enter document name..."
            onChange={(e) => setDocumentName(e.target.value)}
            className="upload-inputs"
          />
          <input
            type="file"
            onChange={(e) => setFiles([...e.target.files])}
            className="upload-inputs"
          />
          <button
            onClick={uploader}
            className={uploading ? "glow-btn2" : "glow-btn"}
          >
            <IoCloudUpload /> {uploading ? "Uploading" : "Upload"}
          </button>
        </div>
      </div>
    </>
  );
};

export default UploadDocuments;
