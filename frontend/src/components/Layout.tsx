import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type LayoutProps = {
  children: ReactNode;
};

const navClasses = ({ isActive }: { isActive: boolean }) =>
  isActive ? "nav-link active" : "nav-link";

export const Layout = ({ children }: LayoutProps) => {
  const { role, setRole, name, setName } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="dot"></span>
          <div>
            <div className="brand-name">Pulse Tickets</div>
            <div className="brand-sub">Book buses, shows, or clinics</div>
          </div>
        </div>
        <nav className="nav">
          <NavLink to="/" className={navClasses} end>
            Shows
          </NavLink>
          <NavLink to="/admin" className={navClasses}>
            Admin
          </NavLink>
        </nav>
        <div className="topbar-actions">
          <div className="role-toggle" role="group" aria-label="Switch role">
            <button
              className={role === "user" ? "pill active" : "pill"}
              onClick={() => setRole("user")}
            >
              User
            </button>
            <button
              className={role === "admin" ? "pill active" : "pill"}
              onClick={() => setRole("admin")}
            >
              Admin
            </button>
          </div>
          <input
            className="name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>
      </header>
      <main className="page-container">{children}</main>
    </div>
  );
};
