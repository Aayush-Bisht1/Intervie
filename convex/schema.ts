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
    }),
    LiveInterviewTable: defineTable({
        interviewerId: v.id("UserTable"),
        interviewerName: v.string(),
        interviewerEmail: v.string(),
        candidateName: v.string(),
        candidateEmail: v.string(),
        position: v.string(),
        duration: v.number(),
        scheduledTime: v.string(),
        interviewType: v.string(),
        status: v.string(), // 'scheduled', 'ongoing', 'completed', 'cancelled'
        interviewLink: v.string(),
        createdAt: v.number(),
        startedAt: v.optional(v.union(v.number(), v.null())),
        endedAt: v.optional(v.union(v.number(), v.null()))
    }).index("by_interviewer", ["interviewerId"])
      .index("by_status", ["status"])
      .index("by_link", ["interviewLink"])
})