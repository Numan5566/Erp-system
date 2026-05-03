import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LoginPage.scss";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // TEMP login (baad mein backend lagayenge)
    if (email && password) {
      navigate("/dashboard");
    } else {
      alert("Please enter email & password");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>ERP Login</h2>

        <input
          type="text"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleLogin}>Login</button>

        <span className="forgot" onClick={() => navigate("/forgot")}>
          Forgot Password?
        </span>
      </div>
    </div>
  );
}