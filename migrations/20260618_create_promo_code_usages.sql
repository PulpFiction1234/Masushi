-- Tracks one-time promo usage per user account.
CREATE TABLE IF NOT EXISTS public.promo_code_usages (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promo_code TEXT NOT NULL,
  order_id BIGINT REFERENCES public.orders(id) ON DELETE SET NULL,
  discount_percent INTEGER,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_promo_code_usages_user_code_unique
  ON public.promo_code_usages(user_id, promo_code);

CREATE INDEX IF NOT EXISTS idx_promo_code_usages_promo_code
  ON public.promo_code_usages(promo_code);