import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  Package,
  Info,
  Truck,
  RefreshCcw,
  Upload,
  X,
} from "lucide-react";
import { Product, SKU } from "@/data/products";
import { productService } from "@/services/productService";
import mediaService from "@/services/mediaService";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (product: Product) => void;
  product: Product | null;
  mode: "add" | "edit";
}

export const ProductDialog: React.FC<ProductDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  product,
  mode,
}) => {
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      if (mode === "edit" && product) {
        setFormData({
          ...product,
          skus: [...(product.skus || [])],
          images: [...(product.images || [])],
        });
      } else {
        setFormData({
          productName: "",
          category: "",
          productCode: "",
          skus: [],
          images: [],
          featured: false,
          returnApplicable: false,
        });
      }
      loadCategories();
    }
  }, [open, product, mode]);

  const loadCategories = async () => {
    const cats = await productService.getCategories();
    setCategories(cats);
  };

  const handleAddField = (field: keyof Product, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddImage = () => {
    if (newImageUrl.trim() && !formData.images?.includes(newImageUrl.trim())) {
      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), newImageUrl.trim()],
      }));
      setNewImageUrl("");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
      });
      return;
    }

    try {
      toast({
        title: "Uploading…",
        description: "Uploading image to cloud storage",
      });
      const publicUrl = await mediaService.uploadFile("products", file);
      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), publicUrl],
      }));
      toast({
        title: "Image uploaded",
        description: "Image saved to cloud storage",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Could not upload image. Please try again.",
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images?.filter((img) => img !== url),
    }));
  };

  const handleAddSKU = () => {
    const newSKU: SKU = {
      sku: `${formData.productCode || "PROD"}-${Date.now().toString().slice(-4)}`,
      packaging: "New Variant",
      mrp: 0,
      sellingPrice: 0,
    };
    setFormData((prev) => ({
      ...prev,
      skus: [...(prev.skus || []), newSKU],
    }));
  };

  const handleUpdateSKU = (index: number, updates: Partial<SKU>) => {
    setFormData((prev) => {
      const newSkus = [...(prev.skus || [])];
      newSkus[index] = { ...newSkus[index], ...updates };
      return { ...prev, skus: newSkus };
    });
  };

  const handleRemoveSKU = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      skus: prev.skus?.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const missingSku = (formData.skus || []).find(
      (sku) =>
        !sku.lengthMm ||
        !sku.breadthMm ||
        !sku.heightMm ||
        !sku.unitsPerBox ||
        !sku.weightKg,
    );
    if (missingSku) {
      toast({
        variant: "destructive",
        title: "Missing SKU Dimensions",
        description:
          "All variants must have Box Length, Breadth, Height, Units/Box, and Weight filled in.",
      });
      return;
    }
    if (formData.productName && formData.productCode) {
      onSave(formData as Product);
      onOpenChange(false);
    } else {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Product Name and Product Code are required.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-5xl max-h-[90vh] !bg-white rounded-2xl border-none flex flex-col p-0 gap-0 divide-y-0 overflow-hidden shadow-2xl"
        aria-describedby={undefined}
      >
        <DialogHeader className="p-8 pb-0 !bg-white border-none">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-3xl font-display font-bold text-forest">
                {mode === "edit" ? "Edit Product" : "Add New Product"}
              </DialogTitle>
              <p className="text-muted-foreground mt-1 font-medium">
                {mode === "edit"
                  ? "Configure all product details, variants, and media."
                  : "Create a new product listing with variants and media."}
              </p>
            </div>
            {mode === "edit" && product && (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest">
                  {product.productCode}
                </span>
              </div>
            )}
          </div>
        </DialogHeader>

        <Tabs
          defaultValue="general"
          className="flex-1 flex flex-col overflow-hidden !bg-white"
        >
          <div className="px-8 !bg-white border-0">
            <TabsList className="!bg-white h-12 w-full justify-start gap-8 rounded-none p-0 border-none">
              <TabsTrigger
                value="general"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none !bg-white px-0 text-sm font-bold uppercase tracking-wider text-muted-foreground data-[state=active]:text-primary transition-all"
              >
                General Info
              </TabsTrigger>
              <TabsTrigger
                value="logistics"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none !bg-white px-0 text-sm font-bold uppercase tracking-wider text-muted-foreground data-[state=active]:text-primary transition-all"
              >
                Logistics & Returns
              </TabsTrigger>
              <TabsTrigger
                value="images"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none !bg-white px-0 text-sm font-bold uppercase tracking-wider text-muted-foreground data-[state=active]:text-primary transition-all"
              >
                Media & Images
              </TabsTrigger>
              <TabsTrigger
                value="skus"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none !bg-white px-0 text-sm font-bold uppercase tracking-wider text-muted-foreground data-[state=active]:text-primary transition-all"
              >
                Variants (SKUs)
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-8 !bg-white min-h-0">
            <form
              id="product-dialog-form"
              onSubmit={handleSubmit}
              className="space-y-8 max-w-4xl mx-auto"
            >
              <TabsContent
                value="general"
                className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-forest uppercase tracking-widest">
                      Product Name
                    </Label>
                    <Input
                      value={formData.productName || ""}
                      onChange={(e) =>
                        handleAddField("productName", e.target.value)
                      }
                      className="rounded-xl border-2 focus-visible:ring-primary h-12 text-lg font-medium bg-white"
                      placeholder="e.g. Banarasi Silk Saree"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-forest uppercase tracking-widest">
                      Category
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(val) => handleAddField("category", val)}
                    >
                      <SelectTrigger className="rounded-xl border-2 h-12 bg-white">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-2">
                        {categories.map((cat) => (
                          <SelectItem
                            key={cat.id}
                            value={cat.name}
                            className="font-medium"
                          >
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-forest uppercase tracking-widest">
                      Sub Category
                    </Label>
                    <Input
                      value={formData.subCategory || ""}
                      onChange={(e) =>
                        handleAddField("subCategory", e.target.value)
                      }
                      className="rounded-xl border-2 h-12 bg-white"
                      placeholder="e.g. Natural Sweets"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-forest uppercase tracking-widest">
                      Product Code
                    </Label>
                    <Input
                      value={formData.productCode || ""}
                      onChange={(e) =>
                        handleAddField(
                          "productCode",
                          e.target.value.toUpperCase(),
                        )
                      }
                      disabled={mode === "edit"}
                      className={cn(
                        "rounded-xl border-2 h-12 font-mono",
                        mode === "edit" ? "!bg-white opacity-50" : "bg-white",
                      )}
                      placeholder="e.g. BL-NAT-HON"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold text-forest uppercase tracking-widest">
                    Description
                  </Label>
                  <Textarea
                    value={formData.description || ""}
                    onChange={(e) =>
                      handleAddField("description", e.target.value)
                    }
                    className="rounded-xl border-2 min-h-[120px] bg-white text-base"
                    placeholder="Describe your product in detail..."
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold text-forest uppercase tracking-widest">
                    Competitive Advantage
                  </Label>
                  <Textarea
                    value={formData.competitiveAdvantage || ""}
                    onChange={(e) =>
                      handleAddField("competitiveAdvantage", e.target.value)
                    }
                    className="rounded-xl border-2 bg-white"
                    placeholder="What makes this product stand out?"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold text-forest uppercase tracking-widest">
                    Benefits
                  </Label>
                  <Textarea
                    value={(formData as any).benefits || ""}
                    onChange={(e) =>
                      handleAddField("benefits" as any, e.target.value)
                    }
                    className="rounded-xl border-2 bg-white min-h-[100px]"
                    placeholder="List the key benefits of this product (one per line or as a paragraph)..."
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold text-forest uppercase tracking-widest">
                    How to Use
                  </Label>
                  <Textarea
                    value={(formData as any).howToUse || ""}
                    onChange={(e) =>
                      handleAddField("howToUse" as any, e.target.value)
                    }
                    className="rounded-xl border-2 bg-white min-h-[100px]"
                    placeholder="Describe how to use this product (step-by-step or as a paragraph)..."
                  />
                </div>
              </TabsContent>

              <TabsContent
                value="logistics"
                className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-forest uppercase tracking-widest">
                      Produced By
                    </Label>
                    <Input
                      value={formData.producedBy || ""}
                      onChange={(e) =>
                        handleAddField("producedBy", e.target.value)
                      }
                      className="rounded-xl border-2 h-12 bg-white"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-forest uppercase tracking-widest">
                      Origin Location
                    </Label>
                    <Input
                      value={formData.location || ""}
                      onChange={(e) =>
                        handleAddField("location", e.target.value)
                      }
                      className="rounded-xl border-2 h-12 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-forest uppercase tracking-widest">
                      Unit
                    </Label>
                    <Input
                      value={formData.unit || ""}
                      onChange={(e) => handleAddField("unit", e.target.value)}
                      className="rounded-xl border-2 h-12 bg-white"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-forest uppercase tracking-widest">
                      Production Capacity
                    </Label>
                    <Input
                      value={formData.monthlyProductionCapacity || ""}
                      onChange={(e) =>
                        handleAddField(
                          "monthlyProductionCapacity",
                          e.target.value,
                        )
                      }
                      className="rounded-xl border-2 h-12 bg-white"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-forest uppercase tracking-widest">
                      Lead Time
                    </Label>
                    <Input
                      value={formData.leadTime || ""}
                      onChange={(e) =>
                        handleAddField("leadTime", e.target.value)
                      }
                      className="rounded-xl border-2 h-12 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-0 !bg-white -mx-8 px-8">
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-forest uppercase tracking-widest">
                      HSN/SAC Code
                    </Label>
                    <Input
                      value={formData.hsn || ""}
                      onChange={(e) => handleAddField("hsn", e.target.value)}
                      className="rounded-xl border-2 h-12 bg-white"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-forest uppercase tracking-widest">
                      GST Details
                    </Label>
                    <Input
                      value={formData.tax || ""}
                      onChange={(e) => handleAddField("tax", e.target.value)}
                      className="rounded-xl border-2 h-12 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-0 !bg-white -mx-8 px-8">
                  <div className="flex items-center gap-3 pt-8">
                    <div className="relative flex items-start">
                      <div className="flex h-6 items-center">
                        <input
                          type="checkbox"
                          id="featured-lg"
                          checked={formData.featured || false}
                          onChange={(e) =>
                            handleAddField("featured", e.target.checked)
                          }
                          className="h-5 w-5 rounded border-2 border-primary text-primary focus:ring-primary cursor-pointer"
                        />
                      </div>
                      <div className="ml-3 text-sm leading-6">
                        <Label
                          htmlFor="featured-lg"
                          className="font-bold text-forest cursor-pointer"
                        >
                          Mark as Featured Product
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Featured products are highlighted on the home page.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white border-2 border-primary/10 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="font-bold text-forest text-lg flex items-center gap-2">
                        <RefreshCcw className="w-5 h-5 text-primary" /> Return
                        Policy
                      </Label>
                      <p className="text-xs text-muted-foreground font-medium">
                        Configure if and how customers can return this item.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 !bg-white p-2 rounded-xl shadow-none border-2 border-primary/10">
                      <input
                        type="checkbox"
                        id="rtn-lg"
                        checked={formData.returnApplicable || false}
                        onChange={(e) =>
                          handleAddField("returnApplicable", e.target.checked)
                        }
                        className="w-5 h-5 rounded border-2 border-primary cursor-pointer"
                      />
                      <Label
                        htmlFor="rtn-lg"
                        className="text-sm font-bold text-forest cursor-pointer pr-2"
                      >
                        Returnable
                      </Label>
                    </div>
                  </div>
                  {formData.returnApplicable && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                      <Label className="text-xs font-bold text-forest uppercase tracking-widest">
                        Maximum Return Window
                      </Label>
                      <Input
                        value={formData.returnWindow || ""}
                        onChange={(e) =>
                          handleAddField("returnWindow", e.target.value)
                        }
                        className="rounded-xl border-2 bg-white h-12 text-forest font-bold"
                        placeholder="e.g. 7 days from delivery"
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent
                value="images"
                className="m-0 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-xs font-bold text-forest uppercase tracking-widest">
                        Upload New Media
                      </Label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/*"
                      />
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-32 border-2 border-dashed border-primary/20 hover:border-primary/50 bg-white hover:bg-primary/5 text-primary flex flex-col items-center justify-center gap-3 rounded-2xl transition-all shadow-sm"
                      >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Upload className="w-6 h-6" />
                        </div>
                        <span className="font-bold">
                          Select Image to Upload
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          PNG, JPG, WebP (Max 5MB)
                        </span>
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-xs font-bold text-forest uppercase tracking-widest">
                        Or Import via URL
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="rounded-xl border-2 h-12 bg-white"
                        />
                        <Button
                          type="button"
                          onClick={handleAddImage}
                          className="bg-primary hover:bg-primary/90 rounded-xl h-12 w-12 flex items-center justify-center shadow-lg shadow-primary/20"
                        >
                          <Plus className="w-6 h-6" />
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground italic pl-1">
                        Useful for presigned S3 URLs or external hosting.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Label className="text-xs font-bold text-forest uppercase tracking-widest">
                      Current Media ({formData.images?.length || 0})
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      {formData.images?.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative group aspect-square rounded-2xl border-2 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                        >
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-forest/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(url)}
                              className="w-10 h-10 bg-red-500 text-white rounded-xl shadow-xl hover:scale-110 transition-transform flex items-center justify-center"
                            >
                              <X className="w-6 h-6" />
                            </button>
                          </div>
                          {idx === 0 && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-white text-[8px] font-bold uppercase rounded shadow-sm">
                              Main
                            </span>
                          )}
                        </div>
                      ))}
                      {(!formData.images || formData.images.length === 0) && (
                        <div className="col-span-2 py-20 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-muted-foreground bg-white">
                          <ImageIcon className="w-12 h-12 mb-3 opacity-10" />
                          <p className="text-sm font-bold opacity-30">
                            No Media Library
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="skus"
                className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="flex justify-between items-end mb-6">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-forest">
                      Product Variants
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium">
                      Manage pricing and packaging for different sizes.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddSKU}
                    className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-white rounded-xl h-11 px-6 font-bold flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> Add New Variant
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-6 pb-6">
                  {formData.skus?.map((sku, idx) => (
                    <div
                      key={idx}
                      className="p-6 rounded-3xl border-2 !bg-white space-y-6 relative group border-primary/10 hover:border-primary/20 shadow-none hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center">
                            <Package className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                              Sku #{idx + 1}
                            </span>
                            <h4 className="font-bold text-forest">
                              {sku.packaging || "Untitled Variant"}
                            </h4>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleRemoveSKU(idx)}
                          className="h-9 w-9 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors rounded-xl"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-forest uppercase tracking-widest pl-1">
                            Variant Identification (SKU)
                          </Label>
                          <Input
                            value={sku.sku}
                            onChange={(e) =>
                              handleUpdateSKU(idx, { sku: e.target.value })
                            }
                            className="h-11 text-sm rounded-xl border-2 font-mono bg-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-forest uppercase tracking-widest pl-1">
                            Packaging Display Name
                          </Label>
                          <Input
                            value={sku.packaging}
                            onChange={(e) =>
                              handleUpdateSKU(idx, {
                                packaging: e.target.value,
                              })
                            }
                            className="h-11 text-sm rounded-xl border-2 bg-white font-medium"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 !bg-white p-4 rounded-2xl border-2">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                            MRP (₹)
                          </Label>
                          <Input
                            type="number"
                            value={sku.mrp || 0}
                            onChange={(e) =>
                              handleUpdateSKU(idx, {
                                mrp: Number(e.target.value),
                              })
                            }
                            className="h-10 text-sm rounded-lg border-2 bg-white font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                            Selling Price (₹)
                          </Label>
                          <Input
                            type="number"
                            value={sku.sellingPrice || 0}
                            onChange={(e) =>
                              handleUpdateSKU(idx, {
                                sellingPrice: Number(e.target.value),
                              })
                            }
                            className="h-10 text-sm rounded-lg border-2 !bg-white text-primary font-black border-primary/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                            Bulk Price (₹)
                          </Label>
                          <Input
                            type="number"
                            value={sku.bulkOrderPrice || 0}
                            onChange={(e) =>
                              handleUpdateSKU(idx, {
                                bulkOrderPrice: Number(e.target.value),
                              })
                            }
                            className="h-10 text-sm rounded-lg border-2 bg-white font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                            MOQ
                          </Label>
                          <Input
                            value={sku.moq || ""}
                            onChange={(e) =>
                              handleUpdateSKU(idx, { moq: e.target.value })
                            }
                            className="h-10 text-sm rounded-lg border-2 bg-white font-medium"
                            placeholder="e.g. 100 units"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 !bg-white p-4 rounded-2xl border-2">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-destructive uppercase tracking-widest pl-1">
                            Product L (mm){" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            type="number"
                            required
                            value={sku.lengthMm || ""}
                            onChange={(e) =>
                              handleUpdateSKU(idx, {
                                lengthMm: Number(e.target.value),
                              })
                            }
                            className="h-10 text-sm rounded-lg border-2 bg-white font-medium"
                            placeholder="e.g. 269"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-destructive uppercase tracking-widest pl-1">
                            Product B (mm){" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            type="number"
                            required
                            value={sku.breadthMm || ""}
                            onChange={(e) =>
                              handleUpdateSKU(idx, {
                                breadthMm: Number(e.target.value),
                              })
                            }
                            className="h-10 text-sm rounded-lg border-2 bg-white font-medium"
                            placeholder="e.g. 70"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-destructive uppercase tracking-widest pl-1">
                            Product H (mm){" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            type="number"
                            required
                            value={sku.heightMm || ""}
                            onChange={(e) =>
                              handleUpdateSKU(idx, {
                                heightMm: Number(e.target.value),
                              })
                            }
                            className="h-10 text-sm rounded-lg border-2 bg-white font-medium"
                            placeholder="e.g. 121"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-destructive uppercase tracking-widest pl-1">
                            Units/Box{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            type="number"
                            required
                            value={sku.unitsPerBox || ""}
                            onChange={(e) =>
                              handleUpdateSKU(idx, {
                                unitsPerBox: Number(e.target.value),
                              })
                            }
                            className="h-10 text-sm rounded-lg border-2 bg-white font-medium"
                            placeholder="e.g. 12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-destructive uppercase tracking-widest pl-1">
                            Weight (kg){" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            required
                            value={sku.weightKg || ""}
                            onChange={(e) =>
                              handleUpdateSKU(idx, {
                                weightKg: Number(e.target.value),
                              })
                            }
                            className="h-10 text-sm rounded-lg border-2 bg-white font-medium"
                            placeholder="e.g. 0.5"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!formData.skus || formData.skus.length === 0) && (
                    <div className="py-24 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-muted-foreground bg-white">
                      <Package className="w-16 h-16 mb-4 opacity-10" />
                      <p className="text-lg font-bold opacity-30">
                        No Product Variants Defined
                      </p>
                      <Button
                        type="button"
                        onClick={handleAddSKU}
                        variant="link"
                        className="text-primary font-bold mt-2"
                      >
                        Create your first variant
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </form>
          </div>
        </Tabs>

        <DialogFooter className="p-8 border-0 !bg-white flex flex-col sm:flex-row gap-4 items-center justify-between shadow-none">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Info className="w-4 h-4" />
            <span className="text-xs font-medium">
              Draft changes will only save after clicking "Secure Save"
            </span>
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none rounded-xl border-2 h-12 px-8 font-bold text-forest hover:bg-gray-50 transition-all"
            >
              Cancel {mode === "edit" ? "Edits" : "Addition"}
            </Button>
            <Button
              form="product-dialog-form"
              type="submit"
              className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30 rounded-xl h-12 px-12 font-black tracking-widest uppercase transition-all hover:scale-[1.02] active:scale-95"
            >
              {mode === "edit" ? "Secure Save Changes" : "Add Product Listing"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
