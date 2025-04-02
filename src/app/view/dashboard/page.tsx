// 'use client';
// import React, { useEffect } from 'react'
// import Navbar from '../../components/Navbar'
// import { useRouter } from "next/navigation";
// import { auth } from "../../firebase";

// function page() {
//   const router = useRouter();
//   useEffect(() => {
//     const unsubscribe = auth.onAuthStateChanged(user => {
//       if (user) {
//         router.push("/login");
//       }
//     });
//     return () => unsubscribe();
//   }, []);

//   return (
//     <div>
//       <Navbar />
//       <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
//         <p className='text-xl'>Hello</p>
//       </div>
//     </div>
//   )
// }

// export default page


'use client';
import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { useRouter } from "next/navigation";
import { auth } from "../../firebase";

function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        router.push("/login"); // Redirect to login if not auth
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-xl animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
        <p className='text-xl'>Hello</p>
      </div>
    </div>
  );
}

export default Page;
