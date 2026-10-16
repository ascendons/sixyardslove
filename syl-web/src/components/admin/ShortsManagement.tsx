import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Pencil,
  Upload,
  Loader2,
  Video,
  ExternalLink,
  Power,
  PowerOff,
} from "lucide-react";
import { toast } from "sonner";
import adminShortsService, {
  ShortResponse,
  ShortRequest,
} from "@/services/adminShortsService";
import { cn } from "@/lib/utils";

const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

const emptyForm = (): ShortRequest => ({
  fileUrl: "",
  caption: "",
  socialUrl: "",
  isActive: true,
  displayOrder: 0,
});

export const ShortsManagement: React.FC = () => {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ShortResponse | null>(null);
  const [form, setForm] = useState<ShortRequest>(emptyForm());
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: shorts = [], isLoading } = useQuery({
    queryKey: ["admin-shorts"],
    queryFn: adminShortsService.getAll,
  });

  const createMut = useMutation({
    mutationFn: adminShortsService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-shorts"] });
      toast.success("Short created");
      closeDialog();
    },
    onError: () => toast.error("Failed to save short"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, req }: { id: string; req: ShortRequest }) =>
      adminShortsService.update(id, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-shorts"] });
      toast.success("Short updated");
      closeDialog();
    },
    onError: () => toast.error("Failed to update short"),
  });

  const deleteMut = useMutation({
    mutationFn: adminShortsService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-shorts"] });
      toast.success("Short deleted");
    },
    onError: () => toast.error("Failed to delete short"),
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (s: ShortResponse) => {
    setEditing(s);
    setForm({
      fileUrl: s.fileUrl,
      caption: s.caption ?? "",
      socialUrl: s.socialUrl ?? "",
      isActive: s.isActive,
      displayOrder: s.displayOrder,
      metadata: s.metadata,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm());
    setUploadProgress(0);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_VIDEO_BYTES) {
      toast.error("Video must be under 100 MB");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const { uploadUrl, publicUrl } = await adminShortsService.presignVideo(
        file.name,
        file.type,
      );

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable)
            setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300 ? resolve() : reject();
        xhr.onerror = reject;
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      setForm((f) => ({ ...f, fileUrl: publicUrl }));
      toast.success("Video uploaded");
    } catch {
      toast.error("Video upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!form.fileUrl) {
      toast.error("Please upload a video first");
      return;
    }
    if (editing) {
      updateMut.mutate({ id: editing.id, req: form });
    } else {
      createMut.mutate(form);
    }
  };

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-6 mt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Shorts / Reels</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Upload short videos shown on the homepage. Max 100 MB per video,
            stored in S3 (shorts/).
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" /> Add Short
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : shorts.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center text-muted-foreground">
            <Video className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No shorts yet. Upload your first reel.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {shorts.map((s) => (
            <Card key={s.id} className="overflow-hidden">
              <div className="relative aspect-[9/16] bg-black">
                <video
                  src={s.fileUrl}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                />
                <Badge
                  className={cn(
                    "absolute top-2 right-2 text-xs",
                    s.isActive ? "bg-green-600" : "bg-gray-500",
                  )}
                >
                  {s.isActive ? "Active" : "Hidden"}
                </Badge>
              </div>
              <CardContent className="p-3 space-y-2">
                {s.caption && (
                  <p className="text-sm font-medium line-clamp-2">
                    {s.caption}
                  </p>
                )}
                {s.socialUrl && (
                  <a
                    href={s.socialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" /> Social link
                  </a>
                )}
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1"
                    onClick={() => openEdit(s)}
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteMut.mutate(s.id)}
                    disabled={deleteMut.isPending}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Short" : "Add Short"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Video upload */}
            <div className="space-y-2">
              <Label>Video (max 100 MB)</Label>
              <input
                ref={fileRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              {form.fileUrl ? (
                <div className="space-y-2">
                  <video
                    src={form.fileUrl}
                    controls
                    className="w-full rounded-lg max-h-48 bg-black"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" /> Replace video
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center gap-3 hover:border-primary transition-colors"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">
                        Uploading… {uploadProgress}%
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload video
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <Input
                id="caption"
                value={form.caption ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, caption: e.target.value }))
                }
                placeholder="Short description…"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="socialUrl">Social Media URL</Label>
              <Input
                id="socialUrl"
                value={form.socialUrl ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, socialUrl: e.target.value }))
                }
                placeholder="https://instagram.com/reel/..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  min={0}
                  value={form.displayOrder ?? 0}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      displayOrder: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() =>
                    setForm((f) => ({ ...f, isActive: !f.isActive }))
                  }
                >
                  {form.isActive ? (
                    <>
                      <Power className="w-4 h-4 text-green-600" /> Active
                    </>
                  ) : (
                    <>
                      <PowerOff className="w-4 h-4 text-gray-400" /> Hidden
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || uploading}
              className="gap-2"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? "Save Changes" : "Create Short"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
