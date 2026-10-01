import React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Briefcase, CheckCircle2, Clock3 } from "lucide-react";
import api from "../api";
import Loader from "../components/Loader";

export default function Dashboard({ user }) {
  const [applications, setApplications] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/applications"), api.get("/companies")])
      .then(([a, c]) => {
        setApplications(a.data);
        setCompanies(c.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const selected = applications.filter(a => a.status === "Selected").length;
  const shortlisted = applications.filter(a => a.status === "Shortlisted").length;

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">STUDENT PORTAL</p>
          <h1>Hello, {user.name.split(" ")[0]} 👋</h1>
          <p>Track companies, applications and your placement progress from one place.</p>
        </div>
        <Link className="primary" to="/companies">Explore Companies <ArrowRight size={18}/></Link>
      </section>

      <div className="stats">
        <div className="stat-card"><Briefcase/><div><span>Applications</span><strong>{applications.length}</strong></div></div>
        <div className="stat-card"><Clock3/><div><span>Shortlisted</span><strong>{shortlisted}</strong></div></div>
        <div className="stat-card"><CheckCircle2/><div><span>Selected</span><strong>{selected}</strong></div></div>
        <div className="stat-card"><Briefcase/><div><span>Open Drives</span><strong>{companies.length}</strong></div></div>
      </div>

      <section className="section-head"><h2>Recent applications</h2><Link to="/applications">View all</Link></section>

      <div className="table-card">
        {applications.length === 0 ? (
          <div className="empty">No applications yet. <Link to="/companies">Browse companies</Link></div>
        ) : (
          <table>
            <thead><tr><th>Company</th><th>Location</th><th>Package</th><th>Status</th></tr></thead>
            <tbody>
              {applications.slice(0, 5).map(a => (
                <tr key={a.id}>
                  <td><strong>{a.company_name}</strong></td>
                  <td>{a.location}</td>
                  <td>₹{a.package_lpa} LPA</td>
                  <td><span className={`badge ${a.status.toLowerCase()}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
