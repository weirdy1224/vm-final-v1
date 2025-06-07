"use client";
import React, { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "./Navbar/Navbar.jsx";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);

  const handleNavigation = (path) => {
    navigate(path);
  };

  // Fetch all users
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

  // Fetch vulnerabilities for the selected user
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

  // Handle status change with confirmation for "Fixed"
  const handleStatusChange = (reportId, vulnIndex, newStatus) => {
    if (newStatus === "Fixed") {
      setPendingUpdate({ reportId, vulnIndex, newStatus });
      setShowModal(true);
    } else {
      handleUpdateProgress(reportId, vulnIndex, newStatus);
    }
  };

  // Update progress state for a vulnerability
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

      // Log current state before update
      console.log("Current vulnerabilities state:", vulnerabilities);

      // Update local state by creating a new array
      setVulnerabilities((prev) => {
        const updatedVulnerabilities = prev.map((vuln) => {
          if (vuln.reportId === reportId && vuln.vulnIndex === vulnIndex) {
            return { ...vuln, updateStatus: newStatus };
          }
          return vuln;
        });
        console.log("Updated vulnerabilities state:", updatedVulnerabilities);
        return updatedVulnerabilities;
      });
    } catch (error) {
      setError(error.message);
    }
  };

  // Confirm the "Fixed" status update
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

  // Cancel the update
  const cancelUpdate = () => {
    setShowModal(false);
    setPendingUpdate(null);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarProvider>
        <AppSidebar onNavigate={handleNavigation} />
        <div className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

          {/* Users List */}
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

          {/* Vulnerabilities List */}
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

      {/* Confirmation Modal */}
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