from typing import List, Dict, Optional, Literal, Any
from pydantic import BaseModel, Field


# ==========================================
# 1. PRIVACY SCHEMAS
# ==========================================
class PrivacyReport(BaseModel):
    redacted_text: str
    student_hash: str
    pii_entities_redacted: int
    redacted_types: List[str]
    privacy_badge: str = "PII REDACTED · ZERO SPYWARE"


# ==========================================
# 2. AST / STRUCTURAL DEPENDENCY SCHEMAS
# ==========================================
class ForensicMarginAnnotation(BaseModel):
    line: int
    category: Literal["COMPLEXITY", "DATA_STRUCTURE", "EDGE_GUARD", "LOGIC_CORE"]
    label: str
    detail: str


class ASTFunction(BaseModel):
    name: str
    start_line: int
    end_line: int
    parameters: List[str]
    is_recursive: bool = False


class ASTClass(BaseModel):
    name: str
    start_line: int
    end_line: int
    methods: List[str]


class ASTLoopNode(BaseModel):
    line: int
    type: str  # "For" | "While"
    target: Optional[str] = None


class ASTEdgeGuard(BaseModel):
    line: int
    condition: str
    guard_type: str  # "NoneCheck" | "EmptyLen" | "TryExcept" | "BoundCheck"


class StructuralDependencyMap(BaseModel):
    domain: Literal["code", "essay"] = "code"
    functions: List[ASTFunction] = Field(default_factory=list)
    classes: List[ASTClass] = Field(default_factory=list)
    data_structures: List[str] = Field(default_factory=list)
    loop_nodes: List[ASTLoopNode] = Field(default_factory=list)
    recursion_detected: bool = False
    edge_guards: List[ASTEdgeGuard] = Field(default_factory=list)
    cyclomatic_complexity: int = 1
    margin_annotations: List[ForensicMarginAnnotation] = Field(default_factory=list)
    line_count: int = 1
    syntax_valid: bool = True
    diagnostic_notes: List[str] = Field(default_factory=list)


# ==========================================
# 3. MICRO-VIVA & ADAPTIVE TURN SCHEMAS
# ==========================================
class MicroVivaTurn(BaseModel):
    turn_number: int  # 1, 2, or 3
    question: str
    target_line: Optional[int] = None
    concept_tag: str
    expected_concept_rubric: str
    difficulty: int = 1  # 1: Mechanism, 2: Counterfactual, 3: Live Patch
    turn_type: Literal[
        "MECHANISM_TRACE", "COUNTERFACTUAL_PERTURBATION", "TRANSFER_LIVE_PATCH"
    ]


class SubmissionRequest(BaseModel):
    content: str
    student_label: Optional[str] = "Student"
    domain: Literal["code", "essay"] = "code"


class AnalyzeSubmissionResponse(BaseModel):
    session_id: str
    privacy_report: PrivacyReport
    ast_map: StructuralDependencyMap
    turn_1: MicroVivaTurn
    legacy_detector_preview: Dict[str, Any]


class VivaTurnRequest(BaseModel):
    session_id: str
    turn_number: int
    answer: str
    latency_ms: int = 4200
    paste_events_count: int = 0


class VivaTurnResponse(BaseModel):
    turn_number: int
    turn_score: float
    semantic_alignment: float
    specificity_score: float
    provider_used: str  # "huggingface" | "fallback"
    next_turn: Optional[MicroVivaTurn] = None


class FinalizeRequest(BaseModel):
    session_id: str


# ==========================================
# 4. ML EXPLAINABILITY & PASSPORT SCHEMAS
# ==========================================
class FeatureAttribution(BaseModel):
    feature: str
    label: str
    value: float
    contribution: float
    impact: Literal["positive", "negative", "neutral"]


class SocraticRemediation(BaseModel):
    gap_summary: str
    guiding_question: str
    concrete_next_step: str
    recommended_concept: str


class CompetencyPassportRecord(BaseModel):
    session_id: str
    passport_hash: str
    timestamp: str
    student_hash: str
    verdict: Literal["VERIFIED MASTERY", "SURFACE / AI-ASSISTED", "CONCEPT GAP"]
    authenticity_probability: float
    features: Dict[str, float]
    feature_attributions: List[FeatureAttribution]
    legacy_stylometric_risk: float  # e.g. 89.0 (%)
    legacy_detector_verdict: str
    remediation_plan: SocraticRemediation
    submission_content: Optional[str] = None
    ast_signature: Optional[str] = None


# ==========================================
# 5. DEMO DOSSIER SCHEMAS
# ==========================================
class DemoTurn(BaseModel):
    turn_number: int
    question: str
    target_line: Optional[int] = None
    concept_tag: str
    expected_concept_rubric: str = ""
    pre_authored_answer: str
    latency_ms: int
    paste_events_count: int


class DemoCase(BaseModel):
    id: str  # "case_a", "case_b", "case_c"
    archetype: Literal["genuine_builder", "blind_copy_paste", "non_native_expert"]
    title: str
    description: str
    student_label: str
    domain: Literal["code", "essay"] = "code"
    code: str
    legacy_detector_verdict: str
    legacy_ai_probability: float
    expected_verimind_verdict: str
    expected_verimind_prob: float
    turns: List[DemoTurn]


# ==========================================
# 6. BENCHMARK & EVALUATION SCHEMAS
# ==========================================
class CalibrationBin(BaseModel):
    mean_predicted_prob: float
    fraction_of_positives: float
    count: int


class ConfusionMatrix(BaseModel):
    tp: int
    fp: int
    tn: int
    fn: int
    archetype_breakdown: Dict[str, float]


class BenchmarkMetrics(BaseModel):
    f1_score: float
    roc_auc: float
    brier_score: float
    non_native_parity_ratio: float
    legacy_detector_false_positive_rate_non_native: float
    calibration_curve: List[CalibrationBin]
    confusion_matrix: ConfusionMatrix
    avg_inference_latency_ms: float


# ==========================================
# 7. TEACHER COHORT DIAGNOSTICS SCHEMAS
# ==========================================
class CohortKPIs(BaseModel):
    cohort_size: int
    verified_mastery_rate: float
    copy_paste_flagged: int
    non_native_protected: int


class CohortStudentRow(BaseModel):
    student_id: str
    archetype: str
    overall_score: float
    concepts: Dict[str, float]
    weakest_concept: str


class InterventionPriority(BaseModel):
    rank: int
    concept: str
    failure_rate: float
    affected_students: int
    actionable_seminar_fix: str


class CohortResponse(BaseModel):
    kpis: CohortKPIs
    matrix: List[CohortStudentRow]
    intervention_priorities: List[InterventionPriority]


# ==========================================
# 8. HEALTH SCHEMA
# ==========================================
class HealthResponse(BaseModel):
    status: str
    nebius_status: str
    nebius_model: str
    hf_status: str
    hf_model: str
    ml_model_ready: bool
    dataset_size: int
