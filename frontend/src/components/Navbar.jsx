import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BriefcaseBusiness,
  LayoutDashboard,
  LogOut,
  Users,
  Building2,
  FileText
} from "lucide-react";

export default function Navbar({ user, logout }) {
  const location = useLocation();

  // Prevent error if user is not loaded yet
  if (!user) {
    return null;
  }

  const nav = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard
    },
    {
      to: "/companies",
      label: "Companies",
      icon: Building2
    },
    {
      to: "/applications",
      label: "Applications",
      icon: BriefcaseBusiness
    },
    {
      to: "/resume",
      label: "My Resume",
      icon: FileText
    }
  ];

  if (user.role === "admin") {
    nav.push({
      to: "/admin",
      label: "Admin",
      icon: Users
    });
  }

  return (
    <header className="navbar">
      <Link className="brand" to="/dashboard">
        Placement<span>Hub</span>
      </Link>

      <nav>
        {nav.map(({ to, label, icon: Icon }) => (
          <Link
            className={
              location.pathname === to
                ? "nav-link active"
                : "nav-link"
            }
            to={to}
            key={to}
          >
            <Icon size={17} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="nav-user">
        <div>
          <strong>{user.name || "Student"}</strong>
          <small>{user.role || "student"}</small>
        </div>

        <button
          className="icon-btn"
          onClick={logout}
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}