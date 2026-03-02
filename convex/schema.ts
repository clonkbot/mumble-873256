import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // Transcriptions - raw speech-to-text captures
  transcriptions: defineTable({
    userId: v.id("users"),
    rawText: v.string(),
    refinedText: v.optional(v.string()),
    duration: v.number(), // recording duration in seconds
    status: v.union(v.literal("raw"), v.literal("refining"), v.literal("refined")),
    title: v.optional(v.string()),
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_created", ["userId", "createdAt"]),

  // User settings/preferences
  userSettings: defineTable({
    userId: v.id("users"),
    language: v.string(),
    autoRefine: v.boolean(),
    theme: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Quick snippets/templates for common refinements
  snippets: defineTable({
    userId: v.id("users"),
    name: v.string(),
    content: v.string(),
    shortcut: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
