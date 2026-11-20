"use client";

import React, { useState } from "react";

interface IntegrationKitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IntegrationKitModal({ isOpen, onClose }: IntegrationKitModalProps) {
  const [activeTab, setActiveTab] = useState<"curl" | "python" | "lti" | "sla">("curl");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyCode = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const curlAnalyze = `curl -X POST "http://127.0.0.1:8000/api/analyze-submission" \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "class SlidingWindowRateLimiter:\\n    def __init__(self):\\n        self.records = {}",
    "student_label": "Candidate #8492",
    "domain": "python"
  }'`;

  const curlTurn = `curl -X POST "http://127.0.0.1:8000/api/viva/turn" \\
  -H "Content-Type: application/json" \\
  -d '{
    "session_id": "viva_49f215c71ae1",
    "turn_number": 1,
    "answer": "I used a dictionary on Line 04 for O(1) average lookup and eviction.",
    "latency_ms": 4200,
    "paste_events_count": 0
  }'`;

  const curlFinalize = `curl -X POST "http://127.0.0.1:8000/api/viva/finalize" \\
  -H "Content-Type: application/json" \\
  -d '{
    "session_id": "viva_49f215c71ae1"
  }'`;

  const pythonSnippet = `import requests

API_URL = "http://127.0.0.1:8000"

# 1. Intake student artifact & generate AST-grounded Socratic probe
res = requests.post(f"{API_URL}/api/analyze-submission", json={
    "content": open("solution.py").read(),
    "student_label": "Elena Rostova",
    "domain": "python"
}).json()

session_id = res["session_id"]
print("Turn 1 Question:", res["turn_1"]["question"])

# 2. Submit student viva defense turn
turn_res = requests.post(f"{API_URL}/api/viva/turn", json={
    "session_id": session_id,
    "turn_number": 1,
    "answer": "OrderedDict preserves access order and gives O(1) lookup.",
    "latency_ms": 3800,
    "paste_events_count": 0
}).json()

# 3. Finalize and mint immutable SHA-256 Competency Passport
passport = requests.post(f"{API_URL}/api/viva/finalize", json={
    "session_id": session_id
}).json()

print(f"VERDICT: {passport['verdict']} ({passport['authenticity_probability']*100:.1f}%)")
print(f"LEDGER SHA-256 SIGNATURE: {passport['passport_hash']}")`;

  const ltiPayload = `{
  "https://purl.imsglobal.org/spec/lti/claim/message_type": "LtiAssignmentGradingReport",
  "https://purl.imsglobal.org/spec/lti/claim/version": "1.3.0",
  "assignment_id": "CS106B-ASSIGNMENT-04",
  "user_sub": "STU_849204",
  "verimind_evaluation": {
    "authenticity_verdict": "VERIFIED MASTERY",
    "calibrated_score": 0.942,
    "non_native_fairness_shield": true,
    "grammar_penalty_applied": 0.00,
    "passport_sha256": "VERI-A7F48102B90CD334E91523B068AA29841B5C08F31E49D37CA5109BC82057F601",
    "audit_ledger_status": "COMMITTED"
  },
  "lis_result_sourcedid": "canvas_course_9841_user_849204",
  "scoreGiven": 0.942,
  "scoreMaximum": 1.0,
  "comment": "VeriMind Cognitive Authenticity Engine: Verified Genuine Invariant Understanding. 0.00% grammar bias penalty."
}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[1px] flex items-center justify-center p-4 select-none">
      <div className="bg-[#121211] text-[#F5F3EE] border border-[#2E2D2A] max-w-4xl w-full max-h-[90vh] flex flex-col font-mono shadow-2xl">
        {/* Modal Top Bar */}
        <div className="h-14 px-6 border-b border-[#2E2D2A] flex items-center justify-between flex-shrink-0 bg-[#161514]">
          <div className="flex items-center space-x-3">
            <span className="text-ochre font-bold">⚡</span>
            <span className="font-serif font-semibold text-lg text-[#F5F3EE]">
              B2B ENTERPRISE API & LMS INTEGRATION KIT
            </span>
            <span className="text-[10px] px-2 py-0.5 border border-sage text-sage uppercase">
              PRODUCTION REST API & LTI 1.3
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#9A9589] hover:text-[#F5F3EE] text-sm p-1"
          >
            ✕
          </button>
        </div>

        {/* Modal Sub-Header Tabs */}
        <div className="h-11 px-6 border-b border-[#2E2D2A] flex items-center space-x-4 flex-shrink-0 bg-[#1A1918] text-xs">
          <button
            onClick={() => setActiveTab("curl")}
            className={`h-full border-b-2 px-3 font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "curl"
                ? "border-ochre text-[#F5F3EE]"
                : "border-transparent text-[#9A9589] hover:text-[#F5F3EE]"
            }`}
          >
            01. cURL / REST API
          </button>
          <button
            onClick={() => setActiveTab("python")}
            className={`h-full border-b-2 px-3 font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "python"
                ? "border-ochre text-[#F5F3EE]"
                : "border-transparent text-[#9A9589] hover:text-[#F5F3EE]"
            }`}
          >
            02. Python SDK (10-Line Integration)
          </button>
          <button
            onClick={() => setActiveTab("lti")}
            className={`h-full border-b-2 px-3 font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "lti"
                ? "border-ochre text-[#F5F3EE]"
                : "border-transparent text-[#9A9589] hover:text-[#F5F3EE]"
            }`}
          >
            03. Canvas / Moodle LTI 1.3 Webhook
          </button>
          <button
            onClick={() => setActiveTab("sla")}
            className={`h-full border-b-2 px-3 font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "sla"
                ? "border-ochre text-[#F5F3EE]"
                : "border-transparent text-[#9A9589] hover:text-[#F5F3EE]"
            }`}
          >
            04. Enterprise SLA & Security Telemetry
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {activeTab === "curl" && (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] text-sage font-bold uppercase">
                    Step 1: POST /api/analyze-submission (Intake Artifact & Begin Socratic Viva)
                  </span>
                  <button
                    onClick={() => copyCode("curl1", curlAnalyze)}
                    className="px-2.5 py-1 bg-[#1C1B19] border border-[#3E3D39] text-[#C2BDB2] text-[10px] hover:text-white"
                  >
                    {copiedKey === "curl1" ? "COPIED ✓" : "COPY CURL"}
                  </button>
                </div>
                <pre className="p-3 bg-[#0D0D0C] border border-[#2E2D2A] text-[#C2BDB2] overflow-x-auto text-[11px]">
                  {curlAnalyze}
                </pre>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] text-sage font-bold uppercase">
                    Step 2: POST /api/viva/turn (Submit Candidate Defense & Real-Time Scoring)
                  </span>
                  <button
                    onClick={() => copyCode("curl2", curlTurn)}
                    className="px-2.5 py-1 bg-[#1C1B19] border border-[#3E3D39] text-[#C2BDB2] text-[10px] hover:text-white"
                  >
                    {copiedKey === "curl2" ? "COPIED ✓" : "COPY CURL"}
                  </button>
                </div>
                <pre className="p-3 bg-[#0D0D0C] border border-[#2E2D2A] text-[#C2BDB2] overflow-x-auto text-[11px]">
                  {curlTurn}
                </pre>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] text-sage font-bold uppercase">
                    Step 3: POST /api/viva/finalize (Calibrated Inference & SHA-256 Passport Minting)
                  </span>
                  <button
                    onClick={() => copyCode("curl3", curlFinalize)}
                    className="px-2.5 py-1 bg-[#1C1B19] border border-[#3E3D39] text-[#C2BDB2] text-[10px] hover:text-white"
                  >
                    {copiedKey === "curl3" ? "COPIED ✓" : "COPY CURL"}
                  </button>
                </div>
                <pre className="p-3 bg-[#0D0D0C] border border-[#2E2D2A] text-[#C2BDB2] overflow-x-auto text-[11px]">
                  {curlFinalize}
                </pre>
              </div>
            </div>
          )}

          {activeTab === "python" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="font-sans text-xs text-[#C2BDB2]">
                  Seamlessly drop VeriMind into any autograder, CI/CD pipeline, or coding interview platform:
                </p>
                <button
                  onClick={() => copyCode("py", pythonSnippet)}
                  className="px-3 py-1 bg-[#1C1B19] border border-[#3E3D39] text-[#C2BDB2] text-[10px] hover:text-white"
                >
                  {copiedKey === "py" ? "COPIED ✓" : "COPY PYTHON SNIPPET"}
                </button>
              </div>
              <pre className="p-4 bg-[#0D0D0C] border border-[#2E2D2A] text-[#C2BDB2] overflow-x-auto text-[11px] leading-relaxed">
                {pythonSnippet}
              </pre>
            </div>
          )}

          {activeTab === "lti" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="font-sans text-xs text-[#C2BDB2]">
                  LTI 1.3 Advantage Deep Linking & Assignment and Grade Services payload sent directly to Canvas LMS or Moodle gradebooks:
                </p>
                <button
                  onClick={() => copyCode("lti", ltiPayload)}
                  className="px-3 py-1 bg-[#1C1B19] border border-[#3E3D39] text-[#C2BDB2] text-[10px] hover:text-white"
                >
                  {copiedKey === "lti" ? "COPIED ✓" : "COPY LTI WEBHOOK"}
                </button>
              </div>
              <pre className="p-4 bg-[#0D0D0C] border border-[#2E2D2A] text-[#C2BDB2] overflow-x-auto text-[11px] leading-relaxed">
                {ltiPayload}
              </pre>
            </div>
          )}

          {activeTab === "sla" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-[#1C1B19] border border-[#2E2D2A]">
                  <div className="text-[10px] text-[#9A9589] uppercase">Edge Inference SLA</div>
                  <div className="text-xl font-bold text-sage mt-1">&lt;1.0 ms</div>
                  <div className="text-[10px] text-[#9A9589] mt-0.5">Calibrated Classifier</div>
                </div>
                <div className="p-4 bg-[#1C1B19] border border-[#2E2D2A]">
                  <div className="text-[10px] text-[#9A9589] uppercase">Zero-Cloud Airgap</div>
                  <div className="text-xl font-bold text-sage mt-1">100% Offline</div>
                  <div className="text-[10px] text-[#9A9589] mt-0.5">Zero cloud dependency</div>
                </div>
                <div className="p-4 bg-[#1C1B19] border border-[#2E2D2A]">
                  <div className="text-[10px] text-[#9A9589] uppercase">Grammar Bias Rate</div>
                  <div className="text-xl font-bold text-sage mt-1">0.00%</div>
                  <div className="text-[10px] text-[#9A9589] mt-0.5">Fairness Shield active</div>
                </div>
                <div className="p-4 bg-[#1C1B19] border border-[#2E2D2A]">
                  <div className="text-[10px] text-[#9A9589] uppercase">Ledger Immutability</div>
                  <div className="text-xl font-bold text-sage mt-1">SHA-256</div>
                  <div className="text-[10px] text-[#9A9589] mt-0.5">Tamper-evident digest</div>
                </div>
              </div>

              <div className="p-4 bg-[#1C1B19] border border-[#2E2D2A] space-y-2">
                <div className="font-semibold text-xs text-[#F5F3EE] uppercase tracking-wider">
                  INSTITUTIONAL DATA PRIVACY & COMPLIANCE ARCHITECTURE
                </div>
                <ul className="space-y-1.5 font-sans text-xs text-[#C2BDB2] list-disc pl-4">
                  <li><strong>FERPA Aligned:</strong> Client-side deterministic regex scrubs all student IDs, institutional emails, phone numbers, and full names before processing.</li>
                  <li><strong>Zero-Spyware Guarantee:</strong> No biometric tracking, no camera gaze surveillance, no ambient audio harvesting, and no unauthorized screen recording.</li>
                  <li><strong>Cryptographic Verification:</strong> All certificates are anchored by a canonical SHA-256 digest queryable on the public registrar portal.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Bar */}
        <div className="h-12 px-6 border-t border-[#2E2D2A] flex items-center justify-between flex-shrink-0 bg-[#161514] text-[10px] text-[#9A9589]">
          <span>VERIMIND ENTERPRISE B2B SPECIFICATION // VER: 1.0.0</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#F5F3EE] text-[#121211] font-semibold uppercase tracking-wider hover:bg-stone transition-colors"
          >
            Close Modal
          </button>
        </div>
      </div>
    </div>
  );
}
