#!/usr/bin/env node
/**
 * Offline publication-metadata validation for Eazy Review Lab.
 * No DNS, HTTP, GitHub API, or other network requests.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsRoot = path.join(root, "src/content/docs");

const APPROVED_HOSTS = new Set([
  "github.com",
  "www.github.com",
  "raw.githubusercontent.com",
  "lab.tianzhe.me",
  "nimbus-docs.com",
  "developers.cloudflare.com",
  "docs.astro.build",
  "www.jsonfeed.org",
]);

const PRIVATE_IP =
  /^(?:10\.|127\.|169\.254\.|192\.168\.|0\.|100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|172\.(?:1[6-9]|2\d|3[01])\.)/;
const PLACEHOLDER = /\b(?:TODO|FIXME|changeme|example\.com|your-domain|insert-|xxx)\b/i;
const SECRET_QUERY = /(?:token|secret|password|api[_-]?key|access[_-]?key|auth)=/i;
const FULL_SHA = /^[a-f0-9]{40}$/;
const OWNER_REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const ISO_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const errors = [];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.mdx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

function parseFrontmatter(raw) {
  if (!raw.startsWith("---\n")) return { data: {}, body: raw };
  const end = raw.indexOf("\n---\n", 4);
  if (end === -1) return { data: {}, body: raw };
  const fm = raw.slice(4, end);
  const body = raw.slice(end + 5);
  const data = {};
  const lines = fm.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const m = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (!m) {
      i += 1;
      continue;
    }
    const key = m[1];
    let value = m[2];
    if (value === "|" || value === ">") {
      // skip folded/literal scalars; validator focuses on scalar/list fields we own
      i += 1;
      while (i < lines.length && (lines[i] === "" || /^\s/.test(lines[i]))) {
        i += 1;
      }
      continue;
    }
    if (value.startsWith("[") && value.endsWith("]")) {
      data[key] = value
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
      i += 1;
      continue;
    }
    if (value === "") {
      // Nested list — e.g. block-style sourceRefs / tags
      const items = [];
      i += 1;
      while (i < lines.length && /^\s+-/.test(lines[i])) {
        if (/^\s+-\s+label:/.test(lines[i])) {
          const item = {};
          item.label = lines[i].replace(/^\s+-\s+label:\s*/, "").replace(/^["']|["']$/g, "");
          i += 1;
          if (i < lines.length && /^\s+url:/.test(lines[i])) {
            item.url = lines[i].replace(/^\s+url:\s*/, "").replace(/^["']|["']$/g, "");
            i += 1;
          }
          items.push(item);
          continue;
        }
        const scalar = lines[i].replace(/^\s+-\s*/, "").replace(/^["']|["']$/g, "");
        if (scalar && !/^[A-Za-z0-9_]+:\s*/.test(scalar)) {
          items.push(scalar);
          i += 1;
          continue;
        }
        i += 1;
      }
      if (items.length) data[key] = items;
      continue;
    }
    data[key] = value.replace(/^["']|["']$/g, "");
    i += 1;
  }
  return { data, body };
}

function isPublishable(data) {
  const draft = data.draft === true || data.draft === "true";
  if (draft) return false;
  const ai = data.aiGenerated === true || data.aiGenerated === "true";
  if (!ai) return true;
  return Boolean(data.humanReviewedAt && data.reviewedBy);
}

function validateUrl(url, file, field) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    errors.push(`${file}: ${field} is not a valid URL: ${url}`);
    return;
  }
  if (parsed.protocol !== "https:") {
    errors.push(`${file}: ${field} must use HTTPS: ${url}`);
  }
  if (parsed.username || parsed.password) {
    errors.push(`${file}: ${field} embeds credentials: ${url}`);
  }
  if (SECRET_QUERY.test(parsed.search)) {
    errors.push(`${file}: ${field} has suspicious secret query params: ${url}`);
  }
  if (PLACEHOLDER.test(url)) {
    errors.push(`${file}: ${field} looks like a placeholder: ${url}`);
  }
  const host = parsed.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) {
    errors.push(`${file}: ${field} must not use localhost: ${url}`);
  }
  if (PRIVATE_IP.test(host) || host === "::1") {
    errors.push(`${file}: ${field} must not use a private/non-public IP: ${url}`);
  }
  if (!APPROVED_HOSTS.has(host)) {
    errors.push(
      `${file}: ${field} host "${host}" is not on the approved allowlist: ${url}`,
    );
  }

  // GitHub structural checks when the path matches known patterns
  if (host === "github.com" || host === "www.github.com") {
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      const repo = `${parts[0]}/${parts[1]}`;
      if (!OWNER_REPO.test(repo)) {
        errors.push(`${file}: ${field} has invalid owner/repo: ${url}`);
      }
    }
    if (parts[2] === "pull" || parts[2] === "issues") {
      const n = Number(parts[3]);
      if (!Number.isInteger(n) || n <= 0) {
        errors.push(`${file}: ${field} has invalid PR/issue number: ${url}`);
      }
    }
    if (parts[2] === "commit" || parts[2] === "blob" || parts[2] === "tree") {
      if (!parts[3] || !FULL_SHA.test(parts[3])) {
        errors.push(
          `${file}: ${field} commit/blob/tree ref must be a full 40-character SHA: ${url}`,
        );
      }
    }
  }
}

for (const file of walk(docsRoot)) {
  const rel = path.relative(root, file);
  const raw = fs.readFileSync(file, "utf8");
  const { data, body } = parseFrontmatter(raw);

  if (PLACEHOLDER.test(body) && data.draft !== true && data.draft !== "true") {
    // Allow template instruction markers only in templates/, not published docs
    if (/TODO|FIXME|changeme/i.test(body)) {
      errors.push(`${rel}: published-facing content contains placeholder markers`);
    }
  }

  const claimsPublished = data.draft === false || data.draft === "false" || data.draft == null;
  // Only enforce publishable rule when content claims to be published
  // (draft is false or omitted) AND is an article kind that would ship.
  const kind = data.kind;
  const articleKinds = new Set(["journal", "report", "decision", "experiment", "project"]);
  if (claimsPublished && articleKinds.has(kind) && !isPublishable(data)) {
    errors.push(
      `${rel}: claims published state but fails publishable rule (aiGenerated requires humanReviewedAt + reviewedBy)`,
    );
  }

  // publishedAt is optional only for drafts and section pages
  if (claimsPublished && articleKinds.has(kind) && !data.publishedAt) {
    errors.push(`${rel}: published article requires publishedAt`);
  }

  if (data.humanReviewedAt && !data.reviewedBy) {
    errors.push(`${rel}: humanReviewedAt requires reviewedBy`);
  }
  if (data.reviewedBy && !data.humanReviewedAt) {
    errors.push(`${rel}: reviewedBy requires humanReviewedAt`);
  }
  if (data.publishedAt && !ISO_OFFSET.test(String(data.publishedAt))) {
    errors.push(`${rel}: publishedAt must be ISO 8601 with timezone`);
  }
  if (data.humanReviewedAt && !ISO_OFFSET.test(String(data.humanReviewedAt))) {
    errors.push(`${rel}: humanReviewedAt must be ISO 8601 with timezone`);
  }
  if (data.lastVerifiedAt && !ISO_DATE.test(String(data.lastVerifiedAt))) {
    errors.push(`${rel}: lastVerifiedAt must be YYYY-MM-DD`);
  }
  if (data.sourceCommit && !FULL_SHA.test(String(data.sourceCommit))) {
    errors.push(`${rel}: sourceCommit must be a full 40-character SHA`);
  }
  if (data.sourceRepository && !OWNER_REPO.test(String(data.sourceRepository))) {
    errors.push(`${rel}: sourceRepository must be owner/repository`);
  }

  if (Array.isArray(data.sourceRefs)) {
    for (const [idx, ref] of data.sourceRefs.entries()) {
      if (!ref.label || !ref.url) {
        errors.push(`${rel}: sourceRefs[${idx}] requires label and url`);
        continue;
      }
      validateUrl(ref.url, rel, `sourceRefs[${idx}].url`);
    }
  }

  if (
    data.aiGenerated === true ||
    data.aiGenerated === "true"
  ) {
    if (claimsPublished && isPublishable(data)) {
      if (!/Drafted with AI, reviewed by .+/.test(body)) {
        errors.push(
          `${rel}: AI-assisted published article must include "Drafted with AI, reviewed by …"`,
        );
      }
    }
  }
}

if (errors.length) {
  console.error("Publication validation failed:\n");
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}

console.log("Publication validation passed.");
