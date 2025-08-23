"use client"
import { useUser } from '@clerk/nextjs';
import React, { useState } from 'react'
import EmptyState from './EmptyState';
import CreateIntDialog from '../_components/CreateIntDialog';

function Dashboard() {
  const { user } = useUser();
  const [interviewList, setInterviewList] = useState<any[]>([]);
  return (
    <div className='mt-5 py-20 px-10 md:px-28 lg:px-44 xl:px-56'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-lg text-gray-500'>My DashBoard</h2>
          <h2 className='text-3xl font-bold'>Welcome, {user?.fullName}</h2>
        </div>
        <CreateIntDialog/>
      </div>
      {
        interviewList.length === 0 ? (
          <EmptyState/>
        ) : (
          <div>
            {/* List of interviews will be shown here */}
          </div>
        )
      }

    </div>
  )
}

export default Dashboard