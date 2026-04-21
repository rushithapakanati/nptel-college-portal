/**
 * File parser for CSV and Excel files (browser-native + SheetJS).
 * Handles 100,000+ rows; all validation is applied to real uploaded data only.
 */

import type {
  Branch,
  Course,
  EnrollmentError,
  ExamRegError,
  ExamShuffleUploadRecord,
  StudentUploadRecord,
} from "../data/mockData";
import { BRANCHES, isValidStudentEmail } from "../data/mockData";

// ─── Column normalizer ────────────────────────────────────────────────────────

const _normCache = new Map<string, string>();

export function normCol(s: string): string {
  const cached = _normCache.get(s);
  if (cached !== undefined) return cached;
  const result = s
    .trim()
    .toLowerCase()
    .replace(/[\s_\-\/\(\)\.]+/g, "");
  _normCache.set(s, result);
  return result;
}

// Column variant lists
export const ROLL_NO_COLS = [
  "rollno",
  "studentid",
  "enrollmentid",
  "idno",
  "studentrollno",
  "regno",
  "registrationno",
  "rollnumber",
];
export const NAME_COLS = ["name", "studentname", "fullname", "candidatename"];
export const EMAIL_COLS = [
  "email",
  "mailid",
  "collegemail",
  "personalmail",
  "collegeemailpersonalemail",
  "emailid",
  "collegeemail",
  "emailaddress",
  "instituteemail",
];
export const COURSE_ID_COLS = [
  "courseid",
  "course_id",
  "nptelcourseid",
  "courseidentifier",
  "examcourseid",
];
export const COURSE_NAME_COLS = [
  "coursename",
  "course",
  "nptelcourse",
  "coursetitle",
  "subject",
  "nptelcoursename",
];
export const DURATION_COLS = [
  "duration",
  "weeks",
  "courseduration",
  "durationweeks",
  "noofweeks",
  "numberofweeks",
  "durationinweeks",
];
export const PAYMENT_STATUS_COLS = [
  "paymentstatus",
  "payment",
  "status",
  "registrationstatus",
  "paymentstate",
  "transactionstatus",
];
export const ENROLLMENT_STATUS_COLS = [
  "enrollmentstatus",
  "enrolled",
  "status",
  "enrollstatus",
];
export const SEATING_COLS = [
  "seatingnumber",
  "seatingposition",
  "seatingno",
  "seatno",
  "seatnumber",
  "seat",
];
export const EXAM_CENTER_COLS = [
  "examcenter",
  "center",
  "venue",
  "examinationcenter",
  "examvenue",
  "city",
];
export const EXAM_DATE_COLS = [
  "examdate",
  "date",
  "examinationdate",
  "testdate",
];
export const TIME_SLOT_COLS = [
  "timeslot",
  "slot",
  "time",
  "examtime",
  "examslot",
  "session",
];
export const HALL_TICKET_COLS = [
  "hallticketno",
  "hallticket",
  "ticketno",
  "admitcard",
  "admitcardno",
];

/** Find a column header among a row by checking normalized variant names */
export function findCol(
  headers: string[],
  variants: string[],
): string | undefined {
  const normVariants = variants.map(normCol);
  // 1. Exact normalized match
  for (const h of headers) {
    const nh = normCol(h);
    if (normVariants.includes(nh)) return h;
  }
  // 2. Header contains variant as substring (min 4 chars)
  for (const variant of normVariants) {
    if (variant.length < 4) continue;
    for (const h of headers) {
      if (normCol(h).includes(variant)) return h;
    }
  }
  // 3. Variant contains header as substring (header >= 5 chars)
  for (const h of headers) {
    const nh = normCol(h);
    if (nh.length >= 5) {
      for (const variant of normVariants) {
        if (variant.includes(nh)) return h;
      }
    }
  }
  return undefined;
}

/** Extract a value from a row using variant column names */
function getVal(row: Record<string, string>, variants: string[]): string {
  const headers = Object.keys(row);
  const matched = findCol(headers, variants);
  return matched ? (row[matched] ?? "").trim() : "";
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

export function parseCSVText(text: string): Record<string, string>[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = splitLines(normalized);
  if (lines.length === 0) return [];
  const headers = parseCSVLine(lines[0]);
  if (headers.length === 0) return [];
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
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

function splitLines(text: string): string[] {
  const lines: string[] = [];
  let cur = "";
  let inQ = false;
  for (const ch of text) {
    if (ch === '"') {
      inQ = !inQ;
      cur += ch;
    } else if (ch === "\n" && !inQ) {
      lines.push(cur);
      cur = "";
    } else cur += ch;
  }
  if (cur) lines.push(cur);
  return lines;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        field += '"';
        i++;
      } else inQ = !inQ;
    } else if (ch === "," && !inQ) {
      fields.push(field.trim());
      field = "";
    } else field += ch;
  }
  fields.push(field.trim());
  return fields;
}

// ─── Header row detection ─────────────────────────────────────────────────────

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
  "nptel",
  "registration",
  "college",
  "institute",
];
const ANCHOR_KEYWORDS = [
  "course id",
  "courseid",
  "roll no",
  "rollno",
  "student id",
  "studentid",
  "email",
  "enrollment",
  "course name",
  "coursename",
];

function rowLooksLikeHeader(vals: string[]): boolean {
  let matches = 0;
  let hasAnchor = false;
  for (const val of vals) {
    const v = val.toLowerCase().trim();
    if (!v || v.startsWith("__empty")) continue;
    if (!hasAnchor) {
      for (const a of ANCHOR_KEYWORDS) {
        if (v === a || v.includes(a)) {
          hasAnchor = true;
          break;
        }
      }
    }
    for (const kw of HEADER_KEYWORDS) {
      if (v.includes(kw)) {
        matches++;
        break;
      }
    }
  }
  return matches >= 3 && hasAnchor;
}

// ─── Excel Parser (SheetJS via CDN) ───────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type XLSXLib = any;
let _xlsxCache: XLSXLib | null = null;

export async function loadXLSX(): Promise<XLSXLib> {
  if (_xlsxCache) return _xlsxCache;
  if (
    typeof window !== "undefined" &&
    (window as Window & { XLSX?: XLSXLib }).XLSX
  ) {
    _xlsxCache = (window as Window & { XLSX?: XLSXLib }).XLSX;
    return _xlsxCache;
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
    s.onload = () => {
      const lib = (window as Window & { XLSX?: XLSXLib }).XLSX;
      if (lib) {
        _xlsxCache = lib;
        resolve(lib);
      } else reject(new Error("XLSX library not found after script load"));
    };
    s.onerror = () => reject(new Error("Failed to load XLSX from CDN"));
    document.head.appendChild(s);
  });
}

export function parseExcelBuffer(
  buffer: ArrayBuffer,
): Record<string, string>[] {
  const XLSX = _xlsxCache;
  if (!XLSX)
    throw new Error(
      "XLSX library not loaded — call parseFile() which loads it async",
    );
  const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const ws = workbook.Sheets[sheetName];
  const rawArrays = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: "",
    raw: false,
  }) as string[][];

  // Find header row (scan first 20)
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(20, rawArrays.length); i++) {
    const vals = rawArrays[i].map((v: unknown) => String(v ?? "").trim());
    if (rowLooksLikeHeader(vals)) {
      headerRowIndex = i;
      break;
    }
  }

  const json = XLSX.utils.sheet_to_json(ws, {
    defval: "",
    raw: false,
    range: headerRowIndex,
  }) as Record<string, unknown>[];
  return json
    .map((row) => {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(row)) {
        if (String(k).startsWith("__EMPTY")) continue;
        out[k] = String(v ?? "").trim();
      }
      return out;
    })
    .filter((r) => Object.values(r).some((v) => v.length > 0));
}

/** Auto-detect CSV or Excel and parse. Async — loads XLSX lib if needed. */
export async function parseFile(file: File): Promise<Record<string, string>[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          resolve(parseCSVText(e.target!.result as string));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read CSV"));
      reader.readAsText(file, "utf-8");
    });
  }
  // Excel
  const XLSX = await loadXLSX();
  _xlsxCache = XLSX;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        resolve(parseExcelBuffer(e.target!.result as ArrayBuffer));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read Excel file"));
    reader.readAsArrayBuffer(file);
  });
}

// ─── Branch detection ─────────────────────────────────────────────────────────

function detectBranch(row: Record<string, string>): Branch {
  const dept = getVal(row, [
    "department",
    "branch",
    "dept",
    "discipline",
    "program",
    "programme",
    "stream",
    "coursebranch",
  ]).toUpperCase();
  if (!dept) return "CSE";
  for (const b of BRANCHES) {
    if (dept === b) return b;
  }
  if (
    dept.includes("COMPUTER") ||
    dept.includes("CSE") ||
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
    dept.includes("METALLURG") ||
    dept.includes("MME") ||
    dept.includes("MATERIAL")
  )
    return "MME";
  if (
    dept.includes("MECHANICAL") ||
    (dept.includes("ME") && !dept.includes("MME"))
  )
    return "ME";
  if (dept.includes("CHEM") || (dept.includes("CH") && !dept.includes("ECE")))
    return "CHEM";
  if (dept.includes("CIVIL") || (dept.includes("CE") && !dept.includes("ECE")))
    return "CE";
  return "CSE";
}

// ─── Validation Regexes ───────────────────────────────────────────────────────

const COURSE_ID_REGEX = /^[a-zA-Z0-9]{6,15}$/;
const PERSONAL_EMAIL_REGEX =
  /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

// ─── Enrollment Validator ─────────────────────────────────────────────────────

export function validateEnrollmentErrors(
  rows: Record<string, string>[],
  campus: string,
  branch: string,
  source: "dean" | "hod",
  twelveWeekCourses: Course[],
): { records: StudentUploadRecord[]; errors: EnrollmentError[] } {
  const records: StudentUploadRecord[] = [];
  const errors: EnrollmentError[] = [];
  const courseIdSet = new Set(
    twelveWeekCourses.map((c) => c.courseId.toLowerCase().trim()),
  );

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const studentId = getVal(row, ROLL_NO_COLS);
    const email = getVal(row, EMAIL_COLS);
    const courseId = getVal(row, COURSE_ID_COLS);
    const courseName = getVal(row, COURSE_NAME_COLS) || courseId;
    const name = getVal(row, NAME_COLS);
    const duration = getVal(row, DURATION_COLS);
    const enrollmentStatus = getVal(row, ENROLLMENT_STATUS_COLS);
    const paymentStatus = getVal(row, PAYMENT_STATUS_COLS);

    const profession = getVal(row, [
      "profession",
      "role",
      "type",
      "usertype",
      "category",
      "occupation",
    ]);
    if (profession.toLowerCase().includes("faculty")) continue;
    if (!studentId && !email && !courseId) continue;

    const detectedBranch = (branch as Branch) || detectBranch(row);

    const record: StudentUploadRecord = {
      studentId,
      name: name || undefined,
      email,
      courseId,
      courseName: courseName || undefined,
      duration: duration || undefined,
      enrollmentStatus: enrollmentStatus || undefined,
      paymentStatus: paymentStatus || undefined,
      branch: detectedBranch as Branch,
      source,
      hodBranch: source === "hod" ? branch : undefined,
    };
    records.push(record);

    const rowCourseId = courseId;
    const rowCourseName = courseName || courseId || "Unknown Course";

    // Missing course ID
    if (!rowCourseId) {
      errors.push({
        id: `enroll-nocid-${i}`,
        studentId,
        name: name || undefined,
        email,
        courseId: "",
        courseName: rowCourseName,
        branch: detectedBranch as Branch,
        errorType: "missing_course_id",
        description: "Mismatch of course ID in uploaded data",
        source,
      });
      continue;
    }

    // Course ID format
    if (!COURSE_ID_REGEX.test(rowCourseId.replace(/-_/g, ""))) {
      errors.push({
        id: `enroll-badcid-${i}`,
        studentId,
        name: name || undefined,
        email,
        courseId: rowCourseId,
        courseName: rowCourseName,
        branch: detectedBranch as Branch,
        errorType: "invalid_course_id",
        description: "Course ID format is invalid",
        source,
      });
    }

    // Missing email
    if (!email) {
      errors.push({
        id: `enroll-noemail-${i}`,
        studentId,
        name: name || undefined,
        email: "(missing)",
        courseId: rowCourseId,
        courseName: rowCourseName,
        branch: detectedBranch as Branch,
        errorType: "missing_email",
        description: "Email not found in uploaded data",
        source,
      });
    } else if (
      !isValidStudentEmail(email, campus) &&
      !PERSONAL_EMAIL_REGEX.test(email)
    ) {
      errors.push({
        id: `enroll-bademail-${i}`,
        studentId,
        name: name || undefined,
        email,
        courseId: rowCourseId,
        courseName: rowCourseName,
        branch: detectedBranch as Branch,
        errorType: "invalid_email",
        description: "Email format is invalid",
        source,
      });
    }

    // 12-week course cross-match
    if (courseIdSet.size > 0 && rowCourseId) {
      const norm = rowCourseId.toLowerCase().trim();
      if (!courseIdSet.has(norm)) {
        errors.push({
          id: `enroll-cmatch-${i}`,
          studentId,
          name: name || undefined,
          email,
          courseId: rowCourseId,
          courseName: rowCourseName,
          branch: detectedBranch as Branch,
          errorType: "course_mismatch",
          description: "Course not found in 12-week course list",
          source,
        });
      }
    }
  }

  return { records, errors };
}

// ─── Exam Reg Validator ───────────────────────────────────────────────────────

export function validateExamRegErrors(
  rows: Record<string, string>[],
  campus: string,
  _branch: string,
  twelveWeekCourses: Course[],
): { records: StudentUploadRecord[]; errors: ExamRegError[] } {
  const records: StudentUploadRecord[] = [];
  const errors: ExamRegError[] = [];
  const courseIdSet = new Set(
    twelveWeekCourses.map((c) => c.courseId.toLowerCase().trim()),
  );

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const studentId = getVal(row, ROLL_NO_COLS);
    const email = getVal(row, EMAIL_COLS);
    const courseId = getVal(row, COURSE_ID_COLS);
    const courseName = getVal(row, COURSE_NAME_COLS) || courseId;
    const name = getVal(row, NAME_COLS);
    const paymentStatus = getVal(row, PAYMENT_STATUS_COLS);

    const profession = getVal(row, [
      "profession",
      "role",
      "type",
      "usertype",
      "category",
      "occupation",
    ]);
    if (profession.toLowerCase().includes("faculty")) continue;
    if (!studentId && !email && !courseId) continue;

    const detectedBranch = detectBranch(row);

    const record: StudentUploadRecord = {
      studentId,
      name: name || undefined,
      email,
      courseId,
      courseName: courseName || undefined,
      paymentStatus: paymentStatus || undefined,
      branch: detectedBranch,
      source: "dean",
    };
    records.push(record);

    const rowCourseName = courseName || courseId || "Unknown Course";

    // Missing course ID
    if (!courseId) {
      errors.push({
        id: `examreg-nocid-${i}`,
        studentId,
        name: name || undefined,
        email,
        courseId: "",
        courseName: rowCourseName,
        branch: detectedBranch,
        errorType: "missing_course_id",
        description: "Mismatch of course ID in uploaded data",
        paymentStatus,
      });
      continue;
    }

    // Course ID format
    if (!COURSE_ID_REGEX.test(courseId.replace(/[-_]/g, ""))) {
      errors.push({
        id: `examreg-badcid-${i}`,
        studentId,
        name: name || undefined,
        email,
        courseId,
        courseName: rowCourseName,
        branch: detectedBranch,
        errorType: "invalid_course_id",
        description: "Course ID format is invalid",
        paymentStatus,
      });
    }

    // Missing email
    if (!email) {
      errors.push({
        id: `examreg-noemail-${i}`,
        studentId,
        name: name || undefined,
        email: "(missing)",
        courseId,
        courseName: rowCourseName,
        branch: detectedBranch,
        errorType: "missing_email",
        description: "Email not found in uploaded data",
        paymentStatus,
      });
    } else if (
      !isValidStudentEmail(email, campus) &&
      !PERSONAL_EMAIL_REGEX.test(email)
    ) {
      errors.push({
        id: `examreg-bademail-${i}`,
        studentId,
        name: name || undefined,
        email,
        courseId,
        courseName: rowCourseName,
        branch: detectedBranch,
        errorType: "invalid_email",
        description: "Email format is invalid",
        paymentStatus,
      });
    }

    // Payment issues
    if (paymentStatus) {
      const s = paymentStatus.toLowerCase().trim().replace(/[_\s]/g, "");
      const isDone =
        s === "paymentcomplete" ||
        s === "complete" ||
        s === "paymentsuccess" ||
        s === "success";
      const isRedo =
        s === "paymentfailed" ||
        s === "failed" ||
        s === "paymentpending" ||
        s === "pending" ||
        s === "paymentdraft" ||
        s === "draft";
      if (isRedo && !isDone) {
        errors.push({
          id: `examreg-pay-${i}`,
          studentId,
          name: name || undefined,
          email,
          courseId,
          courseName: rowCourseName,
          branch: detectedBranch,
          errorType: "payment_issue",
          description: "Registration not completed — action required",
          paymentStatus,
        });
      } else if (!isDone && !isRedo) {
        errors.push({
          id: `examreg-noreg-${i}`,
          studentId,
          name: name || undefined,
          email,
          courseId,
          courseName: rowCourseName,
          branch: detectedBranch,
          errorType: "payment_issue",
          description: "Registration not completed — action required",
          paymentStatus,
        });
      }
    }

    // 12-week cross-match
    if (courseIdSet.size > 0) {
      const norm = courseId
        .toLowerCase()
        .trim()
        .replace(/^ns_/, "")
        .replace(/_/g, "-");
      if (
        !courseIdSet.has(norm) &&
        !courseIdSet.has(courseId.toLowerCase().trim())
      ) {
        errors.push({
          id: `examreg-cmatch-${i}`,
          studentId,
          name: name || undefined,
          email,
          courseId,
          courseName: rowCourseName,
          branch: detectedBranch,
          errorType: "course_mismatch",
          description: "Course not found in 12-week course list",
          paymentStatus,
        });
      }
    }
  }

  return { records, errors };
}

// ─── Shuffle Parser ───────────────────────────────────────────────────────────

export function parseShuffleRows(
  rows: Record<string, string>[],
): ExamShuffleUploadRecord[] {
  const records: ExamShuffleUploadRecord[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rollNo = getVal(row, ROLL_NO_COLS);
    const name = getVal(row, NAME_COLS);
    const examCenter = getVal(row, EXAM_CENTER_COLS);
    const examDate = getVal(row, EXAM_DATE_COLS);
    const timeSlot = getVal(row, TIME_SLOT_COLS);
    const hallTicketNo = getVal(row, HALL_TICKET_COLS);
    const courseId = getVal(row, COURSE_ID_COLS);
    const courseName = getVal(row, COURSE_NAME_COLS);
    const seatingNo = getVal(row, SEATING_COLS);

    const profession = getVal(row, ["profession", "role", "type", "usertype"]);
    if (profession.toLowerCase().includes("faculty")) continue;
    if (!rollNo && !courseId) continue;

    records.push({
      rollNo: rollNo || "",
      name: name || undefined,
      examCenter: examCenter || undefined,
      examDate: examDate || undefined,
      timeSlot: timeSlot || undefined,
      hallTicketNo: hallTicketNo || undefined,
      courseId: courseId || undefined,
      courseName: courseName || undefined,
      seatingNo: seatingNo || undefined,
    });
  }
  return records;
}

// ─── Cross-match ──────────────────────────────────────────────────────────────

function normCourseId(id: string): string {
  return id.trim().toLowerCase().replace(/^ns_/, "").replace(/_/g, "-");
}

export function crossMatchErrors(
  enrollmentRecords: StudentUploadRecord[],
  examRegRecords: StudentUploadRecord[],
): EnrollmentError[] {
  const errors: EnrollmentError[] = [];

  const examRegSet = new Set<string>();
  for (const r of examRegRecords) {
    examRegSet.add(`${r.studentId.toLowerCase()}::${normCourseId(r.courseId)}`);
  }

  const enrollSet = new Set<string>();
  for (const r of enrollmentRecords) {
    enrollSet.add(`${r.studentId.toLowerCase()}::${normCourseId(r.courseId)}`);
  }

  for (const r of enrollmentRecords) {
    const key = `${r.studentId.toLowerCase()}::${normCourseId(r.courseId)}`;
    if (!examRegSet.has(key)) {
      errors.push({
        id: `xmatch-noexam-${r.studentId}-${r.courseId}`,
        studentId: r.studentId,
        name: r.name,
        email: r.email,
        courseId: r.courseId,
        courseName: r.courseName || r.courseId,
        branch: r.branch,
        errorType: "not_registered",
        description: "Student enrolled but not registered for exam",
        source: r.source,
      });
    }
  }

  for (const r of examRegRecords) {
    const key = `${r.studentId.toLowerCase()}::${normCourseId(r.courseId)}`;
    if (!enrollSet.has(key)) {
      errors.push({
        id: `xmatch-noenroll-${r.studentId}-${r.courseId}`,
        studentId: r.studentId,
        name: r.name,
        email: r.email,
        courseId: r.courseId,
        courseName: r.courseName || r.courseId,
        branch: r.branch,
        errorType: "not_enrolled",
        description: "Student registered for exam but not enrolled",
        source: "dean",
      });
    }
  }

  return errors;
}

// ─── Legacy compat exports ────────────────────────────────────────────────────

export { parseFile as parseUploadedFile };

export function getFileHeaders(rows: Record<string, string>[]): string[] {
  if (rows.length === 0) return [];
  return Object.keys(rows[0]);
}

export async function parseCSVFile(
  file: File,
): Promise<Record<string, string>[]> {
  return parseFile(file);
}

export async function parseExcelFile(
  file: File,
): Promise<Record<string, string>[]> {
  return parseFile(file);
}

export function parseCourseRows(rows: Record<string, string>[]): Course[] {
  const courses: Course[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const courseId = getVal(row, COURSE_ID_COLS);
    const courseName = getVal(row, COURSE_NAME_COLS);
    const durationRaw = getVal(row, DURATION_COLS);
    if (!courseId && !courseName) continue;
    const weekCount = Number.parseInt(durationRaw, 10) || 0;
    if (durationRaw && weekCount !== 12) continue;
    courses.push({
      courseId: courseId || `course-${i}`,
      courseName: courseName || courseId || `Course ${i + 1}`,
      duration: durationRaw || "12 weeks",
      weekCount: 12,
    });
  }
  return courses;
}

export function parseExamRegRecords(
  rows: Record<string, string>[],
): StudentUploadRecord[] {
  const { records } = validateExamRegErrors(rows, "", "", []);
  return records;
}

export function validateEnrollmentRows(
  rows: Record<string, string>[],
  collegeName = "",
  _uploadedCourseIds: string[] = [],
  uploadedCourses: Course[] = [],
): { records: StudentUploadRecord[]; errors: EnrollmentError[] } {
  return validateEnrollmentErrors(
    rows,
    collegeName,
    "CSE",
    "dean",
    uploadedCourses,
  );
}

export function validateExamRegRows(
  rows: Record<string, string>[],
  _enrollmentStudentIds: string[] = [],
  _uploadedCourseIds: string[] = [],
  collegeName = "",
): ExamRegError[] {
  const { errors } = validateExamRegErrors(rows, collegeName, "CSE", []);
  return errors;
}

export function parseExamShuffleRows(
  rows: Record<string, string>[],
): import("../data/mockData").ExamShuffleUploadRecord[] {
  return parseShuffleRows(rows).map((r) => ({
    rollNo: r.rollNo,
    studentId: r.rollNo,
    email: "",
    name: r.name,
    branch: "CSE" as Branch,
    courseId: r.courseId || "",
    courseName: r.courseName,
    examCenter: r.examCenter,
    examDate: r.examDate,
    examSlot: r.timeSlot,
    timeSlot: r.timeSlot,
    hallTicketNo: r.hallTicketNo,
    seatingNumber: r.seatingNo,
    seatingNo: r.seatingNo,
  }));
}

export function crossMatchEnrollmentExamReg(
  enrollmentRecords: StudentUploadRecord[],
  examRegRecords: StudentUploadRecord[],
  _uploadedCourses: Course[],
): Array<{
  studentId: string;
  email: string;
  courseId: string;
  courseName?: string;
  errorType: string;
  details: string;
  branch: string;
}> {
  return crossMatchErrors(enrollmentRecords, examRegRecords).map((e) => ({
    studentId: e.studentId,
    email: e.email,
    courseId: e.courseId,
    courseName: e.courseName,
    errorType:
      e.errorType === "not_registered"
        ? "Missing Exam Registration"
        : "Missing Enrollment",
    details: e.description,
    branch: e.branch,
  }));
}

// CrossMatchError type alias for legacy imports
export interface CrossMatchError {
  studentId: string;
  email: string;
  courseId: string;
  courseName?: string;
  errorType: string;
  details: string;
  branch: string;
}

// loadXLSXLib re-export for legacy DeanDashboard usage
export { loadXLSX as loadXLSXLib };
