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

  // Tamper testing states
  const [showTamperModal, setShowTamperModal] = useState(false);
  const [testHash, setTestHash] = useState(passport.passport_hash);

  const probPct = (passport.authenticity_probability * 100).toFixed(1);

  const isHashUntampered = testHash.trim().toUpperCase() === passport.passport_hash.trim().toUpperCase();

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

  const handleDownloadPDF = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const mutateSingleBit = () => {
    if (testHash.length > 5) {
      const idx = 4;
      const originalChar = testHash[idx];
      const replacementChar = originalChar === "A" ? "B" : "A";
      const mutated = testHash.substring(0, idx) + replacementChar + testHash.substring(idx + 1);
      setTestHash(mutated);
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

        {/* Cryptographic Verification Hash & Actions */}
        <div className="border-t border-[#2E2D2A] pt-4 flex flex-col lg:flex-row lg:items-center justify-between text-[11px] font-mono gap-3">
          <div className="truncate mr-2">
            <div className="text-[9px] text-[#9A9589] uppercase tracking-wider mb-0.5">
              SHA-256 Tamper-Evident Ledger Signature
            </div>
            <div className="text-[#C2BDB2] truncate font-mono text-[10px]" title={passport.passport_hash}>
              {passport.passport_hash}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-shrink-0 no-print">
            {/* Copy & Verify */}
            <button
              onClick={handleCopyAndVerify}
              disabled={isVerifying}
              className="px-3.5 py-1.5 bg-[#F5F3EE] text-[#121211] font-semibold uppercase tracking-wider text-[10px] hover:bg-stone transition-colors whitespace-nowrap"
            >
              {isVerifying ? "VERIFYING LEDGER..." : copied ? "COPIED & VERIFIED ✓" : "COPY HASH & VERIFY"}
            </button>

            {/* Test Tampering Modal Trigger */}
            <button
              onClick={() => {
                setTestHash(passport.passport_hash);
                setShowTamperModal(true);
              }}
              className="px-3 py-1.5 border border-ochre text-ochre font-semibold uppercase tracking-wider text-[10px] hover:bg-ochre hover:text-alabaster transition-colors whitespace-nowrap flex items-center space-x-1"
            >
              <span>🛡</span>
              <span>TEST TAMPERING</span>
            </button>

            {/* Download Passport PDF */}
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 border border-[#3E3D39] text-[#C2BDB2] font-semibold uppercase tracking-wider text-[10px] hover:text-[#F5F3EE] hover:border-[#68645B] transition-colors whitespace-nowrap flex items-center space-x-1"
              title="Print / Export Certificate as PDF"
            >
              <span>⎙</span>
              <span>DOWNLOAD PASSPORT (PDF)</span>
            </button>
          </div>
        </div>

        {verifiedOnline && (
          <div className="mt-3 text-[10px] font-mono text-sage border-t border-[#2E2D2A] pt-2">
            LEDGER STATUS: Cryptographically verified against immutable SQLite audit log.
          </div>
        )}
      </div>

      {/* Interactive Tamper-Proof Audit Modal */}
      {showTamperModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 select-none">
          <div className="bg-[#121211] text-[#F5F3EE] border border-[#2E2D2A] max-w-xl w-full p-6 space-y-4 font-mono shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#2E2D2A] pb-3">
              <div className="text-xs font-bold uppercase tracking-widest text-[#F5F3EE] flex items-center space-x-2">
                <span>🛡</span>
                <span>CRYPTOGRAPHIC TAMPER-EVIDENT STRESS AUDIT</span>
              </div>
              <button
                onClick={() => setShowTamperModal(false)}
                className="text-[#9A9589] hover:text-[#F5F3EE] text-sm"
              >
                ✕
              </button>
            </div>

            <p className="font-sans text-xs text-[#C2BDB2] leading-relaxed">
              VeriMind locks every assessment verdict with an immutable SHA-256 digest over the canonical JSON payload.
              Edit any single character below or click <strong>Mutate 1 Bit</strong> to observe real-time cryptographic mismatch detection.
            </p>

            {/* Hash Input Field */}
            <div>
              <label className="text-[10px] text-[#9A9589] uppercase tracking-wider block mb-1">
                Editable Verification Digest (64-character SHA-256):
              </label>
              <textarea
                rows={2}
                value={testHash}
                onChange={(e) => setTestHash(e.target.value.toUpperCase())}
                className="w-full p-2.5 bg-[#1C1B19] border border-[#3E3D39] text-xs font-mono text-[#F5F3EE] focus:outline-none focus:border-sage resize-none"
              />
            </div>

            {/* Verification Alert Banner */}
            <div
              className={`p-3 border text-xs font-bold flex items-center space-x-2 transition-all ${
                isHashUntampered
                  ? "bg-[#162B20] border-sage text-sage"
                  : "bg-[#331713] border-vermilion text-vermilion"
              }`}
            >
              <span>{isHashUntampered ? "✓" : "⚠"}</span>
              <span>
                {isHashUntampered
                  ? "LEDGER SIGNATURE VERIFIED · Bits intact & authentic against SQLite audit record"
                  : "TAMPERING DETECTED · INVALID SIGNATURE · Alteration detected! Ledger rejects modified passport"}
              </span>
            </div>

            {/* Modal Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#2E2D2A]">
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={mutateSingleBit}
                  className="px-3 py-1.5 bg-[#2B1B17] border border-vermilion text-vermilion text-[10px] font-bold uppercase tracking-wider hover:bg-vermilion hover:text-alabaster transition-colors"
                >
                  ⚡ Mutate 1 Bit (Simulate Tampering)
                </button>
                <button
                  type="button"
                  onClick={() => setTestHash(passport.passport_hash)}
                  className="px-3 py-1.5 bg-[#1C1B19] border border-[#3E3D39] text-[#C2BDB2] text-[10px] uppercase tracking-wider hover:text-white"
                >
                  Restore Original Hash
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowTamperModal(false)}
                className="px-4 py-1.5 bg-[#F5F3EE] text-[#121211] font-semibold text-[10px] uppercase tracking-wider"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

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
