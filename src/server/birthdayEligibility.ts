import supabaseAdmin from './supabase';
import {
  BIRTHDAY_DISCOUNT_PERCENT,
  BIRTHDAY_COUPON_CODE,
  BIRTHDAY_MIN_MONTHS,
  BIRTHDAY_MIN_ORDERS,
  getBirthdayWindow,
  getNextBirthdayWindow,
  isWithinBirthdayWindow,
  monthsBetween,
} from '@/utils/birthday';

export type BirthdayEligibilityResult = {
  birthday: string | null;
  accountAgeMonths: number;
  orderCount: number;
  withinWindow: boolean;
  eligibleNow: boolean;
  requirements: {
    hasBirthday: boolean;
    hasMinAccountAge: boolean;
    hasMinOrders: boolean;
  };
  window?: { start: string; end: string } | null;
  nextWindow?: { start: string; end: string } | null;
  discountPercent: number;
};

export const computeBirthdayEligibility = async (
  userId: string,
  reference: Date = new Date(),
): Promise<BirthdayEligibilityResult> => {
  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('birthday, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const { count: orderCountRaw, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (ordersError) {
    throw ordersError;
  }

  const birthday: string | null = profileData?.birthday ?? null;
  const accountAgeMonths = monthsBetween(profileData?.created_at ?? null, reference);
  const orderCount = typeof orderCountRaw === 'number' ? orderCountRaw : 0;
  const withinWindow = birthday ? isWithinBirthdayWindow(birthday, reference) : false;

  const windowRaw = birthday ? getBirthdayWindow(birthday, reference) : null;
  const nextWindowRaw = birthday ? getNextBirthdayWindow(birthday, reference) : null;

  const hasBirthday = Boolean(birthday);
  const hasMinAccountAge = accountAgeMonths >= BIRTHDAY_MIN_MONTHS;
  const hasMinOrders = orderCount >= BIRTHDAY_MIN_ORDERS;

  const eligibleNow = hasBirthday && hasMinAccountAge && hasMinOrders && withinWindow;

  const serializeWindow = (win: typeof windowRaw) =>
    win
      ? {
          start: win.start.toISOString(),
          end: win.end.toISOString(),
        }
      : null;

  return {
    birthday,
    accountAgeMonths,
    orderCount,
    withinWindow,
    eligibleNow,
    requirements: {
      hasBirthday,
      hasMinAccountAge,
      hasMinOrders,
    },
    window: serializeWindow(windowRaw),
    nextWindow: serializeWindow(nextWindowRaw),
    discountPercent: BIRTHDAY_DISCOUNT_PERCENT,
  };
};

export { BIRTHDAY_COUPON_CODE, BIRTHDAY_MIN_MONTHS, BIRTHDAY_MIN_ORDERS };
