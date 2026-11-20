import json
import re
import numpy as np
import httpx
from openai import OpenAI
from typing import Dict, Any, Optional, Tuple

from config import (
    NEBIUS_API_KEY,
    NEBIUS_BASE_URL,
    NEBIUS_MODEL,
    HF_TOKEN,
    HF_EMBEDDING_MODEL,
)
from schemas import (
    MicroVivaTurn,
    StructuralDependencyMap,
    SocraticRemediation,
)


def cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
    dot = np.dot(v1, v2)
    norm = np.linalg.norm(v1) * np.linalg.norm(v2)
    return float(dot / norm) if norm > 0 else 0.0


class AIClientsManager:
    """
    Hybrid Nebius Token Factory + Hugging Face Pro Client Manager
    with Zero-Crash Deterministic Fallback.
    """

    def __init__(self):
        self.nebius_client: Optional[OpenAI] = None
        self.nebius_status: str = "evaluating"
        self.hf_status: str = "evaluating"
        self._init_clients()

    def _init_clients(self):
        # 1. Nebius Token Factory Client
        if NEBIUS_API_KEY and NEBIUS_BASE_URL:
            try:
                self.nebius_client = OpenAI(
                    api_key=NEBIUS_API_KEY,
                    base_url=NEBIUS_BASE_URL,
                    timeout=18.0,
                )
            except Exception:
                self.nebius_client = None
                self.nebius_status = "fallback"

        # Check live health status
        self.probe_health()

    def probe_health(self) -> Dict[str, str]:
        """Probes live connection status of Nebius and HF."""
        # Probe Hugging Face Pro Embedding Router
        hf_live = False
        if HF_TOKEN:
            try:
                url = f"https://router.huggingface.co/hf-inference/models/{HF_EMBEDDING_MODEL}/pipeline/feature-extraction"
                r = httpx.post(
                    url,
                    headers={"Authorization": f"Bearer {HF_TOKEN}"},
                    json={"inputs": "health check vector"},
                    timeout=8.0,
                )
                if r.status_code == 200:
                    hf_live = True
            except Exception:
                hf_live = False
        self.hf_status = "live" if hf_live else "fallback"

        # Probe Nebius Token Factory
        nebius_live = False
        if self.nebius_client:
            try:
                # Lightweight 1-token probe
                resp = self.nebius_client.chat.completions.create(
                    model=NEBIUS_MODEL,
                    messages=[{"role": "user", "content": "1"}],
                    max_tokens=1,
                )
                if resp and resp.choices:
                    nebius_live = True
            except Exception:
                nebius_live = False
        self.nebius_status = "live" if nebius_live else "fallback"

        return {"nebius": self.nebius_status, "hf": self.hf_status}

    # ==============================================================
    # 1. HUGGING FACE PRO EMBEDDING & CONCEPT SIMILARITY
    # ==============================================================
    def compute_semantic_alignment(
        self, student_answer: str, rubric: str
    ) -> Tuple[float, str]:
        """
        Computes cosine similarity between student answer and expected rubric.
        Calls live Hugging Face Pro router, falling back to local TF-IDF on error.
        """
        if not student_answer.strip() or not rubric.strip():
            return 0.10, "fallback"

        # Try Hugging Face Pro Router
        if self.hf_status == "live" or HF_TOKEN:
            try:
                url = f"https://router.huggingface.co/hf-inference/models/{HF_EMBEDDING_MODEL}/pipeline/feature-extraction"
                headers = {"Authorization": f"Bearer {HF_TOKEN}"}
                r1 = httpx.post(url, headers=headers, json={"inputs": student_answer}, timeout=10.0)
                r2 = httpx.post(url, headers=headers, json={"inputs": rubric}, timeout=10.0)

                if r1.status_code == 200 and r2.status_code == 200:
                    v1 = np.array(r1.json(), dtype=float)
                    v2 = np.array(r2.json(), dtype=float)
                    # Flatten if nested
                    if v1.ndim > 1:
                        v1 = v1.flatten()
                    if v2.ndim > 1:
                        v2 = v2.flatten()
                    sim = cosine_similarity(v1, v2)
                    self.hf_status = "live"
                    # Rescale MiniLM similarity range (~0.25-0.80) to calibrated (0.05-0.99)
                    scaled_sim = float(np.clip((sim - 0.25) / 0.55, 0.05, 0.99))
                    return round(scaled_sim, 3), "huggingface"
            except Exception:
                pass

        # Deterministic Fallback: Local TF-IDF + Concept Token Overlap
        self.hf_status = "fallback"
        return self._local_concept_similarity(student_answer, rubric), "fallback"

    def _local_concept_similarity(self, answer: str, rubric: str) -> float:
        """Local zero-dependency conceptual similarity calculation."""
        ans_tokens = set(re.findall(r"\b[a-zA-Z0-9_]{3,}\b", answer.lower()))
        rub_tokens = set(re.findall(r"\b[a-zA-Z0-9_]{3,}\b", rubric.lower()))
        if not rub_tokens or not ans_tokens:
            return 0.15

        intersection = ans_tokens.intersection(rub_tokens)
        jaccard = len(intersection) / len(rub_tokens)

        # Keyword density bonus for technical CS terms
        cs_anchors = {
            "o(1)", "o(n)", "o(log", "dict", "hash", "constant", "linear",
            "lookup", "amortized", "recursion", "stack", "base", "guard",
            "none", "empty", "invariant", "memory", "cache", "thread", "lock"
        }
        ans_text = answer.lower()
        cs_bonus = sum(0.12 for anchor in cs_anchors if anchor in ans_text)

        score = float(np.clip(0.35 * jaccard + min(0.60, cs_bonus), 0.10, 0.95))
        return round(score, 3)

    # ==============================================================
    # 2. IRT-GUIDED MICRO-VIVA GENERATOR (NEBIUS OR AST-GROUNDED FALLBACK)
    # ==============================================================
    def generate_micro_viva_turn(
        self,
        turn_number: int,
        ast_map: StructuralDependencyMap,
        previous_answers: Optional[list] = None,
    ) -> MicroVivaTurn:
        """
        Generates an IRT question strictly grounded in the extracted AST.
        Turn 1: Mechanism Trace (Difficulty 1)
        Turn 2: Counterfactual Perturbation (Difficulty 2)
        Turn 3: Transfer Live Patch (Difficulty 3)
        """
        turn_types = {
            1: ("MECHANISM_TRACE", 1),
            2: ("COUNTERFACTUAL_PERTURBATION", 2),
            3: ("TRANSFER_LIVE_PATCH", 3),
        }
        turn_type, difficulty = turn_types.get(turn_number, ("MECHANISM_TRACE", 1))

        # Attempt Nebius generation if live
        if self.nebius_status == "live" and self.nebius_client:
            try:
                turn = self._generate_nebius_turn(turn_number, turn_type, difficulty, ast_map)
                if turn:
                    return turn
            except Exception:
                self.nebius_status = "fallback"

        # Deterministic AST-Grounded Question Synthesis
        return self._generate_ast_grounded_turn(turn_number, turn_type, difficulty, ast_map)

    def _generate_nebius_turn(
        self,
        turn_number: int,
        turn_type: str,
        difficulty: int,
        ast_map: StructuralDependencyMap,
    ) -> Optional[MicroVivaTurn]:
        """Calls Nebius Token Factory for dynamic turn generation."""
        ast_summary = {
            "functions": [f.name for f in ast_map.functions],
            "data_structures": ast_map.data_structures,
            "edge_guards": [g.condition for g in ast_map.edge_guards],
            "margin_annotations": [
                {"line": m.line, "label": m.label, "detail": m.detail}
                for m in ast_map.margin_annotations[:6]
            ],
        }
        prompt = (
            f"You are the VeriMind Cognitive Authenticity Prober. Generate Turn {turn_number} "
            f"({turn_type}, Difficulty {difficulty}) for a student's code submission.\n"
            f"Ground your question strictly in one of these AST nodes:\n{json.dumps(ast_summary)}\n"
            f"Return ONLY valid JSON with keys: 'question', 'target_line' (int), 'concept_tag', 'expected_concept_rubric'."
        )
        resp = self.nebius_client.chat.completions.create(
            model=NEBIUS_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=350,
        )
        content = resp.choices[0].message.content
        data = json.loads(content)
        return MicroVivaTurn(
            turn_number=turn_number,
            question=data.get("question", "Explain your algorithmic rationale."),
            target_line=data.get("target_line", ast_map.margin_annotations[0].line if ast_map.margin_annotations else 1),
            concept_tag=data.get("concept_tag", "AST_MECHANISM"),
            expected_concept_rubric=data.get("expected_concept_rubric", "Clear explanation of algorithmic invariant"),
            difficulty=difficulty,
            turn_type=turn_type,
        )

    def _generate_ast_grounded_turn(
        self,
        turn_number: int,
        turn_type: str,
        difficulty: int,
        ast_map: StructuralDependencyMap,
    ) -> MicroVivaTurn:
        """Deterministic, grounded IRT prober based on the AST layout."""
        # Find key AST targets
        ds_ann = next((m for m in ast_map.margin_annotations if m.category == "DATA_STRUCTURE"), None)
        guard_ann = next((m for m in ast_map.margin_annotations if m.category == "EDGE_GUARD"), None)
        logic_ann = next((m for m in ast_map.margin_annotations if m.category == "LOGIC_CORE"), None)
        comp_ann = next((m for m in ast_map.margin_annotations if m.category == "COMPLEXITY"), None)

        if turn_number == 1:
            target_line = ds_ann.line if ds_ann else (logic_ann.line if logic_ann else 4)
            ds_name = ast_map.data_structures[0] if ast_map.data_structures else "lookup structure"
            question = (
                f"On Line {target_line:02d}, you chose a {ds_name}. "
                f"Explain the algorithmic invariant and asymptotic time complexity this choice provides over an array or linear scan."
            )
            rubric = (
                f"{ds_name} or hash map provides O(1) average lookup and insertion time complexity "
                f"compared to O(N) linear search in a list or sequence."
            )
            tag = "DATA_STRUCTURE_MECHANISM"

        elif turn_number == 2:
            target_line = guard_ann.line if guard_ann else (comp_ann.line if comp_ann else 7)
            guard_expr = ast_map.edge_guards[0].condition if ast_map.edge_guards else "the boundary check"
            question = (
                f"Suppose the input stream is mutated to contain 1,000,000 duplicate keys followed by an empty collection. "
                f"Which exact line executes defensive bounds checking or fails, and what is the memory implication?"
            )
            rubric = (
                f"Line {target_line} guards against empty or invalid input preventing IndexError or KeyError, "
                f"while memory scales with distinct keys O(N) rather than total stream size."
            )
            tag = "COUNTERFACTUAL_PERTURBATION"

        else:  # Turn 3: Transfer Live Patch
            target_line = logic_ann.line if logic_ann else 10
            question = (
                f"If this implementation must run in a high-concurrency multi-threaded environment "
                f"without introducing race conditions or external database dependencies, "
                f"what 1–2 line architectural patch or invariant guarantee would you add near Line {target_line:02d}?"
            )
            rubric = (
                f"Introduce an explicit mutex lock (threading.Lock) around state mutation "
                f"or maintain immutable atomic snapshot semantics."
            )
            tag = "TRANSFER_CONCURRENCY_PATCH"

        return MicroVivaTurn(
            turn_number=turn_number,
            question=question,
            target_line=target_line,
            concept_tag=tag,
            expected_concept_rubric=rubric,
            difficulty=difficulty,
            turn_type=turn_type,
        )

    # ==============================================================
    # 3. SOCRATIC REMEDIATION PRESCRIPTION
    # ==============================================================
    def generate_remediation(
        self,
        verdict: str,
        probability: float,
        features: Dict[str, float],
        target_line: int = 5,
    ) -> SocraticRemediation:
        """Generates tailored pedagogical remediation instead of punitive flagging."""
        if probability >= 0.72:
            return SocraticRemediation(
                gap_summary="Zero critical conceptual deficits identified. Student exhibits grounded mental model of algorithmic invariants.",
                guiding_question="How would you adapt this invariant to support distributed cache eviction under network partitions?",
                concrete_next_step="Extend the test suite to evaluate amortized lock contention under high concurrent reader throughput.",
                recommended_concept="Amortized Complexity & Concurrent Data Structures",
            )
        elif probability >= 0.40:
            return SocraticRemediation(
                gap_summary="Partial concept alignment detected: student understands surface syntax but faltered during counterfactual mutation.",
                guiding_question=f"When the input collection is mutated at runtime near Line {target_line:02d}, how does the invariant guarantee halting?",
                concrete_next_step=f"Add an explicit loop invariant assertion on Line {target_line:02d} and verify state transitions against an adversarial input test case.",
                recommended_concept="Loop Invariants & Defensive Bounds Checking",
            )
        else:
            return SocraticRemediation(
                gap_summary="Substantial conceptual gap: inability to explain data structure mechanism or trace execution under input perturbation.",
                guiding_question="Can you trace by hand step-by-step what happens in memory when an empty input is passed?",
                concrete_next_step="Implement the core lookup loop from first principles without relying on third-party snippets or boilerplate.",
                recommended_concept="Core Algorithmic Tracing & State Transformation",
            )


# Global Singleton
ai_clients = AIClientsManager()
