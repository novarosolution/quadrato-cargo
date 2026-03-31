import { z } from "zod";

export const timelineStageOverrideSchema = z.object({
  title: z.union([z.string().max(200), z.null()]).optional(),
  location: z.union([z.string().max(500), z.null()]).optional(),
  hint: z.union([z.string().max(2000), z.null()]).optional(),
  shownAt: z.union([z.string().max(64), z.null()]).optional()
});

export const timelineOverridesBodySchema = z.object({
  merge: z.boolean().optional(),
  domestic: z.record(z.string(), timelineStageOverrideSchema).optional(),
  international: z.record(z.string(), timelineStageOverrideSchema).optional()
});

/** Admin-only: which professional timeline steps appear on public Track (`false` = hide). */
export const timelineStepVisibilityPatchSchema = z.object({
  merge: z.boolean().optional(),
  domestic: z.record(z.string(), z.boolean()).optional(),
  international: z.record(z.string(), z.boolean()).optional()
});

export const adminTimelinePatchBodySchema = timelineOverridesBodySchema.extend({
  stepVisibility: timelineStepVisibilityPatchSchema.optional()
});
