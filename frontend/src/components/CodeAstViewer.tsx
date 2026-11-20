"use client";

import React, { useState } from "react";
import {
  StructuralDependencyMap,
  PrivacyReport,
  ForensicMarginAnnotation,
} from "@/lib/api";

interface CodeAstViewerProps {
  code: string;
  astMap: StructuralDependencyMap | null;
  privacyReport: PrivacyReport | null;
  targetLine: number | null;
  legacyPreview: {
    legacy_probability: number;
    verdict: string;
    is_false_positive_risk?: boolean;
  } | null;
  isSandbox: boolean;
  onCodeChange?: (newCode: string) => void;
  onAnalyzeCustom?: () => void;
  isLoading?: boolean;
}

export default function CodeAstViewer({
  code,
  astMap,
  privacyReport,
  targetLine,
  legacyPreview,
  isSandbox,
  onCodeChange,
  onAnalyzeCustom,
  isLoading,
}: CodeAstViewerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const lines = code.split("\n");

  // Map annotations by line number
  const annotationsByLine = React.useMemo(() => {
    const map: Record<number, ForensicMarginAnnotation[]> = {};
    if (astMap?.margin_annotations) {
      astMap.margin_annotations.forEach((ann) => {
        if (!map[ann.line]) map[ann.line] = [];
        map[ann.line].push(ann);
      });
    }
    return map;
  }, [astMap]);

  return (
    <div className="flex flex-col h-full bg-alabaster border-r border-rule-hairline">
      {/* Top Header Bar */}
      <div className="h-11 px-4 border-b border-rule-hairline bg-stone flex items-center justify-between font-mono text-[11px] select-none">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-ink-primary">
            ARTIFACT FORENSIC X-RAY
          </span>
          <span className="text-rule-hairline">|</span>
          <span className="px-1.5 py-0.5 border border-sage text-sage text-[9px] font-medium tracking-wider uppercase bg-sage-subtle">
            {privacyReport?.privacy_badge || "PII REDACTED · ZERO SPYWARE"}
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-ink-muted">
            MCCABE COMPLEXITY:{" "}
            <strong className="text-ink-primary">
              M={astMap?.cyclomatic_complexity || 1}
            </strong>
          </span>

          {isSandbox && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-2.5 py-1 text-[10px] bg-carbon text-alabaster uppercase tracking-wider font-semibold hover:bg-carbon-hover"
            >
              {isEditing ? "VIEW CODE" : "EDIT CODE"}
            </button>
          )}
        </div>
      </div>

      {/* Main Code & Margin Annotations Canvas */}
      <div className="flex-1 overflow-auto relative">
        {isEditing && isSandbox ? (
          <div className="p-4 flex flex-col h-full">
            <textarea
              value={code}
              onChange={(e) => onCodeChange && onCodeChange(e.target.value)}
              className="w-full flex-1 p-3 font-mono text-xs bg-[#FAF8F5] border border-rule-hairline text-ink-primary focus:outline-none resize-none"
              placeholder="# Paste or write Python code or an essay..."
            />
            <div className="mt-3 flex justify-end">
              <button
                disabled={isLoading}
                onClick={() => {
                  setIsEditing(false);
                  onAnalyzeCustom && onAnalyzeCustom();
                }}
                className="px-4 py-1.5 bg-carbon text-alabaster font-mono text-xs uppercase tracking-wider font-semibold hover:bg-carbon-hover disabled:opacity-50"
              >
                {isLoading ? "ANALYZING..." : "RE-ANALYZE SUBMISSION"}
              </button>
            </div>
          </div>
        ) : (
          <div className="min-w-full font-mono text-xs divide-y divide-transparent">
            {lines.map((lineText, idx) => {
              const lineNum = idx + 1;
              const isTarget = targetLine === lineNum;
              const lineAnns = annotationsByLine[lineNum] || [];

              return (
                <div
                  key={lineNum}
                  className={`flex items-start transition-colors duration-150 ${
                    isTarget ? "active-ast-target-line" : "hover:bg-[#EFECE5]"
                  }`}
                >
                  {/* Line Number */}
                  <div className="w-10 flex-shrink-0 text-right pr-3 select-none text-[11px] text-ink-muted py-0.5">
                    {lineNum.toString().padStart(2, "0")}
                  </div>

                  {/* Code Line Text */}
                  <div className="flex-1 px-2 py-0.5 whitespace-pre font-mono text-[12px] text-ink-primary overflow-x-auto">
                    {lineText || " "}
                  </div>

                  {/* Margin Annotation Tag Column (Swiss Editorial Marginalia) */}
                  <div className="w-48 flex-shrink-0 border-l border-rule-hairline pl-2 pr-3 py-0.5 select-none space-y-1">
                    {lineAnns.map((ann, aIdx) => {
                      const colorMap = {
                        COMPLEXITY: "text-ochre border-ochre-border bg-ochre-subtle",
                        DATA_STRUCTURE: "text-sage border-sage-border bg-sage-subtle",
                        EDGE_GUARD: "text-vermilion border-vermilion-border bg-vermilion-subtle",
                        LOGIC_CORE: "text-ink-primary border-rule-hairline bg-stone",
                      };
                      return (
                        <div
                          key={aIdx}
                          title={ann.detail}
                          className={`text-[9px] font-mono leading-tight px-1 py-0.5 border ${
                            colorMap[ann.category] || "text-ink-muted border-rule-hairline"
                          }`}
                        >
                          <div className="font-semibold uppercase tracking-wider truncate">
                            {ann.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Forensic Comparison Strip */}
      <div className="border-t border-rule-hairline bg-stone p-4 font-mono select-none">
        <div className="text-[10px] uppercase tracking-widest text-ink-muted mb-2 font-semibold">
          FORENSIC PARITY AUDIT · DIRECT COMPARISON
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Legacy Stylometric Detector Column */}
          <div className="p-3 bg-alabaster border border-rule-hairline flex flex-col justify-between">
            <div>
              <div className="text-[10px] text-ink-muted uppercase">
                Legacy Stylometric Detector (GPTZero / Turnitin)
              </div>
              <div
                className={`mt-1 font-bold text-xs ${
                  legacyPreview?.is_false_positive_risk
                    ? "text-vermilion"
                    : "text-ink-primary"
                }`}
              >
                {legacyPreview?.verdict || "NAIVE PERPLEXITY ANALYSIS"}
              </div>
            </div>
            {legacyPreview?.is_false_positive_risk && (
              <div className="mt-2 text-[10px] text-vermilion font-medium">
                ALERT: False positive on non-native syntax patterns
              </div>
            )}
          </div>

          {/* VeriMind Cognitive Proof Column */}
          <div className="p-3 bg-alabaster border border-rule-hairline flex flex-col justify-between">
            <div>
              <div className="text-[10px] text-ink-muted uppercase">
                VeriMind Cognitive Authenticity Proof
              </div>
              <div className="mt-1 font-bold text-xs text-sage flex items-center space-x-1.5">
                <span className="w-2 h-2 bg-sage inline-block" />
                <span>LOGIC-FIRST VERIFICATION</span>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-sage font-semibold uppercase tracking-wider">
              0.0% GRAMMAR BIAS PENALTY (FAIRNESS SHIELD ACTIVE)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
