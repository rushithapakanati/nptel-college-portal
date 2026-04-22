import { type ReactNode, createContext, useCallback, useContext, useReducer } from 'react'
import type { AppState, CampusData, Course, EnrollmentError, ExamRegError, ExamShuffleUploadRecord, FileSnapshot, HodEditedRecord, HodPermission, StudentUploadRecord, User } from '../types'
import { createEmptyCampusData, normalizePaymentStatus } from '../constants'
import { parseCourseRows, parseFile, parseShuffleRows, validateEnrollmentErrors, validateExamRegErrors } from '../utils/fileParser'

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_YEAR'; year: string }
  | { type: 'SET_CAMPUS'; campus: string }
  | { type: 'SET_USER'; user: User | null }
  | { type: 'LOGOUT' }
  | { type: 'PATCH_CAMPUS'; key: string; patch: Partial<CampusData> }

function campusKey(year: string, campus: string): string {
  return `${year}::${campus.toLowerCase().trim()}`
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_YEAR': return { ...state, selectedYear: action.year }
    case 'SET_CAMPUS': return { ...state, selectedCampus: action.campus }
    case 'SET_USER': return { ...state, currentUser: action.user }
    case 'LOGOUT': return { ...state, currentUser: null, selectedCampus: null }
    case 'PATCH_CAMPUS': {
      const existing = state.campusData[action.key] ?? createEmptyCampusData()
      return { ...state, campusData: { ...state.campusData, [action.key]: { ...existing, ...action.patch } } }
    }
    default: return state
  }
}

const initialState: AppState = { selectedYear: null, selectedCampus: null, currentUser: null, campusData: {} }

// ─── Context Value ────────────────────────────────────────────────────────────

interface AppContextValue {
  selectedYear: string | null
  selectedCampus: string | null
  currentUser: User | null
  setSelectedYear: (year: string) => void
  setSelectedCampus: (campus: string) => void
  setCurrentUser: (user: User | null) => void
  logout: () => void
  getCampusData: (campus: string, year: string) => CampusData
  getStudentData: (campus: string, year: string, email: string) => {
    enrollmentRecords: StudentUploadRecord[]
    examRegRecords: StudentUploadRecord[]
    shuffleRecord: ExamShuffleUploadRecord | null
    enrollmentErrors: EnrollmentError[]
    examRegErrors: ExamRegError[]
  }
  uploadEnrollmentFile: (campus: string, year: string, file: File) => Promise<void>
  uploadExamRegFile: (campus: string, year: string, file: File) => Promise<void>
  uploadShuffleFile: (campus: string, year: string, file: File) => Promise<void>
  uploadCourseFile: (campus: string, year: string, file: File) => Promise<void>
  uploadHodEnrollmentFile: (campus: string, year: string, branch: string, file: File) => Promise<void>
  uploadHodExamRegFile: (campus: string, year: string, branch: string, file: File) => Promise<void>
  restoreSnapshot: (campus: string, year: string, type: 'enrollment' | 'examreg' | 'shuffle', snapshotId: string) => void
  setHodPermission: (campus: string, year: string, branch: string, perm: Partial<HodPermission>) => void
  saveHodEdit: (campus: string, year: string, edit: Omit<HodEditedRecord, 'id'>) => void
  updateEnrollmentError: (campus: string, year: string, id: string, updates: Partial<EnrollmentError>) => void
  updateExamRegError: (campus: string, year: string, id: string, updates: Partial<ExamRegError>) => void
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

// ─── Index builder ────────────────────────────────────────────────────────────

function buildIndex<T extends { studentId?: string; email?: string; rollNo?: string }>(
  records: T[],
): { byId: Map<string, T[]>; byEmail: Map<string, T[]> } {
  const byId = new Map<string, T[]>()
  const byEmail = new Map<string, T[]>()
  for (const r of records) {
    const id = (r.studentId ?? (r as { rollNo?: string }).rollNo ?? '').toLowerCase()
    const em = (r.email ?? '').toLowerCase()
    if (id) { const arr = byId.get(id) ?? []; arr.push(r); byId.set(id, arr) }
    if (em) { const arr = byEmail.get(em) ?? []; arr.push(r); byEmail.set(em, arr) }
  }
  return { byId, byEmail }
}

function makeSnapshot(fileName: string, data: unknown[], isActive: boolean): FileSnapshot {
  return {
    id: `snap-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    fileName, uploadedAt: new Date().toISOString(), recordCount: data.length, isActive,
    data: data as FileSnapshot['data'],
  }
}

function deactivateSnapshots(snapshots: FileSnapshot[]): FileSnapshot[] {
  return snapshots.map((s) => ({ ...s, isActive: false }))
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  function patchCampus(campus: string, year: string, patch: Partial<CampusData>) {
    const key = campusKey(year || state.selectedYear || '', campus)
    dispatch({ type: 'PATCH_CAMPUS', key, patch })
  }

  function getCampusData(campus: string, year: string): CampusData {
    return state.campusData[campusKey(year, campus)] ?? createEmptyCampusData()
  }

  const setSelectedYear = useCallback((year: string) => dispatch({ type: 'SET_YEAR', year }), [])
  const setSelectedCampus = useCallback((campus: string) => dispatch({ type: 'SET_CAMPUS', campus }), [])
  const setCurrentUser = useCallback((user: User | null) => dispatch({ type: 'SET_USER', user }), [])
  const logout = useCallback(() => dispatch({ type: 'LOGOUT' }), [])

  async function uploadEnrollmentFile(campus: string, year: string, file: File) {
    const rows = await parseFile(file)
    const courses = getCampusData(campus, year).twelveWeekCourses
    const { records, errors } = validateEnrollmentErrors(rows, campus, 'ALL', 'dean', courses)
    const data = getCampusData(campus, year)
    const oldSnaps = deactivateSnapshots(data.enrollmentSnapshots)
    const snap = makeSnapshot(file.name, records, true)
    patchCampus(campus, year, {
      enrollmentRecords: records, enrollmentErrors: errors,
      enrollmentFileTotalCount: records.length, doneRegistrations: [],
      enrollmentSnapshots: [...oldSnaps, snap], deanStudentDataUploaded: true,
    })
  }

  async function uploadExamRegFile(campus: string, year: string, file: File) {
    const rows = await parseFile(file)
    const courses = getCampusData(campus, year).twelveWeekCourses
    const { records, errors } = validateExamRegErrors(rows, campus, 'ALL', courses)
    const done = records.filter((r) => normalizePaymentStatus(r.paymentStatus ?? '') === 'done')
    const data = getCampusData(campus, year)
    const oldSnaps = deactivateSnapshots(data.examRegSnapshots)
    const snap = makeSnapshot(file.name, records, true)
    patchCampus(campus, year, {
      examRegRecords: records, examRegErrors: errors,
      examRegFileTotalCount: records.length, doneRegistrations: done,
      examRegSnapshots: [...oldSnaps, snap], deanExamRegDataUploaded: true,
    })
  }

  async function uploadShuffleFile(campus: string, year: string, file: File) {
    const rows = await parseFile(file)
    const records = parseShuffleRows(rows)
    const data = getCampusData(campus, year)
    const oldSnaps = deactivateSnapshots(data.shuffleSnapshots)
    const snap = makeSnapshot(file.name, records, true)
    patchCampus(campus, year, {
      shuffleRecords: records, shuffleSnapshots: [...oldSnaps, snap],
      deanShuffleDataUploaded: true,
    })
  }

  async function uploadCourseFile(campus: string, year: string, file: File) {
    const rows = await parseFile(file)
    const courses = parseCourseRows(rows)
    patchCampus(campus, year, { twelveWeekCourses: courses })
  }

  async function uploadHodEnrollmentFile(campus: string, year: string, branch: string, file: File) {
    const rows = await parseFile(file)
    const courses = getCampusData(campus, year).twelveWeekCourses
    const { records, errors } = validateEnrollmentErrors(rows, campus, branch, 'hod', courses)
    const data = getCampusData(campus, year)
    const merged = [...data.enrollmentRecords.filter((r) => r.source !== 'hod' || r.hodBranch !== branch), ...records]
    const mergedErrors = [...data.enrollmentErrors.filter((e) => e.source !== 'hod'), ...errors]
    patchCampus(campus, year, {
      enrollmentRecords: merged, enrollmentErrors: mergedErrors,
    })
  }

  async function uploadHodExamRegFile(campus: string, year: string, branch: string, file: File) {
    const rows = await parseFile(file)
    const courses = getCampusData(campus, year).twelveWeekCourses
    const { records, errors } = validateExamRegErrors(rows, campus, branch, courses)
    const data = getCampusData(campus, year)
    const merged = [
      ...data.examRegRecords.filter((r) => r.hodBranch !== branch),
      ...records.map((r) => ({ ...r, hodBranch: branch })),
    ]
    const mergedErrors = [...data.examRegErrors.filter((e) => e.branch !== (branch as typeof e.branch)), ...errors]
    patchCampus(campus, year, { examRegRecords: merged, examRegErrors: mergedErrors })
  }

  function restoreSnapshot(campus: string, year: string, type: 'enrollment' | 'examreg' | 'shuffle', snapshotId: string) {
    const data = getCampusData(campus, year)
    if (type === 'enrollment') {
      const snaps = data.enrollmentSnapshots.map((s) => ({ ...s, isActive: s.id === snapshotId }))
      const active = snaps.find((s) => s.isActive)
      if (!active) return
      const records = active.data as StudentUploadRecord[]
      patchCampus(campus, year, {
        enrollmentSnapshots: snaps, enrollmentRecords: records,
        enrollmentFileTotalCount: records.length,
      })
    } else if (type === 'examreg') {
      const snaps = data.examRegSnapshots.map((s) => ({ ...s, isActive: s.id === snapshotId }))
      const active = snaps.find((s) => s.isActive)
      if (!active) return
      const records = active.data as StudentUploadRecord[]
      const done = records.filter((r) => normalizePaymentStatus(r.paymentStatus ?? '') === 'done')
      patchCampus(campus, year, {
        examRegSnapshots: snaps, examRegRecords: records,
        examRegFileTotalCount: records.length, doneRegistrations: done,
      })
    } else {
      const snaps = data.shuffleSnapshots.map((s) => ({ ...s, isActive: s.id === snapshotId }))
      const active = snaps.find((s) => s.isActive)
      if (!active) return
      const records = active.data as ExamShuffleUploadRecord[]
      patchCampus(campus, year, { shuffleSnapshots: snaps, shuffleRecords: records })
    }
  }

  function setHodPermission(campus: string, year: string, branch: string, perm: Partial<HodPermission>) {
    const data = getCampusData(campus, year)
    patchCampus(campus, year, {
      hodPermissions: {
        ...data.hodPermissions,
        [branch]: { ...(data.hodPermissions[branch] ?? { branch, uploadCredits: 0, editCredits: 0 }), ...perm },
      },
    })
  }

  function saveHodEdit(campus: string, year: string, edit: Omit<HodEditedRecord, 'id'>) {
    const data = getCampusData(campus, year)
    const record: HodEditedRecord = { ...edit, id: `edit-${Date.now()}` }
    patchCampus(campus, year, { hodEditedRecords: [...data.hodEditedRecords, record] })
  }

  function updateEnrollmentError(campus: string, year: string, id: string, updates: Partial<EnrollmentError>) {
    const data = getCampusData(campus, year)
    patchCampus(campus, year, {
      enrollmentErrors: data.enrollmentErrors.map((e) => e.id === id ? { ...e, ...updates } : e),
    })
  }

  function updateExamRegError(campus: string, year: string, id: string, updates: Partial<ExamRegError>) {
    const data = getCampusData(campus, year)
    patchCampus(campus, year, {
      examRegErrors: data.examRegErrors.map((e) => e.id === id ? { ...e, ...updates } : e),
    })
  }

  function getStudentData(campus: string, year: string, email: string) {
    const data = getCampusData(campus, year)
    const lower = email.toLowerCase()
    const prefix = lower.split('@')[0]

    function matchStudent<T extends { studentId?: string; email?: string; rollNo?: string }>(records: T[]): T[] {
      return records.filter((r) => {
        const rEmail = (r.email ?? '').toLowerCase()
        const rId = (r.studentId ?? (r as { rollNo?: string }).rollNo ?? '').toLowerCase()
        return rEmail === lower || rId === prefix || rEmail.split('@')[0] === prefix
      })
    }

    const enrollmentRecords = matchStudent(data.enrollmentRecords)
    const examRegRecords = matchStudent(data.examRegRecords)
    const shuffleMatch = matchStudent(data.shuffleRecords.map((r) => ({ ...r, studentId: r.rollNo })))
    const shuffleRecord = shuffleMatch.length > 0
      ? (data.shuffleRecords.find((r) => r.rollNo.toLowerCase() === shuffleMatch[0].studentId?.toLowerCase()) ?? null)
      : null
    const enrollmentErrors = matchStudent(data.enrollmentErrors)
    const examRegErrors = matchStudent(data.examRegErrors)
    return { enrollmentRecords, examRegRecords, shuffleRecord, enrollmentErrors, examRegErrors }
  }

  const value: AppContextValue = {
    selectedYear: state.selectedYear, selectedCampus: state.selectedCampus,
    currentUser: state.currentUser, setSelectedYear, setSelectedCampus,
    setCurrentUser, logout, getCampusData, getStudentData,
    uploadEnrollmentFile, uploadExamRegFile, uploadShuffleFile, uploadCourseFile,
    uploadHodEnrollmentFile, uploadHodExamRegFile, restoreSnapshot,
    setHodPermission, saveHodEdit, updateEnrollmentError, updateExamRegError,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
