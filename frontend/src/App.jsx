import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Elements/Login/Login.jsx";
import Overview from "./Elements/Overview/Overview.jsx";
import Discovery from "./Elements/Discovery/Discovery.jsx";
import Vulnerabilities from "./Elements/Vulnerabilities/Vulnerabilities.jsx";
import Reports from "./Elements/Reports/Reports.jsx";
import Scorecard from "./Elements/Scorecard/Scorecard.jsx";
import Admin from "./Admin/admin.jsx";
import UploadReport from "./Admin/Rep_Upload/Upload_report.jsx";
import Client from "./Admin/Clients/Clients.jsx";
import User from "./Admin/User_Management/User.jsx";
import "./App.css";
import { AuthProvider } from "./useContext/AuthContext.jsx";
import ProtectedRoute from "./useContext/ProtectedRoute.jsx";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route
              path="/overview"
              element={
                <ProtectedRoute>
                  <Overview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/discovery"
              element={
                <ProtectedRoute>
                  <Discovery />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vulnerabilities"
              element={
                <ProtectedRoute>
                  <Vulnerabilities />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scorecard"
              element={
                <ProtectedRoute>
                  <Scorecard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route path="/upload-reports" element={<UploadReport />} />
            <Route
              path="/client"
              element={
                <ProtectedRoute>
                  <Client />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user-management"
              element={
                <ProtectedRoute>
                  <User />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
