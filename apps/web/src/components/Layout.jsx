import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { isAuthenticated } from "../lib/auth";
import { apiRequest } from "../lib/api";
import { getUnreadNotificationCount } from "../lib/notifications";

function NavLink({ to, children }) {
  const location = useLocation();
  const active =
    location.pathname === to ||
    (to !== "/" && location.pathname.startsWith(`${to}/`));

  return (
    <Link className={active ? "nav-link active" : "nav-link"} to={to}>
      {children}
    </Link>
  );
}

export default function Layout({ children }) {
  const loggedIn = isAuthenticated();
  const location = useLocation();
  const [role, setRole] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function loadRole() {
      if (!loggedIn) {
        setRole("");
        setUnreadCount(0);
        return;
      }

      try {
        const [me, unread] = await Promise.all([
          apiRequest("/auth/me", { method: "GET" }),
          getUnreadNotificationCount(),
        ]);

        setRole(me.profile?.role || "");
        setUnreadCount(unread);
      } catch (error) {
        setRole("");
        setUnreadCount(0);
      }
    }

    loadRole();
  }, [loggedIn, location.pathname]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>Entrepreneur Pitching and Matching</h1>
          <p>Authentication and profile management</p>
        </div>
        <nav className="topnav">
          {!loggedIn && <NavLink to="/signup">Sign Up</NavLink>}
          {!loggedIn && <NavLink to="/signin">Sign In</NavLink>}
          {loggedIn && <NavLink to="/profile">Profile</NavLink>}
          {loggedIn && role === "entrepreneur" && <NavLink to="/pitches/new">New Pitch</NavLink>}
          {loggedIn && role === "entrepreneur" && <NavLink to="/pitches/my">My Pitches</NavLink>}
          {loggedIn && (role === "investor" || role === "admin") && (
            <NavLink to="/pitches/browse">Browse Pitches</NavLink>
          )}
          {loggedIn && (role === "investor" || role === "admin") && (
            <NavLink to="/matches">Matches</NavLink>
          )}
          {loggedIn && <NavLink to="/messages">Messages</NavLink>}
          {loggedIn && (
            <NavLink to="/notifications">
              Notifications
              {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
            </NavLink>
          )}
          {loggedIn && <NavLink to="/logout">Logout</NavLink>}
        </nav>
      </header>
      <main className="page-wrap">{children}</main>
    </div>
  );
}
