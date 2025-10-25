import React, { useEffect, useState } from "react";
import { MdPictureAsPdf } from "react-icons/md";
import "./home.css";
import Analytics from "../analytics/analytics";
import { BiSolidFilePng } from "react-icons/bi";
import { BsFiletypeMp4 } from "react-icons/bs";
import { IoCloudUpload } from "react-icons/io5";
import { IoIosLock } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CryptoJS from "crypto-js";
import Header from "../header/header";

const BASE_URL = "https://documents-storage-website-backend-2.onrender.com";

const Home = () => {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loadAllUsers, setLoadAllUsers] = useState(false);
  const [allUser, SetAllUsers] = useState([]);
  const [cryptoSecretKey, setCryptoSecretKey] = useState("");
  const [documents, setDocuments] = useState([]);
  const [originalDocuments, setOriginalDocuments] = useState([]);
  const [profilePhoto, setProfilePhoto] = useState("");
  const [input, setInput] = useState("");
  const navigate = useNavigate();
  const SECRET_KEY = "mySuperSecretKey123";

  useEffect(() => {
    const name = localStorage.getItem("userName");
    const email = localStorage.getItem("userEmail");
    setUserName(name || "Guest");
    setUserEmail(email || "");
    if (email) {
      fetchDocuments(email);
      fetchUserInfo(email);
    }
    fetchAllUsers();
  }, []);

  useEffect(() => {
    const searchedItem = originalDocuments.filter((each) =>
      each.documentName.toLowerCase().includes(input.toLowerCase())
    );
    setDocuments(searchedItem);
  }, [input]);

  const fetchAllUsers = async () => {
    try {
      setLoadAllUsers(true);
      const res = await axios.get(`${BASE_URL}/allRegistrations`);
      const users = res.data.map((each) => ({
        name: each.name,
        id: each.id,
        img: each.profileImage,
      }));
      SetAllUsers(users);
    } catch {
      console.log("error fetching users");
    } finally {
      setLoadAllUsers(false);
    }
  };

  const fetchDocuments = async (email) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/auth/get-documents/${encodeURIComponent(email)}`
      );
      const cryptoKey = res.data.cryptoSecretKey;
      setCryptoSecretKey(cryptoKey);
      const allDocuments = res.data.documents.map((each) => ({
        documentName: CryptoJS.AES.decrypt(
          each.documentName,
          res.data.cryptoSecretKey
        ).toString(CryptoJS.enc.Utf8),
        link: CryptoJS.AES.decrypt(
          each.link,
          res.data.cryptoSecretKey
        ).toString(CryptoJS.enc.Utf8),
      }));
      setDocuments(allDocuments || []);
      setOriginalDocuments(allDocuments || []);
    } catch (err) {
      console.error(err);
    }
  };

  const sortPdf = () => {
    const onlyPdfs = originalDocuments.filter((each) =>
      each.link.endsWith(".pdf")
    );
    setDocuments(onlyPdfs);
  };

  const sortVideos = () => {
    const onlyVideos = originalDocuments.filter((each) =>
      each.link.endsWith(".mp4")
    );
    setDocuments(onlyVideos);
  };

  const sortImages = () => {
    const onlyImages = originalDocuments.filter(
      (each) =>
        each.link.endsWith(".png") ||
        each.link.endsWith(".jpg") ||
        each.link.endsWith(".jpeg")
    );
    setDocuments(onlyImages);
  };

  const fetchUserInfo = async (email) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/userinfo/${encodeURIComponent(email)}`
      );
      setProfilePhoto(res.data.profileImage);
    } catch (err) {
      console.error(" Error fetching user info:", err);
    }
  };

  return (
    <>
      <div className="c">
        <Header />
      </div>
      <div className="cc">
        <div style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h1 className="welcome-message">Welcome, {userName}!</h1>
            <img src={profilePhoto} alt="profile-photo" />
          </div>
          <hr className="header-hr" />
          <div className="search-and-category-conatiner">
            <div className="search-box-container">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search your saved pdf, image or video..."
                className="search-box"
              />
            </div>
            <hr />
            <div className="category-container">
              <div className="category-button-container">
                <button className="category-button" onClick={() => sortPdf()}>
                  PDF
                </button>
                <button
                  className="category-button"
                  onClick={() => sortImages()}
                >
                  Images
                </button>
                <button
                  className="category-button"
                  onClick={() => sortVideos()}
                >
                  Videos
                </button>
              </div>
            </div>
          </div>

          <hr className="header-hr" />

          <h2>Your Documents:</h2>
          <ul className="all-documents" style={{ marginBottom: "50px" }}>
            {documents.length === 0 ? (
              <p>No documents uploaded yet.</p>
            ) : (
              documents.map((doc, idx) => (
                <li key={idx}>
                  {doc.link.endsWith(".pdf") ? (
                    <div
                      className="documen-card"
                      onClick={() => {
                        const encryptedLink = CryptoJS.AES.encrypt(
                          doc.link,
                          cryptoSecretKey
                        ).toString();

                        if (!doc.documentLock) {
                          // Navigate to verify password page
                          navigate(
                            `/document/${encodeURIComponent(
                              encryptedLink
                            )}/${encodeURIComponent(
                              cryptoSecretKey
                            )}/${encodeURIComponent(doc.documentName)}`
                          );
                        } else {
                          // Navigate directly to the document page
                          navigate("/verify-document-password");
                        }
                      }}
                    >
                      <div className="demo-image-card-container">
                        <iframe
                          src={`${BASE_URL}/${doc.link}`}
                          className="demo-image"
                          controls
                        />

                        <div className="demo-image-card-info">
                          <div className="padd">
                            <MdPictureAsPdf className="folder-icon" />
                          </div>
                          <div className="padd">
                            <p className="p">{doc.documentName}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {doc.link.endsWith(".jpg") ||
                      doc.link.endsWith(".png") ||
                      doc.link.endsWith(".jpeg") ||
                      doc.link.endsWith(".gif") ? (
                        <div
                          className="documen-card"
                          onClick={() => {
                            const encryptedLink = CryptoJS.AES.encrypt(
                              doc.link,
                              cryptoSecretKey
                            ).toString();

                            if (!doc.documentLock) {
                              // Navigate to verify password page
                              navigate(
                                `/document/${encodeURIComponent(
                                  encryptedLink
                                )}/${encodeURIComponent(
                                  cryptoSecretKey
                                )}/${encodeURIComponent(doc.documentName)}`
                              );
                            } else {
                              // Navigate directly to the document page

                              navigate("/verify-document-password");
                            }
                          }}
                        >
                          <div className="demo-image-card-container">
                            <img
                              src={`${BASE_URL}/${doc.link}`}
                              className="demo-image"
                              alt="img"
                            />
                            <div className="demo-image-card-info">
                              <div className="padd">
                                <BiSolidFilePng className="folder-icon" />
                              </div>
                              <div className="padd">
                                <p className="p">{doc.documentName}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="documen-card"
                          onClick={() => {
                            const encryptedLink = CryptoJS.AES.encrypt(
                              doc.link,
                              cryptoSecretKey
                            ).toString();

                            navigate(
                              `/document/${encodeURIComponent(
                                encryptedLink
                              )}/${encodeURIComponent(
                                cryptoSecretKey
                              )}/${encodeURIComponent(doc.documentName)}`
                            );
                          }}
                        >
                          <div className="demo-image-card-container">
                            <video
                              src={`${BASE_URL}/${doc.link}`}
                              controls
                              className="demo-image"
                            >
                              Your browser does not support the video tag.
                            </video>

                            <div className="demo-image-card-info">
                              <div className="padd">
                                <BsFiletypeMp4 className="folder-icon" />
                              </div>
                              <div className="padd">
                                <p className="p">{doc.documentName}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>

          <hr className="header-hr" />

          <h1>Other Users</h1>
          {loadAllUsers ? (
            <p>Loading...</p>
          ) : (
            <ul className="all-documents">
              {allUser.map((each) => (
                <li
                  className="document-card"
                  key={each.id}
                  style={{ marginBottom: "20px" }}
                >
                  {each.img ? (
                    <img
                      src={`${BASE_URL}${each.img}`}
                      alt={each.name}
                      classNames="folder-icon"
                      style={{
                        width: "50px",
                        height: "50px",
                        objectFit: "cover",
                        borderRadius: "40px",
                        marginRight: "20px",
                      }}
                    />
                  ) : (
                    <img
                      src="https://i.pinimg.com/736x/15/0f/a8/150fa8800b0a0d5633abc1d1c4db3d87.jpg"
                      alt={each.name}
                      classNames="folder-icon"
                      style={{
                        width: "50px",
                        height: "50px",
                        objectFit: "cover",
                        borderRadius: "40px",
                        marginRight: "20px",
                      }}
                    />
                  )}
                  <p>{each.name}</p>
                </li>
              ))}
            </ul>
          )}
          <div
            className="upload-section"
            onClick={() => navigate("/upload-documents")}
          >
            <IoCloudUpload className="upload-icon" />
          </div>
          <Analytics />
        </div>
      </div>
    </>
  );
};

export default Home;
