function setCorsHeaders(req, res) {
  const requestOrigin = req.headers.origin;
  const envOrigin = process.env.FRONTEND_ORIGIN;

  let allowedOrigin = "http://localhost:5173";
  if (envOrigin) {
    allowedOrigin = envOrigin;
  } else if (requestOrigin && /^http:\/\/localhost:\d+$/.test(requestOrigin)) {
    allowedOrigin = requestOrigin;
  }

  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function sendJson(req, res, statusCode, payload) {
  setCorsHeaders(req, res);
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

function handlePreflight(req, res) {
  if (req.method === "OPTIONS") {
    setCorsHeaders(req, res);
    res.writeHead(204);
    res.end();
    return true;
  }

  return false;
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
  handlePreflight,
};
