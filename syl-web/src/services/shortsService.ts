import apiClient from "../lib/api-client";
import { ShortResponse } from "./adminShortsService";

const shortsService = {
  getActive: async (): Promise<ShortResponse[]> => {
    const res = await apiClient.get("/api/shorts");
    return res.data;
  },
};

export default shortsService;
export type { ShortResponse };
