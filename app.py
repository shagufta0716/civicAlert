"""
Civic Alert - Flask AI Priority Prediction API
================================================
Endpoints:
  GET  /                     - Health check
  POST /predict-priority     - Main endpoint (used by Next.js)
  POST /api/predict          - Legacy endpoint (backwards compat)
  GET  /api/complaints       - List complaints from CSV

Run: python app.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import pandas as pd
import numpy as np
import os

from severity_rules import score_complaint, combine

app = Flask(__name__)
CORS(app)

# Load trained AI model and vectorizer
MODEL_FILE = "priority_model.pkl"
VECTORIZER_FILE = "vectorizer.pkl"
COMPLAINTS_FILE = "complaints.csv"

model = None
vectorizer = None

if os.path.exists(MODEL_FILE) and os.path.exists(VECTORIZER_FILE):
    with open(MODEL_FILE, "rb") as f:
        model = pickle.load(f)
    with open(VECTORIZER_FILE, "rb") as f:
        vectorizer = pickle.load(f)
    print("AI Model and Vectorizer loaded successfully.")
else:
    print("Warning: Model files not found. Run train_model.py first.")


def get_prediction(text: str):
    """
    Hybrid prediction = AI model + keyword rules.
    Final priority = the HIGHER of (model prediction, rule floor).
    Returns a dict with everything the website / admin may want to show.
    """
    text_vector = vectorizer.transform([text])
    model_priority = model.predict(text_vector)[0]
    probabilities = model.predict_proba(text_vector)[0]
    classes = list(model.classes_)
    model_confidence = float(np.max(probabilities))

    rules = score_complaint(text)
    final = combine(model_priority, rules["floor"])
    raised_by_rules = final != model_priority

    # Confidence: if the model's own answer stands, show the model's confidence.
    # If the rules raised it, show how much probability the MODEL gave that class.
    confidence = (float(probabilities[classes.index(final)])
                  if raised_by_rules else model_confidence)

    return {
        "priority": final,
        "confidence": confidence,
        "model_priority": model_priority,
        "model_confidence": model_confidence,
        "rule_score": rules["score"],
        "reasons": rules["reasons"],
        "raised_by_rules": raised_by_rules,
    }


@app.route("/", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "Civic Alert Flask API",
        "model_loaded": model is not None and vectorizer is not None,
        "endpoints": [
            "POST /predict-priority",
            "POST /api/predict",
            "GET  /api/complaints"
        ]
    })


@app.route("/predict-priority", methods=["POST"])
def predict_priority_main():
    """
    Main endpoint used by Next.js.
    Request:  { "complaint_text": "..." }
    Response: { "complaint_text": "...", "predicted_priority": "Critical|High|Medium|Low", "confidence": 0.97,
               "model_priority": "...", "rule_score": 8, "reasons": [...], "raised_by_rules": true }
    """
    if model is None or vectorizer is None:
        return jsonify({"error": "Model not loaded. Run train_model.py first."}), 500

    data = request.get_json(silent=True) or {}
    text = data.get("complaint_text", "").strip()

    if not text:
        return jsonify({"error": "Field 'complaint_text' is required."}), 400

    r = get_prediction(text)

    return jsonify({
        "complaint_text": text,
        "predicted_priority": r["priority"],
        "confidence": round(r["confidence"], 4),
        # extra fields (the website can ignore them for now)
        "model_priority": r["model_priority"],
        "model_confidence": round(r["model_confidence"], 4),
        "rule_score": r["rule_score"],
        "reasons": r["reasons"],
        "raised_by_rules": r["raised_by_rules"],
    })


@app.route("/api/predict", methods=["POST"])
def predict_legacy():
    """Legacy endpoint for backwards compatibility."""
    if model is None or vectorizer is None:
        return jsonify({"error": "Model not loaded. Run train_model.py first."}), 500

    data = request.get_json(silent=True) or {}
    # Support both 'text' (old) and 'complaint_text' (new)
    text = (data.get("text") or data.get("complaint_text") or "").strip()

    if not text:
        return jsonify({"error": "Field 'text' or 'complaint_text' is required."}), 400

    r = get_prediction(text)

    return jsonify({
        "complaint_text": text,
        "priority": r["priority"],
        "predicted_priority": r["priority"],
        "confidence": round(r["confidence"], 4),
        "reasons": r["reasons"],
    })


@app.route("/api/complaints", methods=["GET"])
def get_complaints():
    if not os.path.exists(COMPLAINTS_FILE):
        return jsonify({"error": "complaints.csv not found."}), 404

    df = pd.read_csv(COMPLAINTS_FILE)
    limit = request.args.get("limit", default=50, type=int)
    records = df.head(limit).to_dict(orient="records")
    return jsonify({
        "total": len(df),
        "count": len(records),
        "complaints": records
    })


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
