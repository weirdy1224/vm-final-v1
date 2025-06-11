"use client";
import React, { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "./Navbar/Navbar.jsx";
import { useNavigate } from "react-router-dom";
import ScanSummary from "../Elements/Overview/scan_summary.jsx";

export default function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);
  
  const [scanSummary, setScanSummary] = useState({
    scansRunning: 1,
    scansCompleted: 3,
    openVulnerabilities: 4,
    totalTargets: 5,
  });

  const handleNavigation = (path) => {
    navigate(path);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5000/api/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchScanSummary = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5000/api/scan-summary", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch scan summary");
        }

        const data = await response.json();
        setScanSummary({
          scansRunning: data.scansRunning,
          scansCompleted: data.scansCompleted,
          openVulnerabilities: data.openVulnerabilities,
          totalTargets: data.totalTargets,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchScanSummary();
  }, []);

  const handleScanSummaryChange = (e) => {
    const { name, value } = e.target;
    setScanSummary((prev) => ({
      ...prev,
      [name]: parseInt(value) || 0,
    }));
  };

  const handleSaveScanSummary = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/scan-summary", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(scanSummary),
      });

      if (!response.ok) {
        throw new Error("Failed to update scan summary");
      }

      const data = await response.json();
      setScanSummary({
        scansRunning: data.scanSummary.scansRunning,
        scansCompleted: data.scanSummary.scansCompleted,
        openVulnerabilities: data.scanSummary.openVulnerabilities,
        totalTargets: data.scanSummary.totalTargets,
      });
      alert("Scan summary updated successfully!");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!selectedUserId) return;

    const fetchVulnerabilities = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:5000/api/vulnerabilities/${selectedUserId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch vulnerabilities");
        }

        const data = await response.json();
        setVulnerabilities(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVulnerabilities();
  }, [selectedUserId]);

  const handleStatusChange = (reportId, vulnIndex, newStatus) => {
    if (newStatus === "Fixed") {
      setPendingUpdate({ reportId, vulnIndex, newStatus });
      setShowModal(true);
    } else {
      handleUpdateProgress(reportId, vulnIndex, newStatus);
    }
  };

  const handleUpdateProgress = async (reportId, vulnIndex, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/update-vulnerability-progress", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reportId, vulnIndex, updateStatus: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update progress");
      }

      setVulnerabilities((prev) => {
        const updatedVulnerabilities = prev.map((vuln) => {
          if (vuln.reportId === reportId && vuln.vulnIndex === vulnIndex) {
            return { ...vuln, updateStatus: newStatus };
          }
          return vuln;
        });
        return updatedVulnerabilities;
      });
    } catch (error) {
      setError(error.message);
    }
  };

  const confirmUpdate = () => {
    if (pendingUpdate) {
      handleUpdateProgress(
        pendingUpdate.reportId,
        pendingUpdate.vulnIndex,
        pendingUpdate.newStatus
      );
    }
    setShowModal(false);
    setPendingUpdate(null);
  };

  const cancelUpdate = () => {
    setShowModal(false);
    setPendingUpdate(null);
  };

  return (
    <div className="flex min-h-screen bg-gray-100 admin">
      <SidebarProvider>
        <AppSidebar onNavigate={handleNavigation} />
        <div className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Scan Summary Statistics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-gray-600 mb-1">Scans Running</label>
                <input
                  type="number"
                  name="scansRunning"
                  value={scanSummary.scansRunning}
                  onChange={handleScanSummaryChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Scans Completed</label>
                <input
                  type="number"
                  name="scansCompleted"
                  value={scanSummary.scansCompleted}
                  onChange={handleScanSummaryChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Open Vulnerabilities</label>
                <input
                  type="number"
                  name="openVulnerabilities"
                  value={scanSummary.openVulnerabilities}
                  onChange={handleScanSummaryChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Total Targets</label>
                <input
                  type="number"
                  name="totalTargets"
                  value={scanSummary.totalTargets}
                  onChange={handleScanSummaryChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>
            <button
              onClick={handleSaveScanSummary}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Save Scan Summary
            </button>
          </div>

          <ScanSummary
            scansRunning={scanSummary.scansRunning}
            totalScansCompleted={scanSummary.scansCompleted}
            openVulnerabilities={scanSummary.openVulnerabilities}
            totalTargets={scanSummary.totalTargets}
          />

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Select User</h2>
            {loading && <p className="text-gray-500">Loading...</p>}
            {error && <p className="text-red-500 bg-red-100 p-3 rounded">{error}</p>}
            {users.length > 0 ? (
              <select
                value={selectedUserId || ""}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full max-w-md p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              >
                <option value="" disabled>Select a user</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.email} ({user.companyName || "N/A"})
                  </option>
                ))}
              </select>
            ) : (
              !loading && <p className="text-gray-500">No users found.</p>
            )}
          </div>

          {selectedUserId && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">Vulnerabilities</h2>
              {loading && <p className="text-gray-500">Loading vulnerabilities...</p>}
              {error && <p className="text-red-500 bg-red-100 p-3 rounded">{error}</p>}
              {vulnerabilities.length > 0 ? (
                <div className="grid gap-6">
                  {vulnerabilities.map((vuln) => (
                    <div
                      key={`${vuln.reportId}-${vuln.vulnIndex}`}
                      className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
                    >
                      <div className="flex justify-between items-center">
                        <div className="space-y-2">
                          <p className="text-lg font-medium text-gray-800">
                            <span className="font-semibold">Bug Name:</span> {vuln.bugName || "N/A"}
                          </p>
                          <p className="text-gray-600">
                            <span className="font-semibold">Domain:</span> {vuln.domain || "N/A"}
                          </p>
                          <p className="text-gray-600">
                            <span className="font-semibold">Found Date:</span>{" "}
                            {new Date(vuln.foundDate).toLocaleDateString() || "N/A"}
                          </p>
                          <p className="text-gray-600">
                            <span className="font-semibold">Status:</span>{" "}
                            {vuln.updateStatus || "Pending"}
                          </p>
                        </div>
                        <div>
                          <select
                            value={vuln.updateStatus}
                            onChange={(e) =>
                              handleStatusChange(
                                vuln.reportId,
                                vuln.vulnIndex,
                                e.target.value
                              )
                            }
                            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Fixed">Fixed</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                !loading && <p className="text-gray-500">No vulnerabilities found for this user.</p>
              )}
            </div>
          )}
        </div>
      </SidebarProvider>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Confirm Status Update</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to mark this vulnerability as <strong>Fixed</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelUpdate}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Yes, Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}