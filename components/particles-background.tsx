"use client"

import { useEffect, useState } from "react"

import { useTheme } from "next-themes"

import { Particles } from "@/components/ui/particles"

export function ParticlesBackground() {
  const { resolvedTheme } = useTheme()
  const [color, setColor] = useState("#ffffff")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setColor(resolvedTheme === "dark" ? "#ffffff" : "#000000")
  }, [resolvedTheme])

  if (!mounted) {
    return null
  }

  return (
    <Particles
      className="fixed inset-0 -z-10"
      quantity={100}
      ease={80}
      color={color}
      refresh
    />
  )
}

