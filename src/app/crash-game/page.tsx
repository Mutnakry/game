// import SetupFirebaseDB from "@/components/setup-firebase-db"
// import GameHistory from "@/components/game-history"

// export default function CrashGameSetupPage() {
//   return (
//     <div className="container mx-auto py-8 space-y-8">
//       <h1 className="text-3xl font-bold text-center mb-8">Crash Game Firebase Setup</h1>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//         <SetupFirebaseDB />
//         <GameHistory />
//       </div>
//     </div>
//   )
// }





import MiniCrash from "@/components/crash-predictor-with-firebase"

import MiniCrashFirebase from "@/components/crash-predictor-with-firebase"
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-black">
      <MiniCrash />
      <hr />
      {/* <MiniCrashFirebase/> */}
    </main>
  )
}