import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const saveInterviewQuestions = mutation({
    args: {
        uid: v.id('UserTable'),
        resumeUrl: v.optional(v.string()),
        jobtitle: v.optional(v.string()),
        jobdescription: v.optional(v.string()),
        questions: v.any()
    },
    handler: async (ctx,args) => {
        const result = await ctx.db.insert('InterviewSessionTable',{
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