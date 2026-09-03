import type { BlockRenderProps } from "@/lib/page-builder/block-registry"

const alignmentClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const

export function AboutBlock({ business, settings }: BlockRenderProps<"about">) {
  const body = settings.body || business.description
  if (!body) return null

  return (
    <section className={`container mx-auto max-w-3xl px-4 py-12 ${alignmentClass[settings.alignment]}`}>
      <h2 className="mb-6 text-3xl font-bold">{settings.title}</h2>
      <p className="whitespace-pre-line text-lg leading-relaxed text-muted-foreground">{body}</p>
    </section>
  )
}
