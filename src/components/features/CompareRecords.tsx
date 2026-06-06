/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useEffect } from "react";
import { SalaryWithCompany, Currency } from "../../types";
import { MOCK_SALARIES } from "../../lib/mock-data";
import { getLevelMetadata, formatSalary, getDisplayComp } from "../../lib/utils";
import { Badge } from "../ui/Badge";
import {
  ArrowLeftRight,
  TrendingDown,
  TrendingUp,
  Award,
  ChevronDown,
  Info,
  Sparkles,
  MapPin,
  Clock,
  Briefcase
} from "lucide-react";

interface CompareRecordsProps {
  selectedIdA: string;
  selectedIdB: string;
  onChangeA: (id: string) => void;
  onChangeB: (id: string) => void;
  displayCurrency: Currency;
  setDisplayCurrency: (currency: Currency) => void;
}

export function CompareRecords({
  selectedIdA,
  selectedIdB,
  onChangeA,
  onChangeB,
  displayCurrency,
  setDisplayCurrency
}: CompareRecordsProps) {

  // Resolve active objects from seed list
  const recordA = useMemo(() => {
    return MOCK_SALARIES.find((s) => s.id === selectedIdA) || MOCK_SALARIES[0];
  }, [selectedIdA]);

  const recordB = useMemo(() => {
    // default to second record to prevent dual overlay load on start
    return MOCK_SALARIES.find((s) => s.id === selectedIdB) || MOCK_SALARIES[1];
  }, [selectedIdB]);

  // Ensure url sync is maintained correct by signaling back any defaults if necessary
  useEffect(() => {
    if (recordA && recordA.id !== selectedIdA) {
      onChangeA(recordA.id);
    }
    if (recordB && recordB.id !== selectedIdB) {
      onChangeB(recordB.id);
    }
  }, [recordA, recordB, selectedIdA, selectedIdB, onChangeA, onChangeB]);

  // Compute all display numeric values
  const metricsA = useMemo(() => {
    if (!recordA) return null;
    return {
      base: getDisplayComp(recordA.base_salary, recordA.currency, displayCurrency),
      bonus: getDisplayComp(recordA.bonus, recordA.currency, displayCurrency),
      stock: getDisplayComp(recordA.stock, recordA.currency, displayCurrency),
      total: getDisplayComp(recordA.total_compensation, recordA.currency, displayCurrency),
      exp: recordA.experience_years
    };
  }, [recordA, displayCurrency]);

  const metricsB = useMemo(() => {
    if (!recordB) return null;
    return {
      base: getDisplayComp(recordB.base_salary, recordB.currency, displayCurrency),
      bonus: getDisplayComp(recordB.bonus, recordB.currency, displayCurrency),
      stock: getDisplayComp(recordB.stock, recordB.currency, displayCurrency),
      total: getDisplayComp(recordB.total_compensation, recordB.currency, displayCurrency),
      exp: recordB.experience_years
    };
  }, [recordB, displayCurrency]);

  // Deltas calculations: Record A minus Record B
  const deltas = useMemo(() => {
    if (!metricsA || !metricsB) return null;
    return {
      base: metricsA.base - metricsB.base,
      bonus: metricsA.bonus - metricsB.bonus,
      stock: metricsA.stock - metricsB.stock,
      total: metricsA.total - metricsB.total,
      exp: metricsA.exp - metricsB.exp
    };
  }, [metricsA, metricsB]);

  // Determine winner by total comp
  const winner = useMemo(() => {
    if (!metricsA || !metricsB) return null;
    if (metricsA.total === metricsB.total) return "tie";
    return metricsA.total > metricsB.total ? "A" : "B";
  }, [metricsA, metricsB]);

  const dropdownOptions = useMemo(() => {
    return MOCK_SALARIES.map((s) => {
      // Create readable label
      const baseUnits = s.base_salary / 100;
      const formattedBase = formatSalary(baseUnits, s.currency);
      const label = `${s.company.name} — ${s.role} — ${s.level_standardized} (${s.location}) — ${formattedBase} Base`;
      return {
        id: s.id,
        label
      };
    }).sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const RenderDelta = ({ value }: { value: number }) => {
    if (value === 0) return <span className="text-neutral-400 font-mono">—</span>;
    const isPositive = value > 0;
    const prefix = isPositive ? "+" : "";
    const colorClass = isPositive ? "text-[#008A05] font-bold" : "text-[#D93025] font-bold";
    return (
      <span className={`${colorClass} font-mono`}>
        {prefix}
        {formatSalary(value, displayCurrency)}
      </span>
    );
  };

  return (
    <div id="compare-tab-view" className="space-y-6">
      {/* Selection Panel Grid Header */}
      <div className="bg-white border border-[#EBEBEB] rounded-xl p-6 shadow-sm">
        <h2 className="text-[#222222] text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-[#FF5A5F]" />
          <span>Side-by-Side Compensation Comparisons</span>
        </h2>
        <p className="text-xs text-[#717171] mb-6">
          Query and benchmark raw offerings side-by-side. Our delta engine evaluates basic base wages, cash incentives, and stock option variances in real time.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Selector Record A */}
          <div className="space-y-2">
            <label htmlFor="selector-record-a" className="text-xs font-bold uppercase tracking-wider text-[#FF5A5F] flex items-center gap-1">
              <span>Offer Package A</span>
              {winner === "A" && (
                <Badge className="bg-[#0369A1]/10 text-[#0369A1] animate-pulse">
                  Higher TC
                </Badge>
              )}
            </label>
            <div className="relative">
              <select
                id="selector-record-a"
                value={selectedIdA}
                onChange={(e) => onChangeA(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 text-xs bg-white border border-[#EBEBEB] text-[#222222] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF5A5F] focus:border-[#FF5A5F] appearance-none cursor-pointer"
              >
                {dropdownOptions.map((opt) => (
                  <option key={`a-${opt.id}`} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
          </div>

          {/* Selector Record B */}
          <div className="space-y-2">
            <label htmlFor="selector-record-b" className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
              <span>Offer Package B</span>
              {winner === "B" && (
                <Badge className="bg-[#0369A1]/10 text-[#0369A1] animate-pulse">
                  Higher TC
                </Badge>
              )}
            </label>
            <div className="relative">
              <select
                id="selector-record-b"
                value={selectedIdB}
                onChange={(e) => onChangeB(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 text-xs bg-white border border-[#EBEBEB] text-[#222222] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF5A5F] focus:border-[#FF5A5F] appearance-none cursor-pointer"
              >
                {dropdownOptions.map((opt) => (
                  <option key={`b-${opt.id}`} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Currency Display Selector specifically inside Compare */}
        <div className="flex items-center justify-end gap-3 mt-4 border-t border-[#EBEBEB] pt-4">
          <span className="text-xs text-[#717171] font-medium">Display Base Valuations:</span>
          <div className="inline-flex rounded-lg shadow-sm border border-[#EBEBEB] bg-[#F7F7F7] h-8 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setDisplayCurrency("INR")}
              className={`px-3.5 h-full font-semibold ${
                displayCurrency === "INR"
                  ? "bg-[#FF5A5F] text-white"
                  : "bg-white text-neutral-600 hover:bg-[#F2F2F2]"
              }`}
            >
              INR (₹)
            </button>
            <button
              type="button"
              onClick={() => setDisplayCurrency("USD")}
              className={`px-3.5 h-full ${
                displayCurrency === "USD"
                  ? "bg-[#FF5A5F] text-white font-bold"
                  : "bg-white text-neutral-600 hover:bg-[#F2F2F2]"
              }`}
            >
              USD ($)
            </button>
          </div>
        </div>
      </div>

      {selectedIdA === selectedIdB && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-4 flex gap-2 text-xs">
          <Info className="w-4 h-4 shrink-0 text-amber-500" />
          <span>You have selected the same record in both comparison columns. Select different recordings to generate deltas analysis!</span>
        </div>
      )}

      {/* Main Breakdown comparison structure */}
      <div className="bg-white border border-[#EBEBEB] rounded-xl shadow-sm overflow-hidden whitespace-nowrap overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs md:text-sm">
          <thead>
            <tr className="border-b border-[#EBEBEB] bg-[#F7F7F7] text-xs font-semibold text-[#717171] uppercase tracking-wider">
              <th className="px-6 py-4">Benchmarking Vector</th>
              <th className="px-6 py-4 bg-indigo-50/20 text-[#222222] border-r border-[#EBEBEB]">Package A Details</th>
              <th className="px-6 py-4 bg-purple-50/20 text-[#222222] border-r border-[#EBEBEB]">Package B Details</th>
              <th className="px-6 py-4 text-right">Variance (A - B)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EBEBEB]">
            {/* 1. Company Row */}
            <tr id="compare-row-company">
              <td className="px-6 py-4 font-bold text-neutral-500 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                <span>Company</span>
              </td>
              <td className="px-6 py-4 font-extrabold text-[#222222] bg-indigo-50/10 border-r border-[#EBEBEB]">
                <div className="flex items-center gap-2">
                  <span className="text-base">{recordA.company.name}</span>
                  {winner === "A" && (
                    <Badge className="bg-[#0369A1] text-white font-black rounded-lg">Winner</Badge>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 font-extrabold text-[#222222] bg-purple-50/10 border-r border-[#EBEBEB]">
                <div className="flex items-center gap-2">
                  <span className="text-base">{recordB.company.name}</span>
                  {winner === "B" && (
                    <Badge className="bg-[#0369A1] text-white font-black rounded-lg">Winner</Badge>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-right">—</td>
            </tr>

            {/* 2. Job Role Role Row */}
            <tr id="compare-row-role">
              <td className="px-6 py-4 font-semibold text-neutral-500">Job Title</td>
              <td className="px-6 py-4 bg-indigo-50/10 border-r border-[#EBEBEB] font-semibold text-[#222222]">{recordA.role}</td>
              <td className="px-6 py-4 bg-purple-50/10 border-r border-[#EBEBEB] font-semibold text-[#222222]">{recordB.role}</td>
              <td className="px-6 py-4 text-right text-gray-400">—</td>
            </tr>

            {/* 3. Level standardized Badge Row */}
            <tr id="compare-row-level">
              <td className="px-6 py-4 font-semibold text-neutral-500">Tier Level</td>
              <td className="px-6 py-4 bg-indigo-50/10 border-r border-[#EBEBEB]">
                <Badge className={getLevelMetadata(recordA.level_standardized).badgeClass}>
                  {recordA.level_standardized}
                </Badge>
              </td>
              <td className="px-6 py-4 bg-purple-50/10 border-r border-[#EBEBEB]">
                <Badge className={getLevelMetadata(recordB.level_standardized).badgeClass}>
                  {recordB.level_standardized}
                </Badge>
              </td>
              <td className="px-6 py-4 text-right text-gray-400">—</td>
            </tr>

            {/* 4. Geography city Row */}
            <tr id="compare-row-geography">
              <td className="px-6 py-4 font-semibold text-neutral-500">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Geography</span>
                </div>
              </td>
              <td className="px-6 py-4 bg-indigo-50/10 border-r border-[#EBEBEB] text-[#484848] font-medium">{recordA.location}</td>
              <td className="px-6 py-4 bg-purple-50/10 border-r border-[#EBEBEB] text-[#484848] font-medium">{recordB.location}</td>
              <td className="px-6 py-4 text-right text-gray-400">—</td>
            </tr>

            {/* 5. Experience Years Row */}
            <tr id="compare-row-experience">
              <td className="px-6 py-4 font-semibold text-neutral-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Total Experience</span>
                </div>
              </td>
              <td className="px-6 py-4 bg-indigo-50/10 border-r border-[#EBEBEB] text-[#222222] font-semibold">{recordA.experience_years} years</td>
              <td className="px-6 py-4 bg-purple-50/10 border-r border-[#EBEBEB] text-[#222222] font-semibold">{recordB.experience_years} years</td>
              <td className="px-6 py-4 text-right font-medium">
                {deltas && (
                  <span className={deltas.exp > 0 ? "text-[#008A05]" : deltas.exp < 0 ? "text-[#D93025]" : "text-neutral-400"}>
                    {deltas.exp > 0 && "+"}
                    {deltas.exp} yrs
                  </span>
                )}
              </td>
            </tr>

            {/* 6. Base Salary (Financials) */}
            <tr id="compare-row-base">
              <td className="px-6 py-4 font-semibold text-neutral-500">Base Salary</td>
              <td className="px-6 py-4 bg-indigo-50/10 border-r border-[#EBEBEB] font-mono font-medium">
                {metricsA && formatSalary(metricsA.base, displayCurrency)}
              </td>
              <td className="px-6 py-4 bg-purple-50/10 border-r border-[#EBEBEB] font-mono font-medium">
                {metricsB && formatSalary(metricsB.base, displayCurrency)}
              </td>
              <td className="px-6 py-4 text-right">
                {deltas && <RenderDelta value={deltas.base} />}
              </td>
            </tr>

            {/* 7. Cash Bonus Row */}
            <tr id="compare-row-bonus">
              <td className="px-6 py-4 font-semibold text-neutral-500">Performance Bonus</td>
              <td className="px-6 py-4 bg-indigo-50/10 border-r border-[#EBEBEB] font-mono">
                {metricsA && recordA.bonus > 0 ? formatSalary(metricsA.bonus, displayCurrency) : "—"}
              </td>
              <td className="px-6 py-4 bg-purple-50/10 border-r border-[#EBEBEB] font-mono">
                {metricsB && recordB.bonus > 0 ? formatSalary(metricsB.bonus, displayCurrency) : "—"}
              </td>
              <td className="px-6 py-4 text-right">
                {deltas && <RenderDelta value={deltas.bonus} />}
              </td>
            </tr>

            {/* 8. Stock Share compensation vestings */}
            <tr id="compare-row-stock">
              <td className="px-6 py-4 font-semibold text-neutral-500">Stock (RSU) Vesting</td>
              <td className="px-6 py-4 bg-indigo-50/10 border-r border-[#EBEBEB] font-mono">
                {metricsA && recordA.stock > 0 ? formatSalary(metricsA.stock, displayCurrency) : "—"}
              </td>
              <td className="px-6 py-4 bg-purple-50/10 border-r border-[#EBEBEB] font-mono">
                {metricsB && recordB.stock > 0 ? formatSalary(metricsB.stock, displayCurrency) : "—"}
              </td>
              <td className="px-6 py-4 text-right">
                {deltas && <RenderDelta value={deltas.stock} />}
              </td>
            </tr>

            {/* 9. Total Compensation (Core comparison metric, styled in thick brand blue) */}
            <tr id="compare-row-totalcomp" className="bg-[#0369A1]/5 border-t-2 border-[#EBEBEB] text-base md:text-lg">
              <td className="px-6 py-5 font-extrabold text-[#0369A1] flex items-center gap-1.5">
                <Award className="w-5 h-5 text-[#FF5A5F]" />
                <span>Total Compensation</span>
              </td>
              <td className="px-6 py-5 bg-indigo-50/20 border-r border-[#EBEBEB] font-extrabold text-[#0369A1] font-mono">
                <div className="flex flex-col">
                  <span>{metricsA && formatSalary(metricsA.total, displayCurrency)}</span>
                  {winner === "A" && (
                    <span className="text-[10px] text-[#008A05] tracking-wide font-bold uppercase mt-1">
                      Pays More A
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-5 bg-purple-50/20 border-r border-[#EBEBEB] font-extrabold text-[#0369A1] font-mono">
                <div className="flex flex-col">
                  <span>{metricsB && formatSalary(metricsB.total, displayCurrency)}</span>
                  {winner === "B" && (
                    <span className="text-[10px] text-[#008A05] tracking-wide font-bold uppercase mt-1">
                      Pays More B
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-5 text-right font-extrabold">
                {deltas && <RenderDelta value={deltas.total} />}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
