function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        const error = new Error("Request body is too large");
        error.statusCode = 413;
        reject(error);
      }
    });

    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        const parseError = new Error("Invalid JSON body");
        parseError.statusCode = 400;
        reject(parseError);
      }
    });

    req.on("error", reject);
  });
}

module.exports = {
  sendJson,
  readJsonBody,
};
