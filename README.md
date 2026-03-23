# SoloCoder

SoloCoder is a school learning platform that combines:
- gamified learning (XP, progress, rewards),
- real curriculum progress,
- role-based school operations (learner, mentor, gatekeeper, director).

The goal is fun learning that stays academically effective.

## Vision

Build a system where students feel like they are playing a game, while every reward is tied to meaningful learning outcomes.

Core rule:
- reward verified learning actions, not random clicks.

## Product Roles

- `Learner`: follows learning paths, completes lessons/projects, earns XP.
- `Mentor`: guides students, reviews work, unlocks progression.
- `Gatekeeper`: manages attendance flow and daily student status.
- `Director`: monitors school-level KPIs and trends in real time.

## Refined Architecture

Architecture style:
- modular monolith in Next.js (fast to ship now, scalable later).
- event-driven updates for real-time dashboards.

Tech direction:
- `Next.js` App Router for app + APIs.
- `PostgreSQL` for core data.
- `Prisma` or `Drizzle` for schema/migrations.
- managed real-time provider first (`Ably` or `Pusher`), with optional Redis later.

### Domain Modules

- `auth`: users, sessions, role-based access.
- `academics`: courses, lessons, projects, prerequisites.
- `progress`: attempts, completion, mastery, feedback.
- `gamification`: XP transactions, levels, badges, streaks.
- `attendance`: present/late/absent/justified records.
- `analytics`: class/school KPIs and trend aggregation.
- `realtime`: publish/subscribe channels and event routing.

## Real-Time Model

Flow:
1. write authoritative state to DB in a transaction.
2. emit a domain event.
3. publish event to the right channel.
4. dashboards update immediately from subscription.

Event contracts are started in:
- `src/lib/events/contracts.ts`
- `src/lib/events/channels.ts`
- `src/lib/events/publisher.ts`

Recommended channel scope:
- `student:{id}` for learner progress updates.
- `class:{id}` for mentor/gatekeeper operational updates.
- `school:{id}` for director-level metrics and alerts.

## Current Structure

```text
src/
  app/
  components/
    dashboards/
  hooks/
  lib/
    curriculum.ts
    projects-data.ts
    events/
      contracts.ts
      channels.ts
      publisher.ts
  modules/
    auth/
    academics/
    progress/
    gamification/
    attendance/
    analytics/
    realtime/
```

## Build Phases

1. Define DB schema for users, enrollments, progress, XP transactions, attendance.
2. Implement server actions/APIs that write progress + XP atomically.
3. Publish domain events after successful commits.
4. Subscribe dashboards to live channels and patch UI state in place.
5. Add analytics aggregations and fallback polling for resilience.

## Importing freeCodeCamp Curriculum

There is now a local importer script for pulling freeCodeCamp curriculum metadata, and optionally challenge markdown content, into a JSON snapshot for SoloCoder:

```bash
npm run import:freecodecamp --
npm run import:freecodecamp -- --include-content
npm run import:freecodecamp -- --superblocks=basic-html,basic-css,javascript-v9 --include-content
```

Notes:
- output defaults to `data/imports/freecodecamp/html-css-js.json`
- imported datasets are gitignored by default
- the script reads freeCodeCamp's official repo structure directly
- freeCodeCamp's README states `/curriculum` learning resources are copyrighted, so review their licensing before redistributing imported content inside your product
