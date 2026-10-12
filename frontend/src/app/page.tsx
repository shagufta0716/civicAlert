"use client";

import { useState } from "react";
import {
  MapPin,
  User,
  FileText,
  Tag,
  CheckCircle,
  Loader2,
  AlertCircle,
  Copy,
  ArrowRight,
} from "lucide-react";
import PriorityBadge from "@/components/PriorityBadge";
import Link from "next/link";

const CATEGORIES = [
  "Road",
  "Electricity",
  "Water",
  "Garbage",
  "Drainage",
  "Public Property",
  "Gas Leak",
  "Building Safety",
  "Other",
];

type Submission = {
  id: number;
  priority: string;
  confidence: number;
  status: string;
  reasons: string | null;
  ruleRaised: boolean;
};

function parseReasons(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function SubmitComplaintPage() {
  const [form, setForm] = useState({
    complaintText: "",
    category: "",
    location: "",
    submittedBy: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [copied, setCopied] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.complaintText.trim() || !form.location.trim()) {
      setError("Please describe your problem and provide a location.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed.");

      setSubmission({
        id: data.id,
        priority: data.priority,
        confidence: data.confidence,
        status: data.status,
        reasons: data.reasons ?? null,
        ruleRaised: Boolean(data.ruleRaised),
      });
      setForm({ complaintText: "", category: "", location: "", submittedBy: "" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const copyId = () => {
    if (submission) {
      navigator.clipboard.writeText(String(submission.id));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const priorityDesc: Record<string, string> = {
    Critical: "Immediate attention required. Municipal team will respond within hours.",
    High: "High urgency. Expected resolution within 1–2 days.",
    Medium: "Moderate urgency. Expected resolution within 3–5 days.",
    Low: "Low urgency. Scheduled for next maintenance cycle.",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          File a Civic Complaint
        </h1>
        <p className="text-gray-500 text-lg">
          Describe your issue and our AI will instantly assign a priority level.
          Your complaint will be forwarded to the concerned municipal department.
        </p>
      </div>

      {/* Success Confirmation */}
      {submission && (
        <div className="mb-8 rounded-2xl border-2 border-green-200 bg-green-50 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <CheckCircle className="h-7 w-7 text-green-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-green-800 mb-1">
                Complaint Submitted Successfully!
              </h2>
              <p className="text-green-700 text-sm mb-4">
                Your complaint has been registered and AI-prioritized.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Tracking ID */}
                <div className="bg-white rounded-xl border border-green-200 p-4">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
                    Tracking ID
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      #{submission.id}
                    </span>
                    <button
                      onClick={copyId}
                      className="text-gray-400 hover:text-gray-600"
                      title="Copy ID"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    {copied && (
                      <span className="text-xs text-green-600">Copied!</span>
                    )}
                  </div>
                </div>

                {/* AI Priority */}
                <div className="bg-white rounded-xl border border-green-200 p-4">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
                    AI Priority
                  </p>
                  <PriorityBadge priority={submission.priority} size="lg" />
                  {submission.ruleRaised ? (
                    <p className="text-xs text-orange-600 font-medium mt-1">
                      Raised by safety rules
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      Confidence: {Math.round(submission.confidence * 100)}%
                    </p>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 bg-white rounded-lg border border-green-200 p-3">
                {priorityDesc[submission.priority]}
              </p>

              {parseReasons(submission.reasons).length > 0 && (
                <div className="text-xs text-gray-600 mb-4 bg-white rounded-lg border border-green-200 p-3">
                  <p className="font-medium text-gray-700 mb-1">Why this priority?</p>
                  <ul className="list-disc ml-4 space-y-0.5">
                    {parseReasons(submission.reasons).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3">
                <Link
                  href={`/track?id=${submission.id}`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  Track Complaint <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => setSubmission(null)}
                  className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  Submit Another
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {!submission && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Complaint Text */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <FileText className="h-4 w-4 text-blue-500" />
                Describe your problem <span className="text-red-500">*</span>
              </label>
              <textarea
                name="complaintText"
                value={form.complaintText}
                onChange={handleChange}
                rows={5}
                placeholder="E.g.: There is a large pothole on the main road near the hospital gate. Two bikes have already skidded because of it..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 resize-none"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Be as descriptive as possible — better descriptions lead to more accurate AI priority.
              </p>
            </div>

            {/* Category & Location Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Tag className="h-4 w-4 text-blue-500" />
                  Category <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  Location / Area <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="E.g.: Ranchi — Main Road, Ward 12"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  required
                />
              </div>
            </div>

            {/* Name / Contact */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <User className="h-4 w-4 text-blue-500" />
                Your name / contact{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                name="submittedBy"
                value={form.submittedBy}
                onChange={handleChange}
                placeholder="E.g.: Ramesh Kumar, 9876543210"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-base rounded-xl shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  Submit Complaint
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* How it works */}
      <div className="mt-10 grid grid-cols-3 gap-4 text-center">
        {[
          { step: "1", title: "Describe", desc: "Write your civic problem in detail" },
          { step: "2", title: "AI Prioritizes", desc: "Our model classifies urgency instantly" },
          { step: "3", title: "Track", desc: "Follow resolution status with your ID" },
        ].map(({ step, title, desc }) => (
          <div key={step} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-2">
              {step}
            </div>
            <p className="font-semibold text-gray-800 text-sm">{title}</p>
            <p className="text-xs text-gray-500 mt-1">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
