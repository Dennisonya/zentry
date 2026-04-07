"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

const faqs = [
  {
    question: "Will Zentry bring me customers?",
    answer:
      "Yes. Zentry lists your business in a shared marketplace where customers can discover you.",
  },
  {
    question: "How do customers place orders?",
    answer:
      "Customers contact you directly through WhatsApp or Instagram using one-tap buttons.",
  },
  {
    question: "Is Zentry a marketplace or a website builder?",
    answer:
      "Both. You get a business page and visibility inside a marketplace.",
  },
  {
    question: "Does Zentry take a commission?",
    answer:
      "No, Zentry does not take any commission on your sales. You keep 100% of your revenue.",
  },
  {
    question: "What is Zentry?",
    answer:
      "Zentry is a platform that helps small businesses create professional online presence and get discovered by customers in a shared marketplace.",
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-muted/50 transition-colors"
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
              >
                <span className="font-medium text-foreground pr-4">
                  {faq.question}
                </span>
                <span
                  className={`shrink-0 p-1 rounded-full border border-border transition-transform duration-300 ${
                    openIndex === index ? "rotate-45 bg-foreground" : ""
                  }`}
                >
                  <Plus
                    className={`h-4 w-4 transition-colors duration-300 ${
                      openIndex === index
                        ? "text-background"
                        : "text-foreground"
                    }`}
                  />
                </span>
              </button>
              <div
                id={`faq-answer-${index}`}
                className="transition-all duration-300 ease-in-out"
                style={{
                  maxHeight: openIndex === index ? "200px" : "0px",
                  opacity: openIndex === index ? 1 : 0,
                }}
              >
                <div className="px-6 pb-4 text-muted-foreground">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
