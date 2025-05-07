import React, { useEffect } from "react";
import Navbar from "../Navbar/Navbar";
import ReportTable from "./table";
import "./Reports.css";

function Reports() {
  useEffect(() => {
    const theme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  return (
    <div className="flex">
      <Navbar />
      <div className="report-container">
        <ReportTable />
      </div>
    </div>
  );
}

export default Reports;
