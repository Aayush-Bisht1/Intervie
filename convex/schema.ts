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
        resumeUrl: v.union(v.string(),v.null()),
        interviewQuestions: v.any(),
        status: v.string(),
        jobTitle: v.union(v.string(),v.null()),
        jobDescription: v.union(v.string(),v.null()),
        feedback: v.optional(v.union(v.any(),v.null()))
    })
})