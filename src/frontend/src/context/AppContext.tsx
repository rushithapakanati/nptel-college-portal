import { type ReactNode, createContext, useContext, useState } from "react";
import {
  type Branch,
  type Course,
  DEFAULT_HOD_PERMISSIONS,
  type EnrollmentError,
  type ExamRegError,
  type ExamShuffleUploadRecord,
  type HodEditedRecord,
  type HodPermission,
  type HodPermissions,
  type StudentUploadRecord,
} from "../data/mockData";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = "student" | "hod" | "dean";

export interface CurrentUser {
  role: UserRole;
  college: string;
  branch?: Branch;
  email?: string;
}

// Per-campus data store
interface CampusData {
  hodPermissions: HodPermissions;
  enrollmentErrors: EnrollmentError[];
  examRegErrors: ExamRegError[];
  uploadedStudentRecords: StudentUploadRecord[];
  uploadedCourses: Course[];
  deanStudentDataUploaded: boolean;
  deanCourseFileUploaded: boolean;
  deanExamRegDataUploaded: boolean;
  // Exam shuffle data (uploaded separately by dean)
  deanShuffleDataUploaded: boolean;
  uploadedShuffleRecords: ExamShuffleUploadRecord[];
  // HOD edit history — shown in HOD + Dean dashboards
  hodEditedRecords: HodEditedRecord[];
  // Records uploaded by HOD (for student dashboard lookup)
  hodUploadedRecords: StudentUploadRecord[];
}

function createEmptyCampusData(): CampusData {
  return {
    hodPermissions: JSON.parse(JSON.stringify(DEFAULT_HOD_PERMISSIONS)),
    enrollmentErrors: [],
    examRegErrors: [],
    uploadedStudentRecords: [],
    uploadedCourses: [],
    deanStudentDataUploaded: false,
    deanCourseFileUploaded: false,
    deanExamRegDataUploaded: false,
    deanShuffleDataUploaded: false,
    uploadedShuffleRecords: [],
    hodEditedRecords: [],
    hodUploadedRecords: [],
  };
}

interface AppContextValue {
  currentUser: CurrentUser | null;
  setCurrentUser: (user: CurrentUser | null) => void;

  // These operate on the currently-active campus (derived from currentUser.college)
  hodPermissions: HodPermissions;
  updateHodPermission: (
    branch: Branch,
    permission: Partial<HodPermission>,
  ) => void;
  enrollmentErrors: EnrollmentError[];
  updateEnrollmentError: (
    id: string,
    updates: Partial<EnrollmentError>,
  ) => void;
  setEnrollmentErrors: (errors: EnrollmentError[]) => void;
  appendEnrollmentErrors: (errors: EnrollmentError[]) => void;
  examRegErrors: ExamRegError[];
  updateExamRegError: (id: string, updates: Partial<ExamRegError>) => void;
  setExamRegErrors: (errors: ExamRegError[]) => void;
  appendExamRegErrors: (errors: ExamRegError[]) => void;
  uploadedStudentRecords: StudentUploadRecord[];
  setUploadedStudentRecords: (records: StudentUploadRecord[]) => void;
  uploadedCourses: Course[];
  setUploadedCourses: (courses: Course[]) => void;
  deanStudentDataUploaded: boolean;
  setDeanStudentDataUploaded: (v: boolean) => void;
  deanCourseFileUploaded: boolean;
  setDeanCourseFileUploaded: (v: boolean) => void;
  deanExamRegDataUploaded: boolean;
  setDeanExamRegDataUploaded: (v: boolean) => void;
  // Exam shuffle data
  deanShuffleDataUploaded: boolean;
  setDeanShuffleDataUploaded: (v: boolean) => void;
  uploadedShuffleRecords: ExamShuffleUploadRecord[];
  setUploadedShuffleRecords: (records: ExamShuffleUploadRecord[]) => void;
  appendUploadedShuffleRecords: (records: ExamShuffleUploadRecord[]) => void;
  // HOD edit tracking
  hodEditedRecords: HodEditedRecord[];
  addHodEditedRecord: (record: HodEditedRecord) => void;
  // HOD-uploaded records (for student dashboard)
  hodUploadedRecords: StudentUploadRecord[];
  setHodUploadedRecords: (records: StudentUploadRecord[]) => void;
  appendHodUploadedRecords: (records: StudentUploadRecord[]) => void;
  logout: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // Keyed by lowercase campus name — completely isolated per campus
  const [campusDataMap, setCampusDataMap] = useState<
    Record<string, CampusData>
  >({});

  // Returns the normalized campus key for state lookups
  function campusKey(college?: string): string {
    return (college ?? currentUser?.college ?? "").toLowerCase().trim();
  }

  // Returns the campus data for the current (or specified) campus, creating it if missing
  function getCampusData(college?: string): CampusData {
    const key = campusKey(college);
    return campusDataMap[key] ?? createEmptyCampusData();
  }

  // Updates a subset of one campus's data
  function patchCampus(update: Partial<CampusData>, college?: string) {
    const key = campusKey(college);
    setCampusDataMap((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? createEmptyCampusData()), ...update },
    }));
  }

  // ── Derived campus state ──────────────────────────────────────────────────
  const campus = getCampusData();

  // ── Accessors ─────────────────────────────────────────────────────────────

  function updateHodPermission(
    branch: Branch,
    permission: Partial<HodPermission>,
  ) {
    const key = campusKey();
    setCampusDataMap((prev) => {
      const existing = prev[key] ?? createEmptyCampusData();
      return {
        ...prev,
        [key]: {
          ...existing,
          hodPermissions: {
            ...existing.hodPermissions,
            [branch]: { ...existing.hodPermissions[branch], ...permission },
          },
        },
      };
    });
  }

  function updateEnrollmentError(
    id: string,
    updates: Partial<EnrollmentError>,
  ) {
    const key = campusKey();
    setCampusDataMap((prev) => {
      const existing = prev[key] ?? createEmptyCampusData();
      return {
        ...prev,
        [key]: {
          ...existing,
          enrollmentErrors: existing.enrollmentErrors.map((e) =>
            e.id === id ? { ...e, ...updates } : e,
          ),
        },
      };
    });
  }

  function updateExamRegError(id: string, updates: Partial<ExamRegError>) {
    const key = campusKey();
    setCampusDataMap((prev) => {
      const existing = prev[key] ?? createEmptyCampusData();
      return {
        ...prev,
        [key]: {
          ...existing,
          examRegErrors: existing.examRegErrors.map((e) =>
            e.id === id ? { ...e, ...updates } : e,
          ),
        },
      };
    });
  }

  function appendEnrollmentErrors(newErrors: EnrollmentError[]) {
    const key = campusKey();
    setCampusDataMap((prev) => {
      const existing = prev[key] ?? createEmptyCampusData();
      return {
        ...prev,
        [key]: {
          ...existing,
          enrollmentErrors: [...existing.enrollmentErrors, ...newErrors],
        },
      };
    });
  }

  function appendExamRegErrors(newErrors: ExamRegError[]) {
    const key = campusKey();
    setCampusDataMap((prev) => {
      const existing = prev[key] ?? createEmptyCampusData();
      return {
        ...prev,
        [key]: {
          ...existing,
          examRegErrors: [...existing.examRegErrors, ...newErrors],
        },
      };
    });
  }

  function addHodEditedRecord(record: HodEditedRecord) {
    const key = campusKey();
    setCampusDataMap((prev) => {
      const existing = prev[key] ?? createEmptyCampusData();
      return {
        ...prev,
        [key]: {
          ...existing,
          hodEditedRecords: [...(existing.hodEditedRecords ?? []), record],
        },
      };
    });
  }

  function logout() {
    setCurrentUser(null);
  }

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,

        hodPermissions: campus.hodPermissions,
        updateHodPermission,

        enrollmentErrors: campus.enrollmentErrors,
        updateEnrollmentError,
        setEnrollmentErrors: (errors) =>
          patchCampus({ enrollmentErrors: errors }),
        appendEnrollmentErrors,

        examRegErrors: campus.examRegErrors,
        updateExamRegError,
        setExamRegErrors: (errors) => patchCampus({ examRegErrors: errors }),
        appendExamRegErrors,

        uploadedStudentRecords: campus.uploadedStudentRecords,
        setUploadedStudentRecords: (records) =>
          patchCampus({ uploadedStudentRecords: records }),

        uploadedCourses: campus.uploadedCourses,
        setUploadedCourses: (courses) =>
          patchCampus({ uploadedCourses: courses }),

        deanStudentDataUploaded: campus.deanStudentDataUploaded,
        setDeanStudentDataUploaded: (v) =>
          patchCampus({ deanStudentDataUploaded: v }),

        deanCourseFileUploaded: campus.deanCourseFileUploaded,
        setDeanCourseFileUploaded: (v) =>
          patchCampus({ deanCourseFileUploaded: v }),

        deanExamRegDataUploaded: campus.deanExamRegDataUploaded,
        setDeanExamRegDataUploaded: (v) =>
          patchCampus({ deanExamRegDataUploaded: v }),

        deanShuffleDataUploaded: campus.deanShuffleDataUploaded,
        setDeanShuffleDataUploaded: (v) =>
          patchCampus({ deanShuffleDataUploaded: v }),

        uploadedShuffleRecords: campus.uploadedShuffleRecords ?? [],
        setUploadedShuffleRecords: (records) =>
          patchCampus({ uploadedShuffleRecords: records }),
        appendUploadedShuffleRecords: (records) => {
          const key = campusKey();
          setCampusDataMap((prev) => {
            const existing = prev[key] ?? createEmptyCampusData();
            return {
              ...prev,
              [key]: {
                ...existing,
                uploadedShuffleRecords: [
                  ...(existing.uploadedShuffleRecords ?? []),
                  ...records,
                ],
              },
            };
          });
        },

        hodEditedRecords: campus.hodEditedRecords ?? [],
        addHodEditedRecord,

        hodUploadedRecords: campus.hodUploadedRecords ?? [],
        setHodUploadedRecords: (records) =>
          patchCampus({ hodUploadedRecords: records }),
        appendHodUploadedRecords: (records) => {
          const key = campusKey();
          setCampusDataMap((prev) => {
            const existing = prev[key] ?? createEmptyCampusData();
            return {
              ...prev,
              [key]: {
                ...existing,
                hodUploadedRecords: [
                  ...(existing.hodUploadedRecords ?? []),
                  ...records,
                ],
              },
            };
          });
        },

        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
