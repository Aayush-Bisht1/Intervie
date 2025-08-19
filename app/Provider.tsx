"use client";
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import React, { useEffect } from 'react'

function Provider({ children }: any) {
    const { user } = useUser();
    const CreateUser = useMutation(api.users.createNewUser);
    console.log("User from Clerk", user);
    useEffect(()=>{
        user && createNewUser();
    },[user])

    const createNewUser = async () => {
        if (user) {
            const result = await CreateUser({
                name: user?.fullName ?? "",
                email: user?.primaryEmailAddress?.emailAddress ?? "",
                imageUrl: user?.imageUrl ?? "",
            })
            return result;
        }
    }

    return (
        <div>{children}</div>
    )
}

export default Provider