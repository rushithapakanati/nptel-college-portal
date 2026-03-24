/**
 * Real file parser for CSV and Excel files.
 * Uses native browser APIs for CSV parsing (handles 100k+ rows).
 * Uses a bundled minimal XLSX parser for Excel files.
 *
 * All validation is applied strictly to the actual file data.
 * No hardcoded/sample records are used.
 *
 * Designed to handle NPTEL export formats with flexible column name matching.
 */

import type {
  Branch,
  Course,
  EnrollmentError,
  ExamRegError,
  ExamShuffleUploadRecord,
  StudentUploadRecord,
} from "../data/mockData";
import {
  BRANCHES,
  getStudentEmailDomain,
  getStudentEmailPattern,
  getStudentIdPrefix,
} from "../data/mockData";

// ─── Column name normalizer ────────────────────────────────────────────────────
// Normalizes header names for flexible matching regardless of case/spacing/special chars
function norm(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[\s_\-\/\(\)\.]+/g, "");
}

// Find a column value from a row using multiple possible column names
// Priority: exact match > row-key-contains-search-key > search-key-contains-row-key (only if search key is long enough)
function col(row: Record<string, string>, ...keys: string[]): string {
  const rowKeys = Object.keys(row);

  // 1. Exact match first (after normalization)
  for (const k of keys) {
    for (const rowKey of rowKeys) {
      if (norm(rowKey) === norm(k)) {
        return (row[rowKey] ?? "").trim();
      }
    }
  }

  // 2. Row key contains the search key as substring (e.g. "Student Roll No" contains "rollno")
  for (const k of keys) {
    const normK = norm(k);
    // Only use substring match if the search key is at least 4 chars to avoid false positives
    if (normK.length < 4) continue;
    for (const rowKey of rowKeys) {
      const normRowKey = norm(rowKey);
      if (normRowKey.includes(normK)) {
        const val = (row[rowKey] ?? "").trim();
        if (val) return val;
      }
    }
  }

  // 3. Search key contains the row key (only if row key is reasonably long: >= 5 chars)
  for (const k of keys) {
    const normK = norm(k);
    for (const rowKey of rowKeys) {
      const normRowKey = norm(rowKey);
      if (normRowKey.length >= 5 && normK.includes(normRowKey)) {
        const val = (row[rowKey] ?? "").trim();
        if (val) return val;
      }
    }
  }

  return "";
}

// Exact-only column lookup (no substring fallback) - used when substring matching causes false positives
function colExact(row: Record<string, string>, ...keys: string[]): string {
  const rowKeys = Object.keys(row);
  for (const k of keys) {
    for (const rowKey of rowKeys) {
      if (norm(rowKey) === norm(k)) {
        return (row[rowKey] ?? "").trim();
      }
    }
  }
  return "";
}

/** Returns all header names from a row (for debugging) */
export function getFileHeaders(rows: Record<string, string>[]): string[] {
  if (rows.length === 0) return [];
  return Object.keys(rows[0]);
}

// ─── CSV Parser (native, handles 100k+ rows) ─────────────────────────────────
export function parseCSVFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target!.result as string;
        const rows = parseCSVText(text);
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file, "utf-8");
  });
}

/**
 * Native CSV text parser.
 * Handles quoted fields, commas inside quotes, newlines inside quotes.
 * Returns array of row objects keyed by header row values.
 */
function parseCSVText(text: string): Record<string, string>[] {
  // Normalize line endings
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = splitCSVLines(normalized);

  if (lines.length === 0) return [];

  // Find the header row (first non-empty line)
  let headerIdx = 0;
  const headers = parseCSVLine(lines[headerIdx]);
  if (headers.length === 0) return [];

  const rows: Record<string, string>[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const vals = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    let hasValue = false;
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j].trim();
      if (!key || key.startsWith("__EMPTY")) continue;
      const val = (vals[j] ?? "").trim();
      row[key] = val;
      if (val) hasValue = true;
    }
    if (hasValue) rows.push(row);
  }
  return rows;
}

function splitCSVLines(text: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (ch === "\n" && !inQuotes) {
      lines.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(field.trim());
      field = "";
    } else {
      field += ch;
    }
  }
  fields.push(field.trim());
  return fields;
}

// ─── Known NPTEL column keywords used to detect the real header row ───────────
// A row is a header row if it has 4+ keyword matches AND contains at least one "anchor" keyword
// (course, discipline, roll, student, email, enrollment) -- this prevents metadata rows from
// being misidentified as headers just because they contain words like "week" or "institute".
const HEADER_KEYWORDS = [
  "name",
  "email",
  "roll",
  "student",
  "course",
  "branch",
  "dept",
  "department",
  "duration",
  "status",
  "payment",
  "enrollment",
  "discipline",
  "program",
  "stream",
  "profession",
  "category",
  "nptel",
  "registration",
  "college",
  "institute",
  "sme",
];

// Anchor keywords: at least one cell must exactly or closely match one of these
// to confirm the row is a real header (not metadata like dates/sessions)
const HEADER_ANCHOR_KEYWORDS = [
  "course id",
  "courseid",
  "course_id",
  "discipline",
  "roll no",
  "rollno",
  "student id",
  "studentid",
  "email",
  "enrollment",
  "course name",
  "coursename",
  "sme name",
];

function rowLooksLikeHeader(rowValues: string[]): boolean {
  // Count how many cells match a known header keyword
  let matches = 0;
  let hasAnchor = false;

  for (const val of rowValues) {
    const v = val.toLowerCase().trim();
    if (!v || v.startsWith("__empty")) continue;

    // Check anchor keywords (exact/close match on cell value)
    if (!hasAnchor) {
      for (const anchor of HEADER_ANCHOR_KEYWORDS) {
        if (v === anchor || v.includes(anchor)) {
          hasAnchor = true;
          break;
        }
      }
    }

    // Check general header keywords
    for (const kw of HEADER_KEYWORDS) {
      if (v.includes(kw)) {
        matches++;
        break;
      }
    }
  }

  // Must have at least 4 keyword matches AND at least 1 anchor keyword
  return matches >= 4 && hasAnchor;
}

// ─── Excel Parser ──────────────────────────────────────────────────────────────
// Uses XLSX library loaded from CDN (SheetJS) via dynamic script injection.
// Falls back to CSV parsing if CDN load fails.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type XLSXLib = any;

let xlsxLibCache: XLSXLib | null = null;

export async function loadXLSXLib(): Promise<XLSXLib> {
  if (xlsxLibCache) return xlsxLibCache;
  // Check if already loaded globally
  if (
    typeof window !== "undefined" &&
    (window as Window & { XLSX?: XLSXLib }).XLSX
  ) {
    xlsxLibCache = (window as Window & { XLSX?: XLSXLib }).XLSX;
    return xlsxLibCache;
  }
  // Dynamically inject SheetJS from CDN
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
    script.onload = () => {
      const lib = (window as Window & { XLSX?: XLSXLib }).XLSX;
      if (lib) {
        xlsxLibCache = lib;
        resolve(lib);
      } else {
        reject(new Error("XLSX library failed to load"));
      }
    };
    script.onerror = () =>
      reject(new Error("Failed to load XLSX library from CDN"));
    document.head.appendChild(script);
  });
}

export async function parseExcelFile(
  file: File,
): Promise<Record<string, string>[]> {
  let XLSX: XLSXLib;
  try {
    XLSX = await loadXLSXLib();
  } catch {
    // CDN failed — try reading as CSV (some .xls are actually CSV-like)
    return parseCSVFile(file);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // First attempt: parse raw as array-of-arrays to find the real header row
        const rawArrays = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
          raw: false,
        }) as string[][];

        // Find the first row that looks like a real header (scan up to first 20 rows)
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(20, rawArrays.length); i++) {
          const rowVals = rawArrays[i].map((v: unknown) =>
            String(v ?? "").trim(),
          );
          if (rowLooksLikeHeader(rowVals)) {
            headerRowIndex = i;
            break;
          }
        }

        // Re-parse with the detected header row
        const json = XLSX.utils.sheet_to_json(worksheet, {
          defval: "",
          raw: false,
          range: headerRowIndex,
        }) as Record<string, unknown>[];

        const rows = json.map((row) => {
          const normalized: Record<string, string> = {};
          for (const [k, v] of Object.entries(row)) {
            // Skip __EMPTY columns (from merged cells)
            if (String(k).startsWith("__EMPTY")) continue;
            normalized[k] = String(v ?? "").trim();
          }
          return normalized;
        });

        // Filter out rows that are effectively empty after removing __EMPTY cols
        const nonEmptyRows = rows.filter((r) => {
          const vals = Object.values(r) as string[];
          return vals.some((v) => v.length > 0);
        });

        resolve(nonEmptyRows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────
export async function parseUploadedFile(
  file: File,
): Promise<Record<string, string>[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") {
    return parseCSVFile(file);
  }
  if (ext === "xlsx" || ext === "xls") {
    return parseExcelFile(file);
  }
  // Try CSV as fallback
  return parseCSVFile(file);
}

// ─── Detect branch from row ────────────────────────────────────────────────────
function detectBranch(row: Record<string, string>): Branch | null {
  // Try multiple possible column names for department/branch
  const dept = col(
    row,
    "Department",
    "Branch",
    "Dept",
    "department",
    "branch",
    "Discipline",
    "discipline",
    "Program",
    "programme",
    "Stream",
    "stream",
    "Course Branch",
    "coursebranch",
  ).toUpperCase();

  if (!dept) return null;

  for (const b of BRANCHES) {
    if (dept === b) return b;
  }

  // Substring / partial match
  if (
    dept.includes("COMPUTER") ||
    dept.includes("CSE") ||
    dept.includes("IT") ||
    dept.includes("INFORMATION")
  )
    return "CSE";
  if (
    dept.includes("ELECTRONIC") ||
    dept.includes("ECE") ||
    dept.includes("COMM")
  )
    return "ECE";
  if (dept.includes("ELECTRICAL") || dept.includes("EEE")) return "EEE";
  if (
    dept.includes("MECHANICAL") ||
    dept.includes("MECH") ||
    (dept.includes("ME") && !dept.includes("MME") && !dept.includes("MET"))
  )
    return "ME";
  if (
    dept.includes("METALLURG") ||
    dept.includes("MME") ||
    dept.includes("MATERIAL")
  )
    return "MME";
  if (dept.includes("CHEM") || dept.includes("CH")) return "CHEM";
  if (dept.includes("CIVIL") || (dept.includes("CE") && !dept.includes("ECE")))
    return "CE";

  return null;
}

/**
 * Try to parse duration as a number from string.
 * Handles values like "12", "12 weeks", "12 Weeks", "12-week", "12week"
 */
function parseDuration(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/weeks?/g, "")
    .replace(/-/g, "")
    .trim();
  const n = Number.parseInt(cleaned, 10);
  return Number.isNaN(n) ? null : n;
}

// ─── Parse Course File ─────────────────────────────────────────────────────────
/**
 * Parses a course file and returns all 12-week courses.
 * NPTEL course files may have many different column name formats.
 * Supports: Course ID, Course Name, Duration (weeks), Branch/Department
 */
export function parseCourseRows(rows: Record<string, string>[]): Course[] {
  const courses: Course[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // ── Course ID ──
    const courseId = col(
      row,
      "Course ID",
      "CourseID",
      "course_id",
      "courseid",
      "COURSE ID",
      "Course Id",
      "course id",
      "nptel course id",
      "nptelcourseid",
    );

    // ── Course Name ──
    const courseName = col(
      row,
      "Course Name",
      "CourseName",
      "course_name",
      "name",
      "Title",
      "COURSE NAME",
      "Course Title",
      "coursetitle",
      "Subject",
      "subject",
      "NPTEL Course Name",
      "nptelcoursename",
    );

    // ── Duration ──
    // The course file has a column literally named "duration" (beside institute column).
    // Try exact matches first, then broader variations.
    const durationRaw = colExact(
      row,
      "duration",
      "Duration",
      "DURATION",
      "Weeks",
      "weeks",
      "WEEKS",
      "Duration (Weeks)",
      "Course Duration",
      "Weeks Duration",
      "durationweeks",
      "courseduration",
      "Duration in Weeks",
      "No. of Weeks",
      "Number of Weeks",
      "noofweeks",
      "numberofweeks",
      "Week",
      "week",
    );

    const branch = detectBranch(row);

    // Parse duration
    const durationWeeks = parseDuration(durationRaw);

    // Only include 12-week courses.
    // If duration column is present and value is NOT 12, skip the row.
    // If duration value is unparseable but non-empty string exists, still try to skip non-12.
    if (durationWeeks !== null && durationWeeks !== 12) continue;
    // If durationRaw is non-empty but couldn't be parsed as number, treat cautiously:
    // check if it contains "12" to be safe
    if (durationWeeks === null && durationRaw && !durationRaw.includes("12"))
      continue;
    if (!courseId && !courseName) continue;

    courses.push({
      courseId: (courseId || `course-${i}`).trim(),
      courseName: courseName || courseId || `Course ${i + 1}`,
      durationWeeks: 12,
      branch: branch ?? "CSE",
    });
  }
  return courses;
}

// ─── Parse & Validate Enrollment Rows ─────────────────────────────────────────
/**
 * Validates enrollment data rows from an uploaded file.
 * Checks:
 * 1. Email format matches campus pattern
 * 2. Student ID starts with campus prefix letter
 * 3. Course ID year matches current year (noc26-xxx in 2026)
 * 4. If course file uploaded, checks course ID exists in it
 */
export function validateEnrollmentRows(
  rows: Record<string, string>[],
  collegeName: string,
  uploadedCourseIds: string[], // from uploaded course file; empty means skip course-file check
  uploadedCourses: Course[] = [], // full course objects for 12-week duration check
): { records: StudentUploadRecord[]; errors: EnrollmentError[] } {
  const emailPattern = getStudentEmailPattern(collegeName);
  const idPrefix = getStudentIdPrefix(collegeName);
  const currentYear = new Date().getFullYear().toString().slice(-2); // "26" for 2026

  const records: StudentUploadRecord[] = [];
  const errors: EnrollmentError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // ── Extract fields with broad column name matching ──

    const studentId = col(
      row,
      "Student ID",
      "StudentID",
      "student_id",
      "EnrollmentID",
      "Enrollment ID",
      "Roll No",
      "Roll Number",
      "Roll no",
      "RollNo",
      "rollno",
      "rollnumber",
      "STUDENT ID",
      "Reg No",
      "regno",
      "Registration No",
      "Stud ID",
      "studid",
      "Student Roll No",
      "StudentRollNo",
    );

    const email = col(
      row,
      "Email",
      "Email ID",
      "EmailID",
      "email",
      "email_id",
      "Email Address",
      "emailaddress",
      "EMAIL",
      "Email Id",
      "emailid",
      "College Email",
      "collegeemail",
      "Institute Email",
      "instituteemail",
      "College Email/Personal Email",
      "Personal Email",
      "personal_email",
      "College/Personal Email",
      "college_personal_email",
    );

    const courseId = col(
      row,
      "Course ID",
      "CourseID",
      "course_id",
      "COURSE ID",
      "Course Id",
      "courseid",
      "nptel course id",
      "nptelcourseid",
      "Enrollment Course ID",
      "enrollmentcourseid",
    );

    const profession = col(
      row,
      "Profession",
      "Role",
      "profession",
      "role",
      "Type",
      "Occupation",
      "occupation",
      "User Type",
      "usertype",
      "Category",
      "category",
    );

    const durationStr = colExact(
      row,
      "duration",
      "Duration",
      "DURATION",
      "Weeks",
      "Course Duration",
      "Duration (Weeks)",
      "durationweeks",
      "courseduration",
      "Duration in Weeks",
      "No. of Weeks",
    );

    const courseName = col(
      row,
      "Course Name",
      "CourseName",
      "course_name",
      "Course Title",
      "coursetitle",
      "Subject",
    );

    const enrollmentStatus = col(
      row,
      "Enrollment Status",
      "Status",
      "enrollment_status",
      "enrollmentstatus",
      "Enroll Status",
      "enrollstatus",
    );

    const name = col(
      row,
      "Name",
      "Student Name",
      "studentname",
      "Full Name",
      "fullname",
      "Candidate Name",
      "candidatename",
    );

    // Skip completely empty rows
    if (!studentId && !email && !courseId) continue;

    // Skip faculty rows
    if (profession?.toLowerCase().includes("faculty")) continue;

    const branch = detectBranch(row) ?? "CSE";
    const durationWeeks = parseDuration(durationStr) ?? undefined;

    const record: StudentUploadRecord = {
      studentId,
      email,
      name: name || undefined,
      courseId,
      branch,
      courseName: courseName || undefined,
      durationWeeks,
      enrollmentStatus: enrollmentStatus || undefined,
      profession: profession || "Student",
    };
    records.push(record);

    // ── Validation checks (all checks run independently per row, multiple errors possible) ──

    // Helper: extract the prefix letter from student ID (first character)
    const _studentIdLetter = studentId ? studentId.charAt(0).toLowerCase() : "";
    // Valid student ID format: campus-letter + exactly 6 digits (e.g. n200623, s120042)
    const validStudentIdFormat = /^[a-z]\d{6}$/i;

    // 1. Email format check
    if (!email) {
      errors.push({
        id: `enroll-noemail-${i}`,
        studentId,
        email: "(missing)",
        courseId,
        errorType: "Missing Email",
        details: "No email provided",
        courseName: courseName || undefined,
        branch,
      });
    } else if (!emailPattern.test(email)) {
      errors.push({
        id: `enroll-email-${i}`,
        studentId,
        email,
        courseId,
        errorType: "Invalid Email",
        details: "Invalid email format for this campus",
        courseName: courseName || undefined,
        branch,
      });
    }

    // 2. Student ID format check (must be campus-letter + exactly 6 digits)
    if (!studentId) {
      errors.push({
        id: `enroll-noid-${i}`,
        studentId: "(missing)",
        email,
        courseId,
        errorType: "Missing Student ID",
        details: "No student ID provided",
        courseName: courseName || undefined,
        branch,
      });
    } else if (!validStudentIdFormat.test(studentId)) {
      errors.push({
        id: `enroll-idformat-${i}`,
        studentId,
        email,
        courseId,
        errorType: "Invalid Student ID Format",
        details: "Invalid ID format (expected: campus letter + 6 digits)",
        courseName: courseName || undefined,
        branch,
      });
    } else if (!studentId.toLowerCase().startsWith(idPrefix)) {
      // Student ID format is valid (letter + 6 digits) but wrong campus prefix
      errors.push({
        id: `enroll-id-${i}`,
        studentId,
        email,
        courseId,
        errorType: "Invalid Student ID Prefix",
        details: "Wrong campus prefix in student ID",
        courseName: courseName || undefined,
        branch,
      });
    }

    // ── Course ID Validation (3 independent points) ──

    // Point 1: Check that a course ID column exists and has a value
    if (!courseId) {
      errors.push({
        id: `enroll-nocourse-${i}`,
        studentId,
        email,
        courseId: "(missing)",
        errorType: "Missing Course ID",
        details: "Mismatch of course id - in uploaded data by hod/dean",
        courseName: courseName || undefined,
        branch,
      });
    } else {
      // Point 2: Enrollment course ID format must be noc<YY>-<subject> (hyphen separator)
      // e.g. noc26-ec50
      const enrollFormatRegex = /^noc\d{2}-[a-z0-9]+/i;
      const courseYearMatch = courseId.match(/noc(\d{2})[-_]/i);

      if (!enrollFormatRegex.test(courseId)) {
        errors.push({
          id: `enroll-format-${i}`,
          studentId,
          email,
          courseId,
          errorType: "Invalid Course ID Format",
          details: `Wrong course ID format (expected: noc${currentYear}-xxx for enrollment)`,
          courseName: courseName || undefined,
          branch,
        });
      } else if (courseYearMatch && courseYearMatch[1] !== currentYear) {
        // Year mismatch (format is correct but year is wrong)
        errors.push({
          id: `enroll-year-${i}`,
          studentId,
          email,
          courseId,
          errorType: "Course ID Year Mismatch",
          details: `Course ID year mismatch (expected noc${currentYear})`,
          courseName: courseName || undefined,
          branch,
        });
      }

      // Course duration must be 12 weeks (separate check, independent)
      if (durationWeeks !== undefined && durationWeeks !== 12) {
        errors.push({
          id: `enroll-duration-${i}`,
          studentId,
          email,
          courseId,
          errorType: "Invalid Course Duration",
          details: "Course is not 12 weeks",
          courseName: courseName || undefined,
          branch,
        });
      }

      // Point 3: Course ID must exist in dean's uploaded course file (only if course file uploaded)
      if (uploadedCourseIds.length > 0) {
        const normEnrollId = courseId.toLowerCase().trim();
        const matchedCourse = uploadedCourses.find(
          (c) => c.courseId.toLowerCase().trim() === normEnrollId,
        );
        if (
          !matchedCourse &&
          !uploadedCourseIds.some(
            (c) => c.toLowerCase().trim() === normEnrollId,
          )
        ) {
          errors.push({
            id: `enroll-coursefile-${i}`,
            studentId,
            email,
            courseId,
            errorType: "Course Not in Course File",
            details: "Course ID not found in dean's course file",
            courseName: courseName || undefined,
            branch,
          });
        } else if (matchedCourse && matchedCourse.durationWeeks !== 12) {
          // Course found in file but is NOT a 12-week course
          errors.push({
            id: `enroll-not12week-${i}`,
            studentId,
            email,
            courseId,
            errorType: "Not a 12-week Course",
            details: "Not a 12-week course",
            courseName: courseName || undefined,
            branch,
          });
        }
      }
    }
  }

  return { records, errors };
}

// ─── Parse & Validate Exam Registration Rows ──────────────────────────────────
/**
 * Validates exam registration rows.
 * Payment Failed / Payment Complete = Done (registered)
 * Payment Pending / Payment Draft = Redo Registration
 * Anything else = Do First Registration
 *
 * Course ID format in exam reg uses underscores: ns_noc26_ec50
 *
 * 3-point course ID validation:
 * Point 1: Course ID column must exist and have a value
 * Point 2: Format must be ns_noc<YY>_<subject> (e.g. ns_noc26_ec50)
 * Point 3: Course ID (normalized) must exist in dean's uploaded course file
 *
 * Also validates email format for the campus (same as enrollment).
 */
export function validateExamRegRows(
  rows: Record<string, string>[],
  _enrollmentStudentIds: string[], // to cross-check
  uploadedCourseIds: string[] = [], // from uploaded course file; empty means skip course-file check
  collegeName = "", // used for email validation
): ExamRegError[] {
  const errors: ExamRegError[] = [];
  const currentYear = new Date().getFullYear().toString().slice(-2); // "26" for 2026

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const studentId = col(
      row,
      "Student ID",
      "StudentID",
      "student_id",
      "Enrollment ID",
      "EnrollmentID",
      "enrollment_id",
      "Roll No",
      "Roll Number",
      "Roll no",
      "RollNo",
      "rollno",
      "rollnumber",
      "Reg No",
      "regno",
      "Registration No",
      "registrationno",
      "Stud ID",
      "studid",
      "Student Roll No",
      "StudentRollNo",
      "STUDENT ID",
      "Id No",
      "idno",
      "ID No",
    );

    const email = col(
      row,
      "Email",
      "Email ID",
      "EmailID",
      "email",
      "email_id",
      "Email Address",
      "emailaddress",
      "EMAIL",
      "Email Id",
      "emailid",
      "College Email",
      "collegeemail",
      "Institute Email",
      "instituteemail",
      "Student Email",
      "studentemail",
      "Mail ID",
      "mailid",
      "College Email/Personal Email",
      "Personal Email",
      "personal_email",
      "College/Personal Email",
      "college_personal_email",
    );

    const courseId = col(
      row,
      "Course ID",
      "CourseID",
      "course_id",
      "COURSE ID",
      "Course Id",
      "courseid",
      "nptel course id",
      "nptelcourseid",
      "Exam Course ID",
      "examcourseid",
    );

    const paymentStatus = col(
      row,
      "Payment Status",
      "PaymentStatus",
      "payment_status",
      "Payment",
      "Status",
      "paymentstatus",
      "Payment State",
      "paymentstate",
      "Exam Payment Status",
      "exampaymentstatus",
      "Transaction Status",
      "transactionstatus",
    );

    const profession = col(
      row,
      "Profession",
      "Role",
      "profession",
      "role",
      "Type",
      "User Type",
      "usertype",
      "Category",
      "category",
    );

    const courseName = col(
      row,
      "Course Name",
      "CourseName",
      "course_name",
      "Course Title",
      "coursetitle",
      "Subject",
    );

    // Skip empty rows
    if (!studentId && !courseId) continue;

    // Skip faculty rows
    if (profession?.toLowerCase().includes("faculty")) continue;

    const branch = detectBranch(row) ?? "CSE";

    // Classify payment status
    const s = paymentStatus.toLowerCase().trim();
    let classification: string;
    let errorType: string;
    let shouldAddError = false;

    // Normalize: treat underscores the same as spaces (e.g. "payment_failed" === "payment failed")
    const sNorm = s.replace(/_/g, " ");
    if (
      sNorm === "payment failed" ||
      sNorm === "failed" ||
      sNorm === "payment complete" ||
      sNorm === "complete"
    ) {
      classification = "Done";
      shouldAddError = false; // Done = registered successfully, no error
    } else if (
      sNorm === "payment pending" ||
      sNorm === "pending" ||
      sNorm === "payment draft" ||
      sNorm === "draft"
    ) {
      classification = "Redo Registration";
      errorType = sNorm.includes("draft") ? "Payment Draft" : "Payment Pending";
      shouldAddError = true;
    } else {
      // Anything else = Do First Registration
      classification = "Do First Registration";
      errorType = "Not Registered";
      shouldAddError = true;
    }

    if (shouldAddError) {
      errors.push({
        id: `examreg-pay-${i}`,
        studentId,
        email,
        courseId,
        paymentStatus,
        classification,
        // @ts-expect-error errorType is defined in shouldAddError=true branches
        errorType,
        details:
          classification === "Redo Registration"
            ? "Re-do registration required (payment pending)"
            : "Registration not done",
        courseName: courseName || undefined,
        branch,
      });
    }

    // ── Email validation for exam reg (same rules as enrollment) ──
    if (collegeName) {
      const emailPattern = getStudentEmailPattern(collegeName);
      const _emailDomain = getStudentEmailDomain(collegeName);
      if (!email) {
        errors.push({
          id: `examreg-noemail-${i}`,
          studentId,
          email: "(missing)",
          courseId,
          paymentStatus,
          classification: "Invalid",
          errorType: "Missing Email",
          details: "No email provided",
          courseName: courseName || undefined,
          branch,
        });
      } else if (!emailPattern.test(email)) {
        errors.push({
          id: `examreg-email-${i}`,
          studentId,
          email,
          courseId,
          paymentStatus,
          classification: "Invalid",
          errorType: "Invalid Email",
          details: "Invalid email format for this campus",
          courseName: courseName || undefined,
          branch,
        });
      }
    }

    // ── Course ID Validation (3 independent points) ──

    // Point 1: Course ID column must exist and have a value
    if (!courseId) {
      errors.push({
        id: `examreg-nocourse-${i}`,
        studentId,
        email,
        courseId: "(missing)",
        paymentStatus,
        classification: "Invalid",
        errorType: "Missing Course ID",
        details: "Mismatch of course id - in uploaded data by hod/dean",
        courseName: courseName || undefined,
        branch,
      });
    } else {
      // Point 2: Exam Registration course ID format must be ns_noc<YY>_<subject> (underscore separators)
      // e.g. ns_noc26_ec50
      const examFormatRegex = /^ns_noc\d{2}_[a-z0-9]+/i;
      const courseYearMatch = courseId.match(/noc(\d{2})_/i);

      if (!examFormatRegex.test(courseId)) {
        errors.push({
          id: `examreg-format-${i}`,
          studentId,
          email,
          courseId,
          paymentStatus,
          classification: "Invalid",
          errorType: "Invalid Course ID Format",
          details: `Wrong course ID format (expected: ns_noc${currentYear}_xxx for exam reg)`,
          courseName: courseName || undefined,
          branch,
        });
      } else if (courseYearMatch && courseYearMatch[1] !== currentYear) {
        // Year mismatch (format is correct but year is wrong)
        errors.push({
          id: `examreg-year-${i}`,
          studentId,
          email,
          courseId,
          paymentStatus,
          classification: "Invalid",
          errorType: "Course ID Year Mismatch",
          details: `Course ID year mismatch (expected noc${currentYear})`,
          courseName: courseName || undefined,
          branch,
        });
      }

      // Point 3: Normalize exam reg ID to enrollment format for course file lookup
      // ns_noc26_ec50 → noc26-ec50 (remove ns_ prefix, replace underscores with hyphens)
      if (uploadedCourseIds.length > 0) {
        const normalizedForLookup = courseId
          .toLowerCase()
          .trim()
          .replace(/^ns_/, "") // remove ns_ prefix
          .replace(/_/g, "-"); // replace underscores with hyphens for course file comparison
        const foundInCourseFile = uploadedCourseIds.some(
          (c) =>
            c.toLowerCase().trim() === normalizedForLookup ||
            c.toLowerCase().trim() === courseId.toLowerCase().trim(),
        );
        if (!foundInCourseFile) {
          errors.push({
            id: `examreg-coursefile-${i}`,
            studentId,
            email,
            courseId,
            paymentStatus,
            classification: "Invalid",
            errorType: "Course Not in Course File",
            details: "Course ID not found in dean's course file",
            courseName: courseName || undefined,
            branch,
          });
        }
      }
    }
  }

  return errors;
}

// ─── Parse Exam Shuffle File ──────────────────────────────────────────────────
/**
 * Parses a dean-uploaded exam shuffle file (CSV or Excel).
 * Extracts exam center, date, slot, hall ticket, and course info per student.
 * All students in this file are included (regardless of payment status).
 */
export function parseExamShuffleRows(
  rows: Record<string, string>[],
): ExamShuffleUploadRecord[] {
  const records: ExamShuffleUploadRecord[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const studentId = col(
      row,
      "Student ID",
      "StudentID",
      "student_id",
      "Roll No",
      "RollNo",
      "rollno",
      "Roll Number",
      "Reg No",
      "regno",
      "Registration No",
      "Id No",
      "idno",
      "ID No",
      "STUDENT ID",
    );

    const email = col(
      row,
      "Email",
      "Email ID",
      "EmailID",
      "email",
      "email_id",
      "College Email",
      "collegeemail",
      "Institute Email",
      "instituteemail",
      "Student Email",
      "Mail ID",
      "mailid",
    );

    const courseId = col(
      row,
      "Course ID",
      "CourseID",
      "course_id",
      "COURSE ID",
      "nptel course id",
      "nptelcourseid",
      "Exam Course ID",
      "examcourseid",
      "Course Code",
      "coursecode",
    );

    const courseName = col(
      row,
      "Course Name",
      "CourseName",
      "course_name",
      "Course Title",
      "coursetitle",
      "Subject",
    );

    const examCenter = col(
      row,
      "Exam Center",
      "ExamCenter",
      "exam_center",
      "Center",
      "center",
      "Exam Venue",
      "examvenue",
      "Venue",
      "venue",
      "City",
      "city",
      "Examination Center",
      "examinationcenter",
    );

    const examDate = col(
      row,
      "Exam Date",
      "ExamDate",
      "exam_date",
      "Date",
      "date",
      "Examination Date",
      "examinationdate",
      "Test Date",
      "testdate",
    );

    const examSlot = col(
      row,
      "Slot",
      "slot",
      "Time Slot",
      "timeslot",
      "Exam Slot",
      "examslot",
      "Session",
      "session",
      "Time",
      "time",
      "Exam Time",
      "examtime",
    );

    const hallTicketNo = col(
      row,
      "Hall Ticket No",
      "HallTicketNo",
      "hallticketno",
      "Hall Ticket",
      "hallticket",
      "Ticket No",
      "ticketno",
      "Admit Card No",
      "admitcardno",
    );

    const name = col(
      row,
      "Name",
      "Student Name",
      "studentname",
      "Full Name",
      "fullname",
      "Candidate Name",
      "candidatename",
    );

    const profession = col(
      row,
      "Profession",
      "Role",
      "profession",
      "role",
      "Type",
      "User Type",
      "usertype",
    );

    const seatingNumber = col(
      row,
      "Seating Number",
      "seatingnumber",
      "seating_number",
      "Seating No",
      "seatingno",
      "Seating Position",
      "seatingposition",
      "seating_position",
      "Seat No",
      "seatno",
      "Seat Number",
      "seatnumber",
      "Seat",
      "seat",
    );

    // Skip completely empty rows
    if (!studentId && !email && !courseId) continue;

    // Skip faculty rows
    if (profession?.toLowerCase().includes("faculty")) continue;

    const branch = detectBranch(row) ?? "CSE";

    records.push({
      studentId: studentId || "",
      email: email || "",
      name: name || undefined,
      branch,
      courseId: courseId || "",
      courseName: courseName || undefined,
      examCenter: examCenter || undefined,
      examDate: examDate || undefined,
      examSlot: examSlot || undefined,
      hallTicketNo: hallTicketNo || undefined,
      seatingNumber: seatingNumber || undefined,
    });
  }

  return records;
}

// ─── Parse Student Records from Exam Reg File (for statistics) ───────────────
export function parseExamRegRecords(
  rows: Record<string, string>[],
): StudentUploadRecord[] {
  const records: StudentUploadRecord[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const studentId = col(
      row,
      "Student ID",
      "StudentID",
      "student_id",
      "Enrollment ID",
      "Roll No",
      "RollNo",
      "rollno",
      "Reg No",
    );
    const courseId = col(row, "Course ID", "CourseID", "course_id", "courseid");
    const paymentStatus = col(
      row,
      "Payment Status",
      "PaymentStatus",
      "payment_status",
      "Payment",
      "Status",
      "paymentstatus",
    );
    const profession = col(
      row,
      "Profession",
      "Role",
      "profession",
      "role",
      "Type",
      "User Type",
      "usertype",
    );

    if (!studentId && !courseId) continue;
    if (profession?.toLowerCase().includes("faculty")) continue;

    const branch = detectBranch(row) ?? "CSE";

    records.push({
      studentId,
      email: col(row, "Email", "Email ID", "EmailID", "email"),
      courseId: courseId.replace(/_/g, "-"), // normalize for internal use
      examCourseId: courseId,
      paymentStatus,
      branch,
      profession: profession || "Student",
    });
  }
  return records;
}

// ─── Cross-match Enrollment vs Exam Registration ──────────────────────────────

export interface CrossMatchError {
  studentId: string;
  email: string;
  courseId: string;
  courseName?: string;
  errorType: "Missing Exam Registration" | "Missing Enrollment";
  details: string;
  branch: string;
}

/** Normalize a course ID to enrollment format: noc26-ec50 */
function normalizeCourseId(id: string): string {
  return id.trim().toLowerCase().replace(/^ns_/, "").replace(/_/g, "-");
}

/**
 * Cross-checks enrollment records against exam registration records for 12-week courses.
 * - Enrolled in a 12-week course but no exam reg found → "Missing Exam Registration"
 * - Exam reg for a 12-week course but no enrollment found → "Missing Enrollment"
 */
export function crossMatchEnrollmentExamReg(
  enrollmentRecords: StudentUploadRecord[],
  examRegRecords: StudentUploadRecord[],
  uploadedCourses: Course[],
): CrossMatchError[] {
  const errors: CrossMatchError[] = [];
  const twelveWeekCourseIds = new Set(
    uploadedCourses.map((c) => normalizeCourseId(c.courseId)),
  );
  if (twelveWeekCourseIds.size === 0) return errors;

  const courseNameMap = new Map(
    uploadedCourses.map((c) => [normalizeCourseId(c.courseId), c.courseName]),
  );

  // Build set of {studentId}::{courseId} from exam reg
  const examRegSet = new Set<string>();
  for (const r of examRegRecords) {
    const normCourse = normalizeCourseId(r.examCourseId ?? r.courseId);
    if (twelveWeekCourseIds.has(normCourse)) {
      examRegSet.add(`${r.studentId.trim().toLowerCase()}::${normCourse}`);
    }
  }

  // Build set of {studentId}::{courseId} from enrollment
  const enrollSet = new Set<string>();
  for (const r of enrollmentRecords) {
    const normCourse = normalizeCourseId(r.courseId);
    if (twelveWeekCourseIds.has(normCourse)) {
      enrollSet.add(`${r.studentId.trim().toLowerCase()}::${normCourse}`);
    }
  }

  // Check enrollment → exam reg
  for (const r of enrollmentRecords) {
    const normCourse = normalizeCourseId(r.courseId);
    if (!twelveWeekCourseIds.has(normCourse)) continue;
    const key = `${r.studentId.trim().toLowerCase()}::${normCourse}`;
    if (!examRegSet.has(key)) {
      errors.push({
        studentId: r.studentId,
        email: r.email,
        courseId: r.courseId,
        courseName: r.courseName ?? courseNameMap.get(normCourse),
        errorType: "Missing Exam Registration",
        details:
          "Enrolled in this 12-week course but no exam registration found",
        branch: r.branch,
      });
    }
  }

  // Check exam reg → enrollment
  for (const r of examRegRecords) {
    const normCourse = normalizeCourseId(r.examCourseId ?? r.courseId);
    if (!twelveWeekCourseIds.has(normCourse)) continue;
    const key = `${r.studentId.trim().toLowerCase()}::${normCourse}`;
    if (!enrollSet.has(key)) {
      errors.push({
        studentId: r.studentId,
        email: r.email,
        courseId: r.examCourseId ?? r.courseId,
        courseName: r.courseName ?? courseNameMap.get(normCourse),
        errorType: "Missing Enrollment",
        details:
          "Exam registration found but no enrollment record for this course",
        branch: r.branch,
      });
    }
  }

  return errors;
}
