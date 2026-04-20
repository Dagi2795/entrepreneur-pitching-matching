import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { apiRequest } from "../lib/api";

export default function PitchMyPage() {
  const [role, setRole] = useState("");
  const [loadingRole, setLoadingRole] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pitches, setPitches] = useState([]);

  async function loadMyPitches() {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/pitches/my", { method: "GET" });
      setPitches(data.pitches || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadRoleAndData() {
      try {
        const me = await apiRequest("/auth/me", { method: "GET" });
        const userRole = me.profile?.role || "";
        setRole(userRole);
        if (userRole === "entrepreneur") {
          await loadMyPitches();
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoadingRole(false);
      }
    }

    loadRoleAndData();
  }, []);

  async function onDelete(pitchId) {
    const confirmed = window.confirm("Delete this pitch?");
    if (!confirmed) {
      return;
    }

    try {
      await apiRequest(`/pitches/${pitchId}`, { method: "DELETE" });
      setPitches((prev) => prev.filter((item) => item.id !== pitchId));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  if (loadingRole) {
    return <section className="card">Loading...</section>;
  }

  if (role && role !== "entrepreneur") {
    return <Navigate to="/pitches/browse" replace />;
  }

  return (
    <section className="card">
      <h2>My Pitch History</h2>
      <p className="subtle">View, edit, and delete your submitted pitches.</p>

      <div className="actions-row">
        <Link className="nav-link" to="/pitches/new">
          + New Pitch
        </Link>
        <button className="btn-ghost" type="button" onClick={loadMyPitches}>
          Refresh
        </button>
      </div>

      {loading && <p className="subtle">Loading your pitches...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && pitches.length === 0 && (
        <p className="subtle">No pitches yet. Create your first pitch.</p>
      )}

      <div className="list-grid">
        {pitches.map((pitch) => (
          <article className="list-card" key={pitch.id}>
            <h3>{pitch.startupName}</h3>
            <p>{pitch.businessOverview}</p>
            <p className="subtle">Funding request: ${pitch.fundingRequest}</p>
            <div className="actions-row">
              <Link className="nav-link" to={`/pitches/${pitch.id}/edit`}>
                Edit
              </Link>
              <button type="button" className="danger-btn" onClick={() => onDelete(pitch.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
