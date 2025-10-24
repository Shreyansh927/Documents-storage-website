import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";
import "./document.css";
import { IoMdDownload } from "react-icons/io";
import { MdDelete } from "react-icons/md";

const Document = () => {
  const { encryptedLink, cryptoSecretKey, documentName } = useParams();
  const BASE_URL = "https://documents-storage-website-backend-2.onrender.com";
  const navigate = useNavigate();

  const [fileUrl, setFileUrl] = useState("");

  useEffect(() => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedLink, cryptoSecretKey);
      const decryptedLink = bytes.toString(CryptoJS.enc.Utf8);
      setFileUrl(decryptedLink); // Already a full URL from backend
    } catch (err) {
      console.error("Error decrypting link:", err);
    }
  }, [encryptedLink, cryptoSecretKey]);

  const handleDownload = async () => {
    try {
      const res = await fetch(fileUrl);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = documentName || "document";
      link.click();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    const email = localStorage.getItem("userEmail");
    if (!email) return alert("User not logged in");

    const apiUrl = `${BASE_URL}/api/auth/check-auth?deleteFilePath=${encodeURIComponent(
      fileUrl
    )}&email=${encodeURIComponent(email)}`;

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("File deleted successfully!");
        navigate("/home");
      } else alert("Error deleting file");
    } catch (err) {
      console.error(err);
    }
  };

  if (!fileUrl) return <p>Loading document...</p>;

  const isPdf = fileUrl.endsWith(".pdf");
  const isVideo = fileUrl.endsWith(".mp4") || fileUrl.endsWith(".mkv");
  const isImage = fileUrl.match(/\.(jpg|jpeg|png|gif)$/i);

  return (
    <div className="main-document-container">
      {isPdf || isVideo ? (
        <iframe
          src={fileUrl}
          allowFullScreen
          style={{ width: "100%", height: "90vh" }}
        />
      ) : isImage ? (
        <img
          src={fileUrl}
          alt="Document"
          style={{ width: "80%", borderRadius: "10px" }}
        />
      ) : (
        <p>Unsupported file type</p>
      )}

      <div className="buttons-container">
        <button onClick={handleDownload}>
          <IoMdDownload />
        </button>
        <button onClick={handleDelete}>
          <MdDelete />
        </button>
      </div>
    </div>
  );
};

export default Document;
