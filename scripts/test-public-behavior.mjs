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
const siteIndexable = process.env.SITE_INDEXABLE === "true";

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

const FLAGSHIP_REPORT = {
  htmlPaths: [
    "reports/pr-14-project-health/index.html",
    "reports/pr-14-project-health.html",
  ],
  mdPaths: [
    "reports/pr-14-project-health/index.md",
    "reports/pr-14-project-health.md",
  ],
  title:
    "Eazy Review Project Health Review: What PR #14 Revealed About Scope, Reviewability, and AI-Assisted Development",
  canonicalUrl: "https://lab.tianzhe.me/reports/pr-14-project-health/",
  slugToken: "pr-14-project-health",
};

const LAUNCH_JOURNAL = {
  htmlPaths: [
    "journal/launching-eazy-review-lab/index.html",
    "journal/launching-eazy-review-lab.html",
  ],
  mdPaths: [
    "journal/launching-eazy-review-lab/index.md",
    "journal/launching-eazy-review-lab.md",
  ],
  mdxPaths: [
    "journal/launching-eazy-review-lab/index.mdx",
    "journal/launching-eazy-review-lab.mdx",
  ],
  title: "Launching Eazy Review Lab: From Foundation to Publishing",
  canonicalUrl: "https://lab.tianzhe.me/journal/launching-eazy-review-lab/",
  slugToken: "launching-eazy-review-lab",
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

// --- Flagship report surfaces ---
const reportHtml = existsAny(FLAGSHIP_REPORT.htmlPaths);
if (reportHtml) {
  ok("flagship report HTML");
  const html = fs.readFileSync(reportHtml, "utf8");
  if (html.includes(FLAGSHIP_REPORT.title)) ok("flagship report title present");
  else fail("flagship report title present");
  const robotsTags = [...html.matchAll(/<meta\s+[^>]*name=["']robots["'][^>]*>/gi)];
  if (robotsTags.length <= 1) ok("single robots meta on report page");
  else fail("single robots meta on report page", `count=${robotsTags.length}`);
  if (siteIndexable) {
    const denies =
      /content=["']noindex(?:,\s*nofollow)?["']/i.test(robotsTags[0]?.[0] ?? "");
    if (!denies) ok("indexable build leaves report crawlable");
    else fail("indexable build leaves report crawlable", robotsTags[0]?.[0]);
  }
  if (
    /rel=["']alternate["'][^>]*type=["']application\/rss\+xml["']/i.test(html) ||
    /type=["']application\/rss\+xml["'][^>]*rel=["']alternate["']/i.test(html)
  ) {
    ok("HTML advertises RSS feed");
  } else {
    fail("HTML advertises RSS feed");
  }
  if (
    /rel=["']alternate["'][^>]*type=["']application\/feed\+json["']/i.test(html) ||
    /type=["']application\/feed\+json["'][^>]*rel=["']alternate["']/i.test(html)
  ) {
    ok("HTML advertises JSON Feed");
  } else {
    fail("HTML advertises JSON Feed");
  }
} else {
  fail("flagship report HTML", FLAGSHIP_REPORT.htmlPaths.join(" or "));
}

const reportMd = existsAny(FLAGSHIP_REPORT.mdPaths);
if (reportMd) ok("flagship report Markdown alternate");
else fail("flagship report Markdown alternate", FLAGSHIP_REPORT.mdPaths.join(" or "));

const reportsLlmsPath = path.join(dist, "reports/llms.txt");
if (fs.existsSync(llmsPath)) {
  const llms = fs.readFileSync(llmsPath, "utf8");
  const reportsLlms = fs.existsSync(reportsLlmsPath)
    ? fs.readFileSync(reportsLlmsPath, "utf8")
    : "";
  const agentSurface = `${llms}\n${reportsLlms}`;
  if (
    agentSurface.includes(FLAGSHIP_REPORT.slugToken) &&
    agentSurface.includes("Project Health Review")
  ) {
    ok("llms.txt includes published report");
  } else {
    fail("llms.txt includes published report");
  }
}

if (sitemapFile) {
  const map = fs.readFileSync(sitemapFile, "utf8");
  let blob = map;
  if (map.includes("<sitemap>")) {
    const child = path.join(dist, "sitemap-0.xml");
    if (fs.existsSync(child)) blob += fs.readFileSync(child, "utf8");
  }
  if (blob.includes(FLAGSHIP_REPORT.canonicalUrl.replace(/\/$/, ""))) {
    ok("sitemap contains canonical report URL");
  } else {
    fail("sitemap contains canonical report URL", FLAGSHIP_REPORT.canonicalUrl);
  }
}

async function assertPagefindDiscoversReport() {
  const pagefindDir = path.join(dist, "pagefind");
  if (!fs.existsSync(pagefindDir) || !reportHtml) return;

  const { server, origin } = await serveDist();
  try {
    const pagefind = await import(
      pathToFileURL(path.join(pagefindDir, "pagefind.js")).href
    );
    await pagefind.options({ basePath: `${origin}/pagefind/` });
    await pagefind.init();
    const search = await pagefind.search(FLAGSHIP_REPORT.title);
    const hits = await Promise.all(
      search.results.slice(0, 10).map((result) => result.data()),
    );
    const found = hits.some(
      (hit) =>
        hit.meta?.title === FLAGSHIP_REPORT.title ||
        String(hit.url || "").includes(FLAGSHIP_REPORT.slugToken),
    );
    if (found) ok("search finds exact report title");
    else fail("search finds exact report title");
    await pagefind.destroy?.();
  } catch (err) {
    fail("search finds exact report title", String(err));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

await assertPagefindDiscoversReport();

// --- First post-launch journal surfaces ---
const journalHtml = existsAny(LAUNCH_JOURNAL.htmlPaths);
if (journalHtml) {
  ok("launch journal HTML");
  const html = fs.readFileSync(journalHtml, "utf8");
  if (html.includes(LAUNCH_JOURNAL.title)) ok("launch journal title present");
  else fail("launch journal title present");
  if (
    html.includes(
      `<link rel="canonical" href="${LAUNCH_JOURNAL.canonicalUrl}">`,
    )
  ) {
    ok("launch journal canonical URL");
  } else {
    fail("launch journal canonical URL", LAUNCH_JOURNAL.canonicalUrl);
  }
  if (html.includes("Drafted with AI, reviewed by Tyson Hu.")) {
    ok("launch journal AI review disclosure");
  } else {
    fail("launch journal AI review disclosure");
  }
} else {
  fail("launch journal HTML", LAUNCH_JOURNAL.htmlPaths.join(" or "));
}

const journalMd = existsAny(LAUNCH_JOURNAL.mdPaths);
if (journalMd) ok("launch journal Markdown alternate");
else fail("launch journal Markdown alternate", LAUNCH_JOURNAL.mdPaths.join(" or "));

const journalMdx = existsAny(LAUNCH_JOURNAL.mdxPaths);
if (journalMdx) ok("launch journal MDX alternate");
else fail("launch journal MDX alternate", LAUNCH_JOURNAL.mdxPaths.join(" or "));

const journalLlmsPath = path.join(dist, "journal/llms.txt");
if (fs.existsSync(llmsPath) && fs.existsSync(journalLlmsPath)) {
  const rootLlms = fs.readFileSync(llmsPath, "utf8");
  const journalLlms = fs.readFileSync(journalLlmsPath, "utf8");
  const agentSurface = `${rootLlms}\n${journalLlms}`;
  if (
    agentSurface.includes(LAUNCH_JOURNAL.slugToken) &&
    agentSurface.includes(LAUNCH_JOURNAL.title)
  ) {
    ok("root and journal llms.txt expose launch journal");
  } else {
    fail("root and journal llms.txt expose launch journal");
  }
} else {
  fail("root and journal llms.txt exist");
}

if (sitemapFile) {
  const map = fs.readFileSync(sitemapFile, "utf8");
  let blob = map;
  if (map.includes("<sitemap>")) {
    const child = path.join(dist, "sitemap-0.xml");
    if (fs.existsSync(child)) blob += fs.readFileSync(child, "utf8");
  }
  if (blob.includes(LAUNCH_JOURNAL.canonicalUrl.replace(/\/$/, ""))) {
    ok("sitemap contains canonical launch journal URL");
  } else {
    fail(
      "sitemap contains canonical launch journal URL",
      LAUNCH_JOURNAL.canonicalUrl,
    );
  }
}

async function assertPagefindDiscoversLaunchJournal() {
  const pagefindDir = path.join(dist, "pagefind");
  if (!fs.existsSync(pagefindDir) || !journalHtml) return;

  const { server, origin } = await serveDist();
  try {
    const pagefind = await import(
      pathToFileURL(path.join(pagefindDir, "pagefind.js")).href
    );
    await pagefind.options({ basePath: `${origin}/pagefind/` });
    await pagefind.init();
    const search = await pagefind.search(LAUNCH_JOURNAL.title);
    const hits = await Promise.all(
      search.results.slice(0, 10).map((result) => result.data()),
    );
    const found = hits.some(
      (hit) =>
        hit.meta?.title === LAUNCH_JOURNAL.title ||
        String(hit.url || "").includes(LAUNCH_JOURNAL.slugToken),
    );
    if (found) ok("search finds exact launch journal title");
    else fail("search finds exact launch journal title");
    await pagefind.destroy?.();
  } catch (err) {
    fail("search finds exact launch journal title", String(err));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

await assertPagefindDiscoversLaunchJournal();

// --- Feeds ---
function assertFeeds() {
  const rssPath = path.join(dist, "feed.xml");
  const jsonPath = path.join(dist, "feed.json");
  if (!fs.existsSync(rssPath)) {
    fail("feed.xml exists");
    return;
  }
  if (!fs.existsSync(jsonPath)) {
    fail("feed.json exists");
    return;
  }

  const rss = fs.readFileSync(rssPath, "utf8");
  const jsonRaw = fs.readFileSync(jsonPath, "utf8");

  if (/<rss[\s>]/.test(rss) && /<channel>/.test(rss)) ok("RSS parses as RSS 2.0");
  else fail("RSS parses as RSS 2.0");

  let feed;
  try {
    feed = JSON.parse(jsonRaw);
    ok("JSON Feed parses");
  } catch (err) {
    fail("JSON Feed parses", String(err));
    return;
  }

  if (feed.version === "https://jsonfeed.org/version/1.1") ok("JSON Feed version 1.1");
  else fail("JSON Feed version 1.1", String(feed.version));

  if (!Array.isArray(feed.items)) {
    fail("JSON Feed items array");
    return;
  }

  const reportItem = feed.items.find((item) => item.url === FLAGSHIP_REPORT.canonicalUrl);
  if (reportItem) ok("feeds include flagship report at canonical URL");
  else fail("feeds include flagship report at canonical URL");

  if (reportItem?.kind === "report" && reportItem?.featured === true) {
    ok("JSON Feed report metadata fields");
  } else {
    fail("JSON Feed report metadata fields", JSON.stringify(reportItem));
  }

  if (rss.includes(FLAGSHIP_REPORT.canonicalUrl)) ok("RSS includes flagship report URL");
  else fail("RSS includes flagship report URL");

  const journalItem = feed.items.find(
    (item) => item.url === LAUNCH_JOURNAL.canonicalUrl,
  );
  if (journalItem) ok("feeds include launch journal at canonical URL");
  else fail("feeds include launch journal at canonical URL");

  if (journalItem?.kind === "journal" && journalItem?.featured === false) {
    ok("JSON Feed launch journal metadata fields");
  } else {
    fail("JSON Feed launch journal metadata fields", JSON.stringify(journalItem));
  }

  if (
    rss.includes(LAUNCH_JOURNAL.canonicalUrl) &&
    rss.includes("<lab:kind>journal</lab:kind>")
  ) {
    ok("RSS includes launch journal URL and kind");
  } else {
    fail("RSS includes launch journal URL and kind");
  }

  if (rss.includes(DRAFT_SLUG) || jsonRaw.includes(DRAFT_SLUG)) {
    fail("feeds exclude draft fixture");
  } else {
    ok("feeds exclude draft fixture");
  }

  // Decision kind must not appear in feeds.
  if (
    feed.items.some((item) => String(item.url || "").includes("independent-nimbus-lab")) ||
    rss.includes("independent-nimbus-lab")
  ) {
    fail("feeds exclude non-feed kinds (decision)");
  } else {
    ok("feeds exclude non-feed kinds (decision)");
  }

  const urls = feed.items.map((item) => item.url);
  const dates = feed.items.map((item) => Date.parse(item.date_published));
  let ordered = true;
  for (let i = 1; i < dates.length; i += 1) {
    if (dates[i] > dates[i - 1]) {
      ordered = false;
      break;
    }
    if (dates[i] === dates[i - 1] && urls[i] < urls[i - 1]) {
      ordered = false;
      break;
    }
  }
  if (ordered) ok("feed ordering is deterministic");
  else fail("feed ordering is deterministic", urls.join(" | "));

  for (const url of urls) {
    if (!String(url).startsWith("https://lab.tianzhe.me/")) {
      fail("feed URLs are absolute lab.tianzhe.me", url);
      return;
    }
  }
  ok("feed URLs are absolute lab.tianzhe.me");
}

assertFeeds();

// Indexing protections — default builds stay noindexed; SITE_INDEXABLE=true
// unlocks production robots after custom-domain verification.
const homeHtmlPath =
  existsAny(["index.html", "index/index.html"]) ?? path.join(dist, "index.html");
if (fs.existsSync(homeHtmlPath)) {
  const home = fs.readFileSync(homeHtmlPath, "utf8");
  const robotsTags = [...home.matchAll(/<meta\s+[^>]*name=["']robots["'][^>]*>/gi)];
  if (robotsTags.length <= 1) ok("single robots meta on homepage");
  else fail("single robots meta on homepage", `count=${robotsTags.length}`);
  const hasPreviewDeny =
    /name=["']robots["'][^>]*content=["']noindex,\s*nofollow["']/i.test(home) ||
    /content=["']noindex,\s*nofollow["'][^>]*name=["']robots["']/i.test(home);
  if (siteIndexable) {
    if (!hasPreviewDeny) ok("indexable HTML omits preview noindex,nofollow");
    else fail("indexable HTML omits preview noindex,nofollow");
  } else if (hasPreviewDeny) {
    ok("preview HTML emits noindex,nofollow");
  } else {
    fail("preview HTML emits noindex,nofollow");
  }
} else {
  fail("homepage html for noindex check");
}

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
  if (
    full.includes(LAUNCH_JOURNAL.title) &&
    full.includes(LAUNCH_JOURNAL.slugToken)
  ) {
    ok("llms-full.txt includes launch journal");
  } else {
    fail("llms-full.txt includes launch journal");
  }
} else {
  fail("llms-full.txt exists");
}

const robots = path.join(dist, "robots.txt");
if (fs.existsSync(robots)) {
  const body = fs.readFileSync(robots, "utf8");
  const hasDisallowAll = /(?:^|\n)User-agent:\s*\*\s*\nDisallow:\s*\/\s*(?:\n|$)/i.test(
    body,
  );
  // Do not use /Allow:\s*\// — it also matches the substring inside "Disallow: /".
  const hasAllowAll = /(?:^|\n)Allow:\s*\/\s*(?:\n|$)/i.test(body);
  if (siteIndexable) {
    if (hasAllowAll && !hasDisallowAll) ok("indexable robots.txt allows crawling");
    else fail("indexable robots.txt allows crawling", body.slice(0, 200));
    if (body.includes("Sitemap: https://lab.tianzhe.me/sitemap-index.xml")) {
      ok("indexable robots.txt advertises sitemap");
    } else {
      fail("indexable robots.txt advertises sitemap");
    }
  } else if (hasDisallowAll && !hasAllowAll) {
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
