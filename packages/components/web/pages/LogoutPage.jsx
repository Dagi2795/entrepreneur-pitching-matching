import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { setToken } from "../lib/auth";

export default function LogoutPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Signing you out...");

  useEffect(() => {
    async function runLogout() {
      try {
        await apiRequest("/auth/logout", { method: "POST" });
      } catch (error) {
        // Always clear local token even if API session already expired.
      } finally {
        setToken("");
        setMessage("You are signed out.");
        setTimeout(() => navigate("/signin"), 500);
      }
    }

    runLogout();
  }, [navigate]);

  return (
    <section className="card">
      <h2>Logout</h2>
      <p className="subtle">{message}</p>
    </section>
  );
}
