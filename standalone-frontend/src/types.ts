// ─── All TypeScript interfaces for RGUKT NPTEL Portal ────────────────────────

export type Branch = 'CSE' | 'ECE' | 'EEE' | 'ME' | 'MME' | 'CHEM' | 'CE'

export interface StudentUploadRecord {
  studentId: string
  name?: string
  email: string
  personalEmail?: string
  courseId: string
  courseName?: string
  duration?: string
  enrollmentStatus?: string
  paymentStatus?: string
  branch: Branch
  source: 'dean' | 'hod'
  hodBranch?: string
}

export interface Course {
  courseId: string
  courseName: string
  duration: string
  credits?: number
}

export interface EnrollmentError {
  id: string
  studentId: string
  name?: string
  email: string
  courseId: string
  courseName: string
  branch: Branch
  errorType: string
  description: string
  source: 'dean' | 'hod'
  edited?: boolean
}

export interface ExamRegError {
  id: string
  studentId: string
  name?: string
  email: string
  courseId: string
  courseName: string
  branch: Branch
  errorType: string
  description: string
  paymentStatus?: string
  edited?: boolean
}

export interface ExamShuffleUploadRecord {
  rollNo: string
  name?: string
  examCenter?: string
  examDate?: string
  timeSlot?: string
  hallTicketNo?: string
  courseId?: string
  courseName?: string
  seatingNo?: string
}

export interface HodPermission {
  branch: string
  uploadCredits: number
  editCredits: number
}

export interface HodEditedRecord {
  id: string
  studentId: string
  studentName?: string
  courseId: string
  courseName: string
  branch: Branch
  editedAt: string
  changes: Record<string, string>
  editedBy?: string
}

export interface FileSnapshot {
  id: string
  uploadedAt: string
  fileName: string
  recordCount: number
  isActive: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
}

export interface CampusData {
  enrollmentRecords: StudentUploadRecord[]
  examRegRecords: StudentUploadRecord[]
  shuffleRecords: ExamShuffleUploadRecord[]
  twelveWeekCourses: Course[]
  enrollmentErrors: EnrollmentError[]
  examRegErrors: ExamRegError[]
  enrollmentSnapshots: FileSnapshot[]
  examRegSnapshots: FileSnapshot[]
  shuffleSnapshots: FileSnapshot[]
  hodEditedRecords: HodEditedRecord[]
  hodPermissions: Record<string, HodPermission>
  enrollmentFileTotalCount: number
  examRegFileTotalCount: number
  doneRegistrations: StudentUploadRecord[]
  deanStudentDataUploaded: boolean
  deanExamRegDataUploaded: boolean
  deanShuffleDataUploaded: boolean
}

export interface User {
  email: string
  role: 'student' | 'hod' | 'dean'
  campus: string
  branch?: string
  year: string
}

export interface AppState {
  selectedYear: string | null
  selectedCampus: string | null
  currentUser: User | null
  campusData: Record<string, CampusData>
}
