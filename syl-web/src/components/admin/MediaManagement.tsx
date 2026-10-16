import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Upload,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  ChevronRight,
  MoveUp,
  MoveDown,
  Power,
  PowerOff,
  Link as LinkIcon,
  Pencil,
} from "lucide-react";
import mediaService, {
  MediaAsset,
  MediaAssetRequest,
} from "@/services/mediaService";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const PLACEMENTS = [
  { key: "Banner", label: "Home Banner", type: "BANNER" },
  { key: "Carousel1", label: "Home Carousel 1", type: "CAROUSEL" },
  { key: "Carousel2", label: "Home Carousel 2", type: "CAROUSEL" },
  { key: "Carousel3", label: "Home Carousel 3", type: "CAROUSEL" },
  { key: "Our Journey", label: "Our Journey Section", type: "SECTION" },
  { key: "About Us", label: "About Us Section", type: "SECTION" },
  { key: "Map", label: "Interactive Map Section", type: "MAP" },
];

const SIZE_GUIDE: Record<
  string,
  { dimensions: string; aspect: string; note: string }
> = {
  Banner: {
    dimensions: "1200×780 px (desktop)",
    aspect: "16:9",
    note: "Also used at 35vh mobile, 50vh tablet heights",
  },
  Carousel1: {
    dimensions: "1600×900 px",
    aspect: "16:9",
    note: "Main carousel - largest of the three",
  },
  Carousel2: {
    dimensions: "1200×675 px",
    aspect: "16:9",
    note: "Side carousel slot",
  },
  Carousel3: {
    dimensions: "1200×675 px",
    aspect: "16:9",
    note: "Side carousel slot",
  },
  "Our Journey": {
    dimensions: "1200×800 px",
    aspect: "3:2",
    note: "Horizontal storytelling images",
  },
  "About Us": {
    dimensions: "1200×1500 px",
    aspect: "4:5",
    note: "Portrait hero style",
  },
  Map: {
    dimensions: "1200×600 px",
    aspect: "16:9",
    note: "India map section background",
  },
};

export const MediaManagement: React.FC = () => {
  const [selectedPlacement, setSelectedPlacement] = useState(PLACEMENTS[0]);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<MediaAssetRequest>({
    type: "",
    placement: "",
    imageUrl: "",
    title: "",
    subtitle: "",
    linkUrl: "",
    displayOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    loadAssets();
  }, [selectedPlacement]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const data = await mediaService.getAssetsByPlacement(
        selectedPlacement.key,
      );
      setAssets(
        data.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
      );
    } catch (error) {
      console.error("Failed to load assets", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load media assets",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setEditingAsset(null);
    setFormData({
      type: selectedPlacement.type,
      placement: selectedPlacement.key,
      imageUrl: "",
      title: "",
      subtitle: "",
      linkUrl: "",
      displayOrder:
        assets.length > 0
          ? Math.max(...assets.map((a) => a.displayOrder || 0)) + 1
          : 0,
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (asset: MediaAsset) => {
    setEditingAsset(asset);
    setFormData({
      type: asset.type,
      placement: asset.placement,
      imageUrl: asset.imageUrl,
      title: asset.title || "",
      subtitle: asset.subtitle || "",
      linkUrl: asset.linkUrl || "",
      displayOrder: asset.displayOrder ?? 0,
      isActive: asset.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const url = await mediaService.uploadFile("site-media", file);
      setFormData((prev) => ({ ...prev, imageUrl: url }));
      toast({ title: "Upload successful" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Could not upload image",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!formData.imageUrl) {
      toast({ variant: "destructive", title: "Image required" });
      return;
    }

    try {
      if (editingAsset) {
        await mediaService.updateAsset(editingAsset.id, formData);
        toast({ title: "Asset updated" });
      } else {
        await mediaService.createAsset(formData);
        toast({ title: "Asset created" });
      }
      setIsDialogOpen(false);
      loadAssets();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: "Could not save media asset",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    try {
      await mediaService.deleteAsset(id);
      toast({ title: "Asset deleted" });
      loadAssets();
    } catch (error) {
      toast({ variant: "destructive", title: "Delete failed" });
    }
  };

  const handleToggleActive = async (asset: MediaAsset) => {
    try {
      const request: MediaAssetRequest = {
        type: asset.type,
        placement: asset.placement,
        imageUrl: asset.imageUrl,
        title: asset.title,
        subtitle: asset.subtitle,
        linkUrl: asset.linkUrl,
        displayOrder: asset.displayOrder,
        isActive: !asset.isActive,
      };
      await mediaService.updateAsset(asset.id, request);
      loadAssets();
    } catch (error) {
      toast({ variant: "destructive", title: "Toggle failed" });
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const newAssets = [...assets];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= assets.length) return;

    // Swap display orders
    const temp = newAssets[index].displayOrder;
    newAssets[index].displayOrder = newAssets[targetIndex].displayOrder;
    newAssets[targetIndex].displayOrder = temp;

    try {
      await Promise.all([
        mediaService.updateAsset(newAssets[index].id, {
          ...newAssets[index],
          displayOrder: newAssets[index].displayOrder,
        } as MediaAssetRequest),
        mediaService.updateAsset(newAssets[targetIndex].id, {
          ...newAssets[targetIndex],
          displayOrder: newAssets[targetIndex].displayOrder,
        } as MediaAssetRequest),
      ]);
      loadAssets();
    } catch (error) {
      toast({ variant: "destructive", title: "Reorder failed" });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 mt-6">
      {/* Sidebar for Placements */}
      <div className="w-full lg:w-72 shrink-0">
        <Card className="border-2 rounded-2xl overflow-hidden shadow-sm">
          <CardHeader className="bg-muted/30 border-b p-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-forest">
              Placements
            </CardTitle>
          </CardHeader>
          <div className="p-2 space-y-1">
            {PLACEMENTS.map((p) => (
              <button
                key={p.key}
                onClick={() => setSelectedPlacement(p)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-sm font-medium",
                  selectedPlacement.key === p.key
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <div className="flex flex-col items-start">
                  <span>{p.label}</span>
                  <span
                    className={cn(
                      "text-[10px] uppercase font-bold",
                      selectedPlacement.key === p.key
                        ? "text-white/60"
                        : "text-muted-foreground/60",
                    )}
                  >
                    {p.type}
                  </span>
                </div>
                <ChevronRight
                  className={cn(
                    "w-4 h-4",
                    selectedPlacement.key === p.key
                      ? "opacity-100"
                      : "opacity-0",
                  )}
                />
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Main Assets View */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold text-forest">
              {selectedPlacement.label}
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage images and metadata for this section.
            </p>
            {SIZE_GUIDE[selectedPlacement.key] && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-lg text-xs font-medium text-primary/80">
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="font-bold">Ideal size:</span>
                <span>{SIZE_GUIDE[selectedPlacement.key].dimensions}</span>
                <span className="text-primary/50">•</span>
                <span className="font-bold">
                  {SIZE_GUIDE[selectedPlacement.key].aspect}
                </span>
                <span className="text-primary/50">•</span>
                <span className="text-muted-foreground">
                  {SIZE_GUIDE[selectedPlacement.key].note}
                </span>
              </div>
            )}
          </div>
          <Button
            onClick={handleOpenAddDialog}
            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl px-6"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Media
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : assets.length === 0 ? (
          <Card className="border-2 border-dashed rounded-3xl py-20 flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
            <ImageIcon className="w-16 h-16 mb-4 opacity-10" />
            <p className="text-lg font-bold opacity-30">
              No Media Assets Found
            </p>
            <Button
              variant="link"
              onClick={handleOpenAddDialog}
              className="text-primary font-bold mt-2"
            >
              Upload your first image
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assets.map((asset, index) => (
              <Card
                key={asset.id}
                className="border-2 rounded-2xl overflow-hidden group shadow-sm flex flex-col"
              >
                <div className="aspect-[16/9] relative bg-muted/30 overflow-hidden border-b">
                  <img
                    src={asset.imageUrl}
                    alt={asset.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest text-white shadow-sm",
                        asset.isActive ? "bg-green-500" : "bg-gray-400",
                      )}
                    >
                      {asset.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-black/50 text-white shadow-sm">
                      Order: {asset.displayOrder}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 rounded-lg shadow-md hover:bg-primary hover:text-white"
                      onClick={() => handleOpenEditDialog(asset)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4 flex-1 flex flex-col gap-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-forest line-clamp-1">
                      {asset.title || "No Title"}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {asset.subtitle || "No description provided."}
                    </p>
                    {asset.linkUrl && (
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-primary truncate">
                        <LinkIcon className="w-3 h-3" />
                        {asset.linkUrl}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-muted"
                        disabled={index === 0}
                        onClick={() => handleMove(index, "up")}
                      >
                        <MoveUp className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-muted"
                        disabled={index === assets.length - 1}
                        onClick={() => handleMove(index, "down")}
                      >
                        <MoveDown className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className={cn(
                          "h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest",
                          asset.isActive
                            ? "text-amber-600 hover:bg-amber-50"
                            : "text-green-600 hover:bg-green-50",
                        )}
                        onClick={() => handleToggleActive(asset)}
                      >
                        {asset.isActive ? (
                          <PowerOff className="w-3.5 h-3.5 mr-1" />
                        ) : (
                          <Power className="w-3.5 h-3.5 mr-1" />
                        )}
                        {asset.isActive ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(asset.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="sm:max-w-[600px] rounded-3xl"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold text-forest">
              {editingAsset ? "Edit Media Asset" : "Add New Media"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    Upload Image
                  </Label>
                  {SIZE_GUIDE[selectedPlacement.key] && (
                    <span className="text-[10px] text-muted-foreground/60 font-medium">
                      {SIZE_GUIDE[selectedPlacement.key].dimensions} •{" "}
                      {SIZE_GUIDE[selectedPlacement.key].aspect}
                    </span>
                  )}
                </div>
                <div className="relative group aspect-video rounded-2xl border-2 border-dashed border-primary/20 overflow-hidden bg-muted/10 flex flex-col items-center justify-center gap-2">
                  {formData.imageUrl ? (
                    <>
                      <img
                        src={formData.imageUrl}
                        className="w-full h-full object-cover"
                        alt="Preview"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          Change
                        </Button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex flex-col items-center p-4"
                    >
                      {uploading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      ) : (
                        <Upload className="w-8 h-8 text-primary/50" />
                      )}
                      <span className="text-xs font-bold text-primary/70 mt-2">
                        {uploading ? "Uploading..." : "Click to upload"}
                      </span>
                    </button>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Or Image URL
                </Label>
                <Input
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                  placeholder="https://..."
                  className="rounded-xl border-2"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Title
                </Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Welcome to Six Yards Love"
                  className="rounded-xl border-2"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Subtitle / Description
                </Label>
                <textarea
                  value={formData.subtitle}
                  onChange={(e) =>
                    setFormData({ ...formData, subtitle: e.target.value })
                  }
                  placeholder="Shop our latest collections..."
                  className="w-full min-h-[80px] rounded-xl border-2 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Link URL
                </Label>
                <Input
                  value={formData.linkUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, linkUrl: e.target.value })
                  }
                  placeholder="/shop"
                  className="rounded-xl border-2"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="asset-active"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-2 border-primary"
                />
                <Label
                  htmlFor="asset-active"
                  className="text-sm font-bold text-forest"
                >
                  Show on Website
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="rounded-xl border-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-white px-8 rounded-xl font-bold shadow-lg shadow-primary/20"
            >
              Secure Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
