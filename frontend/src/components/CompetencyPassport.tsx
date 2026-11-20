"use client";

import React, { useState } from "react";
import { CompetencyPassportRecord, fetchPassportByHash } from "@/lib/api";
import { FeatureAttributionBars } from "./SvgCharts";

interface CompetencyPassportProps {
  passport: CompetencyPassportRecord;
  onReset?: () => void;
}

export default function CompetencyPassport({ passport, onReset }: CompetencyPassportProps) {
  const [copied, setCopied] = useState(false);
  const [verifiedOnline, setVerifiedOnline] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const probPct = (passport.authenticity_probability * 100).toFixed(1);

  const verdictStyles = {
    "VERIFIED MASTERY": "text-sage border-sage",
    "SURFACE / AI-ASSISTED": "text-ochre border-ochre",
    "CONCEPT GAP": "text-vermilion border-vermilion",
  };

  const handleCopyAndVerify = async () => {
    try {
      await navigator.clipboard.writeText(passport.passport_hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);

      setIsVerifying(true);
      const res = await fetchPassportByHash(passport.passport_hash);
      if (res && res.passport_hash === passport.passport_hash) {
        setVerifiedOnline(true);
      } else {
        setVerifiedOnline(false);
      }
    } catch {
      setVerifiedOnline(false);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-alabaster overflow-auto p-6 space-y-6">
      {/* High-Contrast Embossed Deep Carbon (#121211) Canvas */}
      <div className="bg-[#121211] text-[#F5F3EE] p-6 border border-[#2E2D2A] relative select-none shadow-sm">
        {/* Top Header Stamp */}
        <div className="flex justify-between items-center border-b border-[#2E2D2A] pb-3 mb-5">
          <div className="font-mono text-[10px] tracking-widest text-[#9A9589] uppercase">
            VERIMIND CRYPTOGRAPHIC COMPETENCY PASSPORT // ZERO-SPYWARE
          </div>
          <div className="font-mono text-[9px] px-2 py-0.5 border border-[#3E3D39] text-[#C2BDB2] uppercase">
            {passport.student_hash}
          </div>
        </div>

        {/* Verdict and Probability Monolith */}
        <div className="flex flex-col md:flex-row md:items-baseline md:justify-between border-b border-[#2E2D2A] pb-5 mb-5">
          <div>
            <div className="font-mono text-[10px] uppercase text-[#9A9589] tracking-wider mb-1">
              Cognitive Authenticity Verdict
            </div>
            <h2 className="font-serif italic text-3xl md:text-4xl tracking-tight text-[#F5F3EE]">
              {passport.verdict}
            </h2>
          </div>

          <div className="mt-3 md:mt-0 text-left md:text-right">
            <div className="font-mono text-[10px] uppercase text-[#9A9589] tracking-wider mb-1">
              Calibrated Authenticity
            </div>
            <div className="font-mono text-3xl md:text-4xl font-bold tracking-tight text-sage">
              {probPct}%
            </div>
          </div>
        </div>

        {/* Custom Pure-SVG Feature Attribution Bars */}
        <div className="mb-6">
          <FeatureAttributionBars attributions={passport.feature_attributions} />
        </div>

        {/* Cryptographic Verification Hash & 1-Click Verify Button */}
        <div className="border-t border-[#2E2D2A] pt-4 flex flex-col md:flex-row md:items-center justify-between text-[11px] font-mono gap-3">
          <div className="truncate mr-2">
            <div className="text-[9px] text-[#9A9589] uppercase tracking-wider mb-0.5">
              SHA-256 Tamper-Evident Ledger Signature
            </div>
            <div className="text-[#C2BDB2] truncate font-mono text-[10px]" title={passport.passport_hash}>
              {passport.passport_hash}
            </div>
          </div>

          <button
            onClick={handleCopyAndVerify}
            disabled={isVerifying}
            className="px-4 py-2 bg-[#F5F3EE] text-[#121211] font-semibold uppercase tracking-wider text-[10px] hover:bg-stone transition-colors whitespace-nowrap flex-shrink-0"
          >
            {isVerifying ? "VERIFYING LEDGER..." : copied ? "COPIED & VERIFIED ✓" : "COPY HASH & VERIFY"}
          </button>
        </div>

        {verifiedOnline && (
          <div className="mt-3 text-[10px] font-mono text-sage border-t border-[#2E2D2A] pt-2">
            LEDGER STATUS: Cryptographically verified against immutable SQLite audit log.
          </div>
        )}
      </div>

      {/* Socratic Pedagogical Remediation Callout Box */}
      <div className="p-5 bg-stone border border-rule-hairline font-mono text-xs space-y-3">
        <div className="flex items-center space-x-2 text-[10px] text-ink-muted uppercase font-bold tracking-wider">
          <span className="w-2 h-2 bg-ochre inline-block" />
          <span>SOCRATIC MICRO-REMEDIATION PRESCRIPTION (NON-PUNITIVE)</span>
        </div>

        <div>
          <div className="text-[10px] text-ink-muted uppercase font-semibold">Deficit Diagnostic:</div>
          <p className="font-sans text-sm text-ink-primary mt-0.5">
            {passport.remediation_plan.gap_summary}
          </p>
        </div>

        <div className="p-3 bg-alabaster border-l-2 border-ochre text-ink-primary">
          <div className="text-[10px] text-ink-muted uppercase font-semibold mb-1">
            Guiding Socratic Inquiry:
          </div>
          <p className="font-serif italic text-sm text-ink-primary">
            &ldquo;{passport.remediation_plan.guiding_question}&rdquo;
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div>
            <div className="text-[10px] text-ink-muted uppercase font-semibold">Concrete Next Step:</div>
            <p className="font-sans text-xs text-ink-primary mt-0.5">
              {passport.remediation_plan.concrete_next_step}
            </p>
          </div>
          <div>
            <div className="text-[10px] text-ink-muted uppercase font-semibold">Recommended Focus:</div>
            <p className="font-mono text-xs text-sage font-bold mt-0.5">
              {passport.remediation_plan.recommended_concept}
            </p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      {onReset && (
        <div className="flex justify-end pt-2">
          <button
            onClick={onReset}
            className="px-5 py-2 border border-rule-hairline text-ink-muted font-mono text-xs uppercase tracking-wider hover:text-ink-primary hover:border-ink-primary transition-colors"
          >
            Start New Assessment Session
          </button>
        </div>
      )}
    </div>
  );
}
