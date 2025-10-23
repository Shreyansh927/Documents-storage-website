import React, { useState, useEffect } from "react";
import "./login.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import screenShot from "../../assets/signup2.png";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  const jwtToken = Cookies.get("jwtToken");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (jwtToken) {
      return navigate("/home");
    }
  }, [jwtToken]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:4000/api/auth/login",
        formData,
        { withCredentials: true } // ensures cookie is stored
      );

      const { name, message } = response.data;
      localStorage.setItem("userName", name);
      localStorage.setItem("userEmail", formData.email); //  fixed
      alert(message);

      // ✅ redirect after login
      navigate("/home", { replace: true });
    } catch (error) {
      alert(error.response?.data || "Login failed");
    }
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
            onClick={() => navigate("/")}
            className="head"
            style={{ textAlign: "center", cursor: "pointer" }}
          >
            Sign Up
          </h2>
          <hr className="hr" />
          <h2
            onClick={() => navigate("/login")}
            className="main-head"
            style={{ textAlign: "", cursor: "pointer" }}
          >
            Login
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="in">
            <input
              name="email"
              placeholder="Email"
              onChange={handleChange}
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              required
            />
          </div>

          <button className="glow-btn" type="submit">
            Login
          </button>

          <p
            className="forgot-password"
            onClick={() => navigate("/change-password")}
          >
            forgot password
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
