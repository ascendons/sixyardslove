import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { AccountLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  Truck,
  Loader2,
  CheckCircle2,
  Circle,
  XCircle,
  RotateCcw,
  Download,
  FileText,
  Building2,
} from "lucide-react";
import {
  orderService,
  OrderResponse,
} from "@/services/orderService";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { InvoicePreview } from "./InvoicePreview";

// ── Helpers ──────────────────────────────────────────────────────────────────

const sym = (currency?: string) => (currency === "USD" ? "$" : "₹");

const fmt = (amount?: number | null, currency?: string) =>
  `${sym(currency)}${(amount ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    })
    : "—";

const statusBadge = (status: string) => {
  switch (status?.toUpperCase()) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "PROCESSING":
      return "bg-blue-100 text-blue-800";
    case "CONFIRMED":
      return "bg-sky-100 text-sky-800";
    case "SHIPPED":
      return "bg-purple-100 text-purple-800";
    case "DELIVERED":
      return "bg-green-100 text-green-800";
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const paymentBadge = (status: string) => {
  switch (status?.toUpperCase()) {
    case "SUCCESS":
    case "CAPTURED":
    case "PAID":
      return "bg-green-100 text-green-800";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "FAILED":
      return "bg-red-100 text-red-800";
    case "REFUNDED":
      return "bg-sky-100 text-sky-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const gt0 = (v?: number | null) => v != null && v > 0;

// ── Main Page ────────────────────────────────────────────────────────────────

export function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [cancelLoading, setCancelLoading] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnLoading, setReturnLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const {
    data: order,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["order", id],
    queryFn: () => orderService.getOrderDetails(id as string),
    enabled: !!id,
  });

  const { data: tracking, isLoading: trackingLoading } = useQuery({
    queryKey: ["orderTracking", id],
    queryFn: () => orderService.getOrderTracking(id as string),
    enabled: !!id && !!order,
    refetchInterval: 5 * 60 * 1000,
  });

  const handleCancelOrder = async () => {
    if (!id) return;
    setCancelLoading(true);
    try {
      await orderService.cancelOrder(id);
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      toast({
        title: "Order cancelled",
        description: "Your order has been cancelled successfully.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Cannot cancel order",
        description: err?.response?.data?.message || "Something went wrong.",
      });
    } finally {
      setCancelLoading(false);
    }
  };

  const handleRequestReturn = async () => {
    if (!id || !returnReason.trim()) return;
    setReturnLoading(true);
    try {
      await orderService.requestReturn(id, returnReason.trim());
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      setReturnDialogOpen(false);
      setReturnReason("");
      toast({
        title: "Return requested",
        description:
          "We've received your request and will be in touch within 2–3 business days.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Cannot request return",
        description: err?.response?.data?.message || "Something went wrong.",
      });
    } finally {
      setReturnLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!order || !invoiceRef.current) return;
    setPdfLoading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      await document.fonts.ready;
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;
      let y = 0;
      while (y < imgH) {
        pdf.addImage(imgData, "PNG", 0, -y, pageW, imgH);
        if (y + pageH < imgH) pdf.addPage();
        y += pageH;
      }
      pdf.save(`invoice-${order.orderNumber ?? order.id}.pdf`);
      toast({ title: "Invoice downloaded" });
    } catch {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Could not generate invoice.",
      });
    } finally {
      setPdfLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AccountLayout
        title="Order Details"
        subtitle="Loading your order's details..."
      >
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </AccountLayout>
    );
  }

  if (isError || !order) {
    return (
      <AccountLayout
        title="Order Not Found"
        subtitle="We couldn't find the requested order."
      >
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Order Not Found</h3>
            <p className="text-muted-foreground mb-6">
              The order you're looking for doesn't exist or you don't have
              access to it.
            </p>
            <Button onClick={() => navigate("/account/orders")}>
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </AccountLayout>
    );
  }

  const currency = order.currency;
  // Subtotal = totalAmount minus tax, shipping and coupon — works for both
  // inclusive-tax orders (new) and exclusive-tax orders (legacy DB data)
  const subtotal =
    (order.totalAmount ?? 0) -
    (order.taxAmount ?? 0) -
    (order.shippingFee ?? 0) +
    (order.couponDiscount ?? 0);
  const latestPayment = order.payments?.[0];

  return (
    <AccountLayout
      title="Order Details"
      subtitle="View your order summary, payment info, and invoice."
    >
      <div className="mb-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/account/orders")}
          className="pl-0 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
        </Button>
      </div>

      <div className="space-y-6">
        {/* ── Order Header ── */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Order Number
                </p>
                <p className="font-mono text-lg font-semibold">
                  {order.orderNumber ?? "—"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Placed on {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="flex flex-col md:items-end gap-2">
                <Badge className={statusBadge(order.status)} variant="outline">
                  {order.status}
                </Badge>
                {order.returnRequested && (
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-700 border-amber-200"
                  >
                    Return Requested
                  </Badge>
                )}
                <div className="text-2xl font-bold mt-1">
                  {fmt(order.totalAmount, currency)}
                </div>

                <div className="flex flex-wrap gap-2 mt-1 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInvoiceOpen(true)}
                  >
                    <FileText className="h-4 w-4 mr-1.5" /> View Invoice
                  </Button>


                  {(order.status === "PENDING" ||
                    order.status === "CONFIRMED") && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1.5" /> Cancel Order
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Cancel this order?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will cancel your order and restore stock. If
                              you've already paid, a refund will be processed
                              within 5–7 business days.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Order</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleCancelOrder}
                              disabled={cancelLoading}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {cancelLoading && (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              )}
                              Yes, Cancel Order
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                  {order.status === "DELIVERED" && !order.returnRequested && (
                    <Dialog
                      open={returnDialogOpen}
                      onOpenChange={setReturnDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-amber-700 border-amber-200 hover:bg-amber-50"
                        >
                          <RotateCcw className="h-4 w-4 mr-1.5" /> Request
                          Return
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Request a Return</DialogTitle>
                          <DialogDescription>
                            Tell us why you'd like to return this order.
                          </DialogDescription>
                        </DialogHeader>
                        <Textarea
                          placeholder="e.g. Received wrong item, product damaged, changed my mind…"
                          value={returnReason}
                          onChange={(e) => setReturnReason(e.target.value)}
                          rows={4}
                          className="mt-2"
                        />
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setReturnDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleRequestReturn}
                            disabled={returnLoading || !returnReason.trim()}
                          >
                            {returnLoading && (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            )}
                            Submit Request
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Order Items with GST breakdown ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Package className="h-5 w-5 mr-2" /> Items in this Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {order.items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="py-4 flex flex-col sm:flex-row justify-between gap-4"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="bg-muted h-14 w-14 rounded-lg flex-shrink-0 flex items-center justify-center">
                      <Package className="h-6 w-6 opacity-20" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {item.productName || "Product"}
                      </p>
                      {(item.sku || item.skuCode) && (
                        <p className="text-xs font-mono text-muted-foreground mt-0.5">
                          {item.sku || item.skuCode}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        {fmt(item.price, currency)} × {item.quantity}
                      </p>
                      {/* Per-item GST */}
                      {(gt0(item.cgstAmount) ||
                        gt0(item.sgstAmount) ||
                        gt0(item.igstAmount)) && (
                          <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                            {item.taxRate != null && (
                              <span className="bg-muted px-1.5 py-0.5 rounded font-medium">
                                GST {item.taxRate}%
                              </span>
                            )}
                            {gt0(item.cgstAmount) && (
                              <span>CGST {fmt(item.cgstAmount, currency)}</span>
                            )}
                            {gt0(item.sgstAmount) && (
                              <span>SGST {fmt(item.sgstAmount, currency)}</span>
                            )}
                            {gt0(item.igstAmount) && (
                              <span>IGST {fmt(item.igstAmount, currency)}</span>
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                  <div className="font-semibold text-right shrink-0 pt-1">
                    {fmt(item.price * item.quantity, currency)}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals summary */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-col sm:flex-row gap-6 justify-between">
                {/* GST summary */}
                {(gt0(order.cgstAmount) ||
                  gt0(order.sgstAmount) ||
                  gt0(order.igstAmount)) && (
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        GST Breakdown
                      </p>
                      <div className="space-y-1 text-sm">
                        {gt0(order.cgstAmount) && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Central GST (CGST)
                            </span>
                            <span>{fmt(order.cgstAmount, currency)}</span>
                          </div>
                        )}
                        {gt0(order.sgstAmount) && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              State GST (SGST)
                            </span>
                            <span>{fmt(order.sgstAmount, currency)}</span>
                          </div>
                        )}
                        {gt0(order.igstAmount) && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Integrated GST (IGST)
                            </span>
                            <span>{fmt(order.igstAmount, currency)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* Order totals */}
                <div className="sm:w-72 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{fmt(subtotal, currency)}</span>
                  </div>
                  {gt0(order.taxAmount) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span>{fmt(order.taxAmount, currency)}</span>
                    </div>
                  )}
                  {gt0(order.shippingFee) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{fmt(order.shippingFee, currency)}</span>
                    </div>
                  )}
                  {gt0(order.couponDiscount) && (
                    <div className="flex justify-between text-green-600">
                      <span>
                        Discount
                        {order.couponCode ? ` (${order.couponCode})` : ""}
                      </span>
                      <span>-{fmt(order.couponDiscount, currency)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-base pt-1">
                    <span>Total</span>
                    <span>{fmt(order.totalAmount, currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Payment Details ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <CreditCard className="h-5 w-5 mr-2" /> Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!latestPayment ? (
              <p className="text-sm text-muted-foreground">
                No payment records found.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    {
                      label: "Status",
                      value: (
                        <Badge
                          className={paymentBadge(latestPayment.status)}
                          variant="outline"
                        >
                          {latestPayment.status}
                        </Badge>
                      ),
                    },
                    {
                      label: "Amount",
                      value: fmt(
                        latestPayment.amount,
                        latestPayment.currency ?? currency,
                      ),
                    },
                    { label: "Provider", value: latestPayment.provider ?? "—" },
                    ...(latestPayment.method
                      ? [{ label: "Method", value: latestPayment.method }]
                      : []),
                    ...(latestPayment.paidAt
                      ? [
                        {
                          label: "Paid At",
                          value: formatDate(latestPayment.paidAt),
                        },
                      ]
                      : []),
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-muted/40 rounded-xl p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        {label}
                      </p>
                      <div className="font-semibold text-sm">{value}</div>
                    </div>
                  ))}
                  {latestPayment.providerPaymentId && (
                    <div className="bg-muted/40 rounded-xl p-4 col-span-2 sm:col-span-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        Payment Reference ID
                      </p>
                      <p className="font-mono text-xs break-all">
                        {latestPayment.providerPaymentId}
                      </p>
                    </div>
                  )}
                </div>
                {latestPayment.failureReason && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
                    <span className="font-semibold">Failure reason: </span>
                    {latestPayment.failureReason}
                  </div>
                )}
                {(order.payments?.length ?? 0) > 1 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                      All Attempts
                    </p>
                    {order.payments!.map((p, i) => (
                      <div
                        key={p.id ?? i}
                        className="flex justify-between items-center text-sm border rounded-xl px-4 py-3 mb-2"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            className={paymentBadge(p.status)}
                            variant="outline"
                          >
                            {p.status}
                          </Badge>
                          <span className="text-muted-foreground">
                            {formatDate(p.createdAt)}
                          </span>
                        </div>
                        <span className="font-semibold">
                          {fmt(p.amount, p.currency ?? currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Shipment Tracking ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Truck className="h-5 w-5 mr-2" /> Shipment Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trackingLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : !tracking ? (
              <p className="text-sm text-muted-foreground">
                Tracking information unavailable.
              </p>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Status", value: tracking.internalStatus },
                    { label: "Carrier", value: tracking.carrier || "—" },
                    { label: "Est. Delivery", value: tracking.etd || "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-muted/30 rounded-lg p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {label}
                      </p>
                      <p className="font-semibold text-sm mt-1 break-all">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
                {tracking.awb && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Tracking Number
                    </p>
                    <p className="font-mono font-semibold text-sm mt-1">{tracking.awb}</p>
                  </div>
                )}
                {(tracking as any).trackingUrl && (
                  <a
                    href={(tracking as any).trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-2 hover:opacity-75"
                  >
                    <Truck className="h-4 w-4 shrink-0" />
                    Track your shipment →
                  </a>
                )}
                {!tracking.awb && (
                  <p className="text-sm text-muted-foreground">
                    Your order is being prepared. Tracking will appear once shipped.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Shipping Address ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <MapPin className="h-5 w-5 mr-2" /> Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order.address ? (
              <div className="text-sm space-y-1">
                {order.address.label && (
                  <p className="font-semibold text-base">
                    {order.address.label}
                  </p>
                )}
                {order.address.addressLine1 && (
                  <p>{order.address.addressLine1}</p>
                )}
                {order.address.addressLine2 && (
                  <p>{order.address.addressLine2}</p>
                )}
                <p className="text-muted-foreground">
                  {[order.address.city, order.address.state]
                    .filter(Boolean)
                    .join(", ")}
                  {order.address.pincode || order.address.postalCode
                    ? ` – ${order.address.pincode ?? order.address.postalCode}`
                    : ""}
                </p>
                {order.address.country && (
                  <p className="text-muted-foreground">
                    {order.address.country}
                  </p>
                )}
                {order.address.landmark && (
                  <p className="text-muted-foreground text-xs">
                    Landmark: {order.address.landmark}
                  </p>
                )}
                {order.address.alternatePhone && (
                  <p className="text-muted-foreground text-xs">
                    Alt. Phone: {order.address.alternatePhone}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Address information is not available.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Invoice Preview Dialog ── */}
      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent className="max-w-5xl p-0 flex flex-col max-h-[90vh] z-[100]">
          <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Invoice Preview
            </h2>
            <Button onClick={handleDownloadPDF} disabled={pdfLoading} size="sm">
              {pdfLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Download className="h-4 w-4 mr-1.5" />
              )}
              Download PDF
            </Button>
          </div>
          <div className="overflow-auto flex-1">
            <div ref={invoiceRef}>
              <InvoicePreview order={order} />
            </div>
          </div>
          <div className="flex justify-end px-6 py-4 border-t shrink-0">
            <Button onClick={handleDownloadPDF} disabled={pdfLoading}>
              {pdfLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Download className="h-4 w-4 mr-1.5" />
              )}
              Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AccountLayout>
  );
}
