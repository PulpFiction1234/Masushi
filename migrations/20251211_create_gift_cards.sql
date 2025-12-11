-- Gift cards base tables
-- Status values: pending (created, awaiting admin), active (usable), disabled (blocked), exhausted (saldo 0)

CREATE TABLE IF NOT EXISTS public.gift_cards (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  amount_total INTEGER NOT NULL CHECK (amount_total > 0),
  amount_remaining INTEGER NOT NULL CHECK (amount_remaining >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','disabled','exhausted')),
  purchased_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  purchaser_email TEXT,
  purchaser_name TEXT,
  recipient_email TEXT,
  recipient_name TEXT,
  claimed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  activated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON public.gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_purchased_by ON public.gift_cards(purchased_by_user_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_claimed_by ON public.gift_cards(claimed_by_user_id);

CREATE TABLE IF NOT EXISTS public.gift_card_usages (
  id BIGSERIAL PRIMARY KEY,
  gift_card_id BIGINT NOT NULL REFERENCES public.gift_cards(id) ON DELETE CASCADE,
  order_id BIGINT REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount_used INTEGER NOT NULL CHECK (amount_used > 0),
  used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_card_usages_card ON public.gift_card_usages(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_gift_card_usages_user ON public.gift_card_usages(user_id);

-- RLS: owners (comprador o quien la reclamó) pueden ver
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gift cards" ON public.gift_cards
  FOR SELECT USING (
    auth.uid() = purchased_by_user_id OR auth.uid() = claimed_by_user_id
  );

CREATE POLICY "Users can view gift card usages" ON public.gift_card_usages
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT purchased_by_user_id FROM public.gift_cards gc WHERE gc.id = gift_card_id
    )
    OR auth.uid() IN (
      SELECT claimed_by_user_id FROM public.gift_cards gc WHERE gc.id = gift_card_id
    )
  );

-- Nota: inserciones/actualizaciones se realizan con service role desde el backend.
