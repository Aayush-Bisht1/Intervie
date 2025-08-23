import Image from 'next/image'
import React from 'react'
import logo from '@/app/_assets/interview.png'
import CreateIntDialog from '../_components/CreateIntDialog'

function EmptyState() {
    return (
        <div className='mt-14 flex flex-col items-center gap-5 border-4 border-dashed bg-gray-50 rounded-2xl p-10'>
            <Image src={logo} alt='empty-state' width={160} height={160} />
            <h2 className='mt-2 text-lg text-gray-500'>You do not have any Interview created</h2>
            <CreateIntDialog />
        </div>
    )
}

export default EmptyState