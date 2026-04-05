# Design System — Do! Ratings!

## Product Context
- **What this is:** Universal review platform where users rate everything (airlines, hotels, restaurants, companies, places, people)
- **Who it's for:** Korean-first, bilingual (ko/en) users who want trustworthy, curated reviews
- **Space/industry:** Review platforms (Trustpilot, Letterboxd, TripAdvisor, Naver Place)
- **Project type:** Web app (Next.js App Router, responsive)

## Aesthetic Direction
- **Direction:** Editorial/Magazine
- **Decoration level:** Minimal — typography does all the work
- **Mood:** Sophisticated, curated, authoritative. Like reading a well-designed magazine about experiences.
- **Reference:** Letterboxd (community + dark mode), Monocle (editorial typography), Trustpilot (trust signals)
- **Anti-patterns:** No purple/indigo gradients. No emoji as icons. No glassmorphism. No floating orbs. No 3D tilt. No splash screens.

## Typography
- **Display/Hero:** Literata (editorial serif, weight 400-700)
- **Body:** DM Sans (clean, modern, weight 400-600)
- **UI/Labels:** DM Sans (weight 500-600, uppercase tracking for section labels)
- **Data/Tables:** DM Sans (tabular-nums)
- **Code:** JetBrains Mono
- **Loading:** Google Fonts CDN
- **Scale:**
  - Display: 48-64px / 3-4rem
  - H1: 36-48px / 2.25-3rem
  - H2: 28-32px / 1.75-2rem
  - H3: 20-24px / 1.25-1.5rem
  - Body: 15-16px / 0.9375-1rem
  - Caption: 12-13px / 0.75-0.8125rem
  - Label: 10-11px / 0.625-0.6875rem (uppercase, tracking-widest)

## Color
- **Approach:** Restrained — one accent + warm neutrals
- **Primary (Accent):** #D4A017 (amber gold — star ratings = brand identity)
- **Primary hover:** #B8890F
- **Primary subtle:** rgba(212, 160, 23, 0.08)
- **Foreground:** #1A1A18 (charcoal)
- **Foreground muted:** #6B6B63 (warm stone)
- **Foreground subtle:** #9C9C91 (light stone)
- **Background:** #FAFAF8 (warm off-white)
- **Surface/Card:** #FFFFFF (white)
- **Border:** #E8E8E3 (warm gray)
- **Border subtle:** #F0F0EC
- **Semantic:**
  - Success: #2F855A
  - Warning: #D69E2E
  - Error: #C53030
  - Info: #3182CE
- **Dark mode:**
  - Background: #141413
  - Surface: #1E1E1C
  - Foreground: #FAFAF8
  - Foreground muted: #A3A39B
  - Border: #2E2E2B
  - Primary: #E5B422

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable — generous whitespace is a core design principle
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64) 4xl(80)

## Layout
- **Approach:** Grid-disciplined with editorial touches (asymmetric featured grid)
- **Grid:** 12 columns on desktop, 4 on mobile
- **Max content width:** 1200px
- **Sidebar:** 240px fixed (desktop only)
- **Border radius:** sm:4px, md:8px, lg:12px, full:9999px
- **Cards:** 1px solid border (warm gray), no box-shadow by default, subtle elevation on hover only

## Icons
- **Primary:** Lucide React icons (line style)
- **NEVER use emoji as UI icons** — emoji only in user-generated content
- **Custom SVG:** QuiverAI for category-specific illustrations and brand assets
- **Star ratings:** Custom filled/empty SVG stars in amber gold, not emoji or text characters

## Motion
- **Approach:** Minimal-functional — only transitions that aid comprehension
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50-100ms) short(150-200ms) medium(200-300ms)
- **Allowed:** hover state transitions, page route transitions, skeleton loading
- **NOT allowed:** floating/orbiting decorations, 3D card tilt, infinite pulse animations, confetti, glow effects, splash screens

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-02 | Editorial/Magazine aesthetic | Differentiate from generic AI-generated review platforms. Typography-driven hierarchy. |
| 2026-04-02 | Amber gold as sole accent | Star rating color = brand color. One accent enforces visual discipline. |
| 2026-04-02 | Literata + DM Sans | Serif headlines create editorial authority. Sans body ensures readability. |
| 2026-04-02 | Remove all purple/indigo | Previous palette was classic "AI-generated app" look. Warm neutrals feel handcrafted. |
| 2026-04-02 | Emoji ban in UI | Emoji icons look unprofessional and render inconsistently. Lucide provides visual consistency. |
| 2026-04-02 | Motion reduction | 28 framer-motion files with decorative animations hurt performance and feel overwrought. |
