import { useEffect, useState } from "react";
import { fetchRecommendations } from "../lib/matching";

const initialFilters = {
  minFunding: "",
  maxFunding: "",
  keywords: "",
};

export default function MatchesPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [selected, setSelected] = useState(null);

  async function loadRecommendations(nextFilters = filters) {
    setLoading(true);
    setError("");

    try {
      const data = await fetchRecommendations(nextFilters);
      const list = data.recommendations || [];
      setRecommendations(list);
      setSelected(list.length > 0 ? list[0] : null);
    } catch (loadError) {
      setRecommendations([]);
      setSelected(null);
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecommendations(initialFilters);
  }, []);

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }

  async function handleApply(event) {
    event.preventDefault();
    await loadRecommendations(filters);
  }

  async function handleReset() {
    setFilters(initialFilters);
    await loadRecommendations(initialFilters);
  }

  return (
    <section className="card">
      <h2>Matching Recommendations</h2>
      <p className="subtle">
        Set your investor preferences to rank startup pitches by matching score.
      </p>

      <form className="filters-row" onSubmit={handleApply}>
        <label>
          Min Funding ($)
          <input
            type="number"
            min="0"
            step="1000"
            name="minFunding"
            value={filters.minFunding}
            onChange={handleFilterChange}
            placeholder="50000"
          />
        </label>

        <label>
          Max Funding ($)
          <input
            type="number"
            min="0"
            step="1000"
            name="maxFunding"
            value={filters.maxFunding}
            onChange={handleFilterChange}
            placeholder="500000"
          />
        </label>

        <label>
          Keywords (comma separated)
          <input
            type="text"
            name="keywords"
            value={filters.keywords}
            onChange={handleFilterChange}
            placeholder="ai, fintech, saas"
          />
        </label>

        <div className="actions-row">
          <button type="submit" disabled={loading}>
            {loading ? "Loading..." : "Apply Filters"}
          </button>
          <button
            className="btn-ghost"
            type="button"
            onClick={handleReset}
            disabled={loading}
          >
            Reset
          </button>
        </div>
      </form>

      {error && <p className="error-text">{error}</p>}
      {!error && loading && <p className="subtle">Loading recommendations...</p>}
      {!loading && !error && recommendations.length === 0 && (
        <p className="subtle">No matching recommendations for the current filters.</p>
      )}

      <div className="browse-layout">
        <div className="list-grid">
          {recommendations.map((item) => (
            <button
              key={item.id}
              type="button"
              className={selected?.id === item.id ? "list-card selected" : "list-card"}
              onClick={() => setSelected(item)}
            >
              <h3>{item.startupName}</h3>
              <p className="subtle">Founder: {item.entrepreneurName || "Unknown"}</p>
              <p className="subtle">Funding: ${item.fundingRequest}</p>
              <p className="match-score">Score: {item.matchingScore}</p>
            </button>
          ))}
        </div>

        <article className="detail-card">
          {!selected && <p className="subtle">Select a recommendation to view details.</p>}
          {selected && (
            <>
              <h3>{selected.startupName}</h3>
              <p>
                <strong>Founder:</strong> {selected.entrepreneurName || "Unknown"}
              </p>
              <p>
                <strong>Matching score:</strong> {selected.matchingScore}
              </p>
              <p>
                <strong>Business overview:</strong> {selected.businessOverview}
              </p>
              <p>
                <strong>Problem & solution:</strong> {selected.problemSolution}
              </p>
              <p>
                <strong>Market opportunity:</strong> {selected.marketOpportunity}
              </p>
              <p>
                <strong>Funding request:</strong> ${selected.fundingRequest}
              </p>
              <p>
                <strong>Why this match:</strong>
              </p>
              <ul>
                {(selected.reasons || []).map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </>
          )}
        </article>
      </div>
    </section>
  );
}
