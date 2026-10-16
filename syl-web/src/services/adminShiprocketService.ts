import apiClient from "../lib/api-client";

// ─── Rate Calculator ──────────────────────────────────────────────────────────

export interface CourierOption {
  courierCompanyId: number;
  courierName: string;
  rate: number;
  freightCharge: number;
  rtoCharges: number;
  etd: string;
  etdHours: number;
  estimatedDeliveryDays: string;
  cod: number;
  codCharges: number;
  chargeWeight: number;
  minWeight: number;
  isSurface: boolean;
  blocked: number;
  rating: number;
  zone: string;
  reason: string;
}

export interface ShiprocketRateResponse {
  data?: {
    availableCourierCompanies?: CourierOption[];
  };
}

// ─── Tracking ─────────────────────────────────────────────────────────────────

export interface TrackActivity {
  date: string;
  activity: string;
  location: string;
  srStatus: string;
}

export interface ShipmentTrack {
  id: number;
  awbCode: string;
  currentStatus: string;
  courierName: string;
  etd: string;
  deliveredDate: string;
  origin: string;
  destination: string;
}

export interface ShiprocketTrackResponse {
  trackingData?: {
    trackStatus: number;
    shipmentTrack?: ShipmentTrack[];
    shipmentTrackActivities?: TrackActivity[];
  };
}

// ─── Pickup Addresses ─────────────────────────────────────────────────────────

export interface PickupAddress {
  id: number;
  pickupLocation: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  address2: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
  status: number;
}

export interface ShiprocketPickupAddressesResponse {
  data?: {
    shippingAddress?: PickupAddress[];
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

const adminShiprocketService = {
  getShippingRates: async (
    pickupPostcode: string,
    deliveryPostcode: string,
    weight: number,
    cod: number = 0,
  ): Promise<ShiprocketRateResponse> => {
    const response = await apiClient.get("/admin/shiprocket/rates", {
      params: {
        pickup_postcode: pickupPostcode,
        delivery_postcode: deliveryPostcode,
        weight,
        cod,
      },
    });
    // Map snake_case backend keys → camelCase CourierOption fields
    const raw = response.data?.data?.available_courier_companies ?? [];
    return {
      ...response.data,
      data: {
        ...response.data?.data,
        availableCourierCompanies: raw.map((c: any) => ({
          courierCompanyId: c.courier_company_id,
          courierName: c.courier_name,
          rate: c.rate,
          freightCharge: c.freight_charge,
          rtoCharges: c.rto_charges,
          etd: c.etd,
          etdHours: c.etd_hours,
          estimatedDeliveryDays: c.estimated_delivery_days,
          cod: c.cod,
          codCharges: c.cod_charges,
          chargeWeight: c.charge_weight,
          minWeight: c.min_weight,
          isSurface: c.is_surface,
          blocked: c.blocked ?? 0,
          rating: c.rating,
          zone: c.zone,
          reason: c.reason ?? "",
        })),
      },
    };
  },

  getDeliveryEstimate: async (
    pickupPostcode: string,
    deliveryPostcode: string,
    weight: number,
    courierId?: number,
  ): Promise<Record<string, unknown>> => {
    const params: Record<string, unknown> = {
      pickup_postcode: pickupPostcode,
      delivery_postcode: deliveryPostcode,
      weight,
    };
    if (courierId) params.courier_id = courierId;
    const response = await apiClient.get(
      "/admin/shiprocket/delivery-estimate",
      { params },
    );
    return response.data;
  },

  listOrders: async (
    page: number = 1,
    perPage: number = 20,
  ): Promise<Record<string, unknown>> => {
    const response = await apiClient.get("/admin/shiprocket/orders", {
      params: { page, per_page: perPage },
    });
    return response.data;
  },

  trackOrder: async (awb: string): Promise<ShiprocketTrackResponse> => {
    const response = await apiClient.get(`/admin/shiprocket/track/${awb}`);
    return response.data;
  },

  assignCourier: async (
    shipmentId: number,
    courierId: number,
  ): Promise<Record<string, unknown>> => {
    const response = await apiClient.post("/admin/shiprocket/ship", {
      shipment_id: shipmentId,
      courier_id: courierId,
    });
    return response.data;
  },

  schedulePickup: async (
    shipmentIds: number[],
  ): Promise<Record<string, unknown>> => {
    const response = await apiClient.post("/admin/shiprocket/schedule-pickup", {
      shipment_ids: shipmentIds,
    });
    return response.data;
  },

  generateLabel: async (
    shipmentIds: number[],
  ): Promise<Record<string, unknown>> => {
    const response = await apiClient.get("/admin/shiprocket/label", {
      params: { shipment_ids: shipmentIds.join(",") },
    });
    return response.data;
  },

  cancelOrders: async (
    shiprocketOrderIds: number[],
  ): Promise<Record<string, unknown>> => {
    const response = await apiClient.post("/admin/shiprocket/cancel", {
      shiprocket_order_ids: shiprocketOrderIds,
    });
    return response.data;
  },

  listPickupAddresses: async (): Promise<ShiprocketPickupAddressesResponse> => {
    const response = await apiClient.get("/admin/shiprocket/pickup-addresses");
    return response.data;
  },
};

export default adminShiprocketService;
