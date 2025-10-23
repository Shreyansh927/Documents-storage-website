import React, { useState, useEffect } from "react";
import "./signup.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import screenShot from "../../assets/signup2.png";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Signup = () => {
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    password: "",
    email: "",
    location: "",
  });

  const navigate = useNavigate();
  const jwtToken = Cookies.get("jwtToken");
  useEffect(() => {
    if (jwtToken) {
      navigate("/home");
    }
  }, [jwtToken]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "https://documents-storage-website-backend-2.onrender.com/api/auth/signup",
        formData
      );
      console.log("✅ Signup successful:", response.data);
      localStorage.setItem("usernaam", formData.name);
      localStorage.setItem("address", formData.location);
      localStorage.setItem("useremail", formData.email);
      navigate("/login");
    } catch (error) {
      console.error("❌ Signup error:", error.response?.data);
      alert(error.response?.data?.message || "Signup failed");
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
        <div className="heading-container">
          <h2
            className="main-head"
            style={{ textAlign: "center", cursor: "pointer" }}
          >
            Sign Up
          </h2>
          <hr className="hr" />
          <h2
            onClick={() => navigate("/login")}
            className="head"
            style={{ textAlign: "", cursor: "pointer" }}
          >
            Login
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="in">
            <input
              name="username"
              placeholder="Username..."
              onChange={handleChange}
              required
              className="inpuut"
            />

            <input
              name="name"
              placeholder="Full Name..."
              onChange={handleChange}
              required
              className="inpuut"
            />
          </div>
          <br />
          <div className="in">
            <input
              type="password"
              name="password"
              placeholder="Password..."
              onChange={handleChange}
              required
              className="inpuut"
            />

            <input
              name="email"
              placeholder="Email..."
              onChange={handleChange}
              required
              className="inpuut"
            />
          </div>
          <br />
          <input
            name="location"
            placeholder="Location..."
            onChange={handleChange}
            required
          />
          <br />
          <button
            className="glow-btn"
            type="submit"
            style={{ marginBottom: "30px" }}
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
