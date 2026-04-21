export type RoomType = "kitchen" | "bathroom" | "living-room" | "bedroom";

export type ProjectStatus = "draft" | "saved";

export type UploadedRoomImage = {
  id: string;
  fileName: string;
  label: string;
  addedAt: string;
};

export type RenovationStyle = {
  id: string;
  name: string;
  description: string;
};

export type WizardAnswers = {
  roomType: RoomType;
  roomSize: "small" | "medium" | "large";
  renovationGoal: "cosmetic-refresh" | "functional-upgrade" | "resale-prep";
  budgetRange: "under-5000" | "5000-15000" | "15000-30000";
  priority: "cost" | "speed" | "durability" | "appearance";
  scopeItems: string[];
  notes: string;
};

export type EstimateLineItem = {
  label: string;
  low: number;
  high: number;
  explanation: string;
};

export type RenovationEstimate = {
  lowTotal: number;
  highTotal: number;
  lineItems: EstimateLineItem[];
  assumptions: string[];
};

export type ProjectSession = {
  id: string;
  name: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  uploadedImages: UploadedRoomImage[];
  selectedStyle?: RenovationStyle;
  wizardAnswers?: WizardAnswers;
  estimate?: RenovationEstimate;
};

