"""
CivicAlert - Model Training (v2)
=================================
Run:    python train_model.py
Needs:  complaints.csv (training data), test_set.csv (hand-written test data)
Output: priority_model.pkl, vectorizer.pkl  (same names app.py already loads)
        metrics.json                        (numbers for your report)

What is different from v1?
  1. Model is chosen using GROUPED cross-validation on the training data
     (whole issue types are held out), so memorising sentences does not help.
  2. The final score is measured ONCE on test_set.csv, which the generator
     never saw. Only this number goes in your report as "accuracy".
  3. Reports macro-F1 and a confusion matrix, not just accuracy.
  4. Word + character n-grams, so Hinglish spellings and typos still work.
"""

import json
import pickle
import warnings

import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, classification_report,
                             confusion_matrix, f1_score)
from sklearn.model_selection import GroupKFold, cross_val_predict
from sklearn.pipeline import Pipeline, make_union
from sklearn.svm import LinearSVC

warnings.filterwarnings("ignore")

LABELS = ["Low", "Medium", "High", "Critical"]

# ------------------------------------------------------------------ data
train = pd.read_csv("complaints.csv")
test = pd.read_csv("test_set.csv")
print(f"Training rows: {len(train)} | Test rows (hand-written): {len(test)}")
print("Train labels:", train.priority.value_counts().to_dict())

X_tr, y_tr = train["complaint_text"], train["priority"]
X_te, y_te = test["complaint_text"], test["priority"]
groups = train["issue_id"]          # one group per issue type


# ------------------------------------------------------------ candidates
def word_vec():
    return TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True)


def word_char_vec():
    return make_union(
        TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True),
        TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5),
                        sublinear_tf=True),
    )


CANDIDATES = {
    "LogReg + word":        (word_vec,      lambda: LogisticRegression(max_iter=2000, C=5)),
    "LogReg + word+char":   (word_char_vec, lambda: LogisticRegression(max_iter=2000, C=5)),
    # LinearSVC has no predict_proba, so wrap it (app.py needs confidence)
    "LinearSVC + word+char": (word_char_vec,
                              lambda: CalibratedClassifierCV(LinearSVC(C=0.5), cv=3)),
}

# ------------------------------------- model selection (training data only)
print("\n=== Grouped 5-fold CV on training data (unseen issue types) ===")
cv_scores = {}
for name, (vec_f, clf_f) in CANDIDATES.items():
    pipe = Pipeline([("vec", vec_f()), ("clf", clf_f())])
    pred = cross_val_predict(pipe, X_tr, y_tr, groups=groups,
                             cv=GroupKFold(n_splits=5))
    f1 = f1_score(y_tr, pred, average="macro")
    acc = accuracy_score(y_tr, pred)
    cv_scores[name] = {"macro_f1": round(f1, 3), "accuracy": round(acc, 3)}
    print(f"{name:24s} macro-F1={f1:.3f}  accuracy={acc:.3f}")

best_name = max(cv_scores, key=lambda n: cv_scores[n]["macro_f1"])
print(f"\nSelected model: {best_name}")

# ------------------------------------------- final fit + ONE test-set check
vec_f, clf_f = CANDIDATES[best_name]
vectorizer = vec_f()
model = clf_f()
Xv = vectorizer.fit_transform(X_tr)
model.fit(Xv, y_tr)

pred_te = model.predict(vectorizer.transform(X_te))
acc = accuracy_score(y_te, pred_te)
macro_f1 = f1_score(y_te, pred_te, average="macro")

print("\n=== FINAL RESULT on hand-written test_set.csv ===")
print(f"Accuracy : {acc * 100:.1f}%")
print(f"Macro-F1 : {macro_f1:.3f}\n")
print(classification_report(y_te, pred_te, labels=LABELS, zero_division=0))

cm = confusion_matrix(y_te, pred_te, labels=LABELS)
print("Confusion matrix (rows = actual, columns = predicted)")
print(pd.DataFrame(cm, index=[f"actual {l}" for l in LABELS],
                   columns=[f"pred {l}" for l in LABELS]))

# Dangerous mistakes = a High/Critical complaint predicted as Medium/Low
risky = ((y_te.isin(["High", "Critical"])) &
         (pd.Series(pred_te, index=y_te.index).isin(["Low", "Medium"])))
print(f"\nDangerous under-predictions (High/Critical -> Low/Medium): "
      f"{int(risky.sum())} of {int(y_te.isin(['High', 'Critical']).sum())}")
if risky.any():
    print("These are the complaints the keyword scorer (Step 4) must rescue:")
    for t, a, p in zip(X_te[risky], y_te[risky], pd.Series(pred_te, index=y_te.index)[risky]):
        print(f"  [{a} -> {p}] {t}")

# ------------------------------------------------------------------ save
with open("priority_model.pkl", "wb") as f:
    pickle.dump(model, f)
with open("vectorizer.pkl", "wb") as f:
    pickle.dump(vectorizer, f)

with open("metrics.json", "w") as f:
    json.dump({
        "selected_model": best_name,
        "grouped_cv_on_train": cv_scores,
        "test_set": {"accuracy": round(acc, 3), "macro_f1": round(macro_f1, 3),
                     "n": int(len(test))},
        "confusion_matrix_labels": LABELS,
        "confusion_matrix": cm.tolist(),
    }, f, indent=2)

print("\nSaved: priority_model.pkl, vectorizer.pkl, metrics.json")

# --------------------------------------------------------- quick sanity
for t in ["Electric pole is sparking near the market, kids play there",
          "Streetlight is a little dim",
          "Naali ka dhakkan gayab hai school ke saamne"]:
    p = model.predict(vectorizer.transform([t]))[0]
    print(f"  {p:9s} <- {t}")
