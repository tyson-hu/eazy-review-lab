import { config } from "virtual:nimbus/config";

export const prerender = true;

const siteIndexable = process.env.SITE_INDEXABLE === "true";

export function GET() {
  const body = siteIndexable
    ? [
        "User-agent: *",
        "Allow: /",
        "",
        `Sitemap: ${new URL("/sitemap-index.xml", config.site).href}`,
        "",
      ].join("\n")
    : [
        "User-agent: *",
        "Disallow: /",
        "",
        "# Preview / pre-launch build — crawling disallowed until M3",
        "# custom-domain verification enables production indexing.",
        "",
      ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
