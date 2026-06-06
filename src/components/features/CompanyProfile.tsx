/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { Company, SalaryWithCompany, Currency } from "../../types";
import { MOCK_SALARIES } from "../../lib/mock-data";
import { getLevelMetadata, formatSalary, getDisplayComp, computeMedian } from "../../lib/utils";
import { Badge } from "../ui/Badge";
import {
  Compass,
  ArrowLeft,
  Building2,
  TrendingUp,
  MapPin,
  Calendar,
  Users,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowRightLeft
} from "lucide-react";

interface CompanyProfileProps {
  company: Company;
  onBack: () => void;
  onCompareWithSlug: (slug: string) => void;
  displayCurrency: Currency;
  setDisplayCurrency: (currency: Currency) => void;
}

export function CompanyProfile({
  company,
  onBack,
  onCompareWithSlug,
  displayCurrency,
  setDisplayCurrency
}: CompanyProfileProps) {
  // Scoped salary search & filter configurations
  const [scopedSearch, setScopedSearch] = useState("");
  const [sortField, setSortField] = useState<"total_compensation" | "base_salary">("total_compensation");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Filter salaries for this specific company
  const companySalaries = useMemo(() => {
    return MOCK_SALARIES.filter((s) => s.company_id === company.id);
  }, [company.id]);

  // MEDIANS & STATS (Fully Computed from seed data, never hardcoded)
  const stats = useMemo(() => {
    const rawCompsInDisplay = companySalaries.map((s) =>
      getDisplayComp(s.total_compensation, s.currency, displayCurrency)
    );
    const rawBasesInDisplay = companySalaries.map((s) =>
      getDisplayComp(s.base_salary, s.currency, displayCurrency)
    );

    const medianTC = computeMedian(rawCompsInDisplay);
    const minTC = rawCompsInDisplay.length > 0 ? Math.min(...rawCompsInDisplay) : 0;
    const maxTC = rawCompsInDisplay.length > 0 ? Math.max(...rawCompsInDisplay) : 0;

    return {
      medianTC,
      minTC,
      maxTC,
      count: companySalaries.length
    };
  }, [companySalaries, displayCurrency]);

  // Level Distribution Bar (segmenting L3/SDE-I, L4/SDE-II, L5/SDE-III, L6/Staff, Principal)
  const levelDistribution = useMemo(() => {
    const counts: Record<string, { count: number; color: string; label: string }> = {
      L3: { count: 0, color: "bg-slate-500", label: "L3 / SDE-I" },
      L4: { count: 0, color: "bg-blue-600", label: "L4 / SDE-II" },
      L5: { count: 0, color: "bg-indigo-600", label: "L5 / SDE-III" },
      L6: { count: 0, color: "bg-purple-600", label: "L6 / Staff" },
      Principal: { count: 0, color: "bg-slate-900", label: "Principal" }
    };

    let classifiedCount = 0;

    companySalaries.forEach((s) => {
      const norm = s.level_standardized.toUpperCase().replace("_", "-");
      if (norm === "L3" || norm === "SDE-I" || norm === "IC4") {
        counts.L3.count += 1;
        classifiedCount++;
      } else if (norm === "L4" || norm === "SDE-II" || norm === "IC5") {
        counts.L4.count += 1;
        classifiedCount++;
      } else if (norm === "L5" || norm === "SDE-III") {
        counts.L5.count += 1;
        classifiedCount++;
      } else if (norm === "L6" || norm === "STAFF") {
        counts.L6.count += 1;
        classifiedCount++;
      } else if (norm === "PRINCIPAL") {
        counts.Principal.count += 1;
        classifiedCount++;
      }
    });

    const segments = Object.entries(counts)
      .map(([key, item]) => {
        const percentage = classifiedCount > 0 ? (item.count / classifiedCount) * 100 : 0;
        return {
          key,
          label: item.label,
          count: item.count,
          percentage,
          color: item.color
        };
      })
      .filter((s) => s.count > 0);

    return {
      segments,
      classifiedCount
    };
  }, [companySalaries]);

  // Scoped salary filtering inside profile view
  const displaySalaries = useMemo(() => {
    return companySalaries
      .filter((s) => {
        if (scopedSearch.trim() === "") return true;
        return s.role.toLowerCase().includes(scopedSearch.toLowerCase()) ||
          s.location.toLowerCase().includes(scopedSearch.toLowerCase()) ||
          s.level_standardized.toLowerCase().includes(scopedSearch.toLowerCase());
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;

        if (sortField === "total_compensation") {
          valA = getDisplayComp(a.total_compensation, a.currency, displayCurrency);
          valB = getDisplayComp(b.total_compensation, b.currency, displayCurrency);
        } else if (sortField === "base_salary") {
          valA = getDisplayComp(a.base_salary, a.currency, displayCurrency);
          valB = getDisplayComp(b.base_salary, b.currency, displayCurrency);
        }

        return sortOrder === "desc" ? valB - valA : valA - valB;
      });
  }, [companySalaries, scopedSearch, sortField, sortOrder, displayCurrency]);

  const handleSort = (field: "total_compensation" | "base_salary") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <div id="company-profile-view" className="space-y-6">
      {/* Back button link */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-[#717171] hover:text-[#FF5A5F] transition font-semibold group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to All Salaries</span>
        </button>
      </div>

      {/* Company Header Widget */}
      <div className="bg-white rounded-xl border border-[#EBEBEB] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#EBEBEB]">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 text-indigo-700 text-lg font-black flex items-center justify-center rounded-xl uppercase tracking-wider shrink-0 mt-1">
              {company.name.slice(0, 2)}
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#222222]">
                {company.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#717171]">
                <span className="bg-[#F2F2F2] text-[#484848] px-2 py-0.5 rounded font-medium">
                  {company.industry}
                </span>
                <span className="w-1 h-1 bg-neutral-300 rounded-full"></span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#FF5A5F]" /> {company.headquarters}
                </span>
              </div>
            </div>
          </div>

          {/* Compare Button & Currency Toggle bar */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onCompareWithSlug(company.slug)}
              className="bg-[#222222] hover:bg-[#222222]/90 text-white text-xs font-semibold px-4 py-2.5 rounded-lg inline-flex items-center gap-2 transition shadow-sm"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Compare {company.name} Salaries</span>
            </button>

            {/* Scoped Display Currencies Toggle */}
            <div className="inline-flex rounded-md shadow-sm border border-[#EBEBEB] bg-[#F7F7F7] h-9 overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setDisplayCurrency("INR")}
                className={`px-3.5 h-full ${
                  displayCurrency === "INR"
                    ? "bg-[#FF5A5F] text-white font-bold"
                    : "bg-white text-neutral-700 hover:bg-[#F2F2F2]"
                }`}
              >
                ₹
              </button>
              <button
                type="button"
                onClick={() => setDisplayCurrency("USD")}
                className={`px-3.5 h-full ${
                  displayCurrency === "USD"
                    ? "bg-[#FF5A5F] text-white font-bold"
                    : "bg-white text-neutral-700 hover:bg-[#F2F2F2]"
                }`}
              >
                $
              </button>
            </div>
          </div>
        </div>

        {/* Header Grid details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-50 rounded-lg flex items-center justify-center border border-[#EBEBEB]">
              <Calendar className="w-5 h-5 text-neutral-500" />
            </div>
            <div>
              <p className="text-[11px] text-[#717171] uppercase tracking-wider font-semibold">Founded Year</p>
              <p className="text-sm font-bold text-[#222222]">{company.founded_year || "—"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-50 rounded-lg flex items-center justify-center border border-[#EBEBEB]">
              <Users className="w-5 h-5 text-neutral-500" />
            </div>
            <div>
              <p className="text-[11px] text-[#717171] uppercase tracking-wider font-semibold">Headcount Range</p>
              <p className="text-sm font-bold text-[#222222]">{company.headcount_range || "—"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-50 rounded-lg flex items-center justify-center border border-[#EBEBEB]">
              <TrendingUp className="w-5 h-5 text-[#008A05]" />
            </div>
            <div>
              <p className="text-[11px] text-[#717171] uppercase tracking-wider font-semibold">Total Submissions</p>
              <p className="text-sm font-bold text-[#222222]">{stats.count} responses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric Card 1: Statistical Compensation Overview */}
        <div className="md:col-span-1 bg-white border border-[#EBEBEB] p-6 rounded-xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#717171] border-b border-[#EBEBEB] pb-3 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-[#FF5A5F]" />
            <span>Compensation Overview</span>
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold text-[#717171] uppercase tracking-wider">Median Total Comp</p>
              <p className="text-3xl font-extrabold text-[#0369A1] font-mono leading-none mt-1">
                {formatSalary(stats.medianTC, displayCurrency)}
              </p>
              <p className="text-[11px] text-[#717171] mt-1.5">
                Computed statistical middle salary baseline.
              </p>
            </div>

            <div className="border-t border-[#EBEBEB] pt-3">
              <p className="text-[11px] font-semibold text-[#717171] uppercase tracking-wider mb-1">Range (Min–Max)</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#484848] font-bold font-mono">
                  {formatSalary(stats.minTC, displayCurrency)}
                </span>
                <span className="text-xs text-[#717171]">to</span>
                <span className="text-xs text-[#484848] font-bold font-mono">
                  {formatSalary(stats.maxTC, displayCurrency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric Card 2: Level Tier Distribution Stacked bar chart */}
        <div className="md:col-span-2 bg-white border border-[#EBEBEB] p-6 rounded-xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#717171] border-b border-[#EBEBEB] pb-3">
            Level Distribution index ({levelDistribution.classifiedCount} Classified)
          </h3>

          {levelDistribution.segments.length === 0 ? (
            <p className="text-[#717171] text-xs pt-4">No standardized levels recorded yet.</p>
          ) : (
            <div className="space-y-6">
              {/* Horizontal Segmented Bar */}
              <div className="w-full h-8 bg-[#F7F7F7] rounded-lg overflow-hidden flex shadow-inner border border-[#EBEBEB]">
                {levelDistribution.segments.map((seg) => (
                  <div
                    key={seg.key}
                    style={{ width: `${seg.percentage}%` }}
                    className={`${seg.color} transition-all duration-300 relative group cursor-pointer first:rounded-l-lg last:rounded-r-lg border-r last:border-r-0 border-white/20`}
                    title={`${seg.label}: ${seg.count} submission(s) (${seg.percentage.toFixed(1)}%)`}
                  >
                    {/* Tooltip on Hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-neutral-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 whitespace-nowrap z-10 font-mono shadow-md">
                      {seg.label}: {seg.count} ({seg.percentage.toFixed(0)}%)
                    </div>
                  </div>
                ))}
              </div>

              {/* Legends Matrix with percentages */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4">
                {levelDistribution.segments.map((seg) => (
                  <div key={seg.key} className="flex items-start gap-2 text-xs">
                    <span className={`w-3.5 h-3.5 rounded ${seg.color} mt-0.5 shrink-0`}></span>
                    <div>
                      <p className="font-bold text-[#222222]">{seg.label}</p>
                      <p className="text-[11px] text-[#717171]">
                        {seg.count} sub. ({seg.percentage.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Salary Submission listings */}
      <div className="bg-white rounded-xl border border-[#EBEBEB] p-6 shadow-sm space-y-4">
        {/* Table header with search input */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBEBEB] pb-4">
          <h2 className="text-[#222222] text-lg font-bold">
            Submissions Ledger
          </h2>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Filter ledger (role, level)..."
              value={scopedSearch}
              onChange={(e) => setScopedSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-[#EBEBEB] rounded-lg text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#FF5A5F] focus:border-[#FF5A5F]"
            />
          </div>
        </div>

        {displaySalaries.length === 0 ? (
          <p className="text-center text-sm py-8 text-[#717171]">No matching ledger submissions.</p>
        ) : (
          <div className="overflow-x-auto whitespace-nowrap">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#EBEBEB] text-[#717171] uppercase tracking-wider font-semibold">
                  <th className="py-2.5 font-semibold">Role</th>
                  <th className="py-2.5 font-semibold">Level</th>
                  <th className="py-2.5 font-semibold">Location</th>
                  <th className="py-2.5 font-semibold text-center">Experience</th>
                  <th className="py-2.5 font-semibold cursor-pointer hover:text-black hover:underline" onClick={() => handleSort("base_salary")}>
                    Base Salary {sortField === "base_salary" && (sortOrder === "desc" ? "↓" : "↑")}
                  </th>
                  <th className="py-2.5 font-semibold">Stock (RSUs)</th>
                  <th className="py-2.5 font-semibold text-right cursor-pointer hover:text-black hover:underline" onClick={() => handleSort("total_compensation")}>
                    Total Comp {sortField === "total_compensation" && (sortOrder === "desc" ? "↓" : "↑")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBEBEB]">
                {displaySalaries.map((s) => {
                  const meta = getLevelMetadata(s.level_standardized);

                  const dbBase = getDisplayComp(s.base_salary, s.currency, displayCurrency);
                  const dbStock = s.stock ? getDisplayComp(s.stock, s.currency, displayCurrency) : 0;
                  const dbTc = getDisplayComp(s.total_compensation, s.currency, displayCurrency);

                  return (
                    <tr id={`company-sub-row-${s.id}`} key={s.id} className="hover:bg-[#F2F2F2] transition-colors">
                      <td className="py-3 font-semibold text-[#222222]">{s.role}</td>
                      <td className="py-3">
                        <Badge className={`${meta.badgeClass} rounded-full`}>{s.level_standardized}</Badge>
                      </td>
                      <td className="py-3 text-[#717171]">{s.location}</td>
                      <td className="py-3 text-center">{s.experience_years} yrs</td>
                      <td className="py-3 font-mono text-[#484848]">{formatSalary(dbBase, displayCurrency)}</td>
                      <td className="py-3 font-mono text-[#484848]">
                        {s.stock && s.stock > 0 ? formatSalary(dbStock, displayCurrency) : "—"}
                      </td>
                      <td className="py-3 text-right font-bold text-[#0369A1] font-mono leading-none">
                        {formatSalary(dbTc, displayCurrency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
