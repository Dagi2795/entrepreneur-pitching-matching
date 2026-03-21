import { Link, useLocation } from "react-router-dom";
import { isAuthenticated } from "../lib/auth";

function NavLink({ to, children }) {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link className={active ? "nav-link active" : "nav-link"} to={to}>
      {children}
    </Link>
  );
}

export default function Layout({ children }) {
  const loggedIn = isAuthenticated();

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
          {loggedIn && <NavLink to="/logout">Logout</NavLink>}
        </nav>
      </header>
      <main className="page-wrap">{children}</main>
    </div>
  );
}
