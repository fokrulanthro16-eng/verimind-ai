# Security & Privacy Architecture Policy

VeriMind AI is engineered as a zero-spyware, zero-cloud cognitive authenticity verification engine for higher education and enterprise recruiting.

---

## 1. Zero-Spyware Privacy Guarantees

Legacy proctoring platforms deploy invasive endpoint agents that record video streams, monitor biometric eye movements, and log system keystrokes. VeriMind AI completely eliminates client-side surveillance:

- **No Biometric Ingestion:** Zero video, facial scanning, audio recording of rooms, or gaze tracking.
- **No Keystroke Surveillance:** No low-level kernel hooks, keyboard timing loggers, or background process inspectors.
- **Intake Boundary PII Redaction:** All incoming source code or text passes through `privacy.py`, removing emails, student identification tokens, IP addresses, and candidate names before processing.

---

## 2. FERPA & GDPR Alignment

VeriMind AI is designed to satisfy strict institutional compliance requirements:

1. **Data Minimization:** Only abstract syntax trees (ASTs) and conceptual semantic vectors are retained.
2. **Local Edge Execution:** When cloud API credentials are not supplied, VeriMind runs fully deterministically on edge models (`sentence-transformers/all-MiniLM-L6-v2`), ensuring zero student artifacts leave the campus server boundary.
3. **Right to Explanation:** Every authenticity score is accompanied by an 8-factor attribution breakdown explaining the verdict.

---

## 3. Cryptographic Tamper-Proofing & Ledger Integrity

Each completed evaluation produces a verifiable proof-of-understanding passport:

- **Canonical JSON Hashing:** Session metadata, rubric scores, and attributions are serialized canonically and hashed via SHA-256.
- **1-Bit Mutation Sensitivity:** Any modification to a candidate's score or timestamp alters the digest, immediately triggering verification rejection in the live SQLite ledger audit trail.
- **Public Recruiter Verification:** Registrars and hiring managers can query `POST /api/verify` or Tab 04 with a candidate's hash to confirm authenticity without accessing raw student dossiers.

---

## 4. Adversarial Red-Team Stress Testing

VeriMind AI undergoes continuous adversarial validation across 120 synthetic attack vectors:

- **Lexical Perturbations:** Variable substitution, identifier obfuscation, and dead-code injection.
- **Extreme Noise Attacks:** Unstructured grammar mutations, non-native English syntactical irregularities, and punctuation noise.
- **Boundary Validation:** Empty inputs, 10⁶ scale parameters, and recursive nesting attacks.

---

## 5. Vulnerability Reporting

If you identify a security issue or potential cryptographic vulnerability in VeriMind AI, please open a private security advisory on GitHub or contact the maintainers directly.
