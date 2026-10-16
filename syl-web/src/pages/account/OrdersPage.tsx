import { useEffect, useState } from "react";
import { AccountLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { orderService, OrderResponse } from "@/services/orderService";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Filter = "this_month" | "this_year" | "all_time";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "this_month", label: "This Month" },
  { key: "this_year", label: "This Year" },
  { key: "all_time", label: "All Time" },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("this_year");
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    orderService
      .getMyOrders(filter)
      .then(setOrders)
      .catch(() => toast.error("Failed to load orders"))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <AccountLayout
      title="My Orders"
      subtitle="Track and manage your purchase history."
    >
      {/* Filter chips */}
      <div className="flex gap-2 mb-6">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors",
              filter === key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/50",
            )}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-sm text-muted-foreground self-center">
          {!loading &&
            `${orders.length} order${orders.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/account/orders/${order.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        Placed on{" "}
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Total Amount
                      </p>
                      <p className="font-bold">
                        ₹{order.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      className={
                        STATUS_COLORS[order.status] ??
                        "bg-gray-100 text-gray-800"
                      }
                      variant="outline"
                    >
                      {order.status}
                    </Badge>
                    <ChevronRight className="h-5 w-5 text-muted-foreground hidden md:block" />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                  {order.items.length > 0 ? (
                    order.items.map((item) => (
                      <div
                        key={item.id}
                        className="text-sm bg-muted px-2 py-1 rounded"
                      >
                        {item.productName} × {item.quantity}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No items listed
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No orders found</h3>
            <p className="text-muted-foreground mb-6">
              {filter === "this_month"
                ? "You haven't placed any orders this month."
                : filter === "this_year"
                  ? "You haven't placed any orders this year."
                  : "You haven't placed any orders yet."}
            </p>
            <Button onClick={() => navigate("/shop")}>Start Shopping</Button>
          </CardContent>
        </Card>
      )}
    </AccountLayout>
  );
}
