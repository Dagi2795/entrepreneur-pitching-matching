const http = require("http");

const port = process.env.PORT || 4000;

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ app: "api", status: "healthy" }));
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ app: "api", status: "ok" }));
});

server.listen(port, () => {
  console.log(`api running on http://localhost:${port}`);
});
