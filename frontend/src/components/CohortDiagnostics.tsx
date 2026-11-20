"use client";

import React, { useState, useEffect } from "react";
import { CohortResponse, fetchCohortData } from "@/lib/api";

export default function CohortDiagnostics() {
  const [cohort, setCohort] = useState<CohortResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredStudent, setHoveredStudent] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCohortData();
      setCohort(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load cohort diagnostic data.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 font-mono text-xs text-ink-muted flex items-center justify-center min-h-[400px]">
        <span>Loading Class-Wide Forensic Telemetry & Matrix...</span>
      </div>
    );
  }

  if (error || !cohort) {
    return (
      <div className="p-8 font-mono text-xs text-vermilion">
        <p>{error || "No cohort records available."}</p>
        <button
          onClick={loadData}
          className="mt-3 px-3 py-1 bg-carbon text-alabaster text-[10px] uppercase tracking-wider"
        >
          Retry
        </button>
      </div>
    );
  }

  const { kpis, matrix, intervention_priorities } = cohort;
  const concepts = [
    "Hash Maps & O(1)",
    "Recursion & Base Cases",
    "Edge-Case Guards",
    "Time Complexity",
    "Memory & Mutation",
    "Async & Concurrency",
  ];

  return (
    <div className="flex flex-col bg-alabaster min-h-[calc(100vh-56px)] select-none">
      {/* Top 4-Column Architectural KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-rule-hairline bg-stone font-mono">
        {/* KPI 1 */}
        <div className="p-5 border-r border-rule-hairline">
          <div className="text-[10px] uppercase tracking-wider text-ink-muted mb-1">
            Active Cohort Size
          </div>
          <div className="text-3xl font-serif font-bold text-ink-primary">
            {kpis.cohort_size}
          </div>
          <div className="text-[10px] text-ink-muted mt-1">
            Anonymized STU-01 through STU-30
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-5 border-r border-rule-hairline">
          <div className="text-[10px] uppercase tracking-wider text-ink-muted mb-1">
            Verified Mastery Rate
          </div>
          <div className="text-3xl font-serif font-bold text-sage">
            {(kpis.verified_mastery_rate * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-ink-muted mt-1">
            Logic-first IRT verified
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-5 border-r border-rule-hairline">
          <div className="text-[10px] uppercase tracking-wider text-ink-muted mb-1">
            Copy-Paste Flagged
          </div>
          <div className="text-3xl font-serif font-bold text-vermilion">
            {kpis.copy_paste_flagged}
          </div>
          <div className="text-[10px] text-ink-muted mt-1">
            Perturbation failure rate
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-5">
          <div className="text-[10px] uppercase tracking-wider text-ink-muted mb-1">
            Non-Native Students Protected
          </div>
          <div className="text-3xl font-serif font-bold text-sage">
            {kpis.non_native_protected}
          </div>
          <div className="text-[10px] text-sage font-medium mt-1">
            0 False Positives under Shield
          </div>
        </div>
      </div>

      {/* Main Asymmetric Grid (70% Matrix / 30% Lecture Interventions) */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left: 30-Student × 6-Concept Matrix (70%) */}
        <div className="w-full lg:w-[70%] border-r border-rule-hairline p-6 overflow-auto">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="font-serif italic text-xl text-ink-primary">
                Conceptual Bottleneck Ledger
              </h3>
              <p className="font-mono text-[10px] text-ink-muted uppercase tracking-wider mt-0.5">
                30 Students × 6 Cognitive Architecture Pillars
              </p>
            </div>

            {/* Muted Tonal Cell Legend */}
            <div className="flex items-center space-x-3 font-mono text-[10px]">
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 bg-[#DCEADB] border border-sage-border inline-block" />
                <span className="text-ink-muted">&ge; 75% Mastery</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 bg-[#F8EED9] border border-ochre-border inline-block" />
                <span className="text-ink-muted">60-74% Review</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 bg-[#FCE6E2] border border-vermilion-border inline-block" />
                <span className="text-ink-muted">&lt; 60% Critical Gap</span>
              </div>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="border border-rule-hairline bg-stone overflow-x-auto">
            <table className="w-full border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-rule-hairline bg-stone text-ink-muted text-[10px] uppercase text-left">
                  <th className="p-2.5 border-r border-rule-hairline font-semibold">
                    Student ID
                  </th>
                  <th className="p-2.5 border-r border-rule-hairline font-semibold">
                    Archetype
                  </th>
                  {concepts.map((c) => (
                    <th
                      key={c}
                      className="p-2.5 border-r border-rule-hairline font-semibold text-center whitespace-nowrap"
                    >
                      {c}
                    </th>
                  ))}
                  <th className="p-2.5 font-semibold text-right">Overall</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule-hairline bg-alabaster">
                {matrix.map((row) => {
                  const isHovered = hoveredStudent === row.student_id;
                  return (
                    <tr
                      key={row.student_id}
                      onMouseEnter={() => setHoveredStudent(row.student_id)}
                      onMouseLeave={() => setHoveredStudent(null)}
                      className={`transition-colors ${
                        isHovered ? "bg-[#EDE9DE]" : "hover:bg-[#F2EFE8]"
                      }`}
                    >
                      {/* Student ID */}
                      <td className="p-2 border-r border-rule-hairline font-bold text-ink-primary">
                        {row.student_id}
                      </td>

                      {/* Archetype Badge */}
                      <td className="p-2 border-r border-rule-hairline text-[10px] uppercase whitespace-nowrap">
                        <span
                          className={`px-1.5 py-0.5 border ${
                            row.archetype === "genuine_builder"
                              ? "border-sage text-sage bg-sage-subtle"
                              : row.archetype === "non_native_expert"
                              ? "border-sage text-sage bg-sage-subtle font-bold"
                              : row.archetype === "surface_ai_assisted"
                              ? "border-ochre text-ochre bg-ochre-subtle"
                              : "border-vermilion text-vermilion bg-vermilion-subtle"
                          }`}
                        >
                          {row.archetype.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* Concept Score Cells */}
                      {concepts.map((c) => {
                        const score = row.concepts[c] || 0;
                        const cellColor =
                          score >= 0.75
                            ? "bg-[#DCEADB] text-sage border-sage-border font-medium"
                            : score >= 0.60
                            ? "bg-[#F8EED9] text-ochre border-ochre-border"
                            : "bg-[#FCE6E2] text-vermilion border-vermilion-border font-bold";

                        return (
                          <td
                            key={c}
                            className="p-1 border-r border-rule-hairline text-center"
                          >
                            <div
                              className={`py-1 px-1.5 text-[11px] border ${cellColor}`}
                              title={`${row.student_id} · ${c}: ${(score * 100).toFixed(0)}%`}
                            >
                              {(score * 100).toFixed(0)}%
                            </div>
                          </td>
                        );
                      })}

                      {/* Overall Average */}
                      <td className="p-2 text-right font-bold text-ink-primary">
                        {(row.overall_score * 100).toFixed(0)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Lecture Intervention Priorities (30%) */}
        <div className="w-full lg:w-[30%] bg-stone p-6 space-y-5 flex flex-col justify-between">
          <div>
            <div className="border-b border-rule-hairline pb-3 mb-4">
              <span className="font-mono text-[10px] text-vermilion font-bold uppercase tracking-widest">
                PRIORITY DIAGNOSTIC ACTION
              </span>
              <h3 className="font-serif italic text-2xl text-ink-primary mt-1">
                Lecture Interventions
              </h3>
              <p className="font-mono text-xs text-ink-muted mt-1">
                Ranked pedagogical fixes addressing class-wide vulnerabilities.
              </p>
            </div>

            <div className="space-y-4">
              {intervention_priorities.map((item) => (
                <div
                  key={item.rank}
                  className="p-4 bg-alabaster border border-rule-hairline space-y-2 font-mono text-xs shadow-sm"
                >
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-ink-primary text-sm flex items-center space-x-1.5">
                      <span className="w-4 h-4 bg-carbon text-alabaster text-[10px] flex items-center justify-center font-bold">
                        {item.rank}
                      </span>
                      <span>{item.concept}</span>
                    </span>
                    <span className="text-vermilion font-bold text-[11px]">
                      {(item.failure_rate * 100).toFixed(0)}% DEFICIT
                    </span>
                  </div>

                  <div className="text-[10px] text-ink-muted">
                    Impacts:{" "}
                    <strong className="text-ink-primary">
                      {item.affected_students} of 30 students
                    </strong>
                  </div>

                  <div className="p-2.5 bg-stone border-l-2 border-vermilion font-sans text-xs text-ink-primary leading-relaxed">
                    {item.actionable_seminar_fix}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-rule-hairline pt-4 font-mono text-[10px] text-ink-muted">
            REPORT GENERATED DETERMINISTICALLY VIA VERIMIND AST ENGINE
          </div>
        </div>
      </div>
    </div>
  );
}
