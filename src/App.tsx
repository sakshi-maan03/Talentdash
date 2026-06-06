/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { COMPANIES, MOCK_SALARIES } from "./lib/mock-data";
import { Currency } from "./types";
import { SalaryTable } from "./components/features/SalaryTable";
import { CompanyProfile } from "./components/features/CompanyProfile";
import { CompareRecords } from "./components/features/CompareRecords";
import { SeoInspector } from "./components/features/SeoInspector";
import {
  Globe,
  Briefcase,
  ArrowRightLeft,
  Building2,
  TrendingUp,
  Search,
  Sparkles,
  Award,
  X,
  ArrowRight
} from "lucide-react";

// Hash routing parsing helper
function parseHashUrl() {
  const hash = window.location.hash || "";
  
  // Format can be text after '#/' or '#'
  const normalizedHash = hash.startsWith("#/") ? hash.slice(2) : hash.startsWith("#") ? hash.slice(1) : hash;
  const [routePath, queryString] = normalizedHash.split("?");
  const params = new URLSearchParams(queryString || "");

  let view: "salaries" | "company" | "compare" = "salaries";
  let companySlug = "";
  let c1 = ""; // compare slot company slug
  let s1 = ""; // compare slot record ID
  let s2 = ""; // compare slot record ID

  if (routePath.startsWith("companies/")) {
    view = "company";
    companySlug = routePath.substring("companies/".length);
  } else if (routePath === "compare") {
    view = "compare";
    c1 = params.get("c1") || "";
    s1 = params.get("s1") || "";
    s2 = params.get("s2") || "";
  } else {
    view = "salaries";
  }

  // Parse filters from parameters
  const company = params.get("company") || "";
  const role = params.get("role") || "";
  const levels = params.get("level") ? params.get("level")!.split(",") : [];
  const location = params.get("location") || "";

  return {
    view,
    companySlug,
    c1,
    s1,
    s2,
    filters: { company, role, levels, location }
  };
}

export default function App() {
  // Read initial route state from URL hash
  const [routeState, setRouteState] = useState(parseHashUrl());
  const [globalCurrency, setGlobalCurrency] = useState<Currency>("INR");

  // Global Header Search and suggestion list state handlers
  const [globalSearch, setGlobalSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside search container
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute unique roles & count verified salary records for role meta summaries
  const uniqueRolesWithStats = useMemo(() => {
    const counts: Record<string, number> = {};
    MOCK_SALARIES.forEach((s) => {
      if (s.role) counts[s.role] = (counts[s.role] || 0) + 1;
    });
    return Object.entries(counts).map(([roleName, count]) => ({
      name: roleName,
      count
    }));
  }, []);

  // Filter suggestion results dynamically matching the global search term
  const filteredSuggestions = useMemo(() => {
    const query = globalSearch.toLowerCase().trim();
    
    // When query is empty, suggest featured platforms to kickstart navigation
    if (!query) {
      return {
        companies: COMPANIES.slice(0, 4),
        roles: uniqueRolesWithStats.slice(0, 4),
        isPlaceholder: true
      };
    }

    const matchedCompanies = COMPANIES.filter((c) =>
      c.name.toLowerCase().includes(query) ||
      c.industry.toLowerCase().includes(query)
    ).slice(0, 5);

    const matchedRoles = uniqueRolesWithStats.filter((r) =>
      r.name.toLowerCase().includes(query)
    ).slice(0, 5);

    return {
      companies: matchedCompanies,
      roles: matchedRoles,
      isPlaceholder: false
    };
  }, [globalSearch, uniqueRolesWithStats]);

  // Track hash changes in browser address bar
  useEffect(() => {
    const onHashChange = () => {
      setRouteState(parseHashUrl());
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Set default initial page hash if empty
  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = "#/salaries";
    }
  }, []);

  // Update hash state helper
  const updateHash = useCallback((path: string, paramsMap?: Record<string, string>) => {
    let hashStr = `#/${path}`;
    if (paramsMap) {
      const q = new URLSearchParams();
      Object.entries(paramsMap).forEach(([k, v]) => {
        if (v) q.set(k, v);
      });
      const qStr = q.toString();
      if (qStr) hashStr += `?${qStr}`;
    }
    window.location.hash = hashStr;
  }, []);

  // Core callback: updating filter inputs pushes query states back into URL
  const handleFiltersChange = useCallback((filters: {
    company: string;
    role: string;
    levels: string[];
    location: string;
  }) => {
    const params: Record<string, string> = {};
    if (filters.company) params.company = filters.company;
    if (filters.role) params.role = filters.role;
    if (filters.levels.length > 0) params.level = filters.levels.join(",");
    if (filters.location) params.location = filters.location;

    updateHash("salaries", params);
  }, [updateHash]);

  // Redirection routers callbacks
  const handleSelectCompany = (slug: string) => {
    updateHash(`companies/${slug}`);
  };

  // Form submit handler triggers default redirection or first exact match
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = globalSearch.trim();
    if (!query) return;

    // Check for exact matching company
    const exactCompany = COMPANIES.find(
      (c) => c.name.toLowerCase() === query.toLowerCase()
    );

    if (exactCompany) {
      handleSelectCompany(exactCompany.slug);
    } else {
      // Check for exact matching role or partial matching search filter
      const exactRole = uniqueRolesWithStats.find(
        (r) => r.name.toLowerCase() === query.toLowerCase()
      );
      if (exactRole) {
        updateHash("salaries", { role: exactRole.name });
      } else {
        // Fallback to table search query
        updateHash("salaries", { company: query });
      }
    }

    setShowDropdown(false);
    setGlobalSearch("");
  };

  const handleCompareWithSlug = (slug: string) => {
    // find a relevant salary record for slot 1
    const rec1 = MOCK_SALARIES.find((s) => s.company.slug === slug);
    // find a different company salary record for slot 2
    const rec2 = MOCK_SALARIES.find((s) => s.company.slug !== slug);

    updateHash("compare", {
      s1: rec1 ? rec1.id : "sal_goog_03",
      s2: rec2 ? rec2.id : "sal_amzn_02"
    });
  };

  const handleUpdateCompareSlotA = (id: string) => {
    updateHash("compare", {
      s1: id,
      s2: routeState.s2 || "sal_amzn_02"
    });
  };

  const handleUpdateCompareSlotB = (id: string) => {
    updateHash("compare", {
      s1: routeState.s1 || "sal_goog_03",
      s2: id
    });
  };

  // Find active company entity for detail profile
  const activeCompanyRecord = useMemo(() => {
    if (routeState.view !== "company") return undefined;
    return COMPANIES.find((c) => c.slug === routeState.companySlug);
  }, [routeState.view, routeState.companySlug]);

  const activeCompanySalaries = useMemo(() => {
    if (!activeCompanyRecord) return [];
    return MOCK_SALARIES.filter((s) => s.company_id === activeCompanyRecord.id);
  }, [activeCompanyRecord]);

  // Sidebar trending elements for visual rhythm
  const trendingStats = useMemo(() => {
    const totalsByCompany: Record<string, { company: typeof COMPANIES[0]; count: number }> = {};
    COMPANIES.forEach((c) => {
      totalsByCompany[c.id] = { company: c, count: 0 };
    });
    MOCK_SALARIES.forEach((s) => {
      if (totalsByCompany[s.company_id]) {
        totalsByCompany[s.company_id].count++;
      }
    });

    return Object.values(totalsByCompany)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col font-sans select-none text-[#484848] antialiased">
      {/* Navigation Top Header in Airbnb Black #222222 */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#EBEBEB] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 md:px-5 flex items-center justify-between h-16 gap-3 sm:gap-4">
          {/* Logo with Brand color Coral Red #FF5A5F */}
          <button
            type="button"
            onClick={() => updateHash("salaries")}
            className="flex items-center gap-2 text-[#222222] font-black tracking-tight text-lg sm:text-xl text-left shrink-0"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#FF5A5F] flex items-center justify-center text-white text-sm sm:text-base shadow-sm">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className="hidden xs:inline">
              Talent<span className="text-[#FF5A5F]">Dash</span>
            </span>
          </button>

          {/* Global Header Search Bar (with instant suggestions dropdown) */}
          <div ref={searchRef} className="flex-1 max-w-[140px] xs:max-w-xs sm:max-w-sm md:max-w-md mx-1 sm:mx-2 md:mx-4 relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-400" />
              </span>
              <input
                id="global-header-search"
                type="text"
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search companies or roles..."
                className="w-full pl-8 sm:pl-10 pr-8 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm bg-[#F7F7F7] border border-[#EBEBEB] text-[#222222] placeholder:text-[#717171] rounded-full focus:outline-none focus:ring-1 focus:ring-[#FF5A5F] focus:border-[#FF5A5F] focus:bg-white transition-all shadow-2xs"
              />
              {globalSearch && (
                <button
                  type="button"
                  onClick={() => setGlobalSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-[#222222] transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              )}
            </form>

            {/* Dropdown Suggestions Panel */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#EBEBEB] rounded-xl shadow-lg z-50 overflow-hidden max-h-[360px] overflow-y-auto">
                {/* Companies Section */}
                <div className="p-2 border-b border-[#EBEBEB]">
                  <div className="px-2.5 py-1 text-[9px] sm:text-[10px] font-bold text-[#717171] uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-[#FF5A5F]" />
                    <span>{filteredSuggestions.isPlaceholder ? "Featured Companies" : "Suggested Companies"}</span>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {filteredSuggestions.companies.length > 0 ? (
                      filteredSuggestions.companies.map((comp) => (
                        <button
                          type="button"
                          key={`suggest-co-${comp.id}`}
                          onClick={() => {
                            handleSelectCompany(comp.slug);
                            setGlobalSearch("");
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-[#F2F2F2] flex items-center justify-between transition group"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-bold text-[#222222] group-hover:text-[#FF5A5F] transition-colors truncate">
                              {comp.name}
                            </span>
                            <span className="text-[10px] text-neutral-400 truncate hidden sm:inline">
                              • {comp.industry}
                            </span>
                          </div>
                          <span className="text-[9px] sm:text-[10px] text-[#717171] bg-neutral-100 py-0.5 px-1.5 rounded flex items-center gap-1 shrink-0">
                            <span>Profile</span>
                            <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-2.5 py-2 text-[11px] text-neutral-500 italic">
                        No companies match "{globalSearch}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Roles Section */}
                <div className="p-2">
                  <div className="px-2.5 py-1 text-[9px] sm:text-[10px] font-bold text-[#717171] uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3 h-3 text-[#FF5A5F]" />
                    <span>{filteredSuggestions.isPlaceholder ? "Popular Roles" : "Suggested Roles"}</span>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {filteredSuggestions.roles.length > 0 ? (
                      filteredSuggestions.roles.map((r) => (
                        <button
                          type="button"
                          key={`suggest-role-${r.name}`}
                          onClick={() => {
                            updateHash("salaries", { role: r.name });
                            setGlobalSearch("");
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-[#F2F2F2] flex items-center justify-between transition group"
                        >
                          <span className="font-semibold text-[#484848] group-hover:text-[#FF5A5F] transition-colors truncate">
                            {r.name}
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-[#0369A1] font-medium bg-[#0369A1]/5 px-2 py-0.5 rounded-full shrink-0">
                            {r.count} {r.count === 1 ? "entry" : "entries"}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-2.5 py-2 text-[11px] text-neutral-500 italic">
                        No roles match "{globalSearch}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit tip summary footer */}
                {globalSearch.trim() && (
                  <div className="bg-[#F7F7F7] px-3.5 py-2 border-t border-[#EBEBEB] text-[10px] text-[#717171] flex items-center justify-between">
                    <span>Press <kbd className="font-sans font-bold text-neutral-500 bg-white border border-[#EBEBEB] rounded px-1 text-[9px]">Enter ↵</kbd> to query</span>
                    <span className="text-[#FF5A5F] font-semibold">Instant Search</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation link elements */}
          <nav className="flex items-center gap-1 sm:gap-4 md:gap-6 text-[#484848]">
            <button
              type="button"
              onClick={() => updateHash("salaries")}
              className={`text-xs md:text-sm font-semibold tracking-wide py-2 px-3 rounded-lg transition-all flex items-center gap-1.5 ${
                routeState.view === "salaries"
                  ? "bg-[#FF5A5F]/10 text-[#FF5A5F]"
                  : "hover:bg-[#F2F2F2] hover:text-[#222222]"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Salaries Index</span>
            </button>

            <button
              type="button"
              onClick={() => updateHash("compare")}
              className={`text-xs md:text-sm font-semibold tracking-wide py-2 px-3 rounded-lg transition-all flex items-center gap-1.5 ${
                routeState.view === "compare"
                  ? "bg-[#FF5A5F]/10 text-[#FF5A5F]"
                  : "hover:bg-[#F2F2F2] hover:text-[#222222]"
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Offer Comparisons</span>
            </button>

            <div className="w-px h-5 bg-[#EBEBEB] hidden sm:block"></div>

            {/* In-app Currency configuration toggle */}
            <div className="inline-flex rounded-lg p-0.5 bg-[#F7F7F7] border border-[#EBEBEB] text-[11px] h-8 align-middle">
              <button
                type="button"
                onClick={() => setGlobalCurrency("INR")}
                className={`px-2.5 rounded-md font-bold transition-all ${
                  globalCurrency === "INR"
                    ? "bg-white text-[#222222] shadow-xs"
                    : "text-neutral-500 hover:text-black"
                }`}
              >
                ₹ INR
              </button>
              <button
                type="button"
                onClick={() => setGlobalCurrency("USD")}
                className={`px-2.5 rounded-md font-bold transition-all ${
                  globalCurrency === "USD"
                    ? "bg-white text-[#222222] shadow-xs"
                    : "text-neutral-500 hover:text-black"
                }`}
              >
                $ USD
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-5 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main contents body */}
          <div className="lg:col-span-3 space-y-6">
            {routeState.view === "salaries" && (
              <SalaryTable
                onSelectCompany={handleSelectCompany}
                displayCurrency={globalCurrency}
                setDisplayCurrency={setGlobalCurrency}
                initialFilters={routeState.filters}
                onFiltersChange={handleFiltersChange}
              />
            )}

            {routeState.view === "company" && activeCompanyRecord && (
              <CompanyProfile
                company={activeCompanyRecord}
                onBack={() => updateHash("salaries")}
                onCompareWithSlug={handleCompareWithSlug}
                displayCurrency={globalCurrency}
                setDisplayCurrency={setGlobalCurrency}
              />
            )}

            {routeState.view === "compare" && (
              <CompareRecords
                selectedIdA={routeState.s1 || "sal_goog_01"}
                selectedIdB={routeState.s2 || "sal_amzn_01"}
                onChangeA={handleUpdateCompareSlotA}
                onChangeB={handleUpdateCompareSlotB}
                displayCurrency={globalCurrency}
                setDisplayCurrency={setGlobalCurrency}
              />
            )}
          </div>

          {/* Right-hand Sidebar Layout (Directories & Trending Insights panel) */}
          <div className="lg:col-span-1 space-y-6">
            {/* 1. Quick Info box */}
            <div className="bg-white border border-[#EBEBEB] p-5 rounded-xl shadow-sm text-xs space-y-3.5">
              <h3 className="font-bold text-[#222222] flex items-center gap-1.5 uppercase tracking-wider border-b border-[#EBEBEB] pb-3 text-2xs text-[#717171]">
                <Globe className="w-4 h-4 text-[#FF5A5F]" />
                <span>Standardized Architecture</span>
              </h3>
              <p className="leading-relaxed">
                Welcome to <strong>TalentDash</strong>. Unlike raw opinion platforms, we source, batch-process, and normalize verified engineer salaries to keep compensation metrics transparent across India and global offices.
              </p>
              <div className="p-3 bg-indigo-50 rounded text-[11px] text-[#0369A1] font-semibold border border-indigo-100 flex items-start gap-1">
                <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Pydantic schemas enforce type bounds; invalid roles are strictly filtered at scale.</span>
              </div>
            </div>

            {/* 2. Trending Company Directory List */}
            <div className="bg-white border border-[#EBEBEB] p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="font-bold text-[#222222] flex items-center gap-1.5 uppercase tracking-wider text-2xs text-[#717171] border-b border-[#EBEBEB] pb-3">
                <Building2 className="w-4 h-4 text-[#FF5A5F]" />
                <span>Trending Companies</span>
              </h3>

              <div className="space-y-3">
                {trendingStats.map(({ company, count }) => (
                  <button
                    type="button"
                    key={`side-${company.id}`}
                    onClick={() => handleSelectCompany(company.slug)}
                    className="w-full flex items-center justify-between text-left p-2 hover:bg-[#F2F2F2] rounded-lg transition group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black flex items-center justify-center rounded uppercase tracking-wider group-hover:scale-105 transition-transform">
                        {company.name.slice(0, 2)}
                      </div>
                      <div className="text-xs">
                        <span className="block font-bold text-[#222222]">{company.name}</span>
                        <span className="text-[10px] text-[#717171]">{company.industry}</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-neutral-100 text-[#484848] py-0.5 px-2 rounded-full font-bold">
                      {count} caps
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live SEO Inspection component panel */}
        <SeoInspector
          activeView={routeState.view}
          activeCompany={activeCompanyRecord}
          companySalaries={activeCompanySalaries as any[]}
          activeDisplayCurrency={globalCurrency}
        />
      </main>

      {/* Humble professional footer */}
      <footer className="bg-white border-t border-[#EBEBEB] mt-12 py-6">
        <div className="max-w-7xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#717171]">
          <div>
            <span>© 2026 TalentDash Inc. All Rights Reserved. Confidential trial delivery.</span>
          </div>
          <div>
            <span>Strict compensation audit standards. Built with React and Tailwind CSS.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
