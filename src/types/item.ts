export type ItemType = "product" | "service";

export interface Item {
  id: string;
  businessId: string;
  name: string;
  sku?: string;
  type: ItemType;
  sellingPrice: number;
  taxPercent: number;
  unit: string; // e.g. PCS, BOX, HRS
  active: boolean;
  /** Soft-delete marker. Hidden everywhere when true. */
  deleted?: boolean;
  description?: string;
}
