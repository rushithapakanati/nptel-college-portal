import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Filter,
  Lock,
  LogOut,
  PenLine,
  PlusCircle,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useAppContext } from "../context/AppContext";
import type {
  Branch,
  EnrollmentError,
  ExamRegError,
  HodEditedRecord,
} from "../data/mockData";
import {
  parseExamRegRecords,
  parseUploadedFile,
  validateEnrollmentRows,
  validateExamRegRows,
} from "../utils/fileParser";

export default function HODDashboard() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as {
    collegeName?: string;
    branch?: string;
  };
  const collegeName = params.collegeName
    ? decodeURIComponent(params.collegeName)
    : "";
  const branch = (params.branch ?? "CSE") as Branch;

  const {
    hodPermissions,
    updateHodPermission,
    enrollmentErrors,
    updateEnrollmentError,
    appendEnrollmentErrors,
    examRegErrors,
    updateExamRegError,
    appendExamRegErrors,
    deanExamRegDataUploaded,
    deanStudentDataUploaded,
    hodEditedRecords,
    addHodEditedRecord,
    appendHodUploadedRecords,
    hodUploadedRecords,
    uploadedCourses,
    logout,
  } = useAppContext();

  const [refreshKey, setRefreshKey] = useState(0);
  function handleRefresh() {
    setRefreshKey((k) => k + 1);
    toast.success("Dashboard refreshed.");
  }

  const permissions = hodPermissions[branch];
  const branchEnrollErrors = enrollmentErrors.filter(
    (e) => e.branch === branch,
  );
  const branchExamErrors = examRegErrors.filter((e) => e.branch === branch);

  // HOD has uploaded data for this branch (either enrollment or exam reg)
  const hodHasUploadedEnrollment =
    (permissions.enrollmentFileList ?? []).length > 0 ||
    hodUploadedRecords.some(
      (r) => r.branch === branch && r.enrollmentStatus !== undefined,
    );
  const hodHasUploadedExamReg =
    (permissions.examRegFileList ?? []).length > 0 ||
    hodUploadedRecords.some(
      (r) => r.branch === branch && r.paymentStatus !== undefined,
    );

  // Show enrollment errors if Dean uploaded OR HOD uploaded
  const showEnrollmentErrors =
    deanStudentDataUploaded || hodHasUploadedEnrollment;
  // Show exam reg errors if Dean uploaded OR HOD uploaded exam reg data
  const showExamRegErrors = deanExamRegDataUploaded || hodHasUploadedExamReg;

  // File upload state — multiple files
  const enrollFileRef = useRef<HTMLInputElement>(null);
  const examFileRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [editingEnrollId, setEditingEnrollId] = useState<string | null>(null);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [editEnrollForm, setEditEnrollForm] = useState<
    Partial<EnrollmentError>
  >({});
  const [editExamForm, setEditExamForm] = useState<Partial<ExamRegError>>({});

  // Error type filter state
  const [enrollErrorTypeFilter, setEnrollErrorTypeFilter] =
    useState<string>("All");
  const [examErrorTypeFilter, setExamErrorTypeFilter] = useState<string>("All");

  // Unique error types from branch errors
  const uniqueEnrollErrorTypes = Array.from(
    new Set(branchEnrollErrors.map((e) => e.errorType)),
  );
  const uniqueExamErrorTypes = Array.from(
    new Set(branchExamErrors.map((e) => e.errorType)),
  );

  // Filtered lists
  const filteredEnrollErrors =
    enrollErrorTypeFilter === "All"
      ? branchEnrollErrors
      : branchEnrollErrors.filter((e) => e.errorType === enrollErrorTypeFilter);
  const filteredExamErrors =
    examErrorTypeFilter === "All"
      ? branchExamErrors
      : branchExamErrors.filter((e) => e.errorType === examErrorTypeFilter);

  // ── Pagination (50 errors per page) ──
  const HOD_ERROR_PAGE_SIZE = 50;
  const [enrollErrorPage, setEnrollErrorPage] = useState(1);
  const [examErrorPage, setExamErrorPage] = useState(1);

  const totalEnrollPages = Math.ceil(
    filteredEnrollErrors.length / HOD_ERROR_PAGE_SIZE,
  );
  const totalExamPages = Math.ceil(
    filteredExamErrors.length / HOD_ERROR_PAGE_SIZE,
  );

  const pagedEnrollErrors = filteredEnrollErrors.slice(
    (enrollErrorPage - 1) * HOD_ERROR_PAGE_SIZE,
    enrollErrorPage * HOD_ERROR_PAGE_SIZE,
  );
  const pagedExamErrors = filteredExamErrors.slice(
    (examErrorPage - 1) * HOD_ERROR_PAGE_SIZE,
    examErrorPage * HOD_ERROR_PAGE_SIZE,
  );

  function handleLogout() {
    logout();
    navigate({ to: "/" });
  }

  async function handleEnrollUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Save file reference before resetting input
    e.target.value = "";
    if (!permissions.canUploadEnrollment) {
      toast.error("Upload access not granted by Dean.");
      return;
    }
    if (permissions.enrollmentEdits <= 0) {
      toast.error("No upload credits remaining. Ask Dean for more.");
      return;
    }

    const newList = [...(permissions.enrollmentFileList ?? []), file.name];
    updateHodPermission(branch, {
      enrollmentUploaded: true,
      enrollmentFileList: newList,
      enrollmentEdits: Math.max(0, permissions.enrollmentEdits - 1),
    });

    // Actually parse and validate the file
    try {
      toast.info(`Parsing enrollment file "${file.name}"...`);
      const rows = await parseUploadedFile(file);
      const uploadedCourseIds = uploadedCourses.map((c) => c.courseId);
      const { records, errors } = validateEnrollmentRows(
        rows,
        collegeName,
        uploadedCourseIds,
        uploadedCourses,
      );
      // Append to campus-wide errors and student records
      appendEnrollmentErrors(errors);
      appendHodUploadedRecords(records);
      toast.success(
        `Enrollment file "${file.name}" parsed: ${records.length} records, ${errors.length} errors found. Credits remaining: ${permissions.enrollmentEdits - 1}`,
      );
    } catch (err) {
      toast.error(
        `Failed to parse enrollment file: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  function handleEnrollDeleteFile(fileName: string) {
    const newList = (permissions.enrollmentFileList ?? []).filter(
      (n) => n !== fileName,
    );
    updateHodPermission(branch, {
      enrollmentFileList: newList,
      enrollmentUploaded: newList.length > 0,
    });
    toast.info(`File "${fileName}" removed.`);
  }

  async function handleExamUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Save file reference before resetting input
    e.target.value = "";
    if (!permissions.canUploadExamReg) {
      toast.error("Exam registration upload access not granted by Dean.");
      return;
    }
    if (permissions.examRegEdits <= 0) {
      toast.error("No upload credits remaining. Ask Dean for more.");
      return;
    }

    const newList = [...(permissions.examRegFileList ?? []), file.name];
    updateHodPermission(branch, {
      examRegUploaded: true,
      examRegFileList: newList,
      examRegEdits: Math.max(0, permissions.examRegEdits - 1),
    });

    // Actually parse and validate the exam reg file
    try {
      toast.info(`Parsing exam registration file "${file.name}"...`);
      const rows = await parseUploadedFile(file);
      const uploadedCourseIds = uploadedCourses.map((c) => c.courseId);
      const enrollmentIds = []; // HOD doesn't have cross-ref to enrollment IDs
      const examErrors = validateExamRegRows(
        rows,
        enrollmentIds,
        uploadedCourseIds,
        collegeName,
      );
      const examRecords = parseExamRegRecords(rows);
      // Append errors and exam records to campus state
      appendExamRegErrors(examErrors);
      appendHodUploadedRecords(examRecords);
      toast.success(
        `Exam reg file "${file.name}" parsed: ${examRecords.length} records, ${examErrors.length} errors found. Credits remaining: ${permissions.examRegEdits - 1}`,
      );
    } catch (err) {
      toast.error(
        `Failed to parse exam reg file: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  function handleExamDeleteFile(fileName: string) {
    const newList = (permissions.examRegFileList ?? []).filter(
      (n) => n !== fileName,
    );
    updateHodPermission(branch, {
      examRegFileList: newList,
      examRegUploaded: newList.length > 0,
    });
    toast.info(`File "${fileName}" removed.`);
  }

  function startEditEnroll(err: EnrollmentError) {
    if (permissions.enrollmentEdits <= 0) {
      toast.error("No edit credits remaining. Ask Dean for more.");
      return;
    }
    setEditingEnrollId(err.id);
    setEditEnrollForm({
      studentId: err.studentId,
      email: err.email,
      courseId: err.courseId,
    });
  }

  function saveEditEnroll(id: string) {
    const origErr = filteredEnrollErrors.find((e) => e.id === id);
    updateEnrollmentError(id, { ...editEnrollForm, edited: true });
    updateHodPermission(branch, {
      enrollmentEdits: Math.max(0, permissions.enrollmentEdits - 1),
    });
    if (origErr) {
      const editRecord: HodEditedRecord = {
        id,
        studentId: origErr.studentId,
        email: origErr.email,
        courseId: origErr.courseId,
        errorType: origErr.errorType,
        branch,
        fileType: "Enrollment",
        editedAt: new Date().toISOString(),
        newStudentId: editEnrollForm.studentId,
        newEmail: editEnrollForm.email,
        newCourseId: editEnrollForm.courseId,
      };
      addHodEditedRecord(editRecord);
    }
    setEditingEnrollId(null);
    toast.success("Enrollment record updated.");
  }

  function startEditExam(err: ExamRegError) {
    if (permissions.examRegEdits <= 0) {
      toast.error("No exam reg edit credits remaining. Ask Dean for more.");
      return;
    }
    setEditingExamId(err.id);
    setEditExamForm({
      studentId: err.studentId,
      courseId: err.courseId,
      paymentStatus: err.paymentStatus,
    });
  }

  function saveEditExam(id: string) {
    const origErr = filteredExamErrors.find((e) => e.id === id);
    updateExamRegError(id, { ...editExamForm, edited: true });
    updateHodPermission(branch, {
      examRegEdits: Math.max(0, permissions.examRegEdits - 1),
    });
    if (origErr) {
      const editRecord: HodEditedRecord = {
        id,
        studentId: origErr.studentId,
        email: origErr.email ?? "",
        courseId: origErr.courseId,
        errorType: origErr.errorType,
        branch,
        fileType: "Exam Reg",
        editedAt: new Date().toISOString(),
        newStudentId: editExamForm.studentId,
        newCourseId: editExamForm.courseId,
        newPaymentStatus: editExamForm.paymentStatus,
      };
      addHodEditedRecord(editRecord);
    }
    setEditingExamId(null);
    toast.success("Exam registration record updated.");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="nptel-gradient text-white">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              navigate({ to: `/college/${encodeURIComponent(collegeName)}` })
            }
            className="text-white hover:bg-white/20 gap-2"
            data-ocid="hod.back.button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="h-5 w-px bg-white/30" />
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span className="font-display font-bold">HOD Dashboard</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Badge className="bg-white/20 text-white border-white/30">
              {branch}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="text-white hover:bg-white/20 gap-2"
              data-ocid="hod.refresh.button"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white hover:bg-white/20 gap-2"
              data-ocid="hod.logout.button"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Info strip */}
          <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-5 flex flex-wrap items-center gap-4 mb-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                Institution
              </p>
              <p className="font-display font-bold text-lg">{collegeName}</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                Department
              </p>
              <p className="font-display font-bold text-lg">{branch}</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                Enrollment Upload
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {permissions.canUploadEnrollment ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">
                      Allowed
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Locked</span>
                  </>
                )}
              </div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                Exam Reg Upload
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {permissions.canUploadExamReg ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">
                      Allowed
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Locked</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Enrollment File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" />
                  Enrollment Data Upload
                </CardTitle>
                <CardDescription>
                  {permissions.canUploadEnrollment
                    ? `Upload credits: ${permissions.enrollmentEdits} remaining`
                    : "Upload access not granted by Dean"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!permissions.canUploadEnrollment ? (
                  <div
                    data-ocid="hod.enrollment_upload.locked"
                    className="flex flex-col items-center gap-3 p-8 rounded-lg border-2 border-dashed border-muted bg-muted/30 text-center"
                  >
                    <Lock className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Upload access not granted by Dean.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Contact the Dean to enable this feature.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Uploaded file list */}
                    {(permissions.enrollmentFileList ?? []).length > 0 && (
                      <div className="space-y-2">
                        {(permissions.enrollmentFileList ?? []).map((fname) => (
                          <div
                            key={fname}
                            className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 border border-green-200"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                            <p className="text-xs font-medium text-green-700 flex-1 truncate">
                              {fname}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEnrollDeleteFile(fname)}
                              className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                              data-ocid="hod.enrollment.delete_button"
                              title="Remove file"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload area — shown when credits remain */}
                    {permissions.enrollmentEdits > 0 ? (
                      <div>
                        <label
                          htmlFor="enroll-file"
                          data-ocid="hod.enrollment.dropzone"
                          className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                        >
                          <PlusCircle className="h-6 w-6 text-primary shrink-0" />
                          <div>
                            <p className="text-sm font-medium">
                              {(permissions.enrollmentFileList ?? []).length > 0
                                ? "Upload another enrollment file"
                                : "Click to upload enrollment CSV/Excel"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {permissions.enrollmentEdits} upload
                              {permissions.enrollmentEdits !== 1 ? "s" : ""}{" "}
                              remaining
                            </p>
                          </div>
                        </label>
                        <input
                          ref={enrollFileRef}
                          id="enroll-file"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="hidden"
                          onChange={handleEnrollUpload}
                          data-ocid="hod.enrollment.upload_button"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                        <p className="text-xs text-amber-700">
                          No upload credits remaining. Ask Dean for more.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Exam Registration File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" />
                  Exam Registration Upload
                </CardTitle>
                <CardDescription>
                  {permissions.canUploadExamReg
                    ? `Upload credits: ${permissions.examRegEdits} remaining`
                    : "Upload access not granted by Dean"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!permissions.canUploadExamReg ? (
                  <div
                    data-ocid="hod.exam_reg_upload.locked"
                    className="flex flex-col items-center gap-3 p-8 rounded-lg border-2 border-dashed border-muted bg-muted/30 text-center"
                  >
                    <Lock className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Upload access not granted by Dean.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Contact the Dean to enable this feature.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Uploaded exam file list */}
                    {(permissions.examRegFileList ?? []).length > 0 && (
                      <div className="space-y-2">
                        {(permissions.examRegFileList ?? []).map((fname) => (
                          <div
                            key={fname}
                            className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 border border-green-200"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                            <p className="text-xs font-medium text-green-700 flex-1 truncate">
                              {fname}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleExamDeleteFile(fname)}
                              className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                              data-ocid="hod.exam_reg.delete_button"
                              title="Remove file"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload area — shown when credits remain */}
                    {permissions.examRegEdits > 0 ? (
                      <div>
                        <label
                          htmlFor="exam-file"
                          data-ocid="hod.exam_reg.dropzone"
                          className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                        >
                          <PlusCircle className="h-6 w-6 text-primary shrink-0" />
                          <div>
                            <p className="text-sm font-medium">
                              {(permissions.examRegFileList ?? []).length > 0
                                ? "Upload another exam reg file"
                                : "Click to upload exam reg CSV/Excel"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {permissions.examRegEdits} upload
                              {permissions.examRegEdits !== 1 ? "s" : ""}{" "}
                              remaining
                            </p>
                          </div>
                        </label>
                        <input
                          ref={examFileRef}
                          id="exam-file"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="hidden"
                          onChange={handleExamUpload}
                          data-ocid="hod.exam_reg.upload_button"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                        <p className="text-xs text-amber-700">
                          No upload credits remaining. Ask Dean for more.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Enrollment Errors Table ── */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Enrollment Errors — {branch} Branch
                  {showEnrollmentErrors && (
                    <Badge variant="destructive" className="ml-2">
                      {filteredEnrollErrors.length}
                      {enrollErrorTypeFilter !== "All" &&
                        ` / ${branchEnrollErrors.length}`}
                    </Badge>
                  )}
                </CardTitle>
                {showEnrollmentErrors && branchEnrollErrors.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select
                      value={enrollErrorTypeFilter}
                      onValueChange={(v) => {
                        setEnrollErrorTypeFilter(v);
                        setEnrollErrorPage(1);
                      }}
                    >
                      <SelectTrigger
                        className="w-52 h-8 text-xs"
                        data-ocid="hod.enrollment_errors.type.select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Error Types</SelectItem>
                        {uniqueEnrollErrorTypes.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!showEnrollmentErrors ? (
                <div
                  data-ocid="hod.enrollment_errors.empty_state"
                  className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground"
                >
                  <FileText className="h-10 w-10 text-muted-foreground/50" />
                  <p className="font-medium">No Student Data Uploaded</p>
                  <p className="text-sm max-w-sm">
                    No enrollment data has been uploaded yet. Upload an
                    enrollment file above to see errors, or wait for the Dean to
                    upload data.
                  </p>
                </div>
              ) : branchEnrollErrors.length === 0 ? (
                <div
                  data-ocid="hod.enrollment_errors.empty_state"
                  className="text-center py-10 text-muted-foreground"
                >
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-400" />
                  <p>No enrollment errors found for {branch} branch.</p>
                </div>
              ) : filteredEnrollErrors.length === 0 ? (
                <div
                  data-ocid="hod.enrollment_errors.empty_state"
                  className="text-center py-10 text-muted-foreground"
                >
                  <p>No errors match the selected type filter.</p>
                </div>
              ) : (
                <div
                  className="rounded-lg border overflow-x-auto"
                  data-ocid="hod.enrollment_errors.table"
                >
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Student ID</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Course ID</TableHead>
                        <TableHead>Error Type</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedEnrollErrors.map((err, i) => (
                        <TableRow
                          key={err.id}
                          data-ocid={`hod.enrollment_errors.row.${i + 1}`}
                        >
                          {editingEnrollId === err.id ? (
                            <>
                              <TableCell>
                                <Input
                                  value={editEnrollForm.studentId ?? ""}
                                  onChange={(e) =>
                                    setEditEnrollForm((p) => ({
                                      ...p,
                                      studentId: e.target.value,
                                    }))
                                  }
                                  className="h-8 text-sm w-28"
                                  data-ocid="hod.enrollment_edit.studentid.input"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editEnrollForm.email ?? ""}
                                  onChange={(e) =>
                                    setEditEnrollForm((p) => ({
                                      ...p,
                                      email: e.target.value,
                                    }))
                                  }
                                  className="h-8 text-sm w-40"
                                  data-ocid="hod.enrollment_edit.email.input"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editEnrollForm.courseId ?? ""}
                                  onChange={(e) =>
                                    setEditEnrollForm((p) => ({
                                      ...p,
                                      courseId: e.target.value,
                                    }))
                                  }
                                  className="h-8 text-sm w-32"
                                  data-ocid="hod.enrollment_edit.courseid.input"
                                />
                              </TableCell>
                              <TableCell
                                colSpan={2}
                                className="text-sm text-muted-foreground"
                              >
                                {err.errorType}
                              </TableCell>
                              <TableCell />
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => saveEditEnroll(err.id)}
                                    className="h-7 px-2 gap-1"
                                    data-ocid={`hod.enrollment_edit.save_button.${i + 1}`}
                                  >
                                    <Save className="h-3 w-3" /> Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingEnrollId(null)}
                                    className="h-7 px-2"
                                    data-ocid={`hod.enrollment_edit.cancel_button.${i + 1}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell className="font-mono text-sm">
                                {err.studentId}
                              </TableCell>
                              <TableCell className="text-sm">
                                {err.email}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {err.courseId}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  {err.errorType}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                                {err.details}
                              </TableCell>
                              <TableCell>
                                {err.edited ? (
                                  <Badge className="bg-green-100 text-green-700 text-xs">
                                    Edited
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    Pending
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEditEnroll(err)}
                                  disabled={permissions.enrollmentEdits <= 0}
                                  className="h-7 px-2 gap-1"
                                  data-ocid={`hod.enrollment_errors.edit_button.${i + 1}`}
                                >
                                  <PenLine className="h-3 w-3" /> Edit
                                </Button>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {/* Enrollment pagination */}
              {showEnrollmentErrors &&
                filteredEnrollErrors.length > HOD_ERROR_PAGE_SIZE && (
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-muted-foreground">
                      Showing {(enrollErrorPage - 1) * HOD_ERROR_PAGE_SIZE + 1}–
                      {Math.min(
                        enrollErrorPage * HOD_ERROR_PAGE_SIZE,
                        filteredEnrollErrors.length,
                      )}{" "}
                      of {filteredEnrollErrors.length} errors
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setEnrollErrorPage((p) => Math.max(1, p - 1))
                        }
                        disabled={enrollErrorPage === 1}
                        data-ocid="hod.enrollment_errors.pagination_prev"
                      >
                        Previous
                      </Button>
                      <span className="text-xs flex items-center px-2 text-muted-foreground">
                        Page {enrollErrorPage} / {totalEnrollPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setEnrollErrorPage((p) =>
                            Math.min(totalEnrollPages, p + 1),
                          )
                        }
                        disabled={enrollErrorPage === totalEnrollPages}
                        data-ocid="hod.enrollment_errors.pagination_next"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              {showEnrollmentErrors && (
                <p className="text-xs text-muted-foreground mt-2">
                  Edit credits remaining:{" "}
                  <strong>{permissions.enrollmentEdits}</strong>
                </p>
              )}
            </CardContent>
          </Card>

          {/* hidden key to force refresh */}
          <div className="hidden">{refreshKey}</div>

          {/* ── Exam Reg Errors Table ── */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-destructive" />
                  Exam Registration Errors — {branch} Branch
                  {showExamRegErrors && (
                    <Badge variant="destructive" className="ml-2">
                      {filteredExamErrors.length}
                      {examErrorTypeFilter !== "All" &&
                        ` / ${branchExamErrors.length}`}
                    </Badge>
                  )}
                </CardTitle>
                {showExamRegErrors && branchExamErrors.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select
                      value={examErrorTypeFilter}
                      onValueChange={(v) => {
                        setExamErrorTypeFilter(v);
                        setExamErrorPage(1);
                      }}
                    >
                      <SelectTrigger
                        className="w-52 h-8 text-xs"
                        data-ocid="hod.exam_reg_errors.type.select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Error Types</SelectItem>
                        {uniqueExamErrorTypes.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!showExamRegErrors ? (
                <div
                  data-ocid="hod.exam_reg_errors.empty_state"
                  className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground"
                >
                  <FileText className="h-10 w-10 text-muted-foreground/50" />
                  <p className="font-medium">
                    No Exam Registration Data Uploaded
                  </p>
                  <p className="text-sm max-w-sm">
                    No exam registration data has been uploaded yet. Upload an
                    exam reg file above (if Dean has given access), or wait for
                    the Dean to upload data.
                  </p>
                </div>
              ) : branchExamErrors.length === 0 ? (
                <div
                  data-ocid="hod.exam_reg_errors.empty_state"
                  className="text-center py-10 text-muted-foreground"
                >
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-400" />
                  <p>No exam registration errors for {branch} branch.</p>
                </div>
              ) : filteredExamErrors.length === 0 ? (
                <div
                  data-ocid="hod.exam_reg_errors.empty_state"
                  className="text-center py-10 text-muted-foreground"
                >
                  <p>No errors match the selected type filter.</p>
                </div>
              ) : (
                <div
                  className="rounded-lg border overflow-x-auto"
                  data-ocid="hod.exam_reg_errors.table"
                >
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Student ID</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Course ID</TableHead>
                        <TableHead>Payment Status</TableHead>
                        <TableHead>Classification</TableHead>
                        <TableHead>Error Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedExamErrors.map((err, i) => (
                        <TableRow
                          key={err.id}
                          data-ocid={`hod.exam_reg_errors.row.${i + 1}`}
                        >
                          {editingExamId === err.id ? (
                            <>
                              <TableCell>
                                <Input
                                  value={editExamForm.studentId ?? ""}
                                  onChange={(e) =>
                                    setEditExamForm((p) => ({
                                      ...p,
                                      studentId: e.target.value,
                                    }))
                                  }
                                  className="h-8 text-sm w-28"
                                  data-ocid="hod.exam_edit.studentid.input"
                                />
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {err.email || "-"}
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editExamForm.courseId ?? ""}
                                  onChange={(e) =>
                                    setEditExamForm((p) => ({
                                      ...p,
                                      courseId: e.target.value,
                                    }))
                                  }
                                  className="h-8 text-sm w-32"
                                  data-ocid="hod.exam_edit.courseid.input"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editExamForm.paymentStatus ?? ""}
                                  onChange={(e) =>
                                    setEditExamForm((p) => ({
                                      ...p,
                                      paymentStatus: e.target.value,
                                    }))
                                  }
                                  className="h-8 text-sm w-32"
                                  data-ocid="hod.exam_edit.payment.input"
                                />
                              </TableCell>
                              <TableCell
                                colSpan={2}
                                className="text-sm text-muted-foreground"
                              >
                                {err.classification}
                              </TableCell>
                              <TableCell />
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => saveEditExam(err.id)}
                                    className="h-7 px-2 gap-1"
                                    data-ocid={`hod.exam_edit.save_button.${i + 1}`}
                                  >
                                    <Save className="h-3 w-3" /> Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingExamId(null)}
                                    className="h-7 px-2"
                                    data-ocid={`hod.exam_edit.cancel_button.${i + 1}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell className="font-mono text-sm">
                                {err.studentId}
                              </TableCell>
                              <TableCell className="text-sm">
                                {err.email || "-"}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {err.courseId}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    err.paymentStatus === "payment pending" ||
                                    err.paymentStatus === "payment draft"
                                      ? "destructive"
                                      : "outline"
                                  }
                                  className="text-xs"
                                >
                                  {err.paymentStatus}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    err.classification === "Done"
                                      ? "border-green-400 text-green-700"
                                      : err.classification ===
                                          "Redo Registration"
                                        ? "border-yellow-400 text-yellow-700"
                                        : "border-red-400 text-red-700"
                                  }`}
                                >
                                  {err.classification}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  {err.errorType}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {err.edited ? (
                                  <Badge className="bg-green-100 text-green-700 text-xs">
                                    Edited
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    Pending
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEditExam(err)}
                                  disabled={permissions.examRegEdits <= 0}
                                  className="h-7 px-2 gap-1"
                                  data-ocid={`hod.exam_reg_errors.edit_button.${i + 1}`}
                                >
                                  <PenLine className="h-3 w-3" /> Edit
                                </Button>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {/* Exam Reg pagination */}
              {showExamRegErrors &&
                filteredExamErrors.length > HOD_ERROR_PAGE_SIZE && (
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-muted-foreground">
                      Showing {(examErrorPage - 1) * HOD_ERROR_PAGE_SIZE + 1}–
                      {Math.min(
                        examErrorPage * HOD_ERROR_PAGE_SIZE,
                        filteredExamErrors.length,
                      )}{" "}
                      of {filteredExamErrors.length} errors
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setExamErrorPage((p) => Math.max(1, p - 1))
                        }
                        disabled={examErrorPage === 1}
                        data-ocid="hod.exam_reg_errors.pagination_prev"
                      >
                        Previous
                      </Button>
                      <span className="text-xs flex items-center px-2 text-muted-foreground">
                        Page {examErrorPage} / {totalExamPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setExamErrorPage((p) =>
                            Math.min(totalExamPages, p + 1),
                          )
                        }
                        disabled={examErrorPage === totalExamPages}
                        data-ocid="hod.exam_reg_errors.pagination_next"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              {showExamRegErrors && (
                <p className="text-xs text-muted-foreground mt-2">
                  Edit credits remaining:{" "}
                  <strong>{permissions.examRegEdits}</strong>
                </p>
              )}
            </CardContent>
          </Card>
          {/* ── HOD Edited Records ── */}
          {(() => {
            const branchEdits = hodEditedRecords.filter(
              (r) => r.branch === branch,
            );
            return (
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-base flex items-center gap-2">
                    <PenLine className="h-4 w-4 text-indigo-600" />
                    Your Edited Records — {branch} Branch
                    <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 ml-1">
                      {branchEdits.length}
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Records you have edited. These are also visible to the Dean.
                  </p>
                </CardHeader>
                <CardContent>
                  {branchEdits.length === 0 ? (
                    <div
                      data-ocid="hod.edited_records.empty_state"
                      className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground"
                    >
                      <PenLine className="h-10 w-10 text-muted-foreground/50" />
                      <p className="font-medium">No Edits Yet</p>
                      <p className="text-sm max-w-sm">
                        When you edit a student record above, it will appear
                        here.
                      </p>
                    </div>
                  ) : (
                    <div
                      className="rounded-lg border overflow-x-auto"
                      data-ocid="hod.edited_records.table"
                    >
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-indigo-50/60">
                            <TableHead className="text-indigo-700">#</TableHead>
                            <TableHead className="text-indigo-700">
                              File Type
                            </TableHead>
                            <TableHead className="text-indigo-700">
                              Student ID
                            </TableHead>
                            <TableHead className="text-indigo-700">
                              Email
                            </TableHead>
                            <TableHead className="text-indigo-700">
                              Course ID
                            </TableHead>
                            <TableHead className="text-indigo-700">
                              Error Type
                            </TableHead>
                            <TableHead className="text-indigo-700">
                              Edited At
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {branchEdits.map((rec, i) => (
                            <TableRow
                              key={`${rec.id}-${i}`}
                              data-ocid={`hod.edited_records.row.${i + 1}`}
                            >
                              <TableCell className="text-muted-foreground text-xs">
                                {i + 1}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${rec.fileType === "Enrollment" ? "border-blue-400 text-blue-700" : "border-purple-400 text-purple-700"}`}
                                >
                                  {rec.fileType}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {rec.newStudentId ?? rec.studentId}
                                {rec.newStudentId &&
                                  rec.newStudentId !== rec.studentId && (
                                    <span className="text-xs text-muted-foreground ml-1">
                                      (was: {rec.studentId})
                                    </span>
                                  )}
                              </TableCell>
                              <TableCell className="text-sm">
                                {rec.newEmail ?? rec.email}
                                {rec.newEmail && rec.newEmail !== rec.email && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    (was: {rec.email})
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {rec.newCourseId ?? rec.courseId}
                                {rec.newCourseId &&
                                  rec.newCourseId !== rec.courseId && (
                                    <span className="text-xs text-muted-foreground ml-1">
                                      (was: {rec.courseId})
                                    </span>
                                  )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  {rec.errorType}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(rec.editedAt).toLocaleString("en-IN")}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}
        </motion.div>
      </main>
    </div>
  );
}
