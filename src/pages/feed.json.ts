import { getFeedEntries, LAB_SITE } from "../lib/feeds";

export const prerender = true;

export async function GET() {
  const entries = await getFeedEntries();

  const body = {
    version: "https://jsonfeed.org/version/1.1",
    title: "Eazy Review Lab",
    home_page_url: `${LAB_SITE}/`,
    feed_url: `${LAB_SITE}/feed.json`,
    description:
      "The public build journal, engineering reports, and product decisions behind Eazy Review.",
    language: "en",
    items: entries.map((entry) => ({
      id: entry.url,
      url: entry.url,
      title: entry.title,
      summary: entry.description,
      date_published: entry.publishedAt.toISOString(),
      tags: entry.tags,
      ...(entry.socialImage ? { image: entry.socialImage } : {}),
      // Lab extensions for the personal-blog consumer contract.
      kind: entry.kind,
      project: entry.project,
      featured: entry.featured,
    })),
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/feed+json; charset=utf-8",
    },
  });
}
