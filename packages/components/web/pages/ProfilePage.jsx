import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    name: "",
    bio: "",
    interests: "",
    contactInfo: "",
    photoUrl: "",
    email: "",
    role: "",
  });

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/auth/me", { method: "GET" });
      const profile = data.profile || {};
      setForm({
        name: profile.name || "",
        bio: profile.bio || "",
          interests: profile.interests || "",
        contactInfo: profile.contactInfo || "",
        photoUrl: profile.photoUrl || "",
        email: profile.email || "",
        role: profile.role || "",
      });
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    setError("");

    try {
      const payload = {
        name: form.name,
        bio: form.bio,
        interests: form.interests,
        contactInfo: form.contactInfo,
        photoUrl: form.photoUrl,
      };
      await apiRequest("/auth/me", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setStatus("Profile updated successfully.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <section className="card">Loading profile...</section>;
  }

  return (
    <section className="card">
      <h2>Profile Management</h2>
      <p className="subtle">Update your public profile information.</p>

      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          Name
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>

        <label>
          Email (read only)
          <input value={form.email} disabled />
        </label>

        <label>
          Role (read only)
          <input value={form.role} disabled />
        </label>

        <label>
          Bio
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Tell people about yourself"
          />
        </label>

        <label>
          Interests
          <textarea
            value={form.interests}
            onChange={(e) => setForm({ ...form, interests: e.target.value })}
            placeholder="ai, fintech, healthcare, saas"
          />
        </label>

        <label>
          Contact info
          <input
            value={form.contactInfo}
            onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
            placeholder="Phone, LinkedIn, or email"
          />
        </label>

        <label>
          Photo URL
          <input
            value={form.photoUrl}
            onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
            placeholder="https://..."
          />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>

      {status && <p className="ok-text">{status}</p>}
      {error && <p className="error-text">{error}</p>}
    </section>
  );
}
