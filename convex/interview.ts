import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const saveInterviewQuestions = mutation({
    args: {
        uid: v.id('UserTable'),
        resumeUrl: v.optional(v.string()),
        jobtitle: v.optional(v.string()),
        jobdescription: v.optional(v.string()),
        questions: v.any()
    },
    handler: async (ctx, args) => {
        const result = await ctx.db.insert('InterviewSessionTable', {
            userId: args.uid,
            resumeUrl: args.resumeUrl || null,
            interviewQuestions: args.questions,
            jobTitle: args.jobtitle || null,
            jobDescription: args.jobdescription || null,
            status: 'Draft'
        })
        return result;
    }
})

export const getInterviewQuestions = query({
    args: {
        interviewId: v.id('InterviewSessionTable')
    },
    handler: async (ctx, args) => {0
        const result = await ctx.db.query('InterviewSessionTable').filter(q=> q.eq(q.field('_id'),args.interviewId)).collect();

        return result[0];
    }
})