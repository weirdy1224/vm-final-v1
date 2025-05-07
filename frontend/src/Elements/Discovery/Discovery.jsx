import React, { useEffect } from "react";
import Navbar from "../Navbar/Navbar";
import DiscoveryTable from "./DiscoveryTable";
import "./Discovery.css";

function Discovery() {
  useEffect(() => {
    const theme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  return (
    <div className="flex min-h-screen">
      <Navbar />
      <div className="discovery-container">
        <DiscoveryTable />
      </div>
    </div>
  );
}

export default Discovery;