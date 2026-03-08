# NPTEL College Portal

## Current State
- HOD dashboard has file upload section (enrollment + exam reg) but the upload handlers only save filenames to permissions — they never parse the file or extract errors. So HOD errors tables always show empty even after upload.
- Student dashboard reads from `uploadedStudentRecords` (set by Dean) and `hodUploadedRecords` (set by HOD). HOD file uploads don't populate `hodUploadedRecords`.
- Dean upload correctly parses files, validates rows, and sets `enrollmentErrors` / `examRegErrors` / `uploadedStudentRecords` in campus context.

## Requested Changes (Diff)

### Add
- HOD enrollment upload now actually parses the file using `parseUploadedFile` + `validateEnrollmentRows`, then appends new errors to campus `enrollmentErrors` and appends parsed records to campus `hodUploadedRecords` (for student dashboard visibility).
- HOD exam reg upload now actually parses the file using `parseUploadedFile` + `validateExamRegRows` + `parseExamRegRecords`, then appends new exam errors to campus `examRegErrors` and appends parsed exam records to campus `hodUploadedRecords`.
- Both HOD upload handlers use the campus's `uploadedCourses` for course ID validation (same as Dean does).
- Loading toast and success/error toast for HOD file parse results.

### Modify
- `HODDashboard.tsx`: `handleEnrollUpload` and `handleExamUpload` — add actual file parsing logic after successful file accept check. Use `appendHodUploadedRecords`, `setEnrollmentErrors`, `setExamRegErrors` from context.
- HOD upload now uses the file's `File` object (not just name) before resetting the input.
- Context: expose `appendEnrollmentErrors` and `appendExamRegErrors` helpers (or the HOD can just read current errors and set merged list).

### Remove
- Nothing removed.

## Implementation Plan
1. In `AppContext.tsx`, add `appendEnrollmentErrors` and `appendExamRegErrors` setters that append rather than replace.
2. In `HODDashboard.tsx`, update `handleEnrollUpload` to: read File object first, save filename, then call `parseUploadedFile` → `validateEnrollmentRows` → append errors + records.
3. In `HODDashboard.tsx`, update `handleExamUpload` to: read File object first, save filename, then call `parseUploadedFile` → `validateExamRegRows` + `parseExamRegRecords` → append errors + exam records.
4. Pass `collegeName` and `uploadedCourses`/`uploadedCourseIds` to HOD validators same as Dean does.
5. Validate and build.
