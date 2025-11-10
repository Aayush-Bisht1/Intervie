import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createLiveInterview = mutation({
    args: {
        interviewerId: v.id('UserTable'),
        interviewerName: v.string(),
        interviewerEmail: v.string(),
        candidateName: v.string(),
        candidateEmail: v.string(),
        position: v.string(),
        duration: v.number(),
        scheduledTime: v.string(),
        interviewType: v.string(),
        interviewLink: v.string(),
    },
    handler: async (ctx, args) => {
        const interviewId = await ctx.db.insert('LiveInterviewTable', {
            interviewerId: args.interviewerId,
            interviewerName: args.interviewerName,
            interviewerEmail: args.interviewerEmail,
            candidateName: args.candidateName,
            candidateEmail: args.candidateEmail,
            position: args.position,
            duration: args.duration,
            scheduledTime: args.scheduledTime,
            interviewType: args.interviewType,
            status: 'scheduled',
            interviewLink: args.interviewLink,
            createdAt: Date.now(),
        });
        return interviewId;
    }
});

export const getLiveInterview = query({
    args: {
        interviewLink: v.string()
    },
    handler: async (ctx, args) => {
        const interview = await ctx.db
            .query('LiveInterviewTable')
            .withIndex('by_link', q => q.eq('interviewLink', args.interviewLink))
            .first();
        return interview;
    }
});

export const getLiveInterviewsByInterviewer = query({
    args: {
        interviewerId: v.id('UserTable')
    },
    handler: async (ctx, args) => {
        const interviews = await ctx.db
            .query('LiveInterviewTable')
            .withIndex('by_interviewer', q => q.eq('interviewerId', args.interviewerId))
            .order('desc')
            .collect();
        return interviews;
    }
});

export const getAllInterviewsByUser = query({
    args: {
        userId: v.id('UserTable')
    },
    handler: async (ctx, args) => {
        // Get AI interviews
        const aiInterviews = await ctx.db
            .query('InterviewSessionTable')
            .filter(q => q.eq(q.field('userId'), args.userId))
            .order('desc')
            .collect();

        // Get live interviews where user is interviewer
        const liveInterviews = await ctx.db
            .query('LiveInterviewTable')
            .withIndex('by_interviewer', q => q.eq('interviewerId', args.userId))
            .order('desc')
            .collect();

        return {
            aiInterviews,
            liveInterviews
        };
    }
});

export const updateInterviewStatus = mutation({
    args: {
        interviewId: v.id('LiveInterviewTable'),
        status: v.string(),
        startedAt: v.optional(v.union(v.number(), v.null())),
        endedAt: v.optional(v.union(v.number(), v.null())),
    },
    handler: async (ctx, args) => {
        const updates: any = { status: args.status };
        if (args.startedAt !== undefined) updates.startedAt = args.startedAt;
        if (args.endedAt !== undefined) updates.endedAt = args.endedAt;
        
        await ctx.db.patch(args.interviewId, updates);
        return { success: true };
    }
});