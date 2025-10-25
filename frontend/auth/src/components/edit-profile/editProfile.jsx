import React, { useState, useEffect } from "react";

import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../header/header";

const EditProfile = () => {
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [profileVideo, setProfileVideo] = useState(null);
  const [profilePDF, setProfilePDF] = useState(null); //  new PDF state

  const navigate = useNavigate();

  useEffect(() => {
    const latestUserEmail = localStorage.getItem("userEmail");
    if (latestUserEmail) {
      setEmail(latestUserEmail);
      fetchUserInfo(latestUserEmail);
    }
  }, []);

  const fetchUserInfo = async (email) => {
    const encodedEmail = encodeURIComponent(email);
    try {
      const { data } = await axios.get(
        `https://documents-storage-website-backend-2.onrender.com/api/userinfo/${encodedEmail}`
      );
      const {
        nameInfo,
        locationInfo,
        emailInfo,
        profileImage,
        profileVideo,
        profilePDF,
      } = data;
      setEmail(emailInfo);
      setLocation(locationInfo);
      setUserName(nameInfo);
      setProfileImage(profileImage);
      setProfileVideo(profileVideo);
      setProfilePDF(profilePDF); // set PDF if available
    } catch (err) {
      console.log(" Error fetching user info:", err);
    }
  };

  const editProfile = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("location", location);

      if (profileImage && typeof profileImage !== "string") {
        formData.append("profileImage", profileImage);
      }
      if (profileVideo && typeof profileVideo !== "string") {
        formData.append("profileVideo", profileVideo);
      }
      if (profilePDF && typeof profilePDF !== "string") {
        formData.append("profilePDF", profilePDF); //  append PDF if picked
      }

      const { data } = await axios.put(
        "https://documents-storage-website-backend-2.onrender.com/api/auth/edit-profile",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (data.success) {
        alert("Edited successfully");
        navigate("/home");
      } else {
        alert("Editing error");
      }
    } catch (err) {
      console.log("Error editing profile:", err);
    } finally {
      navigate("/home");
    }
  };

  const edit = () => {
    setTimeout(() => {
      navigate("/home");
    }, 2000);
  };

  return (
    <>
      <Header />
      <div>
        <h1>Edit Profile</h1>
        <form onSubmit={editProfile}>
          <label>Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label>Profile Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProfileImage(e.target.files[0])}
          />
          {profileImage && (
            <img
              src={
                typeof profileImage === "string"
                  ? `https://documents-storage-website-backend-2.onrender.com${profileImage}`
                  : URL.createObjectURL(profileImage)
              }
              alt="Profile Preview"
              style={{
                width: "400px",
                height: "200px",
                borderRadius: "10%",
                objectFit: "cover",
                marginTop: "40px",
              }}
            />
          )}
          <label>Profile Video</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setProfileVideo(e.target.files[0])}
          />
          {profileVideo && (
            <video
              width="400"
              height="200"
              controls
              style={{ borderRadius: "10px", marginTop: "20px" }}
            >
              <source
                src={
                  typeof profileVideo === "string"
                    ? `http://localhost:4000${profileVideo}`
                    : URL.createObjectURL(profileVideo)
                }
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
          )}
          <label>Profile PDF</label>
          <label>Profile PDF</label>
          <label>Profile PDF</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setProfilePDF(e.target.files[0])}
          />
          {profilePDF && (
            <p style={{ marginTop: "20px" }}>
              <a
                href={
                  typeof profilePDF === "string"
                    ? `http://localhost:4000${profilePDF}`
                    : URL.createObjectURL(profilePDF)
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                {typeof profilePDF === "string"
                  ? profilePDF.split("/").pop()
                  : profilePDF.name}
              </a>
            </p>
          )}
          <button onClick={edit} type="submit">
            Edit
          </button>
        </form>
      </div>
    </>
  );
};

export default EditProfile;
