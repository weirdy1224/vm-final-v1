import React, { useEffect } from "react";
import Navbar from "../Navbar/Navbar";
import VulnTable from "./table";
import "./Vulnerabilities.css";

function Vulnerabilities() {
  useEffect(() => {
    const theme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  return (
    <div className="flex">
      <Navbar />
      <div className="vulnerabilities-container">
        <VulnTable />
      </div>
    </div>
  );
}

export default Vulnerabilities;
