import React from "react";
import "./Overview.css";

export default function ScanSummary({
  scansRunning,
  totalScansCompleted,
  openVulnerabilities,
  totalTargets,
}) {
  return (
    <div className="summary-table">
      <div className="summary-table-header">
        <div className="summary-table-cell">Scans Running</div>
        <div className="summary-table-cell">Scans Completed</div>
        <div className="summary-table-cell">Open Vulnerabilities</div>
        <div className="summary-table-cell">Total Targets</div>
      </div>
      <div className="summary-table-row">
        <div className="summary-table-cell">{scansRunning}</div>
        <div className="summary-table-cell">{totalScansCompleted}</div>
        <div className="summary-table-cell">{openVulnerabilities}</div>
        <div className="summary-table-cell">{totalTargets}</div>
      </div>
    </div>
  );
}