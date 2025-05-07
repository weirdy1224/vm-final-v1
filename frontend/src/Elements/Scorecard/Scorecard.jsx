import React, { useState, useEffect } from "react";
import Navbar from "../Navbar/Navbar";
import DatePickerWithRange from "./datepicker";
import Dashboard from "./CVS";
import VulnerabilityBubbleChart from "./bubble";
import "./Scorecard.css";

function Scorecard() {
  const [dateRange, setDateRange] = useState({
    from: new Date(2025, 0, 1), // January 1, 2025
    to: new Date(2025, 11, 31), // December 31, 2025
  });

  useEffect(() => {
    const theme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  return (
    <div className="flex">
      <Navbar />
      <div className="scorecard-container">
        <DatePickerWithRange onDateChange={setDateRange} />
        <div className="graph-grid">
          <div className="graph-card">
            <Dashboard dateRange={dateRange} />
          </div>
          <div className="graph-card">
            <VulnerabilityBubbleChart dateRange={dateRange} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Scorecard;
