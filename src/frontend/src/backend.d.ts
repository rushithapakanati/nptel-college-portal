import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CourseRecord {
    duration: string;
    yearKey: string;
    category: string;
    courseName: string;
    courseId: string;
    college: string;
}
export interface ExamShufflePage {
    hasMore: boolean;
    data: Array<ExamShuffleRecord>;
    totalCount: bigint;
}
export interface BranchStats {
    branch: string;
    examRegDoFirst: bigint;
    examRegErrors: bigint;
    examRegDone: bigint;
    examRegRedo: bigint;
    examRegTotal: bigint;
    enrollmentErrors: bigint;
    enrollmentTotal: bigint;
}
export interface HODPermission {
    branch: string;
    yearKey: string;
    editCredits: bigint;
    uploadCredits: bigint;
    college: string;
}
export interface FileSnapshot {
    id: string;
    isActive: boolean;
    filename: string;
    timestamp: bigint;
    recordCount: bigint;
}
export interface ExamShuffleRecord {
    id: string;
    branch: string;
    studentId: string;
    yearKey: string;
    examCenter: string;
    email: string;
    rollNo: string;
    examDate: string;
    courseName: string;
    courseId: string;
    timeSlot: string;
    college: string;
    hallTicketNo: string;
    seatingPosition: string;
}
export interface EnrollmentPage {
    hasMore: boolean;
    data: Array<EnrollmentRecord>;
    totalCount: bigint;
}
export interface EditedRecord {
    id: string;
    field: string;
    branch: string;
    oldValue: string;
    studentId: string;
    yearKey: string;
    newValue: string;
    recordType: string;
    timestamp: bigint;
    editedBy: string;
    college: string;
}
export interface ExamRegRecord {
    id: string;
    branch: string;
    paymentStatus: string;
    studentId: string;
    yearKey: string;
    errorDescription: string;
    email: string;
    errorType: string;
    registrationStatus: string;
    courseName: string;
    courseId: string;
    college: string;
    hasError: boolean;
}
export interface ExamRegPage {
    hasMore: boolean;
    data: Array<ExamRegRecord>;
    totalCount: bigint;
}
export interface OverviewStats {
    examRegDoFirst: bigint;
    cleanEnrollment: bigint;
    totalEnrolled: bigint;
    examRegErrors: bigint;
    examRegDone: bigint;
    examRegRedo: bigint;
    enrollmentErrors: bigint;
    totalRegistered: bigint;
}
export interface EnrollmentRecord {
    id: string;
    status: string;
    branch: string;
    duration: string;
    studentId: string;
    yearKey: string;
    errorDescription: string;
    email: string;
    errorType: string;
    courseName: string;
    courseId: string;
    college: string;
    hasError: boolean;
}
export interface backendInterface {
    editEnrollmentRecord(college: string, yearKey: string, branch: string, recordId: string, updated: EnrollmentRecord, editorId: string, field: string, oldValue: string, newValue: string): Promise<boolean>;
    editExamRegRecord(college: string, yearKey: string, branch: string, recordId: string, updated: ExamRegRecord, editorId: string, field: string, oldValue: string, newValue: string): Promise<boolean>;
    getAllCourses(college: string, yearKey: string): Promise<Array<CourseRecord>>;
    getAllEditedRecords(college: string, yearKey: string): Promise<Array<EditedRecord>>;
    getAllEnrollmentErrors(college: string, yearKey: string): Promise<Array<EnrollmentRecord>>;
    getAllEnrollmentRecords(college: string, yearKey: string): Promise<Array<EnrollmentRecord>>;
    getAllExamRegErrors(college: string, yearKey: string): Promise<Array<ExamRegRecord>>;
    getAllExamRegRecords(college: string, yearKey: string): Promise<Array<ExamRegRecord>>;
    getAllExamShuffle(college: string, yearKey: string): Promise<Array<ExamShuffleRecord>>;
    getAllHODPermissions(college: string, yearKey: string): Promise<Array<HODPermission>>;
    getCoursesByBranchAndCollege(college: string, yearKey: string, branch: string | null): Promise<Array<CourseRecord>>;
    getEditedRecords(college: string, yearKey: string, branch: string): Promise<Array<EditedRecord>>;
    getEnrollmentByBranch(college: string, yearKey: string, branch: string): Promise<Array<EnrollmentRecord>>;
    getEnrollmentRecordsPaged(college: string, yearKey: string, branch: string | null, errorOnly: boolean | null, offset: bigint, limit: bigint): Promise<EnrollmentPage>;
    getExamRegByBranch(college: string, yearKey: string, branch: string): Promise<Array<ExamRegRecord>>;
    getExamRegRecordsPaged(college: string, yearKey: string, branch: string | null, errorOnly: boolean | null, offset: bigint, limit: bigint): Promise<ExamRegPage>;
    getExamShuffleByStudent(college: string, yearKey: string, studentId: string): Promise<Array<ExamShuffleRecord>>;
    getExamShufflePaged(college: string, yearKey: string, offset: bigint, limit: bigint): Promise<ExamShufflePage>;
    getFileSnapshots(college: string, yearKey: string, fileType: string): Promise<Array<FileSnapshot>>;
    getHODPermission(college: string, yearKey: string, branch: string): Promise<HODPermission | null>;
    getOverviewStats(college: string, yearKey: string): Promise<OverviewStats>;
    getStatsByBranch(college: string, yearKey: string, branch: string): Promise<BranchStats>;
    getStudentEnrollment(college: string, yearKey: string, studentId: string): Promise<Array<EnrollmentRecord>>;
    getStudentExamReg(college: string, yearKey: string, studentId: string): Promise<Array<ExamRegRecord>>;
    isShuffleUploaded(college: string, yearKey: string): Promise<boolean>;
    restoreSnapshot(college: string, yearKey: string, fileType: string, snapshotId: string): Promise<boolean>;
    setHODPermission(college: string, yearKey: string, branch: string, uploadCredits: bigint, editCredits: bigint): Promise<void>;
    uploadCourses(_college: string, yearKey: string, records: Array<CourseRecord>): Promise<void>;
    uploadEnrollmentRecords(college: string, yearKey: string, branch: string, records: Array<EnrollmentRecord>): Promise<boolean>;
    uploadEnrollmentRecordsDean(college: string, yearKey: string, fileId: string, fileName: string, records: Array<EnrollmentRecord>): Promise<void>;
    uploadExamRegRecords(college: string, yearKey: string, branch: string, records: Array<ExamRegRecord>): Promise<boolean>;
    uploadExamRegRecordsDean(college: string, yearKey: string, fileId: string, fileName: string, records: Array<ExamRegRecord>): Promise<void>;
    uploadExamShuffleRecords(college: string, yearKey: string, fileId: string, fileName: string, records: Array<ExamShuffleRecord>): Promise<void>;
}
