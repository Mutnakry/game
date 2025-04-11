

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