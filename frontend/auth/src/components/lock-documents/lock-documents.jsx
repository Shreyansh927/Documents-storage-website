import React, { useState, useEffect } from "react";
import "./lock-documents.css";
import axios from "axios";
import CryptoJS from "crypto-js";
import { useParams } from "react-router-dom";
import { IoIosLock } from "react-icons/io";

const LockDocuments = () => {
  const { fileName } = useParams();
  const [currentUser, setCurrentUser] = useState("");
  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    setCurrentUser(email || "Guest");
  }, []);

  const [password, setPassword] = useState(
    JSON.parse(localStorage.getItem("documentPassword")) || ""
  );

  const lockTheDocument = async () => {
    try {
      const response = await axios.post(
        "https://documents-storage-website-backend-2.onrender.com/api/auth/set-document-password",
        {
          // Body data
          lock: password,
        },
        {
          // Query parameters
          params: {
            email: currentUser, // e.g., "i@gmail.com"
            documentName: fileName,
          },
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      alert(response.data.message || "Document locked successfully");
    } catch (error) {
      console.error("Error locking document:", error);
      if (error.response) {
        alert(error.response.data.message || "Failed to lock the document");
      } else {
        alert("Network error. Please try again.");
      }
    }
  };

  return (
    <>
      <div className="main-signup-container">
        <div className="document-lock-image-container">
          <source
            src="https://www.shutterstock.com/shutterstock/videos/3737157849/preview/stock-footage-cyber-security-animated-illustration-icon-video.mp4"
            type="video/mp4"
          ></source>
          <img
            src="https://img.freepik.com/free-vector/security-access-card-abstract-concept-illustration_335657-3719.jpg?t=st=1761163181~exp=1761166781~hmac=31bc396ac001f0c225bc16adeefdc41b1aa345c99cb1274cc5dad330a005955d&w=1480"
            alt="lock"
            className="lock-jpg"
          />
        </div>
        <div className="document-lock-password-container">
          <div className="lock-icon-container">
            <IoIosLock className="lock-icon" />
          </div>
          <h3>Save your Documents...</h3>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="document password..."
            className="doc-lock"
          />
          <p>Document name: {fileName}</p>
          <p>Current User: {currentUser}</p>

          <button className="glow-btn" onClick={lockTheDocument}>
            Set Lock
          </button>
        </div>
      </div>
    </>
  );
};

export default LockDocuments;
