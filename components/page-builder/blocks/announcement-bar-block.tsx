import type { BlockRenderProps } from "@/lib/page-builder/block-registry"

export function AnnouncementBarBlock({ business, settings }: BlockRenderProps<"announcement-bar">) {
  const accentColor = business.accent_color || business.theme_color
  const content = <span className="px-4 text-center text-sm font-medium">{settings.text}</span>

  return (
    <div className="w-full py-2 text-white" style={{ backgroundColor: accentColor }}>
      {settings.link ? (
        <a href={settings.link} className="flex justify-center hover:underline">
          {content}
        </a>
      ) : (
        <div className="flex justify-center">{content}</div>
      )}
    </div>
  )
}
