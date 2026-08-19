import type {BlockRenderProps} from "@/lib/page-builder/block-registry"

export function AboutBlock({ business, settings }: BlockRenderProps<"about">) {
    const body = settings.body || business.description
    if (!body) return null
  
    return (
      <section className="container mx-auto px-4 py-12 max-w-3xl text-center">
        <h2 className="text-3xl font-bold mb-6">{settings.title}</h2>
        <p className="text-muted-foreground text-lg leading-relaxed whitespace-pre-line">{body}</p>
      </section>
    )
  }
