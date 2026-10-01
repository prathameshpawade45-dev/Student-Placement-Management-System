import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      onLogin(data);
      navigate(data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-logo">PlacementHub</div>
        <h1>Welcome back</h1>
        <p className="muted">Login to manage your placement journey.</p>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={submit}>
          <label>Email<input type="email" required value={form.email} onChange={e => setForm({...form, email:e.target.value})} /></label>
          <label>Password<input type="password" required value={form.password} onChange={e => setForm({...form, password:e.target.value})} /></label>
          <button className="primary full" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
        </form>

        <p className="switch">Don't have an account? <Link to="/register">Create account</Link></p>
      </section>
    </main>
  );
}
