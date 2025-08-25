import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    UserTable: defineTable({
        name: v.string(),
        email: v.string(),
        imageUrl: v.string(),
    }),
    InterviewSessionTable: defineTable({
        userId: v.id("UserTable"),
        resumeUrl: v.optional(v.string()),
        interviewQuestions: v.any(),
        status: v.string(),
        jobTitle: v.optional(v.string()),
        jobDescription: v.optional(v.string())
    })
})