"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { button, div } from "framer-motion/client";

const multiplierRanges = [
  { range: [1.01, 3], weight: 50 },
  { range: [2, 5], weight: 30 },
  { range: [5, 10], weight: 15 },
  { range: [10, 50], weight: 4 },
  { range: [50, 100], weight: 1 },
];

export default function MiniCrashGame() {
  const [multiplier, setMultiplier] = useState(1.0);
  const [running, setRunning] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [bet, setBet] = useState(1);
  const [autoCashOut, setAutoCashOut] = useState(2.5);
  const [isAutoMode, setIsAutoMode] = useState<"bet" | "auto">("bet");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [multiplierPoints, setMultiplierPoints] = useState<{ x: number; y: number }[]>([])


  function getRandomMultiplier(): number {
    const totalWeight = multiplierRanges.reduce((sum, r) => sum + r.weight, 0);
    const rand = Math.random() * totalWeight;
    let cumulative = 0;
    for (const r of multiplierRanges) {
      cumulative += r.weight;
      if (rand <= cumulative) {
        const [min, max] = r.range;
        return parseFloat((Math.random() * (max - min) + min).toFixed(2));
      }
    }
    return 1.0;
  }

  const getPlaneAngle = () => {
    if (multiplierPoints.length < 2) return 0
    const prev = multiplierPoints[multiplierPoints.length - 2]
    const curr = multiplierPoints[multiplierPoints.length - 1]
    const dx = curr.x - prev.x
    const dy = curr.y - prev.y
    return Math.atan2(dy, dx) * (180 / Math.PI)
  }


  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setMultiplier((prev) => {
          const next = +(prev + 0.01 * Math.exp(prev / 2)).toFixed(2)

          // Add point to graph
          setMultiplierPoints((points) => [
            ...points,
            {
              x: points.length * 10, // increase X by fixed value (e.g., 10px per tick)
              y: 800 - Math.min(next * 20, 780), // inverted Y axis (800 = bottom), scale multiplier visually
            },
          ])

          if (crashPoint !== null && next >= crashPoint) crashGame()
          return next
        })
      }, 100)
    } else {
      clearInterval(intervalRef.current!)
    }

    return () => clearInterval(intervalRef.current!)
  }, [running, crashPoint])

  const getPathD = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return ""

    let d = `M ${points[0].x} ${points[0].y}`

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const cx = (prev.x + curr.x) / 2
      const cy = (prev.y + curr.y) / 2
      d += ` Q ${prev.x} ${prev.y}, ${cx} ${cy}`
    }

    return d
  }


  const startGame = () => {
    setMultiplier(1.0);
    setCrashPoint(getRandomMultiplier());
    setCrashed(false);
    setRunning(true);
  };

  const crashGame = () => {
    setRunning(false);
    setMultiplier(0);
    setCrashed(true);
  };

  const handleCashOut = () => {
    setRunning(false);
    alert(`You cashed out at ${multiplier}x, won ${(multiplier * bet).toFixed(2)} CNY`);
  };

  useEffect(() => {
    if (running && multiplier >= autoCashOut) {
      handleCashOut();
    }
  }, [multiplier, autoCashOut, running]);

  return (
    <div className="flex flex-col items-center justify-center max-w-screen-xl bg-black text-white mx-auto overflow-hidden rounded-xl">

      <div className="w-full md:h-[600px] h-[400px] border border-gray-500 rounded-lg overflow-hidden">
        <div className="bg-yellow-600 w-full py-1 text-center text-white font-bold text-sm">FUN MODE</div>

        <div className="relative h-full w-full bg-slate-400 "
          style={{
            backgroundImage: "url('/bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center">
            {crashed ? (
              <>
                <div className="text-red-600 text-3xl mb-2">FLEW AWAY!</div>
                <div className="text-red-600 text-7xl font-bold">{crashPoint?.toFixed(2)}x</div>
              </>
            ) : (
              <div className="relative w-48 h-48 flex items-center justify-center">
                <div className="absolute w-full h-full border-4 border-white border-t-transparent border-dashed rounded-full animate-spin" />
                <div className="text-white text-7xl font-bold z-10">
                  {multiplier.toFixed(2)}x
                </div>
              </div>
            )}
          </div>
          {/* Plane Path */}

          <path
            d={`${getPathD(multiplierPoints)} L ${multiplierPoints[multiplierPoints.length - 1]?.x || 0} 800 L 0 800 Z`}
            fill="rgba(255, 0, 0, 0.2)"
          />


          <svg className="absolute bottom-[20px] left-0 w-full h-full" viewBox="0 0 1000 800" preserveAspectRatio="none">
            <path
              d={getPathD(multiplierPoints)}
              fill="none"
              stroke="red"
              strokeWidth="4"
            />
            <path
              d={`${getPathD(multiplierPoints)} L ${multiplierPoints[multiplierPoints.length - 1]?.x || 0} 800 L 0 800 Z`}
              fill="rgba(255, 0, 0, 0.2)"
            />
          </svg>

          {multiplierPoints.length > 1 && !crashed && (
            <div
              className="absolute z-30"
              style={{
                left: `${multiplierPoints[multiplierPoints.length - 1].x}px`,
                top: `${multiplierPoints[multiplierPoints.length - 1].y}px`,
                transform: `translate(-50%, -50%) rotate(${getPlaneAngle()}deg)`,
                transition: "left 0.1s linear, top 0.1s linear",
              }}
            >
              <Image src="/plane.png" alt="plane" width={40} height={40} />
            </div>
          )}
          <div className="absolute bottom-[36px] -rotate-180 left-[10px] z-30">
            <Image src="/plane.png" alt="plane" width={80} height={80} />
          </div>
        </div>

      </div>
      <div className=" bottom-0 left-0 w-full bg-black grid grid-cols-1 md:grid-cols-2  justify-center gap-10 py-4 ">
        {[0, 1].map((index) => (
          <div key={index} className="bg-[#111] px-6 py-4 rounded-md flex flex-col items-center gap-3 w-full">
            <div className="flex items-center justify-between bg-black rounded-full px-2 py-1 w-[160px]">
              <span
                onClick={() => setIsAutoMode("bet")}
                className={`text-sm px-4 cursor-pointer ${isAutoMode === "bet" ? "text-white/100" : "text-white/60"}`}
              >
                Bet
              </span>

              <span
                onClick={() => setIsAutoMode("auto")}
                className={`text-sm px-4 cursor-pointer ${isAutoMode === "auto" ? "text-white/100" : "text-white/30"}`}
              >
                Auto
              </span>

            </div>
            <div className="flex gap-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between bg-black border border-gray-600 px-4 py-1 rounded-full w-[160px]">
                  <button onClick={() => setBet(bet - 1)} disabled={bet <= 1} className="text-white px-2 border rounded-full">-</button>
                  <span className="text-white font-bold">{bet.toFixed(2)}</span>
                  <button onClick={() => setBet(bet + 1)} className="text-white px-2 border rounded-full" >+</button>
                </div>

                <div className="grid grid-cols-2 gap-2 w-full px-2">
                  {[10, 20, 50, 100].map(val => (
                    <button
                      key={val}
                      onClick={() => setBet(val)}
                      className="text-white text-sm bg-transparent border-0"
                    >
                      {val.toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={startGame}
                disabled={running}
                className="bg-green-700 w-full text-white text-lg rounded-lg py-2 px-20"
              >
                <div className="leading-tight font-semibold">BET</div>
                <div className="text-sm">{bet.toFixed(2)} <span className="text-xs">CNY</span></div>
              </button>

            </div>
            <div>
              {isAutoMode === "auto" && (
                <button className="bg-purple-700 text-white px-4 py-2 rounded-lg">
                  Auto
                </button>
              )}

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
