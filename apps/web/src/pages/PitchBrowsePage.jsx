import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

export default function PitchBrowsePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pitches, setPitches] = useState([]);
  const [selected, setSelected] = useState(null);

  async function loadPitches() {
    setLoading(true);
    setError("");

    try {
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
            <button
              key={pitch.id}
              type="button"
              className={selected?.id === pitch.id ? "list-card selected" : "list-card"}
              onClick={() => setSelected(pitch)}
            >
              <h3>{pitch.startupName}</h3>
              <p className="subtle">Founder: {pitch.entrepreneurName || "Unknown"}</p>
              <p className="subtle">Funding: ${pitch.fundingRequest}</p>
            </button>
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
