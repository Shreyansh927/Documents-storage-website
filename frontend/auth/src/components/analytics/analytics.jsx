import React, { useState, useEffect } from "react";
import "./analytics.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";

const Analytics = () => {
  const [email, setEmail] = useState("");
  const [totalUsers, setTotalUsers] = useState(null);
  const [totalDocs, setTotalDocs] = useState(null);
  const [protectedDcos, setProtectedDocs] = useState(null);
  const [unprotectedDocs, setUnprotectedDocs] = useState(null);

  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    if (storedEmail) {
      setEmail(storedEmail);
      getAnalytics(storedEmail); // pass the actual email
    }
  }, []);

  const getAnalytics = async (userEmail) => {
    const encodedEmail = encodeURIComponent(userEmail);
    try {
      const res = await fetch(
        `https://documents-storage-website-backend-2.onrender.com/api/auth/analytics?email=${encodedEmail}`
      );
      const data = await res.json();
      setTotalUsers(data.totalUsers);
      setTotalDocs(data.totalDocuments);
      setProtectedDocs(data.protectedDocuments);
      setUnprotectedDocs(data.unprotectedDocuments);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  };

  const COLORS = ["#0088FE", "#FF8042"];

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>📊 Analytical Data</h1>

      {totalUsers !== null && totalDocs !== null ? (
        <>
          <p>
            <b>Total Users:</b> {totalUsers}
          </p>
          <p>
            <b>Total Documents (Your Uploads):</b> {totalDocs}
          </p>
        </>
      ) : (
        <p>Loading analytics...</p>
      )}

      {/* Pie Chart */}
      <div style={{ width: "400px", height: "300px" }}>
        <h3>Protected vs Unprotected</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              dataKey="value"
              data={[
                {
                  name: "Protected Documents",
                  value: protectedDcos,
                },
                {
                  name: "Unprotected Documents",
                  value: unprotectedDocs,
                },
              ]}
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
              className="pie-chart"
            >
              {COLORS.map((color, index) => (
                <Cell key={index} fill={color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Analytics;
