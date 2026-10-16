import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cartService } from "@/services/cartService";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function CartPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data: cart,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartService.getCart(),
  });

  useEffect(() => {
    if (isError) {
      toast.error("Failed to load cart. Please try again.");
    }
  }, [isError]);

  const updateQuantityMutation = useMutation({
    mutationFn: ({
      itemId,
      variantId,
      quantity,
    }: {
      itemId: string;
      variantId: string;
      quantity: number;
    }) => cartService.updateQuantity(itemId, variantId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: () => {
      toast.error("Failed to update quantity");
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => cartService.removeItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Item removed from cart");
    },
    onError: () => {
      toast.error("Failed to remove item");
    },
  });

  const handleUpdateQuantity = (
    itemId: string,
    variantId: string,
    currentQty: number,
    delta: number,
  ) => {
    const newQty = currentQty + delta;
    if (newQty < 0) {
      removeItemMutation.mutate(itemId);
      return;
    }
    if (newQty < 1) {
      removeItemMutation.mutate(itemId);
      return;
    }
    updateQuantityMutation.mutate({ itemId, variantId, quantity: newQty });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container-institutional py-12">
          <Skeleton className="h-12 w-48 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  const items = cart?.items || [];
  const subtotal = cart?.totalAmount || 0;
  const total = subtotal;

  return (
    <Layout>
      <div className="container-institutional py-12">
        <h1 className="text-3xl font-display font-bold text-forest mb-8 flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-primary" />
          Shopping Cart
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h2 className="text-xl font-bold text-forest mb-2">
              Your cart is empty
            </h2>
            <p className="text-muted-foreground mb-8">
              Looks like you hasn't added anything to your cart yet.
            </p>
            <Button asChild size="lg">
              <Link to="/shop">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items List */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden border-none shadow-sm bg-white hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex gap-4 sm:gap-6">
                      {/* Image */}
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-xl overflow-hidden shrink-0">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                            <ShoppingBag className="w-8 h-8" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-forest sm:text-lg hover:text-primary transition-colors">
                              <Link to={`/product/${item.productId}`}>
                                {item.productName}
                              </Link>
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                              Variant:{" "}
                              <span className="text-forest font-medium">
                                {item.packaging}
                              </span>
                            </p>
                          </div>
                          <p className="font-bold text-primary sm:text-lg">
                            {cart?.currency === "INR" ? "₹" : cart?.currency}
                            {item.price.toLocaleString()}
                          </p>
                        </div>

                        <div className="flex justify-between items-center mt-4">
                          <div className="flex items-center border border-border rounded-lg overflow-hidden">
                            <button
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.id,
                                  item.productVariantId,
                                  item.quantity,
                                  -1,
                                )
                              }
                              className="p-1 sm:p-2 hover:bg-muted text-muted-foreground disabled:opacity-30"
                              disabled={
                                updateQuantityMutation.isPending ||
                                updateQuantityMutation.isPending
                              }
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 sm:w-12 text-center font-bold text-sm sm:text-base">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.id,
                                  item.productVariantId,
                                  item.quantity,
                                  1,
                                )
                              }
                              className="p-1 sm:p-2 hover:bg-muted text-muted-foreground disabled:opacity-30"
                              disabled={updateQuantityMutation.isPending}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItemMutation.mutate(item.id)}
                            className="text-red-500 hover:text-red-600 transition-colors p-2"
                            disabled={removeItemMutation.isPending}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-32 border-none shadow-xl bg-forest text-white overflow-hidden">
                <CardContent className="p-8">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    Order Summary
                  </h2>
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-white/70">
                      <span>Subtotal</span>
                      <span className="font-bold text-white">
                        {cart?.currency === "INR" ? "₹" : cart?.currency}
                        {subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Shipping</span>
                      <span className="font-medium text-white/60 text-xs">
                        Calculated at checkout
                      </span>
                    </div>
                    <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                      <span className="text-lg">Total</span>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-secondary">
                          {cart?.currency === "INR" ? "₹" : cart?.currency}
                          {total.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-white/50 uppercase tracking-widest mt-1">
                          Including VAT/GST
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 h-14 rounded-2xl font-bold text-lg shadow-lg shadow-black/20 group"
                    onClick={() => navigate("/checkout")}
                  >
                    Proceed to Checkout
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>

                  <p className="text-center mt-6 text-white/40 text-[10px] uppercase tracking-widest">
                    Secure 256-bit SSL Encrypted Checkout
                  </p>
                </CardContent>

                {/* Visual accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full -ml-16 -mb-16 blur-3xl pointer-events-none" />
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
