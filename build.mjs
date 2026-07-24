import { mkdir, readFile, rm, writeFile } from "node:fs/promises";

const root = new URL(".", import.meta.url);
const dist = new URL("dist/", root);
const server = new URL("dist/server/", root);
const hosting = new URL("dist/.openai/", root);
const assetsDirectory = new URL("dist/assets/", root);

await rm(dist, { recursive: true, force: true });
await mkdir(server, { recursive: true });
await mkdir(hosting, { recursive: true });
await mkdir(assetsDirectory, { recursive: true });

const [html, css, javascript, logo, favicon, hostingConfig] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("style.css", root), "utf8"),
  readFile(new URL("script.js", root), "utf8"),
  readFile(new URL("assets/cipherguard-logo.webp", root)),
  readFile(new URL("assets/favicon.png", root)),
  readFile(new URL(".openai/hosting.json", root), "utf8")
]);

const worker = `
const assets = {
  "/": { type: "text/html; charset=utf-8", body: ${JSON.stringify(html)} },
  "/index.html": { type: "text/html; charset=utf-8", body: ${JSON.stringify(html)} },
  "/style.css": { type: "text/css; charset=utf-8", body: ${JSON.stringify(css)} },
  "/script.js": { type: "text/javascript; charset=utf-8", body: ${JSON.stringify(javascript)} },
  "/assets/cipherguard-logo.webp": { type: "image/webp", base64: ${JSON.stringify(logo.toString("base64"))} },
  "/assets/favicon.png": { type: "image/png", base64: ${JSON.stringify(favicon.toString("base64"))} }
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const asset = assets[url.pathname];
    if (!asset) {
      return new Response("Not found", { status: 404 });
    }
    const body = asset.base64
      ? Uint8Array.from(atob(asset.base64), character => character.charCodeAt(0))
      : asset.body;
    return new Response(request.method === "HEAD" ? null : body, {
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
await Promise.all([
  writeFile(new URL("index.html", dist), html),
  writeFile(new URL("style.css", dist), css),
  writeFile(new URL("script.js", dist), javascript),
  writeFile(new URL("cipherguard-logo.webp", assetsDirectory), logo),
  writeFile(new URL("favicon.png", assetsDirectory), favicon)
]);
