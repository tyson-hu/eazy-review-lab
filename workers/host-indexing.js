/**
 * Host-aware indexing guard for static assets.
 *
 * Production HTML/robots may be indexable after M3 verification, but every
 * workers.dev and non-production preview host must remain noindexed even when
 * the same Worker version serves both hosts.
 */

const PRODUCTION_HOST = "lab.tianzhe.me";
const PREVIEW_ROBOTS = [
  "User-agent: *",
  "Disallow: /",
  "",
  "# Non-production host — crawling disallowed.",
  "",
].join("\n");

function isProductionHost(hostname) {
  return hostname === PRODUCTION_HOST;
}

class RobotsMetaRewriter {
  /** @param {{ found: boolean }} state */
  constructor(state) {
    this.state = state;
  }

  /** @param {Element} element */
  element(element) {
    const name = element.getAttribute("name")?.toLowerCase();
    if (name !== "robots") return;
    this.state.found = true;
    element.setAttribute("content", "noindex, nofollow");
    element.setAttribute("data-host-indexing", "preview");
  }
}

class HeadRobotsGuard {
  /** @param {{ found: boolean }} state */
  constructor(state) {
    this.state = state;
  }

  /** @param {Element} element */
  element(element) {
    const state = this.state;
    element.onEndTag((end) => {
      if (state.found) return;
      end.before(
        '<meta name="robots" content="noindex, nofollow" data-host-indexing="preview">',
        { html: true },
      );
    });
  }
}

export default {
  /**
   * @param {Request} request
   * @param {{ ASSETS: { fetch: typeof fetch } }} env
   */
  async fetch(request, env) {
    const url = new URL(request.url);
    const production = isProductionHost(url.hostname);

    if (!production && url.pathname === "/robots.txt") {
      return new Response(PREVIEW_ROBOTS, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (production) return assetResponse;

    const contentType = assetResponse.headers.get("Content-Type") ?? "";
    if (!contentType.includes("text/html")) return assetResponse;

    const state = { found: false };
    const rewritten = new HTMLRewriter()
      .on('meta[name="robots"]', new RobotsMetaRewriter(state))
      .on("head", new HeadRobotsGuard(state))
      .transform(assetResponse);

    const headers = new Headers(rewritten.headers);
    headers.set("Cache-Control", "no-store");
    return new Response(rewritten.body, {
      status: rewritten.status,
      statusText: rewritten.statusText,
      headers,
    });
  },
};
