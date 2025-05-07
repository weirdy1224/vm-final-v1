"use client";
import * as React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "../Navbar/Navbar.jsx";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./user.css";

export default function User() {
  const [option, setOption] = React.useState("");
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [users, setUsers] = React.useState([]);
  const [formData, setFormData] = React.useState({
    companyName: "",
    industry: "",
    picName: "",
    picDesignation: "",
    picContact: "",
    website: "",
    profileLink: "",
  });
  const [loginFormData, setLoginFormData] = React.useState({
    email: "",
    password: "",
    role: "client",
  });

  const navigate = useNavigate();

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/users");
      setUsers(response.data);
    } catch (error) {
      alert(
        `Error fetching users: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleOptionChange = (value) => {
    setOption(value);
    setSelectedUser(null);
    setFormData({
      companyName: "",
      industry: "",
      picName: "",
      picDesignation: "",
      picContact: "",
      website: "",
      profileLink: "",
    });
    setLoginFormData({
      email: "",
      password: "",
      role: "client",
    });
  };

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleLoginInputChange = (e) =>
    setLoginFormData({ ...loginFormData, [e.target.name]: e.target.value });

  const handleAddUser = async () => {
    const required = {
      ...formData,
      ...loginFormData,
    };

    if (Object.values(required).some((val) => !val)) {
      alert("All fields are required!");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/users", {
        ...formData,
        ...loginFormData,
      });

      const { token, user } = response.data;
      localStorage.setItem("authToken", token);
      alert(`User registered successfully! Welcome, ${user.companyName}.`);
      fetchUsers();
      handleOptionChange("add"); // Reset forms
    } catch (error) {
      alert(
        `Error registering user: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleModifyUser = async () => {
    if (!selectedUser) return alert("Please select a user to modify.");
    try {
      await axios.put(
        `http://localhost:5000/api/users/${selectedUser._id}`,
        formData
      );
      alert("User modified successfully!");
      fetchUsers();
      handleOptionChange("modify");
    } catch (error) {
      alert(
        `Error modifying user: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return alert("Please select a user to delete.");
    try {
      await axios.delete(`http://localhost:5000/api/users/${selectedUser._id}`);
      alert("User deleted successfully!");
      fetchUsers();
      handleOptionChange("delete");
    } catch (error) {
      alert(
        `Error deleting user: ${error.response?.data?.message || error.message}`
      );
    }
  };

  return (
    <div className="flex min-h-screen">
      <SidebarProvider>
        <AppSidebar onNavigate={handleNavigation} />
        <div className="container flex-1 p-6">
          <h1 className="title">What would you like to do?</h1>
          <div className="options-container">
            <div className="option-cards">
              {["add", "modify", "delete"].map((action) => (
                <div
                  key={action}
                  className={`option-card ${
                    option === action ? "selected" : ""
                  }`}
                  onClick={() => handleOptionChange(action)}
                >
                  <span className="option-icon">
                    {action === "add"
                      ? "➕"
                      : action === "modify"
                      ? "✏️"
                      : "🗑️"}
                  </span>
                  <span className="option-text">
                    {action.charAt(0).toUpperCase() + action.slice(1)} a User
                  </span>
                </div>
              ))}
            </div>
          </div>

          {option === "add" && (
            <div className="form-container">
              <div className="form-grid">
                {Object.keys(formData).map((key) => (
                  <div key={key} className="form-group">
                    <label className="form-label">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </label>
                    <input
                      type="text"
                      name={key}
                      value={formData[key]}
                      placeholder={key.replace(/([A-Z])/g, " $1").trim()}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                ))}
                {["email", "password", "role"].map((key) =>
                  key === "role" ? (
                    <div key={key} className="form-group">
                      <label className="form-label">Role</label>
                      <select
                        name="role"
                        value={loginFormData.role}
                        onChange={handleLoginInputChange}
                        className="form-input"
                      >
                        <option value="client">Client</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  ) : (
                    <div key={key} className="form-group">
                      <label className="form-label">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </label>
                      <input
                        type={key === "email" ? "email" : "password"}
                        name={key}
                        value={loginFormData[key]}
                        placeholder={`Enter ${key}`}
                        onChange={handleLoginInputChange}
                        className="form-input"
                      />
                    </div>
                  )
                )}
              </div>
              <button onClick={handleAddUser} className="submit-button">
                Add User
              </button>
            </div>
          )}

          {option === "modify" && (
            <div className="form-container">
              <h2 className="subtitle">Select a user to modify:</h2>
              <select
                value={selectedUser?._id || ""}
                onChange={(e) => {
                  const user = users.find((u) => u._id === e.target.value);
                  setSelectedUser(user || null);
                  setFormData(
                    user || {
                      companyName: "",
                      industry: "",
                      picName: "",
                      picDesignation: "",
                      picContact: "",
                      website: "",
                      profileLink: "",
                    }
                  );
                }}
                className="select-input"
              >
                <option value="" disabled>
                  Select User
                </option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.companyName}
                  </option>
                ))}
              </select>
              {selectedUser && (
                <div className="form-grid">
                  {Object.keys(formData).map((key) => (
                    <div key={key} className="form-group">
                      <label className="form-label">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </label>
                      <input
                        type="text"
                        name={key}
                        value={formData[key]}
                        onChange={handleInputChange}
                        className="form-input"
                      />
                    </div>
                  ))}
                  <p className="form-label">Unique ID: {selectedUser._id}</p>
                  <button onClick={handleModifyUser} className="submit-button">
                    Modify User
                  </button>
                </div>
              )}
            </div>
          )}

          {option === "delete" && (
            <div className="form-container">
              <h2 className="subtitle">Select a user to delete:</h2>
              <select
                value={selectedUser?._id || ""}
                onChange={(e) => {
                  const user = users.find((u) => u._id === e.target.value);
                  setSelectedUser(user || null);
                }}
                className="select-input"
              >
                <option value="" disabled>
                  Select User
                </option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.companyName}
                  </option>
                ))}
              </select>
              {selectedUser && (
                <>
                  <p className="form-label">Unique ID: {selectedUser._id}</p>
                  <button onClick={handleDeleteUser} className="delete-button">
                    Confirm Deletion
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </SidebarProvider>
    </div>
  );
}
