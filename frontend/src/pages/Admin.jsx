import { useEffect, useState } from "react";
import api from "../api";
import Loader from "../components/Loader";

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [apps, setApps] = useState([]);
  const [form, setForm] = useState({
    name:"", description:"", location:"", packageLpa:"", eligibilityCgpa:"", driveDate:""
  });
  const [message, setMessage] = useState("");

  async function load() {
    const [s, a] = await Promise.all([
      api.get("/admin/stats"),
      api.get("/admin/applications")
    ]);
    setStats(s.data);
    setApps(a.data);
  }

  useEffect(() => { load().catch(() => setMessage("Could not load admin data.")); }, []);

  async function addCompany(e) {
    e.preventDefault();
    try {
      await api.post("/admin/companies", form);
      setMessage("Company added successfully.");
      setForm({name:"",description:"",location:"",packageLpa:"",eligibilityCgpa:"",driveDate:""});
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not add company.");
    }
  }

  async function updateStatus(id, status) {
    try {
      await api.patch(`/admin/applications/${id}`, { status });
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not update status.");
    }
  }

  if (!stats) return <Loader />;

  return (
    <main className="page">
      <div className="section-title"><div><p className="eyebrow">ADMIN PANEL</p><h1>Placement management</h1></div></div>
      {message && <div className="alert success">{message}</div>}

      <div className="stats">
        <div className="stat-card"><div><span>Students</span><strong>{stats.students}</strong></div></div>
        <div className="stat-card"><div><span>Companies</span><strong>{stats.companies}</strong></div></div>
        <div className="stat-card"><div><span>Applications</span><strong>{stats.applications}</strong></div></div>
        <div className="stat-card"><div><span>Selected</span><strong>{stats.selected}</strong></div></div>
      </div>

      <section className="admin-grid">
        <div className="table-card">
          <div className="card-heading"><h2>Applications</h2></div>
          <table>
            <thead><tr><th>Student</th><th>Company</th><th>Status</th></tr></thead>
            <tbody>{apps.map(a => (
              <tr key={a.id}>
                <td><strong>{a.student_name}</strong><small className="block">{a.email}</small></td>
                <td>{a.company_name}</td>
                <td>
                  <select value={a.status} onChange={e => updateStatus(a.id, e.target.value)}>
                    <option>Applied</option><option>Shortlisted</option><option>Selected</option><option>Rejected</option>
                  </select>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        <div className="form-card">
          <h2>Add company</h2>
          <form onSubmit={addCompany}>
            <label>Company name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
            <label>Description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
            <label>Location<input required value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></label>
            <div className="two-col">
              <label>Package LPA<input type="number" step="0.01" required value={form.packageLpa} onChange={e=>setForm({...form,packageLpa:e.target.value})}/></label>
              <label>Min CGPA<input type="number" step="0.01" required value={form.eligibilityCgpa} onChange={e=>setForm({...form,eligibilityCgpa:e.target.value})}/></label>
            </div>
            <label>Drive date<input type="date" required value={form.driveDate} onChange={e=>setForm({...form,driveDate:e.target.value})}/></label>
            <button className="primary full">Add Company</button>
          </form>
        </div>
      </section>
    </main>
  );
}
