/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { SalaryWithCompany, Currency, LevelStandardized } from "../../types";
import { MOCK_SALARIES } from "../../lib/mock-data";
import { getLevelMetadata, formatSalary, getDisplayComp } from "../../lib/utils";
import { Badge } from "../ui/Badge";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  RotateCcw,
  Building2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface SalaryTableProps {
  onSelectCompany: (slug: string) => void;
  displayCurrency: Currency;
  setDisplayCurrency: (currency: Currency) => void;
  // URL state sync hooks passed from parent
  initialFilters: {
    company: string;
    role: string;
    levels: string[];
    location: string;
  };
  onFiltersChange: (filters: {
    company: string;
    role: string;
    levels: string[];
    location: string;
  }) => void;
}

export function SalaryTable({
  onSelectCompany,
  displayCurrency,
  setDisplayCurrency,
  initialFilters,
  onFiltersChange
}: SalaryTableProps) {
  // Filters local states pre-filled on load from parent/URL
  const [searchVal, setSearchVal] = useState(initialFilters.company);
  const [debouncedCompany, setDebouncedCompany] = useState(initialFilters.company);
  const [roleFilter, setRoleFilter] = useState(initialFilters.role);
  const [selectedLevels, setSelectedLevels] = useState<string[]>(initialFilters.levels);
  const [locationFilter, setLocationFilter] = useState(initialFilters.location);

  // Sorting columns state: field and direction
  // default: Total Comp descending
  const [sortField, setSortField] = useState<"total_compensation" | "experience_years" | "base_salary">("total_compensation");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Handle debouncing for company text search
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedCompany(searchVal);
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchVal]);

  // Sync changes out to url state via parent callback
  useEffect(() => {
    onFiltersChange({
      company: debouncedCompany,
      role: roleFilter,
      levels: selectedLevels,
      location: locationFilter
    });
    // Reset to page 1 on filter changes
    setCurrentPage(1);
  }, [debouncedCompany, roleFilter, selectedLevels, locationFilter, onFiltersChange]);

  // Reset all filters helper
  const handleClearAll = () => {
    setSearchVal("");
    setDebouncedCompany("");
    setRoleFilter("");
    setSelectedLevels([]);
    setLocationFilter("");
    setSortField("total_compensation");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  // Generate roles & locations dynamically of mock data to keep selectors robust
  const allRoles = useMemo(() => {
    const rolesSet = new Set<string>();
    MOCK_SALARIES.forEach(s => {
      if (s.role) rolesSet.add(s.role);
    });
    return Array.from(rolesSet).sort();
  }, []);

  const allLocations = useMemo(() => {
    const locSet = new Set<string>();
    MOCK_SALARIES.forEach(s => {
      if (s.location) locSet.add(s.location);
    });
    return Array.from(locSet).sort();
  }, []);

  const availableLevels: string[] = ["L3", "L4", "L5", "L6", "SDE-I", "SDE-II", "SDE-III", "Staff", "Principal"];

  // Toggle check state for level selection
  const handleLevelToggle = (lvl: string) => {
    if (selectedLevels.includes(lvl)) {
      setSelectedLevels(selectedLevels.filter(x => x !== lvl));
    } else {
      setSelectedLevels([...selectedLevels, lvl]);
    }
  };

  // Filter & Sort Logic
  const processedSalaries = useMemo(() => {
    return MOCK_SALARIES.filter(s => {
      // Company match (case insensitive substring of formatted or slug name)
      if (debouncedCompany.trim() !== "") {
        const query = debouncedCompany.toLowerCase();
        const compName = s.company.name.toLowerCase();
        const compSlug = s.company.slug.toLowerCase();
        if (!compName.includes(query) && !compSlug.includes(query)) {
          return false;
        }
      }

      // Role filter match
      if (roleFilter !== "" && s.role !== roleFilter) {
        return false;
      }

      // Level filter match
      if (selectedLevels.length > 0) {
        // match normalized standard names or absolute strings
        const normalizedSelected = selectedLevels.map(l => l.toUpperCase().replace("_", "-"));
        const recordLevelNorm = s.level_standardized.toUpperCase().replace("_", "-");
        if (!normalizedSelected.includes(recordLevelNorm)) {
          return false;
        }
      }

      // Location match
      if (locationFilter !== "" && s.location !== locationFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Sorting values
      let valA = 0;
      let valB = 0;

      if (sortField === "total_compensation") {
        // total_compensation from DB is normalized into displays depending on displaying currency
        valA = getDisplayComp(a.total_compensation, a.currency, displayCurrency);
        valB = getDisplayComp(b.total_compensation, b.currency, displayCurrency);
      } else if (sortField === "base_salary") {
        valA = getDisplayComp(a.base_salary, a.currency, displayCurrency);
        valB = getDisplayComp(b.base_salary, b.currency, displayCurrency);
      } else if (sortField === "experience_years") {
        valA = a.experience_years;
        valB = b.experience_years;
      }

      if (sortOrder === "desc") {
        return valB - valA;
      } else {
        return valA - valB;
      }
    });
  }, [debouncedCompany, roleFilter, selectedLevels, locationFilter, sortField, sortOrder, displayCurrency]);

  // Compute pagination range indices
  const pageCount = Math.ceil(processedSalaries.length / itemsPerPage) || 1;
  const paginatedSalaries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedSalaries.slice(startIndex, startIndex + itemsPerPage);
  }, [processedSalaries, currentPage, itemsPerPage]);

  const startRecordNum = (currentPage - 1) * itemsPerPage + 1;
  const endRecordNum = Math.min(currentPage * itemsPerPage, processedSalaries.length);

  // Click sorting helper
  const triggerSort = (field: "total_compensation" | "experience_years" | "base_salary") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const RenderSortIndicator = ({ field }: { field: "total_compensation" | "experience_years" | "base_salary" }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1.5 text-neutral-400 group-hover:text-neutral-600 transition-colors" />;
    }
    return sortOrder === "desc" ? (
      <ArrowDown className="w-3.5 h-3.5 ml-1.5 text-[#FF5A5F]" />
    ) : (
      <ArrowUp className="w-3.5 h-3.5 ml-1.5 text-[#FF5A5F]" />
    );
  };

  return (
    <div id="salary-table-view" className="space-y-6">
      {/* Search Header Banner */}
      <div className="bg-white rounded-xl border border-[#EBEBEB] p-6 shadow-sm">
        <h2 className="text-[#222222] text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-[#FF5A5F]" />
          <span>Salary Filters & Query Builder</span>
        </h2>

        {/* Filters Top Grid: Search & Select Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Company Text Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              id="company-search-input"
              type="text"
              placeholder="Search companies (e.g. Google, Amazon)..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#EBEBEB] rounded-lg text-[#222222] placeholder:text-[#717171] focus:outline-none focus:ring-1 focus:ring-[#FF5A5F] focus:border-[#FF5A5F]"
            />
          </div>

          {/* Role Dropdown */}
          <div className="relative">
            <select
              id="role-filter-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-2.5 text-sm bg-white border border-[#EBEBEB] rounded-lg text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#FF5A5F] focus:border-[#FF5A5F]"
            >
              <option value="">All Roles (Ingested)</option>
              {allRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>

          {/* Location Dropdown */}
          <div className="relative">
            <select
              id="location-filter-select"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-2.5 text-sm bg-white border border-[#EBEBEB] rounded-lg text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#FF5A5F] focus:border-[#FF5A5F]"
            >
              <option value="">All Locations</option>
              {allLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>
        </div>

        {/* Levels Multi-select Checkboxes */}
        <div className="mt-5 border-t border-[#EBEBEB] pt-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#717171] block mb-3">
            Standardised Levels Target Tiers
          </label>
          <div className="flex flex-wrap gap-2.5">
            {availableLevels.map((lvl) => {
              const isChecked = selectedLevels.includes(lvl);
              return (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => handleLevelToggle(lvl)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all duration-150 ${
                    isChecked
                      ? "bg-[#FF5A5F]/10 border-[#FF5A5F] text-[#FF5A5F] font-semibold shadow-sm"
                      : "bg-white border-[#EBEBEB] text-[#484848] hover:bg-[#F2F2F2]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    readOnly
                    className="accent-[#FF5A5F] h-3.5 w-3.5 cursor-pointer rounded border-neutral-300 focus:ring-0"
                  />
                  <span>{lvl}</span>
                </button>
              );
            })}
            {selectedLevels.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedLevels([])}
                className="text-[12px] text-[#717171] hover:text-[#FF5A5F] underline ml-2 py-1"
                style={{ textUnderlineOffset: "3px" }}
              >
                Clear all tiers
              </button>
            )}
          </div>
        </div>

        {/* active status indicators with reset action */}
        {(debouncedCompany !== "" || roleFilter !== "" || selectedLevels.length > 0 || locationFilter !== "") && (
          <div className="mt-4 pt-3 border-t border-[#EBEBEB] flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#717171]">
              <span>Active filters:</span>
              {debouncedCompany && (
                <span className="bg-[#F2F2F2] px-2 py-1 rounded inline-flex items-center gap-1">
                  Company: <strong>"{debouncedCompany}"</strong>
                </span>
              )}
              {roleFilter && (
                <span className="bg-[#F2F2F2] px-2 py-1 rounded inline-flex items-center gap-1">
                  Role: <strong>{roleFilter}</strong>
                </span>
              )}
              {selectedLevels.length > 0 && (
                <span className="bg-[#F2F2F2] px-2 py-1 rounded inline-flex items-center gap-1">
                  Levels: <strong>{selectedLevels.join(", ")}</strong>
                </span>
              )}
              {locationFilter && (
                <span className="bg-[#F2F2F2] px-2 py-1 rounded inline-flex items-center gap-1">
                  Location: <strong>{locationFilter}</strong>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-[#FF5A5F] hover:text-[#D93025] flex items-center gap-1 font-semibold hover:underline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset parameters</span>
            </button>
          </div>
        )}
      </div>

      {/* Salary List Output */}
      {processedSalaries.length === 0 ? (
        // Empty State card
        <div className="bg-white rounded-xl border border-[#EBEBEB] text-center py-16 px-4">
          <div className="w-16 h-16 bg-[#F7F7F7] flex items-center justify-center rounded-full mx-auto mb-4">
            <Building2 className="w-8 h-8 text-neutral-400" />
          </div>
          <h3 className="text-[#222222] font-bold text-lg mb-2">
            No records found for these filters
          </h3>
          <p className="text-[#717171] text-sm max-w-sm mx-auto mb-6">
            There are no salary records matching you filter combinations in our mock directory. Try removing a filter or resizing your query.
          </p>
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-2 bg-[#FF5A5F] hover:bg-[#D93025] text-white px-5 py-2.5 text-sm font-semibold rounded-lg transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset filter values</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#717171] px-1 font-medium">
            <div>
              Showing <strong className="text-[#222222] font-semibold">{startRecordNum}–{endRecordNum}</strong> of{" "}
              <strong className="text-[#222222] font-semibold">{processedSalaries.length}</strong> standardized records
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">Active Display Currency:</span>
              <div className="inline-flex rounded-md shadow-sm border border-[#EBEBEB] bg-white h-7 overflow-hidden text-[11px]">
                <button
                  type="button"
                  onClick={() => setDisplayCurrency("INR")}
                  className={`px-2.5 h-full ${
                    displayCurrency === "INR"
                        ? "bg-[#FF5A5F] text-white font-bold"
                        : "bg-white text-neutral-700 hover:bg-[#F2F2F2]"
                  }`}
                >
                  INR (₹)
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayCurrency("USD")}
                  className={`px-2.5 h-full ${
                    displayCurrency === "USD"
                        ? "bg-[#FF5A5F] text-white font-bold"
                        : "bg-white text-neutral-700 hover:bg-[#F2F2F2]"
                  }`}
                >
                  USD ($)
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl border border-[#EBEBEB] shadow-sm overflow-hidden whitespace-nowrap overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#EBEBEB] bg-[#F7F7F7] text-xs font-semibold text-[#717171] uppercase tracking-wider">
                  <th className="px-5 py-3.5 font-semibold">Company</th>
                  <th className="px-5 py-3.5 font-semibold">Role</th>
                  <th className="px-5 py-3.5 font-semibold">Level</th>
                  <th className="px-5 py-3.5 font-semibold">Location</th>
                  <th className="px-5 py-3.5 font-semibold text-center group cursor-pointer hover:bg-neutral-100" onClick={() => triggerSort("experience_years")}>
                    <div className="inline-flex items-center justify-center">
                      <span>Experience</span>
                      <RenderSortIndicator field="experience_years" />
                    </div>
                  </th>
                  <th className="px-5 py-3.5 font-semibold group cursor-pointer hover:bg-neutral-100" onClick={() => triggerSort("base_salary")}>
                    <div className="inline-flex items-center">
                      <span>Base Salary</span>
                      <RenderSortIndicator field="base_salary" />
                    </div>
                  </th>
                  <th className="px-5 py-3.5 font-semibold">Stock (RSUs)</th>
                  <th className="px-5 py-3.5 font-semibold text-right group cursor-pointer hover:bg-neutral-100" onClick={() => triggerSort("total_compensation")}>
                    <div className="inline-flex items-center justify-end w-full">
                      <span>Total Comp</span>
                      <RenderSortIndicator field="total_compensation" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBEBEB]">
                {paginatedSalaries.map((s) => {
                  const levelMeta = getLevelMetadata(s.level_standardized);

                  // Extract standard displaying amounts base on currency toggles
                  const baseVal = getDisplayComp(s.base_salary, s.currency, displayCurrency);
                  const stockVal = s.stock ? getDisplayComp(s.stock, s.currency, displayCurrency) : 0;
                  const tcVal = getDisplayComp(s.total_compensation, s.currency, displayCurrency);

                  return (
                    <tr
                      id={`salary-row-${s.id}`}
                      key={s.id}
                      className="hover:bg-[#F2F2F2] transition-colors duration-100 group"
                    >
                      {/* Company name & slug redirection */}
                      <td className="px-5 py-4 font-bold text-[#222222]">
                        <button
                          type="button"
                          onClick={() => onSelectCompany(s.company.slug)}
                          className="flex items-center gap-2 text-left hover:text-[#FF5A5F] active:text-[#FF5A5F] transition group-hover:translate-x-0.5 transition-transform duration-150"
                        >
                          <div className="w-7 h-7 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-extrabold flex items-center justify-center rounded-md uppercase tracking-wider shrink-0">
                            {s.company.name.slice(0, 2)}
                          </div>
                          <div>
                            <span className="block max-w-[150px] truncate">{s.company.name}</span>
                            {s.source === "AI_INFERRED" && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-[#FFB400] font-normal leading-none mt-0.5">
                                <Sparkles className="w-2.5 h-2.5 fill-current" /> AI Inferred
                              </span>
                            )}
                          </div>
                        </button>
                      </td>

                      {/* Job Title */}
                      <td className="px-5 py-4 text-[#484848] font-medium">
                        {s.role}
                      </td>

                      {/* Level Badge column */}
                      <td className="px-5 py-4">
                        <Badge className={`${levelMeta.badgeClass} rounded-full`}>
                          {s.level_standardized}
                        </Badge>
                      </td>

                      {/* Location Map */}
                      <td className="px-5 py-4 text-[#717171] inline-flex items-center gap-1 mt-4">
                        <MapPin className="w-3.5 h-3.5 text-[#FF5A5F]" />
                        <span>{s.location}</span>
                      </td>

                      {/* Experience years */}
                      <td className="px-5 py-4 text-[#484848] text-center font-medium">
                        {s.experience_years} {s.experience_years === 1 ? "yr" : "yrs"}
                      </td>

                      {/* Base Salary */}
                      <td className="px-5 py-4 text-[#484848] font-mono">
                        {formatSalary(baseVal, displayCurrency)}
                      </td>

                      {/* Stock RSUs/ESOP (Dashes representation when missing) */}
                      <td className="px-5 py-4 text-[#484848]">
                        {s.stock && s.stock > 0 ? (
                          <span className="font-mono">{formatSalary(stockVal, displayCurrency)}</span>
                        ) : (
                          <span className="text-[#717171]">—</span>
                        )}
                      </td>

                      {/* Total Compensation (Dominant text Data Blue #0369A1, larger bold) */}
                      <td className="px-5 py-4 text-right font-bold text-base text-[#0369A1]">
                        <span className="font-mono">{formatSalary(tcVal, displayCurrency)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination bar controls */}
          {pageCount > 1 && (
            <div className="flex items-center justify-between border-t border-[#EBEBEB] pt-4 px-1 mt-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 border border-[#EBEBEB] rounded-lg text-[#484848] hover:bg-[#F2F2F2] disabled:opacity-40 disabled:hover:bg-white transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-xs text-[#717171]">
                Page <strong className="text-[#222222]">{currentPage}</strong> of <strong className="text-[#222222]">{pageCount}</strong>
              </span>

              <button
                type="button"
                disabled={currentPage === pageCount}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 border border-[#EBEBEB] rounded-lg text-[#484848] hover:bg-[#F2F2F2] disabled:opacity-40 disabled:hover:bg-white transition"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
