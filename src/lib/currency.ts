// Base (functional) currency of the company, set from the tenant after sign-in. Expenses and other ledger
// amounts are shown in it; documents show their own currency.
let base = 'AED';

export function setBaseCurrency(code?: string | null) {
  const c = String(code || '').trim().toUpperCase();
  if (/^[A-Z]{3,10}$/.test(c)) base = c;
}

export function getBaseCurrency() {
  return base;
}
