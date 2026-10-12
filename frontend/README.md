# 💻 Civic Alert — Frontend Web Application & Portal

This directory contains the **Next.js 16** full-stack web application for **Civic Alert**, providing a citizen-facing complaint portal, real-time grievance tracking, and an administrative municipal triage dashboard.

> 💡 **Looking for the complete system architecture, AI model training details, and root documentation?**  
> Check out the [Main Project README](../README.md).

---

## 📑 Table of Contents
1. [Overview](#-overview)
2. [Key Pages & User Flows](#-key-pages--user-flows)
   - [Citizen Submission Portal (`/`)](#1-citizen-submission-portal-)
   - [Grievance Tracker (`/track`)](#2-grievance-tracker-track)
   - [Admin Operations Console (`/admin`)](#3-admin-operations-console-admin)
3. [Technology Stack](#-technology-stack)
4. [Communication with AI Microservice](#-communication-with-ai-microservice)
5. [Database Integration (Prisma & Neon PostgreSQL)](#-database-integration-prisma--neon-postgresql)
6. [Local Setup & Development](#-local-setup--development)
7. [Environment Variables](#-environment-variables)
8. [Available NPM Commands](#-available-npm-commands)

---

## 🌟 Overview

The frontend serves as the bridge between ordinary citizens reporting real-world civic emergencies and the municipal response teams. 

When a citizen submits an issue, this Next.js app communicates synchronously with the local Python Flask AI microservice, extracts machine-learning priority classifications, explains the decision via safety keywords, stores the enriched record in PostgreSQL via Prisma, and returns immediate visual feedback.

---

## 🧭 Key Pages & User Flows

### 1. Citizen Submission Portal (`/`)
- **File**: `src/app/page.tsx`
- **Functionality**:
  - Citizens input the issue category (Road, Electricity, Water, Drainage, etc.), location, name, and free-text grievance description.
  - Submits to `POST /api/complaints`.
  - Instantly displays an AI triage report:
    - **Priority Badge**: Critical (Red), High (Orange), Medium (Yellow), Low (Green).
    - **Confidence Score**: Calibrated probability from the AI engine.
    - **Explainability List**: Keywords detected (e.g. *"Life-danger word: 'sparking' (+6)"*).
    - **Tracking ID**: One-click copy token for future status checks.

### 2. Grievance Tracker (`/track`)
- **File**: `src/app/track/page.tsx`
- **Functionality**:
  - Citizens can enter any Complaint ID or visit via direct link (`/track?id=12`).
  - Displays a 3-step progress bar:
    - 🔵 **Submitted**: Successfully ingested and triaged.
    - 🟠 **In Progress**: Municipal officer dispatched or reviewing.
    - 🟢 **Resolved**: Hazard repaired and closed.

### 3. Admin Operations Console (`/admin`)
- **Files**: `src/app/admin/login/page.tsx`, `src/app/admin/dashboard/page.tsx`
- **Functionality**:
  - **Auth**: Protected by NextAuth credentials session and bcrypt comparison against the `Admin` database table.
  - **Triage Queue**: Automatically orders all grievances so that **Critical** and **High** issues are at the very top.
  - **Filtering**: Instant filtering by Status (`Submitted`, `In Progress`, `Resolved`), Priority, and Category.
  - **Action Controls**: One-click dropdown to update complaint progress.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router, Server & Client Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **ORM**: Prisma Client v6.19
- **Database**: PostgreSQL (Cloud-hosted via Neon.tech)
- **Auth**: NextAuth v5 (Beta) + bcryptjs

---

## 🔄 Communication with AI Microservice

When a complaint is submitted to Next.js (`POST /api/complaints`):

```typescript
// Next.js forwards raw text to Python Flask (Port 5000)
const flaskRes = await fetch("http://127.0.0.1:5000/predict-priority", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ complaint_text: complaintText }),
  signal: AbortSignal.timeout(10000),
});
```

- **Resilience**: If the Python service is offline, the Next.js API gracefully defaults to `"Medium"` priority so citizen submissions are never lost.

---

## 🗄️ Database Integration (Prisma & Neon PostgreSQL)

The database schema has two core models:
1. `Complaint`: Stores grievance description, category, location, priority level, AI confidence, detected keywords (`reasons`), rule override flag (`ruleRaised`), and current status.
2. `Admin`: Stores municipal officer credentials (email, bcrypt password).

---

## 🚀 Local Setup & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Set your Neon PostgreSQL database URL:
```env
DATABASE_URL="postgresql://<user>:<password>@<neon-host>/neondb?sslmode=require"
NEXTAUTH_SECRET="civic-alert-secret-key-32-chars-minimum"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Initialize Database
```bash
# Push schema changes to Neon DB
npx prisma db push

# Seed default admin user & demo complaints
npx prisma db seed
```

### 4. Run Development Server
```bash
npm run dev
```

Visit the app:
- **Citizen Portal**: [http://localhost:3000](http://localhost:3000)
- **Complaint Tracker**: [http://localhost:3000/track](http://localhost:3000/track)
- **Admin Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 📜 Available NPM Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Next.js development server at port 3000 |
| `npm run build` | Compiles production bundle |
| `npm run start` | Runs production server |
| `npm run db:push` | Syncs schema with PostgreSQL without generating migrations |
| `npm run db:seed` | Runs seed script (`prisma/seed.ts`) to populate default data |
| `npm run db:studio` | Launches visual Prisma Studio GUI in browser |
| `npm run lint` | Runs ESLint validation |
