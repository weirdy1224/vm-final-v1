import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import "./Overview.css";

const vulnerabilityColors = ["#dc2626", "#f97316", "#facc15", "#22c55e"];
const severityLevels = ["Critical", "High", "Medium", "Low"];
const severityToScore = { Critical: 80, High: 44, Medium: 30, Low: 10 };

const VulnerabilityIndicator = ({ count, index }) => (
  <div
    className="vulnerability-indicator"
    style={{
      backgroundColor: vulnerabilityColors[index % vulnerabilityColors.length],
    }}
  >
    {count}
  </div>
);

export default function VulnerableTargetsTable() {
  const [targetsData, setTargetsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const navigate = useNavigate(); // Hook for navigation

  useEffect(() => {
    const fetchVulnerableTargets = async () => {
      try {
        if (!userId || !token) {
          throw new Error("User ID or token is missing. Please log in.");
        }

        setLoading(true);
        const response = await axios.get("http://localhost:5000/api/mostvul", {
          headers: { Authorization: `Bearer ${token}`, "X-User-Id": userId },
        });

        if (!response.data.success) {
          throw new Error(response.data.message || "API returned an error");
        }

        const groupedData = response.data.data.reduce((acc, vuln) => {
          const url = vuln.location || "Unknown Location";
          if (!acc[url]) {
            acc[url] = {
              url,
              vulnerabilities: severityLevels.map((severity) => ({
                severity,
                score: severityToScore[severity] || 0,
                count: 0,
              })),
            };
          }
          const severityIndex = severityLevels.indexOf(vuln.severity);
          if (severityIndex !== -1) {
            acc[url].vulnerabilities[severityIndex].count++;
          }
          return acc;
        }, {});

        const transformedData = Object.values(groupedData).map((target) => ({
          url: target.url,
          vulnerabilities: target.vulnerabilities,
        }));

        const normalizedData = transformedData.map((target) => {
          const allSeverities = target.vulnerabilities.map((vuln) => ({
            score: vuln.score,
            severity: vuln.severity,
            count: vuln.count,
          }));
          return { ...target, vulnerabilities: allSeverities };
        });

        setTargetsData(normalizedData);
        setError(null);
      } catch (error) {
        console.error("Error fetching vulnerable targets:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVulnerableTargets();
  }, [userId, token]);

  // Handle click on target to redirect
  const handleTargetClick = (url) => {
    navigate(`/discovery`);
  };
  // const handleTargetClick = (url) => {
  //   navigate(`/discovery/${encodeURIComponent(url)}`);
  // };

  return (
    <div className="data-card">
      <h2>Vulnerable Targets</h2>
      {loading ? (
        <p>Loading targets...</p>
      ) : error ? (
        <p style={{ color: "#dc2626" }}>{error}</p>
      ) : targetsData.length > 0 ? (
        <div className="list">
          {targetsData.map((target, index) => (
            <div key={index} className="list-item">
              <span onClick={() => handleTargetClick(target.url)}>
                {target.url}
              </span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {target.vulnerabilities.map((vulnerability, vIndex) => (
                  <VulnerabilityIndicator
                    key={vIndex}
                    count={vulnerability.count}
                    index={vIndex}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No vulnerable targets to display.</p>
      )}
    </div>
  );
}