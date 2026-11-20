const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface HealthResponse {
  status: string;
  nebius_status: "live" | "fallback";
  nebius_model: string;
  hf_status: "live" | "fallback";
  hf_model: string;
  ml_model_ready: boolean;
  dataset_size: number;
}

export interface PrivacyReport {
  redacted_text: string;
  student_hash: string;
  pii_entities_redacted: number;
  redacted_types: string[];
  privacy_badge: string;
}

export interface ForensicMarginAnnotation {
  line: number;
  category: "COMPLEXITY" | "DATA_STRUCTURE" | "EDGE_GUARD" | "LOGIC_CORE";
  label: string;
  detail: string;
}

export interface ASTFunction {
  name: string;
  start_line: number;
  end_line: number;
  parameters: string[];
  is_recursive?: boolean;
}

export interface ASTClass {
  name: string;
  start_line: number;
  end_line: number;
  methods: string[];
}

export interface ASTLoopNode {
  line: number;
  type: string;
  target?: string;
}

export interface ASTEdgeGuard {
  line: number;
  condition: string;
  guard_type: string;
}

export interface StructuralDependencyMap {
  domain: "code" | "essay" | "python" | "javascript" | "sql";
  functions: ASTFunction[];
  classes: ASTClass[];
  data_structures: string[];
  loop_nodes: ASTLoopNode[];
  recursion_detected: boolean;
  edge_guards: ASTEdgeGuard[];
  cyclomatic_complexity: number;
  margin_annotations: ForensicMarginAnnotation[];
  line_count: number;
  syntax_valid: boolean;
  diagnostic_notes: string[];
}

export interface MicroVivaTurn {
  turn_number: number;
  question: string;
  target_line?: number;
  concept_tag: string;
  expected_concept_rubric: string;
  difficulty: number;
  turn_type: "MECHANISM_TRACE" | "COUNTERFACTUAL_PERTURBATION" | "TRANSFER_LIVE_PATCH";
}

export interface AnalyzeSubmissionResponse {
  session_id: string;
  privacy_report: PrivacyReport;
  ast_map: StructuralDependencyMap;
  turn_1: MicroVivaTurn;
  legacy_detector_preview: {
    legacy_probability: number;
    verdict: string;
    is_false_positive_risk?: boolean;
  };
}

export interface VivaTurnResponse {
  turn_number: number;
  turn_score: number;
  semantic_alignment: number;
  specificity_score: number;
  provider_used: string;
  next_turn?: MicroVivaTurn | null;
}

export interface FeatureAttribution {
  feature: string;
  label: string;
  value: number;
  contribution: number;
  impact: "positive" | "negative" | "neutral";
}

export interface SocraticRemediation {
  gap_summary: string;
  guiding_question: string;
  concrete_next_step: string;
  recommended_concept: string;
}

export interface CompetencyPassportRecord {
  session_id: string;
  passport_hash: string;
  timestamp: string;
  student_hash: string;
  verdict: "VERIFIED MASTERY" | "SURFACE / AI-ASSISTED" | "CONCEPT GAP";
  authenticity_probability: number;
  features: Record<string, number>;
  feature_attributions: FeatureAttribution[];
  legacy_stylometric_risk: number;
  legacy_detector_verdict: string;
  remediation_plan: SocraticRemediation;
  submission_content?: string;
  ast_signature?: string;
  domain?: string;
}

export interface DemoTurn {
  turn_number: number;
  question: string;
  target_line?: number;
  concept_tag: string;
  expected_concept_rubric?: string;
  pre_authored_answer: string;
  latency_ms: number;
  paste_events_count: number;
}

export interface DemoCase {
  id: string;
  archetype: "genuine_builder" | "blind_copy_paste" | "non_native_expert";
  title: string;
  description: string;
  student_label: string;
  domain: "code" | "essay" | "python" | "javascript" | "sql";
  code: string;
  legacy_detector_verdict: string;
  legacy_ai_probability: number;
  expected_verimind_verdict: string;
  expected_verimind_prob: number;
  turns: DemoTurn[];
}

export interface CalibrationBin {
  mean_predicted_prob: number;
  fraction_of_positives: number;
  count: number;
}

export interface ConfusionMatrix {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
  archetype_breakdown: Record<string, number>;
}

export interface BenchmarkMetrics {
  f1_score: number;
  roc_auc: number;
  brier_score: number;
  non_native_parity_ratio: number;
  legacy_detector_false_positive_rate_non_native: number;
  calibration_curve: CalibrationBin[];
  confusion_matrix: ConfusionMatrix;
  avg_inference_latency_ms: number;
}

export interface StressTestScenario {
  name: string;
  target_archetype: string;
  attack_method: string;
  defense_rate: string;
  status: string;
}

export interface StressTestMetrics {
  stress_f1_score: number;
  stress_roc_auc: number;
  paraphrase_resilience_rate: number;
  preserved_non_native_parity: number;
  adversarial_samples_tested: number;
  perturbation_delta_pct: number;
  adversarial_archetype_breakdown: Record<string, number>;
  stress_scenarios: StressTestScenario[];
}

export interface CohortKPIs {
  cohort_size: number;
  verified_mastery_rate: number;
  copy_paste_flagged: number;
  non_native_protected: number;
}

export interface CohortStudentRow {
  student_id: string;
  archetype: string;
  overall_score: number;
  concepts: Record<string, number>;
  weakest_concept: string;
}

export interface InterventionPriority {
  rank: number;
  concept: string;
  failure_rate: number;
  affected_students: number;
  actionable_seminar_fix: string;
}

export interface CohortResponse {
  kpis: CohortKPIs;
  matrix: CohortStudentRow[];
  intervention_priorities: InterventionPriority[];
}

// ==========================================
// API CLIENT CALLS
// ==========================================
export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/api/health`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch system health");
  return res.json();
}

export async function fetchDemoCases(): Promise<DemoCase[]> {
  const res = await fetch(`${API_BASE}/api/demos`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch demo dossiers");
  return res.json();
}

export async function analyzeSubmission(
  content: string,
  studentLabel: string = "Student",
  domain: "code" | "essay" | "python" | "javascript" | "sql" = "python"
): Promise<AnalyzeSubmissionResponse> {
  const res = await fetch(`${API_BASE}/api/analyze-submission`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, student_label: studentLabel, domain }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Analysis failed" }));
    throw new Error(err.detail || "Analysis failed");
  }
  return res.json();
}

export async function submitTurn(
  sessionId: string,
  turnNumber: number,
  answer: string,
  latencyMs: number = 4200,
  pasteEventsCount: number = 0
): Promise<VivaTurnResponse> {
  const res = await fetch(`${API_BASE}/api/viva/turn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      turn_number: turnNumber,
      answer,
      latency_ms: latencyMs,
      paste_events_count: pasteEventsCount,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Turn submission failed" }));
    throw new Error(err.detail || "Turn submission failed");
  }
  return res.json();
}

export async function finalizeViva(sessionId: string): Promise<CompetencyPassportRecord> {
  const res = await fetch(`${API_BASE}/api/viva/finalize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Finalization failed" }));
    throw new Error(err.detail || "Finalization failed");
  }
  return res.json();
}

export async function fetchPassportByHash(passportHash: string): Promise<CompetencyPassportRecord> {
  const res = await fetch(`${API_BASE}/api/passport/${passportHash}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Passport not found" }));
    throw new Error(err.detail || "Passport not found");
  }
  return res.json();
}

export async function fetchCohortData(): Promise<CohortResponse> {
  const res = await fetch(`${API_BASE}/api/teacher/cohort`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch cohort matrix");
  return res.json();
}

export async function fetchBenchmark(): Promise<BenchmarkMetrics> {
  const res = await fetch(`${API_BASE}/api/eval/benchmark`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch model evaluation");
  return res.json();
}

export async function runStressTest(): Promise<StressTestMetrics> {
  const res = await fetch(`${API_BASE}/api/eval/stress-test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to run stress test");
  return res.json();
}

export function downloadCohortCSV(cohort: CohortResponse) {
  const concepts = [
    "Hash Maps & O(1)",
    "Recursion & Base Cases",
    "Edge-Case Guards",
    "Time Complexity",
    "Memory & Mutation",
    "Async & Concurrency",
  ];
  const headers = ["Student ID", "Archetype", "Overall Score", ...concepts, "Weakest Concept"];
  const rows = cohort.matrix.map((row) => [
    row.student_id,
    row.archetype,
    `${(row.overall_score * 100).toFixed(1)}%`,
    ...concepts.map((c) => `${((row.concepts[c] || 0) * 100).toFixed(0)}%`),
    row.weakest_concept,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `verimind_lms_gradebook_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadCohortJSON(cohort: CohortResponse) {
  const dataStr = JSON.stringify(cohort, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `verimind_cohort_export_${Date.now()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

