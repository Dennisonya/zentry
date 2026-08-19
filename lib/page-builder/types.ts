// lib/page-builder/types.ts
import { z } from "zod";

export type BlockType = "hero" | "product-grid" | "service-grid" | "about" | "contact-info";

export interface Block<T = any> {
  id: string;
  type: BlockType;
  isVisible: boolean;
  settings: T;
}

export interface PageSchema {
  version: string;
  blocks: Block[];
}

// We define basic Zod schemas here so the Phase C settings form has them ready.
export const HeroSettingsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export const GridSettingsSchema = z.object({
  title: z.string(),
  maxItems: z.number().min(1).max(20).default(6),
  categoryFilter: z.string().optional(), // 'all' or specific category
});

export const AboutSettingsSchema = z.object({
  title: z.string(),
  content: z.string(),
  imageUrl: z.string().optional(),
});

export const ContactSettingsSchema = z.object({
  title: z.string().default("Contact Us"),
  showAddress: z.boolean().default(true),
  showEmail: z.boolean().default(true),
  showPhone: z.boolean().default(true),
});