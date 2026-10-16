import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Eye,
  ArrowRight,
  CreditCard,
  Truck,
  Package,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  History,
  Store,
  Users as UsersIcon,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Shield,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Ticket,
  Calendar,
  BadgePercent,
  Search,
  Image as ImageIcon,
  CheckCircle2,
  Upload,
  X,
  Plus as PlusIcon,
  Package2,
  FileText,
  Download,
} from "lucide-react";
import { CouponResponse } from "@/services/couponService";
import adminOrderService, {
  AdminOrderResponse,
} from "@/services/adminOrderService";
import adminCartService, {
  AdminAbandonedCartResponse,
} from "@/services/adminCartService";
import {
  Tooltip as UiTooltip,
  TooltipContent as UiTooltipContent,
  TooltipTrigger as UiTooltipTrigger,
} from "@/components/ui/tooltip";
import adminPaymentService, {
  AdminPaymentResponse,
} from "@/services/adminPaymentService";
import adminShippingService, {
  AdminShipmentResponse,
} from "@/services/adminShippingService";
import adminShiprocketService, {
  CourierOption,
  PickupAddress,
  ShipmentTrack,
  TrackActivity,
} from "@/services/adminShiprocketService";
import packagingBoxService, {
  PackagingBox,
  PackagingBoxRequest,
} from "@/services/adminPackagingBoxService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CouponData, CouponRuleData } from "@/services/adminCouponService";
import { productService } from "@/services/productService";
import { cn } from "@/lib/utils";
import adminCustomerService, {
  AdminCustomerResponse,
} from "@/services/adminCustomerService";
import { useMutation } from "@tanstack/react-query";
import contactService, { ContactMessage } from "@/services/contactService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Seller } from "@/services/sellerService";
import { InvoicePreview } from "@/pages/account/InvoicePreview";
import { OrderResponse } from "@/services/orderService";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import mediaService from "@/services/mediaService";
import { Label } from "@/components/ui/label";

interface ModuleProps {
  onNavigate?: (tab: any, orderId?: string) => void;
}

interface InventoryViewProps extends ModuleProps {
  inventory: any[];
  metadata?: {
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  } | null;
  onPageChange?: (page: number) => void;
  onSync: () => void;
  onAdjust: (variantId: string, change: number, reason: string) => void;
}

export const StockAdjustmentDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any | null;
  onSave: (change: number, reason: string) => void;
}> = ({ open, onOpenChange, item, onSave }) => {
  const [change, setChange] = useState<string>("0");
  const [reason, setReason] = useState<string>("Stock Update");

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="rounded-2xl border-2"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold text-forest">
            Adjust Stock
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-muted/30 p-3 rounded-xl border-2 border-dashed flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Adjusting Stock for:
            </span>
            <div className="flex flex-col">
              <span className="font-black text-sm text-primary uppercase">
                {item.productName}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                SKU: {item.sku}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center p-4 bg-muted/30 rounded-xl border">
            <span className="text-sm font-medium">Current Stock</span>
            <span className="text-2xl font-bold">{item.stockLevel}</span>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground ml-1">
              Quantity Change (+ or -)
            </label>
            <Input
              type="number"
              value={change}
              onChange={(e) => setChange(e.target.value)}
              placeholder="e.g. 50 or -10"
              className="rounded-xl border-2 h-11"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground ml-1">
              Reason for Adjustment
            </label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="rounded-xl border-2 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Stock Update">Stock Update</SelectItem>
                <SelectItem value="Restock">Restock</SelectItem>
                <SelectItem value="Damage">Damage</SelectItem>
                <SelectItem value="Returned">Returned</SelectItem>
                <SelectItem value="Initial Sync">Initial Sync</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-2 flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(parseInt(change), reason);
              onOpenChange(false);
              setChange("0");
            }}
            className="bg-primary hover:bg-primary/90 text-white shadow-lg rounded-xl px-8 flex-1"
          >
            Save Adjustment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface CategoriesViewProps {
  categories: any[];
  onAdd: () => void;
  onEdit: (cat: any) => void;
  onDelete: (cat: any) => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [filter, setFilter] = useState("");
  const filtered = categories.filter((cat) =>
    cat.name.toLowerCase().includes(filter.toLowerCase()),
  );
  return (
    <Card className="border-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Categories Management</CardTitle>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter categories..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-8 h-9 w-48 text-sm"
            />
          </div>
          <Button
            onClick={onAdd}
            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl px-6 h-9"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Category
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-12 text-center">S.No</TableHead>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Category Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((cat, idx) => (
              <TableRow key={cat.id} className="hover:bg-muted/20">
                <TableCell className="text-center text-xs text-muted-foreground font-mono">
                  {idx + 1}
                </TableCell>
                <TableCell>
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                    {cat.imageUrl ? (
                      <img
                        src={cat.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-muted-foreground/40" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-bold text-sm tracking-tight">
                  <div className="flex flex-col">
                    <span>{cat.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {cat.id}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:text-primary"
                      onClick={() => onEdit(cat)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:text-red-500"
                      onClick={() => onDelete(cat)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export const OrderEditDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: AdminOrderResponse | null;
  onSave: () => void;
}> = ({ open, onOpenChange, order, onSave }) => {
  const [status, setStatus] = useState<string>("");
  const [carrier, setCarrier] = useState<string>("");
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [trackingUrl, setTrackingUrl] = useState<string>("");
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const { data: shipment, isLoading } = useQuery({
    queryKey: ["adminShipment", order?.shippingId],
    queryFn: () => adminShippingService.getShipmentById(order!.shippingId!),
    enabled: !!order?.shippingId && open,
  });

  React.useEffect(() => {
    if (order) {
      setStatus(order.status);
      setAdminNotes(order.adminNotes ?? "");
      if (shipment) {
        setCarrier(shipment.carrier || "");
        setTrackingNumber(shipment.trackingNumber || "");
        setTrackingUrl((shipment as any).trackingUrl || "");
        setEstimatedDelivery(
          shipment.estimatedDelivery
            ? shipment.estimatedDelivery.split("T")[0]
            : "",
        );
      } else if (!order.shippingId) {
        setCarrier("");
        setTrackingNumber("");
        setTrackingUrl("");
        setEstimatedDelivery("");
      }
    }
  }, [order, shipment, open]);

  if (!order) return null;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (status !== order.status) {
        await adminOrderService.updateOrderStatus(order.id, status);
      }
      if (adminNotes !== (order.adminNotes ?? "")) {
        await adminOrderService.updateNotes(order.id, adminNotes);
      }
      if (carrier.trim() || trackingNumber.trim() || trackingUrl.trim() || estimatedDelivery) {
        await adminOrderService.updateTracking(order.id, {
          carrier: carrier || undefined,
          trackingNumber: trackingNumber || undefined,
          trackingUrl: trackingUrl || undefined,
          estimatedDelivery: estimatedDelivery
            ? new Date(estimatedDelivery).toISOString()
            : undefined,
        });
      }
      toast.success("Order updated successfully");
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update order");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl rounded-2xl border-2"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold">
            Edit Order #{order.orderNumber}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase text-primary border-b pb-2">
              Order Details
            </h4>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">
                Order Status
              </label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="rounded-xl border-2 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "PENDING",
                    "CONFIRMED",
                    "PROCESSING",
                    "SHIPPED",
                    "DELIVERED",
                    "CANCELLED",
                    "REFUNDED",
                  ].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 border-l pl-6">
            <h4 className="font-bold text-sm uppercase text-primary border-b pb-2">
              Shipping Information
            </h4>
            {isLoading ? (
              <div className="flex items-center text-muted-foreground">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground ml-1">
                    Carrier
                  </label>
                  <Input
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    placeholder="e.g. BlueDart"
                    className="rounded-xl border-2 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground ml-1">
                    Tracking Number
                  </label>
                  <Input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Tracking #"
                    className="rounded-xl border-2 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground ml-1">
                    Tracking URL
                  </label>
                  <Input
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    placeholder="https://track.courier.com/..."
                    className="rounded-xl border-2 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground ml-1">
                    Estimated Delivery
                  </label>
                  <Input
                    type="date"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                    className="rounded-xl border-2 h-11"
                  />
                </div>
              </>
            )}
          </div>
        </div>
        {/* Admin notes — full width */}
        <div className="space-y-2 mt-2">
          <label className="text-xs font-bold uppercase text-muted-foreground ml-1">
            Admin Notes (internal)
          </label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Internal notes visible only to admins…"
            rows={3}
            className="w-full rounded-xl border-2 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Pencil className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Orders: Read-Only View Dialog ───────────────────────────────────────
const OrderViewDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: AdminOrderResponse | null;
  allOrders: AdminOrderResponse[];
  onNavigatePayments: () => void;
  onNavigateShipping: () => void;
  onRefresh: () => void;
}> = ({
  open,
  onOpenChange,
  order,
  allOrders,
  onNavigatePayments,
  onNavigateShipping,
  onRefresh,
}) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const capturedPayment = order.payments?.find(
    (p) => p.status === "CAPTURED" && p.providerPaymentId,
  );
  const customerOrders = allOrders.filter(
    (o) => o.userId === order.userId && o.id !== order.id,
  );

  const timeline = [
    { label: "Order Placed", time: order.createdAt, done: true },
    {
      label: "Payment Captured",
      time: capturedPayment?.paidAt ?? null,
      done: !!capturedPayment,
    },
    {
      label: "Confirmed",
      time: ["CONFIRMED", "SHIPPED", "DELIVERED"].includes(order.status)
        ? order.createdAt
        : null,
      done: ["CONFIRMED", "SHIPPED", "DELIVERED"].includes(order.status),
    },
    {
      label: "Shipped",
      time:
        order.status === "SHIPPED" || order.status === "DELIVERED"
          ? order.createdAt
          : null,
      done: order.status === "SHIPPED" || order.status === "DELIVERED",
    },
    {
      label: "Delivered",
      time: order.status === "DELIVERED" ? order.createdAt : null,
      done: order.status === "DELIVERED",
    },
  ];

  const handleAction = async (key: string, fn: () => Promise<void>) => {
    setActionLoading(key);
    try {
      await fn();
      toast.success(`${key} successful`);
      onRefresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || `${key} failed`);
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (status: string) => (
    <span
      className={cn(
        "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
        status === "SHIPPED"
          ? "bg-blue-100 text-blue-700"
          : status === "DELIVERED"
            ? "bg-green-100 text-green-700"
            : status === "CANCELLED" || status === "REFUNDED"
              ? "bg-red-100 text-red-700"
              : "bg-amber-100 text-amber-700",
      )}
    >
      {status}
    </span>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl rounded-2xl border-2 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <DialogTitle className="text-xl font-display font-bold">
                Order #{order.orderNumber}
              </DialogTitle>
              <div className="flex gap-2">
                {!["PENDING", "CANCELLED"].includes(order.status) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => setInvoiceOpen(true)}
                    disabled={!!actionLoading}
                  >
                    <FileText className="w-3 h-3" />
                    Invoice
                  </Button>
                )}
                {capturedPayment && order.status === "CANCELLED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() =>
                      handleAction("Refund", () =>
                        adminOrderService.refundOrder(order.id),
                      )
                    }
                    disabled={!!actionLoading}
                  >
                    {actionLoading === "Refund" ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    Refund ₹{(capturedPayment.amount ?? 0).toLocaleString()}
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Return request banner */}
            {order.returnRequested && (
              <div className="flex items-start justify-between bg-orange-50 border border-orange-200 rounded-xl p-3 gap-3">
                <div>
                  <p className="text-xs font-bold text-orange-700 uppercase">
                    Return Requested
                  </p>
                  <p className="text-xs text-orange-600 mt-0.5">
                    {order.returnReason || "No reason provided"}
                  </p>
                  {order.returnRequestedAt && (
                    <p className="text-[10px] text-orange-400 mt-0.5">
                      {new Date(order.returnRequestedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-50"
                    disabled={!!actionLoading}
                    onClick={() =>
                      handleAction("Return Approved", () =>
                        adminOrderService.acceptReturn(order.id),
                      )
                    }
                  >
                    {actionLoading === "Return Approved" ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : null}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50"
                    disabled={!!actionLoading}
                    onClick={() =>
                      handleAction("Return Rejected", () =>
                        adminOrderService.rejectReturn(order.id),
                      )
                    }
                  >
                    {actionLoading === "Return Rejected" ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : null}
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {/* Top-level info grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground uppercase font-bold">
                  Order No.
                </p>
                <p className="font-mono font-semibold mt-1 text-xs">
                  {order.orderNumber}
                </p>
              </div>
              <div className="bg-muted/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground uppercase font-bold">
                  Customer
                </p>
                <p className="font-semibold mt-1">
                  {order.customerName || "Guest User"}
                </p>
              </div>
              <div className="bg-muted/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground uppercase font-bold">
                  Status
                </p>
                <div className="mt-1">{statusBadge(order.status)}</div>
              </div>
              <div className="bg-muted/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground uppercase font-bold">
                  Total
                </p>
                <p className="font-bold mt-1">
                  ₹{(order.totalAmount ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-muted/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground uppercase font-bold">
                  Tax Amount
                </p>
                <p className="font-semibold mt-1">
                  ₹{(order.taxAmount ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-muted/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground uppercase font-bold">
                  Order Date
                </p>
                <p className="font-semibold mt-1">
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleString()
                    : "—"}
                </p>
              </div>
              {order.paymentId && (
                <div className="bg-muted/20 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground uppercase font-bold">
                    Payment ID
                  </p>
                  <button
                    onClick={onNavigatePayments}
                    className="text-primary hover:underline font-mono font-semibold mt-1 text-xs text-left"
                  >
                    {order.paymentId}
                  </button>
                </div>
              )}
              {order.shippingId && (
                <div className="bg-muted/20 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground uppercase font-bold">
                    Shipping ID
                  </p>
                  <button
                    onClick={onNavigateShipping}
                    className="text-primary hover:underline font-mono font-semibold mt-1 text-xs text-left"
                  >
                    {order.shippingId}
                  </button>
                </div>
              )}
            </div>

            {/* Tax breakdown */}
            {(order.cgstAmount > 0 ||
              order.sgstAmount > 0 ||
              order.igstAmount > 0) && (
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground mb-2">
                  Tax Breakdown
                </p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  {order.cgstAmount > 0 && (
                    <div className="bg-muted/20 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground uppercase font-bold">
                        CGST
                      </p>
                      <p className="font-semibold mt-1">
                        ₹{(order.cgstAmount ?? 0).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {order.sgstAmount > 0 && (
                    <div className="bg-muted/20 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground uppercase font-bold">
                        SGST
                      </p>
                      <p className="font-semibold mt-1">
                        ₹{(order.sgstAmount ?? 0).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {order.igstAmount > 0 && (
                    <div className="bg-muted/20 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground uppercase font-bold">
                        IGST
                      </p>
                      <p className="font-semibold mt-1">
                        ₹{(order.igstAmount ?? 0).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order items */}
            {order.items && order.items.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground mb-2">
                  Order Items
                </p>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Tax %</TableHead>
                        <TableHead className="text-right">Tax Amt</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map((item) => {
                        const subtotal = (item.price ?? 0) * item.quantity;
                        const taxRate = item.taxRate ?? 0;
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="text-xs">
                              {item.productName}
                            </TableCell>
                            <TableCell className="text-xs font-mono text-muted-foreground">
                              {item.sku ?? item.skuCode ?? "—"}
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              ₹{(item.price ?? 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              {(taxRate > 1 ? taxRate : taxRate * 100).toFixed(
                                taxRate > 1 ? 0 : 2,
                              )}
                              %
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              ₹{(item.taxAmount ?? 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-xs font-bold">
                              ₹{subtotal.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Packaging Box Assignments */}
            {order.packagingBoxAssignments &&
              order.packagingBoxAssignments.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground mb-2">
                    Packaging Boxes
                  </p>
                  <div className="space-y-3">
                    {order.packagingBoxAssignments.map((box, idx) => (
                      <div
                        key={box.id || idx}
                        className="border rounded-lg overflow-hidden"
                      >
                        <div className="bg-muted/30 px-3 py-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <span className="font-semibold text-sm">
                              {box.boxName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({box.boxLengthCm} × {box.boxBreadthCm} ×{" "}
                              {box.boxHeightCm} cm)
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Box {box.sequence}
                          </span>
                        </div>
                        {box.packedItems && box.packedItems.length > 0 && (
                          <Table>
                            <TableHeader className="bg-muted/10">
                              <TableRow>
                                <TableHead className="text-xs">
                                  Product
                                </TableHead>
                                <TableHead className="text-xs">SKU</TableHead>
                                <TableHead className="text-xs text-right">
                                  Qty
                                </TableHead>
                                <TableHead className="text-xs text-right">
                                  Dimensions (mm)
                                </TableHead>
                                <TableHead className="text-xs text-right">
                                  Weight (kg)
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {box.packedItems.map((item, itemIdx) => (
                                <TableRow key={itemIdx}>
                                  <TableCell className="text-xs">
                                    {item.productName || "—"}
                                  </TableCell>
                                  <TableCell className="text-xs font-mono text-muted-foreground">
                                    {item.sku || "—"}
                                  </TableCell>
                                  <TableCell className="text-xs text-right">
                                    {item.quantity ?? 1}
                                  </TableCell>
                                  <TableCell className="text-xs text-right">
                                    {item.itemLengthMm &&
                                    item.itemBreadthMm &&
                                    item.itemHeightMm
                                      ? `${item.itemLengthMm} × ${item.itemBreadthMm} × ${item.itemHeightMm}`
                                      : "—"}
                                  </TableCell>
                                  <TableCell className="text-xs text-right">
                                    {item.itemWeightKg?.toFixed(3) ?? "—"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                        {box.totalItemsWeightKg && (
                          <div className="px-3 py-1.5 text-xs text-muted-foreground bg-muted/10">
                            Total items weight:{" "}
                            {box.totalItemsWeightKg.toFixed(3)} kg
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Order timeline */}
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground mb-3">
                Timeline
              </p>
              <div className="relative flex items-start">
                {timeline.map((step, i) => (
                  <div
                    key={step.label}
                    className="flex-1 flex flex-col items-center relative"
                  >
                    {i < timeline.length - 1 && (
                      <div
                        className={cn(
                          "absolute top-2.5 left-1/2 w-full h-0.5",
                          step.done ? "bg-primary" : "bg-muted",
                        )}
                      />
                    )}
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center z-10 text-[8px]",
                        step.done
                          ? "bg-primary border-primary text-white"
                          : "bg-background border-border",
                      )}
                    >
                      {step.done ? "✓" : ""}
                    </div>
                    <p
                      className={cn(
                        "text-[9px] font-bold mt-1 text-center leading-tight",
                        step.done ? "text-primary" : "text-muted-foreground/50",
                      )}
                    >
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin notes */}
            {order.adminNotes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <p className="text-xs font-bold text-yellow-700 uppercase mb-1">
                  Admin Notes
                </p>
                <p className="text-xs text-yellow-800 whitespace-pre-wrap">
                  {order.adminNotes}
                </p>
              </div>
            )}

            {/* Customer order history */}
            {customerOrders.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground mb-2">
                  Other Orders by {order.customerName} ({customerOrders.length})
                </p>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/30">
                      <tr>
                        {["Order No.", "Date", "Status", "Total"].map((h) => (
                          <th
                            key={h}
                            className="text-left py-1.5 px-3 font-bold text-muted-foreground text-[10px] uppercase"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {customerOrders.slice(0, 5).map((o) => (
                        <tr key={o.id} className="hover:bg-muted/20">
                          <td className="py-1.5 px-3 font-mono font-bold">
                            {o.orderNumber}
                          </td>
                          <td className="py-1.5 px-3 text-muted-foreground">
                            {new Date(o.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-1.5 px-3">
                            <span
                              className={cn(
                                "px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase border",
                                STATUS_STYLES[o.status] ?? "",
                              )}
                            >
                              {o.status}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 font-bold">
                            ₹{(o.totalAmount ?? 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice preview dialog */}
      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent className="max-w-5xl p-0 flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
            <DialogTitle className="text-base font-semibold">
              Invoice Preview
            </DialogTitle>
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              disabled={pdfLoading}
              onClick={async () => {
                if (!invoiceRef.current) return;
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
                } catch {
                  toast.error("Could not generate invoice PDF.");
                } finally {
                  setPdfLoading(false);
                }
              }}
            >
              {pdfLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Download className="w-3 h-3" />
              )}
              Download PDF
            </Button>
          </div>
          <div className="overflow-auto flex-1">
            <div ref={invoiceRef}>
              <InvoicePreview order={order as unknown as OrderResponse} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  CONFIRMED: "bg-indigo-100 text-indigo-700 border-indigo-200",
  SHIPPED: "bg-blue-100 text-blue-700 border-blue-200",
  DELIVERED: "bg-green-100 text-green-700 border-green-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

const TIME_RANGES = [
  { label: "All time", days: null },
  { label: "Today", days: 1 },
  { label: "Last 3 days", days: 3 },
  { label: "Last 7 days", days: 7 },
  { label: "Last month", days: 30 },
  { label: "Last 3 months", days: 90 },
  { label: "Last year", days: 365 },
] as const;

const PAGE_SIZE = 20;

export const OrdersView: React.FC<ModuleProps & { initialViewOrderId?: string; onViewOrderConsumed?: () => void }> = ({ onNavigate, initialViewOrderId, onViewOrderConsumed }) => {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderResponse | null>(
    null,
  );
  const [viewOrder, setViewOrder] = useState<AdminOrderResponse | null>(null);

  React.useEffect(() => {
    if (!initialViewOrderId) return;
    adminOrderService.getOrderById(initialViewOrderId).then((order) => {
      setViewOrder(order);
      onViewOrderConsumed?.();
    }).catch(() => onViewOrderConsumed?.());
  }, [initialViewOrderId]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(0);
  };

  // Debounce search; reset page on any filter change
  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);
  React.useEffect(() => {
    setPage(0);
  }, [statusFilter, timeRange]);

  // Backend handles status / days / search filtering; returns full list
  const { data: allOrders = [], isLoading } = useQuery({
    queryKey: ["adminOrders", statusFilter, timeRange, debouncedSearch],
    queryFn: () =>
      adminOrderService.getAllOrders({
        status: statusFilter ?? undefined,
        days: timeRange ?? undefined,
        search: debouncedSearch || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  // Client-side sort on the already-filtered list
  const sorted = useMemo(() => {
    return [...allOrders].sort(
      (a: AdminOrderResponse, b: AdminOrderResponse) => {
        const aVal = a[sortField as keyof AdminOrderResponse] as
          | string
          | number
          | null;
        const bVal = b[sortField as keyof AdminOrderResponse] as
          | string
          | number
          | null;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const cmp =
          typeof aVal === "number" && typeof bVal === "number"
            ? aVal - bVal
            : String(aVal).localeCompare(String(bVal));
        return sortDir === "asc" ? cmp : -cmp;
      },
    );
  }, [allOrders, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const orders = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalElements = sorted.length;

  // Metrics from the full unfiltered list (always fetch all for metrics)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const metrics = useMemo(
    () => ({
      todayCount: allOrders.filter((o) => new Date(o.createdAt) >= todayStart)
        .length,
      pendingCount: allOrders.filter((o) => o.status === "PENDING").length,
      todayRevenue: allOrders
        .filter(
          (o) =>
            new Date(o.createdAt) >= todayStart && o.status !== "CANCELLED",
        )
        .reduce((s, o) => s + (o.totalAmount ?? 0), 0),
      returnsCount: allOrders.filter((o) => o.returnRequested).length,
    }),
    [allOrders],
  );

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleAll = () =>
    setSelectedIds((prev) =>
      prev.size === orders.length
        ? new Set()
        : new Set(orders.map((o) => o.id)),
    );

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    setIsBulkSaving(true);
    try {
      const res = await adminOrderService.bulkUpdateStatus(
        [...selectedIds],
        bulkStatus,
      );
      toast.success(
        `Updated ${res.updated} orders${res.failed > 0 ? `, ${res.failed} failed` : ""}`,
      );
      setSelectedIds(new Set());
      setBulkStatus("");
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Bulk update failed");
    } finally {
      setIsBulkSaving(false);
    }
  };

  const exportCSV = () => {
    const rows = sorted.map((o) => [
      o.orderNumber,
      o.customerName ?? "",
      o.status,
      new Date(o.createdAt).toLocaleDateString("en-IN"),
      o.totalAmount ?? 0,
      o.shippingFee ?? 0,
      o.paymentId ?? "",
      o.shippingId ?? "",
      o.returnRequested ? "Yes" : "No",
    ]);
    const header = [
      "Order No",
      "Customer",
      "Status",
      "Date",
      "Total",
      "Shipping Fee",
      "Payment ID",
      "Shipping ID",
      "Return Requested",
    ];
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <OrderEditDialog
        open={selectedOrder !== null}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
        order={selectedOrder}
        onSave={() => {
          queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
          queryClient.invalidateQueries({ queryKey: ["adminShipments"] });
        }}
      />
      <OrderViewDialog
        open={viewOrder !== null}
        onOpenChange={(open) => !open && setViewOrder(null)}
        order={viewOrder}
        allOrders={allOrders}
        onNavigatePayments={() => {
          onNavigate?.("payments");
          setViewOrder(null);
        }}
        onNavigateShipping={() => {
          onNavigate?.("shipping");
          setViewOrder(null);
        }}
        onRefresh={() =>
          queryClient.invalidateQueries({ queryKey: ["adminOrders"] })
        }
      />

      {/* ── Metrics bar ── */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {[
          {
            label: "Today's Orders",
            value: metrics.todayCount,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "Pending Payment",
            value: metrics.pendingCount,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Today's Revenue",
            value: `₹${metrics.todayRevenue.toLocaleString()}`,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Return Requests",
            value: metrics.returnsCount,
            color: "text-orange-600",
            bg: "bg-orange-50",
          },
        ].map((m) => (
          <div key={m.label} className={cn("rounded-2xl border-2 p-4", m.bg)}>
            <p className="text-xs font-bold uppercase text-muted-foreground">
              {m.label}
            </p>
            <p className={cn("text-2xl font-bold mt-1", m.color)}>{m.value}</p>
          </div>
        ))}
      </div>

      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            {/* Title row */}
            <div className="flex items-center justify-between">
              <CardTitle>Orders</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID or customer..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-9 w-56 text-sm"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 gap-1 text-xs"
                  onClick={exportCSV}
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </Button>
              </div>
            </div>

            {/* Filter row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setStatusFilter(null)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors",
                    statusFilter === null
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50",
                  )}
                >
                  All
                </button>
                {ORDER_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() =>
                      setStatusFilter(statusFilter === s ? null : s)
                    }
                    className={cn(
                      "px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors",
                      statusFilter === s
                        ? STATUS_STYLES[s]
                        : "bg-background text-muted-foreground border-border hover:border-primary/50",
                    )}
                  >
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="w-px h-5 bg-border" />

              {/* Time range chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {TIME_RANGES.map(({ label, days }) => (
                  <button
                    key={label}
                    onClick={() =>
                      setTimeRange(timeRange === days ? null : days)
                    }
                    className={cn(
                      "px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors",
                      timeRange === days
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-primary/50",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Result count */}
            <p className="text-xs text-muted-foreground">
              {isLoading
                ? "Loading..."
                : `${totalElements} order${totalElements !== 1 ? "s" : ""} found`}
              {(statusFilter || timeRange || search) && (
                <button
                  onClick={() => {
                    setStatusFilter(null);
                    setTimeRange(null);
                    setSearch("");
                  }}
                  className="ml-2 text-primary hover:underline"
                >
                  Clear filters
                </button>
              )}
            </p>
          </div>
        </CardHeader>

        <CardContent>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 mb-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
              <span className="text-xs font-bold text-primary">
                {selectedIds.size} selected
              </span>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue placeholder="Change status…" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-8 text-xs"
                disabled={!bulkStatus || isBulkSaving}
                onClick={handleBulkStatusUpdate}
              >
                {isBulkSaving ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : null}{" "}
                Apply
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-muted-foreground"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear
              </Button>
            </div>
          )}

          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-8 px-3">
                  <input
                    type="checkbox"
                    checked={
                      orders.length > 0 && selectedIds.size === orders.length
                    }
                    onChange={toggleAll}
                    className="cursor-pointer"
                  />
                </TableHead>
                <TableHead className="w-12 text-center">S.No</TableHead>
                {(["id", "createdAt", "status", "totalAmount"] as const).map(
                  (field) => {
                    const labels: Record<string, string> = {
                      id: "Order No.",
                      createdAt: "Date",
                      status: "Status",
                      totalAmount: "Total",
                    };
                    const active = sortField === field;
                    return (
                      <TableHead key={field}>
                        <button
                          onClick={() => handleSort(field)}
                          className="flex items-center gap-1 hover:text-primary transition-colors font-medium"
                        >
                          {labels[field]}
                          <span className="flex flex-col leading-none">
                            <ChevronUp
                              className={cn(
                                "w-2.5 h-2.5",
                                active && sortDir === "asc"
                                  ? "text-primary"
                                  : "text-muted-foreground/40",
                              )}
                            />
                            <ChevronDown
                              className={cn(
                                "w-2.5 h-2.5 -mt-0.5",
                                active && sortDir === "desc"
                                  ? "text-primary"
                                  : "text-muted-foreground/40",
                              )}
                            />
                          </span>
                        </button>
                      </TableHead>
                    );
                  },
                )}
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      Loading orders...
                    </div>
                  </TableCell>
                </TableRow>
              ) : !orders.length ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No orders match the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order: AdminOrderResponse, idx: number) => {
                  const isExpiring =
                    order.status === "PENDING" &&
                    order.expiresAt &&
                    new Date(order.expiresAt).getTime() - Date.now() <
                      30 * 60_000;
                  const hasReturn = order.returnRequested;
                  return (
                    <TableRow
                      key={order.id}
                      className={cn(
                        "hover:bg-muted/20",
                        isExpiring && "bg-amber-50/60",
                        hasReturn && "bg-orange-50/60",
                        selectedIds.has(order.id) && "bg-primary/5",
                      )}
                    >
                      <TableCell className="px-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(order.id)}
                          onChange={() => toggleSelect(order.id)}
                          className="cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground font-mono">
                        {page * PAGE_SIZE + idx + 1}
                      </TableCell>
                      <TableCell
                        className="font-mono font-bold text-xs"
                        title={order.id}
                      >
                        {order.orderNumber ??
                          order.id.split("-")[0].toUpperCase()}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-[10px] font-bold uppercase border",
                            STATUS_STYLES[order.status] ??
                              "bg-muted text-muted-foreground border-border",
                          )}
                        >
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold">
                        ₹{(order.totalAmount ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {order.customerName || "Guest User"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[10px] gap-1 border-primary/20 hover:bg-primary/10 hover:text-primary"
                            onClick={() => setViewOrder(order)}
                          >
                            <Eye className="w-3 h-3" /> View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[10px] gap-1 border-primary/20 hover:bg-primary/10 hover:text-primary"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Pencil className="w-3 h-3" /> Edit
                          </Button>
                          {/* Shiprocket push removed — tracking entered manually */}
                          {order.returnRequested && (
                            <span className="h-7 px-2 text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded flex items-center">
                              Return
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-2">
              <p className="text-xs text-muted-foreground">
                Showing {page * PAGE_SIZE + 1}–
                {Math.min((page + 1) * PAGE_SIZE, totalElements)} of{" "}
                {totalElements}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={page === 0}
                  onClick={() => setPage(0)}
                >
                  «
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                <span className="text-xs text-muted-foreground px-1">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={page === totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={page === totalPages - 1}
                  onClick={() => setPage(totalPages - 1)}
                >
                  »
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

const CART_PAGE_SIZE = 20;

export const AbandonedCartsView: React.FC<ModuleProps> = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState<
    "updatedAt" | "itemCount" | "cartValue"
  >("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data: carts = [] as AdminAbandonedCartResponse[], isLoading } =
    useQuery({
      queryKey: ["adminAbandonedCarts"],
      queryFn: () => adminCartService.getAbandonedCarts(),
    });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(0);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return carts;
    return carts.filter((c) =>
      [c.customerName, c.email, c.phone].some((v) =>
        v?.toLowerCase().includes(q),
      ),
    );
  }, [carts, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortField] ?? 0;
      const bVal = b[sortField] ?? 0;
      const cmp =
        typeof aVal === "number" && typeof bVal === "number"
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const totalElements = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / CART_PAGE_SIZE));
  const pageRows = sorted.slice(
    page * CART_PAGE_SIZE,
    (page + 1) * CART_PAGE_SIZE,
  );

  const metrics = useMemo(
    () => ({
      totalCarts: carts.length,
      totalValue: carts.reduce((s, c) => s + (c.cartValue ?? 0), 0),
      totalItems: carts.reduce((s, c) => s + (c.itemCount ?? 0), 0),
      idleOverWeek: carts.filter(
        (c) =>
          Date.now() - new Date(c.updatedAt).getTime() >
          7 * 24 * 60 * 60 * 1000,
      ).length,
    }),
    [carts],
  );

  const idleFor = (updatedAt: string) => {
    const ms = Date.now() - new Date(updatedAt).getTime();
    const hours = ms / (60 * 60 * 1000);
    if (hours < 1) return "< 1 hour";
    if (hours < 24) return `${Math.floor(hours)} hour${hours >= 2 ? "s" : ""}`;
    const days = Math.floor(hours / 24);
    return `${days} day${days >= 2 ? "s" : ""}`;
  };

  const exportCSV = () => {
    const rows = sorted.map((c) => [
      c.customerName ?? "",
      c.email ?? "",
      c.phone ?? "",
      c.distinctProducts,
      c.itemCount,
      c.cartValue,
      new Date(c.updatedAt).toLocaleString("en-IN"),
    ]);
    const header = [
      "Customer",
      "Email",
      "Phone",
      "Distinct Products",
      "Item Count",
      "Cart Value",
      "Last Updated",
    ];
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `abandoned-carts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sortableHeader = (
    field: typeof sortField,
    label: string,
    align: "left" | "right" = "left",
  ) => {
    const active = sortField === field;
    return (
      <TableHead className={align === "right" ? "text-right" : undefined}>
        <button
          onClick={() => handleSort(field)}
          className={cn(
            "flex items-center gap-1 hover:text-primary transition-colors font-medium",
            align === "right" && "justify-end w-full",
          )}
        >
          {label}
          <span className="flex flex-col leading-none">
            <ChevronUp
              className={cn(
                "w-2.5 h-2.5",
                active && sortDir === "asc"
                  ? "text-primary"
                  : "text-muted-foreground/40",
              )}
            />
            <ChevronDown
              className={cn(
                "w-2.5 h-2.5 -mt-0.5",
                active && sortDir === "desc"
                  ? "text-primary"
                  : "text-muted-foreground/40",
              )}
            />
          </span>
        </button>
      </TableHead>
    );
  };

  return (
    <>
      {/* ── Metrics bar ── */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {[
          {
            label: "Carts With Items",
            value: metrics.totalCarts,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "Value Stuck In Carts",
            value: `₹${metrics.totalValue.toLocaleString()}`,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Total Items",
            value: metrics.totalItems,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Idle Over 7 Days",
            value: metrics.idleOverWeek,
            color: "text-red-600",
            bg: "bg-red-50",
          },
        ].map((m) => (
          <div key={m.label} className={cn("rounded-2xl border-2 p-4", m.bg)}>
            <p className="text-xs font-bold uppercase text-muted-foreground">
              {m.label}
            </p>
            <p className={cn("text-2xl font-bold mt-1", m.color)}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Abandoned Carts</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by customer, email or phone..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  className="pl-8 h-9 w-64 text-sm"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-9 gap-1 text-xs"
                onClick={exportCSV}
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            {isLoading
              ? "Loading..."
              : `${totalElements} customer${totalElements !== 1 ? "s" : ""} with items still in cart`}
          </p>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-12 text-center">S.No</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                {sortableHeader("itemCount", "Items")}
                {sortableHeader("cartValue", "Cart Value")}
                {sortableHeader("updatedAt", "Last Updated")}
                <TableHead>Idle For</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      Loading abandoned carts...
                    </div>
                  </TableCell>
                </TableRow>
              ) : !pageRows.length ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No customers currently have items sitting in their cart.
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((cart, idx) => (
                  <TableRow key={cart.cartId} className="hover:bg-muted/20">
                    <TableCell className="text-center text-xs text-muted-foreground font-mono">
                      {page * CART_PAGE_SIZE + idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {cart.customerName || "Guest User"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div>{cart.email || "—"}</div>
                      {cart.phone && <div>{cart.phone}</div>}
                    </TableCell>
                    <TableCell>
                      <UiTooltip>
                        <UiTooltipTrigger asChild>
                          <span className="cursor-default underline decoration-dotted decoration-muted-foreground/50 underline-offset-2">
                            {cart.itemCount}{" "}
                            <span className="text-xs text-muted-foreground">
                              ({cart.distinctProducts} product
                              {cart.distinctProducts !== 1 ? "s" : ""})
                            </span>
                          </span>
                        </UiTooltipTrigger>
                        <UiTooltipContent
                          side="top"
                          className="max-w-xs p-0 overflow-hidden"
                        >
                          <div className="text-xs">
                            {cart.items.map((item, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "flex items-center justify-between gap-3 px-3 py-1.5",
                                  i > 0 && "border-t border-border/50",
                                )}
                              >
                                <span className="font-medium">
                                  {item.productName || item.sku || "Unknown product"}
                                </span>
                                <span className="text-muted-foreground whitespace-nowrap">
                                  x{item.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                        </UiTooltipContent>
                      </UiTooltip>
                    </TableCell>
                    <TableCell className="font-bold">
                      ₹{(cart.cartValue ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(cart.updatedAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-xs">
                      {idleFor(cart.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-2">
              <p className="text-xs text-muted-foreground">
                Showing {page * CART_PAGE_SIZE + 1}–
                {Math.min((page + 1) * CART_PAGE_SIZE, totalElements)} of{" "}
                {totalElements}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={page === 0}
                  onClick={() => setPage(0)}
                >
                  «
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                <span className="text-xs text-muted-foreground px-1">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={page === totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={page === totalPages - 1}
                  onClick={() => setPage(totalPages - 1)}
                >
                  »
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export const CustomersView = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<AdminCustomerResponse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Debounce search input
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: page, isLoading } = useQuery({
    queryKey: ["adminCustomers", debouncedSearch],
    queryFn: () => adminCustomerService.getCustomers(0, 100, debouncedSearch),
  });

  const { data: customerDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["adminCustomer", selectedCustomer?.id],
    queryFn: () => adminCustomerService.getCustomer(selectedCustomer!.id),
    enabled: !!selectedCustomer && detailOpen,
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      adminCustomerService.setActive(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCustomers"] });
      toast.success("Customer status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const customers = page?.content ?? [];

  const statusBadge = (active: boolean) => (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
        active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );

  return (
    <>
      {/* Customer Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Customer Profile</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : customerDetail ? (
            <div className="space-y-4 text-sm">
              {/* Identity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Name
                  </p>
                  <p className="font-medium">
                    {[customerDetail.firstName, customerDetail.lastName]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Status
                  </p>
                  {statusBadge(customerDetail.isActive)}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email
                  </p>
                  <p className="break-all">{customerDetail.email}</p>
                  {customerDetail.emailVerified && (
                    <span className="text-[10px] text-green-600 font-medium">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Phone
                  </p>
                  <p>{customerDetail.phone || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Package className="w-3 h-3" /> Orders
                  </p>
                  <p className="font-bold text-primary">
                    {customerDetail.orderCount}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Joined
                  </p>
                  <p>
                    {customerDetail.createdAt
                      ? new Date(customerDetail.createdAt).toLocaleDateString(
                          "en-IN",
                        )
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Addresses */}
              {customerDetail.addresses &&
                customerDetail.addresses.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Saved Addresses
                    </p>
                    <div className="space-y-2">
                      {customerDetail.addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className="border rounded-md p-3 bg-muted/20 text-xs space-y-0.5"
                        >
                          <p className="font-medium flex items-center gap-1">
                            {addr.label || addr.addressType || "Address"}
                            {addr.isDefault && (
                              <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[9px] font-bold">
                                Default
                              </span>
                            )}
                          </p>
                          <p>
                            {addr.addressLine1}
                            {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                          </p>
                          <p>
                            {addr.city}, {addr.state} — {addr.postalCode}
                          </p>
                          {addr.landmark && (
                            <p className="text-muted-foreground">
                              Near: {addr.landmark}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant={customerDetail.isActive ? "destructive" : "default"}
                  className="h-8 text-xs"
                  disabled={toggleActive.isPending}
                  onClick={() =>
                    toggleActive.mutate({
                      id: customerDetail.id,
                      active: !customerDetail.isActive,
                    })
                  }
                >
                  {toggleActive.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : null}
                  {customerDetail.isActive
                    ? "Deactivate Account"
                    : "Activate Account"}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Customer Table */}
      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Customer Database</CardTitle>
            {page && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {page.totalElements} registered customer
                {page.totalElements !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 w-56 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-10 text-center">S.No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <div className="flex items-center justify-center text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Loading customers...
                    </div>
                  </TableCell>
                </TableRow>
              ) : !customers.length ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-10 text-muted-foreground"
                  >
                    {debouncedSearch
                      ? `No customers matching "${debouncedSearch}"`
                      : "No customers yet."}
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c, idx) => (
                  <TableRow key={c.id} className="hover:bg-muted/20">
                    <TableCell className="text-center text-xs text-muted-foreground font-mono">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {[c.firstName, c.lastName].filter(Boolean).join(" ") ||
                        "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        {c.email}
                        {c.emailVerified && (
                          <span
                            className="text-green-500 text-[10px]"
                            title="Verified"
                          >
                            ✓
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.phone || "—"}
                    </TableCell>
                    <TableCell className="text-center font-bold text-sm">
                      {c.orderCount}
                    </TableCell>
                    <TableCell className="text-center">
                      {statusBadge(c.isActive)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString("en-IN")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[10px] gap-1 border-primary/20 hover:bg-primary/10 hover:text-primary"
                          onClick={() => {
                            setSelectedCustomer(c);
                            setDetailOpen(true);
                          }}
                        >
                          <Eye className="w-3 h-3" /> View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-7 px-2 text-[10px] gap-1",
                            c.isActive
                              ? "border-red-200 hover:bg-red-50 hover:text-red-600"
                              : "border-green-200 hover:bg-green-50 hover:text-green-600",
                          )}
                          disabled={toggleActive.isPending}
                          onClick={() =>
                            toggleActive.mutate({
                              id: c.id,
                              active: !c.isActive,
                            })
                          }
                        >
                          <Shield className="w-3 h-3" />
                          {c.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
};

interface SellerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seller?: Seller | null;
  onSave: (
    seller: Partial<Seller> & {
      firstName?: string;
      lastName?: string;
      email?: string;
    },
  ) => void;
}

export const SellerDialog: React.FC<SellerDialogProps> = ({
  open,
  onOpenChange,
  seller,
  onSave,
}) => {
  const [formData, setFormData] = useState<
    Partial<Seller> & { firstName?: string; lastName?: string; email?: string }
  >({
    businessName: "",
    gstin: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
    isActive: true,
    firstName: "",
    lastName: "",
    email: "",
    imageUrl: "",
    description: "",
    activity: "",
    memberCount: 0,
    city: "",
    state: "",
    isVerified: false,
    tagline: "",
    organizationType: "",
    incorporationDate: "",
    boardMembersCount: undefined,
    vision: "",
    commitment: "",
    closingStatement: "",
  });
  const [activitiesText, setActivitiesText] = useState("");
  const [missionPointsText, setMissionPointsText] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (seller) {
      setFormData({
        ...seller,
        isActive: seller.isActive ?? true,
        isVerified: seller.isVerified ?? false,
      });
      setActivitiesText((seller.activities || []).join("\n"));
      setMissionPointsText((seller.missionPoints || []).join("\n"));
    } else {
      setFormData({
        businessName: "",
        gstin: "",
        address: "",
        contactEmail: "",
        contactPhone: "",
        isActive: true,
        firstName: "",
        lastName: "",
        email: "",
        imageUrl: "",
        description: "",
        activity: "",
        memberCount: 0,
        city: "",
        state: "",
        isVerified: false,
        tagline: "",
        organizationType: "",
        incorporationDate: "",
        boardMembersCount: undefined,
        vision: "",
        commitment: "",
        closingStatement: "",
      });
      setActivitiesText("");
      setMissionPointsText("");
    }
  }, [seller, open]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const publicUrl = await mediaService.uploadFile("sellers", file);
      setFormData((prev) => ({ ...prev, imageUrl: publicUrl }));
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold text-forest flex items-center gap-2">
            <Store className="w-6 h-6 text-primary" />
            {seller ? "Edit Seller" : "Add New Seller"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                First Name
              </label>
              <Input
                placeholder="John"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="rounded-xl border-2 focus-visible:ring-primary/20 h-11"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                Last Name
              </label>
              <Input
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="rounded-xl border-2 focus-visible:ring-primary/20 h-11"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
              Account Email
            </label>
            <Input
              placeholder="john.doe@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="rounded-xl border-2 focus-visible:ring-primary/20 h-11"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
              Business Name
            </label>
            <Input
              placeholder="e.g. Six Yards Love Traditional Weaves"
              value={formData.businessName}
              onChange={(e) =>
                setFormData({ ...formData, businessName: e.target.value })
              }
              className="rounded-xl border-2 focus-visible:ring-primary/20 h-11"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                GSTIN
              </label>
              <Input
                placeholder="27XXXXX..."
                value={formData.gstin}
                onChange={(e) =>
                  setFormData({ ...formData, gstin: e.target.value })
                }
                className="rounded-xl border-2 focus-visible:ring-primary/20 h-11"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                Contact Phone
              </label>
              <Input
                placeholder="+91..."
                value={formData.contactPhone}
                onChange={(e) =>
                  setFormData({ ...formData, contactPhone: e.target.value })
                }
                className="rounded-xl border-2 focus-visible:ring-primary/20 h-11"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
              Contact Email
            </label>
            <Input
              placeholder="seller@example.com"
              value={formData.contactEmail}
              onChange={(e) =>
                setFormData({ ...formData, contactEmail: e.target.value })
              }
              className="rounded-xl border-2 focus-visible:ring-primary/20 h-11"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
              Profile Image
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-2xl bg-muted border-2 border-dashed flex items-center justify-center overflow-hidden">
                {formData.imageUrl ? (
                  <>
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: "" })}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                )}
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-10 border-2"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload Image
                </Button>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest pl-1 font-bold">
                  PNG, JPG, WebP (Max 5MB)
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
              Description
            </label>
            <Textarea
              placeholder="Tell us about this seller..."
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="rounded-xl border-2 focus-visible:ring-primary/20 min-h-[100px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                Activity / Category
              </label>
              <Input
                placeholder="e.g. Organic Farming"
                value={formData.activity || ""}
                onChange={(e) =>
                  setFormData({ ...formData, activity: e.target.value })
                }
                className="rounded-xl border-2 focus-visible:ring-primary/20 h-11"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                Member Count
              </label>
              <Input
                type="number"
                placeholder="0"
                value={formData.memberCount || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    memberCount: parseInt(e.target.value) || 0,
                  })
                }
                className="rounded-xl border-2 focus-visible:ring-primary/20 h-11"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                City
              </label>
              <Input
                placeholder="e.g. Pune"
                value={formData.city || ""}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                autoComplete="off"
                name="seller-city"
                className="rounded-xl border-2 focus-visible:ring-primary/20 h-11"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                State
              </label>
              <Input
                placeholder="e.g. Maharashtra"
                value={formData.state || ""}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                className="rounded-xl border-2 focus-visible:ring-primary/20 h-11"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 items-center">
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="isVerified"
                checked={formData.isVerified}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isVerified: !!checked })
                }
                className="rounded-md h-5 w-5"
              />
              <label
                htmlFor="isVerified"
                className="text-sm font-bold text-forest cursor-pointer"
              >
                Mark as Verified
              </label>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: !!checked })
                }
                className="rounded-md h-5 w-5"
              />
              <label
                htmlFor="isActive"
                className="text-sm font-bold text-forest cursor-pointer"
              >
                Account Active
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl h-11 px-6 font-bold"
          >
            Cancel
          </Button>
          <Button
            onClick={() =>
              onSave({
                ...formData,
                activities: activitiesText
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
                missionPoints: missionPointsText
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            className="rounded-xl h-11 px-8 font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
          >
            {seller ? "Update Seller" : "Create Seller"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface SellersViewProps {
  sellers: Seller[];
  onAdd: () => void;
  onEdit: (seller: Seller) => void;
  onDelete: (id: string) => void;
}

export const SellersView: React.FC<SellersViewProps> = ({
  sellers,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [filter, setFilter] = useState("");
  const filtered = sellers.filter((s) => {
    const q = filter.toLowerCase();
    return (
      s.businessName.toLowerCase().includes(q) ||
      (s.contactEmail ?? "").toLowerCase().includes(q) ||
      (s.gstin ?? "").toLowerCase().includes(q)
    );
  });
  return (
    <Card className="border-2 shadow-sm rounded-2xl overflow-hidden mt-6">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 pb-6">
        <div>
          <CardTitle className="text-xl font-display font-bold text-forest">
            Sellers Database
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Manage sellers and their business profiles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter sellers..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-8 h-9 w-48 text-sm"
            />
          </div>
          <Button
            onClick={onAdd}
            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl px-6 h-10 gap-2"
          >
            <Plus className="w-4 h-4" /> Add Seller
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-12 text-center pl-4">S.No</TableHead>
              <TableHead className="pl-4">Business Details</TableHead>
              <TableHead>GSTIN</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Store className="w-10 h-10 opacity-20" />
                    <p>No sellers registered yet.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((seller, idx) => (
                <TableRow key={seller.id} className="hover:bg-muted/10 group">
                  <TableCell className="text-center text-xs text-muted-foreground font-mono pl-4">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="pl-4 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-forest">
                        {seller.businessName}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {seller.id}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs uppercase tracking-tighter">
                    {seller.gstin || "N/A"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3 opacity-50" />{" "}
                        {seller.contactEmail}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3 opacity-50" />{" "}
                        {seller.contactPhone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        seller.isActive
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-red-100 text-red-700 border border-red-200",
                      )}
                    >
                      {seller.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(seller)}
                        className="h-8 rounded-lg border-2 hover:bg-primary/10 hover:text-primary gap-1"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(seller.id)}
                        className="h-8 w-8 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export const InventoryView: React.FC<InventoryViewProps> = ({
  onNavigate,
  inventory,
  metadata,
  onPageChange,
  onSync,
  onAdjust,
}) => {
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [filter, setFilter] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleAdjustClick = (item: any) => {
    setSelectedItem(item);
    setIsAdjustOpen(true);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filtered = inventory.filter((item) => {
    const q = filter.toLowerCase();
    return (
      (item.productName ?? "").toLowerCase().includes(q) ||
      (item.sku ?? "").toLowerCase().includes(q) ||
      (item.status ?? "").toLowerCase().includes(q)
    );
  });

  const sorted = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortField as keyof typeof a];
      const bVal = b[sortField as keyof typeof b];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDirection]);

  return (
    <Card className="border-2 shadow-sm rounded-2xl overflow-hidden mt-6">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between border-b bg-muted/20 pb-6">
        <div>
          <CardTitle className="text-xl font-display font-bold text-forest">
            Stock & Inventory
          </CardTitle>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted-foreground tracking-tight">
              Real-time inventory levels across all product variants.
            </p>
            {metadata && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 h-4 bg-muted/50 border-none font-medium text-muted-foreground uppercase tracking-widest"
              >
                {metadata.totalElements} Variations
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter inventory..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-8 h-9 w-48 text-sm"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onSync}
            className="rounded-xl border-2 hover:bg-primary/5 hover:text-primary gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Sync Products
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-12 text-center pl-4 text-xs">
                <button
                  onClick={() => handleSort("productVariantId")}
                  className="flex items-center gap-1 cursor-pointer hover:text-primary"
                >
                  S.No
                  {sortField === "productVariantId" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    ))}
                </button>
              </TableHead>
              <TableHead className="pl-4 text-xs">
                <button
                  onClick={() => handleSort("productName")}
                  className="flex items-center gap-1 cursor-pointer hover:text-primary"
                >
                  Product Details
                  {sortField === "productName" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    ))}
                </button>
              </TableHead>
              <TableHead className="text-xs">
                <button
                  onClick={() => handleSort("sku")}
                  className="flex items-center gap-1 cursor-pointer hover:text-primary"
                >
                  SKU Code
                  {sortField === "sku" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    ))}
                </button>
              </TableHead>
              <TableHead className="text-xs">
                <button
                  onClick={() => handleSort("unit")}
                  className="flex items-center gap-1 cursor-pointer hover:text-primary"
                >
                  Packing/Unit
                  {sortField === "unit" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    ))}
                </button>
              </TableHead>
              <TableHead className="text-xs">
                <button
                  onClick={() => handleSort("stockLevel")}
                  className="flex items-center gap-1 cursor-pointer hover:text-primary"
                >
                  Stock Level
                  {sortField === "stockLevel" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    ))}
                </button>
              </TableHead>
              <TableHead className="text-xs">
                <button
                  onClick={() => handleSort("status")}
                  className="flex items-center gap-1 cursor-pointer hover:text-primary"
                >
                  Status
                  {sortField === "status" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    ))}
                </button>
              </TableHead>
              <TableHead className="text-xs">
                <button
                  onClick={() => handleSort("location")}
                  className="flex items-center gap-1 cursor-pointer hover:text-primary"
                >
                  Location
                  {sortField === "location" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    ))}
                </button>
              </TableHead>
              <TableHead className="text-right pr-6 text-xs">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <AlertCircle className="w-10 h-10 opacity-20" />
                    <p>No inventory records found. Click Sync to initialize.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((item, idx) => (
                <TableRow
                  key={item.productVariantId}
                  className="hover:bg-muted/10 group"
                >
                  <TableCell className="text-center text-xs text-muted-foreground font-mono pl-4">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="pl-4 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-sm text-foreground">
                        {item.productName}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
                        {item.productCode}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-primary">
                    {item.sku}
                  </TableCell>
                  <TableCell>
                    {item.unit ? (
                      <Badge
                        variant="secondary"
                        className="font-bold text-[10px] px-1.5 py-0 rounded-md bg-muted/50 border-0"
                      >
                        {item.unit}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        -
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "text-base font-bold",
                        item.stockLevel <= 10
                          ? "text-red-600"
                          : item.stockLevel <= 100
                            ? "text-amber-600"
                            : "text-green-600",
                      )}
                    >
                      {item.stockLevel}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          item.status === "In Stock"
                            ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                            : item.status === "Low Stock"
                              ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                              : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]",
                        )}
                      />
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        {item.status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.location || "Central Warehouse"}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg border-2 hover:bg-primary/10 hover:text-primary gap-1"
                        onClick={() => handleAdjustClick(item)}
                      >
                        <Plus className="w-3.5 h-3.5" /> Adjust
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg hover:text-primary"
                        onClick={() => onNavigate?.("products")}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {metadata && metadata.totalPages > 1 && (
        <CardFooter className="flex items-center justify-between border-t bg-muted/10 py-3 px-6">
          <div className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-bold">
              {metadata.number * metadata.size + 1}
            </span>{" "}
            to{" "}
            <span className="font-bold">
              {Math.min(
                (metadata.number + 1) * metadata.size,
                metadata.totalElements,
              )}
            </span>{" "}
            of <span className="font-bold">{metadata.totalElements}</span> items
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={metadata.number === 0}
              onClick={() => onPageChange?.(metadata.number - 1)}
              className="rounded-lg h-8 px-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1 text-xs font-medium">
              {Array.from({ length: metadata.totalPages }, (_, i) => (
                <Button
                  key={i}
                  variant={metadata.number === i ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange?.(i)}
                  className={cn(
                    "h-8 w-8 rounded-lg p-0",
                    metadata.number === i ? "bg-primary text-white" : "",
                  )}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={metadata.number === metadata.totalPages - 1}
              onClick={() => onPageChange?.(metadata.number + 1)}
              className="rounded-lg h-8 px-2"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardFooter>
      )}

      <StockAdjustmentDialog
        open={isAdjustOpen}
        onOpenChange={setIsAdjustOpen}
        item={selectedItem}
        onSave={(change, reason) =>
          selectedItem &&
          onAdjust(selectedItem.productVariantId, change, reason)
        }
      />
    </Card>
  );
};

// ─── Payments: Detail Dialog ────────────────────────────────────────────────
const PaymentDetailDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: AdminPaymentResponse | null;
  onNavigateOrder: () => void;
}> = ({ open, onOpenChange, payment, onNavigateOrder }) => {
  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold">
            Payment Details
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-muted/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground uppercase font-bold">
              Payment ID
            </p>
            <p className="font-mono font-semibold mt-1 text-xs">{payment.id}</p>
          </div>
          <div className="bg-muted/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground uppercase font-bold">
              Order
            </p>
            <button
              onClick={onNavigateOrder}
              className="text-primary hover:underline font-mono font-semibold mt-1 text-xs text-left"
              title={payment.orderId}
            >
              {payment.orderId}
            </button>
          </div>
          <div className="bg-muted/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground uppercase font-bold">
              Provider
            </p>
            <p className="font-semibold mt-1">{payment.provider ?? "—"}</p>
          </div>
          <div className="bg-muted/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground uppercase font-bold">
              Method
            </p>
            <p className="font-semibold mt-1 uppercase">
              {payment.method ?? "—"}
            </p>
          </div>
          <div className="bg-muted/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground uppercase font-bold">
              Amount
            </p>
            <p className="font-bold mt-1">
              ₹{(payment.amount ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-muted/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground uppercase font-bold">
              Status
            </p>
            <span
              className={cn(
                "inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                payment.status === "CAPTURED" || payment.status === "SUCCESS"
                  ? "bg-green-100 text-green-700"
                  : payment.status === "FAILED"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700",
              )}
            >
              {payment.status}
            </span>
          </div>
          {payment.providerOrderId && (
            <div className="bg-muted/20 rounded-lg p-3">
              <p className="text-xs text-muted-foreground uppercase font-bold">
                Provider Order ID
              </p>
              <p className="font-mono font-semibold mt-1 text-xs">
                {payment.providerOrderId}
              </p>
            </div>
          )}
          {payment.providerPaymentId && (
            <div className="bg-muted/20 rounded-lg p-3">
              <p className="text-xs text-muted-foreground uppercase font-bold">
                Provider Payment ID
              </p>
              <p className="font-mono font-semibold mt-1 text-xs">
                {payment.providerPaymentId}
              </p>
            </div>
          )}
          {payment.failureReason && (
            <div className="bg-red-50 rounded-lg p-3 col-span-2">
              <p className="text-xs text-red-400 uppercase font-bold">
                Failure Reason
              </p>
              <p className="font-semibold mt-1 text-red-700">
                {payment.failureReason}
              </p>
            </div>
          )}
          {payment.paidAt && (
            <div className="bg-muted/20 rounded-lg p-3">
              <p className="text-xs text-muted-foreground uppercase font-bold">
                Paid At
              </p>
              <p className="font-semibold mt-1">
                {payment.paidAt
                  ? new Date(payment.paidAt).toLocaleString()
                  : "—"}
              </p>
            </div>
          )}
          <div className="bg-muted/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground uppercase font-bold">
              Created At
            </p>
            <p className="font-semibold mt-1">
              {payment.createdAt
                ? new Date(payment.createdAt).toLocaleString()
                : "—"}
            </p>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const PaymentsView: React.FC<ModuleProps> = ({ onNavigate }) => {
  const [filter, setFilter] = useState("");
  const [selectedPayment, setSelectedPayment] =
    useState<AdminPaymentResponse | null>(null);
  const queryClient = useQueryClient();

  const { data: paymentsPage, isLoading } = useQuery({
    queryKey: ["adminPayments"],
    queryFn: () => adminPaymentService.getAllPayments(0, 50),
  });

  const reconcileMutation = useMutation({
    mutationFn: adminPaymentService.triggerReconciliation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPayments"] });
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      toast.success("Reconciliation complete — payment and order statuses refreshed.");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Reconciliation failed. Please try again.");
    },
  });

  const filtered = (paymentsPage?.content ?? []).filter(
    (pay: AdminPaymentResponse) => {
      const q = filter.toLowerCase();
      return (
        pay.id.toLowerCase().includes(q) ||
        pay.orderId.toLowerCase().includes(q) ||
        (pay.method ?? "").toLowerCase().includes(q) ||
        (pay.status ?? "").toLowerCase().includes(q)
      );
    },
  );

  return (
    <>
      <PaymentDetailDialog
        open={selectedPayment !== null}
        onOpenChange={(open) => !open && setSelectedPayment(null)}
        payment={selectedPayment}
        onNavigateOrder={() => {
          onNavigate?.("orders", selectedPayment?.orderId);
          setSelectedPayment(null);
        }}
      />
      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transactions & Payments</CardTitle>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 border-primary/30 hover:bg-primary/10 hover:text-primary text-xs font-semibold"
              onClick={() => reconcileMutation.mutate()}
              disabled={reconcileMutation.isPending}
              title="Sync payment and order statuses against Razorpay"
            >
              {reconcileMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              {reconcileMutation.isPending ? "Syncing…" : "Sync with Razorpay"}
            </Button>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter payments..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-8 h-9 w-48 text-sm"
              />
            </div>
            <CreditCard className="w-5 h-5 text-primary/40" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-12 text-center">S.No</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount (INR)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      Loading payments...
                    </div>
                  </TableCell>
                </TableRow>
              ) : !filtered.length ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No transaction records found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((pay: AdminPaymentResponse, idx: number) => (
                  <TableRow key={pay.id} className="hover:bg-muted/20">
                    <TableCell className="text-center text-xs text-muted-foreground font-mono">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-mono text-[10px]" title={pay.id}>
                      {pay.id.split("-")[0]}...
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => onNavigate?.("orders", pay.orderId)}
                        className="hover:underline text-primary font-bold text-[10px]"
                        title={pay.orderId}
                      >
                        {pay.orderId.split("-")[0]}...
                      </button>
                    </TableCell>
                    <TableCell className="text-xs uppercase">
                      {pay.method}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                          pay.status === "CAPTURED" || pay.status === "SUCCESS"
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {pay.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ₹{(pay.amount ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-[10px] gap-1 border-primary/20 hover:bg-primary/10 hover:text-primary"
                        onClick={() => setSelectedPayment(pay)}
                      >
                        <Eye className="w-3 h-3" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
};

// ─── Shipping: Detail Dialog ────────────────────────────────────────────────
const ShippingDetailDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: AdminShipmentResponse | null;
  onNavigateOrder: () => void;
}> = ({ open, onOpenChange, shipment, onNavigateOrder }) => {
  if (!shipment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold">
            Shipping Details
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-muted/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground uppercase font-bold">
              Shipment ID
            </p>
            <p className="font-mono font-semibold mt-1 text-xs">
              {shipment.id}
            </p>
          </div>
          <div className="bg-muted/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground uppercase font-bold">
              Order
            </p>
            <button
              onClick={onNavigateOrder}
              className="text-primary hover:underline font-mono font-semibold mt-1 text-xs text-left"
              title={shipment.orderId}
            >
              {shipment.orderId}
            </button>
          </div>
          <div className="bg-muted/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground uppercase font-bold">
              Carrier
            </p>
            <p className="font-semibold mt-1">{shipment.carrier || "—"}</p>
          </div>
          <div className="bg-muted/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground uppercase font-bold">
              Tracking Number
            </p>
            <p className="font-mono font-semibold mt-1 text-xs">
              {shipment.trackingNumber || "PENDING"}
            </p>
          </div>
          <div className="bg-muted/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground uppercase font-bold">
              Status
            </p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-muted">
              {shipment.status}
            </span>
          </div>
          {shipment.estimatedDelivery && (
            <div className="bg-muted/20 rounded-lg p-3">
              <p className="text-xs text-muted-foreground uppercase font-bold">
                Est. Delivery
              </p>
              <p className="font-semibold mt-1">
                {shipment.estimatedDelivery
                  ? new Date(shipment.estimatedDelivery).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          )}
          {(shipment as any).trackingUrl && (
            <div className="bg-muted/20 rounded-lg p-3 col-span-2">
              <p className="text-xs text-muted-foreground uppercase font-bold">
                Tracking URL
              </p>
              <a
                href={(shipment as any).trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline text-xs font-semibold mt-1 block truncate"
              >
                {(shipment as any).trackingUrl}
              </a>
            </div>
          )}
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Shiprocket: Track Dialog ─────────────────────────────────────────────────
const TrackOrderDialog: React.FC<{
  awb: string;
  open: boolean;
  onClose: () => void;
}> = ({ awb, open, onClose }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["shiprocketTrack", awb],
    queryFn: () => adminShiprocketService.trackOrder(awb),
    enabled: open && !!awb,
  });

  const track = data?.trackingData?.shipmentTrack?.[0] as
    | ShipmentTrack
    | undefined;
  const activities = (data?.trackingData?.shipmentTrackActivities ??
    []) as TrackActivity[];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Track Shipment — {awb}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
          </div>
        ) : !track ? (
          <p className="text-center text-muted-foreground py-6">
            No tracking data found.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground uppercase font-bold">
                  Status
                </p>
                <p className="font-semibold mt-1">
                  {track.currentStatus ?? "—"}
                </p>
              </div>
              <div className="bg-muted/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground uppercase font-bold">
                  Courier
                </p>
                <p className="font-semibold mt-1">{track.courierName ?? "—"}</p>
              </div>
              <div className="bg-muted/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground uppercase font-bold">
                  ETD
                </p>
                <p className="font-semibold mt-1">{track.etd ?? "—"}</p>
              </div>
              <div className="bg-muted/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground uppercase font-bold">
                  Delivered
                </p>
                <p className="font-semibold mt-1">
                  {track.deliveredDate ?? "—"}
                </p>
              </div>
            </div>
            {activities.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground mb-2">
                  Activity Log
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {activities.map((a, i) => (
                    <div
                      key={i}
                      className="flex gap-3 text-sm border-b pb-2 last:border-0"
                    >
                      <div className="w-32 shrink-0 text-xs text-muted-foreground">
                        {a.date}
                      </div>
                      <div>
                        <p className="font-medium">{a.activity}</p>
                        {a.location && (
                          <p className="text-xs text-muted-foreground">
                            {a.location}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Shiprocket: Rate Calculator Dialog ───────────────────────────────────────
const RateCalculatorDialog: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const [pickupPin, setPickupPin] = useState("");
  const [deliveryPin, setDeliveryPin] = useState("");
  const [weight, setWeight] = useState("0.5");
  const [cod, setCod] = useState("0");
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["shiprocketRates", pickupPin, deliveryPin, weight, cod],
    queryFn: () =>
      adminShiprocketService.getShippingRates(
        pickupPin,
        deliveryPin,
        parseFloat(weight),
        parseInt(cod),
      ),
    enabled: false,
  });

  const handleSearch = () => {
    setSubmitted(true);
    refetch();
  };

  const options = (data?.data?.availableCourierCompanies ??
    []) as CourierOption[];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Shipping Rate Calculator</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Pickup Pincode
            </label>
            <Input
              value={pickupPin}
              onChange={(e) => setPickupPin(e.target.value)}
              placeholder="e.g. 400001"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Delivery Pincode
            </label>
            <Input
              value={deliveryPin}
              onChange={(e) => setDeliveryPin(e.target.value)}
              placeholder="e.g. 560001"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Weight (kg)
            </label>
            <Input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              min="0.1"
              step="0.1"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">
              COD
            </label>
            <Select value={cod} onValueChange={setCod}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No (Prepaid)</SelectItem>
                <SelectItem value="1">Yes (COD)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          onClick={handleSearch}
          disabled={!pickupPin || !deliveryPin || isLoading}
          className="mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Fetching...
            </>
          ) : (
            "Get Rates"
          )}
        </Button>
        {submitted && !isLoading && (
          <div className="mt-4">
            {options.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No couriers available for this route.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Courier</TableHead>
                    <TableHead>Rate (₹)</TableHead>
                    <TableHead>ETD</TableHead>
                    <TableHead>COD Charges</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {options.map((opt) => (
                    <TableRow key={opt.courierCompanyId}>
                      <TableCell className="font-medium">
                        {opt.courierName}
                      </TableCell>
                      <TableCell>₹{(opt.rate ?? 0).toFixed(2)}</TableCell>
                      <TableCell>{opt.etd ?? "—"}</TableCell>
                      <TableCell>
                        {opt.codCharges ? `₹${opt.codCharges}` : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Shiprocket: Pickup Addresses Dialog ──────────────────────────────────────
const PickupAddressesDialog: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["shiprocketPickupAddresses"],
    queryFn: () => adminShiprocketService.listPickupAddresses(),
    enabled: open,
  });

  const addresses = (data?.data?.shippingAddress ?? []) as PickupAddress[];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pickup Addresses</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
          </div>
        ) : addresses.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            No pickup addresses configured.
          </p>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr.id} className="border rounded-lg p-4 bg-muted/10">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{addr.name}</p>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wide mt-0.5">
                      {addr.pickupLocation}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-semibold",
                      addr.status === 1
                        ? "bg-green-100 text-green-700"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {addr.status === 1 ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-sm mt-2">
                  {addr.address}
                  {addr.address2 ? `, ${addr.address2}` : ""}
                </p>
                <p className="text-sm">
                  {addr.city}, {addr.state} — {addr.pinCode}
                </p>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  {addr.phone && <span>📞 {addr.phone}</span>}
                  {addr.email && <span>✉ {addr.email}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── AssignCourierDialog ───────────────────────────────────────────────────────
const AssignCourierDialog: React.FC<{
  shipment: AdminShipmentResponse;
  open: boolean;
  onClose: () => void;
  onAssign: (courierId: number) => void;
  loading: boolean;
}> = ({ shipment, open, onClose, onAssign, loading }) => {
  const [pickupPostcode, setPickupPostcode] = useState("");
  const [deliveryPostcode, setDeliveryPostcode] = useState("");
  const [weight, setWeight] = useState("0.5");
  const [selectedCourierId, setSelectedCourierId] = useState<number | null>(
    null,
  );

  const {
    data: rates,
    isLoading: ratesLoading,
    refetch,
  } = useQuery({
    queryKey: ["srRates", pickupPostcode, deliveryPostcode, weight],
    queryFn: () =>
      adminShiprocketService.getShippingRates(
        pickupPostcode,
        deliveryPostcode,
        parseFloat(weight),
      ),
    enabled: false,
  });

  const couriers =
    (rates as any)?.data?.available_courier_companies ??
    (rates as any)?.data?.availableCourierCompanies ??
    [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Assign Courier — Shipment {shipment.shiprocketShipmentId}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Pickup Pincode
              </label>
              <Input
                value={pickupPostcode}
                onChange={(e) => setPickupPostcode(e.target.value)}
                placeholder="e.g. 400001"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Delivery Pincode
              </label>
              <Input
                value={deliveryPostcode}
                onChange={(e) => setDeliveryPostcode(e.target.value)}
                placeholder="e.g. 110001"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Weight (kg)
              </label>
              <Input
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 0.5"
                type="number"
                step="0.1"
                min="0.1"
              />
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={!pickupPostcode || !deliveryPostcode}
          >
            {ratesLoading ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
            ) : null}
            Fetch Available Couriers
          </Button>

          {couriers.length > 0 && (
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/40">
                  <tr>
                    {["Select", "Courier", "Rate", "ETD", "Rating"].map((h) => (
                      <th
                        key={h}
                        className="text-left py-2 px-3 font-bold text-[10px] uppercase text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {couriers
                    .filter((c: any) => !c.blocked && !c.is_surface)
                    .map((c: any) => {
                      const id = c.courier_company_id ?? c.courierCompanyId;
                      const name = c.courier_name ?? c.courierName;
                      const rate = c.rate;
                      const etd = c.etd;
                      const rating = c.rating;
                      return (
                        <tr
                          key={id}
                          className={cn(
                            "cursor-pointer hover:bg-muted/20 transition-colors",
                            selectedCourierId === id && "bg-primary/5",
                          )}
                          onClick={() => setSelectedCourierId(id)}
                        >
                          <td className="py-2 px-3">
                            <input
                              type="radio"
                              checked={selectedCourierId === id}
                              onChange={() => setSelectedCourierId(id)}
                            />
                          </td>
                          <td className="py-2 px-3 font-medium">{name}</td>
                          <td className="py-2 px-3">₹{rate}</td>
                          <td className="py-2 px-3">{etd}</td>
                          <td className="py-2 px-3">
                            {"⭐".repeat(Math.round(rating ?? 0))}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!selectedCourierId || loading}
            onClick={() => selectedCourierId && onAssign(selectedCourierId)}
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
            Assign Courier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── ShippingView ─────────────────────────────────────────────────────────────
export const ShippingView: React.FC<ModuleProps> = ({ onNavigate }) => {
  const [filter, setFilter] = useState("");
  const [selectedShipment, setSelectedShipment] =
    useState<AdminShipmentResponse | null>(null);

  const { data: shipmentsPage, isLoading } = useQuery({
    queryKey: ["adminShipments"],
    queryFn: () => adminShippingService.getAllShipments(0, 50),
  });

  const filtered = (shipmentsPage?.content ?? []).filter(
    (ship: AdminShipmentResponse) => {
      const q = filter.toLowerCase();
      return (
        (ship.trackingNumber ?? "").toLowerCase().includes(q) ||
        (ship.carrier ?? "").toLowerCase().includes(q) ||
        (ship.status ?? "").toLowerCase().includes(q) ||
        ship.orderId.toLowerCase().includes(q)
      );
    },
  );

  return (
    <>
      <ShippingDetailDialog
        open={selectedShipment !== null}
        onOpenChange={(open) => !open && setSelectedShipment(null)}
        shipment={selectedShipment}
        onNavigateOrder={() => {
          onNavigate?.("orders", selectedShipment?.orderId);
          setSelectedShipment(null);
        }}
      />

      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle>Shipments</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Open an order and use Edit to update tracking details
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter shipments..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-8 h-9 w-48 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading shipments...
              </div>
            ) : !filtered.length ? (
              <div className="p-8 text-center text-muted-foreground">
                No shipments found.
              </div>
            ) : (
              filtered.map((ship: AdminShipmentResponse, idx: number) => (
                <div
                  key={ship.id}
                  className="p-4 rounded-xl border bg-muted/10 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        #{idx + 1} &nbsp;·&nbsp; {ship.trackingNumber || "No tracking yet"}
                      </p>
                      <h4 className="font-bold flex items-center gap-2 mt-0.5">
                        Order{" "}
                        <button
                          onClick={() => onNavigate?.("orders", ship.orderId)}
                          className="text-primary hover:underline"
                        >
                          {ship.orderId}
                        </button>
                      </h4>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-white border text-[10px] font-bold shadow-sm uppercase">
                      {ship.carrier || "No carrier"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          ship.status === "DELIVERED"
                            ? "w-full bg-green-500"
                            : ship.status === "OUT_FOR_DELIVERY"
                              ? "w-3/4 bg-primary"
                              : ship.status === "IN_TRANSIT"
                                ? "w-1/2 bg-amber-500"
                                : "w-1/4 bg-muted-foreground/30",
                        )}
                      />
                    </div>
                    <span className="text-[10px] font-bold whitespace-nowrap uppercase">
                      {ship.status}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-1 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 border-primary/20 hover:bg-primary/10 hover:text-primary"
                      onClick={() => setSelectedShipment(ship)}
                    >
                      <Eye className="w-3 h-3" /> View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => onNavigate?.("orders", ship.orderId)}
                    >
                      <Pencil className="w-3 h-3" /> Edit Tracking
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

const ChecklistRow: React.FC<{
  id: string;
  label: string;
  sublabel: string;
  checked: boolean;
  onToggle: (id: string) => void;
  indent?: number | boolean;
}> = ({ id, label, sublabel, checked, onToggle, indent }) => {
  const pl = indent === 2 ? "pl-8" : indent ? "pl-5" : "pl-3";
  return (
    <label
      className={`flex items-center gap-3 ${pl} pr-3 py-2 cursor-pointer hover:bg-muted/20 transition-colors border-b last:border-b-0`}
    >
      <Checkbox checked={checked} onCheckedChange={() => onToggle(id)} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{label}</div>
        {sublabel && (
          <div className="text-xs text-muted-foreground truncate">
            {sublabel}
          </div>
        )}
      </div>
    </label>
  );
};

export const CouponDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon?: CouponResponse | null;
  onSave: (coupon: CouponData) => void;
}> = ({ open, onOpenChange, coupon, onSave }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [formData, setFormData] = useState<CouponData>({
    code: "",
    description: "",
    discountType: "PERCENT",
    discountValue: 0,
    buyQty: 0,
    getQty: 0,
    minCartValue: 0,
    maxDiscount: 0,
    usageLimit: 0,
    userLimit: 1,
    isActive: true,
    expiresAt: "",
    buySku: "",
    getSku: "",
  });

  React.useEffect(() => {
    if (coupon) {
      setFormData({
        ...coupon,
        expiresAt: coupon.expiresAt
          ? new Date(coupon.expiresAt).toISOString().split("T")[0]
          : "",
      } as any);
    } else {
      setFormData({
        code: "",
        description: "",
        discountType: "PERCENT",
        discountValue: 0,
        buyQty: 0,
        getQty: 0,
        minCartValue: 0,
        maxDiscount: 0,
        usageLimit: 0,
        userLimit: 1,
        isActive: true,
        expiresAt: "",
        buySku: "",
        getSku: "",
      });
    }
  }, [coupon, open]);

  React.useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [cats, prods] = await Promise.all([
          productService.getAdminCategories(),
          productService.getAdminProducts(),
        ]);
        setCategories(cats);
        setProducts(prods);
      } catch (error) {
        console.error("Failed to fetch metadata", error);
      }
    };
    if (open) fetchMetadata();
  }, [open]);

  type AppliesTo = "ALL" | "CATEGORY" | "PRODUCT" | "SKU";
  const [scope, setScope] = useState<AppliesTo>("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [ruleSearch, setRuleSearch] = useState("");

  // Sync scope + selectedIds from coupon rules when dialog opens
  React.useEffect(() => {
    const rules = (coupon?.rules as CouponRuleData[] | undefined) || [];
    if (rules.length === 0 || rules.some((r) => r.ruleType === "ALL")) {
      setScope("ALL");
      setSelectedIds([]);
    } else {
      setScope(rules[0].ruleType as AppliesTo);
      setSelectedIds(rules.map((r) => r.entityId).filter(Boolean));
    }
    setRuleSearch("");
  }, [coupon, open]);

  const handleScopeChange = (newScope: AppliesTo) => {
    setScope(newScope);
    setSelectedIds([]);
    setRuleSearch("");
    setFormData((prev) => ({ ...prev, rules: [] }));
  };

  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      setFormData((fd) => ({
        ...fd,
        rules: next.map((entityId) => ({ ruleType: scope, entityId })),
      }));
      return next;
    });
  };

  const allSkus = React.useMemo(
    () =>
      products.flatMap((p) =>
        (p.skus || []).map((s: any) => ({
          id: s.sku,
          label: s.sku,
          sublabel: `${p.productName}${s.packaging ? " · " + s.packaging : ""}`,
        })),
      ),
    [products],
  );

  const scopeItems = React.useMemo(() => {
    if (scope === "CATEGORY")
      return categories.map((c) => ({ id: c.id, label: c.name, sublabel: "" }));
    if (scope === "PRODUCT")
      return products.map((p) => ({
        id: p.id,
        label: p.productName,
        sublabel: p.productCode || "",
      }));
    if (scope === "SKU") return allSkus;
    return [];
  }, [scope, categories, products, allSkus]);

  const filteredScopeItems = React.useMemo(() => {
    const q = ruleSearch.toLowerCase();
    if (!q) return scopeItems;
    return scopeItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.sublabel.toLowerCase().includes(q),
    );
  }, [scopeItems, ruleSearch]);

  const getScopeLabel = (id: string) =>
    scopeItems.find((i) => i.id === id)?.label ?? id;

  const productsByCategory = React.useMemo(
    () =>
      categories
        .map((cat) => ({
          category: cat,
          products: products.filter((p) => p.categoryId === cat.id),
        }))
        .filter((g) => g.products.length > 0),
    [categories, products],
  );

  const skusByCategory = React.useMemo(
    () =>
      categories
        .map((cat) => ({
          category: cat,
          productGroups: products
            .filter((p) => p.categoryId === cat.id)
            .map((p) => ({
              product: p,
              skus: (p.skus || []).map((s: any) => ({
                id: s.sku,
                label: s.sku,
                sublabel: s.packaging || "",
              })),
            }))
            .filter((g) => g.skus.length > 0),
        }))
        .filter((g) => g.productGroups.length > 0),
    [categories, products],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[600px] rounded-3xl overflow-y-auto max-h-[90vh]"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold text-forest flex items-center gap-2">
            <Ticket className="w-6 h-6 text-primary" />
            {coupon ? "Edit Coupon" : "Create New Coupon"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                Coupon Code
              </label>
              <Input
                placeholder="WELCOME10"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                className="rounded-xl border-2 h-11"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                Discount Type
              </label>
              <select
                value={formData.discountType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountType: e.target.value as any,
                  })
                }
                className="h-11 w-full rounded-xl border-2 border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="PERCENT">Percentage (%)</option>
                <option value="PERCENT_CAP">Percentage with Cap</option>
                <option value="FIXED">Fixed Amount (₹)</option>
                <option value="BOGO">Buy X Get Y</option>
                <option value="SKU_BOGO">Buy N Get M (SKU-level)</option>
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
              Description
            </label>
            <Input
              placeholder="Get 10% off on your first order"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="rounded-xl border-2 h-11"
            />
          </div>

          {/* ── Percentage (%) ── */}
          {formData.discountType === "PERCENT" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    Discount Percentage (%)
                  </label>
                  <Input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountValue: parseFloat(e.target.value),
                      })
                    }
                    className="rounded-xl border-2 h-11"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    Expiry Date
                  </label>
                  <Input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) =>
                      setFormData({ ...formData, expiresAt: e.target.value })
                    }
                    className="rounded-xl border-2 h-11"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Max Discount Cap (₹) — optional
                </label>
                <Input
                  type="number"
                  value={formData.maxDiscount || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxDiscount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="rounded-xl border-2 h-11"
                  placeholder="Leave blank for no cap"
                />
              </div>
            </>
          )}

          {/* ── Percentage with Cap ── */}
          {formData.discountType === "PERCENT_CAP" && (
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Discount Percentage (%)
                </label>
                <Input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountValue: parseFloat(e.target.value),
                    })
                  }
                  className="rounded-xl border-2 h-11"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-primary ml-1">
                  Max Cap (₹) *
                </label>
                <Input
                  type="number"
                  value={formData.maxDiscount || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxDiscount: parseFloat(e.target.value),
                    })
                  }
                  className="rounded-xl border-2 border-primary h-11"
                  placeholder="e.g. 200"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Expiry Date
                </label>
                <Input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                  className="rounded-xl border-2 h-11"
                />
              </div>
            </div>
          )}

          {/* ── Fixed Amount (₹) ── */}
          {formData.discountType === "FIXED" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Discount Amount (₹)
                </label>
                <Input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountValue: parseFloat(e.target.value),
                    })
                  }
                  className="rounded-xl border-2 h-11"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Expiry Date
                </label>
                <Input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                  className="rounded-xl border-2 h-11"
                />
              </div>
            </div>
          )}

          {/* ── Buy X Get Y (SKU-specific) ── */}
          {formData.discountType === "BOGO" && (
            <>
              <div className="grid gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Expiry Date
                </label>
                <Input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                  className="rounded-xl border-2 h-11"
                />
              </div>
              <div className="grid gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-primary ml-1">
                      Buy SKU
                    </label>
                    <Input
                      list="bogo-buy-sku-list"
                      placeholder="Type to search SKUs…"
                      value={formData.buySku}
                      onChange={(e) =>
                        setFormData({ ...formData, buySku: e.target.value })
                      }
                      className="rounded-xl border-2 h-11 bg-white"
                    />
                    <datalist id="bogo-buy-sku-list">
                      {allSkus.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.sublabel}
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-primary ml-1">
                      Buy Quantity (X)
                    </label>
                    <Input
                      type="number"
                      value={formData.buyQty}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          buyQty: parseInt(e.target.value),
                        })
                      }
                      className="rounded-xl border-2 h-11 bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-primary ml-1">
                      Get SKU (Free) — leave blank for same SKU
                    </label>
                    <Input
                      list="bogo-get-sku-list"
                      placeholder="Same as Buy SKU if blank"
                      value={formData.getSku}
                      onChange={(e) =>
                        setFormData({ ...formData, getSku: e.target.value })
                      }
                      className="rounded-xl border-2 h-11 bg-white"
                    />
                    <datalist id="bogo-get-sku-list">
                      {allSkus.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.sublabel}
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-primary ml-1">
                      Get Quantity (Y) Free
                    </label>
                    <Input
                      type="number"
                      value={formData.getQty}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          getQty: parseInt(e.target.value),
                        })
                      }
                      className="rounded-xl border-2 h-11 bg-white"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Buy N Get M (SKU-level) ── */}
          {formData.discountType === "SKU_BOGO" && (
            <>
              <div className="grid gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Expiry Date
                </label>
                <Input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                  className="rounded-xl border-2 h-11"
                />
              </div>
              <div className="grid gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-primary ml-1">
                      Buy SKU
                    </label>
                    <Input
                      list="sku-bogo-buy-list"
                      placeholder="Type to search SKUs…"
                      value={formData.buySku}
                      onChange={(e) =>
                        setFormData({ ...formData, buySku: e.target.value })
                      }
                      className="rounded-xl border-2 h-11 bg-white"
                    />
                    <datalist id="sku-bogo-buy-list">
                      {allSkus.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.sublabel}
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-primary ml-1">
                      Buy Quantity (N)
                    </label>
                    <Input
                      type="number"
                      value={formData.buyQty}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          buyQty: parseInt(e.target.value),
                        })
                      }
                      className="rounded-xl border-2 h-11 bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-primary ml-1">
                      Get SKU (Free)
                    </label>
                    <Input
                      list="sku-bogo-get-list"
                      placeholder="Type to search SKUs…"
                      value={formData.getSku}
                      onChange={(e) =>
                        setFormData({ ...formData, getSku: e.target.value })
                      }
                      className="rounded-xl border-2 h-11 bg-white"
                    />
                    <datalist id="sku-bogo-get-list">
                      {allSkus.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.sublabel}
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-primary ml-1">
                      Get Quantity (M)
                    </label>
                    <Input
                      type="number"
                      value={formData.getQty}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          getQty: parseInt(e.target.value),
                        })
                      }
                      className="rounded-xl border-2 h-11 bg-white"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                Min Cart Value
              </label>
              <Input
                type="number"
                value={formData.minCartValue}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minCartValue: parseFloat(e.target.value),
                  })
                }
                className="rounded-xl border-2 h-11"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                Global Usage Limit
              </label>
              <Input
                type="number"
                value={formData.usageLimit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    usageLimit: parseInt(e.target.value),
                  })
                }
                className="rounded-xl border-2 h-11"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                User Usage Limit
              </label>
              <Input
                type="number"
                value={formData.userLimit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    userLimit: parseInt(e.target.value),
                  })
                }
                className="rounded-xl border-2 h-11"
              />
            </div>
          </div>

          {formData.discountType !== "SKU_BOGO" &&
            formData.discountType !== "BOGO" && (
              <div className="grid gap-3 border-t pt-4 mt-2">
                <label className="text-sm font-bold text-forest">
                  Applies To
                </label>

                {/* Scope pill selector */}
                <div className="flex gap-2 flex-wrap">
                  {(["ALL", "CATEGORY", "PRODUCT", "SKU"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleScopeChange(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                        scope === s
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-muted-foreground border-gray-200 hover:border-primary/40"
                      }`}
                    >
                      {s === "ALL"
                        ? "All Products"
                        : s === "CATEGORY"
                          ? "Categories"
                          : s === "PRODUCT"
                            ? "Specific Products"
                            : "Specific SKUs"}
                    </button>
                  ))}
                </div>

                {scope === "ALL" && (
                  <p className="text-xs text-muted-foreground italic">
                    Coupon applies to all products in the cart.
                  </p>
                )}

                {/* Searchable checklist */}
                {scope !== "ALL" && (
                  <div className="border rounded-xl overflow-hidden">
                    <div className="p-2 border-b bg-muted/20">
                      <Input
                        placeholder={`Search ${scope === "CATEGORY" ? "categories" : scope === "PRODUCT" ? "products" : "SKUs"}…`}
                        value={ruleSearch}
                        onChange={(e) => setRuleSearch(e.target.value)}
                        className="h-8 rounded-lg text-sm"
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      {/* Flat filtered results while searching */}
                      {ruleSearch && (
                        <>
                          {filteredScopeItems.map((item) => (
                            <ChecklistRow
                              key={item.id}
                              id={item.id}
                              label={item.label}
                              sublabel={item.sublabel}
                              checked={selectedIds.includes(item.id)}
                              onToggle={toggleId}
                            />
                          ))}
                          {filteredScopeItems.length === 0 && (
                            <p className="text-center py-4 text-xs text-muted-foreground">
                              No results
                            </p>
                          )}
                        </>
                      )}

                      {/* Grouped by category — Products */}
                      {!ruleSearch &&
                        scope === "PRODUCT" &&
                        productsByCategory.map(
                          ({ category, products: prods }) => (
                            <div key={category.id}>
                              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/30 sticky top-0">
                                {category.name}
                              </div>
                              {prods.map((p) => (
                                <ChecklistRow
                                  key={p.id}
                                  id={p.id}
                                  label={p.productName}
                                  sublabel={p.productCode || ""}
                                  checked={selectedIds.includes(p.id)}
                                  onToggle={toggleId}
                                  indent
                                />
                              ))}
                            </div>
                          ),
                        )}

                      {/* Grouped by category → product — SKUs */}
                      {!ruleSearch &&
                        scope === "SKU" &&
                        skusByCategory.map(({ category, productGroups }) => (
                          <div key={category.id}>
                            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/30 sticky top-0">
                              {category.name}
                            </div>
                            {productGroups.map(({ product, skus }) => (
                              <div key={product.id}>
                                <div className="px-4 py-1 text-xs font-semibold text-forest/70 bg-muted/10">
                                  {product.productName}
                                </div>
                                {skus.map((s) => (
                                  <ChecklistRow
                                    key={s.id}
                                    id={s.id}
                                    label={s.label}
                                    sublabel={s.sublabel}
                                    checked={selectedIds.includes(s.id)}
                                    onToggle={toggleId}
                                    indent={2}
                                  />
                                ))}
                              </div>
                            ))}
                          </div>
                        ))}

                      {/* Flat list for CATEGORY scope */}
                      {!ruleSearch &&
                        scope === "CATEGORY" &&
                        scopeItems.map((item) => (
                          <ChecklistRow
                            key={item.id}
                            id={item.id}
                            label={item.label}
                            sublabel={item.sublabel}
                            checked={selectedIds.includes(item.id)}
                            onToggle={toggleId}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Selected items as removable chips */}
                {selectedIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedIds.map((id) => (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full"
                      >
                        {getScopeLabel(id)}
                        <button
                          type="button"
                          onClick={() => toggleId(id)}
                          className="hover:text-red-500 leading-none ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl h-11"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              const dataToSave = { ...formData };
              if (
                dataToSave.discountType === "SKU_BOGO" ||
                dataToSave.discountType === "BOGO"
              ) {
                dataToSave.rules = [];
              }
              if (dataToSave.expiresAt && dataToSave.expiresAt.length === 10) {
                dataToSave.expiresAt = `${dataToSave.expiresAt}T23:59:59Z`;
              }
              // 0 / falsy → undefined so backend stores null (no cap / no limit).
              // PERCENT_CAP always has a real maxDiscount — don't clear it.
              if (
                dataToSave.discountType !== "PERCENT_CAP" &&
                !dataToSave.maxDiscount
              )
                dataToSave.maxDiscount = undefined;
              if (!dataToSave.usageLimit) dataToSave.usageLimit = undefined;
              if (!dataToSave.minCartValue) dataToSave.minCartValue = undefined;
              onSave(dataToSave);
            }}
            className="rounded-xl h-11 px-8 font-bold bg-primary hover:bg-primary/95 text-white shadow-lg"
          >
            {coupon ? "Update Coupon" : "Create Coupon"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const CouponsView: React.FC<{
  coupons: CouponResponse[];
  onAdd: () => void;
  onEdit: (coupon: CouponResponse) => void;
  onDelete: (id: string) => void;
}> = ({ coupons, onAdd, onEdit, onDelete }) => (
  <Card className="border-2 shadow-sm rounded-2xl overflow-hidden mt-6">
    <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 pb-6">
      <div>
        <CardTitle className="text-xl font-display font-bold text-forest">
          Coupons & Discounts
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Configure promo codes, BOGO offers, and usage rules
        </p>
      </div>
      <Button
        onClick={onAdd}
        className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl px-6 h-10 gap-2"
      >
        <Plus className="w-4 h-4" /> Create Coupon
      </Button>
    </CardHeader>
    <CardContent className="p-0">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="pl-6">Offer Details</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Value/Rule</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right pr-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coupons.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-64 text-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Ticket className="w-10 h-10 opacity-20" />
                  <p>No coupons found. Create your first offer!</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            coupons.map((c) => (
              <TableRow key={c.id} className="hover:bg-muted/10 group">
                <TableCell className="pl-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-black text-sm text-primary tracking-wider">
                      {c.code}
                    </span>
                    <span className="text-[10px] text-muted-foreground line-clamp-1">
                      {c.description}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className="text-[10px] border-none font-bold"
                  >
                    {c.discountType === "PERCENT"
                      ? "Percentage"
                      : c.discountType === "PERCENT_CAP"
                        ? "% with Cap"
                        : c.discountType === "FIXED"
                          ? "Fixed"
                          : c.discountType === "BOGO"
                            ? "Buy X Get Y"
                            : "Buy N Get M"}
                  </Badge>
                </TableCell>
                <TableCell className="font-bold">
                  {c.discountType === "SKU_BOGO"
                    ? `Buy ${c.buySku} (${c.buyQty}) → Get ${c.getSku} (${c.getQty}) Free`
                    : c.discountType === "BOGO"
                      ? `Buy ${c.buySku} (${c.buyQty}) → Get ${c.getSku || c.buySku} (${c.getQty}) Free`
                      : c.discountType === "PERCENT_CAP"
                        ? `${c.discountValue}% Off (max ₹${c.maxDiscount})`
                        : c.discountType === "PERCENT"
                          ? `${c.discountValue}% Off${c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ""}`
                          : `₹${c.discountValue} Off`}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {c.usageLimit ? `${c.usageLimit} Max` : "Unlimited"}
                </TableCell>
                <TableCell className="text-xs">
                  {c.expiresAt
                    ? new Date(c.expiresAt).toLocaleDateString()
                    : "Never"}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-[9px] font-bold uppercase",
                      c.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700",
                    )}
                  >
                    {c.isActive ? "Active" : "Paused"}
                  </span>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(c)}
                      className="h-8 rounded-lg border-2 hover:bg-primary/10 hover:text-primary gap-1"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(c.id)}
                      className="h-8 w-8 rounded-lg text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

export const AnalyticsView = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["adminAnalytics"],
    queryFn: async () => {
      const { default: apiClient } = await import("@/lib/api-client");
      const res = await apiClient.get("/admin/analytics");
      return res.data;
    },
  });

  const chartData = data?.monthlySales ?? [];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: data?.totalOrders ?? "—" },
          {
            label: "Total Revenue",
            value:
              data?.totalRevenue != null
                ? `₹${Number(data.totalRevenue).toLocaleString("en-IN")}`
                : "—",
          },
          { label: "Products", value: data?.totalProducts ?? "—" },
          { label: "Customers", value: data?.totalCustomers ?? "—" },
        ].map((stat) => (
          <Card key={stat.label} className="border-2">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue chart */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Sales Performance (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full mt-4">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E2E8F0"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94A3B8", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94A3B8", fontSize: 12 }}
                    dx={-10}
                    tickFormatter={(v) =>
                      `₹${Number(v).toLocaleString("en-IN")}`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    }}
                    formatter={(v: number) => [
                      `₹${Number(v).toLocaleString("en-IN")}`,
                      "Revenue",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#065F46"
                    strokeWidth={3}
                    dot={{ fill: "#065F46", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders by status */}
      {data?.ordersByStatus && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(
                data.ordersByStatus as Record<string, number>,
              ).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted border text-sm font-medium"
                >
                  <span className="capitalize text-muted-foreground">
                    {status.toLowerCase()}
                  </span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export const FeaturedSectionsView: React.FC<{ products: any[] }> = ({
  products,
}) => {
  const queryClient = useQueryClient();
  const [selectedSection, setSelectedSection] = useState<any | null>(null);
  const [sectionName, setSectionName] = useState("");
  const [sectionDesc, setSectionDesc] = useState("");
  const [sectionImageUrl, setSectionImageUrl] = useState("");
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [viewSectionId, setViewSectionId] = useState<string | null>(null);

  const { data: sections, isLoading } = useQuery({
    queryKey: ["adminFeatureSections"],
    queryFn: async () => {
      const { default: apiClient } = await import("@/lib/api-client");
      const res = await apiClient.get("/admin/features/sections/all");
      return res.data as Array<{
        id: string;
        name: string;
        description: string;
        imageUrl?: string;
        isActive: boolean;
      }>;
    },
  });

  const { data: sectionProducts } = useQuery({
    queryKey: ["adminFeatureSectionProducts", viewSectionId],
    enabled: !!viewSectionId,
    queryFn: async () => {
      const { default: apiClient } = await import("@/lib/api-client");
      const res = await apiClient.get(
        `/admin/features/products/section/${viewSectionId}/all`,
      );
      return res.data as Array<{
        id: string;
        productId: string;
        displayOrder: number;
        isActive: boolean;
      }>;
    },
  });

  const saveSectionMutation = useMutation({
    mutationFn: async ({
      id,
      name,
      description,
      imageUrl,
    }: {
      id?: string;
      name: string;
      description: string;
      imageUrl?: string;
    }) => {
      const { default: apiClient } = await import("@/lib/api-client");
      if (id) {
        return apiClient.put(`/admin/features/sections/${id}`, {
          name,
          description,
          imageUrl,
          isActive: true,
        });
      }
      return apiClient.post("/admin/features/sections", {
        name,
        description,
        imageUrl,
        isActive: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminFeatureSections"] });
      setIsSectionDialogOpen(false);
      setSectionName("");
      setSectionDesc("");
      setSectionImageUrl("");
      setSelectedSection(null);
      toast.success("Section saved");
    },
    onError: () => toast.error("Failed to save section"),
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { default: apiClient } = await import("@/lib/api-client");
      return apiClient.delete(`/admin/features/sections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminFeatureSections"] });
      if (viewSectionId === selectedSection?.id) setViewSectionId(null);
      toast.success("Section deleted");
    },
    onError: () => toast.error("Failed to delete section"),
  });

  const addProductMutation = useMutation({
    mutationFn: async ({
      sectionId,
      productId,
    }: {
      sectionId: string;
      productId: string;
    }) => {
      const { default: apiClient } = await import("@/lib/api-client");
      return apiClient.post("/admin/features/products", {
        featureSectionId: sectionId,
        productId,
        isActive: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["adminFeatureSectionProducts", viewSectionId],
      });
      setIsProductDialogOpen(false);
      setSelectedProductId("");
      toast.success("Product added to section");
    },
    onError: () => toast.error("Failed to add product"),
  });

  const removeProductMutation = useMutation({
    mutationFn: async (featuredProductId: string) => {
      const { default: apiClient } = await import("@/lib/api-client");
      return apiClient.delete(`/admin/features/products/${featuredProductId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["adminFeatureSectionProducts", viewSectionId],
      });
      toast.success("Product removed from section");
    },
    onError: () => toast.error("Failed to remove product"),
  });

  const viewSection = sections?.find((s) => s.id === viewSectionId);

  return (
    <div className="space-y-6">
      {/* Dialogs */}
      <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedSection ? "Edit Section" : "New Featured Section"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Section Name
              </label>
              <Input
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                placeholder="e.g. Best Sellers"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Description
              </label>
              <Input
                value={sectionDesc}
                onChange={(e) => setSectionDesc(e.target.value)}
                placeholder="Optional description"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Image URL
              </label>
              <Input
                value={sectionImageUrl}
                onChange={(e) => setSectionImageUrl(e.target.value)}
                placeholder="https://example.com/map.jpg"
                className="mt-1"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Used by the "India Map" homepage section to display a custom map
                image.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() =>
                saveSectionMutation.mutate({
                  id: selectedSection?.id,
                  name: sectionName,
                  description: sectionDesc,
                  imageUrl: sectionImageUrl,
                })
              }
              disabled={!sectionName.trim() || saveSectionMutation.isPending}
            >
              {saveSectionMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Product to "{viewSection?.name}"</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Select Product
            </label>
            <Select
              value={selectedProductId}
              onValueChange={setSelectedProductId}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose a product..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.productName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              onClick={() =>
                addProductMutation.mutate({
                  sectionId: viewSectionId!,
                  productId: selectedProductId,
                })
              }
              disabled={!selectedProductId || addProductMutation.isPending}
            >
              {addProductMutation.isPending ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        {viewSectionId ? (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewSectionId(null)}
            >
              ← Back
            </Button>
            <h2 className="text-lg font-bold">{viewSection?.name}</h2>
          </div>
        ) : (
          <h2 className="text-lg font-bold">Featured Sections</h2>
        )}
        <Button
          size="sm"
          className="gap-2"
          onClick={() => {
            if (viewSectionId) {
              setIsProductDialogOpen(true);
            } else {
              setSelectedSection(null);
              setSectionName("");
              setSectionDesc("");
              setSectionImageUrl("");
              setIsSectionDialogOpen(true);
            }
          }}
        >
          <Plus className="w-4 h-4" />{" "}
          {viewSectionId ? "Add Product" : "New Section"}
        </Button>
      </div>

      {viewSectionId ? (
        /* Products in section */
        <Card className="border-2">
          <CardContent className="p-0">
            {!sectionProducts?.length ? (
              <p className="text-sm text-muted-foreground p-6">
                No products in this section yet. Click "Add Product" to add one.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product ID</TableHead>
                    <TableHead>Display Order</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectionProducts.map((fp) => {
                    const p = products.find(
                      (pr: any) => pr.id === fp.productId,
                    );
                    return (
                      <TableRow key={fp.id}>
                        <TableCell className="font-medium">
                          {p?.productName ?? fp.productId.slice(0, 8)}
                        </TableCell>
                        <TableCell>{fp.displayOrder ?? "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={fp.isActive ? "default" : "secondary"}
                          >
                            {fp.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-500/10 hover:text-red-500"
                            onClick={() => removeProductMutation.mutate(fp.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : /* Sections list */
      isLoading ? (
        <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading...
        </div>
      ) : !sections?.length ? (
        <Card className="border-2">
          <CardContent className="p-6 text-sm text-muted-foreground">
            No featured sections yet. Create one to start featuring products on
            the homepage.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((section) => (
            <Card
              key={section.id}
              className="border-2 hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => setViewSectionId(section.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{section.name}</CardTitle>
                    {section.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {section.description}
                      </p>
                    )}
                  </div>
                  <div
                    className="flex gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setSelectedSection(section);
                        setSectionName(section.name);
                        setSectionDesc(section.description ?? "");
                        setSectionImageUrl(section.imageUrl ?? "");
                        setIsSectionDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:text-red-500"
                      onClick={() => {
                        if (confirm(`Delete section "${section.name}"?`))
                          deleteSectionMutation.mutate(section.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="pt-0">
                <Badge variant={section.isActive ? "default" : "secondary"}>
                  {section.isActive ? "Active" : "Inactive"}
                </Badge>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export const ReturnsView = () => {
  const queryClient = useQueryClient();

  const { data: refunds, isLoading } = useQuery({
    queryKey: ["adminRefunds"],
    queryFn: async () => {
      const { default: apiClient } = await import("@/lib/api-client");
      const res = await apiClient.get("/admin/refunds");
      return res.data as Array<{
        orderId: string;
        orderStatus: string;
        totalAmount: number;
        currency: string;
        customerName: string;
        customerEmail: string;
        createdAt: string;
        paymentId?: string;
        refunded: boolean;
        refundAmount: number;
      }>;
    },
  });

  const processRefundMutation = useMutation({
    mutationFn: async ({
      orderId,
      reason,
    }: {
      orderId: string;
      reason: string;
    }) => {
      const { default: apiClient } = await import("@/lib/api-client");
      await apiClient.post(`/admin/refunds/${orderId}/process`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminRefunds"] });
      toast.success("Refund processed successfully");
    },
    onError: () => toast.error("Failed to process refund"),
  });

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>Returns & Refunds</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading...
          </div>
        ) : !refunds?.length ? (
          <p className="text-muted-foreground text-sm py-4">
            No cancelled or refunded orders.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refunds.map((r) => (
                <TableRow key={r.orderId}>
                  <TableCell className="font-mono text-xs">
                    {r.orderId.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{r.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.customerEmail}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">
                    ₹{Number(r.totalAmount).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.refunded
                          ? "default"
                          : r.orderStatus === "CANCELLED"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {r.refunded ? "Refunded" : r.orderStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.createdAt
                      ? new Date(r.createdAt).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {!r.refunded && r.paymentId ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        disabled={processRefundMutation.isPending}
                        onClick={() => {
                          if (
                            confirm(
                              `Process refund of ₹${Number(r.totalAmount).toLocaleString("en-IN")} for order ${r.orderId.slice(0, 8).toUpperCase()}?`,
                            )
                          ) {
                            processRefundMutation.mutate({
                              orderId: r.orderId,
                              reason: "Admin processed refund",
                            });
                          }
                        }}
                      >
                        Process Refund
                      </Button>
                    ) : r.refunded ? (
                      <span className="text-xs text-green-600 font-medium flex items-center gap-1 justify-end">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Done
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No payment
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export const MessagesView = () => {
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(
    null,
  );

  const { data: messages, isLoading } = useQuery({
    queryKey: ["adminMessages"],
    queryFn: () => contactService.getAllMessages(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => contactService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminMessages"] });
      toast.success("Message marked as read");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactService.deleteMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminMessages"] });
      toast.success("Message deleted");
    },
  });

  return (
    <>
      <Dialog
        open={!!selectedMessage}
        onOpenChange={(open) => !open && setSelectedMessage(null)}
      >
        <DialogContent className="max-w-lg rounded-2xl border-2 shadow-2xl overflow-hidden p-0">
          <div className="bg-primary/5 p-6 border-b border-primary/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-display font-bold">
                  Message from {selectedMessage?.name}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Received on{" "}
                  {selectedMessage?.createdAt
                    ? new Date(selectedMessage.createdAt).toLocaleString()
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {selectedMessage && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Sender Email
                  </p>
                  <p className="font-medium text-sm p-3 bg-muted/30 rounded-xl border">
                    {selectedMessage.email}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Phone Number
                  </p>
                  <p className="font-medium text-sm p-3 bg-muted/30 rounded-xl border">
                    {selectedMessage.phone || "—"}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Message Subject
                </p>
                <p className="font-bold text-sm p-3 bg-primary/5 rounded-xl border border-primary/10 text-primary">
                  {selectedMessage.subject}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Message Content
                </p>
                <div className="p-5 bg-muted/40 rounded-2xl whitespace-pre-wrap text-sm leading-relaxed border shadow-inner min-h-[120px]">
                  {selectedMessage.message}
                </div>
              </div>
            </div>
          )}

          <div className="p-4 bg-muted/30 border-t flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setSelectedMessage(null)}
              className="rounded-xl px-6 h-10 font-bold border-2"
            >
              Close
            </Button>
            {selectedMessage && !selectedMessage.isRead && (
              <Button
                onClick={() => {
                  markReadMutation.mutate(selectedMessage.id);
                  setSelectedMessage(null);
                }}
                className="rounded-xl px-6 h-10 font-bold bg-primary text-white shadow-lg"
              >
                Mark as Read
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card className="border-2 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 py-5 px-6">
          <div>
            <CardTitle>Customer Inquiries</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Feedback and support messages from the contact form
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-bold border-2">
              Total: {messages?.length || 0}
            </Badge>
            <Badge className="bg-primary font-bold">
              New: {messages?.filter((m) => !m.isRead).length || 0}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-12 py-4 pl-6 text-center">
                  S.No
                </TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Loading messages...
                    </p>
                  </TableCell>
                </TableRow>
              ) : messages?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-64 text-center text-muted-foreground"
                  >
                    No messages received yet.
                  </TableCell>
                </TableRow>
              ) : (
                messages?.map((msg, idx) => (
                  <TableRow
                    key={msg.id}
                    className={cn(
                      "group hover:bg-primary/5 transition-colors",
                      !msg.isRead && "bg-primary/[0.03]",
                    )}
                  >
                    <TableCell className="text-center text-xs text-muted-foreground font-mono pl-6">
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm tracking-tight text-foreground">
                          {msg.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {msg.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium line-clamp-1">
                        {msg.subject}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {msg.isRead ? (
                        <Badge
                          variant="outline"
                          className="text-[9px] font-bold uppercase opacity-60"
                        >
                          Read
                        </Badge>
                      ) : (
                        <Badge className="text-[9px] font-bold uppercase bg-ochre animate-pulse">
                          Unread
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary rounded-lg"
                          onClick={() => setSelectedMessage(msg)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {!msg.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-green-50 hover:text-green-600 rounded-lg"
                            onClick={() => markReadMutation.mutate(msg.id)}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-red-50 hover:text-red-600 rounded-lg"
                          onClick={() => {
                            if (confirm("Delete this message permanently?"))
                              deleteMutation.mutate(msg.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
};

// ─── PackagingBoxesView ───────────────────────────────────────────────────────
export const PackagingBoxesView: React.FC<ModuleProps> = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBox, setEditingBox] = useState<PackagingBox | null>(null);

  const { data: boxes = [], isLoading } = useQuery({
    queryKey: ["packagingBoxes"],
    queryFn: packagingBoxService.getAllBoxes,
  });

  const createMutation = useMutation({
    mutationFn: (box: PackagingBoxRequest) =>
      editingBox
        ? packagingBoxService.updateBox(editingBox.id, box)
        : packagingBoxService.createBox(box),
    onSuccess: () => {
      toast.success(editingBox ? "Box updated" : "Box created");
      queryClient.invalidateQueries({ queryKey: ["packagingBoxes"] });
      setDialogOpen(false);
      setEditingBox(null);
    },
    onError: () => toast.error("Failed to save box"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => packagingBoxService.deleteBox(id),
    onSuccess: () => {
      toast.success("Box deleted");
      queryClient.invalidateQueries({ queryKey: ["packagingBoxes"] });
    },
    onError: () => toast.error("Failed to delete box"),
  });

  const filtered = boxes.filter((b: PackagingBox) =>
    b.name.toLowerCase().includes(filter.toLowerCase()),
  );

  const handleEdit = (box: PackagingBox) => {
    setEditingBox(box);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingBox(null);
    setDialogOpen(true);
  };

  const handleDelete = (box: PackagingBox) => {
    if (confirm(`Delete packaging box "${box.name}"?`)) {
      deleteMutation.mutate(box.id);
    }
  };

  return (
    <>
      <PackagingBoxDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingBox(null);
        }}
        box={editingBox}
        onSave={(data) => createMutation.mutate(data as PackagingBoxRequest)}
        saving={createMutation.isPending}
      />

      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle>Packaging Boxes</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-1" /> Add Box
            </Button>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter boxes..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-8 h-9 w-48 text-sm"
              />
            </div>
            <Package2 className="w-5 h-5 text-primary/40" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading boxes...
            </div>
          ) : !filtered.length ? (
            <div className="p-8 text-center text-muted-foreground">
              No packaging boxes configured yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>L × B × H (cm)</TableHead>
                  <TableHead>Max Weight (kg)</TableHead>
                  <TableHead>Volume (cm³)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((box: PackagingBox) => (
                  <TableRow key={box.id}>
                    <TableCell className="font-bold text-forest">
                      {box.name}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {box.lengthCm} × {box.breadthCm} × {box.heightCm}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {box.maxWeightKg}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {box.volumeCm3?.toFixed(0) ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          box.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }
                      >
                        {box.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary rounded-lg"
                          onClick={() => handleEdit(box)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-red-50 hover:text-red-600 rounded-lg"
                          onClick={() => handleDelete(box)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
};

// ─── PackagingBoxDialog ───────────────────────────────────────────────────────
const PackagingBoxDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  box: PackagingBox | null;
  onSave: (data: PackagingBoxRequest) => void;
  saving: boolean;
}> = ({ open, onOpenChange, box, onSave, saving }) => {
  const [form, setForm] = useState<PackagingBoxRequest>({
    name: "",
    lengthCm: 10,
    breadthCm: 10,
    heightCm: 10,
    maxWeightKg: 30,
    isActive: true,
  });

  useEffect(() => {
    if (open) {
      if (box) {
        setForm({
          name: box.name,
          lengthCm: box.lengthCm,
          breadthCm: box.breadthCm,
          heightCm: box.heightCm,
          maxWeightKg: box.maxWeightKg,
          isActive: box.isActive,
        });
      } else {
        setForm({
          name: "",
          lengthCm: 10,
          breadthCm: 10,
          heightCm: 10,
          maxWeightKg: 30,
          isActive: true,
        });
      }
    }
  }, [open, box]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="rounded-2xl border-2 bg-white"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold text-forest">
            {box ? "Edit Packaging Box" : "Add Packaging Box"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-forest">
              Box Name
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Small Box"
              required
              className="rounded-xl border-2 h-11"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-forest">
                Length (cm)
              </Label>
              <Input
                type="number"
                value={form.lengthCm}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lengthCm: Number(e.target.value) }))
                }
                required
                className="rounded-xl border-2 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-forest">
                Breadth (cm)
              </Label>
              <Input
                type="number"
                value={form.breadthCm}
                onChange={(e) =>
                  setForm((f) => ({ ...f, breadthCm: Number(e.target.value) }))
                }
                required
                className="rounded-xl border-2 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-forest">
                Height (cm)
              </Label>
              <Input
                type="number"
                value={form.heightCm}
                onChange={(e) =>
                  setForm((f) => ({ ...f, heightCm: Number(e.target.value) }))
                }
                required
                className="rounded-xl border-2 h-11"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-forest">
                Max Weight (kg)
              </Label>
              <Input
                type="number"
                step="0.1"
                value={form.maxWeightKg}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    maxWeightKg: Number(e.target.value),
                  }))
                }
                required
                className="rounded-xl border-2 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-forest">
                Active
              </Label>
              <Select
                value={form.isActive ? "true" : "false"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, isActive: v === "true" }))
                }
              >
                <SelectTrigger className="rounded-xl border-2 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-2">
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-2 flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-xl flex-1 bg-primary hover:bg-primary/90"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : box ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
