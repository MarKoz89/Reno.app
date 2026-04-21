import type {
  QualityLevel,
  RenovationScope,
  RoomType,
} from "@/features/projects/types";

export type ScopeItemId =
  | "prep-protection"
  | "removal-disposal"
  | "paint-wall-prep"
  | "flooring"
  | "lighting"
  | "fixtures-hardware"
  | "cabinets-storage"
  | "countertops"
  | "backsplash"
  | "tile-waterproofing"
  | "plumbing-electrical-allowance";

export type EstimateCategory =
  | "preparation"
  | "demolition"
  | "finishes"
  | "fixtures"
  | "systems"
  | "contingency";

export type PricingUnit = "fixed" | "m2" | "item";

export type CostBand = {
  low: number;
  mid: number;
  high: number;
};

export type ScopeItemRule = {
  id: ScopeItemId;
  label: string;
  category: EstimateCategory;
  unit: PricingUnit;
  quantityBasis: "fixed" | "room-size" | "room-template";
  defaultQuantity: number;
  roomTypes: RoomType[];
  laborUnitCost: CostBand;
  materialUnitCostByQuality: Record<QualityLevel, CostBand>;
  explanation: string;
};

export type RoomPricingTemplate = {
  roomType: RoomType;
  defaultRoomSizeM2: number;
  realisticSizeM2: {
    min: number;
    max: number;
  };
  scopeItemsByRenovationScope: Record<RenovationScope, ScopeItemId[]>;
  quantityOverrides?: Partial<Record<ScopeItemId, number>>;
};

export type ScopeModifier = {
  id: RenovationScope;
  label: string;
  description: string;
  laborMultiplier: number;
  materialMultiplier: number;
  contingencyRate: number;
};

export type QualityBand = {
  id: QualityLevel;
  label: string;
  description: string;
};

export type MarketFactor = {
  id: string;
  label: string;
  laborMultiplier: number;
  materialMultiplier: number;
};

export type PricingCatalog = {
  catalogVersion: string;
  currency: "USD";
  defaultRoomType: RoomType;
  defaultRenovationScope: RenovationScope;
  defaultQualityLevel: QualityLevel;
  defaultMarketFactorId: string;
  scopeModifiers: Record<RenovationScope, ScopeModifier>;
  qualityBands: Record<QualityLevel, QualityBand>;
  marketFactors: Record<string, MarketFactor>;
  scopeItemRules: Record<ScopeItemId, ScopeItemRule>;
  exclusions: string[];
};
