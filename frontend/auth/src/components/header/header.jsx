import React from "react";
import axios from "axios";
import "./header.css";
import { useNavigate } from "react-router-dom";
const BASE_URL = "http://localhost:4000";

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
        <div>
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
      </div>
      <hr className="header-hr" />
    </>
  );
};

export default Header;
