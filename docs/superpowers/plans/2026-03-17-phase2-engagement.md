# Phase 2: Engagement & Gamification — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add badge/achievement system, trust score, review comments, and emoji reactions.

**Architecture:** New tables with RLS, trigger-based achievement awarding and trust score computation, client components for UI.

**Tech Stack:** Next.js 15, Supabase, TypeScript, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-17-phase2-engagement-design.md`

---

## Chunk 1: Database & i18n

### Task 1: Create Phase 2 migration

Create `supabase/migrations/007_phase2_engagement.sql` with all tables, triggers, and seed data.

### Task 2: Add i18n keys

Add achievement, trust, comment, reaction keys to both ko.json and en.json.

---

## Chunk 2: Components

### Task 3: Create AchievementBadge + AchievementList
### Task 4: Create TrustBadge
### Task 5: Create CommentSection
### Task 6: Create ReactionBar

---

## Chunk 3: Integration

### Task 7: Integrate into Profile page (achievements + trust)
### Task 8: Integrate into ReviewCard (reactions + comments + trust)
### Task 9: Final build verification
