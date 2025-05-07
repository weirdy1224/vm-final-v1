import React, { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "../Navbar/Navbar.jsx"; // Make sure this is a default export
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./client.css"; // Ensure this file exists or remove if not needed

export default function Clients() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      alert(
        `Error fetching users: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const openPopup = (user) => {
    setSelectedUser(user);
  };

  const closePopup = () => {
    setSelectedUser(null);
  };

  return (
    <div className="flex min-h-screen">
      <SidebarProvider>
        <AppSidebar onNavigate={handleNavigation} />
        <div className="container flex-1 p-6">
          <h1 className="page-title text-2xl font-bold mb-4">Users</h1>

          {loading ? (
            <p>Loading users...</p>
          ) : users.length === 0 ? (
            <p className="no-users">No clients found.</p>
          ) : (
            <div className="users-table overflow-x-auto">
              <table className="table-auto w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Company Name</th>
                    <th className="px-4 py-2 text-left">PIC Name</th>
                    <th className="px-4 py-2 text-left">Contact</th>
                    <th className="px-4 py-2 text-left">Website</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => openPopup(user)}
                    >
                      <td className="px-4 py-2">{user.companyName}</td>
                      <td className="px-4 py-2">{user.picName}</td>
                      <td className="px-4 py-2">{user.picContact}</td>
                      <td className="px-4 py-2">
                        <a
                          href={user.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {user.website}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    {selectedUser.companyName}
                  </h2>
                  <button
                    onClick={closePopup}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="space-y-2">
                  <p>
                    <strong>Industry:</strong> {selectedUser.industry}
                  </p>
                  <p>
                    <strong>PIC Name:</strong> {selectedUser.picName}
                  </p>
                  <p>
                    <strong>Designation:</strong> {selectedUser.picDesignation}
                  </p>
                  <p>
                    <strong>Contact:</strong> {selectedUser.picContact}
                  </p>
                  <p>
                    <strong>Website:</strong>{" "}
                    <a
                      href={selectedUser.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {selectedUser.website}
                    </a>
                  </p>
                  <p>
                    <strong>Profile Link:</strong>{" "}
                    <a
                      href={selectedUser.profileLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {selectedUser.profileLink}
                    </a>
                  </p>
                  <p>
                    <strong>Unique ID:</strong> {selectedUser._id}
                  </p>
                  <p>
                    <strong>Created At:</strong>{" "}
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={closePopup}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarProvider>
    </div>
  );
}
