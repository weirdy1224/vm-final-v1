import React from "react";
import "./Overview.css";

export default function ScanSummary({
  scansRunning,
  totalScansCompleted,
  openVulnerabilities,
  totalTargets,
}) {
  return (
    <table className="summary-table">
      <thead>
        <tr>
          <th>Scans Running</th>
          <th>Scans Completed</th>
          <th>Open Vulnerabilities</th>
          <th>Total Targets</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{scansRunning}</td>
          <td>{totalScansCompleted}</td>
          <td>{openVulnerabilities}</td>
          <td>{totalTargets}</td>
        </tr>
      </tbody>
    </table>
  );
}
