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

export default function AssessmentWorkspace({ demos }: AssessmentWorkspaceProps) {
  // Active selected dossier ("case_a", "case_b", "case_c", "sandbox")
  const [selectedCaseId, setSelectedCaseId] = useState<string>("case_a");

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
      setCodeContent(
        '# Custom Code / Essay Sandbox\ndef process_items(items):\n    # Add your code here\n    store = {}\n    return True\n'
      );
      resetSession();
    } else {
      const match = demos.find((d) => d.id === selectedCaseId);
      if (match) {
        setCodeContent(match.code);
        initSessionForCode(match.code, match.student_label, match.domain);
      }
    }
  }, [selectedCaseId, demos]);

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
    domain: "code" | "essay" = "code"
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
            onCodeChange={(newCode) => setCodeContent(newCode)}
            onAnalyzeCustom={() =>
              initSessionForCode(codeContent, "Custom Student", "code")
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
