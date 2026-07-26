#!/usr/bin/env node
/**
 * Stable public-behavior tests against dist/ (and optional Wrangler preview).
 * Asserts public contracts, not hashed Pagefind/OG filenames or Nimbus internals.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

const KNOWN_PAGE = {
  htmlPaths: [
    "decisions/independent-nimbus-lab/index.html",
    "decisions/independent-nimbus-lab.html",
  ],
  mdPaths: [
    "decisions/independent-nimbus-lab/index.md",
    "decisions/independent-nimbus-lab.md",
  ],
  title: "Independent Nimbus lab",
  canonicalPath: "/decisions/independent-nimbus-lab/",
};

const REQUIRED_HTML = [
  "index.html",
  "project/index.html",
  "journal/index.html",
  "reports/index.html",
  "decisions/index.html",
  "experiments/index.html",
  "404.html",
];

const DRAFT_SLUG = "m1-fixture-draft";

let failed = 0;

function ok(name) {
  console.log(`PASS  ${name}`);
}

function fail(name, detail) {
  failed += 1;
  console.error(`FAIL  ${name}`);
  if (detail) console.error(`      ${detail}`);
}

function existsAny(paths) {
  return paths.map((p) => path.join(dist, p)).find((p) => fs.existsSync(p));
}

function read(rel) {
  return fs.readFileSync(path.join(dist, rel), "utf8");
}

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, out);
    else out.push(full);
  }
  return out;
}

// --- dist presence ---
if (!fs.existsSync(dist)) {
  fail("dist exists", "Run astro build before this test");
  process.exit(1);
}

for (const rel of REQUIRED_HTML) {
  const candidates =
    rel === "index.html"
      ? ["index.html", "index/index.html"]
      : [rel, rel.replace(/\/index\.html$/, ".html")];
  if (existsAny(candidates)) ok(`html:${rel}`);
  else fail(`html:${rel}`, "missing from dist");
}

const knownHtml = existsAny(KNOWN_PAGE.htmlPaths);
if (knownHtml) {
  ok("known published HTML");
  const html = fs.readFileSync(knownHtml, "utf8");
  if (html.includes(KNOWN_PAGE.title)) ok("known page title present");
  else fail("known page title present");
} else {
  fail("known published HTML", KNOWN_PAGE.htmlPaths.join(" or "));
}

const knownMd = existsAny(KNOWN_PAGE.mdPaths);
if (knownMd) ok("markdown alternate for known page");
else fail("markdown alternate for known page", KNOWN_PAGE.mdPaths.join(" or "));

// Draft must be absent from production surfaces
const allDist = walkFiles(dist).map((f) => path.relative(dist, f));
const draftHits = allDist.filter((f) => f.includes(DRAFT_SLUG));
if (draftHits.length === 0) ok("draft fixture absent from dist");
else fail("draft fixture absent from dist", draftHits.join(", "));

// llms.txt — root index may link section indexes; nested pages appear there.
const llmsPath = path.join(dist, "llms.txt");
const sectionLlmsPath = path.join(dist, "decisions/llms.txt");
if (fs.existsSync(llmsPath)) {
  const llms = fs.readFileSync(llmsPath, "utf8");
  const sectionLlms = fs.existsSync(sectionLlmsPath)
    ? fs.readFileSync(sectionLlmsPath, "utf8")
    : "";
  const agentSurface = `${llms}\n${sectionLlms}`;
  if (
    agentSurface.includes("independent-nimbus-lab") &&
    agentSurface.includes(KNOWN_PAGE.title)
  ) {
    ok("llms.txt includes known published page");
  } else {
    fail("llms.txt includes known published page", "title/slug missing");
  }
  if (!agentSurface.includes(DRAFT_SLUG)) ok("llms.txt excludes draft fixture");
  else fail("llms.txt excludes draft fixture");
} else {
  fail("llms.txt exists");
}

// sitemap
const sitemapCandidates = ["sitemap-index.xml", "sitemap-0.xml", "sitemap.xml"];
const sitemapFile = sitemapCandidates
  .map((f) => path.join(dist, f))
  .find((f) => fs.existsSync(f));
if (sitemapFile) {
  const map = fs.readFileSync(sitemapFile, "utf8");
  // sitemap-index may only point to child; check children too
  let blob = map;
  if (map.includes("<sitemap>")) {
    const child = path.join(dist, "sitemap-0.xml");
    if (fs.existsSync(child)) blob += fs.readFileSync(child, "utf8");
  }
  if (blob.includes("https://lab.tianzhe.me/decisions/independent-nimbus-lab")) {
    ok("sitemap contains canonical known page URL");
  } else {
    fail(
      "sitemap contains canonical known page URL",
      "expected https://lab.tianzhe.me/decisions/independent-nimbus-lab",
    );
  }
  if (!blob.includes(DRAFT_SLUG)) ok("sitemap excludes draft fixture");
  else fail("sitemap excludes draft fixture");
} else {
  fail("sitemap exists");
}

function mimeFor(file) {
  if (file.endsWith(".js")) return "text/javascript";
  if (file.endsWith(".json")) return "application/json";
  if (file.endsWith(".wasm") || file.endsWith(".pagefind")) return "application/wasm";
  if (file.endsWith(".html")) return "text/html";
  return "application/octet-stream";
}

/** Serve `dist/` over loopback so Pagefind's public search API can fetch its bundle. */
function serveDist() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    const file = path.join(dist, urlPath.replace(/^\//, ""));
    if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.setHeader("Content-Type", mimeFor(file));
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, origin: `http://127.0.0.1:${port}` });
    });
  });
}

async function assertPagefindDiscoversKnownPage() {
  const pagefindDir = path.join(dist, "pagefind");
  if (!fs.existsSync(pagefindDir)) {
    fail("pagefind directory exists");
    return;
  }

  const knownHtmlForSearch = knownHtml ? fs.readFileSync(knownHtml, "utf8") : "";
  const knownPageSearchable =
    knownHtmlForSearch.includes("data-pagefind-body") &&
    knownHtmlForSearch.includes(KNOWN_PAGE.title);
  if (!knownPageSearchable) {
    fail(
      "search index can discover known page",
      "known page HTML missing data-pagefind-body or title",
    );
  }

  const searchableText = allDist
    .filter((f) => f.endsWith(".html"))
    .map((f) => read(f))
    .filter((html) => html.includes("data-pagefind-body"))
    .join("\n");
  if (!searchableText.includes(DRAFT_SLUG)) ok("search bodies exclude draft fixture");
  else fail("search bodies exclude draft fixture");

  if (!knownPageSearchable) return;

  const { server, origin } = await serveDist();
  try {
    const pagefind = await import(
      pathToFileURL(path.join(pagefindDir, "pagefind.js")).href
    );
    await pagefind.options({ basePath: `${origin}/pagefind/` });
    await pagefind.init();
    const search = await pagefind.search(KNOWN_PAGE.title);
    const hits = await Promise.all(
      search.results.slice(0, 10).map((result) => result.data()),
    );
    const found = hits.some(
      (hit) =>
        hit.meta?.title === KNOWN_PAGE.title ||
        String(hit.url || "").includes("independent-nimbus-lab"),
    );
    if (found) ok("search index can discover known page");
    else {
      fail(
        "search index can discover known page",
        `Pagefind search for "${KNOWN_PAGE.title}" returned no matching result`,
      );
    }
    await pagefind.destroy?.();
  } catch (err) {
    fail("search index can discover known page", String(err));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

await assertPagefindDiscoversKnownPage();

// llms-full.txt must exist and exclude the draft fixture
const llmsFullPath = path.join(dist, "llms-full.txt");
if (fs.existsSync(llmsFullPath)) {
  const full = fs.readFileSync(llmsFullPath, "utf8");
  if (full.includes(KNOWN_PAGE.title) || full.includes("independent-nimbus-lab")) {
    ok("llms-full.txt includes known published page");
  } else {
    fail("llms-full.txt includes known published page");
  }
  if (!full.includes(DRAFT_SLUG)) ok("llms-full.txt excludes draft fixture");
  else fail("llms-full.txt excludes draft fixture");
} else {
  fail("llms-full.txt exists");
}

// Preview noindex protections (default M1 build)
const homeHtmlPath =
  existsAny(["index.html", "index/index.html"]) ?? path.join(dist, "index.html");
if (fs.existsSync(homeHtmlPath)) {
  const home = fs.readFileSync(homeHtmlPath, "utf8");
  if (/name=["']robots["'][^>]*content=["']noindex,\s*nofollow["']/i.test(home) ||
      /content=["']noindex,\s*nofollow["'][^>]*name=["']robots["']/i.test(home)) {
    ok("preview HTML emits noindex,nofollow");
  } else {
    fail("preview HTML emits noindex,nofollow");
  }
} else {
  fail("homepage html for noindex check");
}

const robots = path.join(dist, "robots.txt");
if (fs.existsSync(robots)) {
  const body = fs.readFileSync(robots, "utf8");
  const hasDisallowAll = /(?:^|\n)User-agent:\s*\*\s*\nDisallow:\s*\/\s*(?:\n|$)/i.test(
    body,
  );
  // Do not use /Allow:\s*\// — it also matches the substring inside "Disallow: /".
  const hasAllowAll = /(?:^|\n)Allow:\s*\/\s*(?:\n|$)/i.test(body);
  if (hasDisallowAll && !hasAllowAll) {
    ok("preview robots.txt disallows crawling");
  } else {
    fail("preview robots.txt disallows crawling", body.slice(0, 200));
  }
} else {
  fail("robots.txt exists");
}

// Wrangler preview 404 check (optional if wrangler available)
async function checkWrangler404() {
  const port = 8787;
  const child = spawn(
    "pnpm",
    ["exec", "wrangler", "dev", "--port", String(port), "--ip", "127.0.0.1"],
    {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
    },
  );

  let ready = false;
  const onData = (buf) => {
    const s = buf.toString();
    if (/Ready on|http:\/\/127\.0\.0\.1:8787/i.test(s)) ready = true;
  };
  child.stdout.on("data", onData);
  child.stderr.on("data", onData);

  const started = Date.now();
  while (!ready && Date.now() - started < 45000) {
    await new Promise((r) => setTimeout(r, 400));
  }

  if (!ready) {
    child.kill("SIGTERM");
    fail("wrangler preview started", "timed out waiting for ready");
    return;
  }

  try {
    const res = await fetch(`http://127.0.0.1:${port}/this-route-does-not-exist-m1`);
    const text = await res.text();
    if (res.status === 404 && /Page not found/i.test(text)) {
      ok("missing route returns custom 404 under Wrangler preview");
    } else {
      fail(
        "missing route returns custom 404 under Wrangler preview",
        `status=${res.status}`,
      );
    }
  } catch (err) {
    fail("missing route returns custom 404 under Wrangler preview", String(err));
  } finally {
    child.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 500));
  }
}

await checkWrangler404();

if (failed > 0) {
  console.error(`\n${failed} stable-behavior check(s) failed.`);
  process.exit(1);
}

console.log("\nAll stable public-behavior checks passed.");
