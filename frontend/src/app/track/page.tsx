"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Tag,
  Calendar,
  Loader2,
} from "lucide-react";
import PriorityBadge from "@/components/PriorityBadge";
import Link from "next/link";

type Complaint = {
  id: number;
  complaintText: string;
  category: string | null;
  location: string;
  priority: string;
  confidence: number;
  status: string;
  submittedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  Submitted: {
    icon: <Clock className="h-5 w-5" />,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    label: "Submitted",
  },
  "In Progress": {
    icon: <AlertCircle className="h-5 w-5" />,
    color: "text-orange-600 bg-orange-50 border-orange-200",
    label: "In Progress",
  },
  Resolved: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: "text-green-600 bg-green-50 border-green-200",
    label: "Resolved",
  },
};

function TrackContent() {
  const searchParams = useSearchParams();
  const urlId = searchParams.get("id");

  const [idInput, setIdInput] = useState(urlId ?? "");
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (urlId) fetchComplaint(urlId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlId]);

  const fetchComplaint = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError("");
    setComplaint(null);
    try {
      const res = await fetch(`/api/complaints/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Complaint not found.");
      setComplaint(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch complaint.");
    } finally {
      setLoading(false);
    }
  };

  const steps = ["Submitted", "In Progress", "Resolved"];
  const currentStep = complaint
    ? steps.indexOf(complaint.status)
    : -1;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Track Your Complaint
        </h1>
        <p className="text-gray-500">
          Enter your complaint reference number to see its current status.
        </p>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
        <div className="flex gap-3">
          <input
            type="number"
            value={idInput}
            onChange={(e) => setIdInput(e.target.value)}
            placeholder="Enter complaint ID (e.g. 42)"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            onKeyDown={(e) => e.key === "Enter" && fetchComplaint(idInput)}
          />
          <button
            onClick={() => fetchComplaint(idInput)}
            disabled={loading || !idInput.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
            Track
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-6">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Result */}
      {complaint && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Status Banner */}
          <div
            className={`flex items-center gap-3 px-6 py-4 border-b font-semibold ${
              statusConfig[complaint.status]?.color ?? "text-gray-700 bg-gray-50 border-gray-200"
            }`}
          >
            {statusConfig[complaint.status]?.icon}
            Status: {complaint.status}
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between relative">
              {/* Connector line */}
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 -z-0" />
              <div
                className="absolute top-4 left-4 h-0.5 bg-blue-500 -z-0 transition-all duration-500"
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              />

              {steps.map((step, i) => (
                <div key={step} className="flex flex-col items-center gap-2 relative z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                      i <= currentStep
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-gray-300 text-gray-400"
                    }`}
                  >
                    {i < currentStep ? "✓" : i + 1}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      i <= currentStep ? "text-blue-700" : "text-gray-400"
                    }`}
                  >
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Complaint Details */}
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
                  Complaint #{complaint.id}
                </p>
                <p className="text-gray-800 leading-relaxed">{complaint.complaintText}</p>
              </div>
              <PriorityBadge priority={complaint.priority} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {complaint.category && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Tag className="h-4 w-4 text-gray-400" />
                  {complaint.category}
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400" />
                {complaint.location}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400" />
                {new Date(complaint.createdAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <div className="text-gray-500 text-xs">
                AI Confidence: {Math.round(complaint.confidence * 100)}%
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <Link
              href="/"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Submit another complaint
            </Link>
          </div>
        </div>
      )}

      {!complaint && !loading && !error && (
        <div className="text-center py-12 text-gray-400">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Enter your complaint ID above to track its status.</p>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense>
      <TrackContent />
    </Suspense>
  );
}
