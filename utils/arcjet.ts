import arcjet, { tokenBucket } from "@arcjet/next";

export const aj = arcjet({
    key: process.env.ARCJET_KEY!, // Get your site key from https://app.arcjet.com
    rules: [
        tokenBucket({
            mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
            characteristics: ["userId"], // track requests by a custom user ID
            refillRate: 5, // 5 refill per day
            interval: 10, // interval is 1 day 
            capacity: 5, // bucket maximum capacity of 5 tokens
        }),
    ],
});