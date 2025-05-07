import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import axios from "axios";
import "./Overview.css";
import VulnerableTargetsTable from "./VulnerableTargetsTable.jsx";
import TopVulnerabilitiesList from "./TopVulnerability.jsx";
import ScanSummary from "./scan_summary.jsx";

function Overview() {
  const navigate = useNavigate();
  const [severityCounts, setSeverityCounts] = useState({
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  });

  useEffect(() => {
    const theme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  useEffect(() => {
    const fetchVulnerabilityData = async () => {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      if (!userId || !token) return;

      try {
        const response = await axios.get("http://localhost:5000/api/mostvul", {
          headers: { Authorization: `Bearer ${token}`, "X-User-Id": userId },
        });

        if (!response.data.success) {
          throw new Error(response.data.message || "API returned an error");
        }

        let updatedCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
        response.data.data.forEach((vuln) => {
          if (vuln.severity in updatedCounts) {
            updatedCounts[vuln.severity] += 1;
          }
        });

        setSeverityCounts(updatedCounts);
      } catch (error) {
        console.error("Error fetching vulnerability data:", error);
      }
    };

    fetchVulnerabilityData();
  }, []);

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="main-content">
        <div className="header">
          <h1>Security Dashboard</h1>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Critical</h3>
            <p>{severityCounts.Critical}</p>
          </div>
          <div className="stat-card">
            <h3>High</h3>
            <p>{severityCounts.High}</p>
          </div>
          <div className="stat-card">
            <h3>Medium</h3>
            <p>{severityCounts.Medium}</p>
          </div>
          <div className="stat-card">
            <h3>Low</h3>
            <p>{severityCounts.Low}</p>
          </div>
        </div>

        <div className="summary-table">
          <ScanSummary
            scansRunning={1}
            totalScansCompleted={3}
            openVulnerabilities={4}
            totalTargets={5}
          />
        </div>

        <div className="data-section">
          <VulnerableTargetsTable />
          <TopVulnerabilitiesList />
        </div>
      </div>
    </div>
  );
}

export default Overview;
