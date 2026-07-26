import rss from "@astrojs/rss";
import { getFeedEntries, LAB_SITE } from "../lib/feeds";

export const prerender = true;

export async function GET() {
  const entries = await getFeedEntries();

  return rss({
    title: "Eazy Review Lab",
    description:
      "The public build journal, engineering reports, and product decisions behind Eazy Review.",
    site: LAB_SITE,
    trailingSlash: true,
    xmlns: {
      atom: "http://www.w3.org/2005/Atom",
      lab: "https://lab.tianzhe.me/ns/feed",
    },
    customData: [
      "<language>en</language>",
      `<atom:link href="${LAB_SITE}/feed.xml" rel="self" type="application/rss+xml"/>`,
    ].join(""),
    items: entries.map((entry) => ({
      title: entry.title,
      description: entry.description,
      pubDate: entry.publishedAt,
      // Relative path; @astrojs/rss joins with site → absolute lab.tianzhe.me URL.
      link: entry.slug,
      categories: entry.tags,
      ...(entry.socialImage
        ? {
            enclosure: {
              url: entry.socialImage,
              type: "image/png",
              length: 0,
            },
          }
        : {}),
      customData: [
        `<lab:kind>${escapeXml(entry.kind)}</lab:kind>`,
        `<lab:project>${escapeXml(entry.project)}</lab:project>`,
        `<lab:featured>${entry.featured ? "true" : "false"}</lab:featured>`,
      ].join(""),
    })),
  });
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
