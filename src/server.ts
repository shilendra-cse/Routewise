import * as http from "node:http";
const PORT = 3000;

export function createRoutewiseServer() {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
  });

  return server;
}
