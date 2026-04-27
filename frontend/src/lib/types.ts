export type UserRole =
  | "admin"
  | "staff"
  | "client"
  | "video_editor"
  | "developer_designer"
  | "project_manager";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export type ClientStatus = "active" | "paused" | "churned";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  package: string;
  monthlyValue: number;
  status: ClientStatus;
  invoiceDay: number;
  assignedTo: string;
  contractUrl?: string;
  portalActive: boolean;
  onboardingProgress: number;
  monthlyProgress: number;
  createdAt: string;
}

export type InvoiceStatus = "unpaid" | "paid" | "overdue";

export interface Invoice {
  id: string;
  reference: string;
  clientId: string;
  clientName: string;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
  paidAt?: string;
  createdAt: string;
}

export type PipelineStage =
  | "outreach"
  | "meeting"
  | "proposal"
  | "negotiation"
  | "signed";

export interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail?: string;
  value: number;
  stage: PipelineStage;
  nextAction: string;
  assignedTo: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type VideoStatus = "pending" | "approved" | "edit_requested";

export type VideoProductionStage = "scripting" | "filming" | "editing" | "review" | "approved";

export interface Video {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  platform: "instagram" | "tiktok" | "youtube" | "facebook" | "linkedin";
  status: VideoStatus;
  productionStage: VideoProductionStage;
  dueDate: string;
  videoUrl: string;
  feedback?: string;
  createdAt: string;
}

export interface VideoComment {
  id: string;
  videoId: string;
  author: string;
  role: "team" | "client";
  type: "comment" | "feedback" | "approval";
  message: string;
  createdAt: string;
  timecode?: string;
  resolved?: boolean;
  parentId?: string;
}

export type ContentType = "post" | "reel" | "shoot" | "upload";

export interface ContentItem {
  id: string;
  clientId: string;
  clientName: string;
  type: ContentType;
  title: string;
  dueDate: string;
  notes?: string;
  createdAt: string;
}

export interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Quote {
  id: string;
  reference: string;
  clientId: string;
  clientName: string;
  items: QuoteItem[];
  subtotal: number;
  vat: number;
  total: number;
  validUntil: string;
  status: "draft" | "sent" | "accepted" | "declined";
  createdAt: string;
}

export interface Contract {
  id: string;
  clientId: string;
  clientName: string;
  package: string;
  startDate: string;
  duration: number;
  specialTerms?: string;
  fileUrl?: string;
  status: "draft" | "sent" | "signed";
  createdAt: string;
}

export interface OnboardingChecklist {
  clientId: string;
  contract: boolean;
  payment: boolean;
  brandAssets: boolean;
  accessGranted: boolean;
  kickOffCall: boolean;
  questionnaire: boolean;
  firstDraft: boolean;
  firstPost: boolean;
}

export interface DashboardStats {
  mrr: number;
  mrrTrend: { month: string; value: number }[];
  unpaidInvoicesCount: number;
  unpaidInvoicesTotal: number;
  pipelineValue: number;
  urgentTasksCount: number;
  pendingVideosCount: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  userId?: string;
  userName?: string;
}

export interface AppNotification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  createdAt: string;
  read: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
