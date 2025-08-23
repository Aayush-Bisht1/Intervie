"use client";
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import React, { useEffect } from 'react'

function Provider({ children }: any) {
    const { user } = useUser();
    const createUser = useMutation(api.users.createNewUser);

    useEffect(() => {
        user && createNewUser();
    },[user])
    
    const createNewUser = () => {
        if (user) {
            const result = createUser({
                name: user?.fullName || "",
                email: user?.primaryEmailAddress?.emailAddress || "",
                imageUrl: user?.imageUrl || ""
            });
            console.log(result);
        }
    }
    return (
        <div>{children}</div>
    )
}

export default Provider