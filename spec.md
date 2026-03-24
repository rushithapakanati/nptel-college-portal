# NPTEL College Portal

## Current State
The homepage (`/`) shows a RGUKT NPTEL PORTAL title and four college cards (Nuzvid, Srikakulam, RK Valley, Ongole). Clicking a college goes to `/college/$collegeName` (role selection). AppContext stores campus data keyed by campus name only.

## Requested Changes (Diff)

### Add
- New landing page at `/` with: title "RGUKT NPTEL PORTAL", a dropdown for academic year ("2026 Sem-1", "2026 Sem-2"), and a "Proceed" button
- New `/portal` route that shows the existing college card selection (moved from `/`)
- `selectedAcademicYear` field in AppContext
- Campus data key now includes year: `${year}_${campus}` so each year has its own isolated database

### Modify
- `App.tsx`: add `/portal` route, keep all other routes unchanged
- `AppContext.tsx`: add `selectedAcademicYear` state + setter, update `campusKey()` to use year prefix
- `HomePage.tsx`: replace with new year-selection landing UI
- Move college card content to new `PortalPage.tsx`

### Remove
- College card grid from the old HomePage (moved to PortalPage)

## Implementation Plan
1. Add `selectedAcademicYear` + setter to AppContext; update campusKey to prefix with year
2. Create `YearSelectPage.tsx` (new homepage at `/`) with title, dropdown, proceed button
3. Create `PortalPage.tsx` with existing college card content (was in HomePage)
4. Update `App.tsx` to add `/portal` route and point `/` to YearSelectPage
5. Validate and deploy
