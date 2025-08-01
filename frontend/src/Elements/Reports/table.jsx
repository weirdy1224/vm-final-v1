import React, { useState, useEffect } from "react";
import { Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axios from "axios";

const BASE_URL = "http://localhost:5000";

const handleDownload = async (filePath, domain) => {
  try {
    if (!filePath) {
      alert("❌ Invalid file path.");
      return;
    }

    const fileUrl = filePath.startsWith("http")
      ? filePath
      : `${BASE_URL}${filePath}`;
    console.log("🔗 File Download URL:", fileUrl);
    // ...rest of your code


    const sanitizedDomain = domain
      ? domain.replace(/https?:\/\//, "").replace(/\W+/g, "_")
      : "report";

    const response = await fetch(fileUrl);
    if (!response.ok)
      throw new Error(`Failed to fetch file: ${response.status}`);

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${sanitizedDomain}.pdf`;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("❌ Download error:", error);
    alert("Failed to download report. Please try again.");
  }
};

export default function ReportTable() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("❌ No authentication token found. Please log in.");
        }

        const response = await axios.get(`${BASE_URL}/api/reports`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("✅ API Response:", response.data);

        if (!Array.isArray(response.data.data)) {
          throw new Error("Invalid response format");
        }

        setReports(
          response.data.data.map((report, index) => ({
            serialNumber: index + 1,
            id: report._id,
            template:
              report.vulnerabilities?.length > 0
                ? "Vulnerability Report"
                : "Generic Report",
            domain: report.domain,
            createdOn: new Date(report.uploadedAt).toLocaleString(),
            filePath: report.filePath
              ? `${BASE_URL}${report.filePath.replace(
                  /^\/server\/server/,
                  "/uploads"
                )}`
              : "",
          }))
        );
      } catch (error) {
        console.error(
          "❌ Fetch error:",
          error.response ? error.response.data : error.message
        );
        setError("Failed to fetch reports. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  return (
    <div className="report-container">
      <div className="data-card">
        {/* Filter Input */}
        <div className="search-bar">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Filter reports..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 max-w-full"
          />
        </div>

        {/* Report Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>S.No</TableHead>
              <TableHead>Report Template</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Created On</TableHead>
              <TableHead>Download</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  Loading...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="error-message text-center py-4">
                  {error}
                </TableCell>
              </TableRow>
            ) : reports.length > 0 ? (
              reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.serialNumber}</TableCell>
                  <TableCell>{report.template}</TableCell>
                  <TableCell>{report.domain}</TableCell>
                  <TableCell>{report.createdOn}</TableCell>
                  <TableCell>
                    {report.filePath ? (
                      <button
                        className="download-button"
                        onClick={() =>
                          handleDownload(report.filePath, report.domain)
                        }
                      >
                        Download PDF
                      </button>
                    ) : (
                      <span className="not-available">Not Available</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No reports available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}