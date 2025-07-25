import React, { useEffect, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import axios from "axios";
import "./Discovery.css";

function DiscoveryTable1({ onUpdateProgress }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [tableData, setTableData] = useState([]);
  const [imageUploads, setImageUploads] = useState({});
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

        const fetchedData = response.data.data || [];
        const enrichedData = fetchedData.flatMap((item, index) =>
          (item.vulnerabilities || []).map((vuln, vulnIndex) => ({
            ...item,
            vuln,
            index: `${index}-${vulnIndex}`,
            updateStatus: vuln.updateStatus || "Pending",
            fixedStatus: vuln.fixedStatus || "Not Fixed",
            foundDate: vuln.foundDate || new Date().toISOString(),
            bugName: vuln.bug_name || `Bug-${index}-${vulnIndex}`,
          }))
        );

        setData(fetchedData);
        setTableData(enrichedData);
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

    const sortedData = [...tableData].sort((a, b) => {
      let aValue, bValue;
      if (key === "foundDate") {
        aValue = new Date(a[key] || 0).getTime();
        bValue = new Date(b[key] || 0).getTime();
      } else if (key === "updateStatus" || key === "fixedStatus") {
        aValue = (a[key] || "").toString().toLowerCase();
        bValue = (b[key] || "").toString().toLowerCase();
      } else {
        aValue = (a[key] || a.vuln[key] || "").toString().toLowerCase();
        bValue = (b[key] || b.vuln[key] || "").toString().toLowerCase();
      }

      if (direction === "asc") {
        return typeof aValue === "number"
          ? aValue - bValue
          : aValue.localeCompare(bValue);
      } else {
        return typeof aValue === "number"
          ? bValue - aValue
          : bValue.localeCompare(aValue);
      }
    });

    setTableData(sortedData);
  };

  const handleInputChange = async (index, field, value, imageFile) => {
    try {
      const updatedItem = tableData.find((item) => item.index === index);
      if (!updatedItem) return;

      // Update local state first
      setTableData((prevData) =>
        prevData.map((item) =>
          item.index === index ? { ...item, [field]: value } : item
        )
      );

      // Call the API to update the server
      await onUpdateProgress(index, value, imageFile);

      // If an image was uploaded, update the local image state
      if (imageFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImageUploads((prev) => ({
            ...prev,
            [index]: e.target.result,
          }));
        };
        reader.readAsDataURL(imageFile);
      }
    } catch (error) {
      console.error("Error updating item:", error);
      // Revert local state on failure
      setTableData((prevData) =>
        prevData.map((item) =>
          item.index === index ? { ...item, [field]: item[field] } : item
        )
      );
    }
  };

  const filteredData = tableData.filter((item) =>
    Object.values({ ...item, ...item.vuln }).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const paginatedData = filteredData.slice(
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
            {["DOMAIN", "FOUND/UPDATED DATE", "STATUS", "BUG STATUS"].map(
              (header) => (
                <th
                  key={header}
                  onClick={() =>
                    handleSort(
                      header === "FOUND/UPDATED DATE"
                        ? "foundDate"
                        : header === "STATUS"
                        ? "updateStatus"
                        : header === "BUG STATUS"
                        ? "fixedStatus"
                        : header.toLowerCase()
                    )
                  }
                >
                  {header} <ChevronDown className="inline-block w-4 h-4" />
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((item) => (
            <tr key={item.index}>
              <td>{item.domain || "N/A"}</td>
              <td>
                {new Date(item.foundDate).toLocaleDateString() || "N/A"}
              </td>
              <td>
                <select
                  value={item.updateStatus}
                  onChange={(e) =>
                    handleInputChange(item.index, "updateStatus", e.target.value)
                  }
                  className="fixed-status-select"
                >
                  <option value="Pending">Pending</option>
                  <option value="Fixed">Fixed</option>
                </select>
              </td>
              <td className="fixed-column">
                <select
                  value={item.fixedStatus}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    const imageInput = document.getElementById(`image-upload-${item.index}`);
                    handleInputChange(
                      item.index,
                      "fixedStatus",
                      newStatus,
                      newStatus === "Fixed" && imageInput.files[0]
                        ? imageInput.files[0]
                        : null
                    );
                  }}
                  className="fixed-status-select"
                >
                  <option value="Not Fixed">Not Fixed</option>
                  <option value="Fixed">Fixed</option>
                </select>
                <input
                  type="file"
                  id={`image-upload-${item.index}`}
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      handleInputChange(
                        item.index,
                        "fixedStatus",
                        item.fixedStatus,
                        e.target.files[0]
                      );
                    }
                  }}
                />
                {imageUploads[item.index] && (
                  <div className="image-preview">
                    <img
                      src={imageUploads[item.index]}
                      alt="Proof of fix"
                      style={{ maxWidth: "100px", marginTop: "0.5rem" }}
                    />
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && renderPagination()}
    </div>
  );
}

export default function DiscoveryTable(props) {
  return <DiscoveryTable1 {...props} />;
}