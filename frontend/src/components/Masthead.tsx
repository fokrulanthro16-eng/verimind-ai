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
        {/* Nebius */}
        <div className="flex items-center space-x-1.5" title={`Nebius Model: ${health?.nebius_model || "Qwen-32B"}`}>
          <span
            className={`w-1.5 h-1.5 inline-block ${
              health?.nebius_status === "live" ? "bg-sage" : "bg-ochre"
            }`}
          />
          <span className="uppercase">
            NEBIUS {health?.nebius_status === "live" ? "LIVE" : "FALLBACK"}
          </span>
        </div>

        {/* Hugging Face MiniLM */}
        <div className="flex items-center space-x-1.5" title={`HF Model: ${health?.hf_model || "all-MiniLM-L6-v2"}`}>
          <span
            className={`w-1.5 h-1.5 inline-block ${
              health?.hf_status === "live" ? "bg-sage" : "bg-ochre"
            }`}
          />
          <span className="uppercase">
            HF MINILM {health?.hf_status === "live" ? "LIVE" : "FALLBACK"}
          </span>
        </div>

        {/* ML Engine */}
        <div className="flex items-center space-x-1.5">
          <span
            className={`w-1.5 h-1.5 inline-block ${
              health?.ml_model_ready ? "bg-sage" : "bg-ochre"
            }`}
          />
          <span className="uppercase">
            ML CALIBRATED
          </span>
        </div>
      </div>
    </header>
  );
}
