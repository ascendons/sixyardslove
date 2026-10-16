import React from "react";
import { ChevronRight, Menu, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminTab } from "./types";

interface AdminHeaderProps {
  activeTab: AdminTab;
  onMobileMenuOpen: () => void;
  onAddProduct: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  onMobileMenuOpen,
  onAddProduct,
  fileInputRef,
  onFileChange,
}) => (
  <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
    <div className="flex items-center gap-4 w-full md:w-auto">
      <button
        onClick={onMobileMenuOpen}
        className="lg:hidden p-2 -ml-2 text-forest hover:bg-forest/5 rounded-xl transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>
      <div>
        <h2 className="text-3xl font-display font-bold text-forest capitalize">
          {activeTab === "dashboard" ? "Overview" : activeTab}
        </h2>
        <div className="flex items-center text-sm text-muted-foreground mt-1">
          <span>Admin</span>
          <ChevronRight className="w-3 h-3 mx-1" />
          <span className="capitalize">{activeTab}</span>
        </div>
      </div>
    </div>

    {activeTab === "products" && (
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="bg-white hover:bg-muted text-forest shadow-sm rounded-xl px-6 border-2"
        >
          <Package className="mr-2 h-4 w-4" /> Bulk Upload
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          accept=".xlsx, .xls"
          className="hidden"
        />
        <Button
          onClick={onAddProduct}
          className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl px-6"
        >
          <Plus className="mr-2 h-4 w-4" /> Add New Product
        </Button>
      </div>
    )}
  </header>
);
