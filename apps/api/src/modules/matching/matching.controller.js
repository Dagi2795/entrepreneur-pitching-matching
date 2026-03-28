const { sendJson } = require("../../common/http");
const { getRecommendations } = require("./matching.service");

async function getRecommendationsController(req, res, filters) {
  const result = await getRecommendations(req, filters);
  sendJson(req, res, 200, result);
}

module.exports = {
  getRecommendationsController,
};
