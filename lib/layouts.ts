export type LayoutStyle = 
  | 'classic-card'
  | 'modern-split'
  | 'hero-highlight'
  | 'grid-gallery'
  | 'compact-onepage'
  | 'neon-dark'
  | 'social-card'
  | 'business-card'

export interface LayoutConfig {
  id: LayoutStyle
  name: string
  description: string
  recommendedFor: string[]
  previewColor: string
}

export const LAYOUT_CONFIGS: LayoutConfig[] = [
  {
    id: 'classic-card',
    name: 'Classic Card Layout',
    description: 'Minimal, clean, symmetrical — perfect for food menus, boutiques, or personal brands',
    recommendedFor: ['Food & Beverage', 'Retail & Shopping', 'Fashion & Apparel'],
    previewColor: 'bg-gradient-to-br from-blue-500 to-purple-500'
  },
  {
    id: 'modern-split',
    name: 'Modern Split Layout',
    description: 'Split screen — left side info, right side content. Sleek, premium look',
    recommendedFor: ['Beauty & Wellness', 'Technology', 'Services'],
    previewColor: 'bg-gradient-to-br from-indigo-500 to-pink-500'
  },
  {
    id: 'hero-highlight',
    name: 'Hero Highlight Layout',
    description: 'Bold hero image with product-centered design. Great for fashion, tech, or services',
    recommendedFor: ['Fashion & Apparel', 'Technology', 'Services'],
    previewColor: 'bg-gradient-to-br from-purple-500 to-pink-500'
  },
  {
    id: 'grid-gallery',
    name: 'Grid Gallery Layout',
    description: 'Pure visuals. Ideal for photographers, artists, or food businesses',
    recommendedFor: ['Arts & Crafts', 'Food & Beverage', 'Retail & Shopping'],
    previewColor: 'bg-gradient-to-br from-yellow-500 to-orange-500'
  },
  {
    id: 'compact-onepage',
    name: 'Compact One-Page Layout',
    description: 'Single scrolling page. Minimal and fast — perfect for small hustles',
    recommendedFor: ['Services', 'Health & Fitness', 'Arts & Crafts'],
    previewColor: 'bg-gradient-to-br from-green-500 to-teal-500'
  },
  {
    id: 'neon-dark',
    name: 'Neon / Dark Mode Layout',
    description: 'Dark glassmorphic background with neon accents. Cool and edgy',
    recommendedFor: ['Technology', 'Arts & Crafts', 'Other'],
    previewColor: 'bg-gradient-to-br from-purple-900 to-indigo-900'
  },
  {
    id: 'social-card',
    name: 'Social Card Layout',
    description: 'Link-in-bio style with action buttons. Great for influencers or creators',
    recommendedFor: ['Beauty & Wellness', 'Other', 'Arts & Crafts'],
    previewColor: 'bg-gradient-to-br from-pink-500 to-rose-500'
  },
  {
    id: 'business-card',
    name: 'Business Card Layout',
    description: 'Professional, minimalist option for freelancers or service-based workers',
    recommendedFor: ['Services', 'Technology', 'Health & Fitness'],
    previewColor: 'bg-gradient-to-br from-gray-700 to-gray-900'
  }
]

export const BUSINESS_CATEGORIES = [
  "Food & Beverage",
  "Fashion & Apparel",
  "Beauty & Wellness",
  "Retail & Shopping",
  "Services",
  "Health & Fitness",
  "Arts & Crafts",
  "Technology",
  "Other",
] as const

export function getRecommendedLayouts(category: string): LayoutConfig[] {
  return LAYOUT_CONFIGS.filter(config => 
    config.recommendedFor.includes(category)
  )
}

