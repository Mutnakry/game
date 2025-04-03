import React from 'react'
import Navbar from '@/components/Navbar'

function page() {
  return (
    <div>
      <Navbar />
      <div>
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
          <p className='text-xl'>Hello</p>
        </div>
      </div>
    </div>
  )
}

export default page