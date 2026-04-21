import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useReducer,
} from "react";
import {
  type CampusData,
  type Course,
  type CurrentUser,
  type EnrollmentError,
  type ExamRegError,
  type ExamShuffleUploadRecord,
  type FileSnapshot,
  type HodEditedRecord,
  type HodPermission,
  type StudentUploadRecord,
  createEmptyCampusData,
  normalizePaymentStatus,
} from "../data/mockData";
import {
  parseCourseRows,
  parseFile,
  parseShuffleRows,
  validateEnrollmentErrors,
  validateExamRegErrors,
} from "../utils/fileParser";

// ─── State ────────────────────────────────────────────────────────────────────

interface AppState {
  selectedYear: string | null;
  selectedCampus: string | null;
  currentUser: CurrentUser | null;
  campusData: Record<string, CampusData>;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "SET_YEAR"; year: string }
  | { type: "SET_CAMPUS"; campus: string }
  | { type: "SET_USER"; user: CurrentUser | null }
  | { type: "LOGOUT" }
  | { type: "PATCH_CAMPUS"; key: string; patch: Partial<CampusData> };

function campusKey(year: string, campus: string): string {
  return `${year}::${campus.toLowerCase().trim()}`;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_YEAR":
      return { ...state, selectedYear: action.year };
    case "SET_CAMPUS":
      return { ...state, selectedCampus: action.campus };
    case "SET_USER":
      return { ...state, currentUser: action.user };
    case "LOGOUT":
      return { ...state, currentUser: null, selectedCampus: null };
    case "PATCH_CAMPUS": {
      const existing = state.campusData[action.key] ?? createEmptyCampusData();
      return {
        ...state,
        campusData: {
          ...state.campusData,
          [action.key]: { ...existing, ...action.patch },
        },
      };
    }
    default:
      return state;
  }
}

const initialState: AppState = {
  selectedYear: null,
  selectedCampus: null,
  currentUser: null,
  campusData: {},
};

// ─── Context Value ────────────────────────────────────────────────────────────

interface AppContextValue {
  selectedYear: string | null;
  selectedCampus: string | null;
  currentUser: CurrentUser | null;

  setSelectedYear: (year: string) => void;
  setSelectedCampus: (campus: string) => void;
  setCurrentUser: (user: CurrentUser | null) => void;
  logout: () => void;

  // Dean uploads
  uploadEnrollmentFile: (
    campus: string,
    year: string,
    file: File,
  ) => Promise<void>;
  uploadExamRegFile: (
    campus: string,
    year: string,
    file: File,
  ) => Promise<void>;
  uploadShuffleFile: (
    campus: string,
    year: string,
    file: File,
  ) => Promise<void>;

  // HOD uploads
  uploadHodEnrollmentFile: (
    campus: string,
    year: string,
    branch: string,
    file: File,
  ) => Promise<void>;
  uploadHodExamRegFile: (
    campus: string,
    year: string,
    branch: string,
    file: File,
  ) => Promise<void>;

  // File versioning
  restoreFileSnapshot: (
    campus: string,
    year: string,
    type: "enrollment" | "examreg" | "shuffle",
    snapshotId: string,
  ) => void;

  // HOD edits
  saveHodEdit: (
    campus: string,
    year: string,
    edit: Omit<HodEditedRecord, "id">,
  ) => void;

  // 12-week courses
  uploadTwelveWeekCourses: (
    campus: string,
    year: string,
    file: File,
  ) => Promise<void>;

  // Getters
  getCampusData: (campus: string, year: string) => CampusData;
  getStudentData: (
    campus: string,
    year: string,
    email: string,
  ) => {
    enrollmentRecords: StudentUploadRecord[];
    examRegRecords: StudentUploadRecord[];
    shuffleRecord: ExamShuffleUploadRecord | null;
    enrollmentErrors: EnrollmentError[];
    examRegErrors: ExamRegError[];
  };

  // Legacy compat
  selectedAcademicYear: string;
  setSelectedAcademicYear: (year: string) => void;
  hodPermissions: CampusData["hodPermissions"];
  // updateHodPermission with 2-arg legacy signature (used by old pages)
  updateHodPermission: (
    branch: string,
    permission: Partial<HodPermission>,
  ) => void;
  // 4-arg version for new pages that pass campus+year explicitly
  updateHodPermissionFull: (
    campus: string,
    year: string,
    branch: string,
    permission: Partial<HodPermission>,
  ) => void;
  updateHodPermissionLegacy: (
    branch: string,
    permission: Partial<HodPermission>,
  ) => void;
  enrollmentErrors: EnrollmentError[];
  examRegErrors: ExamRegError[];
  uploadedStudentRecords: StudentUploadRecord[];
  uploadedExamRegRecords: StudentUploadRecord[];
  uploadedCourses: Course[];
  uploadedShuffleRecords: ExamShuffleUploadRecord[];
  deanStudentDataUploaded: boolean;
  deanExamRegDataUploaded: boolean;
  deanShuffleDataUploaded: boolean;
  deanCourseFileUploaded: boolean;
  hodEditedRecords: HodEditedRecord[];
  enrollmentFileSnapshots: FileSnapshot[];
  examRegFileSnapshots: FileSnapshot[];
  enrollmentFileRecordCount: number;
  examRegFileRecordCount: number;
  setUploadedStudentRecords: (
    records: StudentUploadRecord[],
    count?: number,
  ) => void;
  setUploadedExamRegRecords: (
    records: StudentUploadRecord[],
    count?: number,
  ) => void;
  setUploadedCourses: (courses: Course[]) => void;
  setUploadedShuffleRecords: (records: ExamShuffleUploadRecord[]) => void;
  appendUploadedShuffleRecords: (records: ExamShuffleUploadRecord[]) => void;
  setDeanStudentDataUploaded: (v: boolean) => void;
  setDeanExamRegDataUploaded: (v: boolean) => void;
  setDeanShuffleDataUploaded: (v: boolean) => void;
  setDeanCourseFileUploaded: (v: boolean) => void;
  setEnrollmentErrors: (errors: EnrollmentError[]) => void;
  appendEnrollmentErrors: (errors: EnrollmentError[]) => void;
  updateEnrollmentError: (
    id: string,
    updates: Partial<EnrollmentError>,
  ) => void;
  setExamRegErrors: (errors: ExamRegError[]) => void;
  appendExamRegErrors: (errors: ExamRegError[]) => void;
  updateExamRegError: (id: string, updates: Partial<ExamRegError>) => void;
  addHodEditedRecord: (record: HodEditedRecord) => void;
  addEnrollmentSnapshot: (snapshot: FileSnapshot) => void;
  addExamRegSnapshot: (snapshot: FileSnapshot) => void;
  hodUploadedRecords: StudentUploadRecord[];
  setHodUploadedRecords: (records: StudentUploadRecord[]) => void;
  appendHodUploadedRecords: (records: StudentUploadRecord[]) => void;
  enrollmentIndexByStudentId: Map<string, StudentUploadRecord[]>;
  enrollmentIndexByEmail: Map<string, StudentUploadRecord[]>;
  examRegIndexByStudentId: Map<string, StudentUploadRecord[]>;
  examRegIndexByEmail: Map<string, StudentUploadRecord[]>;
  shuffleIndexByStudentId: Map<string, ExamShuffleUploadRecord[]>;
  shuffleIndexByEmail: Map<string, ExamShuffleUploadRecord[]>;
  enrollmentErrorsByStudentId: Map<string, EnrollmentError[]>;
  enrollmentErrorsByEmail: Map<string, EnrollmentError[]>;
  examRegErrorsByStudentId: Map<string, ExamRegError[]>;
  examRegErrorsByEmail: Map<string, ExamRegError[]>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | undefined>(undefined);

// ─── Index builders ───────────────────────────────────────────────────────────

function buildIndex<
  T extends { studentId?: string; email?: string; rollNo?: string },
>(records: T[]): { byId: Map<string, T[]>; byEmail: Map<string, T[]> } {
  const byId = new Map<string, T[]>();
  const byEmail = new Map<string, T[]>();
  for (const r of records) {
    const id = (
      r.studentId ??
      (r as { rollNo?: string }).rollNo ??
      ""
    ).toLowerCase();
    const em = (r.email ?? "").toLowerCase();
    if (id) {
      const arr = byId.get(id) ?? [];
      arr.push(r);
      byId.set(id, arr);
    }
    if (em) {
      const arr = byEmail.get(em) ?? [];
      arr.push(r);
      byEmail.set(em, arr);
    }
  }
  return { byId, byEmail };
}

// ─── Snapshot helpers ─────────────────────────────────────────────────────────

function makeSnapshot(
  fileName: string,
  data: unknown[],
  isActive: boolean,
): FileSnapshot {
  return {
    id: `snap-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    fileName,
    uploadedAt: new Date().toISOString(),
    recordCount: data.length,
    isActive,
    data,
  };
}

function deactivateSnapshots(snapshots: FileSnapshot[]): FileSnapshot[] {
  return snapshots.map((s) => ({ ...s, isActive: false }));
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  function patchCampus(
    campus: string,
    year: string,
    patch: Partial<CampusData>,
  ) {
    const key = campusKey(year || state.selectedYear || "", campus);
    dispatch({ type: "PATCH_CAMPUS", key, patch });
  }

  function getCurrentKey(campus?: string): string {
    const c = campus ?? state.currentUser?.campus ?? state.selectedCampus ?? "";
    const y = state.selectedYear ?? "";
    return campusKey(y, c);
  }

  function getCampusData(campus: string, year: string): CampusData {
    return state.campusData[campusKey(year, campus)] ?? createEmptyCampusData();
  }

  // ── Core setters ────────────────────────────────────────────────────────────

  const setSelectedYear = useCallback(
    (year: string) => dispatch({ type: "SET_YEAR", year }),
    [],
  );
  const setSelectedCampus = useCallback(
    (campus: string) => dispatch({ type: "SET_CAMPUS", campus }),
    [],
  );
  const setCurrentUser = useCallback(
    (user: CurrentUser | null) => dispatch({ type: "SET_USER", user }),
    [],
  );
  const logout = useCallback(() => dispatch({ type: "LOGOUT" }), []);

  // ── HOD permissions ─────────────────────────────────────────────────────────

  function updateHodPermission(
    campus: string,
    year: string,
    branch: string,
    permission: Partial<HodPermission>,
  ) {
    const data = getCampusData(campus, year);
    patchCampus(campus, year, {
      hodPermissions: {
        ...data.hodPermissions,
        [branch]: {
          ...(data.hodPermissions[branch] ?? {
            branch,
            canUpload: false,
            uploadCredits: 0,
          }),
          ...permission,
        },
      },
    });
  }

  // ── HOD edits ───────────────────────────────────────────────────────────────

  function saveHodEdit(
    campus: string,
    year: string,
    edit: Omit<HodEditedRecord, "id">,
  ) {
    const data = getCampusData(campus, year);
    const newRecord: HodEditedRecord = { ...edit, id: `edit-${Date.now()}` };
    patchCampus(campus, year, {
      hodEditedRecords: [...data.hodEditedRecords, newRecord],
    });
  }

  // ── 12-week courses ─────────────────────────────────────────────────────────

  async function uploadTwelveWeekCourses(
    campus: string,
    year: string,
    file: File,
  ) {
    const rows = await parseFile(file);
    const courses = parseCourseRows(rows);
    patchCampus(campus, year, { twelveWeekCourses: courses });
  }

  // ── File versioning ─────────────────────────────────────────────────────────

  function restoreFileSnapshot(
    campus: string,
    year: string,
    type: "enrollment" | "examreg" | "shuffle",
    snapshotId: string,
  ) {
    const data = getCampusData(campus, year);
    if (type === "enrollment") {
      const snaps = data.enrollmentFileSnapshots.map((s) => ({
        ...s,
        isActive: s.id === snapshotId,
      }));
      const active = snaps.find((s) => s.isActive);
      if (!active) return;
      const records = active.data as StudentUploadRecord[];
      const { byId, byEmail } = buildIndex(records);
      patchCampus(campus, year, {
        enrollmentFileSnapshots: snaps,
        enrollmentRecords: records,
        enrollmentTotalCount: records.length,
        enrollmentIndexByStudentId: byId as Map<string, StudentUploadRecord[]>,
        enrollmentIndexByEmail: byEmail as Map<string, StudentUploadRecord[]>,
      });
    } else if (type === "examreg") {
      const snaps = data.examRegFileSnapshots.map((s) => ({
        ...s,
        isActive: s.id === snapshotId,
      }));
      const active = snaps.find((s) => s.isActive);
      if (!active) return;
      const records = active.data as StudentUploadRecord[];
      const done = records.filter(
        (r) => normalizePaymentStatus(r.paymentStatus ?? "") === "done",
      );
      const { byId, byEmail } = buildIndex(records);
      patchCampus(campus, year, {
        examRegFileSnapshots: snaps,
        examRegRecords: records,
        examRegTotalCount: records.length,
        doneRegistrations: done,
        examRegIndexByStudentId: byId as Map<string, StudentUploadRecord[]>,
        examRegIndexByEmail: byEmail as Map<string, StudentUploadRecord[]>,
      });
    } else {
      const snaps = data.shuffleFileSnapshots.map((s) => ({
        ...s,
        isActive: s.id === snapshotId,
      }));
      const active = snaps.find((s) => s.isActive);
      if (!active) return;
      const records = active.data as ExamShuffleUploadRecord[];
      const { byId, byEmail } = buildIndex(
        records.map((r) => ({ ...r, studentId: r.rollNo })),
      );
      patchCampus(campus, year, {
        shuffleFileSnapshots: snaps,
        shuffleRecords: records,
        shuffleIndexByStudentId: byId as Map<string, ExamShuffleUploadRecord[]>,
        shuffleIndexByEmail: byEmail as Map<string, ExamShuffleUploadRecord[]>,
      });
    }
  }

  // ── Dean uploads ────────────────────────────────────────────────────────────

  async function uploadEnrollmentFile(
    campus: string,
    year: string,
    file: File,
  ) {
    const rows = await parseFile(file);
    const courses = getCampusData(campus, year).twelveWeekCourses;
    const { records, errors } = validateEnrollmentErrors(
      rows,
      campus,
      "ALL",
      "dean",
      courses,
    );
    const data = getCampusData(campus, year);
    const oldSnaps = deactivateSnapshots(data.enrollmentFileSnapshots);
    const snap = makeSnapshot(file.name, records, true);
    const { byId: errById, byEmail: errByEmail } = buildIndex(errors);
    const { byId, byEmail } = buildIndex(records);
    patchCampus(campus, year, {
      enrollmentRecords: records,
      enrollmentErrors: errors,
      enrollmentTotalCount: records.length,
      doneRegistrations: [],
      enrollmentFileSnapshots: [...oldSnaps, snap],
      deanStudentDataUploaded: true,
      enrollmentIndexByStudentId: byId as Map<string, StudentUploadRecord[]>,
      enrollmentIndexByEmail: byEmail as Map<string, StudentUploadRecord[]>,
      enrollmentErrorsByStudentId: errById as Map<string, EnrollmentError[]>,
      enrollmentErrorsByEmail: errByEmail as Map<string, EnrollmentError[]>,
      enrollmentFileRecordCount: records.length,
    });
  }

  async function uploadExamRegFile(campus: string, year: string, file: File) {
    const rows = await parseFile(file);
    const courses = getCampusData(campus, year).twelveWeekCourses;
    const { records, errors } = validateExamRegErrors(
      rows,
      campus,
      "ALL",
      courses,
    );
    const done = records.filter(
      (r) => normalizePaymentStatus(r.paymentStatus ?? "") === "done",
    );
    const data = getCampusData(campus, year);
    const oldSnaps = deactivateSnapshots(data.examRegFileSnapshots);
    const snap = makeSnapshot(file.name, records, true);
    const { byId, byEmail } = buildIndex(records);
    const { byId: errById, byEmail: errByEmail } = buildIndex(errors);
    patchCampus(campus, year, {
      examRegRecords: records,
      examRegErrors: errors,
      examRegTotalCount: records.length,
      doneRegistrations: done,
      examRegFileSnapshots: [...oldSnaps, snap],
      deanExamRegDataUploaded: true,
      examRegIndexByStudentId: byId as Map<string, StudentUploadRecord[]>,
      examRegIndexByEmail: byEmail as Map<string, StudentUploadRecord[]>,
      examRegErrorsByStudentId: errById as Map<string, ExamRegError[]>,
      examRegErrorsByEmail: errByEmail as Map<string, ExamRegError[]>,
      examRegFileRecordCount: records.length,
    });
  }

  async function uploadShuffleFile(campus: string, year: string, file: File) {
    const rows = await parseFile(file);
    const records = parseShuffleRows(rows);
    const data = getCampusData(campus, year);
    const oldSnaps = deactivateSnapshots(data.shuffleFileSnapshots);
    const snap = makeSnapshot(file.name, records, true);
    const indexed = records.map((r) => ({ ...r, studentId: r.rollNo }));
    const { byId, byEmail } = buildIndex(indexed);
    patchCampus(campus, year, {
      shuffleRecords: records,
      shuffleFileSnapshots: [...oldSnaps, snap],
      deanShuffleDataUploaded: true,
      shuffleIndexByStudentId: byId as Map<string, ExamShuffleUploadRecord[]>,
      shuffleIndexByEmail: byEmail as Map<string, ExamShuffleUploadRecord[]>,
    });
  }

  // ── HOD uploads ─────────────────────────────────────────────────────────────

  async function uploadHodEnrollmentFile(
    campus: string,
    year: string,
    branch: string,
    file: File,
  ) {
    const rows = await parseFile(file);
    const courses = getCampusData(campus, year).twelveWeekCourses;
    const { records, errors } = validateEnrollmentErrors(
      rows,
      campus,
      branch,
      "hod",
      courses,
    );
    const data = getCampusData(campus, year);
    const merged = [
      ...data.enrollmentRecords.filter(
        (r) => r.source !== "hod" || r.hodBranch !== branch,
      ),
      ...records,
    ];
    const mergedErrors = [
      ...data.enrollmentErrors.filter((e) => e.source !== "hod"),
      ...errors,
    ];
    const { byId, byEmail } = buildIndex(merged);
    const { byId: errById, byEmail: errByEmail } = buildIndex(mergedErrors);
    patchCampus(campus, year, {
      enrollmentRecords: merged,
      enrollmentErrors: mergedErrors,
      enrollmentIndexByStudentId: byId as Map<string, StudentUploadRecord[]>,
      enrollmentIndexByEmail: byEmail as Map<string, StudentUploadRecord[]>,
      enrollmentErrorsByStudentId: errById as Map<string, EnrollmentError[]>,
      enrollmentErrorsByEmail: errByEmail as Map<string, EnrollmentError[]>,
      hodUploadedRecords: [
        ...(data.hodUploadedRecords ?? []).filter(
          (r) => r.hodBranch !== branch,
        ),
        ...records,
      ],
    });
  }

  async function uploadHodExamRegFile(
    campus: string,
    year: string,
    branch: string,
    file: File,
  ) {
    const rows = await parseFile(file);
    const courses = getCampusData(campus, year).twelveWeekCourses;
    const { records, errors } = validateExamRegErrors(
      rows,
      campus,
      branch,
      courses,
    );
    const data = getCampusData(campus, year);
    const merged = [
      ...data.examRegRecords.filter((r) => r.hodBranch !== branch),
      ...records.map((r) => ({ ...r, hodBranch: branch })),
    ];
    const mergedErrors = [
      ...data.examRegErrors.filter(
        (e) => e.branch !== (branch as import("../data/mockData").Branch),
      ),
      ...errors,
    ];
    const { byId, byEmail } = buildIndex(merged);
    const { byId: errById, byEmail: errByEmail } = buildIndex(mergedErrors);
    patchCampus(campus, year, {
      examRegRecords: merged,
      examRegErrors: mergedErrors,
      examRegIndexByStudentId: byId as Map<string, StudentUploadRecord[]>,
      examRegIndexByEmail: byEmail as Map<string, StudentUploadRecord[]>,
      examRegErrorsByStudentId: errById as Map<string, ExamRegError[]>,
      examRegErrorsByEmail: errByEmail as Map<string, ExamRegError[]>,
    });
  }

  // ── Student data getter ──────────────────────────────────────────────────────

  function getStudentData(campus: string, year: string, email: string) {
    const data = getCampusData(campus, year);
    const lower = email.toLowerCase();
    const prefix = lower.split("@")[0];

    function matchStudent<
      T extends { studentId?: string; email?: string; rollNo?: string },
    >(records: T[]): T[] {
      return records.filter((r) => {
        const rEmail = (r.email ?? "").toLowerCase();
        const rId = (
          r.studentId ??
          (r as { rollNo?: string }).rollNo ??
          ""
        ).toLowerCase();
        return (
          rEmail === lower || rId === prefix || rEmail.split("@")[0] === prefix
        );
      });
    }

    const enrollmentRecords = matchStudent(data.enrollmentRecords);
    const examRegRecords = matchStudent(data.examRegRecords);
    const shuffleMatch = matchStudent(
      data.shuffleRecords.map((r) => ({ ...r, studentId: r.rollNo })),
    );
    const shuffleRecord =
      shuffleMatch.length > 0
        ? (data.shuffleRecords.find(
            (r) =>
              r.rollNo.toLowerCase() ===
              shuffleMatch[0].studentId?.toLowerCase(),
          ) ?? null)
        : null;
    const enrollmentErrors = matchStudent(data.enrollmentErrors);
    const examRegErrors = matchStudent(data.examRegErrors);

    return {
      enrollmentRecords,
      examRegRecords,
      shuffleRecord,
      enrollmentErrors,
      examRegErrors,
    };
  }

  // ── Legacy compat (current campus from currentUser) ──────────────────────────

  const curCampus = state.currentUser?.campus ?? state.selectedCampus ?? "";
  const curYear = state.selectedYear ?? "";
  const campus = state.campusData[getCurrentKey()] ?? createEmptyCampusData();

  function legacyPatch(patch: Partial<CampusData>) {
    const key = getCurrentKey();
    dispatch({ type: "PATCH_CAMPUS", key, patch });
  }

  const emptyEnrollIdx = new Map<string, StudentUploadRecord[]>();
  const emptyExamIdx = new Map<string, StudentUploadRecord[]>();
  const emptyShuffleIdx = new Map<string, ExamShuffleUploadRecord[]>();
  const emptyErrIdx = new Map<string, EnrollmentError[]>();
  const emptyExamErrIdx = new Map<string, ExamRegError[]>();

  const value: AppContextValue = {
    selectedYear: state.selectedYear,
    selectedCampus: state.selectedCampus,
    currentUser: state.currentUser,
    setSelectedYear,
    setSelectedCampus,
    setCurrentUser,
    logout,
    uploadEnrollmentFile,
    uploadExamRegFile,
    uploadShuffleFile,
    uploadHodEnrollmentFile,
    uploadHodExamRegFile,
    restoreFileSnapshot,
    updateHodPermissionFull: updateHodPermission,
    saveHodEdit,
    uploadTwelveWeekCourses,
    getCampusData,
    getStudentData,

    // Legacy compat
    selectedAcademicYear: curYear,
    setSelectedAcademicYear: setSelectedYear,
    hodPermissions: campus.hodPermissions,
    // 2-arg legacy signature used by old HODDashboard + DeanDashboard pages
    updateHodPermission: (branch, permission) =>
      updateHodPermission(curCampus, curYear, branch, permission),
    updateHodPermissionLegacy: (branch, permission) =>
      updateHodPermission(curCampus, curYear, branch, permission),
    enrollmentErrors: campus.enrollmentErrors,
    examRegErrors: campus.examRegErrors,
    uploadedStudentRecords: campus.enrollmentRecords,
    uploadedExamRegRecords: campus.examRegRecords,
    uploadedCourses: campus.twelveWeekCourses,
    uploadedShuffleRecords: campus.shuffleRecords,
    deanStudentDataUploaded: campus.deanStudentDataUploaded ?? false,
    deanExamRegDataUploaded: campus.deanExamRegDataUploaded ?? false,
    deanShuffleDataUploaded: campus.deanShuffleDataUploaded ?? false,
    deanCourseFileUploaded: campus.deanCourseFileUploaded ?? false,
    hodEditedRecords: campus.hodEditedRecords,
    enrollmentFileSnapshots: campus.enrollmentFileSnapshots,
    examRegFileSnapshots: campus.examRegFileSnapshots,
    enrollmentFileRecordCount: campus.enrollmentTotalCount,
    examRegFileRecordCount: campus.examRegTotalCount,
    hodUploadedRecords: campus.hodUploadedRecords ?? [],

    setUploadedStudentRecords: (records, count) => {
      const { byId, byEmail } = buildIndex(records);
      legacyPatch({
        enrollmentRecords: records,
        enrollmentTotalCount: count ?? records.length,
        enrollmentIndexByStudentId: byId as Map<string, StudentUploadRecord[]>,
        enrollmentIndexByEmail: byEmail as Map<string, StudentUploadRecord[]>,
      });
    },
    setUploadedExamRegRecords: (records, count) => {
      const { byId, byEmail } = buildIndex(records);
      legacyPatch({
        examRegRecords: records,
        examRegTotalCount: count ?? records.length,
        examRegIndexByStudentId: byId as Map<string, StudentUploadRecord[]>,
        examRegIndexByEmail: byEmail as Map<string, StudentUploadRecord[]>,
      });
    },
    setUploadedCourses: (courses) =>
      legacyPatch({ twelveWeekCourses: courses }),
    setUploadedShuffleRecords: (records) => {
      const indexed = records.map((r) => ({ ...r, studentId: r.rollNo }));
      const { byId, byEmail } = buildIndex(indexed);
      legacyPatch({
        shuffleRecords: records,
        shuffleIndexByStudentId: byId as Map<string, ExamShuffleUploadRecord[]>,
        shuffleIndexByEmail: byEmail as Map<string, ExamShuffleUploadRecord[]>,
      });
    },
    appendUploadedShuffleRecords: (records) => {
      const combined = [...campus.shuffleRecords, ...records];
      const indexed = combined.map((r) => ({ ...r, studentId: r.rollNo }));
      const { byId, byEmail } = buildIndex(indexed);
      legacyPatch({
        shuffleRecords: combined,
        shuffleIndexByStudentId: byId as Map<string, ExamShuffleUploadRecord[]>,
        shuffleIndexByEmail: byEmail as Map<string, ExamShuffleUploadRecord[]>,
      });
    },
    setDeanStudentDataUploaded: (v) =>
      legacyPatch({ deanStudentDataUploaded: v }),
    setDeanExamRegDataUploaded: (v) =>
      legacyPatch({ deanExamRegDataUploaded: v }),
    setDeanShuffleDataUploaded: (v) =>
      legacyPatch({ deanShuffleDataUploaded: v }),
    setDeanCourseFileUploaded: (v) =>
      legacyPatch({ deanCourseFileUploaded: v }),
    setEnrollmentErrors: (errors) => {
      const { byId, byEmail } = buildIndex(errors);
      legacyPatch({
        enrollmentErrors: errors,
        enrollmentErrorsByStudentId: byId as Map<string, EnrollmentError[]>,
        enrollmentErrorsByEmail: byEmail as Map<string, EnrollmentError[]>,
      });
    },
    appendEnrollmentErrors: (errors) => {
      const combined = [...campus.enrollmentErrors, ...errors];
      const { byId, byEmail } = buildIndex(combined);
      legacyPatch({
        enrollmentErrors: combined,
        enrollmentErrorsByStudentId: byId as Map<string, EnrollmentError[]>,
        enrollmentErrorsByEmail: byEmail as Map<string, EnrollmentError[]>,
      });
    },
    updateEnrollmentError: (id, updates) => {
      const newErrors = campus.enrollmentErrors.map((e) =>
        e.id === id ? { ...e, ...updates } : e,
      );
      const { byId, byEmail } = buildIndex(newErrors);
      legacyPatch({
        enrollmentErrors: newErrors,
        enrollmentErrorsByStudentId: byId as Map<string, EnrollmentError[]>,
        enrollmentErrorsByEmail: byEmail as Map<string, EnrollmentError[]>,
      });
    },
    setExamRegErrors: (errors) => {
      const { byId, byEmail } = buildIndex(errors);
      legacyPatch({
        examRegErrors: errors,
        examRegErrorsByStudentId: byId as Map<string, ExamRegError[]>,
        examRegErrorsByEmail: byEmail as Map<string, ExamRegError[]>,
      });
    },
    appendExamRegErrors: (errors) => {
      const combined = [...campus.examRegErrors, ...errors];
      const { byId, byEmail } = buildIndex(combined);
      legacyPatch({
        examRegErrors: combined,
        examRegErrorsByStudentId: byId as Map<string, ExamRegError[]>,
        examRegErrorsByEmail: byEmail as Map<string, ExamRegError[]>,
      });
    },
    updateExamRegError: (id, updates) => {
      const newErrors = campus.examRegErrors.map((e) =>
        e.id === id ? { ...e, ...updates } : e,
      );
      const { byId, byEmail } = buildIndex(newErrors);
      legacyPatch({
        examRegErrors: newErrors,
        examRegErrorsByStudentId: byId as Map<string, ExamRegError[]>,
        examRegErrorsByEmail: byEmail as Map<string, ExamRegError[]>,
      });
    },
    addHodEditedRecord: (record) =>
      legacyPatch({ hodEditedRecords: [...campus.hodEditedRecords, record] }),
    addEnrollmentSnapshot: (snap) =>
      legacyPatch({
        enrollmentFileSnapshots: [...campus.enrollmentFileSnapshots, snap],
      }),
    addExamRegSnapshot: (snap) =>
      legacyPatch({
        examRegFileSnapshots: [...campus.examRegFileSnapshots, snap],
      }),
    setHodUploadedRecords: (records) =>
      legacyPatch({ hodUploadedRecords: records }),
    appendHodUploadedRecords: (records) =>
      legacyPatch({
        hodUploadedRecords: [...(campus.hodUploadedRecords ?? []), ...records],
      }),

    enrollmentIndexByStudentId:
      (campus.enrollmentIndexByStudentId as Map<
        string,
        StudentUploadRecord[]
      >) ?? emptyEnrollIdx,
    enrollmentIndexByEmail:
      (campus.enrollmentIndexByEmail as Map<string, StudentUploadRecord[]>) ??
      emptyEnrollIdx,
    examRegIndexByStudentId:
      (campus.examRegIndexByStudentId as Map<string, StudentUploadRecord[]>) ??
      emptyExamIdx,
    examRegIndexByEmail:
      (campus.examRegIndexByEmail as Map<string, StudentUploadRecord[]>) ??
      emptyExamIdx,
    shuffleIndexByStudentId:
      (campus.shuffleIndexByStudentId as Map<
        string,
        ExamShuffleUploadRecord[]
      >) ?? emptyShuffleIdx,
    shuffleIndexByEmail:
      (campus.shuffleIndexByEmail as Map<string, ExamShuffleUploadRecord[]>) ??
      emptyShuffleIdx,
    enrollmentErrorsByStudentId:
      (campus.enrollmentErrorsByStudentId as Map<string, EnrollmentError[]>) ??
      emptyErrIdx,
    enrollmentErrorsByEmail:
      (campus.enrollmentErrorsByEmail as Map<string, EnrollmentError[]>) ??
      emptyErrIdx,
    examRegErrorsByStudentId:
      (campus.examRegErrorsByStudentId as Map<string, ExamRegError[]>) ??
      emptyExamErrIdx,
    examRegErrorsByEmail:
      (campus.examRegErrorsByEmail as Map<string, ExamRegError[]>) ??
      emptyExamErrIdx,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
