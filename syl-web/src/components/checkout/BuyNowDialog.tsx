import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { userService, UserAddress } from "@/services/userService";
import { orderService } from "@/services/orderService";
import {
  razorpayService,
  loadRazorpayScript,
} from "@/services/razorpayService";
import { getShippingFee, getShippingLabel } from "@/services/shippingService";
import { Product } from "@/data/products";
import { toast } from "sonner";
import { Loader2, MapPin, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface BuyNowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  selectedVariantIndex: number;
  quantity: number;
  isBulk?: boolean;
}

export function BuyNowDialog({
  open,
  onOpenChange,
  product,
  selectedVariantIndex,
  quantity,
  isBulk = false,
}: BuyNowDialogProps) {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const navigate = useNavigate();

  const variant = product.skus[selectedVariantIndex];
  const itemPrice =
    isBulk && variant.bulkOrderPrice
      ? Number(variant.bulkOrderPrice)
      : Number(variant.sellingPrice);
  const subtotal = itemPrice * quantity;
  const shippingFee = getShippingFee(subtotal);
  const shippingLabel = getShippingLabel(subtotal);
  const total = subtotal + shippingFee;

  useEffect(() => {
    if (open) {
      loadAddresses();
    }
  }, [open]);

  async function loadAddresses() {
    setLoading(true);
    try {
      const data = await userService.getAddresses();
      setAddresses(data);
      if (data.length > 0) {
        const defaultAddress = data.find((a) => a.isDefault) || data[0];
        setSelectedAddressId(defaultAddress.id);
      }
    } catch (error) {
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error("Please select a delivery address");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error(
          "Razorpay checkout could not be loaded. Check your internet connection.",
        );
      }

      // 2. Create internal order
      const order = await orderService.placeBuyNowOrder({
        productVariantId: variant.id,
        quantity: quantity,
        addressId: selectedAddressId,
        currencyCode: "INR",
        isBulk: isBulk,
        shippingFee: shippingFee > 0 ? shippingFee : undefined,
      });

      // 3. Create Razorpay order
      const rzpData = await razorpayService.createOrder(order.id);

      // 4. Open Razorpay modal
      await new Promise<void>((resolve, reject) => {
        const options = {
          key: rzpData.keyId,
          amount: rzpData.amountInPaisa,
          currency: rzpData.currency,
          name: "Six Yards Love",
          description: `Order #${order.id.slice(0, 8).toUpperCase()}`,
          order_id: rzpData.razorpayOrderId,
          prefill: {
            name: rzpData.customerName,
            email: rzpData.customerEmail,
          },
          theme: { color: "#5C1A35" },

          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            try {
              await razorpayService.verifyPayment({
                internalPaymentId: rzpData.internalPaymentId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              });
              resolve();
            } catch (verifyErr: any) {
              const msg =
                verifyErr?.response?.data?.message ||
                "Payment verification failed. Contact support if amount was deducted.";
              reject(new Error(msg));
            }
          },

          modal: {
            ondismiss: () => {
              reject(new Error("DISMISSED"));
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", (response: any) => {
          reject(new Error(response.error?.description || "Payment failed"));
        });
        rzp.open();
      });

      // 5. Payment succeeded
      toast.success("Payment successful! Your order has been placed.");
      onOpenChange(false);
      navigate("/account/orders");
    } catch (error: any) {
      if (error?.message === "DISMISSED") {
        toast.info(
          "Payment cancelled. Your order is saved — you can retry payment from Orders.",
        );
        onOpenChange(false);
        navigate("/account/orders");
      } else {
        const message =
          error.response?.data?.message ||
          error.message ||
          "Failed to place order";
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold text-forest">
            Checkout
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
          {/* Order Summary */}
          <div className="bg-muted/30 p-4 rounded-xl space-y-3">
            <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
              Order Summary
            </h4>
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <p className="font-bold text-forest">{product.productName}</p>
                <p className="text-xs text-muted-foreground">
                  Variant: {variant.packaging} x {quantity}
                </p>
              </div>
              <p className="font-bold text-primary">
                ₹{subtotal.toLocaleString()}
              </p>
            </div>
            <div className="pt-2 border-t border-border/50 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Shipping ({shippingLabel})
                </span>
                <span className="font-medium">
                  {shippingFee > 0 ? `₹${shippingFee}` : "FREE"}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold text-forest pt-1">
                <span>Total Amount</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Address Selection */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                Delivery Address
              </h4>
              <Button
                variant="link"
                className="h-auto p-0 text-primary text-xs font-bold"
                onClick={() => navigate("/account/addresses")}
              >
                Manage Addresses
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : addresses.length > 0 ? (
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin">
                {addresses.map((address) => (
                  <button
                    key={address.id}
                    onClick={() => setSelectedAddressId(address.id)}
                    className={cn(
                      "w-full p-4 rounded-xl border-2 text-left transition-all relative group",
                      selectedAddressId === address.id
                        ? "border-primary bg-primary/5"
                        : "border-border/50 hover:border-primary/30",
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-muted text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                            {address.addressType}
                          </span>
                          {address.isDefault && (
                            <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium line-clamp-1">
                          {address.addressLine1}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {address.city}, {address.state} - {address.pincode}
                        </p>
                      </div>
                      {selectedAddressId === address.id && (
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed rounded-xl border-muted">
                <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-30" />
                <p className="text-sm text-muted-foreground mb-4">
                  No addresses found
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/account/addresses")}
                >
                  Add Address
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            className="w-full h-12 text-lg font-bold"
            onClick={handlePlaceOrder}
            disabled={
              submitting || !selectedAddressId || addresses.length === 0
            }
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Placing Order...
              </>
            ) : (
              "Confirm & Place Order"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
