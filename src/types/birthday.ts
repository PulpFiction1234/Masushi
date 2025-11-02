export interface BirthdayEligibility {
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
}
