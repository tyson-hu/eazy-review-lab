#!/usr/bin/env node
/**
 * Deterministic project-health SVG generation from derived evidence only.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  parseDecompositionTimeline,
  parsePathClassification,
} from "./lib/project-health/schema.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public/media/project-health");

const CATEGORY_ORDER = [
  "product code",
  "canonical product/data documents",
  "decision governance",
  "agent/tooling",
  "CI/dependencies",
];

const CATEGORY_LABELS = {
  "product code": "Product code",
  "canonical product/data documents": "Canonical docs",
  "decision governance": "Decision governance",
  "agent/tooling": "Agent / tooling",
  "CI/dependencies": "CI / dependencies",
};

function loadDerived() {
  const classification = parsePathClassification(
    JSON.parse(
      fs.readFileSync(
        path.join(
          root,
          "src/data/project-health/derived/pr14-path-classification.v1.json",
        ),
        "utf8",
      ),
    ),
  );
  const timeline = parseDecompositionTimeline(
    JSON.parse(
      fs.readFileSync(
        path.join(
          root,
          "src/data/project-health/derived/decomposition-timeline.v1.json",
        ),
        "utf8",
      ),
    ),
  );
  return { classification, timeline };
}

function categoryTotals(classification) {
  const totals = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, 0]));
  for (const entry of classification.paths) {
    totals[entry.category] += 1;
  }
  return CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    count: totals[category],
  }));
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildFilesByAreaSvg(rows) {
  const width = 920;
  const height = 420;
  const margin = { top: 72, right: 36, bottom: 72, left: 64 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;
  const max = Math.max(...rows.map((r) => r.count));
  const barGap = 24;
  const barW = (chartW - barGap * (rows.length - 1)) / rows.length;
  const title = "PR #14 changed files by area";
  const bars = rows
    .map((row, index) => {
      const h = max === 0 ? 0 : (row.count / max) * chartH;
      const x = margin.left + index * (barW + barGap);
      const y = margin.top + chartH - h;
      return `
      <g>
        <rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barW.toFixed(2)}" height="${h.toFixed(2)}" fill="#0066cc" />
        <text x="${(x + barW / 2).toFixed(2)}" y="${(y - 10).toFixed(2)}" text-anchor="middle" font-size="16" font-weight="600" fill="#1d1d1f">${row.count}</text>
        <text x="${(x + barW / 2).toFixed(2)}" y="${(margin.top + chartH + 28).toFixed(2)}" text-anchor="middle" font-size="13" fill="#1d1d1f">${escapeXml(row.label)}</text>
      </g>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">Bar chart of the 63 frozen PR #14 paths grouped into five mutually exclusive areas derived from pr14-path-classification.v1.json.</desc>
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="${margin.left}" y="36" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="700" fill="#1d1d1f">${escapeXml(title)}</text>
  <text x="${margin.left}" y="58" font-family="Inter, system-ui, sans-serif" font-size="13" fill="#6b6b6b">Counts are computed from derived classification records; total must equal 63.</text>
  <line x1="${margin.left}" y1="${margin.top + chartH}" x2="${margin.left + chartW}" y2="${margin.top + chartH}" stroke="#1d1d1f" stroke-width="1.5"/>
  ${bars}
</svg>
`;
}

function buildTimelineSvg(events) {
  const width = 980;
  const rowH = 34;
  const margin = { top: 78, right: 28, bottom: 28, left: 28 };
  const height = margin.top + margin.bottom + events.length * rowH;
  const title = "Decomposition timeline: PR #14 close and #15–#20 merges";
  const rows = events
    .map((event, index) => {
      const y = margin.top + index * rowH;
      const fill =
        event.kind === "pr_closed"
          ? "#b91c1c"
          : event.kind === "pr_merged"
            ? "#047857"
            : "#0066cc";
      return `
      <g>
        <circle cx="${margin.left + 10}" cy="${y}" r="6" fill="${fill}"/>
        <text x="${margin.left + 28}" y="${y + 5}" font-family="Inter, system-ui, sans-serif" font-size="14" fill="#1d1d1f">${escapeXml(event.at)} — ${escapeXml(event.label)} (${escapeXml(event.rawRef)})</text>
      </g>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">Vertical timeline of PR #14 create/close and replacement PR create/merge timestamps taken from decomposition-timeline.v1.json raw snapshot identifiers.</desc>
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="${margin.left}" y="34" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="700" fill="#1d1d1f">${escapeXml(title)}</text>
  <text x="${margin.left}" y="56" font-family="Inter, system-ui, sans-serif" font-size="13" fill="#6b6b6b">Each event timestamp and rawRef come from committed derived timeline records.</text>
  <line x1="${margin.left + 10}" y1="${margin.top - 8}" x2="${margin.left + 10}" y2="${margin.top + (events.length - 1) * rowH}" stroke="#c7c7cc" stroke-width="2"/>
  ${rows}
</svg>
`;
}

export function buildProjectHealthVisuals() {
  const { classification, timeline } = loadDerived();
  const rows = categoryTotals(classification);
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (total !== 63) {
    throw new Error(`files-by-area chart total ${total} != 63`);
  }
  const filesSvg = buildFilesByAreaSvg(rows);
  const timelineSvg = buildTimelineSvg(timeline.events);
  return {
    filesByArea: {
      rel: "public/media/project-health/pr-14-files-by-area.svg",
      contents: filesSvg,
      rows,
    },
    timeline: {
      rel: "public/media/project-health/decomposition-timeline.svg",
      contents: timelineSvg,
      events: timeline.events,
    },
  };
}

function main() {
  const assets = buildProjectHealthVisuals();
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(root, assets.filesByArea.rel),
    assets.filesByArea.contents,
  );
  fs.writeFileSync(path.join(root, assets.timeline.rel), assets.timeline.contents);
  console.log(`Wrote ${assets.filesByArea.rel}`);
  console.log(`Wrote ${assets.timeline.rel}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
