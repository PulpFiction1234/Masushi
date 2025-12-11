export type GiftCardStatus = 'pending' | 'active' | 'disabled' | 'exhausted';

export interface GiftCard {
  id: number;
  code: string;
  amount_total: number;
  amount_remaining: number;
  status: GiftCardStatus;
  purchased_by_user_id: string | null;
  purchaser_email: string | null;
  purchaser_name: string | null;
  recipient_email: string | null;
  recipient_name: string | null;
  claimed_by_user_id: string | null;
  claimed_at: string | null;
  activated_at: string | null;
  activated_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GiftCardUsage {
  id: number;
  gift_card_id: number;
  order_id: number | null;
  user_id: string | null;
  amount_used: number;
  used_at: string;
}
