// Map price tiers to actual prices
const PRICE_TIERS: Record<number, number> = {
  1: 125,
  2: 100,
  3: 85,
  4: 50
};

export function getPriceForTier(tier: number): number {
  return PRICE_TIERS[tier] ?? 0;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
}
