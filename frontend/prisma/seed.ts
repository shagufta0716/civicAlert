/**
 * Prisma seed script
 * Run: npx prisma db seed
 * Creates default admin account and sample complaints
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create default admin account
  const hashedPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.admin.upsert({
    where: { email: "admin@civic.gov" },
    update: {},
    create: {
      email: "admin@civic.gov",
      password: hashedPassword,
      name: "Municipal Administrator",
    },
  });
  console.log(`Admin created: ${admin.email}`);

  // Create sample complaints
  const sampleComplaints = [
    {
      complaintText:
        "There is an open manhole in the middle of the road near the market area, anyone could fall in at night.",
      category: "Road",
      location: "Ranchi - Main Market",
      priority: "Critical",
      confidence: 0.97,
      status: "Submitted",
      submittedBy: "Ramesh Kumar",
    },
    {
      complaintText:
        "A high tension wire has fallen on the road near the school, it is extremely dangerous for students.",
      category: "Electricity",
      location: "Jamshedpur - School Road",
      priority: "Critical",
      confidence: 0.95,
      status: "In Progress",
      submittedBy: "Sunita Devi",
    },
    {
      complaintText:
        "The drainage is blocked and dirty water is flooding our homes for the past 3 days.",
      category: "Drainage",
      location: "Dhanbad - Ward 5",
      priority: "High",
      confidence: 0.89,
      status: "Submitted",
      submittedBy: "Amit Singh",
    },
    {
      complaintText:
        "Garbage has not been collected for 10 days, there is a bad smell throughout the colony.",
      category: "Garbage",
      location: "Bokaro - Sector 4",
      priority: "High",
      confidence: 0.88,
      status: "Resolved",
      submittedBy: "Priya Sharma",
    },
    {
      complaintText:
        "The road has small potholes that need to be repaired before the monsoon gets worse.",
      category: "Road",
      location: "Hazaribagh - NH-33",
      priority: "Medium",
      confidence: 0.82,
      status: "Submitted",
      submittedBy: "Vikram Mahato",
    },
    {
      complaintText:
        "Streetlight at the corner has been dim for a week and could be replaced.",
      category: "Electricity",
      location: "Deoghar - Naya Bazar",
      priority: "Low",
      confidence: 0.91,
      status: "Submitted",
      submittedBy: "Geeta Yadav",
    },
  ];

  for (const complaint of sampleComplaints) {
    await prisma.complaint.create({ data: complaint });
  }

  console.log(`Created ${sampleComplaints.length} sample complaints.`);
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
