import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  User,
  MapPin,
  Heart,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authService } from "@/services/authService";
import { useNavigate } from "react-router-dom";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/account" },
  { icon: ShoppingBag, label: "Orders", href: "/account/orders" },
  { icon: User, label: "Profile", href: "/account/profile" },
  { icon: MapPin, label: "Addresses", href: "/account/addresses" },
  { icon: Heart, label: "Wishlist", href: "/account/wishlist" },
];

export function UserSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate("/");
  };

  return (
    <aside className="w-full md:w-64 space-y-2">
      <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === "/account"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground",
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-950 mt-auto hidden md:flex"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </nav>
    </aside>
  );
}
