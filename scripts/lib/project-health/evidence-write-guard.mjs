import fs from "node:fs";
import path from "node:path";

const SNAPSHOT_BASENAME = "github-prs-14-20";

function parseFrontmatter(raw) {
  if (!raw.startsWith("---\n")) return {};
  const end = raw.indexOf("\n---\n", 4);
  if (end === -1) return {};
  const fm = raw.slice(4, end);
  const data = {};
  for (const line of fm.split("\n")) {
    const m = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (!m) continue;
    data[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return data;
}

function walkMdx(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkMdx(full, out);
    else if (/\.mdx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

/**
 * Find published (non-draft) content files that pin a raw snapshot path.
 */
export function findPublishedEvidenceConsumers(docsRoot, snapshotRelPath) {
  const needle = snapshotRelPath.replace(/\\/g, "/");
  const consumers = [];
  for (const file of walkMdx(docsRoot)) {
    const raw = fs.readFileSync(file, "utf8");
    const data = parseFrontmatter(raw);
    const draft = data.draft === true || data.draft === "true";
    if (draft) continue;
    const pinned = data.evidenceSnapshot || data.sourceSnapshot || "";
    if (!pinned) {
      if (raw.includes(needle)) consumers.push(file);
      continue;
    }
    if (pinned.replace(/\\/g, "/") === needle || raw.includes(needle)) {
      consumers.push(file);
    }
  }
  return consumers;
}

export function resolveSnapshotOutputPath(repoRoot, preferredRevision = 1) {
  const rawDir = path.join(repoRoot, "src/data/project-health/raw");
  fs.mkdirSync(rawDir, { recursive: true });
  let revision = preferredRevision;
  for (;;) {
    const candidate = path.join(rawDir, `${SNAPSHOT_BASENAME}.v${revision}.json`);
    if (!fs.existsSync(candidate)) return candidate;
    revision += 1;
  }
}

export function assertCanWriteSnapshot(targetPath, publishedConsumers) {
  if (fs.existsSync(targetPath)) {
    throw new Error(
      `Evidence refresh refuses to overwrite existing snapshot: ${targetPath}`,
    );
  }
  if (publishedConsumers.length > 0) {
    throw new Error(
      `Evidence refresh refused: snapshot is used by published report(s): ${publishedConsumers.join(", ")}`,
    );
  }
}
