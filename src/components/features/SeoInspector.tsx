/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { Company, SalaryWithCompany } from "../../types";
import { formatSalary } from "../../lib/utils";
import { Terminal, Copy, Check, Eye } from "lucide-react";

interface SeoInspectorProps {
  activeView: "salaries" | "company" | "compare";
  activeCompany?: Company;
  companySalaries?: SalaryWithCompany[];
  activeDisplayCurrency: "INR" | "USD";
}

export function SeoInspector({
  activeView,
  activeCompany,
  companySalaries = [],
  activeDisplayCurrency,
}: SeoInspectorProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  // Compute SEO Variables dynamically based on current state
  let title = "Software Engineer & Tech Salaries in India | TalentDash";
  let description =
    "Explore crowdsourced, verified tech compensation intelligence. Filter, compare, and analyze base salary, bonuses, and stocks across top Indian tech companies.";
  let canonicalUrl = "https://talentdash.com/salaries";

  // Dynamic calculations for companies
  let minSalaryStr = "";
  let maxSalaryStr = "";
  let sampleRoles = "";

  if (activeView === "company" && activeCompany) {
    const name = activeCompany.name;
    const comps = companySalaries.map((s) => s.total_compensation / 100);
    const minComp = comps.length > 0 ? Math.min(...comps) : 0;
    const maxComp = comps.length > 0 ? Math.max(...comps) : 0;

    minSalaryStr = formatSalary(minComp, activeDisplayCurrency);
    maxSalaryStr = formatSalary(maxComp, activeDisplayCurrency);

    title = `Software Engineer Salaries at ${name} India — SDE-I to Staff | TalentDash`;
    description = `Explore standardized, verified software engineer salaries at ${name} India. See detailed compensation breakdown of base salary, bonus, and equity from ${minSalaryStr} to ${maxSalaryStr}.`;
    canonicalUrl = `https://talentdash.com/companies/${activeCompany.slug}`;
  } else if (activeView === "compare") {
    title = "Compare Tech Salaries & Job Offers Side-by-Side | TalentDash";
    description =
      "Analyze and compare total compensation packages across Tech giants. Break down base pay, cash bonus, and standard stock equity side-by-side with delta analysis.";
    canonicalUrl = "https://talentdash.com/compare";
  }

  // Generate perfect JSON-LD Schema
  const jsonLd =
    activeView === "company" && activeCompany && companySalaries.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "Dataset",
          "name": `Compensation Data for ${activeCompany.name} India`,
          "description": description,
          "url": canonicalUrl,
          "license": "https://creativecommons.org/licenses/by/4.0/",
          "creator": {
            "@type": "Organization",
            "name": "TalentDash",
            "url": "https://talentdash.com"
          },
          "distribution": [
            {
              "@type": "DataDownload",
              "encodingFormat": "application/json",
              "contentUrl": `${canonicalUrl}/api`
            }
          ],
          "measurementTechnique": "Crowdsourced normalisation, validated using LLM + Pydantic validation flow."
        }
      : {
          "@context": "https://schema.org",
          "@type": "Dataset",
          "name": "Software and Tech Engineer Salaries normalisation dataset",
          "description": description,
          "url": canonicalUrl,
          "license": "https://creativecommons.org/licenses/by/4.0/",
          "creator": {
            "@type": "Organization",
            "name": "TalentDash"
          }
        };

  const jsonString = JSON.stringify(jsonLd, null, 2);

  // Inject actual SEO Tags into browser <head> at runtime
  useEffect(() => {
    document.title = title;

    // Head tag update helpers
    const updateMetaTag = (attr: string, value: string, content: string) => {
      let element = document.querySelector(`meta[${attr}="${value}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attr, value);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    updateMetaTag("name", "description", description);
    updateMetaTag("property", "og:title", title);
    updateMetaTag("property", "og:description", description);
    updateMetaTag("property", "og:url", canonicalUrl);
    updateMetaTag("property", "og:type", "website");

    // Canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", canonicalUrl);

    // Schema script
    let schemaScript = document.getElementById("talentdash-jsonld");
    if (!schemaScript) {
      schemaScript = document.createElement("script");
      schemaScript.setAttribute("id", "talentdash-jsonld");
      schemaScript.setAttribute("type", "application/ld+json");
      document.head.appendChild(schemaScript);
    }
    schemaScript.textContent = jsonString;
  }, [title, description, canonicalUrl, jsonString]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="seo-inspector-container" className="bg-white border border-[#EBEBEB] rounded-lg overflow-hidden shadow-sm mt-8">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-[#222222] hover:bg-[#F2F2F2] transition-all font-medium text-sm border-b border-[#EBEBEB]"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#FF5A5F]" />
          <span>SEO Metadata & Googlebot Schema Inspector</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#717171]">
          <Eye className="w-3.5 h-3.5" />
          <span>{open ? "Hide Details" : "Show Schema Markup"}</span>
        </div>
      </button>

      {open && (
        <div className="p-5 bg-neutral-900 text-neutral-200 font-mono text-xs overflow-x-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-neutral-800 pb-4">
            <div>
              <p className="text-[#FF5A5F] font-bold uppercase tracking-wider mb-1 text-[10px]">Title Tag (&lt;title&gt;)</p>
              <p className="text-white text-sm break-words select-all">{title}</p>
            </div>
            <div>
              <p className="text-[#FF5A5F] font-bold uppercase tracking-wider mb-1 text-[10px]">Meta Description</p>
              <p className="text-neutral-300 text-sm break-words select-all leading-normal">{description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-neutral-800 pb-4">
            <div>
              <p className="text-[#0369A1] font-bold uppercase tracking-wider mb-1 text-[10px]">Canonical URL</p>
              <p className="text-neutral-300 break-words select-all">{canonicalUrl}</p>
            </div>
            <div>
              <p className="text-[#0369A1] font-bold uppercase tracking-wider mb-1 text-[10px]">Open Graph Slug (og:url)</p>
              <p className="text-neutral-300 break-words select-all">{canonicalUrl}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#008A05] font-bold uppercase tracking-wider text-[10px]">JSON-LD Structured Data Schema (schema.org/Dataset)</span>
              <button
                type="button"
                onClick={copyToClipboard}
                className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-2xl text-neutral-300 px-3 py-1 rounded transition border border-neutral-700 hover:text-white"
                style={{ fontSize: "11px" }}
              >
                {copied ? <Check className="w-3 h-3 text-[#008A05]" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied!" : "Copy JSON-LD"}</span>
              </button>
            </div>
            <pre className="p-3 bg-neutral-950 text-[#00FF00] rounded border border-neutral-800 max-h-60 overflow-y-auto text-[11px] leading-relaxed select-all">
              {jsonString}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
