import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Priority sort order for DB-level ordering
const PRIORITY_ORDER: Record<string, number> = {
  Critical: 1,
  High: 2,
  Medium: 3,
  Low: 4,
};

// POST /api/complaints — Create a new complaint (called by citizen form)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { complaintText, category, location, submittedBy } = body;

    if (!complaintText || !location) {
      return NextResponse.json(
        { error: "complaintText and location are required." },
        { status: 400 }
      );
    }

    // Step 1: Call Flask AI API to get priority + confidence
    let priority = "Medium";
    let confidence = 0.5;
    let reasons: string[] = [];
    let ruleRaised = false;

    try {
      const flaskRes = await fetch("http://127.0.0.1:5000/predict-priority", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaint_text: complaintText }),
        signal: AbortSignal.timeout(10000),
      });

      if (flaskRes.ok) {
        const flaskData = await flaskRes.json();
        priority = flaskData.predicted_priority ?? "Medium";
        confidence = flaskData.confidence ?? 0.5;
        reasons = Array.isArray(flaskData.reasons) ? flaskData.reasons : [];
        ruleRaised = Boolean(flaskData.raised_by_rules);
      }
    } catch {
      console.warn("Flask API unreachable — defaulting to Medium priority.");
    }

    // Step 2: Save to PostgreSQL
    const complaint = await prisma.complaint.create({
      data: {
        complaintText,
        category: category || null,
        location,
        submittedBy: submittedBy || null,
        priority,
        confidence,
        reasons: reasons.length > 0 ? JSON.stringify(reasons) : null,
        ruleRaised,
        status: "Submitted",
      },
    });

    return NextResponse.json(complaint, { status: 201 });
  } catch (error) {
    console.error("POST /api/complaints error:", error);
    return NextResponse.json(
      { error: "Failed to create complaint." },
      { status: 500 }
    );
  }
}

// GET /api/complaints — List all complaints sorted by priority then date
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filterPriority = searchParams.get("priority");
    const filterStatus = searchParams.get("status");
    const filterCategory = searchParams.get("category");

    const where: Record<string, string> = {};
    if (filterPriority) where.priority = filterPriority;
    if (filterStatus) where.status = filterStatus;
    if (filterCategory) where.category = filterCategory;

    const complaints = await prisma.complaint.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
    });

    // Sort by priority order in JS (Critical first)
    complaints.sort(
      (a, b) =>
        (PRIORITY_ORDER[a.priority] ?? 5) - (PRIORITY_ORDER[b.priority] ?? 5)
    );

    return NextResponse.json(complaints);
  } catch (error) {
    console.error("GET /api/complaints error:", error);
    return NextResponse.json(
      { error: "Failed to fetch complaints." },
      { status: 500 }
    );
  }
}
