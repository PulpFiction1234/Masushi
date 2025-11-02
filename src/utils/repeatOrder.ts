export const REPEAT_ORDER_META_KEY = "masushi_repeat_checkout_meta";

export type RepeatOrderMeta = {
  orderId: number;
  deliveryType?: "delivery" | "retiro" | null;
  address?: string | null;
  createdAt: number;
};
