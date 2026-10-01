import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import api from "../api";
import Loader from "../components/Loader";

export default function Applications() {
  const [applications, setApplications] = useState(null);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      setMessage("");

      const { data } = await api.get("/applications");

      console.log("APPLICATIONS DATA:", data);

      setApplications(data);
    } catch (err) {
      console.error("APPLICATIONS LOAD ERROR:", err);

      setApplications([]);

      setMessage(
        err.response?.data?.message ||
        "Could not load applications."
      );
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function withdraw(id) {
    if (!window.confirm("Withdraw this application?")) return;

    try {
      await api.delete(`/applications/${id}`);

      setMessage("Application withdrawn successfully.");

      await load();
    } catch (err) {
      console.error("WITHDRAW ERROR:", err);

      setMessage(
        err.response?.data?.message ||
        "Could not withdraw application."
      );
    }
  }

  if (!applications) {
    return <Loader />;
  }

  return (
    <main className="page">
      <div className="section-title">
        <div>
          <p className="eyebrow">MY ACTIVITY</p>
          <h1>Applications</h1>
        </div>
      </div>

      {message && (
        <div className="alert success">
          {message}
        </div>
      )}

      <div className="table-card">
        {applications.length === 0 ? (
          <div className="empty">
            No applications found.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Location</th>
                <th>Package</th>
                <th>Applied</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {applications.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.company_name}</strong>
                  </td>

                  <td>
                    {a.location}
                  </td>

                  <td>
                    ₹{a.package_lpa} LPA
                  </td>

                  <td>
                    {new Date(a.applied_at).toLocaleDateString("en-IN")}
                  </td>

                  <td>
                    <span
                      className={`badge ${a.status
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      {a.status}
                    </span>
                  </td>

                  <td>
                    <button
                      className="danger-icon"
                      onClick={() => withdraw(a.id)}
                      title="Withdraw"
                    >
                      <Trash2 size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}