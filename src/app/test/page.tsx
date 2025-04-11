
import MiniCrashFirebase from "@/components/crash-predictor-with-firebase"
// import { GameHistory } from "@/components/game-history"
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-black">
     
      <MiniCrashFirebase/>
      <hr />
      {/* <GameHistory/> */}
    </main>
  )
}