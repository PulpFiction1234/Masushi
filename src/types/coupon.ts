export interface DiscountCode {
  id: number;
  code: string;
  percent?: number | null;
  amount?: number | null;
  expires_at?: string | null;
  single_use?: boolean | null;
  description?: string | null;
}
