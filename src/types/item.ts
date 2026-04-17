export type ItemType = "product" | "service";

export interface Item {
  id: string;
  businessId: string;
  name: string;
  sku?: string;
  type: ItemType;
  sellingPrice: number;
  purchasePrice?: number;
  taxPercent: number;
  unit: string; // pcs, kg, litre, hour, …
  active: boolean;
  /** Soft-delete marker. Hidden everywhere when true. */
  deleted?: boolean;
  description?: string;
  // Inventory — UI is visible but the feature is not active yet.
  openingStock?: number;
  reorderLevel?: number;
}
