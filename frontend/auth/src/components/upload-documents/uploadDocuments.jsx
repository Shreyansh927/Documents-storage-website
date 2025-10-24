import React, { useEffect, useState } from "react";
import "./uploadDocuments.css";
import { ClipLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { IoCloudUpload } from "react-icons/io5";
import { PiLampPendantFill } from "react-icons/pi";
import { FaStar } from "react-icons/fa";
import Header from "../header/header";

const UploadDocuments = () => {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [files, setFiles] = useState([]);
  const [documentName, setDocumentName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const BASE_URL = "https://documents-storage-website-backend-2.onrender.com";

  useEffect(() => {
    const name = localStorage.getItem("userName");
    const email = localStorage.getItem("userEmail");
    setUserName(name || "Guest");
    setUserEmail(email || "");
  }, []);

  const uploadDocument = async () => {
    if (!files.length || !documentName.trim()) {
      alert("Please provide a document name and select a file.");
      return;
    }

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("document", files[0]);
    formData.append("documentName", documentName);

    try {
      const res = await axios.post(
        `${BASE_URL}/api/auth/upload-document/${encodeURIComponent(userEmail)}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percent);
          },
        }
      );

      if (res.data.success) {
        alert("Document uploaded successfully!");
        setFiles([]);
        setDocumentName("");
        navigate("/home");
      } else {
        alert("Upload failed, please try again.");
      }
    } catch (err) {
      console.error("❌ Upload failed:", err);
      alert("Failed to upload document. Please try again.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <>
      <Header />
      <div className="main-uploading-container">
        <div className="uploading-image-container">
          <div className={uploading ? "active-lamp" : "lamp"}>
            <PiLampPendantFill />
          </div>
          <div>
            {uploading && files.length ? (
              <div className="star-container">
                <FaStar className="star" />
                <div className="star-div"></div>
                <div className="star-div"></div>
                <div className="star-div"></div>
                <div className="star-div"></div>
              </div>
            ) : (
              <img
                src="https://assets.ccbp.in/frontend/react-js/nxt-watch-no-saved-videos-img.png"
                alt="document"
                className="document-upload-image"
                style={{ backgroundColor: "transparent" }}
              />
            )}
          </div>
        </div>

        <div
          className="uploading-container"
          style={{ padding: "20px", fontFamily: "Poppins" }}
        >
          <div className="cool-button-container">
            <div className="cool-button">
              <IoCloudUpload className="cloud-icon" />
            </div>
          </div>

          <input
            type="text"
            value={documentName}
            placeholder="Enter document name..."
            onChange={(e) => setDocumentName(e.target.value)}
            className="upload-inputs"
            required
          />

          <input
            type="file"
            onChange={(e) => setFiles([...e.target.files])}
            className="upload-inputs"
            required
          />

          <button
            onClick={uploadDocument}
            className={uploading ? "glow-btn2" : "glow-btn"}
            disabled={uploading}
          >
            <IoCloudUpload className="i" />
            {uploading ? `Uploading (${progress}%)` : "Upload"}
          </button>

          {uploading && <ClipLoader size={25} color="#36d7b7" />}
        </div>
      </div>
    </>
  );
};

export default UploadDocuments;
