import React from "react";
import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import api from "./api";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import Applications from "./pages/Applications";
import Admin from "./pages/Admin";
import Resume from "./pages/Resume";

function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem("placement_token");
  const user = JSON.parse(
    localStorage.getItem("placement_user") || "null"
  );

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (
    adminOnly &&
    user.role !== "admin"
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}

export default function App() {
  const [user, setUser] = useState(
    JSON.parse(
      localStorage.getItem(
        "placement_user"
      ) || "null"
    )
  );

  useEffect(() => {
    const token =
      localStorage.getItem(
        "placement_token"
      );

    if (!token) return;

    api
      .get("/auth/me")
      .then(({ data }) => {
        setUser(data);

        localStorage.setItem(
          "placement_user",
          JSON.stringify(data)
        );
      })
      .catch(() => {
        localStorage.removeItem(
          "placement_token"
        );

        localStorage.removeItem(
          "placement_user"
        );

        setUser(null);
      });
  }, []);

  function handleLogin(data) {
    localStorage.setItem(
      "placement_token",
      data.token
    );

    localStorage.setItem(
      "placement_user",
      JSON.stringify(data.user)
    );

    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem(
      "placement_token"
    );

    localStorage.removeItem(
      "placement_user"
    );

    setUser(null);
  }

  return (
    <>
      {user && (
        <Navbar
          user={user}
          logout={logout}
        />
      )}

      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to={
                user
                  ? "/dashboard"
                  : "/login"
              }
              replace
            />
          }
        />

        <Route
          path="/login"
          element={
            <Login
              onLogin={handleLogin}
            />
          }
        />

        <Route
          path="/register"
          element={
            <Register
              onLogin={handleLogin}
            />
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/companies"
          element={
            <ProtectedRoute>
              <Companies />
            </ProtectedRoute>
          }
        />

        <Route
          path="/applications"
          element={
            <ProtectedRoute>
              <Applications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/resume"
          element={
            <ProtectedRoute>
              <Resume />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <Admin />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </>
  );
}