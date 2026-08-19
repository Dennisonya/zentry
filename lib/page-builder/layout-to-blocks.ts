// lib/page-builder/layout-to-blocks.ts
import { PageSchema } from "./types";

const generateId = () => Math.random().toString(36).substring(2, 9);

export function convertLayoutToSchema(business: any): PageSchema {
  return {
    version: "1.0",
    blocks: [
      {
        id: generateId(),
        type: "hero",
        isVisible: true,
        settings: {
          title: business.business_name || "Welcome to our store",
          subtitle: business.description || "Discover our amazing products and services.",
          ctaText: "Shop Now",
        },
      },
      {
        id: generateId(),
        type: "about",
        isVisible: true,
        settings: {
          title: "Our Story",
          content: "We are passionate about delivering the best experience to our customers. Learn more about what makes us unique.",
        },
      },
      {
        id: generateId(),
        type: "product-grid",
        isVisible: true, // We could eventually add logic: `isVisible: business.has_products`
        settings: {
          title: "Featured Products",
          maxItems: 6,
        },
      },
      {
        id: generateId(),
        type: "service-grid",
        isVisible: true,
        settings: {
          title: "Our Services",
          maxItems: 6,
        },
      },
      {
        id: generateId(),
        type: "contact-info",
        isVisible: true,
        settings: {
          title: "Get in Touch",
          showAddress: true,
          showEmail: true,
          showPhone: true,
        },
      },
    ],
  };
}