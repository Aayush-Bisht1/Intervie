"use client"
import { useUser } from '@clerk/nextjs';
import React, { useContext, useEffect, useState } from 'react'
import EmptyState from './_components/EmptyState';
import CreateIntDialog from '../_components/CreateIntDialog';
import { useConvex } from 'convex/react';
import { userDetailContext } from '@/context/userDetailContext';
import { api } from '@/convex/_generated/api';
import { InterviewData } from '../interview/[interviewId]/page';
import InterviewCard from './_components/InterviewCard';
import { Skeleton } from '@/components/ui/skeleton';

function Dashboard() {
  const { user } = useUser();
  const [interviewList, setInterviewList] = useState<InterviewData[]>([]);
  const { userDetail, setUserDetail } = useContext(userDetailContext);
  const [loading, setLoading] = useState(true)
  const convex = useConvex();
  async function getUserId() {
    const userid = await userDetail.then((res: any) => res._id);
    return userid;
  }

  useEffect(() => {
    if (userDetail) {
      getInterviewList();
    }
  }, [userDetail]);

  const getInterviewList = async () => {
    setLoading(true);
    const userId = await getUserId();
    const result = await convex.query(api.interview.getInterviewList, {
      uid: userId
    });
    setInterviewList(result);
    setLoading(false);
  }
  console.log(interviewList);

  return (
    <div className='mt-5 py-20 px-10 md:px-28 lg:px-44 xl:px-56'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-lg text-gray-500'>My DashBoard</h2>
          <h2 className='text-3xl font-bold'>Welcome, {user?.fullName}</h2>
        </div>
        <CreateIntDialog />
      </div>
      { 
      !loading &&
        interviewList.length == 0 ? (
          <EmptyState />
        ) : (
          <div className='grid grid-cols-2 md:grid-cols-3 gap-5 mt-10'>
            {
              interviewList.map((int, idx) => (
                <InterviewCard interviewInfo={int} key={idx} />
              ))
            }
          </div>
        )
      }
      {
        loading &&
        <div className='grid grid-cols-2 md:grid-cols-3 gap-5 mt-10'>
          {
            [1, 2, 3, 4, 5, 6].map((item, idx) => (
              <div className="flex flex-col space-y-3" key={idx}>
                <Skeleton className="h-[125px] w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))
          }
        </div>
      }

    </div>
  )
}

export default Dashboard