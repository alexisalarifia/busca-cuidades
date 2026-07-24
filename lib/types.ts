// Hand-written row types mirroring supabase/migrations (brief: no ORM).

export type TripStatus = "active" | "archived";

export interface Trip {
  id: string;
  user_id: string;
  name: string;
  city: string;
  starts_on: string; // date
  ends_on: string; // date
  lodging_name: string | null;
  lodging_address: string | null;
  lodging_lat: number | null;
  lodging_lng: number | null;
  status: TripStatus;
  created_at: string;
}

export type Category =
  | "flight"
  | "ticket"
  | "accommodation"
  | "dining"
  | "excursion"
  | "transport"
  | "note";

export type SourceType = "manual" | "paste" | "url" | "screenshot" | "email";

export interface Item {
  id: string;
  trip_id: string;
  user_id: string;
  category: Category;
  kind: string;
  display_id: string;
  title: string;
  notes: string | null;
  starts_at: string | null;
  ends_at: string | null;
  venue_tz: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  visited: boolean;
  source_type: SourceType;
  source_raw: string | null;
  content_hash: string | null;
  purchase_ts: string | null;
  purchaser_contact: string | null;
  total_amount: number | null;
  currency: string | null;
  confirmation_code: string | null;
  venue_name: string | null;
  venue_address: string | null;
  confidence: number | null;
  source_issued_at: string | null;
  ingested_at: string;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  user_id: string;
  trip_id: string;
  item_id: string | null;
  storage_path: string;
  mime: string;
  bytes: number;
  taken_at: string | null;
  uploaded_at: string;
  caption: string | null;
}

export interface AskLogEntry {
  id: string;
  user_id: string;
  trip_id: string | null;
  prompt: string;
  lat: number | null;
  lng: number | null;
  source_count: number | null;
  retrieved_at: string | null;
  created_at: string;
}
