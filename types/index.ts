export type UserRole = 'admin' | 'customer';

export type EventType =
  | 'Engagement'
  | 'Reception'
  | 'Wedding'
  | 'Engagement + Reception + Wedding'
  | 'Puberty'
  | 'Baby Shower'
  | 'Outdoor Shoot'
  | 'Baby Shoot'
  | 'Corporate Events'
  | 'School / Colleges'
  | 'Other';

export type PackageType = 'Package 1' | 'Package 2' | 'Package 3' | 'Package 4' | 'Package 5' | 'Custom';

export type SessionType = 'Half Session' | 'Full Session' | '1.5 Session' | '2 Sessions' | 'Others';

export type QuotationStatus = 'Pending' | 'Confirmed' | 'Declined';

export type PaymentType = 'Initial Advance' | 'Function Advance' | 'Printing Advance' | 'Final Payment';

export type WorkflowStatus = {
  photoSelection: 'Yes' | 'No' | 'Not needed';
  albumDesign: 'Yes' | 'No' | 'Not needed';
  albumPrinting: 'Yes' | 'No' | 'Not needed';
  videoEditing: 'Yes' | 'No' | 'Not needed';
  outdoorShoot: 'Yes' | 'No' | 'Not needed';
  albumDelivery: 'Yes' | 'No' | 'Not needed';
};

export type PhotographyType = 'Traditional' | 'Candid';
export type VideographyType = 'Traditional' | 'Candid';

export type ServiceStage = 'Stage' | 'Reception' | 'Extra';

export type PhotographyService = {
  type: PhotographyType;
  stage: ServiceStage;
  cameraCount: number;
  rate: number;
  session: SessionType;
};

export type VideographyService = {
  type: VideographyType;
  stage: ServiceStage;
  cameraCount: number;
  rate: number;
  session: SessionType;
};

export type AdditionalService = {
  name: string;
  customName?: string; // For "Others" option
  session: SessionType;
  rate: number;
  quantity: number;
};

export type AdditionalServiceName =
  | 'LED Wall'
  | 'Live Streaming'
  | 'Spinning'
  | 'Live Frames'
  | 'Photo Booth'
  | 'LED Wall + Mixing Unit'
  | 'Others';

export interface Customer {
  customerId: string;
  name: string;
  mobile: string;
  email?: string;
  location?: string;
  locationCoordinates?: { lat: number; lng: number };
  createdAt: string;
}

export interface Quotation {
  quotationId: string;
  customerId: string;
  eventType: EventType;
  eventDateStart: string;
  eventDateEnd: string;
  location: string;
  locationCoordinates?: { lat: number; lng: number };
  packageType: PackageType;
  sessionType: SessionType;
  services: {
    photography?: PhotographyService[];
    videography?: VideographyService[];
    additional?: AdditionalService[];
  };
  customerTotal: number;
  manualTotal?: number; // Manual input, not calculated
  deliverables?: Deliverables;
  status: QuotationStatus;
  remarks?: string; // Remarks for declined quotations
  createdAt: string;
  confirmedAt?: string;
}

export interface Order {
  orderId: string;
  quotationId?: string;
  customerId: string;
  estimatedBudget: number;
  finalBudget: number;
  workflowStatus: WorkflowStatus;
  createdAt: string;
}

export interface Expense {
  expenseId: string;
  orderId: string;
  costHead: string;
  amount: number;
  vendorName?: string;
  description?: string;
  date: string;
}

export interface Payment {
  paymentId: string;
  orderId: string;
  paymentType: PaymentType;
  amount: number;
  date: string;
  notes?: string;
}

export interface Package {
  packageId: string;
  name: string;
  photographyRate: number;
  videographyRate: number;
  additionalServices: Record<string, number>;
}

export interface CostHead {
  photographerRate?: number;
  videographerRate?: number;
  cameraCountCost?: number;
  albumDesigning?: {
    designerName: string;
    sheets: number;
    rate: number;
  };
  videoEditing?: {
    editorName: string;
    duration: number;
    hourlyRate: number;
  };
  equipment?: number;
  otherExpenses?: number;
}

// Deliverables Types
export interface AlbumDeliverable {
  type: 'Reception Album' | 'Wedding Album' | 'Album';
  quantity: number;
}

export interface VideoDeliverable {
  traditionalVideoEdited: number; // quantity
  candidVideoTeaser: boolean;
  candidVideoHighlights: boolean;
  saveTheDateReel: boolean;
}

export interface DigitalDeliverable {
  allImagesJPEG: boolean;
  traditionalVideoPendrive: boolean;
}

export interface PrintGiftDeliverable {
  miniBook: number;
  calendar: number;
  portraitFrames: number;
}

export interface FreeService {
  aiFaceRecognition: boolean; // Included, disabled
  instantQRCode: boolean; // Included, disabled
}

export interface Deliverables {
  // New structure
  albumSize?: string;
  numberOfAlbums?: number;
  sheetsPerAlbum?: number;
  totalSheets?: number;
  totalPhotosForSelection?: number;
  customAlbumSize?: string;
  digital: DigitalDeliverable;
  printGifts: PrintGiftDeliverable;
  services?: {
    dronePhotography?: boolean;
    droneVideography?: boolean;
    preWeddingShoot?: boolean;
    postWeddingShoot?: boolean;
    outdoorShoot?: boolean;
  };
  sessionType?: string;
  others: {
    cinematicTeaser?: boolean;
    cinematicHighlight?: boolean;
    aiFaceRecognitionImageDelivery?: boolean;
    saveTheDateReels?: boolean;
    premiumAlbumBox?: boolean;
    extraFrame?: boolean;
    otherWorks?: boolean;
    otherWorksText?: string;
    albums?: string;
    videos?: string;
    digital?: string;
    printGifts?: string;
  };
  // Legacy structure for backward compatibility
  plan?: string;
  totalPhotosPerAlbum?: number;
  albums?: AlbumDeliverable[];
  videos?: VideoDeliverable;
  freeServices?: FreeService;
}
