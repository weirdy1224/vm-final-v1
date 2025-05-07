import React, { useState } from "react";
import axios from "axios";
import hebesecLogo from "../images/hebesec_logo.png";
import log from "../images/log.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../useContext/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await axios.post("http://localhost:5000/api/login", {
        email,
        password,
      });

      // Adjust based on your backend response structure
      const { token, user } = response.data; // If backend returns { message: "Login successful", token, user }

      if (token && user) {
        login(user, token);
        setSuccessMessage("Login successful!");
        // Navigate based on role
        navigate(user.role === "admin" ? "/admin" : "/overview");
      } else {
        setErrorMessage("Invalid response from server");
      }
    } catch (error) {
      console.error("Login error:", error.response?.data);
      setErrorMessage(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#101A29] to-[#38598F] flex items-center justify-center p-12">
      <div
        className="bg-white rounded-lg shadow-lg p-8 block md:flex"
        style={{ width: "1200px", height: "650px", position: "relative" }}
      >
        <div style={{ flex: 1, position: "relative" }} className="">
          <img
            src={hebesecLogo}
            alt="Hebesec Logo"
            style={{
              width: "400px",
              position: "absolute",
              left: "350px",
            }}
          />
          <img
            src={log}
            alt="Illustration"
            style={{
              width: "600px",
              height: "500px",
              marginTop: "80px",
              marginLeft: "20px",
            }}
          />
        </div>

        <div
          className="mt-24"
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              background: "white",
              padding: "40px",
              borderRadius: "20px",
              boxShadow: "4px 4px 25px 4px rgba(0, 0, 0, 0.8)",
              width: "350px",
              height: "450px",
            }}
          >
            <h2
              className="text-xl font-bold text-left text-amber-400"
              style={{ fontSize: "24px", marginBottom: "20px" }}
            >
              Sign in
            </h2>
            {errorMessage && (
              <div
                style={{
                  color: "red",
                  marginBottom: "10px",
                  fontWeight: "bold",
                }}
              >
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div
                style={{
                  color: "green",
                  marginBottom: "10px",
                  fontWeight: "bold",
                }}
              >
                {successMessage}
              </div>
            )}
            <div style={{ marginBottom: "20px" }}>
              <label htmlFor="email" style={{ fontWeight: "bold" }}>
                E-mail:
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label htmlFor="password" style={{ fontWeight: "bold" }}>
                Password:
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>
            <button
              type="submit"
              className="w-40 ml-12 bg-blue-900 text-white py-2 px-4 rounded hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
