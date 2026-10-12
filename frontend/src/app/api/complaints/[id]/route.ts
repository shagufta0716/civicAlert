import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// GET /api/complaints/[id] — Fetch single complaint
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const complaint = await prisma.complaint.findUnique({
      where: { id: parseInt(id) },
    });

    if (!complaint) {
      return NextResponse.json(
        { error: "Complaint not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(complaint);
  } catch (error) {
    console.error("GET /api/complaints/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch complaint." },
      { status: 500 }
    );
  }
}

// PATCH /api/complaints/[id] — Update complaint status
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const allowed = ["Submitted", "In Progress", "Resolved"];
    if (!status || !allowed.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${allowed.join(", ")}` },
        { status: 400 }
      );
    }

    const complaint = await prisma.complaint.update({
      where: { id: parseInt(id) },
      data: { status },
    });

    return NextResponse.json(complaint);
  } catch (error) {
    console.error("PATCH /api/complaints/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update complaint." },
      { status: 500 }
    );
  }
}
