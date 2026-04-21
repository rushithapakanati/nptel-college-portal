// ─── Constants & Types for RGUKT NPTEL Portal ───────────────────────────────

// ─── College / Campus Config ──────────────────────────────────────────────────

export interface CollegeConfig {
  name: string;
  abbr: string;
  emailDomain: string;
  studentPrefixes: string[];
  deanEmail: string;
  gradients: string;
  // Legacy compat
  displayName?: string;
  emailPrefixes?: string[];
  studentIdPrefix?: string;
}

export const COLLEGE_CONFIGS: CollegeConfig[] = [
  {
    name: "Nuzvid",
    abbr: "RGUKTN",
    emailDomain: "rguktn.ac.in",
    studentPrefixes: ["n"],
    deanEmail: "dean@rguktn.ac.in",
    gradients: "from-blue-600 to-blue-800",
    displayName: "RGUKT Nuzvid",
    emailPrefixes: ["n"],
    studentIdPrefix: "n",
  },
  {
    name: "Srikakulam",
    abbr: "RGUKTSKLM",
    emailDomain: "rguktsklm.ac.in",
    studentPrefixes: ["s", "rs"],
    deanEmail: "dean@rguktsklm.ac.in",
    gradients: "from-purple-600 to-purple-800",
    displayName: "RGUKT Srikakulam",
    emailPrefixes: ["s", "rs"],
    studentIdPrefix: "s",
  },
  {
    name: "RK Valley",
    abbr: "RGUKTRKV",
    emailDomain: "rguktrkv.ac.in",
    studentPrefixes: ["r", "rr"],
    deanEmail: "dean@rguktrkv.ac.in",
    gradients: "from-emerald-600 to-emerald-800",
    displayName: "RGUKT RK Valley",
    emailPrefixes: ["r", "rr"],
    studentIdPrefix: "r",
  },
  {
    name: "Ongole",
    abbr: "RGUKTONG",
    emailDomain: "rguktong.ac.in",
    studentPrefixes: ["o", "ro"],
    deanEmail: "dean@rguktong.ac.in",
    gradients: "from-orange-600 to-orange-800",
    displayName: "RGUKT Ongole",
    emailPrefixes: ["o", "ro"],
    studentIdPrefix: "o",
  },
];

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

export const ACADEMIC_YEARS = ["2026 Sem-1", "2026 Sem-2"] as const;
export type AcademicYearString = (typeof ACADEMIC_YEARS)[number];

export const HOD_DEFAULT_PASSWORD = "hod123";
export const DEAN_DEFAULT_PASSWORD = "dean123";

// ─── Core Data Interfaces ─────────────────────────────────────────────────────

export interface StudentUploadRecord {
  studentId: string;
  name?: string;
  email: string;
  personalEmail?: string;
  courseId: string;
  courseName?: string;
  duration?: string;
  enrollmentStatus?: string;
  paymentStatus?: string;
  branch: Branch;
  source: "dean" | "hod";
  hodBranch?: string;
  // Legacy compat fields
  profession?: string;
  examCourseId?: string;
  durationWeeks?: number;
  examRegion?: string;
  examCenter?: string;
  examDate?: string;
  examSlot?: string;
}

export interface Course {
  courseId: string;
  courseName: string;
  duration: string;
  weekCount: number;
  // Legacy compat
  durationWeeks?: number;
  branch?: Branch;
}

export interface EnrollmentError {
  id: string;
  studentId: string;
  name?: string;
  email: string;
  courseId: string;
  courseName: string;
  branch: Branch;
  errorType: string;
  description: string;
  source: "dean" | "hod";
  // Legacy compat
  details?: string;
  edited?: boolean;
}

export interface ExamRegError {
  id: string;
  studentId: string;
  name?: string;
  email: string;
  courseId: string;
  courseName: string;
  branch: Branch;
  errorType: string;
  description: string;
  paymentStatus?: string;
  // Legacy compat
  details?: string;
  classification?: string;
  edited?: boolean;
}

export interface ExamShuffleUploadRecord {
  rollNo: string;
  name?: string;
  examCenter?: string;
  examDate?: string;
  timeSlot?: string;
  hallTicketNo?: string;
  courseId?: string;
  courseName?: string;
  seatingNo?: string;
  // Legacy compat
  studentId?: string;
  email?: string;
  branch?: Branch;
  examSlot?: string;
  seatingNumber?: string;
}

export interface HodPermission {
  branch: string;
  canUpload: boolean;
  uploadCredits: number;
  // Legacy compat fields used by old HODDashboard/DeanDashboard pages
  canUploadEnrollment?: boolean;
  enrollmentEdits?: number;
  canUploadExamReg?: boolean;
  examRegEdits?: number;
  enrollmentUploaded?: boolean;
  examRegUploaded?: boolean;
  enrollmentFileList?: string[];
  examRegFileList?: string[];
}

export type HodPermissions = Record<string, HodPermission>;

export interface HodEditedRecord {
  id: string;
  studentId: string;
  name?: string;
  email: string;
  courseId: string;
  courseName: string;
  branch: Branch;
  editedBy: string;
  editedAt: string;
  oldValues: Record<string, string>;
  newValues: Record<string, string>;
  // Legacy compat
  fileType?: "Enrollment" | "Exam Reg";
  errorType?: string;
  newStudentId?: string;
  newEmail?: string;
  newCourseId?: string;
  newPaymentStatus?: string;
}

export interface FileSnapshot {
  id: string;
  fileName: string;
  uploadedAt: string;
  recordCount: number;
  isActive: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  // Legacy compat
  timestamp?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  records?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors?: any[];
}

export interface CampusData {
  enrollmentRecords: StudentUploadRecord[];
  examRegRecords: StudentUploadRecord[];
  shuffleRecords: ExamShuffleUploadRecord[];
  enrollmentErrors: EnrollmentError[];
  examRegErrors: ExamRegError[];
  enrollmentFileSnapshots: FileSnapshot[];
  examRegFileSnapshots: FileSnapshot[];
  shuffleFileSnapshots: FileSnapshot[];
  hodPermissions: HodPermissions;
  hodEditedRecords: HodEditedRecord[];
  enrollmentTotalCount: number;
  examRegTotalCount: number;
  twelveWeekCourses: Course[];
  doneRegistrations: StudentUploadRecord[];
  // Extended fields for legacy compat and O(1) indexes
  hodUploadedRecords?: StudentUploadRecord[];
  deanStudentDataUploaded?: boolean;
  deanExamRegDataUploaded?: boolean;
  deanShuffleDataUploaded?: boolean;
  deanCourseFileUploaded?: boolean;
  enrollmentFileRecordCount?: number;
  examRegFileRecordCount?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enrollmentIndexByStudentId?: Map<string, any[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enrollmentIndexByEmail?: Map<string, any[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  examRegIndexByStudentId?: Map<string, any[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  examRegIndexByEmail?: Map<string, any[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shuffleIndexByStudentId?: Map<string, any[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shuffleIndexByEmail?: Map<string, any[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enrollmentErrorsByStudentId?: Map<string, any[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enrollmentErrorsByEmail?: Map<string, any[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  examRegErrorsByStudentId?: Map<string, any[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  examRegErrorsByEmail?: Map<string, any[]>;
  // Legacy alias for uploadedStudentRecords
  uploadedStudentRecords?: StudentUploadRecord[];
  uploadedExamRegRecords?: StudentUploadRecord[];
  uploadedCourses?: Course[];
  uploadedShuffleRecords?: ExamShuffleUploadRecord[];
}

export interface CurrentUser {
  role: "student" | "hod" | "dean";
  campus: string;
  branch?: string;
  email: string;
  name?: string;
  // Legacy compat — old pages use 'college' instead of 'campus'
  college?: string;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

export function getCollegeConfig(name: string): CollegeConfig | undefined {
  const n = name.toLowerCase().trim();
  return COLLEGE_CONFIGS.find((c) => c.name.toLowerCase() === n);
}

export function isValidStudentEmail(email: string, campus: string): boolean {
  const config = getCollegeConfig(campus);
  if (!config) return false;
  const domain = config.emailDomain;
  const lower = email.toLowerCase();
  if (!lower.endsWith(`@${domain}`)) return false;
  const localPart = lower.split("@")[0];
  return config.studentPrefixes.some((prefix) => {
    const rest = localPart.startsWith(prefix)
      ? localPart.slice(prefix.length)
      : null;
    return rest !== null && /^\d{6}$/.test(rest);
  });
}

export function getDeanEmail(campus: string): string {
  return getCollegeConfig(campus)?.deanEmail ?? "";
}

export function normalizePaymentStatus(
  status: string,
): "done" | "redo" | "dofirst" {
  const s = status.toLowerCase().trim().replace(/[_\s]/g, "");
  if (
    s === "paymentcomplete" ||
    s === "complete" ||
    s === "paymentsuccess" ||
    s === "success"
  )
    return "done";
  if (
    s === "paymentfailed" ||
    s === "failed" ||
    s === "paymentpending" ||
    s === "pending" ||
    s === "paymentdraft" ||
    s === "draft"
  )
    return "redo";
  return "dofirst";
}

export function createEmptyCampusData(): CampusData {
  const defaultPerms: HodPermissions = {};
  for (const b of BRANCHES) {
    defaultPerms[b] = {
      branch: b,
      canUpload: false,
      uploadCredits: 0,
      canUploadEnrollment: false,
      enrollmentEdits: 0,
      canUploadExamReg: false,
      examRegEdits: 0,
      enrollmentUploaded: false,
      examRegUploaded: false,
      enrollmentFileList: [],
      examRegFileList: [],
    };
  }
  return {
    enrollmentRecords: [],
    examRegRecords: [],
    shuffleRecords: [],
    enrollmentErrors: [],
    examRegErrors: [],
    enrollmentFileSnapshots: [],
    examRegFileSnapshots: [],
    shuffleFileSnapshots: [],
    hodPermissions: defaultPerms,
    hodEditedRecords: [],
    enrollmentTotalCount: 0,
    examRegTotalCount: 0,
    twelveWeekCourses: [],
    doneRegistrations: [],
  };
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export function getDeanCredentials(campus: string): {
  email: string;
  password: string;
} {
  const c = campus.toLowerCase().trim();
  const stored = localStorage.getItem(`dean_creds_${c}`);
  if (stored) {
    try {
      return JSON.parse(stored) as { email: string; password: string };
    } catch {
      /* fall through */
    }
  }
  const config = getCollegeConfig(campus);
  return {
    email: config?.deanEmail ?? "dean@rguktn.ac.in",
    password: DEAN_DEFAULT_PASSWORD,
  };
}

export function saveDeanCredentials(
  campus: string,
  email: string,
  password: string,
) {
  localStorage.setItem(
    `dean_creds_${campus.toLowerCase().trim()}`,
    JSON.stringify({ email, password }),
  );
}

export function getStudentEmailExample(campus: string): string {
  const c = campus.toLowerCase();
  if (c.includes("nuzvid")) return "n200623@rguktn.ac.in";
  if (c.includes("srikakulam"))
    return "s210038@rguktsklm.ac.in / rs210038@rguktsklm.ac.in";
  if (c.includes("rk valley") || c.includes("rkvalley"))
    return "r210038@rguktrkv.ac.in / rr210038@rguktrkv.ac.in";
  if (c.includes("ongole"))
    return "o210038@rguktong.ac.in / ro210038@rguktong.ac.in";
  return "n200623@rguktn.ac.in";
}

// Legacy email helpers used by LoginPage and other pages
export function getStudentEmailPattern(campus: string): RegExp {
  const c = campus.toLowerCase();
  if (c.includes("nuzvid")) return /^n\d{6}@rguktn\.ac\.in$/i;
  if (c.includes("srikakulam")) return /^(rs?)\d{6}@rguktsklm\.ac\.in$/i;
  if (c.includes("rk valley") || c.includes("rkvalley"))
    return /^(rr?)\d{6}@rguktrkv\.ac\.in$/i;
  if (c.includes("ongole")) return /^(ro?)\d{6}@rguktong\.ac\.in$/i;
  return /^[a-z]\d{6}@rguktn\.ac\.in$/i;
}

export function getStudentEmailDomain(campus: string): string {
  return getCollegeConfig(campus)?.emailDomain ?? "rguktn.ac.in";
}

export function getStudentIdPrefix(campus: string): string {
  const c = campus.toLowerCase();
  if (c.includes("nuzvid")) return "n";
  if (c.includes("srikakulam")) return "s";
  if (c.includes("rk valley") || c.includes("rkvalley")) return "r";
  if (c.includes("ongole")) return "o";
  return "n";
}

// ─── Legacy constants ─────────────────────────────────────────────────────────

export const COLLEGES = [
  "Nuzvid",
  "Srikakulam",
  "RK Valley",
  "Ongole",
] as const;
export type College = (typeof COLLEGES)[number];

export interface AcademicYear {
  label: string;
  value: string;
}

export const ACADEMIC_YEAR_OPTIONS: AcademicYear[] = [
  { label: "2026 Sem-1", value: "2026-sem1" },
  { label: "2026 Sem-2", value: "2026-sem2" },
];

export const HOD_PASSWORD = HOD_DEFAULT_PASSWORD;

export const DEAN_CREDENTIALS_BY_COLLEGE: Record<
  string,
  { email: string; password: string }
> = {
  nuzvid: { email: "dean@rguktn.ac.in", password: DEAN_DEFAULT_PASSWORD },
  srikakulam: {
    email: "dean@rguktsklm.ac.in",
    password: DEAN_DEFAULT_PASSWORD,
  },
  "rk valley": {
    email: "dean@rguktrkv.ac.in",
    password: DEAN_DEFAULT_PASSWORD,
  },
  ongole: { email: "dean@rguktong.ac.in", password: DEAN_DEFAULT_PASSWORD },
};

export const DEAN_CREDENTIALS = {
  email: "dean@rguktn.ac.in",
  password: DEAN_DEFAULT_PASSWORD,
};

export interface AppUser {
  role: "student" | "hod" | "dean";
  college: string;
  branch?: Branch;
  email?: string;
  name?: string;
}

export interface BranchStats {
  branch: Branch;
  done: number;
  redo: number;
  doFirst: number;
}

export interface OverviewStats {
  totalEnrolled: number;
  enrollmentErrors: number;
  totalExamReg: number;
  done: number;
  redo: number;
  doFirst: number;
  examRegErrors: number;
}

export const DEFAULT_HOD_PERMISSIONS: HodPermissions = (() => {
  const p: HodPermissions = {};
  for (const b of BRANCHES) {
    p[b] = {
      branch: b,
      canUpload: false,
      uploadCredits: 0,
      canUploadEnrollment: false,
      enrollmentEdits: 0,
      canUploadExamReg: false,
      examRegEdits: 0,
      enrollmentUploaded: false,
      examRegUploaded: false,
      enrollmentFileList: [],
      examRegFileList: [],
    };
  }
  return p;
})();

export const COURSES: Course[] = [];

// Enrollment/ExamReg record interfaces for legacy compatibility
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
