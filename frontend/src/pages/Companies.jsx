import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  MapPin,
  IndianRupee
} from "lucide-react";
import api from "../api";
import Loader from "../components/Loader";

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [applied, setApplied] = useState([]);
  const [hasResume, setHasResume] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [
        companiesResponse,
        applicationsResponse,
        userResponse
      ] = await Promise.all([
        api.get("/companies"),
        api.get("/applications"),
        api.get("/auth/me")
      ]);

      setCompanies(companiesResponse.data);

      setApplied(
        applicationsResponse.data.map(
          (x) => x.company_name
        )
      );

      setHasResume(
        Boolean(userResponse.data.resume_path)
      );
    } catch (error) {
      console.error(
        "COMPANIES LOAD ERROR:",
        error
      );

      setMessage(
        "Could not load company information."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  async function apply(companyId, companyName) {
    setMessage("");

    // Resume check
    if (!hasResume) {
      setMessage(
        "Please upload your resume before applying."
      );

      setMessageType("error");

      return;
    }

    try {
      await api.post("/applications", {
        companyId
      });

      setApplied((prev) => [
        ...prev,
        companyName
      ]);

      setMessage(
        "Application submitted successfully."
      );

      setMessageType("success");

    } catch (err) {
      console.error(
        "APPLY ERROR:",
        err
      );

      setMessage(
        err.response?.data?.message ||
        "Could not apply."
      );

      setMessageType("error");
    }
  }

  if (loading) {
    return <Loader />;
  }

  return (
    <main className="page">

      <div className="section-title">
        <div>
          <p className="eyebrow">
            PLACEMENT DRIVES
          </p>

          <h1>Companies</h1>
        </div>
      </div>

      {!hasResume && (
        <div className="alert error">
          Please upload your resume before applying
          to any company.
        </div>
      )}

      {message && (
        <div
          className={
            messageType === "error"
              ? "alert error"
              : "alert success"
          }
        >
          {message}
        </div>
      )}

      <div className="company-grid">

        {companies.map((c) => (
          <article
            className="company-card"
            key={c.id}
          >

            <div className="company-icon">
              {c.name.charAt(0)}
            </div>

            <h2>{c.name}</h2>

            <p className="muted">
              {c.description}
            </p>

            <div className="company-meta">

              <span>
                <MapPin size={16} />
                {c.location}
              </span>

              <span>
                <IndianRupee size={16} />
                {c.package_lpa} LPA
              </span>

              <span>
                <CalendarDays size={16} />
                {new Date(
                  c.drive_date
                ).toLocaleDateString("en-IN")}
              </span>

            </div>

            <p className="eligibility">
              Minimum CGPA:{" "}
              <strong>
                {c.eligibility_cgpa}
              </strong>
            </p>

            <button
              className="primary full"
              disabled={applied.includes(c.name)}
              onClick={() =>
                apply(c.id, c.name)
              }
            >
              {applied.includes(c.name)
                ? "Applied ✓"
                : "Apply Now"}
            </button>

          </article>
        ))}

      </div>
    </main>
  );
}