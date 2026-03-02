import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    // Return defaults if no settings exist
    if (!settings) {
      return {
        language: "en-US",
        autoRefine: false,
        theme: "dark",
      };
    }

    return settings;
  },
});

export const update = mutation({
  args: {
    language: v.optional(v.string()),
    autoRefine: v.optional(v.boolean()),
    theme: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();

    if (existing) {
      const updates: Record<string, unknown> = { updatedAt: now };
      if (args.language !== undefined) updates.language = args.language;
      if (args.autoRefine !== undefined) updates.autoRefine = args.autoRefine;
      if (args.theme !== undefined) updates.theme = args.theme;

      await ctx.db.patch(existing._id, updates);
      return existing._id;
    } else {
      return await ctx.db.insert("userSettings", {
        userId,
        language: args.language ?? "en-US",
        autoRefine: args.autoRefine ?? false,
        theme: args.theme ?? "dark",
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});
