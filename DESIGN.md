# Design Brief

## Purpose & Tone
Institutional academic portal balancing institutional authority with accessibility. Deep indigo conveys academic rigor; gold accents signal achievement and importance. The interface prioritizes clarity and campus isolation over decoration.

## Palette

| Token | OKLCH L C H | Usage |
|-------|------------|-------|
| Primary | 0.32 0.12 264 | Buttons, headers, active states |
| Secondary | 0.92 0.03 250 | Light backgrounds for sections |
| Accent (Gold) | 0.88 0.12 85 | Highlights, achievements, important data |
| Background | 0.97 0.004 250 | Page background |
| Foreground | 0.15 0.025 255 | Body text, high contrast |
| Muted | 0.94 0.015 250 | Borders, secondary text |
| Destructive | 0.577 0.245 27.325 | Errors, delete actions |
| Success | 0.6 0.16 145 | Valid data, confirmations |
| Chart 1–5 | Deep indigo, teal, gold, red, purple | Data visualization |

**Dark mode:** Inverted lightness with deep navy background (0.12 0.03 264), light text (0.94 0.01 255), lifted cards (0.17 0.04 264).

## Typography
- **Display:** Bricolage Grotesque (700 weight) — distinctive, geometric letterforms
- **Body:** General Sans (400/600 weight) — neutral, highly legible
- **Headings:** Bricolage Grotesque for h1–h6; 700 weight at 32px, 28px, 24px, 20px, 18px, 16px

## Structural Zones

| Zone | Background | Border | Usage |
|------|-----------|--------|-------|
| Header / Nav | Card (1 0 0) | 0.88 0.02 255 | Blue GraduationCap logo, nav links, user menu |
| Hero / Title | Background (0.97 0.004 250) | None | "WELCOME TO RGUKT NPTEL WEBSITE", year/semester dropdown |
| Main content | Background | None | Enrollment/exam reg tables, upload cards, statistics |
| Card | Card (1 0 0) | 0.88 0.02 255 | File upload cards, data tables, error popups |
| Sidebar / Filter | Secondary (0.92 0.03 250) | 0.88 0.02 255 | Branch filters, error type filters |
| Footer | None | None | Removed; no copyright anywhere |

## Shape Language
- **Radii:** 0.5rem (base) for cards; 0.25rem (sm) for inputs; 1rem (lg) for larger containers
- **Shadows:** Elevated card shadow (0 4px 24px oklch primary/0.2), hover shadow (0 8px 32px oklch primary/0.35)
- **Spacing:** 8px base grid; dense tables (1rem padding), relaxed sections (2–3rem margin)

## Component Patterns
- **Buttons:** Primary (indigo bg, white text), secondary (light indigo bg, indigo text), danger (red bg, white text)
- **Tables:** Striped rows (alt bg-muted), hover (bg-secondary), sortable headers (Bricolage font)
- **Forms:** Rounded inputs (0.5rem), gold accent on focus, error text in red
- **Error popups:** Modal overlay, white card, error description centered, course name + ID highlighted
- **Status badges:** Green (done), orange (redo), blue (pending/first time)

## Motion
- **Fade-in-up:** 0.5s ease-out (page load, tables)
- **Fade-in:** 0.4s ease-out (popups, cards)
- **Transitions:** 0.3s on all interactive elements (buttons, links)

## Constraints
- No copyright footer on any page
- Campus and role isolation always visible in dashboard headers
- Exam shuffle "Roll No" (not "Student ID"), optional "Seating No" from file
- File versioning: latest active, previous files archived with yellow banner
- Error descriptions in popups; HOD edits in popups with full student details
- No generic shadows or defaults; use NPTEL custom tokens only
- 50 errors per page for HOD, 100 for Dean

## Signature Details
- **RGUKT logo** (blue GraduationCap or uploaded RGUKT image) on homepage
- **Gold accent** on key metrics (Done registrations, error count badges)
- **Deep indigo gradient** on hero section (nptel-gradient utility)
- **Course Name highlighting** in error displays (bold text)
