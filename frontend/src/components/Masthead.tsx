"use client";

import React from "react";
import { HealthResponse } from "@/lib/api";

interface MastheadProps {
  activeTab: number;
  setActiveTab: (tab: number) => void;
  health: HealthResponse | null;
}

export default function Masthead({ activeTab, setActiveTab, health }: MastheadProps) {
  const tabs = [
    { id: 1, label: "01. LIVE ASSESSMENT" },
    { id: 2, label: "02. COHORT DIAGNOSTICS" },
    { id: 3, label: "03. MODEL & FAIRNESS AUDIT" },
  ];

  return (
    <header className="sticky top-0 z-50 h-14 bg-alabaster border-b border-rule-hairline flex items-center justify-between px-6 select-none">
      {/* Left Typographic Wordmark */}
      <div className="flex items-baseline space-x-3">
        <span className="font-serif font-semibold text-xl tracking-tight text-ink-primary">
          VERIMIND
        </span>
        <span className="font-mono text-[10px] font-medium tracking-widest text-ink-muted uppercase">
          // COGNITIVE LEDGER
        </span>
      </div>

      {/* Center Numbered Structural Navigation */}
      <nav className="flex h-full space-x-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`h-full px-5 font-mono text-xs tracking-wider uppercase transition-colors relative flex items-center ${
                isActive
                  ? "text-ink-primary font-semibold"
                  : "text-ink-muted hover:text-ink-primary"
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-ink-primary" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Right Hardware/API Telemetry Strip */}
      <div className="flex items-center space-x-4 font-mono text-[10px] tracking-wider text-ink-muted border-l border-rule-hairline pl-4">
        {/* Nebius / Zero-Cloud Edge Engine */}
        <div
          className="flex items-center space-x-1.5"
          title={
            health?.nebius_status === "live"
              ? `Nebius Token Factory: ${health?.nebius_model || "Qwen-32B"}`
              : "Zero-Cloud Edge Mode: Deterministic on-device AST prober active (100% privacy airgap)"
          }
        >
          <span className="w-1.5 h-1.5 inline-block bg-sage" />
          <span className="uppercase text-ink-primary font-medium">
            {health?.nebius_status === "live" ? "NEBIUS LIVE (CLOUD)" : "ZERO-CLOUD EDGE MODE"}
          </span>
        </div>

        {/* Hugging Face MiniLM */}
        <div
          className="flex items-center space-x-1.5"
          title={`Semantic Embedding: ${health?.hf_model || "sentence-transformers/all-MiniLM-L6-v2"}`}
        >
          <span className="w-1.5 h-1.5 inline-block bg-sage" />
          <span className="uppercase text-ink-primary font-medium">
            {health?.hf_status === "live" ? "HF MINILM LIVE" : "LOCAL TF-IDF EMBEDDING"}
          </span>
        </div>

        {/* ML Engine */}
        <div className="flex items-center space-x-1.5" title="CalibratedClassifierCV Logistic Regression">
          <span className="w-1.5 h-1.5 inline-block bg-sage" />
          <span className="uppercase text-ink-primary font-medium">
            ML CALIBRATED
          </span>
        </div>
      </div>
    </header>
  );
}
