import { PricingTable } from '@clerk/nextjs'
import React from 'react'

function Upgade() {
  return (
    <div style={{ margin: '0 auto', padding: '0 1rem', marginTop: '100px' }}
      className='flex flex-col items-center justify-between'
    >
      <h2 className='font-bold text-3xl mt-8 mb-10'>Upgrade to Paid Plans</h2>
      <PricingTable />
    </div>
  )
}

export default Upgade