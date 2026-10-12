"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  AlertTriangle,
  LogOut,
  RefreshCw,
  Filter,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Tag,
  Calendar,
} from "lucide-react";
import PriorityBadge from "@/components/PriorityBadge";

type Complaint = {
  id: number;
  complaintText: string;
  category: string | null;
  location: string;
  priority: string;
  confidence: number;
  reasons: string | null;
  ruleRaised: boolean;
  status: string;
  submittedBy: string | null;
  createdAt: string;
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

const STATUSES = ["Submitted", "In Progress", "Resolved"];
const PRIORITIES = ["Critical", "High", "Medium", "Low"];
const CATEGORIES = [
  "Road", "Electricity", "Water", "Garbage", "Drainage",
  "Public Property", "Gas Leak", "Building Safety", "Other",
];

const statusIcon: Record<string, React.ReactNode> = {
  Submitted: <Clock className="h-3.5 w-3.5" />,
  "In Progress": <AlertCircle className="h-3.5 w-3.5" />,
  Resolved: <CheckCircle2 className="h-3.5 w-3.5" />,
};

const statusColor: Record<string, string> = {
  Submitted: "bg-blue-100 text-blue-700 border-blue-200",
  "In Progress": "bg-orange-100 text-orange-700 border-orange-200",
  Resolved: "bg-green-100 text-green-700 border-green-200",
};

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin/login");
  }, [status, router]);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterPriority) params.set("priority", filterPriority);
    if (filterStatus) params.set("status", filterStatus);
    if (filterCategory) params.set("category", filterCategory);
    try {
      const res = await fetch(`/api/complaints?${params}`);
      const data = await res.json();
      setComplaints(Array.isArray(data) ? data : []);
    } catch {
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [filterPriority, filterStatus, filterCategory]);

  useEffect(() => {
    if (status === "authenticated") fetchComplaints();
  }, [status, fetchComplaints]);

  const updateStatus = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    try {
      await fetch(`/api/complaints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Count metrics
  const total = complaints.length;
  const critical = complaints.filter((c) => c.priority === "Critical").length;
  const inProgress = complaints.filter((c) => c.status === "In Progress").length;
  const resolved = complaints.filter((c) => c.status === "Resolved").length;

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-blue-700 p-2.5 rounded-xl">
            <AlertTriangle className="h-6 w-6 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Municipal Dashboard</h1>
            <p className="text-sm text-gray-500">
              Welcome, {session?.user?.name ?? "Administrator"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchComplaints}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Complaints", value: total, color: "text-gray-700", bg: "bg-gray-100" },
          { label: "Critical Priority", value: critical, color: "text-red-700", bg: "bg-red-100" },
          { label: "In Progress", value: inProgress, color: "text-orange-700", bg: "bg-orange-100" },
          { label: "Resolved", value: resolved, color: "text-green-700", bg: "bg-green-100" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className={`text-3xl font-bold ${color} mb-1`}>{value}</div>
            <div className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block ${bg} ${color}`}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap items-center gap-3 shadow-sm">
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
          <Filter className="h-4 w-4" /> Filters:
        </div>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {(filterPriority || filterStatus || filterCategory) && (
          <button
            onClick={() => { setFilterPriority(""); setFilterStatus(""); setFilterCategory(""); }}
            className="text-xs text-gray-500 hover:text-red-500 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No complaints found.</p>
          <p className="text-sm mt-1">
            {filterPriority || filterStatus || filterCategory
              ? "Try adjusting your filters."
              : "Submit a complaint from the citizen portal to see it here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((complaint) => (
            <div
              key={complaint.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-gray-400">
                      #{complaint.id}
                    </span>
                    <PriorityBadge priority={complaint.priority} size="sm" />
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${
                        statusColor[complaint.status] ?? "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {statusIcon[complaint.status]}
                      {complaint.status}
                    </span>
                    {complaint.ruleRaised ? (
                      <span className="text-xs text-orange-600 font-medium ml-auto">
                        Raised by safety rules
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 ml-auto">
                        AI Confidence: {Math.round(complaint.confidence * 100)}%
                      </span>
                    )}
                  </div>

                  <p className="text-gray-800 text-sm leading-relaxed line-clamp-2 mb-3">
                    {complaint.complaintText}
                  </p>

                  {parseReasons(complaint.reasons).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {parseReasons(complaint.reasons).map((r, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 border border-gray-200"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    {complaint.category && (
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" /> {complaint.category}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {complaint.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(complaint.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                    {complaint.submittedBy && (
                      <span className="text-gray-500">by {complaint.submittedBy}</span>
                    )}
                  </div>
                </div>

                {/* Status Update */}
                <div className="shrink-0 flex items-center gap-2">
                  {updatingId === complaint.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  ) : null}
                  <select
                    value={complaint.status}
                    onChange={(e) => updateStatus(complaint.id, e.target.value)}
                    disabled={updatingId === complaint.id}
                    className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center mt-8">
        Sorted by priority (Critical → High → Medium → Low), then newest first.
      </p>
    </div>
  );
}
