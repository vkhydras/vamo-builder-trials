export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  pineapple_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  url: string | null;
  screenshot_url: string | null;
  status: "active" | "listed" | "sold" | "archived";
  progress_score: number;
  valuation_low: number;
  valuation_high: number;
  why_built: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  project_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  extracted_intent: string | null;
  tag: "feature" | "customer" | "revenue" | "ask" | "general" | null;
  pineapples_earned: number;
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  project_id: string;
  user_id: string;
  event_type: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface RewardLedgerEntry {
  id: string;
  user_id: string;
  project_id: string | null;
  event_type: string;
  reward_amount: number;
  balance_after: number;
  idempotency_key: string;
  created_at: string;
}

export interface Redemption {
  id: string;
  user_id: string;
  amount: number;
  reward_type: string;
  status: "pending" | "fulfilled" | "failed";
  metadata: Record<string, unknown>;
  created_at: string;
  fulfilled_at: string | null;
}

export interface Listing {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string | null;
  asking_price_low: number | null;
  asking_price_high: number | null;
  timeline_snapshot: unknown;
  screenshots: string[];
  metrics: Record<string, unknown>;
  status: "active" | "sold" | "withdrawn";
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: string;
  project_id: string;
  user_id: string;
  offer_low: number;
  offer_high: number;
  reasoning: string | null;
  signals: Record<string, unknown>;
  status: "active" | "expired" | "accepted";
  created_at: string;
  expires_at: string | null;
}

export interface ChatResponse {
  reply: string;
  intent: "feature" | "customer" | "revenue" | "ask" | "general";
  business_update: {
    progress_delta: number;
    traction_signal: string | null;
    valuation_adjustment: "up" | "down" | "none";
  };
}
