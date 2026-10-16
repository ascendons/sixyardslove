import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  ShoppingBag,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Plus,
  Truck,
  Loader2,
  Tag,
  X,
} from "lucide-react";
import { cartService, CartResponse } from "@/services/cartService";
import { userService, UserAddress } from "@/services/userService";
import { orderService } from "@/services/orderService";
import {
  razorpayService,
  loadRazorpayScript,
} from "@/services/razorpayService";
import couponService, {
  CouponValidationResponse,
} from "@/services/couponService";
import { getShippingFee, getShippingLabel } from "@/services/shippingService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CheckoutPage() {
  const navigate = useNavigate();

  const [cart, setCart] = useState<CartResponse | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");


  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] =
    useState<CouponValidationResponse | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Order expiry countdown — starts when order is placed in handlePay
  const [orderExpirySeconds, setOrderExpirySeconds] = useState<number | null>(
    null,
  );
  const orderExpiryIntervalRef = useRef<number | null>(null);

  const EXPIRY_SECONDS = 30 * 60; // 30 minutes

  // New address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    label: "Home",
    isDefault: false,
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const pincodeDebounceRef = useRef<number>(0);

  const lookupPincode = async (pincode: string) => {
    setPincodeLoading(true);
    try {
      const res = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`,
      );
      const data = await res.json();
      if (data?.[0]?.Status === "Success" && data[0].PostOffice?.length) {
        const po = data[0].PostOffice[0];
        setNewAddress((p) => ({ ...p, city: po.District, state: po.State }));
      }
    } catch {
      // silent — user can fill manually
    } finally {
      setPincodeLoading(false);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const [cartData, addrData] = await Promise.all([
          cartService.getCart(),
          userService.getAddresses(),
        ]);
        setCart(cartData);
        setAddresses(addrData);
        const def = addrData.find((a) => a.isDefault) ?? addrData[0];
        if (def) setSelectedAddressId(def.id);
      } catch {
        setError("Failed to load checkout data. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);


  // Countdown timer for order expiry — starts at 30 minutes when order is placed
  useEffect(() => {
    if (orderExpirySeconds === null || orderExpirySeconds <= 0) return;

    const tick = () => {
      setOrderExpirySeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(orderExpiryIntervalRef.current!);
          orderExpiryIntervalRef.current = null;
          toast.error("Your order has expired. Please retry from your cart.");
          navigate("/cart");
          return 0;
        }
        return prev - 1;
      });
    };

    orderExpiryIntervalRef.current = window.setInterval(tick, 1000);
    return () => {
      if (orderExpiryIntervalRef.current !== null) {
        clearInterval(orderExpiryIntervalRef.current);
        orderExpiryIntervalRef.current = null;
      }
    };
  }, [orderExpirySeconds, navigate]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const addressPayload = {
        ...newAddress,
        addressType: "HOME" as const,
      };
      const saved = await userService.addAddress(addressPayload as any);
      setAddresses((prev) => [...prev, saved]);
      setSelectedAddressId(saved.id);
      setShowAddressForm(false);
      setNewAddress({
        addressLine1: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
        label: "Home",
        isDefault: false,
      });
      toast.success("Address added");
    } catch {
      toast.error("Failed to save address");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    if (!cart?.items?.length) {
      toast.error("Your cart is empty");
      return;
    }
    setCouponLoading(true);
    try {
      const cartItems = cart.items.map((item) => ({
        productId: item.productId,
        variantId: item.productVariantId,
        categoryId: item.categoryId,
        sku: item.sku,
        price: item.price,
        quantity: item.quantity,
      }));
      const result = await couponService.validateCoupon(
        couponCode.trim().toUpperCase(),
        cartItems,
      );
      if (result.valid) {
        setAppliedCoupon(result);
        toast.success(
          `Coupon applied! You save ₹${result.discountAmount.toLocaleString()}`,
        );
      } else {
        toast.error(result.message || "Invalid coupon");
        setAppliedCoupon(null);
      }
    } catch (err: any) {
      const isNetworkError = !err?.response;
      toast.error(
        isNetworkError
          ? "Network error — please check your connection and try again."
          : err?.response?.data?.message || "Failed to apply coupon",
      );
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponLoading(false);
  };

  const handlePay = async () => {
    if (!selectedAddressId) {
      toast.error("Please select a delivery address");
      return;
    }
    if (!cart || cart.items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setPaying(true);
    setError("");

    try {
      // 1. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error(
          "Razorpay checkout could not be loaded. Check your internet connection.",
        );
      }

      // 2. Create internal order
      const order = await orderService.placeOrder({
        addressId: selectedAddressId,
        isBulk: false,
        currencyCode: cart.currency || "INR",
        shippingFee: shippingFee > 0 ? shippingFee : undefined,
        couponCode: appliedCoupon?.code,
      });

      // Start 30-minute expiry countdown
      setOrderExpirySeconds(30 * 60);

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
              // Verification failed on client side — backend webhook will reconcile
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
      if (orderExpiryIntervalRef.current !== null) {
        clearInterval(orderExpiryIntervalRef.current);
        orderExpiryIntervalRef.current = null;
      }
      setOrderExpirySeconds(null);
      toast.success("Payment successful! Your order has been placed.");
      navigate("/account/orders");
    } catch (err: any) {
      if (orderExpiryIntervalRef.current !== null) {
        clearInterval(orderExpiryIntervalRef.current);
        orderExpiryIntervalRef.current = null;
      }
      setOrderExpirySeconds(null);
      if (err?.message === "DISMISSED") {
        toast.info(
          "Payment cancelled. Your order is still saved — you can retry payment from Orders.",
        );
        navigate("/account/orders");
      } else {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Payment failed. Please try again.";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container-institutional py-12 max-w-4xl">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-72 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const items = cart?.items || [];
  const subtotal = cart?.totalAmount || 0;
  const currencySymbol =
    cart?.currency === "INR" ? "₹" : (cart?.currency ?? "₹");
  const couponDiscount = appliedCoupon?.discountAmount ?? 0;
  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
  const shippingFee = getShippingFee(discountedSubtotal);
  const shippingLabel = getShippingLabel(discountedSubtotal);
  const total = discountedSubtotal + shippingFee;

  return (
    <Layout>
      <div className="container-institutional py-12 max-w-5xl">
        <h1 className="text-3xl font-display font-bold text-forest mb-8 flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-primary" />
          Checkout
        </h1>

        {error && (
          <div className="mb-6 bg-destructive/10 text-destructive text-sm p-4 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* LEFT — address + items */}
          <div className="lg:col-span-3 space-y-6">
            {/* Delivery Address */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5 text-primary" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {addresses.length === 0 && !showAddressForm && (
                  <p className="text-sm text-muted-foreground">
                    No saved addresses. Add one below.
                  </p>
                )}
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border-2 transition-all",
                      selectedAddressId === addr.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2
                        className={cn(
                          "w-5 h-5 mt-0.5 shrink-0 transition-colors",
                          selectedAddressId === addr.id
                            ? "text-primary"
                            : "text-muted-foreground/30",
                        )}
                      />
                      <div>
                        <p className="font-semibold text-sm">
                          {addr.label || addr.addressType}
                          {addr.isDefault && (
                            <span className="ml-2 text-xs text-primary font-normal">
                              Default
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {addr.addressLine1}, {addr.city}, {addr.state} —{" "}
                          {addr.pincode}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}

                {!showAddressForm ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => setShowAddressForm(true)}
                  >
                    <Plus className="w-4 h-4" /> Add new address
                  </Button>
                ) : (
                  <form
                    onSubmit={handleAddAddress}
                    className="border rounded-xl p-4 space-y-3 bg-muted/20"
                  >
                    <p className="font-semibold text-sm">New Address</p>
                    {[
                      {
                        id: "addressLine1",
                        label: "Address Line",
                        placeholder: "Street, building...",
                      },
                      {
                        id: "pincode",
                        label: "Pincode",
                        placeholder: "6-digit pincode",
                      },
                      { id: "city", label: "City", placeholder: "e.g. Mumbai" },
                      {
                        id: "state",
                        label: "State",
                        placeholder: "e.g. Maharashtra",
                      },
                    ].map(({ id, label, placeholder }) => (
                      <div key={id} className="space-y-1">
                        <Label
                          htmlFor={id}
                          className="text-xs flex items-center gap-1"
                        >
                          {label}
                          {id === "pincode" && pincodeLoading && (
                            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                          )}
                        </Label>
                        <Input
                          id={id}
                          placeholder={placeholder}
                          value={(newAddress as any)[id]}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewAddress((p) => ({ ...p, [id]: val }));
                            if (id === "pincode" && /^\d{6}$/.test(val)) {
                              clearTimeout(pincodeDebounceRef.current);
                              pincodeDebounceRef.current = window.setTimeout(
                                () => {
                                  lookupPincode(val);
                                },
                                400,
                              );
                            }
                          }}
                          required
                          className="h-8 text-sm"
                        />
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <Button type="submit" size="sm" disabled={savingAddress}>
                        {savingAddress ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddressForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Coupon */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Tag className="w-5 h-5 text-primary" />
                  Coupon Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl p-3">
                    <div>
                      <p className="font-semibold text-sm text-primary">
                        {appliedCoupon.code}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        You save {currencySymbol}
                        {appliedCoupon.discountAmount.toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleApplyCoupon()
                      }
                      className="uppercase"
                    />
                    <Button
                      variant="outline"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                    >
                      {couponLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Items */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  Items ({items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden shrink-0">
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
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {item.productName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.packaging} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-bold text-sm shrink-0">
                      {currencySymbol}
                      {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT — order summary */}
          <div className="lg:col-span-2">
            <Card className="sticky top-32 bg-forest text-white border-none shadow-xl overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <h2 className="text-xl font-bold">Order Summary</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-white/70">
                    <span>Subtotal</span>
                    <span className="text-white font-semibold">
                      {currencySymbol}
                      {subtotal.toLocaleString()}
                    </span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-white/70">
                      <span>Coupon ({appliedCoupon.code})</span>
                      <span className="text-green-400 font-semibold">
                        -{currencySymbol}
                        {couponDiscount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-white/70">
                    <div>
                      <span>Shipping</span>
                      <p className="text-[10px] text-white/40 mt-0.5">{shippingLabel}</p>
                    </div>
                    <span className="text-white font-semibold">
                      {shippingFee === 0 ? "Free" : `${currencySymbol}${shippingFee}`}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-white/10 flex justify-between items-end">
                    <span className="text-base">Total</span>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-secondary">
                        {currencySymbol}
                        {total.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
                        Incl. GST
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order expiry warning */}
                {orderExpirySeconds !== null && orderExpirySeconds > 0 && (
                  <div
                    className={cn(
                      "rounded-xl p-3 text-sm text-center font-semibold transition-colors",
                      orderExpirySeconds <= 60
                        ? "bg-red-500/20 text-red-300 border border-red-500/30"
                        : orderExpirySeconds <= 300
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-white/10 text-white/70 border border-white/10",
                    )}
                  >
                    {orderExpirySeconds <= 60
                      ? `⏱ Expires in ${Math.floor(orderExpirySeconds / 60)}:${String(orderExpirySeconds % 60).padStart(2, "0")} — hurry!`
                      : `⏱ Order reserved for ${Math.floor(orderExpirySeconds / 60)}:${String(orderExpirySeconds % 60).padStart(2, "0")}`}
                  </div>
                )}

                <Button
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 h-14 rounded-2xl font-bold text-lg shadow-lg shadow-black/20"
                  onClick={handlePay}
                  disabled={paying || items.length === 0 || !selectedAddressId}
                >
                  {paying ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Pay {currencySymbol}
                      {total.toLocaleString()}
                    </>
                  )}
                </Button>

                <p className="text-center text-white/30 text-[10px] uppercase tracking-widest">
                  Secured by Razorpay · 256-bit SSL
                </p>
              </CardContent>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
