import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { deletePitchAsAdmin, listAdminPitches, listAdminUsers } from "../lib/admin";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState("");
  const [users, setUsers] = useState([]);
  const [pitches, setPitches] = useState([]);
  const [busyPitchId, setBusyPitchId] = useState("");

  async function loadAdminData() {
    setLoading(true);
    setError("");

    try {
      const me = await apiRequest("/auth/me", { method: "GET" });
      const userRole = me.profile?.role || "";
      setRole(userRole);

      if (userRole !== "admin") {
        setLoading(false);
        return;
      }

      const [usersData, pitchesData] = await Promise.all([
        listAdminUsers(),
        listAdminPitches(),
      ]);

      setUsers(usersData);
      setPitches(pitchesData);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  async function removePitch(pitchId) {
    setBusyPitchId(pitchId);
    setError("");

    try {
      await deletePitchAsAdmin(pitchId);
      setPitches((current) => current.filter((item) => item.id !== pitchId));
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusyPitchId("");
    }
  }

  if (!loading && role && role !== "admin") {
    return <Navigate to="/profile" replace />;
  }

  return (
    <section className="card">
      <h2>Admin Management</h2>
      <p className="subtle">Monitor users and moderate pitches.</p>

      <div className="actions-row">
        <button type="button" className="btn-ghost" onClick={loadAdminData}>
          Refresh
        </button>
      </div>

      {loading && <p className="subtle">Loading admin data...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && (
        <div className="admin-grid">
          <article className="detail-card">
            <h3>Users</h3>
            {users.length === 0 && <p className="subtle">No users found.</p>}
            <div className="list-grid">
              {users.map((user) => (
                <div key={user.id} className="list-card">
                  <h3>{user.name}</h3>
                  <p className="subtle">{user.email}</p>
                  <p className="subtle">Role: {user.role}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="detail-card">
            <h3>Pitches</h3>
            {pitches.length === 0 && <p className="subtle">No pitches available.</p>}
            <div className="list-grid">
              {pitches.map((pitch) => (
                <div key={pitch.id} className="list-card">
                  <h3>{pitch.startupName}</h3>
                  <p className="subtle">Founder: {pitch.entrepreneurName || "Unknown"}</p>
                  <p className="subtle">Funding: ${pitch.fundingRequest}</p>
                  <div className="actions-row">
                    <button
                      type="button"
                      className="danger-btn"
                      disabled={busyPitchId === pitch.id}
                      onClick={() => removePitch(pitch.id)}
                    >
                      {busyPitchId === pitch.id ? "Removing..." : "Remove Pitch"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
