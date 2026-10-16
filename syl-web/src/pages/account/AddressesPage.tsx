import { useEffect, useState } from "react";
import { AccountLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { userService, UserAddress } from "@/services/userService";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";

const addressSchema = z.object({
  addressLine1: z.string().min(5, "Address must be at least 5 characters"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().length(6, "Pincode must be 6 digits"),
  addressType: z.enum(["HOME", "OFFICE", "OTHER"]),
  label: z.string().optional(),
  isDefault: z.boolean().default(false),
});

type AddressFormValues = z.infer<typeof addressSchema>;

export function AddressesPage() {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(
    null,
  );
  const [pincodeLoading, setPincodeLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      addressType: "HOME",
      isDefault: false,
    },
  });

  const addressType = watch("addressType");
  const watchedPincode = watch("pincode");

  useEffect(() => {
    loadAddresses();
  }, []);

  useEffect(() => {
    if (!/^\d{6}$/.test(watchedPincode)) return;
    setPincodeLoading(true);
    fetch(`https://api.postalpincode.in/pincode/${watchedPincode}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.[0]?.Status === "Success" && data[0].PostOffice?.length) {
          const po = data[0].PostOffice[0];
          setValue("city", po.District, { shouldValidate: true });
          setValue("state", po.State, { shouldValidate: true });
        }
      })
      .catch(() => {})
      .finally(() => setPincodeLoading(false));
  }, [watchedPincode]);

  async function loadAddresses() {
    try {
      const data = await userService.getAddresses();
      setAddresses(data);
    } catch (error) {
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  }

  const onSubmit: SubmitHandler<AddressFormValues> = async (values) => {
    try {
      if (editingAddress) {
        await userService.updateAddress(editingAddress.id, values);
        toast.success("Address updated");
      } else {
        await userService.addAddress(values as Omit<UserAddress, "id">);
        toast.success("Address added");
      }
      setIsDialogOpen(false);
      reset();
      setEditingAddress(null);
      loadAddresses();
    } catch (error) {
      toast.error("Failed to save address");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this address?"))
      return;
    try {
      await userService.deleteAddress(id);
      toast.success("Address deleted");
      loadAddresses();
    } catch (error) {
      toast.error("Failed to delete address");
    }
  };

  const handleEdit = (address: UserAddress) => {
    setEditingAddress(address);
    reset({
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      addressType: address.addressType,
      isDefault: address.isDefault,
      label: address.label || "",
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <AccountLayout
        title="My Addresses"
        subtitle="Manage your delivery locations."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout
      title="My Addresses"
      subtitle="Manage your saved delivery addresses."
    >
      <div className="flex justify-end mb-6">
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingAddress(null);
              reset();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Address
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>
                  {editingAddress ? "Edit Address" : "Add New Address"}
                </DialogTitle>
                <DialogDescription>
                  Enter the delivery address details below.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
                <div className="space-y-2">
                  <Label htmlFor="addressLine1">Address Line 1</Label>
                  <Input
                    id="addressLine1"
                    {...register("addressLine1")}
                    placeholder="House No, Building, Street"
                  />
                  {errors.addressLine1 && (
                    <p className="text-xs text-red-500">
                      {errors.addressLine1.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressLine2">
                    Address Line 2 (Optional)
                  </Label>
                  <Input
                    id="addressLine2"
                    {...register("addressLine2")}
                    placeholder="Area, Landmark"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="pincode"
                      className="flex items-center gap-1"
                    >
                      Pincode
                      {pincodeLoading && (
                        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                      )}
                    </Label>
                    <Input
                      id="pincode"
                      {...register("pincode")}
                      maxLength={6}
                    />
                    {errors.pincode && (
                      <p className="text-xs text-red-500">
                        {errors.pincode.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addressType">Address Type</Label>
                    <Select
                      value={addressType}
                      onValueChange={(val) =>
                        setValue("addressType", val as any)
                      }
                    >
                      <SelectTrigger id="addressType">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HOME">Home</SelectItem>
                        <SelectItem value="OFFICE">Office</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" {...register("city")} />
                    {errors.city && (
                      <p className="text-xs text-red-500">
                        {errors.city.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" {...register("state")} />
                    {errors.state && (
                      <p className="text-xs text-red-500">
                        {errors.state.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    {...register("isDefault")}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="isDefault" className="text-sm font-normal">
                    Set as default address
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full">
                  {editingAddress ? "Update Address" : "Save Address"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <Card
              key={address.id}
              className={address.isDefault ? "border-primary bg-primary/5" : ""}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="uppercase text-[10px]">
                    {address.addressType}
                  </Badge>
                  {address.isDefault && (
                    <Badge variant="default" className="text-[10px] bg-primary">
                      DEFAULT
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(address)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500"
                    onClick={() => handleDelete(address.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-sm">{address.addressLine1}</p>
                {address.addressLine2 && (
                  <p className="text-sm text-muted-foreground">
                    {address.addressLine2}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {address.city}, {address.state} - {address.pincode}
                </p>
                {address.isDefault && (
                  <div className="mt-4 flex items-center gap-2 text-primary text-xs font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    Preferred Delivery Address
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No addresses saved</h3>
            <p className="text-muted-foreground mb-6">
              Add an address for a faster checkout experience.
            </p>
            <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Address
            </Button>
          </CardContent>
        </Card>
      )}
    </AccountLayout>
  );
}

function Badge({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}) {
  const variants: Record<string, string> = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-input bg-background",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
