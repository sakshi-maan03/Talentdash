/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Currency, LevelStandardized } from "../types";

// Consistent Conversion Rates File Config
export const CONVERSION_RATES = {
  USD_TO_INR: 83.333333,
  GBP_TO_USD: 1.25,
  EUR_TO_USD: 1.08,
};

// Converts amount from source currency to target currency.
// Note: Calculations are done on base numbers (amounts must already be standard units, e.g. Rupee, and not in subunit paise).
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency
): number {
  if (from === to) return amount;

  // Convert source currency to USD first
  let inUSD = amount;
  if (from === "INR") {
    inUSD = amount / CONVERSION_RATES.USD_TO_INR;
  } else if (from === "GBP") {
    inUSD = amount * CONVERSION_RATES.GBP_TO_USD;
  } else if (from === "EUR") {
    inUSD = amount * CONVERSION_RATES.EUR_TO_USD;
  }

  // Convert USD to target currency
  if (to === "USD") return inUSD;
  if (to === "INR") return inUSD * CONVERSION_RATES.USD_TO_INR;
  if (to === "GBP") return inUSD / CONVERSION_RATES.GBP_TO_USD;
  if (to === "EUR") return inUSD / CONVERSION_RATES.EUR_TO_USD;

  return amount;
}

// Converts a database subunit level (paise for INR, cents for other currencies) to normal rupees/dollars.
export function subunitToUnit(amount: number, currency: Currency): number {
  return amount / 100;
}

// Format number in Indian Lakh/Crore grouping
export function formatIndianNumber(value: number): string {
  const rounded = Math.round(value);
  const x = rounded.toString();
  let lastThree = x.substring(x.length - 3);
  const otherSymbols = x.substring(0, x.length - 3);
  if (otherSymbols !== "") {
    lastThree = "," + lastThree;
  }
  const res = otherSymbols.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  return res;
}

// Format salary to display values (e.g. ₹42,00,000 or $50,400)
export function formatSalary(amount: number, currency: Currency): string {
  if (currency === "INR") {
    return "₹" + formatIndianNumber(amount);
  } else if (currency === "USD") {
    return "$" + Math.round(amount).toLocaleString("en-US");
  } else if (currency === "GBP") {
    return "£" + Math.round(amount).toLocaleString("en-GB");
  } else if (currency === "EUR") {
    return "€" + Math.round(amount).toLocaleString("en-IE");
  }
  return Math.round(amount).toString();
}

/**
 * Parses and converts values from the mock data (stored in paise/cents)
 * to standard display units (rupees/dollars) in the requested global currency.
 */
export function getDisplayComp(
  centsAmount: number,
  sourceCurrency: Currency,
  displayCurrency: Currency
): number {
  const sourceStandard = subunitToUnit(centsAmount, sourceCurrency);
  return convertCurrency(sourceStandard, sourceCurrency, displayCurrency);
}

// Map standardized levels to beautiful brand colors and badges
export function getLevelMetadata(level: LevelStandardized) {
  const norm = level.toString().toUpperCase().trim().replace("_", "-");

  if (norm === "L3" || norm === "SDE-I" || norm === "IC4") {
    return {
      tierName: "L3 / SDE-I",
      color: "bg-slate-500",
      badgeClass: "bg-slate-100 text-slate-800 border border-slate-200/80"
    };
  }

  if (norm === "L4" || norm === "SDE-II" || norm === "IC5") {
    return {
      tierName: "L4 / SDE-II",
      color: "bg-blue-600",
      badgeClass: "bg-blue-50 text-blue-800 border border-blue-200"
    };
  }

  if (norm === "L5" || norm === "SDE-III") {
    return {
      tierName: "L5 / SDE-III",
      color: "bg-indigo-600",
      badgeClass: "bg-indigo-50 text-indigo-800 border border-indigo-200"
    };
  }

  if (norm === "L6" || norm === "STAFF") {
    return {
      tierName: "L6 / Staff",
      color: "bg-purple-600",
      badgeClass: "bg-purple-50 text-purple-800 border border-purple-200"
    };
  }

  if (norm === "PRINCIPAL") {
    return {
      tierName: "Principal",
      color: "bg-slate-900",
      badgeClass: "bg-slate-900 text-slate-100 border border-slate-950"
    };
  }

  // Fallback for general values
  return {
    tierName: level,
    color: "bg-neutral-400",
    badgeClass: "bg-neutral-100 text-neutral-800 border border-neutral-200"
  };
}

// Compute the true mathematical statistical median (middle value)
export function computeMedian(rawValues: number[]): number {
  if (rawValues.length === 0) return 0;
  const sorted = [...rawValues].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  } else {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
}
