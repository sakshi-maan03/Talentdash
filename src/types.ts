/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Company {
  id: string; // UUID
  name: string; // e.g. "Google India", "Amazon", "Meta"
  slug: string; // unique, e.g. "google", "amazon", "meta"
  normalized_name: string; // lowercase, trimmed, e.g. "google"
  industry: string; // e.g. "Technology", "E-commerce"
  headquarters: string; // e.g. "Bengaluru, India", "Seattle, WA"
  founded_year: number | null;
  headcount_range: string | null; // e.g. "10,000+ employees"
  created_at: string;
  updated_at: string;
}

export type LevelStandardized =
  | "L3"
  | "L4"
  | "L5"
  | "L6"
  | "SDE-I"
  | "SDE-II"
  | "SDE-III"
  | "Staff"
  | "Principal"
  | "IC4"
  | "IC5"
  | "SDE_I"
  | "SDE_II"
  | "SDE_III"
  | "STAFF"
  | "PRINCIPAL";

export type Currency = "INR" | "USD" | "GBP" | "EUR";

export type SourceType = "CONTRIBUTOR" | "SCRAPED" | "AI_INFERRED";

export interface Salary {
  id: string; // UUID
  company_id: string; // FK to Company
  role: string; // Job title as entered, e.g. "Software Engineer"
  level_standardized: LevelStandardized;
  location: string; // City name only, e.g. "Bengaluru", "Mumbai", "San Francisco"
  currency: Currency; // INR | USD | GBP | EUR
  experience_years: number; // Total years of experience
  base_salary: number; // In smallest currency unit (paise for INR, cents for USD/GBP/EUR)
  bonus: number; // In smallest currency unit (defaults to 0, never null)
  stock: number; // In smallest currency unit (defaults to 0, never null)
  total_compensation: number; // base_salary + bonus + stock (COMPUTED)
  source: SourceType; // CONTRIBUTOR | SCRAPED | AI_INFERRED
  confidence_score: number; // float 0.0 - 1.0
  is_verified: boolean;
  submitted_at: string;
}

export interface SalaryWithCompany extends Salary {
  company: Company;
}
