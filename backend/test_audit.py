import httpx
import json

BASE = "http://127.0.0.1:8000"
client = httpx.Client(base_url=BASE, timeout=15)

print("=== 1. FETCHING DEMOS ===")
r = client.get("/api/demos")
assert r.status_code == 200, f"Demos error: {r.status_code}"
demos = r.json()
print(f"Loaded {len(demos)} demo cases.")

print("\n=== 2. AUDITING CASE A (GENUINE BUILDER) ===")
case_a = next(d for d in demos if d["id"] == "case_a")
r_sub = client.post("/api/analyze-submission", json={"content": case_a["code"], "student_label": case_a["student_label"], "domain": "code"})
assert r_sub.status_code == 200
sub_a = r_sub.json()
sess_a = sub_a["session_id"]
print("Session A:", sess_a, "| PII Badge:", sub_a["privacy_report"]["privacy_badge"])

for t in case_a["turns"]:
    r_t = client.post("/api/viva/turn", json={"session_id": sess_a, "turn_number": t["turn_number"], "answer": t["pre_authored_answer"], "latency_ms": t["latency_ms"], "paste_events_count": t["paste_events_count"]})
    assert r_t.status_code == 200
    t_res = r_t.json()
    print(f"  Turn {t['turn_number']} score: {t_res['turn_score']} (Semantic: {t_res['semantic_alignment']}, Specificity: {t_res['specificity_score']}, Provider: {t_res['provider_used']})")

r_fin = client.post("/api/viva/finalize", json={"session_id": sess_a})
assert r_fin.status_code == 200
p_a = r_fin.json()
print(f"Case A Verdict: {p_a['verdict']} (Prob: {p_a['authenticity_probability'] * 100:.1f}%)")
print(f"Passport SHA-256: {p_a['passport_hash'][:16]}...{p_a['passport_hash'][-8:]}")
assert p_a["verdict"] == "VERIFIED MASTERY"
assert p_a["authenticity_probability"] >= 0.75

# Test passport verification by hash
r_ver = client.get(f"/api/passport/{p_a['passport_hash']}")
assert r_ver.status_code == 200
assert r_ver.json()["passport_hash"] == p_a["passport_hash"]
print("  Passport cryptographic verification: PASS")

print("\n=== 3. AUDITING CASE B (BLIND COPY-PASTE) ===")
case_b = next(d for d in demos if d["id"] == "case_b")
r_sub = client.post("/api/analyze-submission", json={"content": case_b["code"], "student_label": case_b["student_label"], "domain": "code"})
assert r_sub.status_code == 200
sub_b = r_sub.json()
sess_b = sub_b["session_id"]

for t in case_b["turns"]:
    r_t = client.post("/api/viva/turn", json={"session_id": sess_b, "turn_number": t["turn_number"], "answer": t["pre_authored_answer"], "latency_ms": t["latency_ms"], "paste_events_count": t["paste_events_count"]})
    assert r_t.status_code == 200
    t_res = r_t.json()
    print(f"  Turn {t['turn_number']} score: {t_res['turn_score']} (Semantic: {t_res['semantic_alignment']}, Specificity: {t_res['specificity_score']})")

r_fin = client.post("/api/viva/finalize", json={"session_id": sess_b})
assert r_fin.status_code == 200
p_b = r_fin.json()
print(f"Case B Verdict: {p_b['verdict']} (Prob: {p_b['authenticity_probability'] * 100:.1f}%)")
print(f"Socratic Remediation Concept: {p_b['remediation_plan']['recommended_concept']}")
print(f"Socratic Guiding Question: {p_b['remediation_plan']['guiding_question'][:60]}...")
assert p_b["verdict"] == "CONCEPT GAP"
assert p_b["authenticity_probability"] <= 0.40

print("\n=== 4. AUDITING CASE C (NON-NATIVE EXPERT) ===")
case_c = next(d for d in demos if d["id"] == "case_c")
r_sub = client.post("/api/analyze-submission", json={"content": case_c["code"], "student_label": case_c["student_label"], "domain": "code"})
assert r_sub.status_code == 200
sub_c = r_sub.json()
sess_c = sub_c["session_id"]

for t in case_c["turns"]:
    r_t = client.post("/api/viva/turn", json={"session_id": sess_c, "turn_number": t["turn_number"], "answer": t["pre_authored_answer"], "latency_ms": t["latency_ms"], "paste_events_count": t["paste_events_count"]})
    assert r_t.status_code == 200
    t_res = r_t.json()
    print(f"  Turn {t['turn_number']} score: {t_res['turn_score']} (Semantic: {t_res['semantic_alignment']}, Specificity: {t_res['specificity_score']})")

r_fin = client.post("/api/viva/finalize", json={"session_id": sess_c})
assert r_fin.status_code == 200
p_c = r_fin.json()
print(f"Case C Verdict: {p_c['verdict']} (Prob: {p_c['authenticity_probability'] * 100:.1f}%)")
print(f"Legacy Stylometric Risk: {p_c['legacy_stylometric_risk']}% ({p_c['legacy_detector_verdict'][:50]}...)")
grammar_attr = next(a for a in p_c["feature_attributions"] if a["feature"] == "grammar_noise_index")
print(f"Grammar Bias Attribution: contribution = {grammar_attr['contribution']} ({grammar_attr['impact']})")
assert p_c["verdict"] == "VERIFIED MASTERY"
assert p_c["authenticity_probability"] >= 0.75
assert grammar_attr["contribution"] == 0.0

print("\n=== 5. AUDITING COHORT DIAGNOSTICS (TAB 02) ===")
r_coh = client.get("/api/teacher/cohort")
assert r_coh.status_code == 200
coh = r_coh.json()
print(f"Cohort Size: {coh['kpis']['cohort_size']}")
print(f"Verified Mastery Rate: {coh['kpis']['verified_mastery_rate'] * 100:.1f}%")
print(f"Matrix Row Count: {len(coh['matrix'])}")
assert len(coh["matrix"]) == 30
print(f"Top Intervention Priority: {coh['intervention_priorities'][0]['concept']} (Failure Rate: {coh['intervention_priorities'][0]['failure_rate'] * 100:.0f}%)")

print("\n=== 6. AUDITING MODEL & FAIRNESS (TAB 03) ===")
r_bench = client.get("/api/eval/benchmark")
assert r_bench.status_code == 200
bench = r_bench.json()
print(f"F1-Score: {bench['f1_score']}")
print(f"ROC-AUC: {bench['roc_auc']}")
print(f"Brier Score: {bench['brier_score']}")
print(f"Non-Native Parity Ratio: {bench['non_native_parity_ratio']}")
print(f"Calibration Bins Count: {len(bench['calibration_curve'])}")
assert bench["f1_score"] >= 0.92
assert bench["roc_auc"] >= 0.96
assert bench["brier_score"] <= 0.08
assert bench["non_native_parity_ratio"] >= 0.95

print("\n=== ALL API ENDPOINTS & FLOWS VERIFIED SUCCESSFULLY ===")
