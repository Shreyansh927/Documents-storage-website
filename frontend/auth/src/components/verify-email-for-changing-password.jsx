import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const VerifyEmail = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "https://documents-storage-website-backend-2.onrender.com/api/auth/verify-user-email",
        { email }
      );

      console.log("Response from server:", response.data);

      alert(response.data.message || "OTP sent successfully!");
      setIsOtpSent(true);
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Failed to send OTP");
    }
  };

  const handleOtp = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "https://documents-storage-website-backend-2.onrender.com/api/auth/verify-otp",
        { email, otp }
      );

      alert(response.data.message);

      if (response.data.message === "OTP verified, set new password") {
        navigate("/change-password"); // OTP correct
      } else {
        navigate("/login"); // fallback if server gives unexpected message
      }
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      alert(error.response?.data?.message || "OTP is wrong");
    }
  };

  return (
    <div>
      <h2>Verify Email</h2>
      {!isOtpSent ? (
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <br />
          <button type="submit">Send OTP</button>
        </form>
      ) : (
        <form onSubmit={handleOtp}>
          <label htmlFor="otp">Enter your otp</label>
          <input
            type="text"
            id="otp"
            name="otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button type="submit">Submit</button>
        </form>
      )}
    </div>
  );
};

export default VerifyEmail;
