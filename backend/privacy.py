import re
import hashlib
from typing import Dict, Any, List, Tuple


EMAIL_REGEX = re.compile(
    r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"
)
PHONE_REGEX = re.compile(
    r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"
)
STUDENT_ID_REGEX = re.compile(
    r"\b(?:STU|ID|ROLL|STD|REG|SID)[-_#:\s]*[A-Za-z0-9]{4,12}\b",
    re.IGNORECASE
)
AUTHOR_HEADER_REGEX = re.compile(
    r"(?i)(?:#|\/\/|\*|--)?\s*(?:Author|Student|Name|Submitted\s+by|Created\s+by)\s*[:=]\s*([^\r\n]+)"
)


def redact_pii(text: str, student_label: str = "Student") -> Dict[str, Any]:
    """
    Deterministic regex-based redaction executed BEFORE any LLM call or DB persistence.
    Zero-spyware principle: No raw PII escapes the intake boundary.
    """
    if not text:
        empty_hash = hashlib.sha256(b"anonymous").hexdigest()[:8].upper()
        return {
            "redacted_text": "",
            "student_hash": f"STU-{empty_hash}",
            "pii_entities_redacted": 0,
            "redacted_types": [],
            "privacy_badge": "PII REDACTED · ZERO SPYWARE"
        }

    redacted_types: List[str] = []
    entities_count = 0
    current_text = text

    # 1. Author / Name Header redaction & Student Hash derivation
    detected_author: str = ""
    author_match = AUTHOR_HEADER_REGEX.search(current_text)
    if author_match:
        detected_author = author_match.group(1).strip()
        entities_count += 1
        redacted_types.append("AUTHOR_NAME")

    # Generate a deterministic 8-char SHA-256 student hash
    seed = detected_author if detected_author else (student_label or "Student_Seed_42")
    student_hash_raw = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:8].upper()
    student_hash_tag = f"[STUDENT_HASH_{student_hash_raw}]"

    if author_match:
        # Replace the matched author line preserving header key
        def _replace_author(m):
            prefix = m.group(0).split(":")[0] if ":" in m.group(0) else m.group(0).split("=")[0]
            return f"{prefix}: {student_hash_tag}"
        current_text = AUTHOR_HEADER_REGEX.sub(_replace_author, current_text)

    # 2. Email redaction
    email_matches = EMAIL_REGEX.findall(current_text)
    if email_matches:
        entities_count += len(email_matches)
        redacted_types.append("EMAIL")
        current_text = EMAIL_REGEX.sub("[EMAIL_REDACTED]", current_text)

    # 3. Phone redaction
    phone_matches = PHONE_REGEX.findall(current_text)
    if phone_matches:
        entities_count += len(phone_matches)
        redacted_types.append("PHONE")
        current_text = PHONE_REGEX.sub("[PHONE_REDACTED]", current_text)

    # 4. Student ID / Roll number redaction
    id_matches = STUDENT_ID_REGEX.findall(current_text)
    if id_matches:
        entities_count += len(id_matches)
        redacted_types.append("STUDENT_ID")
        current_text = STUDENT_ID_REGEX.sub("[ID_REDACTED]", current_text)

    return {
        "redacted_text": current_text,
        "student_hash": f"STU-{student_hash_raw}",
        "pii_entities_redacted": entities_count,
        "redacted_types": list(set(redacted_types)),
        "privacy_badge": "PII REDACTED · ZERO SPYWARE"
    }
