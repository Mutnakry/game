"use client"

import { useEffect, useRef } from "react"
import type { Particle } from "@/components/types/particles"

export function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationFrameIdRef = useRef<number | null>(null)

  // Initialize canvas and handle resize
  useEffect(() => {
    // Initialize particles
    const initParticles = () => {
      const newParticles: Particle[] = []
      for (let i = 0; i < 150; i++) {
        newParticles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: Math.random() * 3,
          speedX: (Math.random() - 0.5) * 0.2,
          speedY: (Math.random() - 0.5) * 0.2,
        })
      }
      particlesRef.current = newParticles
    }

    initParticles()

    // Handle window resize
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth
        canvasRef.current.height = window.innerHeight
      }
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
      }
    }
  }, [])

  // Animate star particles
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const animate = () => {
      if (!ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Create a gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, "rgba(30, 41, 59, 0.8)")
      gradient.addColorStop(1, "rgba(17, 24, 39, 0.8)")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Add nebula effect
      const nebulaGradient = ctx.createRadialGradient(
        canvas.width * 0.7,
        canvas.height * 0.3,
        0,
        canvas.width * 0.7,
        canvas.height * 0.3,
        canvas.width * 0.5,
      )
      nebulaGradient.addColorStop(0, "rgba(79, 70, 229, 0.1)")
      nebulaGradient.addColorStop(0.5, "rgba(67, 56, 202, 0.05)")
      nebulaGradient.addColorStop(1, "rgba(0, 0, 0, 0)")
      ctx.fillStyle = nebulaGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const particles = particlesRef.current

      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i]

        particle.x += particle.speedX
        particle.y += particle.speedY

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0

        // Create a glow effect
        const glow = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size * 2)
        glow.addColorStop(0, "rgba(255, 255, 255, 0.8)")
        glow.addColorStop(1, "rgba(255, 255, 255, 0)")

        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2)
        ctx.fill()

        // Draw the star
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size / 2, 0, Math.PI * 2)
        ctx.fill()
      }

      animationFrameIdRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
      }
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
}
