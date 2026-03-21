import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { setToken } from "../lib/auth";

export default function SignInPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setToken(data.token || "");
      navigate("/profile");
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return (
    <section className="card">
      <h2>Sign In</h2>
      <p className="subtle">Use your account credentials to continue.</p>

      <form className="form-grid" onSubmit={onSubmit}>
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
            placeholder="Your password"
            required
          />
        </label>

        <button type="submit">Sign In</button>
      </form>

      {error && <p className="error-text">{error}</p>}

      <p className="subtle">
        New here? <Link to="/signup">Create account</Link>
      </p>
    </section>
  );
}
