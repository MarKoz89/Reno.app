export type RoomType = "kitchen" | "bathroom" | "living-room" | "bedroom";

export type ProjectStatus = "draft" | "saved";

export type RenovationScope = "light" | "standard" | "full";

export type QualityLevel = "budget" | "standard" | "premium";

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
  roomSizeM2?: number;
  renovationScope?: RenovationScope;
  qualityLevel?: QualityLevel;
  notes: string;
};

export type EstimateLineItem = {
  label: string;
  low: number;
  mid: number;
  high: number;
  explanation: string;
};

export type RenovationEstimate = {
  engineVersion: "v1";
  lowTotal: number;
  midTotal: number;
  highTotal: number;
  lineItems: EstimateLineItem[];
  assumptions: string[];
  exclusions: string[];
  confidenceScore: number;
  confidenceReasons: string[];
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
