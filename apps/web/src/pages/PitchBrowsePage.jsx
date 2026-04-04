import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { openPitchConversation } from "../lib/messages";

export default function PitchBrowsePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pitches, setPitches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [role, setRole] = useState("");

  async function loadPitches() {
    setLoading(true);
    setError("");

    try {
      const me = await apiRequest("/auth/me", { method: "GET" });
      const userRole = me.profile?.role || "";
      setRole(userRole);

      if (userRole !== "investor" && userRole !== "admin") {
        setLoading(false);
        return;
      }

      const data = await apiRequest("/pitches", { method: "GET" });
      setPitches(data.pitches || []);
      if (data.pitches?.length) {
        setSelected(data.pitches[0]);
      }
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPitches();
  }, []);

  async function contactEntrepreneur(pitch) {
    try {
      const result = await openPitchConversation(pitch.id);
      navigate(`/messages/${result.conversation.id}`);
    } catch (contactError) {
      setError(contactError.message);
    }
  }

  if (!loading && role && role !== "investor" && role !== "admin") {
    return <Navigate to="/pitches/my" replace />;
  }

  return (
    <section className="card">
      <h2>Browse Pitches</h2>
      <p className="subtle">Review startup opportunities submitted by entrepreneurs.</p>

      <div className="actions-row">
        <button className="btn-ghost" type="button" onClick={loadPitches}>
          Refresh
        </button>
      </div>

      {loading && <p className="subtle">Loading pitches...</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="browse-layout">
        <div className="list-grid">
          {pitches.map((pitch) => (
            <article
              key={pitch.id}
              className={selected?.id === pitch.id ? "list-card selected" : "list-card"}
            >
              <button type="button" className="card-select-trigger" onClick={() => setSelected(pitch)}>
                <h3>{pitch.startupName}</h3>
                <p className="subtle">Founder: {pitch.entrepreneurName || "Unknown"}</p>
                <p className="subtle">Funding: ${pitch.fundingRequest}</p>
              </button>
              <button type="button" onClick={() => contactEntrepreneur(pitch)}>
                Message Entrepreneur
              </button>
            </article>
          ))}
        </div>

        <article className="detail-card">
          {!selected && <p className="subtle">Select a pitch to view details.</p>}
          {selected && (
            <>
              <h3>{selected.startupName}</h3>
              <p><strong>Business overview:</strong> {selected.businessOverview}</p>
              <p><strong>Problem & solution:</strong> {selected.problemSolution}</p>
              <p><strong>Market opportunity:</strong> {selected.marketOpportunity}</p>
              <p><strong>Funding request:</strong> ${selected.fundingRequest}</p>
              <p><strong>Supporting media:</strong></p>
              <ul>
                {(selected.supportingMedia || []).map((item) => (
                  <li key={item}>
                    <a href={item} target="_blank" rel="noreferrer">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </article>
      </div>
    </section>
  );
}
