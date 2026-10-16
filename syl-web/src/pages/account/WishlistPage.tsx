import { useEffect, useState } from "react";
import { AccountLayout } from "@/components/layout";
import { wishlistService, WishlistItem } from "@/services/wishlistService";
import { cartService } from "@/services/cartService";
import { productService } from "@/services/productService";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ShoppingCart, Trash2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    async function loadWishlist() {
      try {
        const data = await wishlistService.getWishlist();
        setItems(data.items);
      } catch (error) {
        toast.error("Failed to load wishlist");
      } finally {
        setLoading(false);
      }
    }
    loadWishlist();
  }, []);

  const handleRemove = async (productId: string) => {
    try {
      await wishlistService.removeItem(productId);
      setItems(items.filter((item) => item.productId !== productId));
      toast.success("Removed from wishlist");
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };

  const handleAddToCart = async (item: WishlistItem) => {
    setAddingToCart(item.productId);
    try {
      // We need the variant ID, so we fetch the product details first
      const product = await productService.getProductByCode(item.productCode);
      if (!product || !product.skus || product.skus.length === 0) {
        throw new Error("Product details not found");
      }

      const defaultVariant = product.skus[0];
      await cartService.addItem(defaultVariant.id, 1);

      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success(`${item.productName} added to cart`);
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error("Failed to add to cart");
    } finally {
      setAddingToCart(null);
    }
  };

  if (loading) {
    return (
      <AccountLayout title="My Wishlist" subtitle="Your saved products.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[300px] w-full" />
          ))}
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout
      title="My Wishlist"
      subtitle="Keep track of products you love."
    >
      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card
              key={item.id}
              className="group relative overflow-hidden flex flex-col"
            >
              <div
                className="cursor-pointer flex-grow flex flex-col pt-4"
                onClick={() => navigate(`/product/${item.productCode}`)}
              >
                <div className="aspect-square bg-muted relative mb-4 overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Heart className="h-12 w-12 text-primary/10 group-hover:text-primary/20 transition-colors" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4 pt-0 flex-grow">
                  <h3 className="font-bold text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                    {item.productName}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {item.productCode}
                  </p>
                  {item.price && (
                    <p className="text-xl font-bold text-primary">
                      ₹{item.price.toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </div>
              <CardFooter className="p-4 pt-0 gap-2">
                <Button
                  className="flex-1 gap-2"
                  size="sm"
                  onClick={() => handleAddToCart(item)}
                  disabled={addingToCart === item.productId}
                >
                  {addingToCart === item.productId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-4 w-4" />
                  )}
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 text-red-500 hover:bg-red-50"
                  onClick={() => handleRemove(item.productId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Heart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Your wishlist is empty</h3>
            <p className="text-muted-foreground mb-6">
              Start adding products you like!
            </p>
            <Button onClick={() => navigate("/shop")}>Continue Shopping</Button>
          </CardContent>
        </Card>
      )}
    </AccountLayout>
  );
}
