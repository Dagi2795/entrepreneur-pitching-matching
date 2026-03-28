const { getRecommendationsController } = require("./matching.controller");

async function handleMatchingRoutes(req, res) {
  const url = new URL(req.url, "http://localhost");

  if (req.method === "GET" && url.pathname === "/matches/recommendations") {
    const filters = {
      minFunding: url.searchParams.get("minFunding"),
      maxFunding: url.searchParams.get("maxFunding"),
      keywords: url.searchParams.get("keywords"),
    };

    await getRecommendationsController(req, res, filters);
    return true;
  }

  return false;
}

module.exports = {
  handleMatchingRoutes,
};
