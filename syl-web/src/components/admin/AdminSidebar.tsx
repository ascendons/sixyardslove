import React from "react";
import {
  LayoutDashboard,
  Package,
  LogOut,
  Layers,
  ShoppingCart,
  ShoppingBag,
  Users,
  Store,
  Box,
  CreditCard,
  Truck,
  BarChart3,
  RefreshCcw,
  Ticket,
  Image as ImageIcon,
  Mail,
  Sparkles,
  Package2,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminTab } from "./types";

export const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "categories", label: "Categories", icon: Layers },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "abandonedCarts", label: "Abandoned Carts", icon: ShoppingBag },
  { id: "customers", label: "Customers", icon: Users },
  { id: "sellers", label: "Sellers", icon: Store },
  { id: "inventory", label: "Inventory", icon: Box },
  { id: "coupons", label: "Coupons", icon: Ticket },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "shipping", label: "Shipping", icon: Truck },
  { id: "packaging", label: "Packaging", icon: Package2 },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "returns", label: "Returns", icon: RefreshCcw },
  { id: "messages", label: "Messages", icon: Mail },
  { id: "shorts", label: "Shorts / Reels", icon: Video },
];

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  handleLogout: () => void;
  onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  handleLogout,
  onClose,
}) => (
  <div className="flex flex-col h-full">
    <div className="mb-10 flex items-center gap-3 shrink-0">
      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center italic font-bold">
        BB
      </div>
      <h1 className="text-xl font-display font-bold italic">Six Yards Love Admin</h1>
    </div>
    <nav className="space-y-1 flex-1 overflow-y-auto">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            setActiveTab(item.id as AdminTab);
            onClose?.();
          }}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
            activeTab === item.id
              ? "bg-white/10 text-white shadow-inner"
              : "text-white/60 hover:bg-white/5 hover:text-white",
          )}
        >
          <item.icon
            className={cn(
              "w-5 h-5",
              activeTab === item.id ? "text-primary" : "text-white/40",
            )}
          />
          {item.label}
        </button>
      ))}
      <div className="pt-8 mt-8 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm font-medium"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </nav>
  </div>
);
