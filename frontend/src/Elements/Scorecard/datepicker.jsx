import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Scorecard.css";

export default function Dashboard({ dateRange }) {
  const [scores, setScores] = useState([]);
  const [filteredScores, setFilteredScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No token found in localStorage.");
          setLoading(false);
          return;
        }
        const response = await axios.get(
          "http://localhost:5000/api/cvss-scores",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("API Response from /api/cvss-scores:", response.data);

        if (response.data.success) {
          let fetchedScores = [];
          if (Array.isArray(response.data.data)) {
            fetchedScores = response.data.data
              .map((report) => {
                const cvssScore =
                  report.cvss_score ??
                  report.cvssScore ??
                  report.score ??
                  (report.metrics && report.metrics.cvss_score);
                const createdAt =
                  report.createdAt ?? report.date ?? new Date().toISOString();

                return {
                  cvss_score: parseFloat(cvssScore),
                  createdAt: createdAt,
                };
              })
              .filter(
                (score) =>
                  !isNaN(score.cvss_score) &&
                  score.cvss_score >= 0 &&
                  score.cvss_score <= 10
              );
          }

          console.log("Parsed Scores:", fetchedScores);

          if (fetchedScores.length === 0) {
            console.warn("No valid CVSS scores found, using mock data.");
            fetchedScores = [
              { cvss_score: 2.5, createdAt: "2025-01-01T00:00:00Z" },
              { cvss_score: 4.7, createdAt: "2025-02-01T00:00:00Z" },
              { cvss_score: 7.8, createdAt: "2025-03-01T00:00:00Z" },
              { cvss_score: 9.1, createdAt: "2025-04-01T00:00:00Z" },
            ];
          }

          setScores(fetchedScores);
        } else {
          setError(response.data.message || "Failed to fetch CVSS scores.");
        }
      } catch (error) {
        console.error("Error fetching CVSS scores:", error);
        setError("Failed to fetch CVSS scores.");
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, []);

  useEffect(() => {
    const ranges = [
      { range: "0-1", value: 0 },
      { range: "1-2", value: 0 },
      { range: "2-3", value: 0 },
      { range: "3-4", value: 0 },
      { range: "4-5", value: 0 },
      { range: "5-6", value: 0 },
      { range: "6-7", value: 0 },
      { range: "7-8", value: 0 },
      { range: "8-9", value: 0 },
      { range: "9+", value: 0 },
    ];

    const filtered = scores.filter((score) => {
      const scoreDate = new Date(score.createdAt);
      return scoreDate >= dateRange.from && scoreDate <= dateRange.to;
    });

    console.log("Filtered Scores by Date Range:", filtered);

    filtered.forEach((score) => {
      const cvss = score.cvss_score;
      if (isNaN(cvss) || cvss < 0 || cvss > 10) return;
      if (cvss <= 1) ranges[0].value++;
      else if (cvss <= 2) ranges[1].value++;
      else if (cvss <= 3) ranges[2].value++;
      else if (cvss <= 4) ranges[3].value++;
      else if (cvss <= 5) ranges[4].value++;
      else if (cvss <= 6) ranges[5].value++;
      else if (cvss <= 7) ranges[6].value++;
      else if (cvss <= 8) ranges[7].value++;
      else if (cvss <= 9) ranges[8].value++;
      else ranges[9].value++;
    });

    console.log("Binned Ranges:", ranges);

    setFilteredScores(ranges);
  }, [scores, dateRange]);

  const referenceMax = 10; // Reference maximum for scaling bar widths (adjustable)

  const getColor = (range) => {
    const [start] = range.split("-").map(Number);
    if (start <= 1) return "bg-green-500";
    if (start <= 3) return "bg-yellow-500";
    if (start <= 5) return "bg-orange-500";
    if (start <= 7) return "bg-red-500";
    return "bg-red-900";
  };

  const handleMouseEnter = () => {
    if (!showOverlay) {
      setShowTooltip(true);
    }
  };

  const handleMouseMove = (e) => {
    if (!showOverlay) {
      setTooltipPosition({ x: e.clientX + 10, y: e.clientY + 10 });
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    setShowOverlay(true);
    setShowTooltip(false);
  };

  const handleCloseOverlay = (e) => {
    e.stopPropagation();
    setShowOverlay(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  const ChartContent = () => (
    <div className="space-y-2">
      {filteredScores.map((score, index) => (
        <div key={index} className="flex items-center">
          <div
            className="w-12 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            {score.range}
          </div>
          <div className="flex-1 h-6 flex items-center">
            {score.value > 0 && (
              <div className="flex items-center w-full">
                <div
                  className={`h-1.5 rounded-full ${getColor(
                    score.range
                  )} transition-all duration-500`}
                  style={{
                    width: `${Math.min(
                      (score.value / referenceMax) * 100,
                      100
                    )}%`,
                  }}
                />
                <span
                  className="ml-2 text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {score.value}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="graph-card" onClick={handleClick}>
      <h3>CVSS Score Range</h3>
      <div
        className="chart-container"
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <ChartContent />
      </div>

      {/* {showTooltip && !showOverlay && (
        <div
          className="tooltip"
          style={{ top: tooltipPosition.y, left: tooltipPosition.x }}
        >
          Click for more information
        </div>
      )} */}

      {showOverlay && (
        <div className="graph-overlay">
          <div className="overlay-content">
            <div className="overlay-graph">
              <ChartContent />
            </div>
            <div className="overlay-details">
              <h3>CVSS Score Range</h3>
              <p>
                This chart displays the distribution of CVSS (Common
                Vulnerability Scoring System) scores for vulnerabilities within
                the selected date range.
              </p>
              <p>
                <strong>Key Insights:</strong>
              </p>
              <ul>
                <li>
                  <strong>0-1 (Green):</strong> Low-risk vulnerabilities,
                  minimal impact.
                </li>
                <li>
                  <strong>1-3 (Yellow):</strong> Moderate risk, may require
                  attention.
                </li>
                <li>
                  <strong>3-5 (Orange):</strong> Elevated risk, prioritize
                  mitigation.
                </li>
                <li>
                  <strong>5-7 (Red):</strong> High risk, immediate action
                  recommended.
                </li>
                <li>
                  <strong>7+ (Dark Red):</strong> Critical vulnerabilities,
                  urgent remediation needed.
                </li>
              </ul>
              <p>
                Use this chart to assess the severity of vulnerabilities in your
                system and prioritize security efforts accordingly.
              </p>
              <button className="back-button" onClick={handleCloseOverlay}>
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
