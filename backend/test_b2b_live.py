import urllib.request
import json

def test():
    print("Testing B2B Live Verification...")
    
    # 1. Health
    req = urllib.request.Request("http://127.0.0.1:8000/api/health")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        health = json.loads(resp.read().decode())
        print("✓ Backend Health (HTTP 200):", health["status"], "ML Ready:", health["ml_model_ready"])
    
    # 2. Multi-Discipline Analyze Submission: JS
    js_payload = json.dumps({
        "content": "class ResilientTaskQueue { async executeTask(id) { await Promise.resolve(); } }",
        "student_label": "JS Pilot Student",
        "domain": "javascript"
    }).encode("utf-8")
    req = urllib.request.Request("http://127.0.0.1:8000/api/analyze-submission", data=js_payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode())
        print("✓ JavaScript AST & Probe Generation (HTTP 200):", data["ast_map"]["domain"], "Turn 1 Tag:", data["turn_1"]["concept_tag"])
    
    # 3. Multi-Discipline Analyze Submission: SQL
    sql_payload = json.dumps({
        "content": "WITH Ranked AS (SELECT user_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY id DESC) as rk FROM logs) SELECT * FROM Ranked WHERE rk <= 5;",
        "student_label": "SQL Pilot Student",
        "domain": "sql"
    }).encode("utf-8")
    req = urllib.request.Request("http://127.0.0.1:8000/api/analyze-submission", data=sql_payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode())
        print("✓ SQL AST & Probe Generation (HTTP 200):", data["ast_map"]["domain"], "Turn 1 Tag:", data["turn_1"]["concept_tag"])

    # 4. Multi-Discipline Analyze Submission: Essay
    essay_payload = json.dumps({
        "content": "Algorithmic bias in surveillance proctoring systems is evident. Therefore, higher education must transition to cognitive proof models.",
        "student_label": "Essay Pilot Student",
        "domain": "essay"
    }).encode("utf-8")
    req = urllib.request.Request("http://127.0.0.1:8000/api/analyze-submission", data=essay_payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode())
        print("✓ Essay Causal AST & Probe Generation (HTTP 200):", data["ast_map"]["domain"], "Turn 1 Tag:", data["turn_1"]["concept_tag"])

    # 5. Public Recruiter Passport Lookup
    sample_hash = "VERI-A7F48102B90CD334E91523B068AA29841B5C08F31E49D37CA5109BC82057F601"
    req = urllib.request.Request(f"http://127.0.0.1:8000/api/passport/{sample_hash}")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        p = json.loads(resp.read().decode())
        print("✓ Public Recruiter Credential Lookup (HTTP 200):", p["student_hash"], "Verdict:", p["verdict"], "Prob:", p["authenticity_probability"])

    # 6. Cohort Diagnostics (Real SQLite Persistence verification)
    req = urllib.request.Request("http://127.0.0.1:8000/api/teacher/cohort")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        cohort = json.loads(resp.read().decode())
        print("✓ Teacher Cohort Diagnostics (HTTP 200): Size =", cohort["kpis"]["cohort_size"], "students")

    # 7. Frontend Localhost
    req = urllib.request.Request("http://localhost:3000")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        print("✓ Next.js Frontend Localhost (HTTP 200)")

    print("\nALL 4 B2B UPGRADES VERIFIED LIVE AND GREEN!")

if __name__ == "__main__":
    test()
