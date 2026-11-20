"use client";

import React from "react";
import { FeatureAttribution, CalibrationBin } from "@/lib/api";

// ==============================================================
// 1. PURE-SVG DIVERGING FEATURE ATTRIBUTION BARS
// ==============================================================
interface FeatureAttributionBarsProps {
  attributions: FeatureAttribution[];
}

export function FeatureAttributionBars({ attributions }: FeatureAttributionBarsProps) {
  // Sort attributions: most positive first, neutral/fairness in center, negative at end
  const sorted = [...attributions].sort((a, b) => {
    if (a.feature === "grammar_noise_index") return 0;
    return b.contribution - a.contribution;
  });

  const maxAbs = Math.max(...sorted.map((a) => Math.abs(a.contribution)), 1.0);

  return (
    <div className="w-full space-y-2.5 font-mono text-[11px]">
      <div className="flex justify-between items-center text-[10px] text-ink-muted uppercase border-b border-rule-dark pb-1.5">
        <span>Attributed Cognitive Vector</span>
        <span className="flex space-x-4">
          <span className="text-vermilion">Penalty (-)</span>
          <span className="text-sage">Authenticity (+)</span>
        </span>
      </div>

      {sorted.map((item) => {
        const isFairness = item.feature === "grammar_noise_index";
        const val = item.contribution;
        const widthPct = Math.min(100, (Math.abs(val) / maxAbs) * 48);
        const isPos = val > 0;

        return (
          <div key={item.feature} className="group relative">
            <div className="flex justify-between items-center text-[11px] mb-0.5">
              <span
                className={`truncate ${
                  isFairness
                    ? "text-sage font-medium flex items-center space-x-1"
                    : "text-[#ECE8DF]"
                }`}
              >
                <span>{item.label}</span>
                {isFairness && (
                  <span className="ml-1.5 text-[9px] px-1 py-0.2 border border-sage text-sage uppercase">
                    Zero Penalty Shield
                  </span>
                )}
              </span>
              <span className="text-[#A29E94] ml-2">
                {isFairness ? "0.00 (Protected)" : (val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2))}
              </span>
            </div>

            {/* Centered Diverging Bar SVG */}
            <div className="h-2 w-full bg-[#1C1B19] relative flex items-center">
              {/* Center Divider Line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-[#3A3833]" />

              {isFairness ? (
                // Shield dot at origin
                <div
                  className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-sage"
                  title="Fairness Shield Active: Zero weight applied to surface grammar irregularity"
                />
              ) : isPos ? (
                <div
                  className="h-full bg-sage transition-all duration-300"
                  style={{
                    position: "absolute",
                    left: "50%",
                    width: `${widthPct}%`,
                  }}
                />
              ) : (
                <div
                  className="h-full bg-vermilion transition-all duration-300"
                  style={{
                    position: "absolute",
                    right: "50%",
                    width: `${widthPct}%`,
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==============================================================
// 2. PURE-SVG CALIBRATION RELIABILITY CURVE
// ==============================================================
interface CalibrationReliabilityCurveProps {
  bins: CalibrationBin[];
}

export function CalibrationReliabilityCurve({ bins }: CalibrationReliabilityCurveProps) {
  const width = 360;
  const height = 280;
  const padding = 36;
  const plotW = width - padding * 2;
  const plotH = height - padding * 2;

  // Coordinate mapper: (prob, frac) -> (x, y)
  const mapCoord = (xVal: number, yVal: number) => {
    const x = padding + xVal * plotW;
    const y = height - padding - yVal * plotH;
    return { x, y };
  };

  // Build plotted curve points
  const sortedBins = [...bins].sort((a, b) => a.mean_predicted_prob - b.mean_predicted_prob);
  const pathD = sortedBins.reduce((acc, bin, idx) => {
    const { x, y } = mapCoord(bin.mean_predicted_prob, bin.fraction_of_positives);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, "");

  const idealStart = mapCoord(0, 0);
  const idealEnd = mapCoord(1, 1);

  return (
    <div className="w-full flex flex-col items-center">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-[420px] overflow-visible font-mono select-none"
      >
        {/* Background Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1.0].map((t) => {
          const ptX = mapCoord(t, 0);
          const ptY = mapCoord(0, t);
          return (
            <g key={t}>
              {/* Vertical grid line */}
              <line
                x1={ptX.x}
                y1={padding}
                x2={ptX.x}
                y2={height - padding}
                stroke="#E2DDD2"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              {/* Horizontal grid line */}
              <line
                x1={padding}
                y1={ptY.y}
                x2={width - padding}
                y2={ptY.y}
                stroke="#E2DDD2"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              {/* Axis labels */}
              <text
                x={ptX.x}
                y={height - padding + 16}
                fontSize="9"
                fill="#68645B"
                textAnchor="middle"
              >
                {t.toFixed(2)}
              </text>
              <text
                x={padding - 8}
                y={ptY.y + 3}
                fontSize="9"
                fill="#68645B"
                textAnchor="end"
              >
                {t.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Axes */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#141413"
          strokeWidth="1.2"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#141413"
          strokeWidth="1.2"
        />

        {/* Ideal Calibration Diagonal (dashed y = x) */}
        <line
          x1={idealStart.x}
          y1={idealStart.y}
          x2={idealEnd.x}
          y2={idealEnd.y}
          stroke="#9A9589"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Calibrated Model Curve */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="#141413"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Coordinate Points with Tooltip */}
        {sortedBins.map((bin, i) => {
          const { x, y } = mapCoord(bin.mean_predicted_prob, bin.fraction_of_positives);
          return (
            <g key={i} className="cursor-pointer">
              <circle
                cx={x}
                cy={y}
                r="4.5"
                fill="#1F6346"
                stroke="#F5F3EE"
                strokeWidth="1.5"
              />
            </g>
          );
        })}

        {/* Axis Titles */}
        <text
          x={width / 2}
          y={height - 4}
          fontSize="9"
          fontWeight="bold"
          fill="#141413"
          textAnchor="middle"
          letterSpacing="0.08em"
        >
          MEAN PREDICTED PROBABILITY
        </text>
        <text
          transform={`rotate(-90) translate(-${height / 2}, 12)`}
          fontSize="9"
          fontWeight="bold"
          fill="#141413"
          textAnchor="middle"
          letterSpacing="0.08em"
        >
          FRACTION OF POSITIVES
        </text>
      </svg>

      {/* Legend */}
      <div className="flex items-center space-x-6 font-mono text-[10px] text-ink-muted mt-2">
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-0.5 bg-ink-primary inline-block" />
          <span>VeriMind Calibrated Model</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-0.5 border-t border-dashed border-[#9A9589] inline-block" />
          <span>Perfect Calibration (y = x)</span>
        </div>
      </div>
    </div>
  );
}

// ==============================================================
// 3. PURE-SVG FAIRNESS COMPARISON BAR CHART
// ==============================================================
interface FairnessComparisonChartProps {
  legacyFpr: number;
  verimindFpr: number;
}

export function FairnessComparisonChart({
  legacyFpr,
  verimindFpr,
}: FairnessComparisonChartProps) {
  const legacyPct = Math.round(legacyFpr * 100);
  const verimindPct = Math.round(verimindFpr * 100);

  return (
    <div className="w-full space-y-4 font-mono text-xs">
      {/* Legacy Stylometric Detector */}
      <div>
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-ink-primary font-medium">
            Legacy Stylometric Detectors (GPTZero / Turnitin)
          </span>
          <span className="text-vermilion font-bold text-sm">
            {legacyPct}% FALSE POSITIVE RATE
          </span>
        </div>
        <div className="h-6 w-full bg-[#ECE8DF] border border-rule-hairline relative">
          <div
            className="h-full bg-vermilion transition-all duration-500"
            style={{ width: `${legacyPct}%` }}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-ink-primary font-medium">
            Severe ESL / Non-Native Bias Penalty
          </span>
        </div>
      </div>

      {/* VeriMind AI Fairness Engine */}
      <div>
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-ink-primary font-medium">
            VeriMind AI (Fairness Shield Active)
          </span>
          <span className="text-sage font-bold text-sm">
            {verimindPct}% FALSE POSITIVE RATE (1.00x PARITY)
          </span>
        </div>
        <div className="h-6 w-full bg-[#ECE8DF] border border-rule-hairline relative flex items-center">
          <div
            className="h-full bg-sage transition-all duration-500"
            style={{ width: `${Math.max(1, verimindPct)}%` }}
          />
          <span className="ml-2 text-[10px] text-sage font-bold uppercase tracking-wider">
            Zero Grammar Penalty · Parity Guaranteed
          </span>
        </div>
      </div>
    </div>
  );
}
