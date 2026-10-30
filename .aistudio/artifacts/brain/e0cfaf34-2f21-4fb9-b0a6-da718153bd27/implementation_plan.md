# Implementation Plan - FESTOS AI

An intelligent College Fest Planning web application tailored for Indian engineering colleges (IITs, NITs, BITS, state engineering colleges, and universities).

## 1. Architecture & Design System

### Technical Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS (v4) with high-density premium dark SaaS styling (navy-black backgrounds `#0A0D14`, deep indigo/slate surfaces `#101626`, violet accents `#7C3AED` to `#6366F1`, emerald status indicators, glass borders `rgba(255,255,255,0.08)`)
- **Icons & Visuals**: Lucide React + Recharts (budget distribution, venue capacity utilization, registration trends)
- **Backend & Persistence**: Cloud Firestore + Firebase Authentication (Google Sign-In) with fallback local storage demo mode
- **Server API**: Express server proxying `/api/ai/chat` for backend Gemini AI orchestration and health check endpoints
- **Testing**: Node built-in test runner (`node:test`, `node:assert/strict`) for venue overlap math and capacity conflict algorithms

### User Personas
- **Fest Convenor / Chief Coordinator**: Manages overarching fest budget, master schedule, venue approvals, and department coordinator allocations.
- **Event Lead (Tech / Cultural / Sports / Workshops)**: Adds events, submits budget estimates, selects venues, configures time slots.
- **Logistics & Hospitality Head**: Monitors venue capacity constraints, overlapping bookings, audio-visual resource conflicts.

---

## 2. Core Pages & Navigation

1. **Dashboard (Overview)**
   - Top metrics: Total events, total fest budget vs allocated vs remaining, venue utilization percentage, active scheduling conflicts.
   - Live Conflict Alert Banner: Real-time warnings when two events share the same venue at overlapping times or when expected footfall exceeds venue capacity.
   - Quick Actions: "Load Demo Fest (TechNova 2026)", "New Event", "Add Venue", "Auto-Schedule".
   - Budget consumption bar and upcoming event timeline preview.

2. **Fest Management**
   - Manage fest settings: Name (e.g. *TechNova 2026*), Edition/Year, College Name, Start Date, End Date, Tagline, Total Allocated Budget (INR ₹), Fest Status (Draft, Planning, Live, Concluded).
   - Multi-department committee list (Technical Council, Cultural Committee, Logistics, Sponsorship).
   - "Load TechNova 2026 Demo" 1-click preset.

3. **Event Management**
   - Full CRUD for college events across categories (Hackathon, Pro-Nite, Robotics, Debate, Dance, Gaming, Guest Lecture).
   - Attributes: Title, category, department/club, date, start time, end time, duration (mins), expected participants, estimated cost (INR), venue assignment, required equipment/resources (e.g. Stage mics, Projector, High-speed LAN, Heavy AC).
   - Live validation: Immediately flags if assigned venue cannot accommodate expected participants or overlaps with another event.
   - Filter by category, department, venue, and status.

4. **Venue Management**
   - Full CRUD for campus venues (e.g., *Main Auditorium*, *Open Air Theatre (OAT)*, *APJ Abdul Kalam Mech Block Seminar Hall*, *Computer Labs Cluster*, *SAC Grounds*).
   - Attributes: Venue name, location/building, capacity (seats/standing), hourly or fixed pricing/maintenance cost, available time windows (open/close hours), facilities & equipment available (AV System, 4K Projector, Green Rooms, High-power electrical lines, WiFi 6).
   - Real-time venue occupancy timeline and utilization rate gauge.

5. **Smart Scheduler**
   - Visual multi-venue Gantt / timeline grid view.
   - **Deterministic Conflict Engine**:
     - Time Overlap Check: Identifies interval intersections: `max(startA, startB) < min(endA, endB)` for same venue.
     - Capacity Check: Flags `expectedParticipants > venueCapacity` with clear severity rating.
     - Buffer Warning: Identifies turnaround time violations (< 30 min turnaround between major stage events).
   - **Auto-Scheduler Engine**: Greedy interval placement algorithm that automatically places unscheduled events into optimal open venue slots based on capacity and duration.

6. **Budget Planner**
   - Financial analytics for Indian engineering college festivals (INR ₹ currency formatting, lakhs/thousands formatting).
   - Categories: Tech Infrastructure, Prize Pool, Celebrity/Artist Booking, Stage & Sound, Food & Logistics, Marketing & Merchandise.
   - Visual Recharts: Spending breakdown by category, budget burn rate, contingency reserve remaining.
   - Over-budget warning system.

7. **AI Copilot (Reserved Integration Interface)**
   - High-fidelity dark mode copilot chat drawer / view.
   - Genuine `/api/ai/chat` integration ready: calls backend endpoint.
   - Displays authentic integration-ready status with sample prompts, payload contract inspector, and configuration indicator rather than synthetic mock answers.
   - Detailed documentation in `docs/ai-integration.md`.

---

## 3. Data Models & Firestore Schema

### Blueprint Collections
- `/fests/{festId}`: Master fest document (name, college, dates, totalBudget, ownerId, committee).
- `/fests/{festId}/events/{eventId}`: Individual fest events (title, category, venueId, startTime, endTime, expectedParticipants, estimatedCost, status).
- `/fests/{festId}/venues/{venueId}`: Available campus venues (name, capacity, location, availableStart, availableEnd, facilities, hourlyRate).
- `/fests/{festId}/budgetItems/{itemId}`: Granular budget line items with actuals vs estimates.

---

## 4. Implementation Phases

- **Phase 1 (Immediate)**:
  - Setup core data interfaces, validation, and demo dataset (*TechNova 2026*, ₹1,50,000 budget, 6 diverse events, 4 realistic campus venues).
  - Implement deterministic conflict detection algorithms (`src/utils/scheduler.ts`) with unit tests (`src/utils/scheduler.test.ts`).
  - Build UI layout: Header, navigation tabs, dark SaaS theme, Indian currency helpers.
  - Implement Dashboard overview with live stat cards, conflict alerts, and Recharts.
  - Implement Fest Management (edit details, seed demo fest).
  - Implement Venue Management (CRUD, facilities, capacity, hours).
  - Implement Event Management (CRUD, validations, venue assignment, cost).
  - Implement Smart Scheduler (interactive timeline, auto-scheduler, conflict badges).
  - Implement Budget Planner (analytics, category distribution, warning triggers).
  - Implement AI Copilot interface and backend server endpoint `/api/ai/chat`.
  - Provide `docs/ai-integration.md` and complete documentation.
- **Phase 2**:
  - Verification with node:test unit tests, browser testing with playwright, critique and final polish.
