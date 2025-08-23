import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createNewUser = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        imageUrl: v.string()
    },
    handler: async (ctx, args) => {
        const existingUser = await ctx.db.query("UserTable").filter(q => q.eq(q.field('email'), args.email)).collect();
        if (existingUser?.length === 0) {
            const data = {
                name: args.name,
                email: args.email,
                imageUrl: args.imageUrl
            }
            const result = await ctx.db.insert("UserTable", {
                ...data
            });
            console.log(result);
            
            return {
                ...data,
                result
                // id: result.id
            }
        }
        return existingUser[0];
    }
}) 