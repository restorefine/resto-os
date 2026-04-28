export type PlatformName =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "facebook"
  | "twitter"
  | "linkedin";

export interface CalendarPlatformData {
  id?: string;
  name: PlatformName;
  url: string;
}

export interface CalendarPost {
  id: string;
  clientId: string;
  date: string;
  description: string;
  platforms: CalendarPlatformData[];
  createdAt: string;
  updatedAt: string;
}
