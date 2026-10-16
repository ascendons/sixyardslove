import React, { useState, useEffect } from "react";
import { productService } from "@/services/productService";
import { inventoryService } from "@/services/inventoryService";
import { sellerService, Seller } from "@/services/sellerService";
import { Product } from "@/data/products";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Loader2 } from "lucide-react";
import { authService } from "@/services/authService";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import * as Modules from "@/components/admin/AdminModules";
import { CategoryDialog } from "@/components/admin/CategoryDialog";
import { ProductDialog } from "@/components/admin/ProductDialog";
import { MediaManagement } from "@/components/admin/MediaManagement";
import { ShortsManagement } from "@/components/admin/ShortsManagement";
import { CouponResponse } from "@/services/couponService";
import { AdminTab } from "@/components/admin/types";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DashboardOverview } from "@/components/admin/DashboardOverview";
import { ProductsTab } from "@/components/admin/ProductsTab";

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [inventoryMetadata, setInventoryMetadata] = useState<any>(null);
  const [inventoryPage, setInventoryPage] = useState(0);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [coupons, setCoupons] = useState<CouponResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [isProductEditOpen, setIsProductEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDialogMode, setProductDialogMode] = useState<"add" | "edit">(
    "edit",
  );

  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [catDialogMode, setCatDialogMode] = useState<"add" | "edit">("add");
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [selectedCatData, setSelectedCatData] = useState<{
    name: string;
    imageUrl?: string;
  }>({ name: "", imageUrl: "" });

  const [isSellerDialogOpen, setIsSellerDialogOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);

  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponResponse | null>(
    null,
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingViewOrderId, setPendingViewOrderId] = useState<string | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getAdminProducts();
      setProducts([...data]);
    } catch (error) {
      console.error("Failed to load products", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load products",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await productService.getAdminCategories();
      setCategories([...data]);
    } catch (error) {
      console.error("Failed to load categories", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load categories",
      });
    }
  };

  const loadInventory = async (page = 0) => {
    try {
      const data = await inventoryService.getAllInventory(page);
      const items = Array.isArray(data) ? data : (data.content ?? []);
      setInventory(items);
      setInventoryMetadata({
        totalElements: data.totalElements,
        totalPages: data.totalPages,
        number: data.number,
        size: data.size,
      });
      setInventoryPage(page);
    } catch (error) {
      console.error("Failed to load inventory", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load inventory",
      });
    }
  };

  const loadSellers = async () => {
    try {
      const data = await sellerService.getAllSellers();
      setSellers(data);
    } catch (error) {
      console.error("Failed to load sellers", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load sellers",
      });
    }
  };

  const loadCoupons = async () => {
    try {
      const adminCouponService = (await import("@/services/adminCouponService"))
        .default;
      const data = await adminCouponService.getAllCoupons();
      setCoupons(data);
    } catch (error) {
      console.error("Failed to load coupons", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load coupons",
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        loadProducts(),
        loadCategories(),
        loadSellers(),
        loadCoupons(),
      ]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (activeTab === "inventory") loadInventory(inventoryPage);
    if (activeTab === "sellers") loadSellers();
    if (activeTab === "coupons") loadCoupons();
  }, [activeTab]);

  const handleLogout = () => {
    authService.logout();
    navigate("/");
  };

  const toggleFeatured = async (product: Product) => {
    try {
      await productService.toggleFeatured(product.id);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, featured: !p.featured } : p,
        ),
      );
      toast({
        title: "Success",
        description: "Product featured status updated",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Update failed",
      });
    }
  };

  // Category Handlers
  const handleAddCategory = () => {
    setCatDialogMode("add");
    setSelectedCatData({ name: "", imageUrl: "" });
    setIsCategoryDialogOpen(true);
  };

  const handleEditCategory = (cat: any) => {
    setCatDialogMode("edit");
    setSelectedCatData({ name: cat.name, imageUrl: cat.imageUrl });
    setSelectedCatId(cat.id);
    setIsCategoryDialogOpen(true);
  };

  const handleSaveCategory = async (data: {
    name: string;
    imageUrl?: string;
  }) => {
    try {
      if (catDialogMode === "add") {
        await productService.addCategory(data);
        toast({
          title: "Category Created",
          description: `${data.name} has been added.`,
        });
      } else if (selectedCatId) {
        await productService.updateCategory(selectedCatId, data);
        toast({
          title: "Category Updated",
          description: `Changed to ${data.name}.`,
        });
      }
      loadCategories();
      loadProducts();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Action failed",
      });
    }
  };

  const handleDeleteCategory = async (cat: any) => {
    if (confirm(`Are you sure you want to delete "${cat.name}"?`)) {
      try {
        await productService.deleteCategory(cat.id);
        loadCategories();
        toast({ title: "Category Deleted" });
      } catch {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Delete failed",
        });
      }
    }
  };

  // Product Handlers
  const handleSyncInventory = async () => {
    try {
      toast({
        title: "Syncing...",
        description: "Initializing missing inventory records...",
      });
      await inventoryService.syncInventory();
      await loadInventory(inventoryPage);
      toast({
        title: "Success",
        description: "All product variants are now synced with inventory.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: "Could not sync inventory.",
      });
    }
  };

  const handleAdjustStock = async (
    variantId: string,
    change: number,
    reason: string,
  ) => {
    try {
      await inventoryService.adjustStock(variantId, change, reason);
      await loadInventory(inventoryPage);
      toast({
        title: "Updated",
        description: "Stock level adjusted successfully.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Failed",
        description: "Could not adjust stock.",
      });
    }
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setProductDialogMode("add");
    setIsProductEditOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductDialogMode("edit");
    setIsProductEditOpen(true);
  };

  const handleSaveProduct = async (productData: Product) => {
    try {
      if (productDialogMode === "add") {
        await productService.addProduct(productData);
        toast({
          title: "Product Added",
          description: `${productData.productName} has been created.`,
        });
      } else {
        await productService.updateProduct(productData.id, productData);
        toast({
          title: "Product Updated",
          description: "Changes saved successfully.",
        });
      }
      loadProducts();
      setIsProductEditOpen(false);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Operation failed",
      });
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Delete "${product.productName}"? This cannot be undone.`))
      return;
    try {
      await productService.deleteProduct(product.id);
      toast({ title: "Product Deleted" });
      loadProducts();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete product",
      });
    }
  };

  // Seller Handlers
  const handleAddSeller = () => {
    setSelectedSeller(null);
    setIsSellerDialogOpen(true);
  };

  const handleEditSeller = (seller: Seller) => {
    setSelectedSeller(seller);
    setIsSellerDialogOpen(true);
  };

  const handleSaveSeller = async (sellerData: any) => {
    try {
      if (selectedSeller) {
        await sellerService.updateSeller(selectedSeller.id, sellerData);
        toast({
          title: "Seller Updated",
          description: "Business profile saved.",
        });
      } else {
        await sellerService.createSeller(sellerData);
        toast({
          title: "Seller Created",
          description: "New merchant has been onboarded.",
        });
      }
      loadSellers();
      setIsSellerDialogOpen(false);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Operation failed";
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
    }
  };

  const handleDeleteSeller = async (id: string) => {
    if (confirm("Are you sure you want to delete this seller?")) {
      try {
        await sellerService.deleteSeller(id);
        loadSellers();
        toast({ title: "Seller Deleted" });
      } catch {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Delete failed",
        });
      }
    }
  };

  // Coupon Handlers
  const handleAddCoupon = () => {
    setSelectedCoupon(null);
    setIsCouponDialogOpen(true);
  };

  const handleEditCoupon = (coupon: CouponResponse) => {
    setSelectedCoupon(coupon);
    setIsCouponDialogOpen(true);
  };

  const handleSaveCoupon = async (couponData: any) => {
    try {
      const adminCouponService = (await import("@/services/adminCouponService"))
        .default;
      if (selectedCoupon) {
        await adminCouponService.updateCoupon(selectedCoupon.id, couponData);
        toast({ title: "Coupon Updated" });
      } else {
        await adminCouponService.createCoupon(couponData);
        toast({ title: "Coupon Created" });
      }
      loadCoupons();
      setIsCouponDialogOpen(false);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Operation failed",
      });
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (confirm("Delete this coupon?")) {
      try {
        const adminCouponService = (
          await import("@/services/adminCouponService")
        ).default;
        await adminCouponService.deleteCoupon(id);
        loadCoupons();
        toast({ title: "Coupon Deleted" });
      } catch {
        toast({ variant: "destructive", title: "Error" });
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast({
        title: "Processing...",
        description: "Reading Excel file...",
        duration: 2000,
      });
      const data = await file.arrayBuffer();
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet);

      const rows = rawRows.map((row) => {
        const normalized: any = {};
        Object.keys(row).forEach((key) => {
          normalized[key.trim()] = row[key];
        });
        return normalized;
      });

      const validationErrors: string[] = [];
      rows.forEach((row, index) => {
        const rowNum = index + 2;
        const pCode = row["Product"];
        const pName = row["Product / Unit"];
        const category = row["Category"];
        const sku = row["SKU Code"];
        const sellingPrice = row["Selling price"];
        const mrp = row["Pricing - MRP with tax"];
        const bulkPrice = row["Bulk order price"];
        const moq = row["MOQ"];
        const cogs = row["Cost of goods sold COGS"];

        if (!pCode)
          validationErrors.push(`Row ${rowNum}: Product Code is missing.`);
        if (!pName)
          validationErrors.push(`Row ${rowNum}: Product Name is missing.`);
        if (!category)
          validationErrors.push(`Row ${rowNum}: Category is missing.`);
        if (!sku) validationErrors.push(`Row ${rowNum}: SKU Code is missing.`);
        if (
          sellingPrice === undefined ||
          isNaN(parseFloat(sellingPrice)) ||
          parseFloat(sellingPrice) <= 0
        )
          validationErrors.push(
            `Row ${rowNum}: Selling price is missing or invalid (must be a positive number).`,
          );
        if (mrp !== undefined && isNaN(parseFloat(mrp)))
          validationErrors.push(`Row ${rowNum}: MRP must be a number.`);
        if (bulkPrice !== undefined && isNaN(parseFloat(bulkPrice)))
          validationErrors.push(`Row ${rowNum}: Bulk price must be a number.`);
        if (moq !== undefined && (isNaN(parseInt(moq)) || parseInt(moq) < 0))
          validationErrors.push(
            `Row ${rowNum}: MOQ must be a non-negative integer.`,
          );
        if (cogs !== undefined && isNaN(parseFloat(cogs)))
          validationErrors.push(`Row ${rowNum}: COGS must be a number.`);

        const boxLength = row["Box Length (mm)"];
        const boxBreadth = row["Box Breadth (mm)"];
        const boxHeight = row["Box Height (mm)"];
        const unitsPerBox = row["Units per Box"];
        const weightKg = row["Weight (kg)"];

        if (
          boxLength === undefined ||
          isNaN(parseFloat(boxLength)) ||
          parseFloat(boxLength) <= 0
        )
          validationErrors.push(
            `Row ${rowNum}: Box Length (mm) is required and must be a positive number.`,
          );
        if (
          boxBreadth === undefined ||
          isNaN(parseFloat(boxBreadth)) ||
          parseFloat(boxBreadth) <= 0
        )
          validationErrors.push(
            `Row ${rowNum}: Box Breadth (mm) is required and must be a positive number.`,
          );
        if (
          boxHeight === undefined ||
          isNaN(parseFloat(boxHeight)) ||
          parseFloat(boxHeight) <= 0
        )
          validationErrors.push(
            `Row ${rowNum}: Box Height (mm) is required and must be a positive number.`,
          );
        if (
          unitsPerBox === undefined ||
          isNaN(parseInt(unitsPerBox)) ||
          parseInt(unitsPerBox) <= 0
        )
          validationErrors.push(
            `Row ${rowNum}: Units per Box is required and must be a positive integer.`,
          );
        if (
          weightKg === undefined ||
          isNaN(parseFloat(weightKg)) ||
          parseFloat(weightKg) <= 0
        )
          validationErrors.push(
            `Row ${rowNum}: Weight (kg) is required and must be a positive number.`,
          );
      });

      if (validationErrors.length > 0) {
        const errorSummary =
          validationErrors.slice(0, 5).join("\n") +
          (validationErrors.length > 5
            ? `\n...and ${validationErrors.length - 5} more errors.`
            : "");
        toast({
          variant: "destructive",
          title: "Validation Failed",
          description: `Please fix the following errors in your sheet and try again:\n\n${errorSummary}`,
          duration: 6000,
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const productsMap = new Map<string, any>();
      for (const row of rows) {
        const productCode = row["Product"];
        if (!productCode) continue;
        if (!productsMap.has(productCode)) {
          productsMap.set(productCode, {
            productCode,
            productName: row["Product / Unit"],
            category: row["Category"],
            subCategory: row["Sub Category"],
            unit: row["Unit"],
            location: row["Location"],
            monthlyProductionCapacity: row["Monthly Production Capacity"],
            producedBy: row["Produced By (Unit Type)"],
            returnApplicable: row["Return Applicable"] === "Yes",
            returnWindow: row["Return Window"],
            leadTime: row["Lead time for production"],
            description: row["Product description"],
            competitiveAdvantage: row["Competitive advantage"],
            skus: [],
            images: [],
          });
        }

        const rowLengthMm = row["Box Length (mm)"];
        const rowBreadthMm = row["Box Breadth (mm)"];
        const rowHeightMm = row["Box Height (mm)"];
        const rowUnitsPerBox = row["Units per Box"];
        const rowWeightKg = row["Weight (kg)"];
        productsMap.get(productCode).skus.push({
          sku: row["SKU Code"],
          packaging: row["Packaging Available"],
          mrp: parseFloat(row["Pricing - MRP with tax"]) || 0,
          sellingPrice: parseFloat(row["Selling price"]) || 0,
          bulkOrderPrice: parseFloat(row["Bulk order price"]) || 0,
          moq: parseInt(row["MOQ"]) || 0,
          cogs: parseFloat(row["Cost of goods sold COGS"]) || 0,
          lengthMm:
            typeof rowLengthMm === "number"
              ? rowLengthMm
              : parseFloat(rowLengthMm) || 0,
          breadthMm:
            typeof rowBreadthMm === "number"
              ? rowBreadthMm
              : parseFloat(rowBreadthMm) || 0,
          heightMm:
            typeof rowHeightMm === "number"
              ? rowHeightMm
              : parseFloat(rowHeightMm) || 0,
          unitsPerBox:
            typeof rowUnitsPerBox === "number"
              ? rowUnitsPerBox
              : parseInt(rowUnitsPerBox) || 0,
          weightKg:
            typeof rowWeightKg === "number"
              ? rowWeightKg
              : parseFloat(rowWeightKg) || 0,
          isActive: true,
        });
      }

      const productsArray = Array.from(productsMap.values());
      if (productsArray.length === 0) {
        toast({
          variant: "destructive",
          title: "Format Error",
          description: "No valid products found in the sheet.",
        });
        return;
      }

      const allCategoryNames = new Set(
        productsArray.map((p) => p.category).filter(Boolean),
      );
      const existingCategoryNames = new Set(categories.map((c) => c.name));
      const missingCategoryNames = Array.from(allCategoryNames).filter(
        (name) => !existingCategoryNames.has(name),
      );

      if (missingCategoryNames.length > 0) {
        toast({
          title: "Creating Categories...",
          description: `Creating ${missingCategoryNames.length} missing categories...`,
          duration: 2000,
        });
        await productService.bulkAddCategories(
          missingCategoryNames as string[],
        );
        await loadCategories();
      }

      toast({
        title: "Uploading...",
        description: `Sending ${productsArray.length} aggregated products to server...`,
        duration: 3000,
      });
      await productService.bulkAddProducts(productsArray);
      toast({
        title: "Success",
        description: `Successfully uploaded ${productsArray.length} products with all their variants!`,
      });
      loadProducts();
    } catch (error: any) {
      console.error("Upload failed", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "Failed to process the Excel file.",
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview products={products} />;
      case "products":
        return (
          <ProductsTab
            products={products}
            categories={categories}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onToggleFeatured={toggleFeatured}
            onNavigateToInventory={() => setActiveTab("inventory")}
          />
        );
      case "categories":
        return (
          <div className="mt-6">
            <Modules.CategoriesView
              categories={categories}
              onAdd={handleAddCategory}
              onEdit={handleEditCategory}
              onDelete={handleDeleteCategory}
            />
          </div>
        );
      case "orders":
        return (
          <div className="mt-6">
            <Modules.OrdersView
              onNavigate={(tab, orderId) => {
                setActiveTab(tab);
                if (orderId) setPendingViewOrderId(orderId);
              }}
              initialViewOrderId={pendingViewOrderId ?? undefined}
              onViewOrderConsumed={() => setPendingViewOrderId(null)}
            />
          </div>
        );
      case "abandonedCarts":
        return (
          <div className="mt-6">
            <Modules.AbandonedCartsView />
          </div>
        );
      case "customers":
        return (
          <div className="mt-6">
            <Modules.CustomersView />
          </div>
        );
      case "sellers":
        return (
          <div className="mt-6">
            <Modules.SellersView
              sellers={sellers}
              onAdd={handleAddSeller}
              onEdit={handleEditSeller}
              onDelete={handleDeleteSeller}
            />
          </div>
        );
      case "inventory":
        return (
          <div className="mt-6">
            <Modules.InventoryView
              onNavigate={setActiveTab}
              inventory={inventory}
              metadata={inventoryMetadata}
              onPageChange={loadInventory}
              onSync={handleSyncInventory}
              onAdjust={handleAdjustStock}
            />
          </div>
        );
      case "coupons":
        return (
          <div className="mt-6">
            <Modules.CouponsView
              coupons={coupons}
              onAdd={handleAddCoupon}
              onEdit={handleEditCoupon}
              onDelete={handleDeleteCoupon}
            />
          </div>
        );
      case "payments":
        return (
          <div className="mt-6">
            <Modules.PaymentsView
              onNavigate={(tab, orderId) => {
                setActiveTab(tab);
                if (orderId) setPendingViewOrderId(orderId);
              }}
            />
          </div>
        );
      case "shipping":
        return (
          <div className="mt-6">
            <Modules.ShippingView
              onNavigate={(tab, orderId) => {
                setActiveTab(tab);
                if (orderId) setPendingViewOrderId(orderId);
              }}
            />
          </div>
        );
      case "packaging":
        return (
          <div className="mt-6">
            <Modules.PackagingBoxesView />
          </div>
        );
      case "analytics":
        return (
          <div className="mt-6">
            <Modules.AnalyticsView />
          </div>
        );
      case "returns":
        return <Modules.ReturnsView />;
      case "messages":
        return <Modules.MessagesView />;
      case "media":
        return <MediaManagement />;
      case "shorts":
        return <ShortsManagement />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      <div className="flex">
        <aside className="w-72 bg-forest text-white min-h-screen p-6 hidden lg:block sticky top-0 h-screen overflow-y-auto">
          <AdminSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            handleLogout={handleLogout}
          />
        </aside>

        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent
            side="left"
            className="bg-forest text-white border-r-white/10 p-6 w-72"
          >
            <AdminSidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              handleLogout={handleLogout}
              onClose={() => setIsMobileMenuOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <main className="flex-1 p-4 md:p-8 overflow-hidden">
          <AdminHeader
            activeTab={activeTab}
            onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
            onAddProduct={handleAddProduct}
            fileInputRef={fileInputRef}
            onFileChange={handleFileUpload}
          />

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {renderContent()}
          </div>
        </main>
      </div>

      <CategoryDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        onSave={handleSaveCategory}
        initialData={selectedCatData}
        mode={catDialogMode}
      />

      <ProductDialog
        open={isProductEditOpen}
        onOpenChange={setIsProductEditOpen}
        product={selectedProduct}
        onSave={handleSaveProduct}
        mode={productDialogMode}
      />

      <Modules.SellerDialog
        open={isSellerDialogOpen}
        onOpenChange={setIsSellerDialogOpen}
        seller={selectedSeller}
        onSave={handleSaveSeller}
      />

      <Modules.CouponDialog
        open={isCouponDialogOpen}
        onOpenChange={setIsCouponDialogOpen}
        coupon={selectedCoupon}
        onSave={handleSaveCoupon}
      />
    </div>
  );
};

export default AdminDashboard;
