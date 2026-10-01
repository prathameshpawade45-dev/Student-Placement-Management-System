import React, { useEffect, useState } from "react";
import { Upload, FileText, ExternalLink } from "lucide-react";
import api from "../api";

export default function Resume() {
  const [file, setFile] = useState(null);
  const [resume, setResume] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadResume();
  }, []);

  async function loadResume() {
    try {
      const { data } = await api.get("/auth/me");
      setResume(data.resume_path || null);
    } catch (err) {
      console.error("RESUME LOAD ERROR:", err);
    }
  }

  function handleFileChange(e) {
    const selectedFile = e.target.files[0];

    setMessage("");
    setError("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      setFile(null);
      setError("Only PDF files are allowed.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setFile(null);
      setError("Resume must be 5 MB or smaller.");
      return;
    }

    setFile(selectedFile);
  }

  async function uploadResume() {
    if (!file) {
      setError("Please select a PDF resume first.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setError("");

      const formData = new FormData();
      formData.append("resume", file);

      const { data } = await api.post(
        "/resume",
        formData
      );

      setResume(data.resume);
      setMessage("Resume uploaded successfully.");
      setFile(null);

    } catch (err) {
      console.error("RESUME UPLOAD ERROR:", err);

      setError(
        err.response?.data?.message ||
        "Could not upload resume."
      );
    } finally {
      setLoading(false);
    }
  }

  const resumeUrl = resume
    ? `http://localhost:5000${resume}`
    : null;

  return (
    <main className="page">
      <div className="section-title">
        <div>
          <p className="eyebrow">DOCUMENTS</p>
          <h1>My Resume</h1>
        </div>
      </div>

      <div className="table-card resume-card">

        <div className="resume-icon">
          <FileText size={40} />
        </div>

        <h2>Upload Your Resume</h2>

        <p className="muted">
          Upload your latest resume in PDF format.
        </p>

        <p className="muted">
          Maximum file size: 5 MB
        </p>

        <div className="resume-upload-box">
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
          />

          {file && (
            <p className="selected-file">
              Selected: <strong>{file.name}</strong>
            </p>
          )}

          <button
            className="primary"
            onClick={uploadResume}
            disabled={loading || !file}
          >
            <Upload size={18} />

            {loading
              ? "Uploading..."
              : "Upload Resume"}
          </button>
        </div>

        {message && (
          <div className="alert success">
            {message}
          </div>
        )}

        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        {resume && (
          <div className="current-resume">
            <div>
              <strong>Current Resume</strong>

              <p className="muted">
                Your resume is uploaded successfully.
              </p>
            </div>

            <a
              href={resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="primary resume-view-btn"
            >
              <ExternalLink size={17} />
              View Resume
            </a>
          </div>
        )}

      </div>
    </main>
  );
}