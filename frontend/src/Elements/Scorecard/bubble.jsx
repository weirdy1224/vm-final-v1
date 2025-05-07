import React, { useState, useEffect } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ZAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import "./Scorecard.css";

export default function VulnerabilityBubbleChart({ dateRange }) {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [totalVulnerabilities, setTotalVulnerabilities] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);

  const colors = ["#2563eb", "#eab308", "#22c55e", "#dc2626", "#ff6b6b"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No token found in localStorage.");
          setLoading(false);
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/vulnerabilities-by-year",
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          setData(result.data);
          setTotalVulnerabilities(result.totalVulnerabilities);
        } else {
          setError(result.message);
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const filtered = data.filter((entry) => {
      const year = entry.year;
      const yearDate = new Date(year, 0, 1);
      return yearDate >= dateRange.from && yearDate <= dateRange.to;
    });

    const newTotal = filtered.reduce(
      (sum, entry) => sum + entry.totalVulnerabilities,
      0
    );
    setFilteredData(filtered);
    setTotalVulnerabilities(newTotal);
  }, [data, dateRange]);

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

  const maxValue = Math.max(
    ...filteredData.map((item) => item.totalVulnerabilities),
    1
  );

  const ChartContent = () => (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 60 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={true}
          horizontal={false}
          stroke="var(--border)"
        />
        <XAxis
          type="number"
          dataKey="year"
          name="Year"
          domain={["auto", "auto"]}
          tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
        />
        <YAxis
          type="number"
          dataKey="totalVulnerabilities"
          name="Vulnerability Count"
          domain={["auto", "auto"]}
          tickCount={7}
          tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
        />
        <ZAxis
          type="number"
          dataKey="totalVulnerabilities"
          range={[100, 1000]}
          domain={["auto", "auto"]}
        />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={({ payload, label }) => {
            if (payload && payload.length) {
              const { year, totalVulnerabilities } = payload[0].payload;
              return (
                <div
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    padding: "8px",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <p>Year: {year}</p>
                  <p>
                    Vulnerability Count: {totalVulnerabilities} vulnerabilities
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        {filteredData.map((entry, index) => (
          <Scatter
            key={index}
            data={[entry]}
            fill={colors[index % colors.length]}
            size={(entry.totalVulnerabilities / maxValue) * 400}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );

  return (
    <div className="graph-card" onClick={handleClick}>
      <h3>Vulnerabilities by Year</h3>
      <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
        Total Vulnerabilities: {totalVulnerabilities}
      </p>
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
              <h3>Vulnerabilities by Year</h3>
              <p>
                This bubble chart visualizes the number of vulnerabilities
                detected each year within the selected date range.
              </p>
              <p>
                <strong>Key Insights:</strong>
              </p>
              <ul>
                <li>
                  <strong>X-Axis (Year):</strong> Represents the year of
                  vulnerability detection.
                </li>
                <li>
                  <strong>Y-Axis (Vulnerability Count):</strong> Indicates the
                  total number of vulnerabilities found in that year.
                </li>
                <li>
                  <strong>Bubble Size:</strong> The size of each bubble reflects
                  the relative number of vulnerabilities (larger bubbles
                  indicate more vulnerabilities).
                </li>
                <li>
                  <strong>Colors:</strong> Different colors are used to
                  distinguish between years for better clarity.
                </li>
              </ul>
              <p>
                Use this chart to identify trends in vulnerability occurrences
                over time and focus on years with higher vulnerability counts
                for deeper analysis.
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
