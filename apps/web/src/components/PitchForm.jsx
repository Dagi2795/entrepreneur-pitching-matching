export default function PitchForm({
  form,
  setForm,
  onSubmit,
  submitLabel,
  saving,
}) {
  function updateField(field, value) {
    setForm({ ...form, [field]: value });
  }

  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <label>
        Startup name
        <input
          value={form.startupName}
          onChange={(e) => updateField("startupName", e.target.value)}
          required
        />
      </label>

      <label>
        Business overview
        <textarea
          value={form.businessOverview}
          onChange={(e) => updateField("businessOverview", e.target.value)}
          required
        />
      </label>

      <label>
        Problem and solution
        <textarea
          value={form.problemSolution}
          onChange={(e) => updateField("problemSolution", e.target.value)}
          required
        />
      </label>

      <label>
        Market opportunity
        <textarea
          value={form.marketOpportunity}
          onChange={(e) => updateField("marketOpportunity", e.target.value)}
          required
        />
      </label>

      <label>
        Funding request
        <input
          type="number"
          min="1"
          step="0.01"
          value={form.fundingRequest}
          onChange={(e) => updateField("fundingRequest", e.target.value)}
          required
        />
      </label>

      <label>
        Supporting media links
        <textarea
          value={form.supportingMediaText}
          onChange={(e) => updateField("supportingMediaText", e.target.value)}
          placeholder="One link per line"
        />
      </label>

      <button type="submit" disabled={saving}>
        {saving ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
