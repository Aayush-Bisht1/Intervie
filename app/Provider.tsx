"use client";
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import React, { useEffect, useState } from 'react'
import { userDetailContext } from '@/context/userDetailContext';
import { createContext } from 'react';

function Provider({ children }: any) {
    const { user } = useUser();
    const [userDetail, setUserDetail] = useState<any>(null);
    const createUser = useMutation(api.users.createNewUser);

    useEffect(() => {
        user && createNewUser();
    }, [user])

    const createNewUser = () => {
        if (user) {
            const result = createUser({
                name: user?.fullName || "",
                email: user?.primaryEmailAddress?.emailAddress || "",
                imageUrl: user?.imageUrl || ""
            });
            console.log(result);
            setUserDetail(result);
        }
    }
    return (
        <userDetailContext.Provider value={{userDetail,setUserDetail}} >
            <div>
                {children}
            </div>
        </userDetailContext.Provider>
    )
}

export default Provider

export const useUserDetailContext = () => {
    return createContext(userDetailContext);
}