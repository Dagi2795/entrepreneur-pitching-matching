import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import PitchForm from "../components/PitchForm";
import { apiRequest } from "../lib/api";
import { emptyPitchForm, toPitchPayload } from "../lib/pitch";

export default function PitchNewPage() {
  const [form, setForm] = useState(emptyPitchForm());
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [role, setRole] = useState("");
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    async function loadRole() {
      try {
        const data = await apiRequest("/auth/me", { method: "GET" });
        setRole(data.profile?.role || "");
      } catch (e) {
        setError(e.message);
      } finally {
        setLoadingRole(false);
      }
    }

    loadRole();
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setStatus("");
    setSaving(true);

    try {
      await apiRequest("/pitches", {
        method: "POST",
        body: JSON.stringify(toPitchPayload(form)),
      });
      setStatus("Pitch created successfully.");
      setForm(emptyPitchForm());
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
      <h2>Create Pitch</h2>
      <p className="subtle">
        Publish your startup idea for investors to discover and evaluate.
      </p>

      <PitchForm
        form={form}
        setForm={setForm}
        onSubmit={onSubmit}
        submitLabel="Create Pitch"
        saving={saving}
      />

      {status && <p className="ok-text">{status}</p>}
      {error && <p className="error-text">{error}</p>}
    </section>
  );
}
