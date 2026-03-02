import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const limit = args.limit ?? 50;

    return await ctx.db
      .query("transcriptions")
      .withIndex("by_user_and_created", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

export const get = query({
  args: { id: v.id("transcriptions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const transcription = await ctx.db.get(args.id);
    if (!transcription || transcription.userId !== userId) return null;

    return transcription;
  },
});

export const create = mutation({
  args: {
    rawText: v.string(),
    duration: v.number(),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();

    return await ctx.db.insert("transcriptions", {
      userId,
      rawText: args.rawText,
      duration: args.duration,
      status: "raw",
      title: args.title,
      tags: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("transcriptions"),
    rawText: v.optional(v.string()),
    refinedText: v.optional(v.string()),
    status: v.optional(v.union(v.literal("raw"), v.literal("refining"), v.literal("refined"))),
    title: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const transcription = await ctx.db.get(args.id);
    if (!transcription || transcription.userId !== userId) {
      throw new Error("Transcription not found");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.rawText !== undefined) updates.rawText = args.rawText;
    if (args.refinedText !== undefined) updates.refinedText = args.refinedText;
    if (args.status !== undefined) updates.status = args.status;
    if (args.title !== undefined) updates.title = args.title;
    if (args.tags !== undefined) updates.tags = args.tags;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("transcriptions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const transcription = await ctx.db.get(args.id);
    if (!transcription || transcription.userId !== userId) {
      throw new Error("Transcription not found");
    }

    await ctx.db.delete(args.id);
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const transcriptions = await ctx.db
      .query("transcriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const totalDuration = transcriptions.reduce((acc, t) => acc + t.duration, 0);
    const totalWords = transcriptions.reduce((acc, t) => {
      const text = t.refinedText || t.rawText;
      return acc + text.split(/\s+/).filter(Boolean).length;
    }, 0);

    return {
      totalTranscriptions: transcriptions.length,
      totalDuration,
      totalWords,
      refinedCount: transcriptions.filter(t => t.status === "refined").length,
    };
  },
});
