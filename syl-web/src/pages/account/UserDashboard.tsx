import { useEffect, useState } from "react";
import { AccountLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { userService, UserProfile } from "@/services/userService";
import { orderService, OrderResponse } from "@/services/orderService";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, MapPin, User, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function UserDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const [p, o] = await Promise.all([
          userService.getProfile(),
          orderService.getMyOrders("this_year"),
        ]);
        setProfile(p);
        setRecentOrders(o.slice(0, 3));
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <AccountLayout title="Dashboard" subtitle="Welcome back!">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="mt-8">
          <Skeleton className="h-[300px] w-full" />
        </div>
      </AccountLayout>
    );
  }

  const stats = [
    {
      label: "Total Orders",
      value: recentOrders.length,
      icon: ShoppingBag,
      color: "text-blue-500",
    },
    { label: "Wishlist Items", value: 0, icon: Heart, color: "text-red-500" },
    {
      label: "Active Addresses",
      value: 0,
      icon: MapPin,
      color: "text-green-500",
    },
    {
      label: "Account Status",
      value: profile?.isActive ? "Active" : "Inactive",
      icon: User,
      color: "text-purple-500",
    },
  ];

  return (
    <AccountLayout
      title={`Hello, ${profile?.firstName || "User"}!`}
      subtitle="Here's what's happening with your account."
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{order.totalAmount}</p>
                      <p className="text-xs uppercase text-primary font-semibold">
                        {order.status}
                      </p>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => navigate("/account/orders")}
                >
                  View All Orders
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">
                  You haven't placed any orders yet.
                </p>
                <Button variant="link" onClick={() => navigate("/shop")}>
                  Start Shopping
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {profile?.firstName?.[0]}
                {profile?.lastName?.[0]}
              </div>
              <div>
                <p className="font-medium">
                  {profile?.firstName} {profile?.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {profile?.email}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t space-y-2">
              <p className="text-sm">
                <strong>Member Since:</strong>{" "}
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString()
                  : "N/A"}
              </p>
              <p className="text-sm">
                <strong>Phone:</strong> {profile?.phone || "Not provided"}
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/account/profile")}
            >
              Edit Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    </AccountLayout>
  );
}
