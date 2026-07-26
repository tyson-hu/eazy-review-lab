import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { docsCollection, partialsCollection } from "@cloudflare/nimbus-docs/content";

const sourceRefSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

/** YAML may parse ISO timestamps as Date; keep either string or Date. */
const isoDateTime = z.union([
  z.string().datetime({ offset: true }),
  z.date(),
]);

const isoDate = z.preprocess((val) => {
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return val;
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/));

export const collections = {
  docs: defineCollection(
    docsCollection({
      schemaFields: {
        kind: z
          .enum([
            "project",
            "journal",
            "report",
            "decision",
            "experiment",
            "section",
          ])
          .optional(),
        project: z.literal("eazy-review").optional(),
        publishedAt: isoDateTime.optional(),
        tags: z.array(z.string()).default([]),
        featured: z.boolean().default(false),
        aiGenerated: z.boolean().default(false),
        humanReviewedAt: isoDateTime.optional(),
        reviewedBy: z.string().min(1).optional(),
        sourceRefs: z.array(sourceRefSchema).default([]),
        sourceRepository: z
          .string()
          .regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/)
          .optional(),
        sourceCommit: z
          .string()
          .regex(/^[a-f0-9]{40}$/)
          .optional(),
        sourcePath: z.string().min(1).optional(),
        lastVerifiedAt: isoDate.optional(),
        audience: z.literal("human").optional(),
      },
    }),
  ),
  partials: defineCollection(partialsCollection()),
};
