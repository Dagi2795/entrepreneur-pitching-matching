export function emptyPitchForm() {
  return {
    startupName: "",
    businessOverview: "",
    problemSolution: "",
    marketOpportunity: "",
    fundingRequest: "",
    supportingMediaText: "",
  };
}

export function toPitchPayload(form) {
  return {
    startupName: form.startupName,
    businessOverview: form.businessOverview,
    problemSolution: form.problemSolution,
    marketOpportunity: form.marketOpportunity,
    fundingRequest: Number(form.fundingRequest),
    supportingMedia: String(form.supportingMediaText || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  };
}

export function fromPitchToForm(pitch) {
  return {
    startupName: pitch.startupName || "",
    businessOverview: pitch.businessOverview || "",
    problemSolution: pitch.problemSolution || "",
    marketOpportunity: pitch.marketOpportunity || "",
    fundingRequest: pitch.fundingRequest || "",
    supportingMediaText: Array.isArray(pitch.supportingMedia)
      ? pitch.supportingMedia.join("\n")
      : "",
  };
}
