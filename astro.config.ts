import { defineConfig } from "astro/config";
import icon from "astro-icon";
import tailwindcss from "@tailwindcss/vite";
import nimbus, { defineConfig as defineNimbusConfig } from "@cloudflare/nimbus-docs";
import { tableScroll } from "@cloudflare/nimbus-docs/markdown";

/**
 * Indexing is off until M3 custom-domain verification succeeds.
 * Set SITE_INDEXABLE=true only for the verified production rebuild in M3.
 * M1 workers.dev previews must remain noindexed.
 */
const siteIndexable = process.env.SITE_INDEXABLE === "true";

const nimbusConfig = defineNimbusConfig({
  site: "https://lab.tianzhe.me",
  title: "Eazy Review Lab",
  description:
    "The public build journal, engineering reports, and product decisions behind Eazy Review.",
  locale: "en",
  github: "https://github.com/tyson-hu/eazy-review-lab",
  editPattern: "https://github.com/tyson-hu/eazy-review-lab/edit/main/{path}",
  socialImageAlt: "Eazy Review Lab",
  head: siteIndexable
    ? []
    : [
        {
          tag: "meta",
          attrs: { name: "robots", content: "noindex, nofollow" },
        },
      ],
  sidebar: {
    scope: "full",
    items: [
      { label: "Home", link: "/" },
      { label: "Project", link: "/project" },
      { label: "Journal", link: "/journal" },
      { label: "Reports", link: "/reports" },
      { label: "Decisions", link: "/decisions" },
      { label: "Experiments", link: "/experiments" },
      {
        label: "App Source",
        link: "https://github.com/tyson-hu/Eazy-Review",
      },
    ],
  },
});

export default defineConfig({
  output: "static",
  vite: {
    plugins: [tailwindcss()],
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  integrations: [
    icon(),
    nimbus(nimbusConfig, {
      rules: {
        "nimbus/frontmatter-shape": "error",
        "nimbus/internal-link": "error",
      },
      markdown: {
        hastPlugins: [tableScroll()],
      },
    }),
  ],
});
