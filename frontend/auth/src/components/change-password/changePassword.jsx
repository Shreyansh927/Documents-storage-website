import React, { useState } from "react";
import "./changePassword.css";
import axios from "axios";
import screenShot from "../../assets/signup2.png";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const ChangePassword = () => {
  const [userEmail, setUserEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const changePassword = async (e) => {
    e.preventDefault();

    try {
      const result = await axios.put(
        "http://localhost:4000/api/auth/change-password",
        { email: userEmail, newPassword }
      );
      alert(result.data); // now consistent
      window.location.href = "/login";
    } catch (error) {
      alert(error.response?.data?.message || "Something went wrong");
      console.log(error.message);
    }
  };

  const sliderSettings = {
    dots: true,

    speed: 800,
    slidesToShow: 1,

    infinite: true,
    autoplaySpeed: 3500,
    pauseOnHover: true,
    arrows: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 3, slidesToScroll: 2 },
      },
      {
        breakpoint: 900,
        settings: { slidesToShow: 2, slidesToScroll: 2 },
      },
      {
        breakpoint: 600,
        settings: { slidesToShow: 1, slidesToScroll: 1 },
      },
      {
        breakpoint: 400,
        settings: { slidesToShow: 1, slidesToScroll: 1 },
      },
    ],
  };

  return (
    <div className="main-signup-container">
      <div className="image-section">
        <Slider {...sliderSettings}>
          <img src={screenShot} alt="sign-up" className="signup-image" />
          <img src={screenShot} alt="sign-up" className="signup-image" />
          <img src={screenShot} alt="sign-up1" className="signup-image" />
          <img src={screenShot} alt="sign-up2" className="signup-image" />

          <iframe
            src="https://2embed.cc/embed/tt1345836"
            controls
            allowFullScreen
            className="signup-image"
          />
          <img src={screenShot} alt="sign-up4" className="signup-image" />
          <img src={screenShot} alt="sign-up5" className="signup-image" />
        </Slider>
      </div>
      <div className="signup-section">
        <h2
          className="main-head"
          style={{ textAlign: "left", cursor: "pointer" }}
        >
          Set New Password
        </h2>
        <form onSubmit={changePassword}>
          <div className="in">
            <input
              onChange={(e) => setUserEmail(e.target.value)}
              type="text"
              id="useremail"
              name="useremail"
              value={userEmail}
              placeholder="Useremail..."
            />

            <input
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              id="newPassword"
              name="newPassword"
              value={newPassword}
              placeholder="New Password..."
            />
          </div>

          <button
            className="glow-btn"
            type="submit"
            style={{ marginBottom: "30px" }}
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
