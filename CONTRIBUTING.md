# Contributing to VeriMind AI

Thank you for your interest in contributing to VeriMind AI! We welcome bug fixes, documentation enhancements, and feature contributions from the community.

---

## Development Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/fokrulanthro16-eng/verimind-ai.git
   cd verimind-ai
   ```

2. **Backend Setup (FastAPI):**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```

3. **Frontend Setup (Next.js):**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## Testing & Verification

Run the automated test suite before opening a Pull Request:

```bash
cd backend
python test_b2b_live.py
python test_smoke.py
```

Ensure all tests pass with zero warnings.

---

## Pull Request Guidelines

- Branch naming: `feat/feature-name` or `fix/issue-description`.
- Keep commits focused with descriptive commit messages.
- Do not check in `.env`, `.db`, `*.joblib`, or `.mp4` artifacts.
