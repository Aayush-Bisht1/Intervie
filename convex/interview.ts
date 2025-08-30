import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const saveInterviewQuestions = mutation({
    args: {
        uid: v.id('UserTable'),
        resumeUrl: v.optional(v.string()),
        jobtitle: v.optional(v.string()),
        jobdescription: v.optional(v.string()),
        questions: v.any(),
    },
    handler: async (ctx, args) => {
        const result = await ctx.db.insert('InterviewSessionTable', {
            userId: args.uid,
            resumeUrl: args.resumeUrl || null,
            interviewQuestions: args.questions,
            jobTitle: args.jobtitle || null,
            jobDescription: args.jobdescription || null,
            status: 'Draft',
            feedback: null
        })
        return result;
    }
})

export const getInterviewQuestions = query({
    args: {
        interviewId: v.id('InterviewSessionTable')
    },
    handler: async (ctx, args) => {
        const result = await ctx.db.query('InterviewSessionTable').filter(q => q.eq(q.field('_id'), args.interviewId)).collect()

        return result[0];
    }
})

export const getInterviewList = query({
    args: {
        uid: v.id('UserTable')
    },
    handler: async (ctx, args) => {
        const result = await ctx.db.query('InterviewSessionTable')
            .filter(q => q.eq(q.field('userId'), args.uid))
            .order('desc')
            .collect();
        return result;
    }
})

export const storeFeedback = mutation({
    args: {
        interviewId: v.string(),
        feedback: v.any()
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.interviewId as any, {
            feedback: args.feedback,
            status: "Completed"
        });
        return { success: true };
    }
})

export const getFeedback = query({
    args: { interviewId: v.id('InterviewSessionTable') },
    handler: async (ctx, args) => {
    const interview = await ctx.db.get(args.interviewId);
    
    if (!interview) {
      throw new Error("Interview not found");
    }
    
    return {
      ...interview,
      feedback: interview.feedback || null 
    };
  },
});