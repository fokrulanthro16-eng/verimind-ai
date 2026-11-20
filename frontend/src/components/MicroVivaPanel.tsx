"use client";

import React, { useState, useEffect, useRef } from "react";
import { MicroVivaTurn, VivaTurnResponse } from "@/lib/api";

interface CompletedTurnEntry {
  turn_number: number;
  question: string;
  target_line?: number;
  student_answer: string;
  result: VivaTurnResponse;
}

interface MicroVivaPanelProps {
  currentTurn: MicroVivaTurn | null;
  completedTurns: CompletedTurnEntry[];
  onSubmitTurn: (answer: string, latencyMs: number, pasteCount: number) => Promise<void>;
  isLoading: boolean;
  preAuthoredAnswer?: string;
  isCompleted: boolean;
}

export default function MicroVivaPanel({
  currentTurn,
  completedTurns,
  onSubmitTurn,
  isLoading,
  preAuthoredAnswer,
  isCompleted,
}: MicroVivaPanelProps) {
  const [answerText, setAnswerText] = useState("");
  const [pasteCount, setPasteCount] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [countdown, setCountdown] = useState(30);

  // Set answerText when preAuthoredAnswer changes
  useEffect(() => {
    if (preAuthoredAnswer) {
      setAnswerText(preAuthoredAnswer);
    } else {
      setAnswerText("");
    }
    setPasteCount(0);
    setStartTime(Date.now());
    setElapsedSeconds(0);
    setCountdown(30);
  }, [currentTurn, preAuthoredAnswer]);

  // Telemetry timer for active turn
  useEffect(() => {
    if (isCompleted || !currentTurn) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);
      setCountdown(Math.max(0, 30 - elapsed));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isCompleted, currentTurn]);

  const handlePaste = () => {
    setPasteCount((prev) => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerText.trim() || isLoading) return;
    const latency = Math.max(800, Date.now() - startTime);
    await onSubmitTurn(answerText, latency, pasteCount);
  };

  const steps = [
    { num: 1, label: "01. MECHANISM TRACE" },
    { num: 2, label: "02. PERTURBATION" },
    { num: 3, label: "03. LIVE PATCH" },
  ];

  const currentStepNum = currentTurn?.turn_number || (isCompleted ? 4 : 1);

  return (
    <div className="flex flex-col h-full bg-alabaster">
      {/* Top IRT Cadence Ruler & Telemetry Header */}
      <div className="border-b border-rule-hairline bg-stone px-5 py-3 font-mono select-none">
        {/* Step Indicator */}
        <div className="flex items-center justify-between text-xs tracking-wider uppercase mb-2">
          {steps.map((s) => {
            const isDone = s.num < currentStepNum;
            const isCurrent = s.num === currentStepNum && !isCompleted;
            return (
              <div
                key={s.num}
                className={`flex items-center space-x-1.5 ${
                  isCurrent
                    ? "text-ink-primary font-bold"
                    : isDone
                    ? "text-sage font-medium"
                    : "text-ink-muted opacity-60"
                }`}
              >
                <span
                  className={`w-2 h-2 inline-block ${
                    isCurrent ? "bg-ink-primary" : isDone ? "bg-sage" : "border border-rule-hairline"
                  }`}
                />
                <span>{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* 30-Second Countdown Hairline Bar */}
        {!isCompleted && (
          <div className="w-full bg-[#E0DBCF] h-[2px] relative overflow-hidden mb-2">
            <div
              className="h-full bg-ink-primary transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 30) * 100}%` }}
            />
          </div>
        )}

        {/* Real-Time Behavioral Telemetry Counters */}
        <div className="flex justify-between items-center text-[10px] text-ink-muted uppercase">
          <div className="flex space-x-4">
            <span>
              LATENCY:{" "}
              <strong className="text-ink-primary">
                {elapsedSeconds > 0 ? `${elapsedSeconds}s` : "0.0s"}
              </strong>
            </span>
            <span>
              PASTE EVENTS:{" "}
              <strong
                className={pasteCount > 0 ? "text-vermilion" : "text-ink-primary"}
              >
                {pasteCount}
              </strong>
            </span>
          </div>
          <div>
            <span>
              DIFFICULTY:{" "}
              <strong className="text-ink-primary">
                LEVEL {currentTurn?.difficulty || 1}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Editorial Viva Transcript Area */}
      <div className="flex-1 overflow-auto p-5 space-y-5">
        {/* Completed Turns History */}
        {completedTurns.map((turn, idx) => (
          <div
            key={idx}
            className="border-b border-rule-hairline pb-4 space-y-2 font-mono text-xs"
          >
            {/* Question Header */}
            <div className="flex items-center space-x-2 text-[10px] text-ink-muted uppercase font-semibold">
              <span className="px-1.5 py-0.5 bg-stone border border-rule-hairline">
                TURN 0{turn.turn_number}
              </span>
              {turn.target_line && (
                <span className="px-1.5 py-0.5 border border-rule-hairline text-ink-primary">
                  REF: LINE {turn.target_line.toString().padStart(2, "0")}
                </span>
              )}
            </div>

            {/* Socratic Question */}
            <div className="font-serif italic text-base text-ink-primary leading-snug">
              &ldquo;{turn.question}&rdquo;
            </div>

            {/* Student Answer */}
            <div className="p-3 bg-stone border-l-2 border-ink-primary text-ink-primary">
              <div className="text-[10px] uppercase tracking-wider text-ink-muted mb-1">
                Student Response:
              </div>
              <p className="whitespace-pre-wrap">{turn.student_answer}</p>
            </div>

            {/* Turn Assessment Score & MiniLM Alignment Metric */}
            <div className="flex items-center justify-between text-[11px] pt-1 text-ink-muted">
              <span>
                HF SEMANTIC ALIGNMENT:{" "}
                <strong className="text-ink-primary">
                  {(turn.result.semantic_alignment * 100).toFixed(1)}%
                </strong>{" "}
                ({turn.result.provider_used === "huggingface" ? "HF MiniLM-L6" : "Fallback"})
              </span>
              <span>
                SPECIFICITY:{" "}
                <strong className="text-ink-primary">
                  {(turn.result.specificity_score * 100).toFixed(0)}%
                </strong>
              </span>
              <span className="font-bold text-ink-primary">
                SCORE: {(turn.result.turn_score * 100).toFixed(1)}
              </span>
            </div>
          </div>
        ))}

        {/* Current Active Question */}
        {!isCompleted && currentTurn && (
          <div className="space-y-3 font-mono text-xs pt-1">
            <div className="flex items-center space-x-2 text-[10px] text-ink-muted uppercase font-semibold">
              <span className="px-1.5 py-0.5 bg-carbon text-alabaster">
                ACTIVE PROBE · TURN 0{currentTurn.turn_number}
              </span>
              {currentTurn.target_line && (
                <span className="px-1.5 py-0.5 border border-vermilion text-vermilion font-bold">
                  TARGET: LINE {currentTurn.target_line.toString().padStart(2, "0")}
                </span>
              )}
              <span className="text-ink-muted">[{currentTurn.concept_tag}]</span>
            </div>

            <div className="font-serif italic text-lg text-ink-primary leading-snug pl-1">
              &ldquo;{currentTurn.question}&rdquo;
            </div>
          </div>
        )}
      </div>

      {/* Interactive Answer Composer */}
      {!isCompleted && currentTurn && (
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-rule-hairline bg-stone"
        >
          <div className="relative">
            <textarea
              rows={3}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              onPaste={handlePaste}
              placeholder="State the algorithmic mechanism, line reference, or invariant rationale..."
              className="w-full p-3 font-mono text-xs bg-alabaster border border-rule-hairline text-ink-primary focus:outline-none focus:border-ink-primary resize-none placeholder:text-ink-muted/50"
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between">
            <div className="text-[10px] font-mono text-ink-muted flex items-center space-x-3">
              <span>Press SUBMIT to compute live MiniLM embedding alignment</span>
              {preAuthoredAnswer && answerText !== preAuthoredAnswer && (
                <button
                  type="button"
                  onClick={() => setAnswerText(preAuthoredAnswer)}
                  className="underline hover:text-ink-primary"
                >
                  Reset Demo Answer
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !answerText.trim()}
              className="px-5 py-2 bg-carbon text-alabaster font-mono text-xs font-semibold uppercase tracking-wider hover:bg-carbon-hover disabled:opacity-40 transition-colors"
            >
              {isLoading ? "EVALUATING ALIGNMENT..." : "SUBMIT RESPONSE"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
