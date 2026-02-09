const usdtFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export function formatUsdt(value: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0.00";
  return usdtFormatter.format(n);
}

export function formatInteger(value: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return integerFormatter.format(n);
}

