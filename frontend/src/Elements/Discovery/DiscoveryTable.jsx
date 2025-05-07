import React, { useEffect, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import axios from "axios";
import "./Discovery.css";

function DiscoveryTable1() {
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("token");

        if (!userId || !token) {
          throw new Error("User ID or token is missing");
        }

        const response = await axios.get("http://localhost:5000/api/reports", {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-User-Id": userId,
          },
        });

        if (!response.data.success) {
          throw new Error(response.data.message || "API returned an error");
        }

        setData(response.data.data || []);
      } catch (error) {
        console.error("Error fetching reports:", error.message);
      }
    };

    fetchReports();
  }, []);

  const handleSort = (key) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });

    const sortedData = [...data].sort((a, b) => {
      const aValue = a[key]?.toString().toLowerCase() || "";
      const bValue = b[key]?.toString().toLowerCase() || "";

      return direction === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

    setData(sortedData);
  };

  const filteredData = data.filter((item) =>
    Object.values(item).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const flattenedData = filteredData.flatMap((item, index) =>
    (item.vulnerabilities || []).map((vuln, vulnIndex) => ({
      ...item,
      vuln,
      index: `${index}-${vulnIndex}`,
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
    <div className="data-card">
      <h2>Discovery Reports</h2>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search..."
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="w-5 h-5" />
      </div>

      <table>
        <thead>
          <tr>
            {["URL", "DOMAIN", "IP", "PROGRESS", "STATUS"].map((header) => (
              <th key={header} onClick={() => handleSort(header.toLowerCase())}>
                {header} <ChevronDown className="inline-block w-4 h-4" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((item) => (
            <tr key={item.index}>
              <td>{item.vuln.location || "N/A"}</td>
              <td>{item.domain || "N/A"}</td>
              <td>{item.ip_address || "N/A"}</td>
              <td>
                <div className="progress-container">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${
                        item.vuln.cvss_score ? item.vuln.cvss_score * 10 : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </td>
              <td>
                <span
                  className={`status-tag ${
                    item.vuln.cvss_score >= 7
                      ? "critical"
                      : item.vuln.cvss_score >= 4
                      ? "medium"
                      : item.vuln.cvss_score > 0
                      ? "low"
                      : "pending"
                  }`}
                >
                  {item.vuln.cvss_score ? `${item.vuln.cvss_score}` : "Pending"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && renderPagination()}
    </div>
  );
}

export default function DiscoveryTable() {
  return <DiscoveryTable1 />;
}
