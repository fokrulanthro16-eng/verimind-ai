import sqlite3
import json
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from config import DATABASE_PATH
from schemas import DemoCase, DemoTurn


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initializes tables and seeds cohort and dossier benchmark data."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        student_hash TEXT NOT NULL,
        domain TEXT NOT NULL,
        content TEXT NOT NULL,
        ast_json TEXT NOT NULL,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS viva_sessions (
        id TEXT PRIMARY KEY,
        submission_id TEXT NOT NULL,
        student_hash TEXT NOT NULL,
        current_turn INTEGER NOT NULL,
        status TEXT NOT NULL,
        authenticity_prob REAL,
        verdict TEXT,
        passport_hash TEXT,
        passport_json TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (submission_id) REFERENCES submissions (id)
    );

    CREATE TABLE IF NOT EXISTS viva_turns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        turn_number INTEGER NOT NULL,
        question TEXT NOT NULL,
        target_line INTEGER,
        concept_tag TEXT NOT NULL,
        rubric TEXT NOT NULL,
        student_answer TEXT,
        semantic_score REAL,
        specificity_score REAL,
        turn_score REAL,
        latency_ms INTEGER DEFAULT 4200,
        paste_events_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES viva_sessions (id)
    );

    CREATE TABLE IF NOT EXISTS cohort_records (
        student_id TEXT PRIMARY KEY,
        archetype TEXT NOT NULL,
        overall_score REAL NOT NULL,
        concept_hash_maps REAL NOT NULL,
        concept_recursion REAL NOT NULL,
        concept_edge_guards REAL NOT NULL,
        concept_time_complexity REAL NOT NULL,
        concept_memory_mutation REAL NOT NULL,
        concept_async_concurrency REAL NOT NULL,
        weakest_concept TEXT NOT NULL
    );
    """)

    conn.commit()
    seed_cohort_if_empty(conn)
    conn.close()


def seed_cohort_if_empty(conn: sqlite3.Connection):
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM cohort_records")
    count = cursor.fetchone()[0]
    if count > 0:
        return

    # Seed 30 realistic students across 6 concepts
    # Concepts:
    # 1. Hash Maps & O(1)
    # 2. Recursion & Base Cases
    # 3. Edge-Case Guards
    # 4. Time Complexity
    # 5. Memory & Mutation
    # 6. Async & Concurrency
    import random
    random.seed(42)

    archetypes_pool = [
        ("genuine_builder", 0.90, 0.95),
        ("non_native_expert", 0.88, 0.94),
        ("surface_ai_assisted", 0.50, 0.65),
        ("blind_copy_paste", 0.15, 0.35),
    ]

    records = []
    concept_names = [
        "Hash Maps & O(1)",
        "Recursion & Base Cases",
        "Edge-Case Guards",
        "Time Complexity",
        "Memory & Mutation",
        "Async & Concurrency",
    ]

    for i in range(1, 31):
        stu_id = f"STU-{i:02d}"
        if i in [1, 2, 5, 8, 12, 15, 18, 22, 25, 28]:
            arch = "genuine_builder"
            base_score = random.uniform(0.86, 0.96)
        elif i in [3, 7, 10, 14, 19, 23, 27]:
            arch = "non_native_expert"
            base_score = random.uniform(0.85, 0.94)
        elif i in [4, 9, 13, 17, 21, 26, 30]:
            arch = "surface_ai_assisted"
            base_score = random.uniform(0.48, 0.68)
        else:
            arch = "blind_copy_paste"
            base_score = random.uniform(0.12, 0.36)

        c_scores = {}
        for c in concept_names:
            noise = random.uniform(-0.15, 0.12)
            c_scores[c] = round(max(0.05, min(0.99, base_score + noise)), 2)

        # Especially for class-wide bottlenecks:
        # Let Async & Concurrency and Edge-Case Guards be typical stumbling blocks
        c_scores["Async & Concurrency"] = round(max(0.05, c_scores["Async & Concurrency"] - 0.18), 2)
        c_scores["Edge-Case Guards"] = round(max(0.05, c_scores["Edge-Case Guards"] - 0.10), 2)

        weakest = min(c_scores.items(), key=lambda x: x[1])[0]
        overall = round(sum(c_scores.values()) / len(c_scores), 2)

        records.append((
            stu_id,
            arch,
            overall,
            c_scores["Hash Maps & O(1)"],
            c_scores["Recursion & Base Cases"],
            c_scores["Edge-Case Guards"],
            c_scores["Time Complexity"],
            c_scores["Memory & Mutation"],
            c_scores["Async & Concurrency"],
            weakest,
        ))

    cursor.executemany("""
    INSERT INTO cohort_records (
        student_id, archetype, overall_score,
        concept_hash_maps, concept_recursion, concept_edge_guards,
        concept_time_complexity, concept_memory_mutation, concept_async_concurrency,
        weakest_concept
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, records)
    conn.commit()


# ==============================================================
# PRE-SEEDED 3 ONE-CLICK JUDGE DOSSIER CASES
# ==============================================================
CASE_A_CODE = '''# Author: Elena Rostova (Verified Genuine Builder)
from collections import OrderedDict
import time

class SlidingWindowRateLimiter:
    """
    In-memory rate limiter enforcing maximum requests within a sliding epoch window.
    """
    def __init__(self, max_requests: int = 5, window_seconds: float = 60.0):
        if max_requests <= 0 or window_seconds <= 0:
            raise ValueError("Limit parameters must be positive non-zero.")
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.client_records = OrderedDict()  # Line 09: Client timestamp logs

    def allow_request(self, client_id: str) -> bool:
        if not client_id or not isinstance(client_id, str):
            return False  # Line 13: Defensive edge-guard on invalid input
        
        current_time = time.time()
        boundary = current_time - self.window_seconds

        if client_id not in self.client_records:
            self.client_records[client_id] = [current_time]
            return True

        # Filter out expired timestamps
        timestamps = self.client_records[client_id]
        while timestamps and timestamps[0] <= boundary:
            timestamps.pop(0)

        if len(timestamps) < self.max_requests:
            timestamps.append(current_time)
            return True

        return False
'''

CASE_B_CODE = '''# Author: Alex Turner (Blind Copy-Paste)
import sys
import heapq

class DijkstraShortestPathEngine:
    def __init__(self, vertices_count: int):
        self.v = vertices_count
        self.graph = [[] for _ in range(vertices_count)]

    def add_edge(self, u: int, v: int, w: int):
        self.graph[u].append((v, w))
        self.graph[v].append((u, w))

    def compute_shortest_path(self, source: int):
        distances = {i: float('inf') for i in range(self.v)}
        distances[source] = 0
        min_heap = [(0, source)]

        while min_heap:
            current_dist, u = heapq.heappop(min_heap)
            if current_dist > distances[u]:
                continue
            for neighbor, weight in self.graph[u]:
                if distances[u] + weight < distances[neighbor]:
                    distances[neighbor] = distances[u] + weight
                    heapq.heappush(min_heap, (distances[neighbor], neighbor))
        return distances
'''

CASE_C_CODE = '''# Author: Jian Wei / Non-Native English Speaker
def remove_duplicates_and_count(nums_list):
    """
    Sliding window deduplication with element frequency mapping.
    """
    if not nums_list or len(nums_list) == 0:
        return 0, {}  # Line 04: Guard for empty input list

    seen_map = {}  # Line 06: Hash table for counting
    write_idx = 0

    for i in range(len(nums_list)):
        val = nums_list[i]
        if val not in seen_map:
            seen_map[val] = 1
            nums_list[write_idx] = val
            write_idx += 1
        else:
            seen_map[val] += 1

    return write_idx, seen_map
'''

DEMO_CASES: List[DemoCase] = [
    DemoCase(
        id="case_a",
        archetype="genuine_builder",
        title="Case A · Genuine Builder",
        description="Clean Python Sliding-Window Rate Limiter with thoughtful edge handling, steady cadence, and precise code citations.",
        student_label="Elena Rostova",
        domain="code",
        code=CASE_A_CODE.strip(),
        legacy_detector_verdict="14% AI-GENERATED · HUMAN AUTHENTIC",
        legacy_ai_probability=14.0,
        expected_verimind_verdict="VERIFIED MASTERY",
        expected_verimind_prob=0.942,
        turns=[
            DemoTurn(
                turn_number=1,
                question="On Line 09, you selected OrderedDict to store client records. Explain the algorithmic invariant and complexity rationale versus a basic dict or list.",
                target_line=9,
                concept_tag="DATA_STRUCTURE_MECHANISM",
                expected_concept_rubric="OrderedDict preserves access insertion order and provides O(1) key lookup while facilitating FIFO eviction of expired timestamps without scanning the entire list.",
                pre_authored_answer="I used OrderedDict on Line 09 so we preserve access insertion order and get O(1) average key lookup while facilitating FIFO eviction of expired timestamps without scanning the entire list.",
                latency_ms=4100,
                paste_events_count=0,
            ),
            DemoTurn(
                turn_number=2,
                question="Suppose the input stream mutates to contain 1,000,000 requests from a single client_id in 1 millisecond. Which line prevents starvation or excessive memory consumption?",
                target_line=13,
                concept_tag="COUNTERFACTUAL_PERTURBATION",
                expected_concept_rubric="Line 24 while loop trims timestamps outside the 60s window keeping max_requests capped at 5 with O(1) memory per client regardless of incoming frequency.",
                pre_authored_answer="On Line 13 we validate the client key, but specifically the while loop on Line 24 trims timestamps outside the 60s window. Since max_requests is capped at 5, timestamps never exceeds 5 elements, maintaining O(1) memory per client regardless of incoming frequency.",
                latency_ms=4800,
                paste_events_count=0,
            ),
            DemoTurn(
                turn_number=3,
                question="Propose a 1–2 line architectural patch near Line 15 to make this rate limiter thread-safe in a multi-threaded web application without external redis dependencies.",
                target_line=15,
                concept_tag="TRANSFER_LIVE_PATCH",
                expected_concept_rubric="Initialize self._lock = threading.Lock() and wrap allow_request body in with self._lock: to prevent race conditions during concurrent timestamp updates.",
                pre_authored_answer="I would initialize self._lock = threading.Lock() in __init__ and wrap allow_request body in 'with self._lock:' to prevent race conditions during concurrent timestamp updates.",
                latency_ms=5200,
                paste_events_count=0,
            ),
        ],
    ),
    DemoCase(
        id="case_b",
        archetype="blind_copy_paste",
        title="Case B · Blind Copy-Paste",
        description="Polished Dijkstra implementation with high paste events, generic high-level buzzwords, and failure to explain execution perturbation.",
        student_label="Alex Turner",
        domain="code",
        code=CASE_B_CODE.strip(),
        legacy_detector_verdict="93% AI-GENERATED · HIGH MATCH TO KNOWN CATALOG",
        legacy_ai_probability=93.0,
        expected_verimind_verdict="CONCEPT GAP",
        expected_verimind_prob=0.141,
        turns=[
            DemoTurn(
                turn_number=1,
                question="On Line 15, explain why heapq is preferred over an array scan for Dijkstra's shortest path.",
                target_line=15,
                concept_tag="DATA_STRUCTURE_MECHANISM",
                expected_concept_rubric="heapq provides O(log V) priority queue extraction of the minimum distance node compared to O(V) linear scan of an unsorted array.",
                pre_authored_answer="Heapq is a powerful Python algorithm library that leverages priority queues to optimize graph networks and search trees efficiently in modern machine learning environments.",
                latency_ms=1200,
                paste_events_count=3,
            ),
            DemoTurn(
                turn_number=2,
                question="Suppose graph weights are mutated to include negative edge cycles. Which line causes non-termination or infinite loops, and why?",
                target_line=18,
                concept_tag="COUNTERFACTUAL_PERTURBATION",
                expected_concept_rubric="Negative edge cycles violate greedy invariant causing infinite relaxation and non-halting cycle traversal.",
                pre_authored_answer="The code will automatically handle all edge weights because Dijkstra is mathematically proven to calculate shortest paths across any matrix or graph structure seamlessly.",
                latency_ms=950,
                paste_events_count=2,
            ),
            DemoTurn(
                turn_number=3,
                question="How would you patch Line 18 to detect cycles early or support negative weights?",
                target_line=18,
                concept_tag="TRANSFER_LIVE_PATCH",
                expected_concept_rubric="Switch to Bellman-Ford algorithm or maintain relaxation count per vertex capped at V-1 to detect negative cycles.",
                pre_authored_answer="You just import networkx or use an advanced neural graph neural network to automatically resolve all weights and cycles.",
                latency_ms=1100,
                paste_events_count=1,
            ),
        ],
    ),
    DemoCase(
        id="case_c",
        archetype="non_native_expert",
        title="Case C · Non-Native Expert [Bias Proof]",
        description="Mastered algorithm with broken English syntax. Legacy detectors falsely flag 89% AI, while VeriMind verifies 92% mastery with 0.0% grammar bias.",
        student_label="Jian Wei",
        domain="code",
        code=CASE_C_CODE.strip(),
        legacy_detector_verdict="89% AI-GENERATED · FALSE POSITIVE ON NON-NATIVE SYNTAX",
        legacy_ai_probability=89.0,
        expected_verimind_verdict="VERIFIED MASTERY",
        expected_verimind_prob=0.923,
        turns=[
            DemoTurn(
                turn_number=1,
                question="On Line 06, you declared seen_map as a dict. Explain why you used a hash table instead of checking 'if val in nums_list'.",
                target_line=6,
                concept_tag="DATA_STRUCTURE_MECHANISM",
                expected_concept_rubric="dict provides O(1) average lookup making total time complexity O(N) rather than O(N^2) quadratic search in list.",
                pre_authored_answer="in line 6 i make dict because list search take O(n) time so dict give O(1) lookup, making total time O(N) not O(N^2) for big array",
                latency_ms=4300,
                paste_events_count=0,
            ),
            DemoTurn(
                turn_number=2,
                question="If the input array contains 1,000,000 identical items, which exact line prevents duplicate write operations and how many elements are in seen_map?",
                target_line=4,
                concept_tag="COUNTERFACTUAL_PERTURBATION",
                expected_concept_rubric="Line 11 condition if val not in seen_map triggers once and duplicates enter else branch so seen_map has only 1 key and write_idx is 1.",
                pre_authored_answer="if all same, line 11 condition 'if val not in seen_map' true only 1 time at start. then rest 999,999 go to line 16 else branch. seen_map have only 1 key, write_idx stop at 1, no memory waste.",
                latency_ms=4900,
                paste_events_count=0,
            ),
            DemoTurn(
                turn_number=3,
                question="Propose a 1-line patch to make this function return only elements appearing strictly more than K times.",
                target_line=18,
                concept_tag="TRANSFER_LIVE_PATCH",
                expected_concept_rubric="Return list comprehension filtering dictionary keys by count [k for k, v in seen_map.items() if v > K].",
                pre_authored_answer="change return to [k for k, v in seen_map.items() if v > K], filter keys by count easily.",
                latency_ms=4600,
                paste_events_count=0,
            ),
        ],
    ),
]


def get_demo_cases() -> List[DemoCase]:
    return DEMO_CASES


def find_matching_demo(content: str) -> Optional[DemoCase]:
    """Finds if content matches one of the 3 pre-seeded demo dossiers."""
    content_lower = content.lower()
    if "ratelimiter" in content_lower or "elena" in content_lower or "slidingwindow" in content_lower:
        return DEMO_CASES[0]
    if "dijkstra" in content_lower or "alex" in content_lower or "heapq" in content_lower:
        return DEMO_CASES[1]
    if "remove_duplicates" in content_lower or "jian" in content_lower or "seen_map" in content_lower:
        return DEMO_CASES[2]
    return None

