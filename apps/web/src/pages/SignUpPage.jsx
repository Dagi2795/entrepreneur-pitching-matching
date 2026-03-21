import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";

export default function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "entrepreneur",
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    setStatus("");
    setError("");

    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setStatus("Account created successfully. Please sign in.");
      setTimeout(() => navigate("/signin"), 800);
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return (
    <section className="card">
      <h2>Create Account</h2>
      <p className="subtle">Create your account to access your profile dashboard.</p>

      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          Full name
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your full name"
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="At least 8 characters"
            required
          />
        </label>

        <label>
          Role
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="entrepreneur">Entrepreneur</option>
            <option value="investor">Investor</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <button type="submit">Sign Up</button>
      </form>

      {status && <p className="ok-text">{status}</p>}
      {error && <p className="error-text">{error}</p>}

      <p className="subtle">
        Already have an account? <Link to="/signin">Go to Sign In</Link>
      </p>
    </section>
  );
}
