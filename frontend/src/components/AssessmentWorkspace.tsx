"use client";

import React, { useState, useEffect } from "react";
import {
  DemoCase,
  MicroVivaTurn,
  StructuralDependencyMap,
  PrivacyReport,
  VivaTurnResponse,
  CompetencyPassportRecord,
  analyzeSubmission,
  submitTurn,
  finalizeViva,
} from "@/lib/api";
import CodeAstViewer from "./CodeAstViewer";
import MicroVivaPanel from "./MicroVivaPanel";
import CompetencyPassport from "./CompetencyPassport";

interface AssessmentWorkspaceProps {
  demos: DemoCase[];
}

interface CompletedTurnEntry {
  turn_number: number;
  question: string;
  target_line?: number;
  student_answer: string;
  result: VivaTurnResponse;
}

const DOMAIN_STARTERS: Record<string, string> = {
  python: `# Python: Sliding-Window Rate Limiter Invariant
from collections import OrderedDict
import time

class SlidingWindowBuffer:
    def __init__(self, max_capacity: int = 100):
        self.capacity = max_capacity
        self.window_map = OrderedDict()  # Line 08: FIFO key order tracking

    def record_event(self, key: str, timestamp: float) -> bool:
        if not key or timestamp <= 0:
            return False  # Line 12: Defensive guard on invalid inputs

        if key in self.window_map:
            self.window_map.move_to_end(key)
        self.window_map[key] = timestamp

        if len(self.window_map) > self.capacity:
            self.window_map.popitem(last=False)
        return True
`,
  javascript: `// JavaScript / TS: Resilient Concurrency Queue with Map Memoization
class ResilientTaskQueue {
  constructor(concurrency = 4, maxRetries = 3) {
    this.concurrency = concurrency;
    this.maxRetries = maxRetries;
    this.activeWorkers = 0;
    this.pendingQueue = [];
    this.taskCache = new Map(); // Line 08: Key-value memoization
  }

  async executeTask(taskId, taskFn) {
    if (!taskId || typeof taskFn !== 'function') {
      throw new TypeError('Invalid task parameter'); // Line 13: Type guard
    }

    if (this.taskCache.has(taskId)) {
      return this.taskCache.get(taskId);
    }

    while (this.activeWorkers >= this.concurrency) {
      await new Promise(resolve => this.pendingQueue.push(resolve));
    }

    this.activeWorkers++;
    try {
      const result = await taskFn();
      this.taskCache.set(taskId, result);
      return result;
    } finally {
      this.activeWorkers--;
      const nextWorker = this.pendingQueue.shift();
      if (nextWorker) nextWorker();
    }
  }
}
`,
  sql: `-- SQL: Analytical Window Function Partition & Indexed B-Tree Join
WITH CohortActivity AS (
  SELECT 
    user_id,
    session_id,
    action_type,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id 
      ORDER BY created_at DESC
    ) AS activity_rank -- Line 10: Analytical window ranking
  FROM telemetry_events
  WHERE created_at >= NOW() - INTERVAL '30 days' -- Line 12: Partition pruning
    AND user_id IS NOT NULL -- Line 13: Defensive NULL filter
)
SELECT 
  c.user_id,
  u.account_tier,
  COUNT(c.session_id) AS total_events,
  MAX(c.created_at) AS last_active_timestamp
FROM CohortActivity c
INNER JOIN user_accounts u 
  ON c.user_id = u.id -- Line 23: Indexed foreign key join
WHERE c.activity_rank <= 10
GROUP BY c.user_id, u.account_tier
HAVING COUNT(c.session_id) >= 3;
`,
  essay: `Title: Algorithmic Accountability and the Epistemic Limits of Surveillance Proctoring

Surveillance-based biometric proctoring systems operate under the implicit epistemic premise that gaze vector variance, keystroke latency, and facial boundary jitter reliably predict cognitive dishonesty. However, empirical evaluation demonstrates that these proxy metrics disproportionately penalize non-native English speakers and neurodivergent candidates, introducing profound systemic bias without establishing true proof-of-understanding.

Therefore, higher education institutions must transition from behavioral surveillance toward structural cognitive authenticity models. By examining conceptual invariants, counterfactual reasoning, and code mechanism transfer through zero-spyware interactive Socratic probing, educators can verify authentic understanding while strictly maintaining a zero-penalty fairness shield. Consequently, privacy preservation and pedagogical rigor cease to be mutually exclusive objectives.
`,
};

export default function AssessmentWorkspace({ demos }: AssessmentWorkspaceProps) {
  // Active selected dossier ("case_a", "case_b", "case_c", "sandbox")
  const [selectedCaseId, setSelectedCaseId] = useState<string>("case_a");
  const [sandboxDomain, setSandboxDomain] = useState<"python" | "javascript" | "sql" | "essay">("python");

  // State for active session
  const [codeContent, setCodeContent] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [privacyReport, setPrivacyReport] = useState<PrivacyReport | null>(null);
  const [astMap, setAstMap] = useState<StructuralDependencyMap | null>(null);
  const [legacyPreview, setLegacyPreview] = useState<{
    legacy_probability: number;
    verdict: string;
    is_false_positive_risk?: boolean;
  } | null>(null);

  // Turn management
  const [currentTurn, setCurrentTurn] = useState<MicroVivaTurn | null>(null);
  const [completedTurns, setCompletedTurns] = useState<CompletedTurnEntry[]>([]);
  const [passport, setPassport] = useState<CompetencyPassportRecord | null>(null);

  // Loading & automated defense states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  // Load selected demo case on change
  useEffect(() => {
    if (selectedCaseId === "sandbox") {
      const template = DOMAIN_STARTERS[sandboxDomain] || DOMAIN_STARTERS.python;
      setCodeContent(template);
      initSessionForCode(template, "Sandbox Candidate", sandboxDomain);
    } else {
      const match = demos.find((d) => d.id === selectedCaseId);
      if (match) {
        setCodeContent(match.code);
        initSessionForCode(match.code, match.student_label, match.domain);
      }
    }
  }, [selectedCaseId, demos]);

  const handleDomainSwitch = (newDomain: "python" | "javascript" | "sql" | "essay") => {
    setSandboxDomain(newDomain);
    const template = DOMAIN_STARTERS[newDomain] || DOMAIN_STARTERS.python;
    setCodeContent(template);
    initSessionForCode(template, "Sandbox Candidate", newDomain);
  };

  const resetSession = () => {
    setSessionId(null);
    setPrivacyReport(null);
    setAstMap(null);
    setLegacyPreview(null);
    setCurrentTurn(null);
    setCompletedTurns([]);
    setPassport(null);
  };

  const initSessionForCode = async (
    content: string,
    studentLabel: string = "Student",
    domain: "code" | "essay" | "python" | "javascript" | "sql" = "python"
  ) => {
    try {
      setIsLoading(true);
      resetSession();
      const res = await analyzeSubmission(content, studentLabel, domain);
      setSessionId(res.session_id);
      setPrivacyReport(res.privacy_report);
      setAstMap(res.ast_map);
      setCurrentTurn(res.turn_1);
      setLegacyPreview(res.legacy_detector_preview);
    } catch (err) {
      console.error("Failed to initialize session:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit manual turn
  const handleTurnSubmit = async (
    answer: string,
    latencyMs: number,
    pasteCount: number
  ) => {
    if (!sessionId || !currentTurn) return;

    try {
      setIsLoading(true);
      const turnNumber = currentTurn.turn_number;
      const turnResp = await submitTurn(
        sessionId,
        turnNumber,
        answer,
        latencyMs,
        pasteCount
      );

      const entry: CompletedTurnEntry = {
        turn_number: turnNumber,
        question: currentTurn.question,
        target_line: currentTurn.target_line,
        student_answer: answer,
        result: turnResp,
      };

      setCompletedTurns((prev) => [...prev, entry]);

      if (turnResp.next_turn) {
        setCurrentTurn(turnResp.next_turn);
      } else {
        // All 3 turns done -> Finalize
        setCurrentTurn(null);
        const passportRes = await finalizeViva(sessionId);
        setPassport(passportRes);
      }
    } catch (err) {
      console.error("Turn submission error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Automated Defense Playthrough
  const handleAutoPlay = async () => {
    const activeDemo = demos.find((d) => d.id === selectedCaseId);
    if (!activeDemo || isAutoPlaying) return;

    try {
      setIsAutoPlaying(true);
      setIsLoading(true);
      resetSession();

      // Step 1: Analyze submission
      const intake = await analyzeSubmission(
        activeDemo.code,
        activeDemo.student_label,
        activeDemo.domain
      );
      setSessionId(intake.session_id);
      setPrivacyReport(intake.privacy_report);
      setAstMap(intake.ast_map);
      setCurrentTurn(intake.turn_1);
      setLegacyPreview(intake.legacy_detector_preview);

      let activeT = intake.turn_1;
      const history: CompletedTurnEntry[] = [];

      // Run through all 3 turns with brief editorial delay
      for (let i = 0; i < activeDemo.turns.length; i++) {
        const demoTurn = activeDemo.turns[i];
        await new Promise((r) => setTimeout(r, 650)); // Editorial cadence

        const turnResp = await submitTurn(
          intake.session_id,
          demoTurn.turn_number,
          demoTurn.pre_authored_answer,
          demoTurn.latency_ms,
          demoTurn.paste_events_count
        );

        history.push({
          turn_number: demoTurn.turn_number,
          question: activeT.question,
          target_line: activeT.target_line,
          student_answer: demoTurn.pre_authored_answer,
          result: turnResp,
        });
        setCompletedTurns([...history]);

        if (turnResp.next_turn) {
          activeT = turnResp.next_turn;
          setCurrentTurn(turnResp.next_turn);
        } else {
          setCurrentTurn(null);
        }
      }

      // Step 3: Finalize and render Embossed Competency Passport
      await new Promise((r) => setTimeout(r, 400));
      const passportRes = await finalizeViva(intake.session_id);
      setPassport(passportRes);
    } catch (err) {
      console.error("Auto defense failed:", err);
    } finally {
      setIsAutoPlaying(false);
      setIsLoading(false);
    }
  };

  const activeDemo = demos.find((d) => d.id === selectedCaseId);
  const currentDemoTurn = activeDemo?.turns.find(
    (t) => t.turn_number === currentTurn?.turn_number
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] bg-alabaster">
      {/* Sub-Header Archival Dossier Bar */}
      <div className="h-11 px-6 bg-stone border-b border-rule-hairline flex items-center justify-between select-none">
        <div className="flex items-center space-x-1 font-mono text-xs">
          <span className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold mr-2">
            JUDGE DOSSIERS:
          </span>

          {demos.map((d) => {
            const isSelected = selectedCaseId === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedCaseId(d.id)}
                className={`px-3 py-1 text-[11px] font-semibold border-r border-rule-hairline uppercase tracking-wider transition-colors ${
                  isSelected
                    ? "bg-alabaster text-ink-primary border-t-2 border-t-ink-primary"
                    : "text-ink-muted hover:text-ink-primary"
                }`}
              >
                {d.title}
              </button>
            );
          })}

          <button
            onClick={() => setSelectedCaseId("sandbox")}
            className={`px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
              selectedCaseId === "sandbox"
                ? "bg-alabaster text-ink-primary border-t-2 border-t-ink-primary"
                : "text-ink-muted hover:text-ink-primary"
            }`}
          >
            + CUSTOM SUBMISSION SANDBOX
          </button>
        </div>

        {/* Right Action: 1-Click Auto Defense */}
        {selectedCaseId !== "sandbox" && (
          <button
            onClick={handleAutoPlay}
            disabled={isAutoPlaying || isLoading}
            className="px-4 py-1.5 bg-carbon text-alabaster font-mono text-[11px] uppercase tracking-wider font-semibold hover:bg-carbon-hover disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            <span>{isAutoPlaying ? "RUNNING AUTO-DEFENSE..." : "RUN 1-CLICK AUTO-DEFENSE"}</span>
            <span className="text-ochre">⚡</span>
          </button>
        )}
      </div>

      {/* Asymmetric 56% / 44% Split-Pane Grid */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-100px)]">
        {/* Left Pane (56%) */}
        <div className="w-full lg:w-[56%] h-full flex flex-col border-b lg:border-b-0">
          <CodeAstViewer
            code={codeContent}
            astMap={astMap}
            privacyReport={privacyReport}
            targetLine={currentTurn?.target_line || null}
            legacyPreview={legacyPreview}
            isSandbox={selectedCaseId === "sandbox"}
            selectedDomain={sandboxDomain}
            onDomainChange={handleDomainSwitch}
            onCodeChange={(newCode) => setCodeContent(newCode)}
            onAnalyzeCustom={() =>
              initSessionForCode(codeContent, "Sandbox Candidate", sandboxDomain)
            }
            isLoading={isLoading}
          />
        </div>

        {/* Right Pane (44%) */}
        <div className="w-full lg:w-[44%] h-full flex flex-col bg-alabaster">
          {passport ? (
            <CompetencyPassport
              passport={passport}
              onReset={() => {
                if (selectedCaseId === "sandbox") {
                  resetSession();
                } else {
                  const match = demos.find((d) => d.id === selectedCaseId);
                  if (match) {
                    initSessionForCode(match.code, match.student_label, match.domain);
                  }
                }
              }}
            />
          ) : (
            <MicroVivaPanel
              currentTurn={currentTurn}
              completedTurns={completedTurns}
              onSubmitTurn={handleTurnSubmit}
              isLoading={isLoading || isAutoPlaying}
              preAuthoredAnswer={currentDemoTurn?.pre_authored_answer}
              isCompleted={passport !== null}
            />
          )}
        </div>
      </div>
    </div>
  );
}
