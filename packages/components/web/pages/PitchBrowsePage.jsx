import { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { openPitchConversation } from "../lib/messages";

export default function PitchBrowsePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pitches, setPitches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [role, setRole] = useState("");
  const [filters, setFilters] = useState({
    q: searchParams.get("q") || "",
    minFunding: searchParams.get("minFunding") || "",
    maxFunding: searchParams.get("maxFunding") || "",
  });

  function buildPitchBrowsePath(queryState) {
    const params = new URLSearchParams();

    if (queryState.q.trim()) {
      params.set("q", queryState.q.trim());
    }

    if (queryState.minFunding !== "") {
      params.set("minFunding", String(queryState.minFunding).trim());
    }

    if (queryState.maxFunding !== "") {
      params.set("maxFunding", String(queryState.maxFunding).trim());
    }

    const queryString = params.toString();
    return queryString ? `/pitches?${queryString}` : "/pitches";
  }

  async function loadPitches(queryState = filters) {
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

      const data = await apiRequest(buildPitchBrowsePath(queryState), { method: "GET" });
      setPitches(data.pitches || []);

      const nextPitches = data.pitches || [];
      if (!nextPitches.length) {
        setSelected(null);
      } else if (!selected || !nextPitches.some((item) => item.id === selected.id)) {
        setSelected(nextPitches[0]);
      }
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const nextFilters = {
      q: searchParams.get("q") || "",
      minFunding: searchParams.get("minFunding") || "",
      maxFunding: searchParams.get("maxFunding") || "",
    };

    setFilters(nextFilters);
    loadPitches(nextFilters);
  }, [searchParams]);

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function applyFilters(event) {
    event.preventDefault();

    const nextParams = {};
    if (filters.q.trim()) {
      nextParams.q = filters.q.trim();
    }
    if (String(filters.minFunding).trim() !== "") {
      nextParams.minFunding = String(filters.minFunding).trim();
    }
    if (String(filters.maxFunding).trim() !== "") {
      nextParams.maxFunding = String(filters.maxFunding).trim();
    }

    setSearchParams(nextParams);
  }

  function clearFilters() {
    setFilters({ q: "", minFunding: "", maxFunding: "" });
    setSearchParams({});
  }

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

      <form className="filters-row" onSubmit={applyFilters}>
        <label>
          Keyword
          <input
            type="text"
            name="q"
            value={filters.q}
            onChange={handleFilterChange}
            placeholder="startup, market, founder..."
          />
        </label>

        <label>
          Min Funding
          <input
            type="number"
            name="minFunding"
            value={filters.minFunding}
            onChange={handleFilterChange}
            min="0"
            placeholder="0"
          />
        </label>

        <label>
          Max Funding
          <input
            type="number"
            name="maxFunding"
            value={filters.maxFunding}
            onChange={handleFilterChange}
            min="0"
            placeholder="1000000"
          />
        </label>

        <div className="actions-row">
          <button type="submit">Apply Filters</button>
          <button className="btn-ghost" type="button" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </form>

      <div className="actions-row">
        <button className="btn-ghost" type="button" onClick={() => loadPitches(filters)}>
          Refresh
        </button>
      </div>

      {loading && <p className="subtle">Loading pitches...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && pitches.length === 0 && (
        <p className="subtle">No pitches matched your current filters.</p>
      )}

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
