import Image from 'next/image'
import React from 'react'
import img from '@/app/_assets/int.png'
import { Button } from '@/components/ui/button'
import { ArrowRight, Send } from 'lucide-react'
import { Input } from '@/components/ui/input'

function Interview() {
  return (
    <div className='flex flec-col items-center justify-center mt-24 '>
      <div className='max-w-3xl w-full'>
        <Image src={img} alt='interview' width={400}
          height={200}
          className='w-full h-[300px] object-fit' />
        <div className='flex flex-col items-center p-6 space-y-4'>
          <h2 className='font-bold text-4xl text-center'>Ready to Start Interview?</h2>
          <p className='text-gray-500 text-center'>The interview will last 30 minutes. Are you ready to begin ?</p>
          <Button size={'lg'} className='bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold shadow-lg'>Start Interview <ArrowRight /></Button>
          <hr />
          <div className='p-6 bg-gray-50 rounded-2xl'>
            <h2 className='font-semibold text-2xl'>Want to sent interview link to someone?</h2>
            <div className='flex gap-5 items-center max-w-xl mt-3'>
              <Input className='w-full' placeholder='Enter email address' />
              <Button className='bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold shadow-lg'><Send /></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Interview