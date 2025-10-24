import React, { useEffect, useState } from "react";
import "./uploadDocuments.css";
import { ClipLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { IoCloudUpload } from "react-icons/io5"; // ✅ Make sure you have react-icons installed
import { PiLampPendantFill } from "react-icons/pi";
import { FaStar } from "react-icons/fa";
import Header from "../header/header";

const UploadDocuments = () => {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [files, setFiles] = useState([]);
  const [documentName, setDocumentName] = useState("");
  const [uploading, setUploading] = useState(false);
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

    const formData = new FormData();
    formData.append("document", files[0]);
    formData.append("documentName", documentName);

    try {
      const res = await axios.post(
        `${BASE_URL}/api/auth/upload-document/${encodeURIComponent(userEmail)}`, // email in URL
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setFiles([]);
      setDocumentName("");
      navigate("/home"); // redirect after upload
    } catch (err) {
      console.error("❌ Upload failed:", err);
      alert("Failed to upload document. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const uploader = () => {
    setUploading(true);
    setTimeout(() => {
      uploadDocument();
    }, 7000);
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
            {uploading && documentName && files ? (
              <div className="star-container">
                <FaStar className="star" />
                <div className="star-div"></div>

                <div className="star-div"></div>
                <div className="star-div"></div>
                <div className="star-div"></div>
                <div className="star-div"></div>
              </div>
            ) : (
              <img
                src="https://assets.ccbp.in/frontend/react-js/nxt-watch-no-saved-videos-img.png"
                alt="img"
                className="document-upload-image"
                style={{ backgroundColor: "transparent" }}
              />
            )}
          </div>
        </div>
        <div>
          <div
            className="uploading-container"
            draggable="true"
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
              name="document"
              onChange={(e) => setFiles([...e.target.files])}
              className="upload-inputs"
              placeholder="Enter document name..."
              required
            />

            {uploading && documentName && files ? (
              <button onClick={uploader} className="glow-btn2">
                <IoCloudUpload className="i" />
                Uploading
              </button>
            ) : (
              <button onClick={uploader} className="glow-btn">
                <IoCloudUpload className="i" />
                Upload
              </button>
            )}
            <div className="dash-container">
              <div className="line"></div>
              <p className="or-text">OR</p>
              <div className="line"></div>
            </div>

            <button className="glow-btn">
              <IoCloudUpload className="i" />
              Drag and Drop
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UploadDocuments;
