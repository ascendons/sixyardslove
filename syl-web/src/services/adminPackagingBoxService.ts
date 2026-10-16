import apiClient from "../lib/api-client";

export interface PackagingBox {
  id: string;
  name: string;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  maxWeightKg: number;
  isActive: boolean;
  volumeCm3: number;
}

export interface PackagingBoxRequest {
  id?: string;
  name: string;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  maxWeightKg: number;
  isActive?: boolean;
}

const packagingBoxService = {
  // Public endpoint — usable at checkout without admin auth.
  // Returns active boxes sorted by volume ascending (smallest first).
  getActiveBoxesPublic: async (): Promise<PackagingBox[]> => {
    const response = await apiClient.get("/api/packaging-boxes/active");
    return response.data || [];
  },

  getAllBoxes: async (): Promise<PackagingBox[]> => {
    const response = await apiClient.get("/admin/packaging-boxes");
    return response.data || [];
  },

  getActiveBoxes: async (): Promise<PackagingBox[]> => {
    const response = await apiClient.get("/admin/packaging-boxes/active");
    return response.data || [];
  },

  createBox: async (box: PackagingBoxRequest): Promise<PackagingBox> => {
    const response = await apiClient.post("/admin/packaging-boxes", box);
    return response.data;
  },

  updateBox: async (
    id: string,
    box: PackagingBoxRequest,
  ): Promise<PackagingBox> => {
    const response = await apiClient.put(`/admin/packaging-boxes/${id}`, box);
    return response.data;
  },

  deleteBox: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/packaging-boxes/${id}`);
  },
};

export default packagingBoxService;
