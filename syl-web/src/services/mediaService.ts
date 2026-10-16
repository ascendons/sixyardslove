import apiClient from "../lib/api-client";
import { sanitizeUrl } from "./productService";

export interface MediaAsset {
  id: string;
  type: string;
  placement: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MediaAssetRequest {
  type: string;
  placement: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
}

const mediaService = {
  async uploadFile(folder: string, file: File): Promise<string> {
    // 1. Get presigned URL from backend
    const { data } = await apiClient.post<{
      uploadUrl: string;
      publicUrl: string;
    }>("/api/media/presign", {
      folder,
      fileName: file.name,
      contentType: file.type,
    });

    // 2. Upload directly to S3 via presigned URL
    let uploadOk = false;
    let uploadHttpStatus = 0;
    try {
      const uploadResponse = await fetch(data.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      uploadOk = uploadResponse.ok;
      uploadHttpStatus = uploadResponse.status;
    } catch {
      // network/CORS error — fall through to server-side upload
    }

    // Only fall back on network error; an S3 HTTP error (403/500/etc.)
    // means the presigned URL is invalid or forbidden — retrying won't help,
    // so throw instead of silently falling through to server-side upload.
    if (uploadHttpStatus >= 400) {
      throw new Error(`S3 upload failed with HTTP ${uploadHttpStatus}`);
    }

    if (uploadOk) return data.publicUrl;

    // 3. Fallback: send file to backend server-side (bypasses CORS)
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    formData.append("fileName", file.name);
    formData.append("contentType", file.type);
    // NOTE: do NOT set Content-Type header manually — axios auto-generates
    // multipart/form-data with correct boundary, which Spring requires
    const res = await apiClient.post<{ publicUrl: string }>(
      "/api/media/upload",
      formData,
    );
    return res.data.publicUrl;
  },

  async getAssetsByPlacement(placement: string): Promise<MediaAsset[]> {
    const { data } = await apiClient.get<MediaAsset[]>("/api/media-assets", {
      params: { placement },
    });
    return data.map((asset) => ({
      ...asset,
      imageUrl: sanitizeUrl(asset.imageUrl),
    }));
  },

  async getAssetsByType(type: string): Promise<MediaAsset[]> {
    const { data } = await apiClient.get<MediaAsset[]>(
      `/api/media-assets/type/${type}`,
    );
    return data.map((asset) => ({
      ...asset,
      imageUrl: sanitizeUrl(asset.imageUrl),
    }));
  },

  async createAsset(asset: MediaAssetRequest): Promise<MediaAsset> {
    const { data } = await apiClient.post<MediaAsset>(
      "/api/admin/media-assets",
      asset,
    );
    return data;
  },

  async updateAsset(id: string, asset: MediaAssetRequest): Promise<MediaAsset> {
    const { data } = await apiClient.put<MediaAsset>(
      `/api/admin/media-assets/${id}`,
      asset,
    );
    return data;
  },

  async deleteAsset(id: string): Promise<void> {
    await apiClient.delete(`/api/admin/media-assets/${id}`);
  },
};

export default mediaService;
