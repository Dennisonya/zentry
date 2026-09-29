"use client"

import type { ReactNode } from "react"
import { FlutedGlass } from "@paper-design/shaders-react"
import { motion } from "motion/react"
import { Zap } from "lucide-react"

interface AuthShellProps {
  title: string
  subtitle: string
  rightHeadline: string
  rightSubcopy: string
  children: ReactNode
}

export function AuthShell({ title, subtitle, rightHeadline, rightSubcopy, children }: AuthShellProps) {
  return (
    <section className="min-h-screen bg-background p-3 text-foreground antialiased">
      <div className="grid min-h-[calc(100vh-1.5rem)] gap-6 lg:grid-cols-[0.94fr_1.06fr]">
        {/* Form column */}
        <div className="flex min-h-[760px] items-center justify-center rounded-md border border-border bg-card px-6 py-12 lg:min-h-0 lg:px-14 lg:py-20 xl:px-20">
          <div className="mx-auto w-full max-w-[460px]">
            <div className="flex items-center justify-center mb-6">
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-medium tracking-tight sm:text-4xl text-foreground text-center">
                {title}
              </h1>
              <p className="mt-2 text-center text-sm text-muted-foreground">{subtitle}</p>
            </div>

            <div className="mt-8">{children}</div>
          </div>
        </div>

        {/* Marketing / brand column */}
        <div className="relative flex min-h-[400px] flex-col overflow-hidden rounded-md bg-linear-to-b from-primary to-background p-8 text-primary-foreground sm:p-12 lg:min-h-0 lg:p-16">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <FlutedGlass
              size={0.89}
              shape="lines"
              angle={0}
              distortionShape="prism"
              distortion={0.5}
              shift={0}
              blur={0}
              edges={0.25}
              stretch={0}
              scale={1.11}
              fit="cover"
              highlights={0.1}
              shadows={0.2}
              grainMixer={0.1}
              grainOverlay={0.1}
              colorBack="#00000000"
              colorHighlight="#FFFFFF"
              colorShadow="#000000"
              className="h-full w-full bg-transparent"
            />
          </div>

          <div className="relative z-10 flex h-full w-full items-center">
            <div className="max-w-[460px]">
              <motion.h2
                initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="text-2xl font-light leading-tight tracking-[-0.035em] text-primary-foreground/90 sm:text-3xl lg:text-[34px]"
              >
                {rightHeadline}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="mt-5 text-base leading-relaxed text-primary-foreground/70"
              >
                {rightSubcopy}
              </motion.p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
