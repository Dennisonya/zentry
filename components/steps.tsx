export function Steps() {
    const steps = [
      {
        number: "01",
        title: "Create Your Account",
        description:
          "Sign up with your email and tell us about your business. Takes less than 2 minutes.",
      },
      {
        number: "02",
        title: "Add Your Products/Services",
        description:
          "Upload your products or services with photos, prices and inventory. Our system generates a beautiful page automatically.",
      },
      {
        number: "03",
        title: "Share & Start Selling",
        description:
          "Get your unique link and share it everywhere. Accept orders via WhatsApp, Instagram, or email.",
      },
    ]
  
    return (
      <section className="py-16 sm:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Get Started In 3 Simple Steps
            </h2>
          </div>
  
          <div className="space-y-12 md:space-y-16 max-w-3xl mx-auto">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`flex flex-col md:flex-row items-start gap-6 md:gap-12 ${
                  index % 2 === 1 ? "md:flex-row-reverse md:text-right" : ""
                }`}
              >
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
                <div className="text-6xl md:text-7xl font-bold text-muted-foreground/20 order-first md:order-none">
                  {step.number}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }
  