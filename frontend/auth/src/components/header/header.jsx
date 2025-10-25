import React from "react";
import axios from "axios";
import "./header.css";
import { IoLogOutSharp } from "react-icons/io5";
import { FaUserEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
const BASE_URL = "https://documents-storage-website-backend-2.onrender.com";

const Header = () => {
  const navigate = useNavigate();
  const logout = async () => {
    try {
      const { data } = await axios.post(
        `${BASE_URL}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
      if (data.result) navigate("/login");
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <>
      <div className="header-container">
        <h1>Header</h1>
        <div className="links">
          <button className="logout-button" onClick={logout}>
            Logout
          </button>
          <button
            className="edit-button"
            onClick={() => navigate("/edit-profile")}
          >
            Edit Profile
          </button>
        </div>
        <div className="sm-links">
          <button className="sm-logout-button" onClick={logout}>
            <IoLogOutSharp />
          </button>
          <button
            className="sm-edit-button"
            onClick={() => navigate("/edit-profile")}
          >
            <FaUserEdit />
          </button>
        </div>
      </div>
      <hr className="header-hr" />
    </>
  );
};

export default Header;
