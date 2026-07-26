import { getCollection, type CollectionEntry } from "astro:content";

/** Canonical production origin for absolute feed URLs. */
export const LAB_SITE = "https://lab.tianzhe.me";

const FEED_KINDS = new Set(["journal", "report", "experiment"]);

export type FeedEntry = {
  id: string;
  slug: string;
  title: string;
  description: string;
  publishedAt: Date;
  url: string;
  tags: string[];
  project: string;
  kind: string;
  featured: boolean;
  socialImage: string | undefined;
};

function isPublishable(data: CollectionEntry<"docs">["data"]): boolean {
  if (data.draft) return false;
  if (!data.aiGenerated) return true;
  return Boolean(data.humanReviewedAt && data.reviewedBy);
}

function toDate(value: Date | string | undefined): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function absoluteUrl(pathname: string): string {
  return new URL(pathname, LAB_SITE).href;
}

function socialImageUrl(
  entry: CollectionEntry<"docs">,
): string | undefined {
  const raw = entry.data.socialImage ?? `/og/${entry.id}.png`;
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  return absoluteUrl(raw.startsWith("/") ? raw : `/${raw}`);
}

/** Canonical trailing-slash path for a docs entry id. */
export function entryPath(id: string): string {
  return `/${id.replace(/\/index$/, "")}/`;
}

/**
 * Publishable journal/report/experiment entries for RSS and JSON Feed.
 * Sorted by publishedAt descending, then canonical slug ascending.
 */
export async function getFeedEntries(): Promise<FeedEntry[]> {
  const docs = await getCollection("docs");
  const items: FeedEntry[] = [];

  for (const entry of docs) {
    const kind = entry.data.kind;
    if (!kind || !FEED_KINDS.has(kind)) continue;
    if (!isPublishable(entry.data)) continue;

    const publishedAt = toDate(entry.data.publishedAt);
    if (!publishedAt) continue;

    const path = entryPath(entry.id);
    items.push({
      id: entry.id,
      slug: path,
      title: entry.data.title,
      description: entry.data.description ?? "",
      publishedAt,
      url: absoluteUrl(path),
      tags: entry.data.tags ?? [],
      project: entry.data.project ?? "eazy-review",
      kind,
      featured: entry.data.featured ?? false,
      socialImage: socialImageUrl(entry),
    });
  }

  items.sort((a, b) => {
    const byDate = b.publishedAt.getTime() - a.publishedAt.getTime();
    if (byDate !== 0) return byDate;
    return a.slug.localeCompare(b.slug);
  });

  return items;
}
