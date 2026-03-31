import { apiRequest } from "./api";

function buildQuery(filters) {
  const params = new URLSearchParams();

  if (filters.minFunding !== "") {
    params.set("minFunding", String(filters.minFunding));
  }

  if (filters.maxFunding !== "") {
    params.set("maxFunding", String(filters.maxFunding));
  }

  if (filters.keywords.trim()) {
    params.set("keywords", filters.keywords.trim());
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function fetchRecommendations(filters) {
  const query = buildQuery(filters);
  return apiRequest(`/matches/recommendations${query}`, { method: "GET" });
}
