---
name: demo-seed-data
description: >
  Generates rich, realistic mock and seed data for hackathon demos, prototypes,
  and judging presentations. Use when user asks for "seed data", "mock data",
  "populate db", "dummy data", "sample records", or needs realistic dashboard/app data.
---

# Demo Seed Data Generator

In hackathon demos and judge evaluations, empty states or low-effort placeholder data ("Test User 1", "Lorem ipsum", "$0.00") destroy credibility. This skill produces vibrant, realistic, domain-coherent mock data that makes prototypes look like active, living products.

## Core Rules

1. **Context-Coherent Domains:** Never generate generic names ("Item 1", "User A"). If building healthcare, use clinical terminology and realistic patient anonymized states. If fintech, use real ticker symbols, fee schedules, and transaction categories.
2. **Realistic Time Distributions:** Seed timestamps across natural intervals (e.g., "3 minutes ago", "Yesterday at 4:12 PM", "Last Friday") rather than uniform fake timestamps.
3. **High-Fidelity Assets:**
   - **Avatars:** Use stable Unsplash portrait URLs or Dicebear avatar endpoints (e.g. `https://api.dicebear.com/7.x/avataaars/svg?seed=Alice`).
   - **Metrics & Graphs:** Seed data arrays that represent realistic trends (e.g., exponential growth with realistic weekend dips, not flat random noise).
   - **Statuses:** Provide realistic status mixes: 70% Completed/Success, 20% Pending/Processing, 10% Flagged/Action Required (shows off UI badges and filters!).
4. **Export Formats:**
   - Standalone JSON files (`mock-data.json`)
   - TypeScript typed mocks (`fixtures/*.ts`)
   - SQL seed scripts (`seed.sql`) or Prisma/Drizzle seeders (`prisma/seed.ts`)

## Invocations
- `/demo-seed-data [domain]` (e.g. `/demo-seed-data fintech-dashboard`, `/demo-seed-data medical-records`)
