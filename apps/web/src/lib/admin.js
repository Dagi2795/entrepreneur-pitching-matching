import { apiRequest } from "./api";

export async function listAdminUsers() {
  const data = await apiRequest("/admin/users", { method: "GET" });
  return data.users || [];
}

export async function listAdminPitches() {
  const data = await apiRequest("/admin/pitches", { method: "GET" });
  return data.pitches || [];
}

export async function deletePitchAsAdmin(pitchId) {
  return apiRequest(`/admin/pitches/${pitchId}`, { method: "DELETE" });
}
