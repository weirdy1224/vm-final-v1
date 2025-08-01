"use client";
import React, { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "../Navbar/Navbar.jsx"; // Fixed to default import
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./upload.css";

export default function Reports() {
  const navigate = useNavigate();
  const [view, setView] = useState("options");
  const [manualData, setManualData] = useState({
    domain: "",
    vulnerabilities: [],
    userId: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/users", {
        withCredentials: true,
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUploadMessage("Failed to fetch users.");
    }
  };

  const resetForm = () => {
    setManualData({ domain: "", vulnerabilities: [], userId: "" });
    setSelectedFile(null);
    setFileName("");
    setUploadMessage("");
  };

  const addVulnerability = () => {
    setManualData((prev) => ({
      ...prev,
      vulnerabilities: [
        ...prev.vulnerabilities,
        {
          bug_name: "",
          severity: "",
          location: "",
          description: "",
          cvss_score: "",
          ip_address: "",
          year: "",
          impact: [""],
          proof_of_concept: [],
          remediation: [""],
          image: "",
        },
      ],
    }));
  };

  const handleInputChange = (index, field, value, subIndex = null) => {
    setManualData((prev) => {
      const newVulns = [...prev.vulnerabilities];
      if (subIndex !== null) newVulns[index][field][subIndex] = value;
      else newVulns[index][field] = value;
      return { ...prev, vulnerabilities: newVulns };
    });
  };

  const handlePOCChange = (index, pocIndex, field, value) => {
    setManualData((prev) => {
      const newVulns = [...prev.vulnerabilities];
      newVulns[index].proof_of_concept[pocIndex][field] = value;
      return { ...prev, vulnerabilities: newVulns };
    });
  };

  const addSubField = (index, field) => {
    setManualData((prev) => {
      const newVulns = [...prev.vulnerabilities];
      const lastItem =
        newVulns[index][field][newVulns[index][field].length - 1];
      if (field === "proof_of_concept" && (!lastItem || lastItem.step !== ""))
        newVulns[index][field].push({ step: "", image: "" });
      else if (lastItem?.trim() !== "") newVulns[index][field].push("");
      return { ...prev, vulnerabilities: newVulns };
    });
  };

  const handleImageUpload = async (event, index, pocIndex = null) => {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/upload-image",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );
      setManualData((prev) => {
        const newVulns = [...prev.vulnerabilities];
        if (pocIndex !== null)
          newVulns[index].proof_of_concept[pocIndex].image = res.data.imageUrl;
        else newVulns[index].image = res.data.imageUrl;
        return { ...prev, vulnerabilities: newVulns };
      });
    } catch (error) {
      console.error("Image upload error:", error);
      alert("Failed to upload image.");
    }
  };

  const handleSaveReport = async () => {
    if (!manualData.userId) return alert("Please select a user.");

    const token = localStorage.getItem("token");
    if (!token) {
      return alert("No authentication token found. Please log in.");
    }

    setIsLoading(true);

    try {
      await axios.post("http://localhost:5000/api/save-report", manualData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      alert("Report saved successfully!");
      setView("options");
      resetForm();
    } catch (error) {
      console.error("Save report error:", error);
      alert(
        `Error saving report: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setFileName(file.name);
      setUploadMessage("");
    } else {
      setSelectedFile(null);
      setFileName("");
      setUploadMessage("Please select a valid PDF.");
    }
  };

  const handleFileUpload = async () => {
    const userId = manualData.userId;
    const token = localStorage.getItem("token");

    if (!selectedFile || !userId) {
      return alert("Please select a PDF and ensure the user is logged in.");
    }

    if (!token) {
      return alert("No authentication token found. Please log in.");
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("userId", userId);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      alert("PDF uploaded successfully!");
      setUploadMessage(res.data.message);
      setView("options");
      resetForm();
    } catch (error) {
      console.error(
        "File upload error:",
        error.response?.data,
        error.response?.status
      );
      alert(
        `Error uploading file: ${error.response?.data?.message || error.message
        }`
      );
      setUploadMessage("Error uploading file.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <SidebarProvider>
        <AppSidebar onNavigate={navigate} />
        <div className="container flex-1 p-6">
          {view === "options" && (
            <div className="options-container">
              <button
                className="option-button"
                onClick={() => setView("manual")}
              >
                Manual Entry
              </button>
              <button
                className="option-button"
                onClick={() => setView("upload")}
              >
                Upload PDF
              </button>
            </div>
          )}

          {view === "manual" && (
            <div className="manual-form">
              <h1 className="report-title">Vulnerability Report</h1>
              <select
                value={manualData.userId}
                onChange={(e) =>
                  setManualData({ ...manualData, userId: e.target.value })
                }
                className="form-input"
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.companyName}
                  </option>

                ))}
              </select>
              <input
                type="text"
                value={manualData.domain}
                onChange={(e) =>
                  setManualData({ ...manualData, domain: e.target.value })
                }
                className="form-input"
                placeholder="Domain"
              />
              <button onClick={addVulnerability} className="add-button">
                + Add Vulnerability
              </button>

              {manualData.vulnerabilities.map((vuln, index) => (
                <div key={index} className="vulnerability-card">
                  <input
                    type="text"
                    value={vuln.bug_name}
                    onChange={(e) =>
                      handleInputChange(index, "bug_name", e.target.value)
                    }
                    className="form-input"
                    placeholder="Bug Name"
                  />
                  <input
                    type="text"
                    value={vuln.severity}
                    onChange={(e) =>
                      handleInputChange(index, "severity", e.target.value)
                    }
                    className="form-input"
                    placeholder="Severity"
                  />
                  <input
                    type="text"
                    value={vuln.location}
                    onChange={(e) =>
                      handleInputChange(index, "location", e.target.value)
                    }
                    className="form-input"
                    placeholder="Location"
                  />
                  <textarea
                    value={vuln.description}
                    onChange={(e) =>
                      handleInputChange(index, "description", e.target.value)
                    }
                    className="form-textarea"
                    placeholder="Description"
                  />
                  {vuln.image && (
                    <img
                      src={vuln.image}
                      alt={`Vuln ${index + 1}`}
                      className="poc-image"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, index)}
                    className="file-upload-input"
                  />
                  {vuln.impact.map((impact, i) => (
                    <input
                      key={i}
                      type="text"
                      value={impact}
                      onChange={(e) =>
                        handleInputChange(index, "impact", e.target.value, i)
                      }
                      className="form-input"
                      placeholder="Impact"
                    />
                  ))}
                  <button
                    onClick={() => addSubField(index, "impact")}
                    className="add-impact-button"
                  >
                    + Add Impact
                  </button>
                  {vuln.proof_of_concept.map((poc, i) => (
                    <div key={i}>
                      <input
                        type="text"
                        value={poc.step}
                        onChange={(e) =>
                          handlePOCChange(index, i, "step", e.target.value)
                        }
                        className="form-input"
                        placeholder="POC Step"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, index, i)}
                        className="file-upload-input"
                      />
                      {poc.image && (
                        <img
                          src={poc.image}
                          alt={`POC ${i + 1}`}
                          className="poc-image"
                        />
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addSubField(index, "proof_of_concept")}
                    className="add-poc-button"
                  >
                    + Add POC
                  </button>
                  {vuln.remediation.map((remedy, i) => (
                    <input
                      key={i}
                      type="text"
                      value={remedy}
                      onChange={(e) =>
                        handleInputChange(
                          index,
                          "remediation",
                          e.target.value,
                          i
                        )
                      }
                      className="form-input"
                      placeholder="Remediation"
                    />
                  ))}
                  <button
                    onClick={() => addSubField(index, "remediation")}
                    className="add-remediation-button"
                  >
                    + Add Remediation
                  </button>
                </div>
              ))}
              <button
                onClick={handleSaveReport}
                className="submit-button"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Report"}
              </button>
              <button
                onClick={() => setView("options")}
                className="back-button"
              >
                Back
              </button>
            </div>
          )}

          {view === "upload" && (
            <div className="upload-container">
              <h1 className="upload-title">Upload PDF Report</h1>
              <select
                value={manualData.userId}
                onChange={(e) =>
                  setManualData({ ...manualData, userId: e.target.value })
                }
                className="form-input"
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.companyName}
                  </option>

                ))}
              </select>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="file-upload"
                id="pdf-upload"
                disabled={isLoading}
              />
              <label htmlFor="pdf-upload" className="file-upload-label">
                {isLoading ? "Uploading..." : "Choose File"}
              </label>
              {fileName && (
                <p className="file-name">Selected File: {fileName}</p>
              )}
              <button
                onClick={handleFileUpload}
                className="submit-button"
                disabled={isLoading}
              >
                {isLoading ? "Uploading..." : "Upload"}
              </button>
              {uploadMessage && (
                <p className="upload-message">{uploadMessage}</p>
              )}
              <button
                onClick={() => setView("options")}
                className="back-button"
                disabled={isLoading}
              >
                Back
              </button>
            </div>
          )}
        </div>
      </SidebarProvider>
    </div>
  );
}
