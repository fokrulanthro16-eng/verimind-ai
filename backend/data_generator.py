import numpy as np
import pandas as pd
from pathlib import Path
from config import BENCHMARK_PATH, DATA_DIR


def generate_defense_benchmark_dataset(
    output_path: Path = BENCHMARK_PATH,
    samples_per_archetype: int = 100,
    random_state: int = 42
) -> pd.DataFrame:
    """
    Generates a deterministic, reproducible 400-sample Domain-Grounded Adversarial
    Defense Dataset balanced across 4 key student archetypes.
    """
    np.random.seed(random_state)
    records = []

    # 1. GENUINE BUILDER (Label = 1)
    # Mastered the logic, writes natural clear English, steady latency, high line specificity
    for _ in range(samples_per_archetype):
        rec = {
            "archetype": "genuine_builder",
            "label": 1,
            "concept_alignment_score": float(np.clip(np.random.normal(0.89, 0.05), 0.75, 0.99)),
            "counterfactual_resilience": float(np.clip(np.random.normal(0.88, 0.06), 0.72, 0.98)),
            "turn_consistency_delta": float(np.clip(np.random.normal(0.91, 0.04), 0.78, 0.99)),
            "response_latency_zscore": float(np.clip(np.random.normal(0.10, 0.35), -1.5, 1.2)),
            "lexical_shift_ratio": float(np.clip(np.random.normal(0.18, 0.05), 0.05, 0.35)),
            "code_complexity_index": float(np.clip(np.random.normal(0.60, 0.15), 0.25, 0.95)),
            "specificity_ratio": float(np.clip(np.random.normal(0.85, 0.06), 0.68, 0.98)),
            "grammar_noise_index": float(np.clip(np.random.normal(0.12, 0.05), 0.01, 0.28)),
        }
        records.append(rec)

    # 2. NON-NATIVE EXPERT (Label = 1) - FAIRNESS CRITICAL
    # Real mastery and high code specificity, but HIGH grammar/syntax irregularity
    for _ in range(samples_per_archetype):
        rec = {
            "archetype": "non_native_expert",
            "label": 1,
            "concept_alignment_score": float(np.clip(np.random.normal(0.87, 0.05), 0.74, 0.98)),
            "counterfactual_resilience": float(np.clip(np.random.normal(0.86, 0.06), 0.70, 0.97)),
            "turn_consistency_delta": float(np.clip(np.random.normal(0.89, 0.05), 0.75, 0.98)),
            "response_latency_zscore": float(np.clip(np.random.normal(0.20, 0.40), -1.2, 1.5)),
            "lexical_shift_ratio": float(np.clip(np.random.normal(0.20, 0.06), 0.08, 0.38)),
            "code_complexity_index": float(np.clip(np.random.normal(0.62, 0.14), 0.25, 0.95)),
            "specificity_ratio": float(np.clip(np.random.normal(0.86, 0.06), 0.70, 0.99)),
            "grammar_noise_index": float(np.clip(np.random.normal(0.72, 0.09), 0.55, 0.94)),
        }
        records.append(rec)

    # 3. SURFACE AI-ASSISTED (Label = 0)
    # Uses AI to generate code; can explain surface syntax but falters on perturbation
    for _ in range(samples_per_archetype):
        rec = {
            "archetype": "surface_ai_assisted",
            "label": 0,
            "concept_alignment_score": float(np.clip(np.random.normal(0.58, 0.07), 0.42, 0.72)),
            "counterfactual_resilience": float(np.clip(np.random.normal(0.32, 0.07), 0.12, 0.48)),
            "turn_consistency_delta": float(np.clip(np.random.normal(0.48, 0.08), 0.28, 0.65)),
            "response_latency_zscore": float(np.clip(np.random.normal(1.20, 0.50), 0.20, 2.4)),
            "lexical_shift_ratio": float(np.clip(np.random.normal(0.68, 0.08), 0.48, 0.88)),
            "code_complexity_index": float(np.clip(np.random.normal(0.65, 0.12), 0.35, 0.95)),
            "specificity_ratio": float(np.clip(np.random.normal(0.40, 0.07), 0.22, 0.55)),
            "grammar_noise_index": float(np.clip(np.random.normal(0.14, 0.05), 0.02, 0.28)),
        }
        records.append(rec)

    # 4. BLIND COPY-PASTE (Label = 0)
    # Copied code without understanding; cannot answer perturbation or mechanism probes
    for _ in range(samples_per_archetype):
        rec = {
            "archetype": "blind_copy_paste",
            "label": 0,
            "concept_alignment_score": float(np.clip(np.random.normal(0.24, 0.06), 0.08, 0.40)),
            "counterfactual_resilience": float(np.clip(np.random.normal(0.15, 0.05), 0.02, 0.30)),
            "turn_consistency_delta": float(np.clip(np.random.normal(0.22, 0.06), 0.05, 0.38)),
            "response_latency_zscore": float(np.clip(np.random.normal(2.10, 0.45), 1.0, 3.0)),
            "lexical_shift_ratio": float(np.clip(np.random.normal(0.82, 0.06), 0.65, 0.98)),
            "code_complexity_index": float(np.clip(np.random.normal(0.70, 0.12), 0.40, 0.98)),
            "specificity_ratio": float(np.clip(np.random.normal(0.18, 0.06), 0.02, 0.32)),
            "grammar_noise_index": float(np.clip(np.random.normal(0.10, 0.04), 0.01, 0.22)),
        }
        records.append(rec)

    df = pd.DataFrame(records)
    # Shuffle with fixed seed
    df = df.sample(frac=1.0, random_state=random_state).reset_index(drop=True)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    return df


if __name__ == "__main__":
    df = generate_defense_benchmark_dataset()
    print(f"Generated benchmark dataset at {BENCHMARK_PATH} with {len(df)} samples.")
    print("Class distribution:", df["label"].value_counts().to_dict())
    print("Archetype distribution:", df["archetype"].value_counts().to_dict())
