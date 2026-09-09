import { getContrastTextColor } from "@/lib/color-contrast"
import type { BlockRenderProps } from "@/lib/page-builder/block-registry"

export function AnnouncementBarBlock({ business, settings }: BlockRenderProps<"announcement-bar">) {
  const accentColor = business.accent_color || business.theme_color
  const textColor = getContrastTextColor(accentColor)
  // Speed scales with text length so short and long messages both read at a
  // comfortable, consistent pace rather than one flying by and one crawling.
  const duration = Math.max(12, settings.text.length * 0.35)
  // Two identical halves, each repeating the text a few times for visual
  // density — translating exactly -50% then loops seamlessly forever.
  const half = Array.from({ length: 4 }, () => settings.text).join("     •     ")

  const track = (
    <div className="flex w-max animate-zentry-marquee" style={{ animationDuration: `${duration}s` }}>
      <span className="shrink-0 pr-16 text-sm font-medium whitespace-nowrap">{half}</span>
      <span className="shrink-0 pr-16 text-sm font-medium whitespace-nowrap" aria-hidden="true">
        {half}
      </span>
    </div>
  )

  return (
    <div className="group/marquee w-full overflow-hidden py-2" style={{ backgroundColor: accentColor, color: textColor }}>
      <style>{`
        @keyframes zentry-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-zentry-marquee {
          animation-name: zentry-marquee;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .group\\/marquee:hover .animate-zentry-marquee {
          animation-play-state: paused;
        }
      `}</style>
      {settings.link ? (
        <a href={settings.link} className="block hover:opacity-90">
          {track}
        </a>
      ) : (
        track
      )}
    </div>
  )
}
