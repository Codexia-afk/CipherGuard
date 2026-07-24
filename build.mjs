import { mkdir, readFile, rm, writeFile } from "node:fs/promises";

const root = new URL(".", import.meta.url);
const dist = new URL("dist/", root);
const server = new URL("dist/server/", root);
const hosting = new URL("dist/.openai/", root);

await rm(dist, { recursive: true, force: true });
await mkdir(server, { recursive: true });
await mkdir(hosting, { recursive: true });

const [html, css, javascript, hostingConfig] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("style.css", root), "utf8"),
  readFile(new URL("script.js", root), "utf8"),
  readFile(new URL(".openai/hosting.json", root), "utf8")
]);

const worker = `
const assets = {
  "/": { type: "text/html; charset=utf-8", body: ${JSON.stringify(html)} },
  "/index.html": { type: "text/html; charset=utf-8", body: ${JSON.stringify(html)} },
  "/style.css": { type: "text/css; charset=utf-8", body: ${JSON.stringify(css)} },
  "/script.js": { type: "text/javascript; charset=utf-8", body: ${JSON.stringify(javascript)} }
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const asset = assets[url.pathname];
    if (!asset) {
      return new Response("Not found", { status: 404 });
    }
    return new Response(request.method === "HEAD" ? null : asset.body, {
      headers: {
        "content-type": asset.type,
        "cache-control": asset.type.startsWith("text/html") ? "no-cache" : "public, max-age=3600",
        "x-content-type-options": "nosniff",
        "referrer-policy": "no-referrer",
        "permissions-policy": "camera=(), microphone=(), geolocation=()"
      }
    });
  }
};
`;

await writeFile(new URL("index.js", server), worker);
await writeFile(new URL("hosting.json", hosting), hostingConfig);
