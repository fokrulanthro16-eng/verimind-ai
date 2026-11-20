"use client";

import React, { useState } from "react";
import { CompetencyPassportRecord, fetchPassportByHash } from "@/lib/api";

const SAMPLE_HASHES = [
  {
    label: "Case A · Elena Rostova (Verified Mastery)",
    hash: "VERI-A7F48102B90CD334E91523B068AA29841B5C08F31E49D37CA5109BC82057F601",
    tag: "Genuine Builder",
  },
  {
    label: "Case B · Alex Turner (Concept Gap)",
    hash: "VERI-B21C94E07F81895B309A4D3E5C77A19B86043C0D6208A7492EFB153094862B02",
    tag: "Blind Copy-Paste",
  },
  {
    label: "Case C · Jian Wei (Bias-Shielded Expert)",
    hash: "VERI-C984DF10A6209B74C8350174E18293BC5401928374EBC059A182049281745C03",
    tag: "Non-Native Syntax",
  },
];

export default function CredentialVerifierPortal() {
  const [hashInput, setHashInput] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [record, setRecord] = useState<CompetencyPassportRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVerify = async (queryHash?: string) => {
    const targetHash = (queryHash || hashInput).trim();
    if (!targetHash) {
      setErrorMessage("Please enter a valid 64-character SHA-256 passport signature.");
      setRecord(null);
      return;
    }

    try {
      setIsSearching(true);
      setErrorMessage(null);
      const res = await fetchPassportByHash(targetHash);
      setRecord(res);
      setHashInput(targetHash);
    } catch (err: any) {
      setRecord(null);
      setErrorMessage(
        "TAMPERING DETECTED / RECORD NOT FOUND: The cryptographic signature does not match any entry in the live SQLite ledger or has been altered."
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickFill = (h: string) => {
    setHashInput(h);
    handleVerify(h);
  };

  const simulateTampering = () => {
    if (!hashInput) {
      handleQuickFill(SAMPLE_HASHES[0].hash);
      return;
    }
    // Flip a character to simulate tampering
    const tampered =
      hashInput.substring(0, 10) +
      (hashInput[10] === "X" ? "9" : "X") +
      hashInput.substring(11);
    setHashInput(tampered);
    handleVerify(tampered);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] bg-alabaster p-6 lg:p-10 select-none">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        {/* Header Monolith */}
        <div className="border-b border-rule-hairline pb-6">
          <div className="flex items-center space-x-2 font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-1">
            <span className="w-2 h-2 bg-sage inline-block" />
            <span>PUBLIC REGISTRAR & ENTERPRISE RECRUITER VERIFICATION PORTAL</span>
          </div>
          <h1 className="font-serif italic text-3xl lg:text-4xl text-ink-primary font-normal tracking-tight">
            Cryptographic Credential Ledger Verification
          </h1>
          <p className="font-sans text-sm text-ink-muted max-w-3xl mt-2 leading-relaxed">
            Verify candidate proof-of-understanding receipts directly against the tamper-evident SQLite cognitive ledger.
            Every evaluation is cryptographically anchored by a SHA-256 digest over the canonical Socratic evaluation vector.
          </p>
        </div>

        {/* Verification Search Bar & Sample Hash Strip */}
        <div className="p-6 bg-stone border border-rule-hairline space-y-4 font-mono">
          <div className="text-[11px] uppercase tracking-wider text-ink-primary font-bold flex items-center justify-between">
            <span>QUERY LEDGER BY SHA-256 SIGNATURE</span>
            <span className="text-[10px] text-ink-muted font-normal">INSTANT &lt;1MS LOOKUP</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value.toUpperCase())}
              placeholder="PASTE SHA-256 SIGNATURE (E.G. VERI-A7F48102B90CD334E91523B068AA29841B5C08F31E49D37CA5109BC82057F601)..."
              className="flex-1 px-4 py-2.5 bg-alabaster border border-rule-hairline font-mono text-xs text-ink-primary placeholder:text-ink-muted/50 focus:outline-none focus:border-ink-primary"
            />
            <button
              onClick={() => handleVerify()}
              disabled={isSearching}
              className="px-6 py-2.5 bg-carbon text-alabaster font-mono text-xs uppercase tracking-wider font-semibold hover:bg-carbon-hover disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {isSearching ? "VERIFYING..." : "VERIFY CREDENTIAL"}
            </button>
          </div>

          {/* Quick-Fill Sample Pills */}
          <div className="pt-2 border-t border-rule-hairline flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-ink-muted uppercase mr-1">QUICK VERIFICATION SAMPLES:</span>
            {SAMPLE_HASHES.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickFill(s.hash)}
                className="px-2.5 py-1 text-[10px] bg-alabaster border border-rule-hairline text-ink-primary hover:border-ink-primary transition-colors flex items-center space-x-1.5"
              >
                <span className="font-semibold">{s.label}</span>
                <span className="text-[9px] text-ink-muted">({s.tag})</span>
              </button>
            ))}
            <button
              onClick={simulateTampering}
              className="px-2.5 py-1 text-[10px] bg-vermilion-subtle border border-vermilion-border text-vermilion hover:bg-vermilion hover:text-alabaster transition-colors font-semibold"
              title="Tamper with hash signature to observe rejection"
            >
              ⚡ TEST TAMPERED HASH (SIMULATE FRAUD)
            </button>
          </div>
        </div>

        {/* Error / Tampering Detected Alert Banner */}
        {errorMessage && (
          <div className="p-5 bg-vermilion-subtle border border-vermilion-border text-vermilion font-mono text-xs space-y-2">
            <div className="flex items-center space-x-2 font-bold text-sm">
              <span>⚠</span>
              <span>CRYPTOGRAPHIC LEDGER AUDIT FAILED</span>
            </div>
            <p className="font-sans text-xs text-ink-primary">{errorMessage}</p>
            <div className="text-[10px] text-ink-muted pt-1 border-t border-vermilion-border/30">
              LEDGER VERDICT: REJECTED // NO MATCHING IMMUTABLE SESSION RECORD
            </div>
          </div>
        )}

        {/* Verified Passport Certificate Monolith */}
        {record && (
          <div className="bg-[#121211] text-[#F5F3EE] p-8 border border-[#2E2D2A] space-y-6 font-mono relative shadow-xl">
            {/* Stamp Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#2E2D2A] pb-4 gap-2">
              <div className="space-y-1">
                <div className="text-[10px] tracking-widest text-[#9A9589] uppercase">
                  IMMUTABLE COMPETENCY PASSPORT RECEIPT // PUBLIC VERIFIER
                </div>
                <div className="text-xs text-[#C2BDB2]">
                  SESSION: <strong className="text-[#F5F3EE]">{record.session_id}</strong> · DOMAIN: <strong className="text-sage uppercase">{record.domain || "PYTHON"}</strong>
                </div>
              </div>
              <div className="px-3 py-1 bg-[#162B20] border border-sage text-sage text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1.5">
                <span>✓</span>
                <span>LEDGER SIGNATURE VERIFIED</span>
              </div>
            </div>

            {/* Verdict Hero Banner */}
            <div className="flex flex-col md:flex-row md:items-baseline md:justify-between border-b border-[#2E2D2A] pb-6 gap-4">
              <div>
                <div className="text-[10px] uppercase text-[#9A9589] tracking-wider mb-1">
                  Cognitive Authenticity Verdict
                </div>
                <h2
                  className={`font-serif italic text-3xl md:text-5xl tracking-tight ${
                    record.verdict === "VERIFIED MASTERY" ? "text-sage" : "text-vermilion"
                  }`}
                >
                  {record.verdict}
                </h2>
                <div className="text-xs text-[#C2BDB2] mt-1 font-sans">
                  Candidate Anonymous Hash: <code className="font-mono text-[#F5F3EE]">{record.student_hash}</code>
                </div>
              </div>

              <div className="text-left md:text-right">
                <div className="text-[10px] uppercase text-[#9A9589] tracking-wider mb-1">
                  Calibrated Authenticity
                </div>
                <div
                  className={`text-4xl md:text-5xl font-bold tracking-tight ${
                    record.authenticity_probability >= 0.75 ? "text-sage" : "text-vermilion"
                  }`}
                >
                  {(record.authenticity_probability * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-[#9A9589] mt-1">
                  Legacy AI Detector Risk: {record.legacy_stylometric_risk}%
                </div>
              </div>
            </div>

            {/* Cognitive Feature Attribution Breakdown */}
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#9A9589] mb-3 font-semibold">
                8-VECTOR COGNITIVE REASONING BREAKDOWN
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {record.feature_attributions.map((attr, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#1C1B19] border border-[#2E2D2A] space-y-1"
                  >
                    <div className="text-[9px] text-[#9A9589] uppercase truncate" title={attr.label}>
                      {attr.label}
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-base font-bold text-[#F5F3EE]">
                        {(attr.value * 100).toFixed(0)}%
                      </span>
                      <span
                        className={`text-[9px] font-semibold uppercase ${
                          attr.impact === "positive"
                            ? "text-sage"
                            : attr.impact === "negative"
                            ? "text-vermilion"
                            : "text-[#9A9589]"
                        }`}
                      >
                        {attr.impact === "neutral" ? "0.0% BIAS" : attr.impact}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Remediation / Competency Summary */}
            <div className="p-4 bg-[#1C1B19] border border-[#2E2D2A] space-y-2">
              <div className="text-[10px] text-ochre uppercase font-bold tracking-wider">
                COMPETENCY EVALUATION SUMMARY & SOCRATIC AUDIT
              </div>
              <p className="font-sans text-xs text-[#C2BDB2] leading-relaxed">
                {record.remediation_plan.gap_summary}
              </p>
              <div className="text-[10px] text-[#9A9589] pt-2 border-t border-[#2E2D2A]">
                Recommended Focus Area: <strong className="text-sage">{record.remediation_plan.recommended_concept}</strong>
              </div>
            </div>

            {/* Cryptographic SHA-256 Ledger Signature Stamp */}
            <div className="p-4 bg-[#0D0D0C] border border-[#2E2D2A] space-y-2">
              <div className="text-[9px] text-[#9A9589] uppercase tracking-wider">
                Immutable SHA-256 Signature (Canonical JSON Hash):
              </div>
              <div className="font-mono text-xs text-sage break-all">
                {record.passport_hash}
              </div>
              <div className="flex flex-wrap items-center justify-between text-[10px] text-[#9A9589] pt-2 border-t border-[#2E2D2A]">
                <span>MINTED AT: {new Date(record.timestamp).toUTCString()}</span>
                <span>ZERO-SPYWARE AIRGAP AUDIT: 100% FERPA COMPLIANT</span>
              </div>
            </div>

            {/* Public Action Controls */}
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-[#F5F3EE] text-[#121211] font-semibold text-xs uppercase tracking-wider hover:bg-stone transition-colors"
              >
                Print / Export Official Certificate (PDF)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
