"use client"

import { useEffect, useRef } from "react"

interface ParticlesProps extends React.HTMLAttributes<HTMLDivElement> {
  quantity?: number
  ease?: number
  color?: string
  refresh?: boolean
}

export function Particles({
  className,
  quantity = 100,
  ease = 80,
  color = "#ffffff",
  refresh = false,
  ...props
}: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const particles = useRef<Array<{ x: number; y: number; vx: number; vy: number }>>([])
  const animationFrameId = useRef<number | undefined>(undefined)
  const lastTimestamp = useRef<number>(0)
  const colorRef = useRef(color)

  // Update color reference when prop changes
  useEffect(() => {
    colorRef.current = color
  }, [color])

  const handleResize = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas size to window size
    const width = window.innerWidth
    const height = window.innerHeight

    // Set canvas size with device pixel ratio
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const context = canvas.getContext("2d")
    if (context) {
      context.scale(dpr, dpr)
      contextRef.current = context
    }

    initParticles()
  }

  const initParticles = () => {
    const width = window.innerWidth
    const height = window.innerHeight

    particles.current = Array.from({ length: quantity }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
    }))
  }

  const animate = (timestamp: number) => {
    const canvas = canvasRef.current
    const context = contextRef.current
    if (!canvas || !context) return

    const width = window.innerWidth
    const height = window.innerHeight

    const deltaTime = timestamp - lastTimestamp.current
    lastTimestamp.current = timestamp

    context.clearRect(0, 0, width, height)
    context.fillStyle = colorRef.current

    particles.current.forEach((particle) => {
      particle.x += particle.vx * (deltaTime / ease)
      particle.y += particle.vy * (deltaTime / ease)

      // Wrap around screen edges
      if (particle.x < 0) particle.x = width
      if (particle.x > width) particle.x = 0
      if (particle.y < 0) particle.y = height
      if (particle.y > height) particle.y = 0

      context.beginPath()
      context.arc(particle.x, particle.y, 1.5, 0, Math.PI * 2)
      context.fill()
    })

    animationFrameId.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    handleResize()
    window.addEventListener('resize', handleResize)

    requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [])

  return (
    <div className={className} {...props}>
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          opacity: 0.5,
          pointerEvents: "none"
        }}
      />
    </div>
  )
}
