import React, { useEffect, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import axios from "axios";
import "./Vulnerabilities.css";

export default function VulnTable() {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [vulnDetails, setVulnDetails] = useState(null);
  const [error, setError] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("User is not authenticated");
        setError("User is not authenticated");
        return;
      }

      try {
        const response = await axios.get("http://localhost:5000/api/reports", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.data.success) {
          setData(response.data.data || []);
        } else {
          setError("Failed to fetch reports: " + response.data.message);
        }
      } catch (error) {
        console.error("Error fetching reports:", error);
        setError("Failed to fetch reports. Please try again later.");
      }
    };

    fetchData();
  }, []);

  const fetchVulnerabilityDetails = async (vulnId) => {
    const token = localStorage.getItem("token");
    setLoadingDetails(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/vulnerability/${vulnId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        setVulnDetails(response.data.data);
      } else {
        setError(
          "Failed to fetch vulnerability details: " + response.data.message
        );
      }
    } catch (error) {
      console.error("Error fetching vulnerability details:", error);
      setError("Failed to fetch vulnerability details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSort = (key) => {
    const sortedData = [...data].sort((a, b) => {
      const aValue =
        key === "severity" ? a.vulnerabilities[0]?.severity : a[key];
      const bValue =
        key === "severity" ? b.vulnerabilities[0]?.severity : b[key];
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    });
    setData(sortedData);
  };

  const handleRowClick = (item, vuln) => {
    setSelectedItem({
      ...vuln,
      domain: item.domain,
      ip_address: item.ip_address,
    });
    fetchVulnerabilityDetails(vuln._id);
  };

  const handleClosePopup = () => {
    setSelectedItem(null);
    setVulnDetails(null);
  };

  const filteredData = data.filter((item) =>
    item.vulnerabilities.some((vuln) =>
      Object.values({
        ...vuln,
        domain: item.domain,
        ip_address: item.ip_address,
      }).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  );

  const flattenedData = filteredData.flatMap((item) =>
    item.vulnerabilities.map((vuln, index) => ({
      ...item,
      vuln,
      index: `${item._id}-${index}`,
    }))
  );

  const totalRecords = flattenedData.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const paginatedData = flattenedData.slice(
    startIndex,
    startIndex + recordsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={currentPage === i ? "active" : ""}
        >
          {i}
        </button>
      );
    }

    if (startPage > 1) {
      pages.unshift(
        <button key="first" onClick={() => handlePageChange(1)}>
          1
        </button>
      );
      if (startPage > 2) pages.unshift(<span key="dots-start">...</span>);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push(<span key="dots-end">...</span>);
      pages.push(
        <button key="last" onClick={() => handlePageChange(totalPages)}>
          {totalPages}
        </button>
      );
    }

    return <div className="pagination">{pages}</div>;
  };

  return (
    <div className="relative">
      <div className={`data-card ${selectedItem ? "opacity-60" : ""}`}>
        <h2>Vulnerabilities</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search..."
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="w-5 h-5" />
        </div>

        {error && <div className="error-message">{error}</div>}

        <table>
          <thead>
            <tr>
              {["Domain", "Severity", "IP Address"].map((header) => (
                <th
                  key={header}
                  onClick={() => handleSort(header.toLowerCase())}
                >
                  {header} <ChevronDown className="inline-block w-4 h-4" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item) => (
              <tr
                key={item.index}
                onClick={() => handleRowClick(item, item.vuln)}
                className="cursor-pointer"
              >
                <td>{item.domain}</td>
                <td>
                  <span
                    className={`severity-badge ${item.vuln.severity.toLowerCase()}`}
                  >
                    {item.vuln.severity}
                  </span>
                </td>
                <td>{item.ip_address || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && renderPagination()}
      </div>

      {selectedItem && (
        <div className="vulnerability-popup">
          <div className="vulnerability-popup-content">
            <h2>Vulnerability Description</h2>
            {loadingDetails ? (
              <div>Loading vulnerability details...</div>
            ) : vulnDetails ? (
              <div>
                <p>
                  <strong>Vulnerability Name:</strong>{" "}
                  {vulnDetails.name || "N/A"}
                </p>
                <p>
                  <strong>Severity:</strong>{" "}
                  <span
                    className={`severity-badge ${selectedItem.severity.toLowerCase()}`}
                  >
                    {selectedItem.severity}
                  </span>
                </p>
                <p>
                  <strong>Location:</strong> {selectedItem.domain}
                  {vulnDetails.location || ""}
                </p>
                <p>
                  <strong>Description:</strong>{" "}
                  <pre className="whitespace-pre-wrap">
                    {vulnDetails.description || "No description available"}
                  </pre>
                </p>
                <p>
                  <strong>Impact:</strong>
                  <ul className="list-disc">
                    {(vulnDetails.impact || []).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </p>
                <p>
                  <strong>Proof of Concept:</strong>
                  <ol className="list-decimal">
                    {(vulnDetails.proofOfConcept || []).map(
                      (stepObj, index) => (
                        <li key={stepObj._id} className="mb-2">
                          {stepObj.step}
                          {stepObj.image && (
                            <img
                              src={stepObj.image}
                              alt={`Proof step ${index + 1}`}
                              className="mt-2 max-w-xs"
                            />
                          )}
                        </li>
                      )
                    )}
                  </ol>
                </p>
                <p>
                  <strong>Remediation:</strong>
                  <ul className="list-disc">
                    {(vulnDetails.remediation || []).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </p>
                {vulnDetails.references && (
                  <p>
                    <strong>Reference Link:</strong>{" "}
                    <a
                      href={vulnDetails.references}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {vulnDetails.references}
                    </a>
                  </p>
                )}
              </div>
            ) : (
              <div>No details available</div>
            )}
            <button onClick={handleClosePopup}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
