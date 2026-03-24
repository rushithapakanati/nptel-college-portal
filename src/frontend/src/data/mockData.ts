// ─── Mock Data ───────────────────────────────────────────────────────────────

export const COLLEGES = [
  "Nuzvid",
  "Srikakulam",
  "RK Valley",
  "Ongole",
] as const;
export type College = (typeof COLLEGES)[number];

export const BRANCHES = [
  "CSE",
  "ECE",
  "EEE",
  "ME",
  "MME",
  "CHEM",
  "CE",
] as const;
export type Branch = (typeof BRANCHES)[number];

// ─── Auth ────────────────────────────────────────────────────────────────────

export const HOD_PASSWORD = "hod123";

// Per-campus dean credentials
export const DEAN_CREDENTIALS_BY_COLLEGE: Record<
  string,
  { email: string; password: string }
> = {
  nuzvid: { email: "dean@rguktn.ac.in", password: "dean123" },
  srikakulam: { email: "dean@rguktsklm.ac.in", password: "dean123" },
  "rk valley": { email: "dean@rguktrkv.ac.in", password: "dean123" },
  ongole: { email: "dean@rguktong.ac.in", password: "dean123" },
};

/** Returns dean credentials for a given campus */
export function getDeanCredentials(college: string): {
  email: string;
  password: string;
} {
  const c = college.toLowerCase();
  return (
    DEAN_CREDENTIALS_BY_COLLEGE[c] ?? {
      email: "dean@rguktn.ac.in",
      password: "dean123",
    }
  );
}

// Keep for backward compatibility
export const DEAN_CREDENTIALS = {
  email: "dean@rguktn.ac.in",
  password: "dean123",
};

// ─── Per-campus email/student-id helpers ─────────────────────────────────────

/** Returns the email validation regex for a given campus */
export function getStudentEmailPattern(college: string): RegExp {
  const c = college.toLowerCase();
  if (c.includes("nuzvid")) return /^n\d{6}@rguktn\.ac\.in$/i;
  if (c.includes("srikakulam")) return /^(rs?|s)\d{6}@rguktsklm\.ac\.in$/i;
  if (c.includes("rk valley") || c.includes("rkvalley"))
    return /^rr?\d{6}@rguktrkv\.ac\.in$/i;
  if (c.includes("ongole")) return /^(ro?|o)\d{6}@rguktong\.ac\.in$/i;
  return /^[a-z]\d{6}@rguktn\.ac\.in$/i; // fallback
}

/** Returns the expected student ID prefix letter for a given campus */
export function getStudentIdPrefix(college: string): string {
  const c = college.toLowerCase();
  if (c.includes("nuzvid")) return "n";
  if (c.includes("srikakulam")) return "s";
  if (c.includes("rk valley") || c.includes("rkvalley")) return "r";
  if (c.includes("ongole")) return "o";
  return "n";
}

/** Returns a sample email address for hint display */
export function getStudentEmailExample(college: string): string {
  const c = college.toLowerCase();
  if (c.includes("nuzvid")) return "n200623@rguktn.ac.in";
  if (c.includes("srikakulam"))
    return "s210038@rguktsklm.ac.in / rs210038@rguktsklm.ac.in";
  if (c.includes("rk valley") || c.includes("rkvalley"))
    return "r210038@rguktrkv.ac.in / rr210038@rguktrkv.ac.in";
  if (c.includes("ongole"))
    return "o210038@rguktong.ac.in / ro210038@rguktong.ac.in";
  return "n200623@rguktn.ac.in";
}

/** Returns the email domain hint for format display */
export function getStudentEmailDomain(college: string): string {
  const c = college.toLowerCase();
  if (c.includes("nuzvid")) return "rguktn.ac.in";
  if (c.includes("srikakulam")) return "rguktsklm.ac.in";
  if (c.includes("rk valley") || c.includes("rkvalley"))
    return "rguktrkv.ac.in";
  if (c.includes("ongole")) return "rguktong.ac.in";
  return "rguktn.ac.in";
}

// ─── Student Upload Record (from dean's data upload) ─────────────────────────

export interface StudentUploadRecord {
  studentId: string;
  email: string;
  name?: string;
  branch: Branch;
  courseId: string; // enrollment course id (e.g. noc26-cs35)
  courseName?: string;
  durationWeeks?: number;
  enrollmentStatus?: string;
  // exam reg fields
  examCourseId?: string; // exam reg course id (e.g. noc26_cs35)
  paymentStatus?: string;
  examRegistration?: string;
  examCenter?: string;
  examDate?: string;
  examSlot?: string;
  profession?: string; // "Student" or "Faculty"
}

// ─── Exam Shuffle Record (from dean's shuffle file upload) ───────────────────

export interface ExamShuffleUploadRecord {
  studentId: string;
  email: string;
  name?: string;
  branch: Branch;
  courseId: string;
  courseName?: string;
  examCenter?: string;
  examDate?: string;
  examSlot?: string;
  hallTicketNo?: string;
  venue?: string;
  seatingNumber?: string;
}

// ─── Student Record Interfaces (kept for type usage) ─────────────────────────

export interface EnrollmentRecord {
  courseId: string;
  courseName: string;
  durationWeeks: number;
  status: string;
}

export interface ExamRegRecord {
  courseId: string;
  courseName: string;
  paymentStatus: string;
  classification: string;
}

export interface ExamShuffleRecord {
  courseId: string;
  center: string;
  date: string;
  slot: string;
}

// ─── Courses ─────────────────────────────────────────────────────────────────

export interface Course {
  courseId: string;
  courseName: string;
  durationWeeks: number;
  branch: Branch;
}

export const COURSES: Course[] = [
  {
    courseId: "noc26-cs35",
    courseName: "Introduction to Modern Application Development",
    durationWeeks: 12,
    branch: "CSE",
  },
  {
    courseId: "noc26-ec50",
    courseName: "Digital Circuits",
    durationWeeks: 12,
    branch: "ECE",
  },
  {
    courseId: "noc26-eee15",
    courseName: "Power Electronics",
    durationWeeks: 12,
    branch: "EEE",
  },
  {
    courseId: "noc26-me20",
    courseName: "Engineering Mechanics",
    durationWeeks: 12,
    branch: "ME",
  },
  {
    courseId: "noc26-mme5",
    courseName: "Materials Science",
    durationWeeks: 12,
    branch: "MME",
  },
  {
    courseId: "noc26-ch10",
    courseName: "Chemical Process Engineering",
    durationWeeks: 12,
    branch: "CHEM",
  },
  {
    courseId: "noc26-ce8",
    courseName: "Structural Analysis",
    durationWeeks: 12,
    branch: "CE",
  },
];

// ─── Enrollment Errors ───────────────────────────────────────────────────────

export interface EnrollmentError {
  id: string;
  studentId: string;
  email: string;
  courseId: string;
  errorType: string;
  details: string;
  courseName?: string;
  branch: Branch;
  edited?: boolean;
}

// ─── Exam Registration Errors ────────────────────────────────────────────────

export interface ExamRegError {
  id: string;
  studentId: string;
  email: string;
  courseId: string;
  paymentStatus: string;
  classification: string;
  errorType: string;
  details?: string;
  courseName?: string;
  branch: Branch;
  edited?: boolean;
}

// ─── HOD Permissions ─────────────────────────────────────────────────────────

export interface HodPermission {
  canUploadEnrollment: boolean;
  enrollmentEdits: number;
  canUploadExamReg: boolean;
  examRegEdits: number;
  enrollmentUploaded: boolean;
  examRegUploaded: boolean;
  enrollmentFileList: string[];
  examRegFileList: string[];
}

export type HodPermissions = Record<Branch, HodPermission>;

export const DEFAULT_HOD_PERMISSIONS: HodPermissions = {
  CSE: {
    canUploadEnrollment: false,
    enrollmentEdits: 0,
    canUploadExamReg: false,
    examRegEdits: 0,
    enrollmentUploaded: false,
    examRegUploaded: false,
    enrollmentFileList: [],
    examRegFileList: [],
  },
  ECE: {
    canUploadEnrollment: false,
    enrollmentEdits: 0,
    canUploadExamReg: false,
    examRegEdits: 0,
    enrollmentUploaded: false,
    examRegUploaded: false,
    enrollmentFileList: [],
    examRegFileList: [],
  },
  EEE: {
    canUploadEnrollment: false,
    enrollmentEdits: 0,
    canUploadExamReg: false,
    examRegEdits: 0,
    enrollmentUploaded: false,
    examRegUploaded: false,
    enrollmentFileList: [],
    examRegFileList: [],
  },
  ME: {
    canUploadEnrollment: false,
    enrollmentEdits: 0,
    canUploadExamReg: false,
    examRegEdits: 0,
    enrollmentUploaded: false,
    examRegUploaded: false,
    enrollmentFileList: [],
    examRegFileList: [],
  },
  MME: {
    canUploadEnrollment: false,
    enrollmentEdits: 0,
    canUploadExamReg: false,
    examRegEdits: 0,
    enrollmentUploaded: false,
    examRegUploaded: false,
    enrollmentFileList: [],
    examRegFileList: [],
  },
  CHEM: {
    canUploadEnrollment: false,
    enrollmentEdits: 0,
    canUploadExamReg: false,
    examRegEdits: 0,
    enrollmentUploaded: false,
    examRegUploaded: false,
    enrollmentFileList: [],
    examRegFileList: [],
  },
  CE: {
    canUploadEnrollment: false,
    enrollmentEdits: 0,
    canUploadExamReg: false,
    examRegEdits: 0,
    enrollmentUploaded: false,
    examRegUploaded: false,
    enrollmentFileList: [],
    examRegFileList: [],
  },
};

// ─── Statistics interface (computed dynamically) ─────────────────────────────

export interface BranchStats {
  branch: Branch;
  done: number;
  redo: number;
  doFirst: number;
}

// ─── HOD Edited Record ───────────────────────────────────────────────────────
// Created when a HOD saves an edit to an enrollment or exam reg error record

export interface HodEditedRecord {
  id: string; // original error id
  studentId: string;
  email: string;
  courseId: string;
  errorType: string;
  branch: Branch;
  fileType: "Enrollment" | "Exam Reg";
  editedAt: string; // ISO timestamp
  newStudentId?: string;
  newEmail?: string;
  newCourseId?: string;
  newPaymentStatus?: string;
}

// Note: Sample student records removed. All data is now parsed from uploaded files only.
