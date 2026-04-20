import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import PitchForm from "../components/PitchForm";
import { apiRequest } from "../lib/api";
import { fromPitchToForm, toPitchPayload } from "../lib/pitch";

export default function PitchEditPage() {
  const { id } = useParams();
  const [role, setRole] = useState("");
  const [loadingRole, setLoadingRole] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const me = await apiRequest("/auth/me", { method: "GET" });
        const userRole = me.profile?.role || "";
        setRole(userRole);

        if (userRole !== "entrepreneur") {
          return;
        }

        const data = await apiRequest(`/pitches/${id}`, { method: "GET" });
        setForm(fromPitchToForm(data.pitch || {}));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoadingRole(false);
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  async function onSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    setError("");

    try {
      await apiRequest(`/pitches/${id}`, {
        method: "PUT",
        body: JSON.stringify(toPitchPayload(form)),
      });
      setStatus("Pitch updated successfully.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
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
      <h2>Edit Pitch</h2>
      <p className="subtle">Update your pitch details and save changes.</p>

      <div className="actions-row">
        <Link className="nav-link" to="/pitches/my">
          Back to My Pitches
        </Link>
      </div>

      {loading && <p className="subtle">Loading pitch...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && form && (
        <PitchForm
          form={form}
          setForm={setForm}
          onSubmit={onSubmit}
          submitLabel="Save Changes"
          saving={saving}
        />
      )}

      {status && <p className="ok-text">{status}</p>}
    </section>
  );
}
