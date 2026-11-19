export function formatMatterQuantity(value: string | number | null | undefined): string | null {
  const quantity = value?.toString().trim();
  if (!quantity) return null;

  if (/\d\s*kg$/i.test(quantity)) {
    return quantity.replace(/\s*kg$/i, " kg");
  }

  return /^\d[\d,.]*$/.test(quantity) ? `${quantity} kg` : quantity;
}
