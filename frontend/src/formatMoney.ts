/**
 * File: react/project/src/formatMoney.ts
 * Author: Frank Seely (fseely@bu.edu), 4/27/2026
 * Description: Shared currency formatting helper for consistent money display across screens.
 */


/** formats a number-like value as dollars */
export function formatMoney(value: string | number): string {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(parsed)) return '$0.00';
  const abs = Math.abs(parsed);
  const body = `$${abs.toFixed(2)}`;
  if (parsed < 0) return `-${body}`;
  return body;
}
