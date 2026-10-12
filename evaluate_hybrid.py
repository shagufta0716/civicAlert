"""
CivicAlert - Compare: Model only vs Rules only vs Hybrid (Model + Rules)
=========================================================================
Run:  python evaluate_hybrid.py
Needs: priority_model.pkl, vectorizer.pkl (run train_model.py first),
       severity_rules.py, test_set.csv, test_set2.csv

This table goes straight into your report/presentation.
"""

import pickle
import warnings

import pandas as pd
from sklearn.metrics import accuracy_score, f1_score

from severity_rules import LEVELS, combine, score_complaint

warnings.filterwarnings("ignore")

with open("priority_model.pkl", "rb") as f:
    model = pickle.load(f)
with open("vectorizer.pkl", "rb") as f:
    vectorizer = pickle.load(f)


def evaluate(path, title):
    df = pd.read_csv(path)
    texts, truth = df["complaint_text"], df["priority"]

    model_pred = list(model.predict(vectorizer.transform(texts)))
    rule_info = [score_complaint(t) for t in texts]
    rules_pred = [r["rules_only"] for r in rule_info]
    hybrid_pred = [combine(m, r["floor"]) for m, r in zip(model_pred, rule_info)]

    def danger_misses(pred):
        # actual High/Critical predicted as Low/Medium
        return sum(1 for a, p in zip(truth, pred)
                   if a in ("High", "Critical") and p in ("Low", "Medium"))

    def over_escalations(pred):
        # predicted at least 1 level above the truth
        return sum(1 for a, p in zip(truth, pred)
                   if LEVELS.index(p) > LEVELS.index(a))

    n_danger = int(truth.isin(["High", "Critical"]).sum())
    print(f"\n=== {title} ({len(df)} complaints) ===")
    print(f"{'Approach':<22}{'Accuracy':>10}{'Macro-F1':>10}"
          f"{'Danger missed':>16}{'Over-escalated':>16}")
    for name, pred in [("Model only", model_pred),
                       ("Rules only", rules_pred),
                       ("Hybrid (model+rules)", hybrid_pred)]:
        acc = accuracy_score(truth, pred)
        f1 = f1_score(truth, pred, average="macro", labels=LEVELS)
        print(f"{name:<22}{acc * 100:>9.1f}%{f1:>10.3f}"
              f"{danger_misses(pred):>10} /{n_danger:<4}"
              f"{over_escalations(pred):>10} /{len(df):<4}")

    # Show every complaint the rules changed
    print("\nComplaints where the rules changed the model's answer:")
    changed = False
    for t, a, m, h, r in zip(texts, truth, model_pred, hybrid_pred, rule_info):
        if m != h:
            changed = True
            verdict = "FIXED" if h == a else ("CLOSER" if
                      abs(LEVELS.index(h) - LEVELS.index(a)) <
                      abs(LEVELS.index(m) - LEVELS.index(a)) else "WORSE")
            print(f"  [{verdict}] actual={a}, model={m} -> hybrid={h} | {t}")
    if not changed:
        print("  (none)")


evaluate("test_set.csv", "Test set 1")
evaluate("test_set2.csv", "Test set 2 (written AFTER the rules, never used to tune them)")
