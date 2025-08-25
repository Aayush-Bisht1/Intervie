import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const createNewInterviewSession = mutation({
    args: {
        userId: v.id("UserTable"),
        resumeUrl: v.string(),
        interviewQuestions: v.any(),
        status: v.string(),
        jobTitle: v.optional(v.string()),
        jobDescription: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const data = {
            userId: args.userId,
            resumeUrl: args.resumeUrl,
            interviewQuestions: args.interviewQuestions,
            status: args.status
        }
        const result = await ctx.db.insert("InterviewSessionTable", {
            ...data
        });
        console.log(result);
        return {
            ...data
        }
    }
}) 