# 🚨 Civic Alert — Automated AI Civic Grievance Triage System

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-20232A?style=for-the-badge&logo=react)](https://react.dev/)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=for-the-badge&logo=flask)](https://flask.palletsprojects.com/)
[![Scikit--Learn](https://img.shields.io/badge/scikit--learn-1.4.2-F7931E?style=for-the-badge&logo=scikit-learn)](https://scikit-learn.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-NeonDB-336791?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

---

## 📖 Table of Contents
1. [Project Overview & Mission](#-project-overview--mission)
2. [Problem Statement vs. Civic Alert Solution](#-problem-statement-vs-civic-alert-solution)
3. [System Architecture & Data Flow](#-system-architecture--data-flow)
4. [How the System Works (End-to-End Workflow)](#-how-the-system-works-end-to-end-workflow)
5. [Deep Dive: The Hybrid AI Priority Engine](#-deep-dive-the-hybrid-ai-priority-engine)
   - [Machine Learning Classifier (NLP)](#1-machine-learning-classifier-nlp)
   - [Deterministic Rule-Based Safety Net](#2-deterministic-rule-based-safety-net)
   - [Hybrid Combination Logic](#3-hybrid-combination-logic)
6. [Hinglish & Typo Resilience](#-hinglish--typo-resilience)
7. [Frontend & Application Modules](#-frontend--application-modules)
   - [Citizen Portal (`/`)](#1-citizen-portal-)
   - [Live Complaint Tracker (`/track`)](#2-live-complaint-tracker-track)
   - [Municipal Admin Operations Dashboard (`/admin/dashboard`)](#3-municipal-admin-operations-dashboard-admindashboard)
8. [Database Schema (Prisma & Neon PostgreSQL)](#-database-schema-prisma--neon-postgresql)
9. [API Reference & Microservice Endpoints](#-api-reference--microservice-endpoints)
10. [Step-by-Step Installation & Local Run Guide](#-step-by-step-installation--local-run-guide)
11. [Sample Test Cases & Prediction Behavior](#-sample-test-cases--prediction-behavior)
12. [Environment Configuration](#-environment-configuration)

---

## 🎯 Project Overview & Mission

**Civic Alert** is an AI-powered municipal emergency triage and grievance redressal platform. It automates how city municipal corporations receive, categorize, evaluate, and prioritize public grievances (e.g., open manholes, snapped electric wires, contaminated drinking water, sewer floods, broken streetlights).

Rather than processing complaints on a slow First-In, First-Out (FIFO) basis, Civic Alert uses a **Hybrid Decision Engine (Machine Learning + Rule-Based Safety Floors)** to immediately detect life-threatening hazards within milliseconds. It ranks every complaint into four distinct urgency levels:
- 🔴 **Critical**: Imminent threat to human life or safety (live wire, gas leak, open manhole, collapsed structure).
- 🟠 **High**: Serious health hazards or severe structural damage (blocked sewage flooding homes, deep road craters).
- 🟡 **Medium**: Standard civic disrepair needing prompt maintenance (potholes, water pipeline leakage, broken benches).
- 🟢 **Low**: Minor cosmetic or non-urgent repairs (dim streetlights, fading paint, park cleanliness).

---

## ⚠️ Problem Statement vs. Civic Alert Solution

| Traditional Municipal Portals | Civic Alert Platform |
| :--- | :--- |
| **FIFO Queue**: An emergency report about a child near an open manhole gets stuck behind 200 routine complaints. | **Intelligent Urgency Triage**: Emergency hazards are escalated immediately to the top of the municipal queue with a **Critical** badge. |
| **Manual Verification Delay**: Requires municipal clerks to read through thousands of paragraphs. | **Instant Automated AI Scoring**: NLP scans, vectorizes, and classifies the complaint text in under 50ms. |
| **Black Box Decision-Making**: Citizens have no insight into how their issue is prioritized. | **Explainable AI**: The system explicitly returns why the priority was assigned (confidence score and exact hazard keywords detected). |
| **Language & Typo Failures**: Pure English regex fails when citizens write in Hinglish or make spelling errors. | **Dual Word + Character N-Grams**: Understands colloquial terms like *"khamba jhuk gaya"*, *"ganda pani"*, *"chingari"*, *"taar gir gaya"*. |
| **Pure ML Hallucinations**: Statistical models can occasionally make under-prediction errors on rare edge cases. | **Deterministic Safety Net**: High-risk safety keywords guarantee that critical life hazards **can never** be downgraded by the ML model. |

---

## 🏗️ System Architecture & Data Flow

```
                      ┌────────────────────────────────────────┐
                      │             CITIZEN USER               │
                      └───────────────────┬────────────────────┘
                                          │
                        Submits Grievance (Text, Category, Location)
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │     Next.js 16 Web Application         │
                      │  (React 19 + Tailwind CSS + Lucide)    │
                      └───────────────────┬────────────────────┘
                                          │
                          POST /predict-priority (HTTP JSON)
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │        Flask AI Microservice           │
                      │             (Port 5000)                │
                      ├────────────────────────────────────────┤
                      │  1. TF-IDF Vectorizer (Word + Char)    │
                      │  2. Logistic Regression Classifier     │
                      │  3. Severity Keyword Rule Engine       │
                      │  4. Hybrid Max-Priority Combination    │
                      └───────────────────┬────────────────────┘
                                          │
                 Returns: { priority, confidence, reasons, ruleRaised }
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │           Next.js API Route            │
                      │         (/api/complaints POST)         │
                      └───────────────────┬────────────────────┘
                                          │
                           Saves Record with Prisma ORM
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │    PostgreSQL Database (Neon.tech)     │
                      │   Tables: Complaint, Admin Account     │
                      └───────────────────┬────────────────────┘
                                          │
                       Real-time Triage List & Status Updates
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │       MUNICIPAL ADMIN DASHBOARD        │
                      │        (/admin/dashboard)              │
                      │   - Priority Sorting (Critical first)  │
                      │   - Explainability & Tag Badges        │
                      │   - Status: Submitted ➔ In Progress ➔  │
                      │             Resolved                   │
                      └────────────────────────────────────────┘
```

---

## ⚙️ How the System Works (End-to-End Workflow)

1. **Grievance Submission**:
   - The citizen enters details on the portal:
     - **Complaint Text**: *"A high-tension wire fell near the primary school after heavy rain."*
     - **Category**: Electricity
     - **Location**: Ranchi - Main Road
     - **Name**: Ramesh Kumar
2. **API Delegation**:
   - Next.js server route (`/api/complaints`) receives the request and forwards the raw text to the local Python Flask service (`http://127.0.0.1:5000/predict-priority`).
3. **Dual-Layer AI Processing**:
   - **Layer 1 (ML)**: Scikit-Learn vectorizer processes the text through character and word n-grams, and the trained Logistic Regression model predicts `High` with 88% confidence.
   - **Layer 2 (Rule Safety Floor)**: The regex engine scans the text:
     - Detects `"high-tension"` (+6 points: Life Danger)
     - Detects `"wire"` (+2 points: Hazard Object)
     - Detects `"school"` (+2 points: Impact Context)
     - Total score = **10 points** ➔ Demands a minimum floor of **Critical**.
4. **Hybrid Merging**:
   - `combine("High", "Critical")` ➔ Final assigned priority: **Critical**.
   - Sets `ruleRaised = true` and generates explanation: `["Life-danger word: 'high-tension' (+6)", "Hazardous object: 'wire' (+2)", "Impact context: 'school' (+2)"]`.
5. **Database Storage**:
   - Next.js saves the complaint in Neon PostgreSQL with status `"Submitted"`, tracking token ID, AI confidence, and the explanation list.
6. **Instant Citizen Feedback**:
   - Citizen immediately gets a confirmation modal showing their **Complaint ID**, assigned priority level, AI confidence, and safety reasons.
7. **Municipal Triage**:
   - An administrator logs into `/admin/dashboard`. The complaints are sorted in descending order of urgency. The high-risk issue appears on top with high-contrast alert badges.
   - The municipal official clicks to update status: `"In Progress"` ➔ `"Resolved"`.
8. **Citizen Tracking**:
   - Citizen enters their Complaint ID at `/track` to view the updated status, department actions, and resolution timestamp.

---

## 🧠 Deep Dive: The Hybrid AI Priority Engine

Pure machine learning can suffer from statistical false negatives (for example, failing to flag a critical incident if phrasing differs from training data). Pure rule engines can be brittle and miss nuances. 

**Civic Alert unites both approaches into a fail-safe hybrid system:**

```text
               ┌───────────────────────┐
               │    Raw Complaint      │
               └───────────┬───────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
   ┌──────────────────┐        ┌──────────────────┐
   │ Machine Learning │        │  Severity Rules  │
   │  Classifier (ML) │        │   (Safety Net)   │
   └─────────┬────────┘        └─────────┬────────┘
             │                           │
      Model Priority              Rule Floor
      (e.g., "High")           (e.g., "Critical")
             │                           │
             └─────────────┬─────────────┘
                           ▼
               ┌───────────────────────┐
               │  combine(model, rule) │
               │  = max(Model, Floor)  │
               └───────────┬───────────┘
                           ▼
               Final Priority: "Critical"
```

### 1. Machine Learning Classifier (NLP)
- **Feature Extraction**: Dual pipeline combining:
  1. `TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True)`: Captures word combinations and phrases.
  2. `TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), sublinear_tf=True)`: Captures character sub-words to handle spelling variations and Hinglish vocabulary.
- **Algorithm**: Fine-tuned **Multinomial Logistic Regression** (`C=5, max_iter=2000`) calibrated for calibrated confidence probabilities.
- **Grouped Cross-Validation**: Uses `GroupKFold(n_splits=5)` grouped on `issue_id`. This guarantees that whole issue types are held out during validation, preventing the model from memorizing specific training phrases.

### 2. Deterministic Rule-Based Safety Net (`severity_rules.py`)
Scans complaint text for hazard indicators and scores them additively:

| Category | Weight | Triggers / Keywords |
| :--- | :---: | :--- |
| **Life Danger** | **+6** | `live wire`, `high-tension`, `sparking`, `aag`, `blast`, `gas leak`, `lpg`, `manhole`, `dhakkan gayab`, `collapse`, `electric shock`, `current lag gaya`, `drowning`, `fallen pole` |
| **Serious Hazard** | **+3** | `accident`, `injured`, `chot`, `burst`, `phat gayi`, `sewage`, `ganda pani`, `bimar`, `vomiting`, `no water`, `khatarnak`, `cracks`, `darar`, `jhuk gaya`, `flood`, `ambulance` |
| **Impact Context** | **+2** | `school`, `hospital`, `clinic`, `children`, `kids`, `bachche`, `elderly`, `buzurg`, `night`, `raat`, `main road`, `highway`, `junction` |
| **Hazardous Object** | **+2** | `wire`, `taar`, `pole`, `khamba`, `transformer`, `drain`, `naala`, `pipeline`, `pothole`, `gaddha`, `bridge` |
| **Dampener Words** | **-3** | `minor`, `little`, `small`, `thoda`, `faded`, `paint`, `not urgent`, `no hurry`, `itna zaroori nahi`, `whenever` |

*Safety Feature: Dampeners are **strictly ignored** if any `Life Danger` keyword is detected. A statement like "minor gas leak" will still trigger the maximum Critical score.*

### 3. Hybrid Combination Logic
```python
def combine(model_priority: str, rule_floor: str):
    LEVELS = ["Low", "Medium", "High", "Critical"]
    if rule_floor is None:
        return model_priority
    if LEVELS.index(rule_floor) > LEVELS.index(model_priority):
        return rule_floor  # Escalate priority
    return model_priority
```
**Rules only ever RAISE priority; they can never downgrade a high-priority ML prediction.**

---

## 🇮🇳 Hinglish & Typo Resilience

Civic issues in India and multilingual urban centers are often reported in blended dialects (Hindi words typed in English script). Civic Alert natively supports both English and Hinglish phrases:

| Issue | Input Sample | Detected Urgency | Reason |
| :--- | :--- | :---: | :--- |
| **Electrical** | *"Road par bijli ka taar toot kar gir gaya hai, chingari nikal rahi hai"* | 🔴 **Critical** | `Life-danger: 'chingari'`, `Hazardous object: 'taar'` |
| **Sanitation** | *"Drainage ka dhakkan gayab hai school ke paas, bachche gir sakte hain"* | 🔴 **Critical** | `Life-danger: 'dhakkan gayab'`, `Context: 'school'`, `Context: 'bachche'` |
| **Contamination**| *"Nal me ganda pani aa raha hai, log bimar pad rahe hain"* | 🟠 **High** | `Serious: 'ganda pani'`, `Serious: 'bimar'` |
| **Roads** | *"Sadak par chhota sa gaddha hai paint thoda utar gaya hai"* | 🟢 **Low** | Dampener words reduce score; ML predicts Low |

---

## 💻 Frontend & Application Modules

### 1. Citizen Portal (`frontend/src/app/page.tsx`)
- Modern clean UI built with Tailwind CSS v4 and Lucide icons.
- Instant submission form with category selection, location text, and issue description.
- Immediate post-submission card showing:
  - Assigned Priority badge (`Critical`, `High`, `Medium`, `Low`).
  - Prediction confidence bar.
  - Transparent reasons list (e.g., *"Life-danger word: 'sparking' (+6)"*).
  - One-click copy for Tracking ID.

### 2. Live Complaint Tracker (`frontend/src/app/track/page.tsx`)
- Direct lookup by numeric Complaint ID.
- Visual timeline with 3 clear milestones:
  - 🔵 **Submitted**: Received and triaged by AI.
  - 🟠 **In Progress**: Dispatched to field maintenance team.
  - 🟢 **Resolved**: Work completed.

### 3. Municipal Admin Operations Dashboard (`frontend/src/app/admin/dashboard/page.tsx`)
- Secure session gatekeeper backed by NextAuth.
- Top metrics counters: Total Complaints, Critical, In Progress, Resolved.
- Multi-dimensional filters: Filter by Priority, Status, or Category.
- Direct status toggling buttons to transition complaints through resolution phases.

---

## 🗄️ Database Schema (Prisma & Neon PostgreSQL)

The database schema is defined in [frontend/prisma/schema.prisma](frontend/prisma/schema.prisma):

```prisma
model Complaint {
  id            Int      @id @default(autoincrement())
  complaintText String   @db.Text
  category      String?
  location      String
  priority      String   // Critical | High | Medium | Low
  confidence    Float    @default(0)
  reasons       String?  @db.Text   // JSON serialized array of rule match explanations
  ruleRaised    Boolean  @default(false) // true if safety rules escalated the priority
  status        String   @default("Submitted") // Submitted | In Progress | Resolved
  submittedBy   String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Admin {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String   // bcrypt-hashed
  name      String?
  createdAt DateTime @default(now())
}
```

---

## 🔌 API Reference & Microservice Endpoints

### 1. Flask AI Microservice (`http://localhost:5000`)

#### `GET /`
- **Purpose**: Health check & model status inspection.
- **Response**:
  ```json
  {
    "status": "healthy",
    "service": "Civic Alert Flask API",
    "model_loaded": true,
    "endpoints": ["POST /predict-priority", "POST /api/predict", "GET /api/complaints"]
  }
  ```

#### `POST /predict-priority`
- **Purpose**: Primary prediction endpoint called by Next.js.
- **Request Body**:
  ```json
  {
    "complaint_text": "Exposed high tension cable has snapped near the community hospital"
  }
  ```
- **Response**:
  ```json
  {
    "complaint_text": "Exposed high tension cable has snapped near the community hospital",
    "predicted_priority": "Critical",
    "confidence": 0.96,
    "model_priority": "High",
    "model_confidence": 0.88,
    "rule_score": 10,
    "reasons": [
      "Life-danger word: 'high tension' (+6)",
      "Impact context: 'hospital' (+2)",
      "Hazardous object: 'cable' (+2)"
    ],
    "raised_by_rules": true
  }
  ```

---

### 2. Next.js Application API (`http://localhost:3000`)

#### `POST /api/complaints`
- **Purpose**: Citizen submission endpoint.
- **Behavior**: Calls Flask microservice, extracts AI priority & metadata, saves into PostgreSQL via Prisma, and returns the persisted record.

#### `GET /api/complaints`
- **Purpose**: Fetches complaints with optional query filters (`?priority=Critical&status=Submitted&category=Electricity`). Sorted by urgency (Critical ➔ High ➔ Medium ➔ Low) then by recency.

#### `PATCH /api/complaints/[id]`
- **Purpose**: Updates complaint status (`Submitted`, `In Progress`, `Resolved`).

---

## 🚀 Step-by-Step Installation & Local Run Guide

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/civic_alert.git
cd civic_alert
```

---

### 2. Start the AI Backend (Python / Flask)

Open your first terminal in the root directory:

```bash
# 1. Create and activate a Python virtual environment
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On macOS / Linux:
source venv/bin/activate

# 2. Install Python requirements
pip install -r requirements.txt

# 3. (Optional) Re-train the model from dataset
python train_model.py

# 4. Start the Flask AI server
python app.py
```
> Flask AI microservice will be running on **`http://localhost:5000`**

---

### 3. Start the Web Application (Next.js & Prisma)

Open a second terminal and navigate to `frontend`:

```bash
cd frontend

# 1. Install Node.js dependencies
npm install

# 2. Setup environment variables
cp .env.example .env
```

Open `frontend/.env` in your text editor and provide your Neon PostgreSQL database URL:
```env
DATABASE_URL="postgresql://<username>:<password>@<neon-host>/neondb?sslmode=require"
NEXTAUTH_SECRET="super-secret-random-key-change-this"
NEXTAUTH_URL="http://localhost:3000"
```

Sync the database schema and seed sample data:
```bash
# 3. Push schema to Neon PostgreSQL
npx prisma db push

# 4. Seed default admin credentials and sample complaints
npx prisma db seed

# 5. Start Next.js development server
npm run dev
```
> Citizen Portal is live at: **`http://localhost:3000`**  
> Admin Dashboard is live at: **`http://localhost:3000/admin`**

---

## 🧪 Sample Test Cases & Prediction Behavior

Try these sample complaints in the portal to observe the AI's triage accuracy:

| Test Input | Expected Priority | Expected Behavior |
| :--- | :---: | :--- |
| *"Deep crater in the middle of highway, two bikes slipped and riders were injured"* | 🔴 **Critical** | Triggers Serious (+3), Context (+2), Hazard (+2). |
| *"Live sparking wire hanging from electric pole outside city hospital"* | 🔴 **Critical** | Triggers Life-Danger (+6) and overrides any model hesitation. |
| *"Drinking water pipeline leaking for 2 days, clean water is wasting on street"* | 🟡 **Medium** | Standard municipal maintenance issue. |
| *"Park bench paint is slightly faded, please repaint whenever possible"* | 🟢 **Low** | Dampeners (`slightly`, `faded`, `whenever`) set priority to Low. |

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
