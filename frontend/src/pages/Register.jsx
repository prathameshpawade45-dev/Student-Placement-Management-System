import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Register({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", course: "B.Tech AIDS", year: "3rd Year"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      onLogin(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card wide">
        <div className="auth-logo">PlacementHub</div>
        <h1>Create student account</h1>
        <p className="muted">Enter your details to start applying.</p>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={submit} className="form-grid">
          <label>Full name<input name="name" required value={form.name} onChange={update} /></label>
          <label>Email<input name="email" type="email" required value={form.email} onChange={update} /></label>
          <label>Password<input name="password" type="password" minLength="6" required value={form.password} onChange={update} /></label>
          <label>Phone<input name="phone" value={form.phone} onChange={update} /></label>
          <label>Course
            <select name="course" value={form.course} onChange={update}>
              <option>B.Tech AIDS</option>
              <option>B.Tech CSE</option>
              <option>B.Tech AIML</option>
              <option>BCA</option>
              <option>B.Sc IT</option>
            </select>
          </label>
          <label>Year
            <select name="year" value={form.year} onChange={update}>
              <option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option>
            </select>
          </label>
          <button className="primary full form-submit" disabled={loading}>{loading ? "Creating..." : "Create Account"}</button>
        </form>

        <p className="switch">Already registered? <Link to="/login">Login</Link></p>
      </section>
    </main>
  );
}
