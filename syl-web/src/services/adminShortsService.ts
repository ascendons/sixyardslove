import apiClient from "../lib/api-client";

export interface ShortResponse {
  id: string;
  fileUrl: string;
  caption?: string;
  socialUrl?: string;
  metadata?: Record<string, unknown>;
  isActive: boolean;
  displayOrder: number;
  uploadedAt: string;
  createdAt: string;
}

export interface ShortRequest {
  fileUrl: string;
  caption?: string;
  socialUrl?: string;
  metadata?: Record<string, unknown>;
  isActive?: boolean;
  displayOrder?: number;
}

const adminShortsService = {
  getAll: async (): Promise<ShortResponse[]> => {
    const res = await apiClient.get("/admin/shorts");
    return res.data;
  },

  create: async (req: ShortRequest): Promise<ShortResponse> => {
    const res = await apiClient.post("/admin/shorts", req);
    return res.data;
  },

  update: async (id: string, req: ShortRequest): Promise<ShortResponse> => {
    const res = await apiClient.put(`/admin/shorts/${id}`, req);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/shorts/${id}`);
  },

  presignVideo: async (
    fileName: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; publicUrl: string }> => {
    const res = await apiClient.post("/api/media/presign", {
      folder: "shorts",
      fileName,
      contentType,
    });
    return res.data;
  },
};

export default adminShortsService;
