"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, AlertCircle, Plus, X, Check, CheckCircle2, Palette, Layout } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { LAYOUT_CONFIGS, BUSINESS_CATEGORIES, type LayoutStyle } from "@/lib/layouts"

const ORDER_METHODS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram DM" },
  { value: "email", label: "Email" },
  { value: "multiple", label: "Multiple Methods" },
]

interface Product {
  name: string
  price: string
  description: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [heroFile, setHeroFile] = useState<File | null>(null)
  const [heroPreview, setHeroPreview] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([{ name: "", price: "", description: "" }])

  const [formData, setFormData] = useState({
    businessName: "",
    category: "",
    businessTypeMode: "product" as "product" | "service",
    description: "",
    phone: "",
    email: "",
    location: "",
    whatsappNumber: "",
    instagramHandle: "",
    orderMethod: "whatsapp",
  })

  const [visualData, setVisualData] = useState({
    layoutStyle: "classic-card" as LayoutStyle,
    accentColor: "#6366f1",
    darkModeEnabled: false,
  })

  // Auto-suggest layout based on category
  const getSuggestedLayout = (): LayoutStyle => {
    const category = formData.category
    const suggestedLayout = LAYOUT_CONFIGS.find((config) => config.recommendedFor.includes(category))
    return suggestedLayout?.id || "classic-card"
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleHeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setHeroFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setHeroPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const addProduct = () => {
    setProducts([...products, { name: "", price: "", description: "" }])
  }

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index))
  }

  const updateProduct = (index: number, field: keyof Product, value: string) => {
    const updated = [...products]
    updated[index][field] = value
    setProducts(updated)
  }

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate step 1
      if (!formData.businessName || !formData.category) {
        setError("Please fill in all required fields")
        return
      }
      // Auto-suggest layout
      const suggestedLayout = getSuggestedLayout()
      setVisualData({ ...visualData, layoutStyle: suggestedLayout })
    }
    setError(null)
    setCurrentStep(currentStep + 1)
  }

  const handlePrevious = () => {
    setError(null)
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)

    try {
      const supabase = getSupabaseClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const slug = formData.businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")

      // Upload logo
      let logoUrl = null
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop()
        const fileName = `${user.id}-logo-${Date.now()}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
        .from("business-logos").
        upload(`${fileName}`, logoFile, {
          contentType: logoFile.type,
          cacheControl: "3600",
          upsert: true,
        })

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("business-logos").getPublicUrl(`${fileName}`)
        console.log("Public URL:", publicUrl)
        logoUrl = publicUrl
      }

      // Upload hero image
      let heroUrl = null
      if (heroFile) {
        const fileExt = heroFile.name.split(".").pop()
        const fileName = `${user.id}-hero-${Date.now()}.${fileExt}`
      
        const { data, error } = await supabase.storage
          .from("business-logos")
          .upload(`${fileName}`, heroFile, {
            cacheControl: "3600",
            upsert: true,
            contentType: heroFile.type || "image/jpeg",
          })
      
        if (error) {
          console.error("Upload failed:", error)
          throw error
        }
      
        const { data: { publicUrl } } = supabase.storage
          .from("business-logos")
          .getPublicUrl(`${fileName}`)
      
        heroUrl = publicUrl
      }

      const validProducts = products.filter((p) => p.name && p.price)

      // Create business with all visual data
      const { data: businessData, error: insertError } = await supabase
        .from("businesses")
        .insert({
          user_id: user.id,
          business_name: formData.businessName,
          business_type: formData.category,
          business_type_mode: formData.businessTypeMode,
          slug,
          phone: formData.phone,
          email: formData.email,
          address: formData.location,
          description: formData.description,
          whatsapp_number: formData.whatsappNumber,
          instagram_handle: formData.instagramHandle,
          order_method: formData.orderMethod,
          logo_url: logoUrl,
          layout_style: visualData.layoutStyle,
          accent_color: visualData.accentColor,
          hero_image_url: heroUrl,
          dark_mode_enabled: visualData.darkModeEnabled,
          theme_color: visualData.accentColor, // Keep theme_color for backward compatibility
        })
        .select()
        .single()

      if (insertError) throw insertError

      if (validProducts.length > 0 && businessData) {
        const productInserts = validProducts.map((p) => ({
          business_id: businessData.id,
          name: p.name,
          description: p.description,
          price: Number.parseFloat(p.price),
        }))

        const { error: productsError } = await supabase.from("products").insert(productInserts)

        if (productsError) throw productsError
      }

      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "An error occurred while creating your business")
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { id: 1, name: "Business Info", icon: CheckCircle2 },
    { id: 2, name: "Customize Look", icon: Palette },
    { id: 3, name: "Review", icon: Layout },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-950 dark:via-blue-950 dark:to-indigo-950 p-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex-1">
                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      currentStep >= step.id
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.id ? <Check className="h-6 w-6" /> : <step.icon className="h-6 w-6" />}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-4 ${currentStep > step.id ? "bg-purple-600" : "bg-muted"}`} />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <span className="text-sm font-medium">{step.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {currentStep === 1 && "Tell us about your business"}
            {currentStep === 2 && "Customize your website"}
            {currentStep === 3 && "Review & Launch"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {currentStep === 1 && "Let's create your perfect business page"}
            {currentStep === 2 && "Make it uniquely yours"}
            {currentStep === 3 && "You're almost there!"}
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].name}</CardTitle>
            <CardDescription>Step {currentStep} of {steps.length}</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Business Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>

                  <div className="space-y-2">
                    <Label htmlFor="businessName">
                      Business Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="businessName"
                      placeholder="e.g., Joe's Coffee Shop"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">
                      Business Category <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                      required
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your business category" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Business Type <span className="text-destructive">*</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, businessTypeMode: "product" })}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          formData.businessTypeMode === "product"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        disabled={loading}
                      >
                        <div className="font-medium mb-1">Products</div>
                        <div className="text-xs text-muted-foreground">Sell physical or digital products</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, businessTypeMode: "service" })}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          formData.businessTypeMode === "service"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        disabled={loading}
                      >
                        <div className="font-medium mb-1">Services</div>
                        <div className="text-xs text-muted-foreground">Offer services or consultations</div>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Business Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell customers about your business..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      disabled={loading}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logo">Logo Upload (Optional)</Label>
                    <div className="flex items-center gap-4">
                      {logoPreview && (
                        <div className="h-20 w-20 rounded-xl overflow-hidden border-2 border-border">
                          <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1">
                        <Input
                          id="logo"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          disabled={loading}
                          className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                      </div>
                    </div>
                  </div>
                </div>

                {formData.businessTypeMode === "product" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Products / Menu Items</h3>
                      <Button type="button" variant="outline" size="sm" onClick={addProduct} disabled={loading}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {products.map((product, index) => (
                        <Card key={index} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 space-y-3">
                                <Input
                                  placeholder="Product name"
                                  value={product.name}
                                  onChange={(e) => updateProduct(index, "name", e.target.value)}
                                  disabled={loading}
                                />
                                <Input
                                  placeholder="Price (e.g., 9.99)"
                                  type="number"
                                  step="0.01"
                                  value={product.price}
                                  onChange={(e) => updateProduct(index, "price", e.target.value)}
                                  disabled={loading}
                                />
                                <Input
                                  placeholder="Description (optional)"
                                  value={product.description}
                                  onChange={(e) => updateProduct(index, "description", e.target.value)}
                                  disabled={loading}
                                />
                              </div>
                              {products.length > 1 && (
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeProduct(index)} disabled={loading}>
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {formData.businessTypeMode === "service" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Services Offered</h3>
                    <Alert>
                      <AlertDescription>
                        As a service provider, customers will be able to book appointments or send inquiries directly to your WhatsApp. You can add service offerings later in your dashboard.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contact Information</h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} disabled={loading} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Business Email</Label>
                      <Input id="email" type="email" placeholder="contact@business.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={loading} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Business Location (Optional)</Label>
                    <Input id="location" placeholder="123 Main St, City, State" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} disabled={loading} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Order Receiving Method</h3>

                  <div className="space-y-2">
                    <Label htmlFor="orderMethod">
                      How do you want to receive orders? <span className="text-destructive">*</span>
                    </Label>
                    <Select value={formData.orderMethod} onValueChange={(value) => setFormData({ ...formData, orderMethod: value })} required disabled={loading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select order method" />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_METHODS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {(formData.orderMethod === "whatsapp" || formData.orderMethod === "multiple") && (
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp Number</Label>
                      <Input id="whatsapp" type="tel" placeholder="+1 (555) 123-4567" value={formData.whatsappNumber} onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })} disabled={loading} />
                      <p className="text-xs text-muted-foreground">Customers will be able to order directly via WhatsApp</p>
                    </div>
                  )}

                  {(formData.orderMethod === "instagram" || formData.orderMethod === "multiple") && (
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram Handle</Label>
                      <Input id="instagram" placeholder="@yourbusiness" value={formData.instagramHandle} onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })} disabled={loading} />
                      <p className="text-xs text-muted-foreground">Customers will be able to DM you on Instagram</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Visual Customization */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Choose Your Layout</h3>
                  <p className="text-sm text-muted-foreground">
                    {formData.category && (
                      <>
                        We recommend <strong>{LAYOUT_CONFIGS.find((l) => l.id === getSuggestedLayout())?.name}</strong> for{" "}
                        <strong>{formData.category}</strong>, but you can choose any layout you like!
                      </>
                    )}
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {LAYOUT_CONFIGS.map((layout) => (
                      <Card key={layout.id} className={`cursor-pointer transition-all hover:shadow-lg ${visualData.layoutStyle === layout.id ? "ring-2 ring-primary" : ""}`} onClick={() => setVisualData({ ...visualData, layoutStyle: layout.id })}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-12 h-12 rounded-lg ${layout.previewColor} flex items-center justify-center text-2xl`}></div>
                            <div className="flex-1">
                              <div className="font-semibold mb-1">{layout.name}</div>
                              <div className="text-xs text-muted-foreground">{layout.description}</div>
                              {layout.recommendedFor.includes(formData.category) && (
                                <div className="mt-2 inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">Recommended</div>
                              )}
                            </div>
                            {visualData.layoutStyle === layout.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Customize Colors</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="accentColor">Accent Color</Label>
                      <div className="flex items-center gap-2">
                        <Input id="accentColor" type="color" value={visualData.accentColor} onChange={(e) => setVisualData({ ...visualData, accentColor: e.target.value })} className="w-20 h-10 cursor-pointer" disabled={loading} />
                        <Input value={visualData.accentColor} onChange={(e) => setVisualData({ ...visualData, accentColor: e.target.value })} disabled={loading} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={visualData.darkModeEnabled} onChange={(e) => setVisualData({ ...visualData, darkModeEnabled: e.target.checked })} disabled={loading} className="w-4 h-4" />
                        Enable Dark Mode Theme
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Hero Image (Optional)</h3>
                  <div className="space-y-2">
                    <Label htmlFor="hero">Upload a hero/banner image</Label>
                    <div className="flex items-center gap-4">
                      {heroPreview && (
                        <div className="h-32 w-full rounded-xl overflow-hidden border-2 border-border">
                          <img src={heroPreview} alt="Hero preview" className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1">
                        <Input id="hero" type="file" accept="image/*" onChange={handleHeroChange} disabled={loading} className="cursor-pointer" />
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Review Your Business</h3>

                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium mb-1">Business Name</div>
                      <div className="text-muted-foreground">{formData.businessName}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Category</div>
                      <div className="text-muted-foreground">{formData.category}</div>
                    </div>
                    {formData.description && (
                      <div>
                        <div className="text-sm font-medium mb-1">Description</div>
                        <div className="text-muted-foreground">{formData.description}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium mb-1">Layout</div>
                      <div className="text-muted-foreground">{LAYOUT_CONFIGS.find((l) => l.id === visualData.layoutStyle)?.name}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Products</div>
                      <div className="text-muted-foreground">{products.filter((p) => p.name && p.price).length} items</div>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Click &quot;Create Business Page&quot; to launch your site! You can edit all details later in settings.</AlertDescription>
                </Alert>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={handlePrevious} disabled={loading}>
                  Previous
                </Button>
              )}
              <div className="ml-auto">
                {currentStep < steps.length ? (
                  <Button type="button" onClick={handleNext} disabled={loading} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    Next
                  </Button>
                ) : (
                  <Button type="button" onClick={handleSubmit} disabled={loading} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    {loading ? "Creating your business..." : "Create My Business Page"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
