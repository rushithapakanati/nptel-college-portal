import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardEdit,
  Download,
  Eye,
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
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAppContext } from "../context/AppContext";
import type { Branch, EnrollmentError, ExamRegError } from "../data/mockData";
import {
  parseExamRegRecords,
  parseUploadedFile,
  validateEnrollmentRows,
  validateExamRegRows,
} from "../utils/fileParser";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface LocalSnapshot {
  fileName: string;
  timestamp: number;
  recordCount: number;
  errors: EnrollmentError[] | ExamRegError[];
}

// ─── CSV download helper ───────────────────────────────────────────────────────
function downloadErrorsAsExcel(
  errors: Array<{
    studentId: string;
    email: string;
    courseId: string;
    courseName?: string;
    errorType: string;
    description?: string;
  }>,
  filename: string,
) {
  const headers = [
    "Roll No",
    "Email",
    "Course ID",
    "Course Name",
    "Error Type",
    "Description",
  ];
  const rows = errors.map((e) => [
    e.studentId,
    e.email,
    e.courseId,
    e.courseName ?? "",
    e.errorType,
    e.description ?? "",
  ]);
  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.replace(".xlsx", ".csv");
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Pagination ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 50;

function PaginationBar({
  page,
  total,
  totalItems,
  onChange,
  ocidPrefix,
}: {
  page: number;
  total: number;
  totalItems: number;
  onChange: (p: number) => void;
  ocidPrefix: string;
}) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-3">
      <p className="text-xs text-muted-foreground">
        Showing {(page - 1) * PAGE_SIZE + 1}–
        {Math.min(page * PAGE_SIZE, totalItems)} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          data-ocid={`${ocidPrefix}.pagination_prev`}
        >
          Previous
        </Button>
        <span className="text-xs px-2 text-muted-foreground">
          Page {page} / {total}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onChange(Math.min(total, page + 1))}
          disabled={page === total}
          data-ocid={`${ocidPrefix}.pagination_next`}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// ─── Error Table (shared for enroll + exam) ────────────────────────────────────
function ErrorTable<T extends EnrollmentError | ExamRegError>({
  errors,
  page,
  totalPages,
  onPageChange,
  editMode,
  accentColor,
  onView,
  onEdit,
  ocidPrefix,
  bgClass,
  textClass,
}: {
  errors: T[];
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  editMode: boolean;
  accentColor: "blue" | "purple";
  onView: (err: T) => void;
  onEdit: (err: T) => void;
  ocidPrefix: string;
  bgClass: string;
  textClass: string;
}) {
  const paged = errors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hdrClass = accentColor === "blue" ? "text-blue-800" : "text-purple-800";

  return (
    <>
      <div
        className={`rounded-lg border overflow-x-auto ${bgClass}`}
        data-ocid={`${ocidPrefix}.table`}
      >
        <Table>
          <TableHeader>
            <TableRow
              className={
                accentColor === "blue" ? "bg-blue-50/60" : "bg-purple-50/60"
              }
            >
              <TableHead className={hdrClass}>Roll No</TableHead>
              <TableHead className={hdrClass}>Course Name</TableHead>
              <TableHead className={hdrClass}>Course ID</TableHead>
              <TableHead className={hdrClass}>Error Type</TableHead>
              <TableHead className={`${hdrClass} w-16`}>Details</TableHead>
              <TableHead className={`${hdrClass} w-20`}>Edit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((err, i) => (
              <TableRow
                key={err.id}
                data-ocid={`${ocidPrefix}.row.${i + 1}`}
                className={
                  accentColor === "blue"
                    ? "hover:bg-blue-50/30"
                    : "hover:bg-purple-50/30"
                }
              >
                <TableCell className="font-mono text-sm">
                  {err.studentId}
                </TableCell>
                <TableCell
                  className={`text-sm font-bold ${textClass} max-w-[200px] truncate`}
                >
                  {err.courseName || "—"}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {err.courseId}
                </TableCell>
                <TableCell>
                  <Badge variant="destructive" className="text-xs">
                    {err.errorType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onView(err)}
                    className={`h-7 w-7 p-0 ${accentColor === "blue" ? "text-blue-600 hover:text-blue-800 hover:bg-blue-50" : "text-purple-600 hover:text-purple-800 hover:bg-purple-50"}`}
                    data-ocid={`${ocidPrefix}.view_button.${i + 1}`}
                    aria-label="View error details"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(err)}
                    disabled={!editMode}
                    className="h-7 px-2 gap-1 text-xs"
                    data-ocid={`${ocidPrefix}.edit_button.${i + 1}`}
                  >
                    <PenLine className="h-3 w-3" /> Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PaginationBar
        page={page}
        total={totalPages}
        totalItems={errors.length}
        onChange={onPageChange}
        ocidPrefix={ocidPrefix}
      />
    </>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
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

  // ── Refresh trigger ──
  const [refreshKey, setRefreshKey] = useState(0);
  void refreshKey;

  // ── Permissions ──
  const permissions = hodPermissions[branch] ?? {
    branch,
    canUpload: false,
    uploadCredits: 0,
  };
  const canUpload = permissions.canUpload;
  const uploadCredits = permissions.uploadCredits;

  // ── Derived branch data ──
  const branchEnrollErrors = useMemo(
    () => enrollmentErrors.filter((e) => e.branch === branch),
    [enrollmentErrors, branch],
  );
  const branchExamErrors = useMemo(
    () => examRegErrors.filter((e) => e.branch === branch),
    [examRegErrors, branch],
  );
  const branchEdits = useMemo(
    () => hodEditedRecords.filter((r) => r.branch === branch),
    [hodEditedRecords, branch],
  );

  const hodHasUploaded = hodUploadedRecords.some((r) => r.branch === branch);
  const showEnrollmentErrors = deanStudentDataUploaded || hodHasUploaded;
  const showExamRegErrors = deanExamRegDataUploaded || hodHasUploaded;

  // ── File upload refs & local snapshot lists ──
  const enrollFileRef = useRef<HTMLInputElement>(null);
  const examFileRef = useRef<HTMLInputElement>(null);
  const [enrollFileList, setEnrollFileList] = useState<string[]>([]);
  const [examFileList, setExamFileList] = useState<string[]>([]);
  const [enrollSnapshots, setEnrollSnapshots] = useState<LocalSnapshot[]>([]);
  const [examSnapshots, setExamSnapshots] = useState<LocalSnapshot[]>([]);
  const [viewEnrollSnapIdx, setViewEnrollSnapIdx] = useState<number | null>(
    null,
  );
  const [viewExamSnapIdx, setViewExamSnapIdx] = useState<number | null>(null);

  // ── Error filters & pagination ──
  const [enrollFilter, setEnrollFilter] = useState("All");
  const [examFilter, setExamFilter] = useState("All");
  const [enrollPage, setEnrollPage] = useState(1);
  const [examPage, setExamPage] = useState(1);

  const uniqueEnrollTypes = useMemo(
    () => Array.from(new Set(branchEnrollErrors.map((e) => e.errorType))),
    [branchEnrollErrors],
  );
  const uniqueExamTypes = useMemo(
    () => Array.from(new Set(branchExamErrors.map((e) => e.errorType))),
    [branchExamErrors],
  );

  const filteredEnroll = useMemo(
    () =>
      enrollFilter === "All"
        ? branchEnrollErrors
        : branchEnrollErrors.filter((e) => e.errorType === enrollFilter),
    [branchEnrollErrors, enrollFilter],
  );
  const filteredExam = useMemo(
    () =>
      examFilter === "All"
        ? branchExamErrors
        : branchExamErrors.filter((e) => e.errorType === examFilter),
    [branchExamErrors, examFilter],
  );

  const totalEnrollPages = Math.ceil(filteredEnroll.length / PAGE_SIZE);
  const totalExamPages = Math.ceil(filteredExam.length / PAGE_SIZE);

  // ── Edit mode state ──
  const [enrollEditMode, setEnrollEditMode] = useState(false);
  const [examEditMode, setExamEditMode] = useState(false);

  // ── Dialog state ──
  const [viewEnrollErr, setViewEnrollErr] = useState<EnrollmentError | null>(
    null,
  );
  const [viewExamErr, setViewExamErr] = useState<ExamRegError | null>(null);
  const [editEnrollErr, setEditEnrollErr] = useState<EnrollmentError | null>(
    null,
  );
  const [editExamErr, setEditExamErr] = useState<ExamRegError | null>(null);
  const [editEnrollForm, setEditEnrollForm] = useState<
    Partial<EnrollmentError>
  >({});
  const [editExamForm, setEditExamForm] = useState<Partial<ExamRegError>>({});

  // ── Courses search + pagination ──
  const [courseSearch, setCourseSearch] = useState("");
  const [coursePage, setCoursePage] = useState(1);
  const filteredCourses = useMemo(
    () =>
      courseSearch
        ? uploadedCourses.filter(
            (c) =>
              c.courseName.toLowerCase().includes(courseSearch.toLowerCase()) ||
              c.courseId.toLowerCase().includes(courseSearch.toLowerCase()),
          )
        : uploadedCourses,
    [uploadedCourses, courseSearch],
  );
  const pagedCourses = filteredCourses.slice(
    (coursePage - 1) * PAGE_SIZE,
    coursePage * PAGE_SIZE,
  );
  const totalCoursePages = Math.ceil(filteredCourses.length / PAGE_SIZE);

  // ── Handlers ──
  const handleEnrollFilterChange = useCallback((v: string) => {
    setEnrollFilter(v);
    setEnrollPage(1);
  }, []);
  const handleExamFilterChange = useCallback((v: string) => {
    setExamFilter(v);
    setExamPage(1);
  }, []);

  function handleLogout() {
    logout();
    navigate({ to: "/" });
  }

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
    toast.success("Dashboard refreshed.");
  }

  // ── Upload: enrollment ──
  async function handleEnrollUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!canUpload) {
      toast.error("Upload access not granted by Dean.");
      return;
    }
    if (uploadCredits <= 0) {
      toast.error("No upload credits remaining. Ask Dean for more.");
      return;
    }
    updateHodPermission(branch, {
      uploadCredits: Math.max(0, uploadCredits - 1),
    });
    setEnrollFileList((prev) => [...prev, file.name]);
    try {
      toast.info(`Parsing enrollment file "${file.name}"…`);
      const rows = await parseUploadedFile(file);
      const courseIds = uploadedCourses.map((c) => c.courseId);
      const { records, errors } = validateEnrollmentRows(
        rows,
        collegeName,
        courseIds,
        uploadedCourses,
      );
      appendEnrollmentErrors(errors);
      appendHodUploadedRecords(records);
      setEnrollSnapshots((prev) => [
        ...prev,
        {
          fileName: file.name,
          timestamp: Date.now(),
          recordCount: records.length,
          errors,
        },
      ]);
      setViewEnrollSnapIdx(null);
      toast.success(
        `Parsed "${file.name}": ${records.length} records, ${errors.length} errors.`,
      );
    } catch (err) {
      toast.error(
        `Parse failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  function handleEnrollDeleteFile(fileName: string) {
    setEnrollFileList((prev) => prev.filter((n) => n !== fileName));
    toast.info(`File "${fileName}" removed.`);
  }

  // ── Upload: exam reg ──
  async function handleExamUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!canUpload) {
      toast.error("Upload access not granted by Dean.");
      return;
    }
    if (uploadCredits <= 0) {
      toast.error("No upload credits remaining. Ask Dean for more.");
      return;
    }
    updateHodPermission(branch, {
      uploadCredits: Math.max(0, uploadCredits - 1),
    });
    setExamFileList((prev) => [...prev, file.name]);
    try {
      toast.info(`Parsing exam reg file "${file.name}"…`);
      const rows = await parseUploadedFile(file);
      const courseIds = uploadedCourses.map((c) => c.courseId);
      const examErrors = validateExamRegRows(rows, [], courseIds, collegeName);
      const examRecords = parseExamRegRecords(rows);
      appendExamRegErrors(examErrors);
      appendHodUploadedRecords(examRecords);
      setExamSnapshots((prev) => [
        ...prev,
        {
          fileName: file.name,
          timestamp: Date.now(),
          recordCount: examRecords.length,
          errors: examErrors,
        },
      ]);
      setViewExamSnapIdx(null);
      toast.success(
        `Parsed "${file.name}": ${examRecords.length} records, ${examErrors.length} errors.`,
      );
    } catch (err) {
      toast.error(
        `Parse failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  function handleExamDeleteFile(fileName: string) {
    setExamFileList((prev) => prev.filter((n) => n !== fileName));
    toast.info(`File "${fileName}" removed.`);
  }

  // ── Edit save: enrollment ──
  function saveEditEnroll() {
    if (!editEnrollErr) return;
    const { id, studentId, email, courseId, courseName } = editEnrollErr;
    updateEnrollmentError(id, editEnrollForm);
    addHodEditedRecord({
      id,
      studentId: editEnrollForm.studentId ?? studentId,
      email: editEnrollForm.email ?? email,
      courseId: editEnrollForm.courseId ?? courseId,
      courseName: editEnrollForm.courseName ?? courseName,
      branch,
      editedBy: "HOD",
      editedAt: new Date().toISOString(),
      oldValues: { studentId, email, courseId, courseName },
      newValues: {
        studentId: editEnrollForm.studentId ?? studentId,
        email: editEnrollForm.email ?? email,
        courseId: editEnrollForm.courseId ?? courseId,
      },
    });
    toast.success("Enrollment record updated.");
    setEditEnrollErr(null);
  }

  // ── Edit save: exam reg ──
  function saveEditExam() {
    if (!editExamErr) return;
    const { id, studentId, email, courseId, courseName } = editExamErr;
    updateExamRegError(id, editExamForm);
    addHodEditedRecord({
      id,
      studentId: editExamForm.studentId ?? studentId,
      email: editExamForm.email ?? email ?? "",
      courseId: editExamForm.courseId ?? courseId,
      courseName: editExamForm.courseName ?? courseName,
      branch,
      editedBy: "HOD",
      editedAt: new Date().toISOString(),
      oldValues: { studentId, email: email ?? "", courseId, courseName },
      newValues: {
        studentId: editExamForm.studentId ?? studentId,
        courseId: editExamForm.courseId ?? courseId,
        paymentStatus: editExamForm.paymentStatus ?? "",
      },
    });
    toast.success("Exam registration record updated.");
    setEditExamErr(null);
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              navigate({ to: `/college/${encodeURIComponent(collegeName)}` })
            }
            className="gap-2 text-muted-foreground hover:text-foreground"
            data-ocid="hod.back.button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="h-5 w-px bg-border" />
          <Users className="h-5 w-5 text-primary" />
          <span className="font-display font-bold text-foreground">
            HOD Dashboard
          </span>
          <Badge variant="secondary" className="ml-0.5">
            {branch}
          </Badge>
          <span className="text-muted-foreground text-sm hidden sm:block">
            — {collegeName}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="gap-2"
              data-ocid="hod.refresh.button"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-destructive hover:text-destructive"
              data-ocid="hod.logout.button"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Status strip */}
          <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 flex flex-wrap items-center gap-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                Institution
              </p>
              <p className="font-display font-bold">{collegeName}</p>
            </div>
            <div className="w-px h-8 bg-border hidden sm:block" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                Department
              </p>
              <p className="font-display font-bold">{branch}</p>
            </div>
            <div className="w-px h-8 bg-border hidden sm:block" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                Upload Access
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                {canUpload ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">
                      {uploadCredits} credit{uploadCredits !== 1 ? "s" : ""}{" "}
                      remaining
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Locked — request from Dean
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6 h-auto p-1">
              <TabsTrigger
                value="upload"
                className="flex items-center gap-1.5 py-2 text-xs sm:text-sm"
                data-ocid="hod.tab.upload"
              >
                <Upload className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Upload</span>
              </TabsTrigger>
              <TabsTrigger
                value="enrollment"
                className="flex items-center gap-1.5 py-2 text-xs sm:text-sm"
                data-ocid="hod.tab.enrollment"
              >
                <AlertCircle className="h-3.5 w-3.5 text-blue-500" />
                <span className="hidden sm:inline">Enrollment Errors</span>
                <span className="sm:hidden">Enroll</span>
                {branchEnrollErrors.length > 0 && (
                  <Badge className="ml-0.5 bg-blue-100 text-blue-800 border-blue-200 text-xs px-1.5 py-0 h-4">
                    {branchEnrollErrors.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="examreg"
                className="flex items-center gap-1.5 py-2 text-xs sm:text-sm"
                data-ocid="hod.tab.examreg"
              >
                <FileText className="h-3.5 w-3.5 text-purple-500" />
                <span className="hidden sm:inline">Exam Reg Errors</span>
                <span className="sm:hidden">Exam</span>
                {branchExamErrors.length > 0 && (
                  <Badge className="ml-0.5 bg-purple-100 text-purple-800 border-purple-200 text-xs px-1.5 py-0 h-4">
                    {branchExamErrors.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="courses"
                className="flex items-center gap-1.5 py-2 text-xs sm:text-sm"
                data-ocid="hod.tab.courses"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">12-Week Courses</span>
                <span className="sm:hidden">Courses</span>
              </TabsTrigger>
            </TabsList>

            {/* ══════════ UPLOAD TAB ══════════ */}
            <TabsContent value="upload">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Enrollment Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-base flex items-center gap-2">
                      <Upload className="h-4 w-4 text-blue-600" />
                      Enrollment Data Upload
                    </CardTitle>
                    <CardDescription>
                      {canUpload
                        ? `${uploadCredits} upload credit${uploadCredits !== 1 ? "s" : ""} remaining`
                        : "Upload access not granted by Dean"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!canUpload ? (
                      <div
                        data-ocid="hod.enrollment_upload.locked"
                        className="flex flex-col items-center gap-3 p-8 rounded-lg border-2 border-dashed border-muted bg-muted/30 text-center"
                      >
                        <Lock className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">
                          Upload access not granted by Dean.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Contact the Dean to enable this feature.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {enrollFileList.map((fname) => (
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
                        {uploadCredits > 0 ? (
                          <div>
                            <label
                              htmlFor="enroll-file"
                              data-ocid="hod.enrollment.dropzone"
                              className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition-colors"
                            >
                              <PlusCircle className="h-6 w-6 text-blue-600 shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-blue-900">
                                  {enrollFileList.length > 0
                                    ? "Upload another enrollment file"
                                    : "Click to upload enrollment CSV/Excel"}
                                </p>
                                <p className="text-xs text-blue-600/80 mt-0.5">
                                  {uploadCredits} upload
                                  {uploadCredits !== 1 ? "s" : ""} remaining
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
                            {enrollSnapshots.length > 0 && (
                              <div className="mt-3 p-3 rounded-lg border bg-muted/30">
                                <p className="text-xs font-semibold text-muted-foreground mb-2">
                                  Previous Enrollment Files
                                </p>
                                <div className="space-y-1">
                                  <button
                                    type="button"
                                    onClick={() => setViewEnrollSnapIdx(null)}
                                    className={`w-full flex items-center justify-between p-2 rounded text-xs ${viewEnrollSnapIdx === null ? "bg-primary/10 border border-primary/30 font-medium" : "hover:bg-muted/50"}`}
                                  >
                                    <span>Latest (current)</span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Active
                                    </Badge>
                                  </button>
                                  {enrollSnapshots.map((snap, idx) => (
                                    <div
                                      key={snap.timestamp}
                                      className={`flex items-center justify-between p-2 rounded text-xs ${viewEnrollSnapIdx === idx ? "bg-amber-50 border border-amber-300 font-medium" : "hover:bg-muted/50"}`}
                                    >
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setViewEnrollSnapIdx(idx)
                                        }
                                        className="flex items-center gap-1 flex-1 truncate text-left min-w-0"
                                      >
                                        <span className="truncate flex-1">
                                          {snap.fileName}
                                        </span>
                                        <span className="text-muted-foreground ml-2 shrink-0">
                                          {new Date(
                                            snap.timestamp,
                                          ).toLocaleDateString()}
                                        </span>
                                      </button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 px-2 text-xs ml-2 shrink-0 border-blue-300 text-blue-600 hover:bg-blue-50"
                                        data-ocid={`hod.enrollment.snapshot_restore.${idx}`}
                                        onClick={() => {
                                          appendEnrollmentErrors(
                                            snap.errors as EnrollmentError[],
                                          );
                                          setViewEnrollSnapIdx(null);
                                          toast.success(
                                            `Restored enrollment data from "${snap.fileName}"`,
                                          );
                                        }}
                                      >
                                        Restore
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
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

                {/* Exam Reg Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-base flex items-center gap-2">
                      <Upload className="h-4 w-4 text-purple-600" />
                      Exam Registration Upload
                    </CardTitle>
                    <CardDescription>
                      {canUpload
                        ? `${uploadCredits} upload credit${uploadCredits !== 1 ? "s" : ""} remaining`
                        : "Upload access not granted by Dean"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!canUpload ? (
                      <div
                        data-ocid="hod.exam_reg_upload.locked"
                        className="flex flex-col items-center gap-3 p-8 rounded-lg border-2 border-dashed border-muted bg-muted/30 text-center"
                      >
                        <Lock className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">
                          Upload access not granted by Dean.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Contact the Dean to enable this feature.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {examFileList.map((fname) => (
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
                        {uploadCredits > 0 ? (
                          <div>
                            <label
                              htmlFor="exam-file"
                              data-ocid="hod.exam_reg.dropzone"
                              className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-purple-300 bg-purple-50/50 cursor-pointer hover:bg-purple-50 transition-colors"
                            >
                              <PlusCircle className="h-6 w-6 text-purple-600 shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-purple-900">
                                  {examFileList.length > 0
                                    ? "Upload another exam reg file"
                                    : "Click to upload exam reg CSV/Excel"}
                                </p>
                                <p className="text-xs text-purple-600/80 mt-0.5">
                                  {uploadCredits} upload
                                  {uploadCredits !== 1 ? "s" : ""} remaining
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
                            {examSnapshots.length > 0 && (
                              <div className="mt-3 p-3 rounded-lg border bg-muted/30">
                                <p className="text-xs font-semibold text-muted-foreground mb-2">
                                  Previous Exam Reg Files
                                </p>
                                <div className="space-y-1">
                                  <button
                                    type="button"
                                    onClick={() => setViewExamSnapIdx(null)}
                                    className={`w-full flex items-center justify-between p-2 rounded text-xs ${viewExamSnapIdx === null ? "bg-primary/10 border border-primary/30 font-medium" : "hover:bg-muted/50"}`}
                                  >
                                    <span>Latest (current)</span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Active
                                    </Badge>
                                  </button>
                                  {examSnapshots.map((snap, idx) => (
                                    <div
                                      key={snap.timestamp}
                                      className={`flex items-center justify-between p-2 rounded text-xs ${viewExamSnapIdx === idx ? "bg-amber-50 border border-amber-300 font-medium" : "hover:bg-muted/50"}`}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => setViewExamSnapIdx(idx)}
                                        className="flex items-center gap-1 flex-1 truncate text-left min-w-0"
                                      >
                                        <span className="truncate flex-1">
                                          {snap.fileName}
                                        </span>
                                        <span className="text-muted-foreground ml-2 shrink-0">
                                          {new Date(
                                            snap.timestamp,
                                          ).toLocaleDateString()}
                                        </span>
                                      </button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 px-2 text-xs ml-2 shrink-0 border-purple-300 text-purple-600 hover:bg-purple-50"
                                        data-ocid={`hod.exam_reg.snapshot_restore.${idx}`}
                                        onClick={() => {
                                          appendExamRegErrors(
                                            snap.errors as ExamRegError[],
                                          );
                                          setViewExamSnapIdx(null);
                                          toast.success(
                                            `Restored exam reg data from "${snap.fileName}"`,
                                          );
                                        }}
                                      >
                                        Restore
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
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

              {/* Snapshot banners */}
              {viewEnrollSnapIdx !== null && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Viewing historical enrollment data from{" "}
                  <strong>
                    {enrollSnapshots[viewEnrollSnapIdx]?.fileName}
                  </strong>{" "}
                  (uploaded{" "}
                  {new Date(
                    enrollSnapshots[viewEnrollSnapIdx]?.timestamp,
                  ).toLocaleString()}
                  ).
                  <button
                    type="button"
                    onClick={() => setViewEnrollSnapIdx(null)}
                    className="ml-auto underline text-amber-700"
                  >
                    View Latest
                  </button>
                </div>
              )}
              {viewExamSnapIdx !== null && (
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Viewing historical exam reg data from{" "}
                  <strong>{examSnapshots[viewExamSnapIdx]?.fileName}</strong>{" "}
                  (uploaded{" "}
                  {new Date(
                    examSnapshots[viewExamSnapIdx]?.timestamp,
                  ).toLocaleString()}
                  ).
                  <button
                    type="button"
                    onClick={() => setViewExamSnapIdx(null)}
                    className="ml-auto underline text-amber-700"
                  >
                    View Latest
                  </button>
                </div>
              )}
            </TabsContent>

            {/* ══════════ ENROLLMENT ERRORS TAB ══════════ */}
            <TabsContent value="enrollment">
              <Card className="border-blue-200">
                <CardHeader className="bg-blue-50/60 rounded-t-xl">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="font-display text-base flex items-center gap-2 text-blue-900">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      Enrollment Errors — {branch}
                      {showEnrollmentErrors &&
                        branchEnrollErrors.length > 0 && (
                          <Badge className="bg-blue-600 text-white ml-1">
                            {filteredEnroll.length}
                            {enrollFilter !== "All" &&
                              ` / ${branchEnrollErrors.length}`}
                          </Badge>
                        )}
                    </CardTitle>
                    {showEnrollmentErrors && branchEnrollErrors.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select
                          value={enrollFilter}
                          onValueChange={handleEnrollFilterChange}
                        >
                          <SelectTrigger
                            className="w-44 h-8 text-xs"
                            data-ocid="hod.enrollment_errors.type.select"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">All Error Types</SelectItem>
                            {uniqueEnrollTypes.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                          data-ocid="hod.enrollment_errors.download_button"
                          onClick={() =>
                            downloadErrorsAsExcel(
                              filteredEnroll,
                              `enrollment-errors-${branch}-${new Date().toISOString().slice(0, 10)}.xlsx`,
                            )
                          }
                        >
                          <Download className="h-3 w-3" /> Download
                        </Button>
                        {enrollEditMode ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 gap-1 text-xs"
                            data-ocid="hod.enrollment_errors.end_editing_button"
                            onClick={() => {
                              updateHodPermission(branch, {
                                uploadCredits: Math.max(0, uploadCredits - 1),
                              });
                              setEnrollEditMode(false);
                              toast.success(
                                "Edit session ended. 1 credit used.",
                              );
                            }}
                          >
                            <Save className="h-3 w-3" /> End Editing / Save All
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 text-xs"
                            data-ocid="hod.enrollment_errors.enable_editing_button"
                            disabled={uploadCredits <= 0}
                            title={
                              uploadCredits <= 0
                                ? "No edit credits. Ask Dean for more."
                                : "Enable editing for all rows"
                            }
                            onClick={() => setEnrollEditMode(true)}
                          >
                            <PenLine className="h-3 w-3" /> Enable Editing
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {!showEnrollmentErrors ? (
                    <div
                      data-ocid="hod.enrollment_errors.empty_state"
                      className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground"
                    >
                      <FileText className="h-10 w-10 text-muted-foreground/40" />
                      <p className="font-medium">No Student Data Uploaded</p>
                      <p className="text-sm max-w-sm">
                        Upload an enrollment file or wait for the Dean to upload
                        data.
                      </p>
                    </div>
                  ) : branchEnrollErrors.length === 0 ? (
                    <div
                      data-ocid="hod.enrollment_errors.empty_state"
                      className="text-center py-12 text-muted-foreground"
                    >
                      <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500" />
                      <p className="font-medium text-green-700">
                        No enrollment errors for {branch} branch.
                      </p>
                    </div>
                  ) : filteredEnroll.length === 0 ? (
                    <div
                      data-ocid="hod.enrollment_errors.empty_state"
                      className="text-center py-8 text-muted-foreground"
                    >
                      <p>No errors match the selected filter.</p>
                    </div>
                  ) : (
                    <>
                      <ErrorTable
                        errors={filteredEnroll}
                        page={enrollPage}
                        totalPages={totalEnrollPages}
                        onPageChange={setEnrollPage}
                        editMode={enrollEditMode}
                        accentColor="blue"
                        bgClass="border-blue-100"
                        textClass="text-blue-800"
                        onView={(err) => setViewEnrollErr(err)}
                        onEdit={(err) => {
                          setEditEnrollErr(err);
                          setEditEnrollForm({
                            studentId: err.studentId,
                            email: err.email,
                            courseId: err.courseId,
                            courseName: err.courseName,
                          });
                        }}
                        ocidPrefix="hod.enrollment_errors"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Edit credits remaining: <strong>{uploadCredits}</strong>
                      </p>
                    </>
                  )}

                  {/* HOD Edited Records — at bottom of enrollment errors */}
                  {branchEdits.filter(
                    (r) => r.newValues.paymentStatus === undefined,
                  ).length > 0 && (
                    <div className="mt-8">
                      <h3 className="flex items-center gap-2 font-display font-semibold text-sm mb-3">
                        <ClipboardEdit className="h-4 w-4 text-indigo-600" />
                        Edited Enrollment Records
                        <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
                          {branchEdits.length}
                        </Badge>
                      </h3>
                      <div
                        className="rounded-lg border overflow-x-auto"
                        data-ocid="hod.edited_records.table"
                      >
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-indigo-50/60">
                              <TableHead className="text-indigo-700">
                                #
                              </TableHead>
                              <TableHead className="text-indigo-700">
                                Roll No
                              </TableHead>
                              <TableHead className="text-indigo-700">
                                Course Name
                              </TableHead>
                              <TableHead className="text-indigo-700">
                                Course ID
                              </TableHead>
                              <TableHead className="text-indigo-700">
                                Edited At
                              </TableHead>
                              <TableHead className="text-indigo-700">
                                Old Values
                              </TableHead>
                              <TableHead className="text-indigo-700">
                                New Values
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
                                <TableCell className="font-mono text-sm">
                                  {rec.studentId}
                                </TableCell>
                                <TableCell className="text-sm max-w-[160px] truncate">
                                  {rec.courseName}
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  {rec.courseId}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                  {new Date(rec.editedAt).toLocaleString(
                                    "en-IN",
                                  )}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">
                                  {Object.entries(rec.oldValues)
                                    .map(([k, v]) => `${k}: ${v}`)
                                    .join(", ")}
                                </TableCell>
                                <TableCell className="text-xs max-w-[140px] truncate">
                                  {Object.entries(rec.newValues)
                                    .map(([k, v]) => `${k}: ${v}`)
                                    .join(", ")}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ══════════ EXAM REG ERRORS TAB ══════════ */}
            <TabsContent value="examreg">
              <Card className="border-purple-200">
                <CardHeader className="bg-purple-50/60 rounded-t-xl">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="font-display text-base flex items-center gap-2 text-purple-900">
                      <FileText className="h-4 w-4 text-purple-600" />
                      Exam Registration Errors — {branch}
                      {showExamRegErrors && branchExamErrors.length > 0 && (
                        <Badge className="bg-purple-600 text-white ml-1">
                          {filteredExam.length}
                          {examFilter !== "All" &&
                            ` / ${branchExamErrors.length}`}
                        </Badge>
                      )}
                    </CardTitle>
                    {showExamRegErrors && branchExamErrors.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select
                          value={examFilter}
                          onValueChange={handleExamFilterChange}
                        >
                          <SelectTrigger
                            className="w-44 h-8 text-xs"
                            data-ocid="hod.exam_reg_errors.type.select"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">All Error Types</SelectItem>
                            {uniqueExamTypes.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                          data-ocid="hod.exam_reg_errors.download_button"
                          onClick={() =>
                            downloadErrorsAsExcel(
                              filteredExam,
                              `examreg-errors-${branch}-${new Date().toISOString().slice(0, 10)}.xlsx`,
                            )
                          }
                        >
                          <Download className="h-3 w-3" /> Download
                        </Button>
                        {examEditMode ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 gap-1 text-xs"
                            data-ocid="hod.exam_reg_errors.end_editing_button"
                            onClick={() => {
                              updateHodPermission(branch, {
                                uploadCredits: Math.max(0, uploadCredits - 1),
                              });
                              setExamEditMode(false);
                              toast.success(
                                "Edit session ended. 1 credit used.",
                              );
                            }}
                          >
                            <Save className="h-3 w-3" /> End Editing / Save All
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 text-xs"
                            data-ocid="hod.exam_reg_errors.enable_editing_button"
                            disabled={uploadCredits <= 0}
                            title={
                              uploadCredits <= 0
                                ? "No edit credits. Ask Dean for more."
                                : "Enable editing for all rows"
                            }
                            onClick={() => setExamEditMode(true)}
                          >
                            <PenLine className="h-3 w-3" /> Enable Editing
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {!showExamRegErrors ? (
                    <div
                      data-ocid="hod.exam_reg_errors.empty_state"
                      className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground"
                    >
                      <FileText className="h-10 w-10 text-muted-foreground/40" />
                      <p className="font-medium">
                        No Exam Registration Data Uploaded
                      </p>
                      <p className="text-sm max-w-sm">
                        Upload an exam reg file or wait for the Dean to upload
                        data.
                      </p>
                    </div>
                  ) : branchExamErrors.length === 0 ? (
                    <div
                      data-ocid="hod.exam_reg_errors.empty_state"
                      className="text-center py-12 text-muted-foreground"
                    >
                      <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500" />
                      <p className="font-medium text-green-700">
                        No exam registration errors for {branch} branch.
                      </p>
                    </div>
                  ) : filteredExam.length === 0 ? (
                    <div
                      data-ocid="hod.exam_reg_errors.empty_state"
                      className="text-center py-8 text-muted-foreground"
                    >
                      <p>No errors match the selected filter.</p>
                    </div>
                  ) : (
                    <>
                      <ErrorTable
                        errors={filteredExam}
                        page={examPage}
                        totalPages={totalExamPages}
                        onPageChange={setExamPage}
                        editMode={examEditMode}
                        accentColor="purple"
                        bgClass="border-purple-100"
                        textClass="text-purple-800"
                        onView={(err) => setViewExamErr(err)}
                        onEdit={(err) => {
                          setEditExamErr(err);
                          setEditExamForm({
                            studentId: err.studentId,
                            courseId: err.courseId,
                            paymentStatus: err.paymentStatus,
                          });
                        }}
                        ocidPrefix="hod.exam_reg_errors"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Edit credits remaining: <strong>{uploadCredits}</strong>
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ══════════ 12-WEEK COURSES TAB ══════════ */}
            <TabsContent value="courses">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="font-display text-base flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        12-Week NPTEL Courses
                        {uploadedCourses.length > 0 && (
                          <Badge variant="secondary">
                            {uploadedCourses.length} courses
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        All 12-week courses uploaded by Dean — visible to all
                        HODs without branch filtering
                      </CardDescription>
                    </div>
                    <Input
                      placeholder="Search by Course Name or ID…"
                      value={courseSearch}
                      onChange={(e) => {
                        setCourseSearch(e.target.value);
                        setCoursePage(1);
                      }}
                      className="w-64 h-8 text-sm"
                      data-ocid="hod.courses.search_input"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {uploadedCourses.length === 0 ? (
                    <div
                      data-ocid="hod.courses.empty_state"
                      className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground"
                    >
                      <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                      <p className="font-medium">
                        No 12-Week Courses Available
                      </p>
                      <p className="text-sm max-w-sm">
                        Dean has not uploaded the 12-week courses file yet.
                      </p>
                    </div>
                  ) : filteredCourses.length === 0 ? (
                    <div
                      data-ocid="hod.courses.empty_state"
                      className="text-center py-8 text-muted-foreground"
                    >
                      <p>No courses match your search.</p>
                    </div>
                  ) : (
                    <>
                      <div
                        className="rounded-lg border overflow-x-auto"
                        data-ocid="hod.courses.table"
                      >
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="w-10">#</TableHead>
                              <TableHead>Course ID</TableHead>
                              <TableHead>Course Name</TableHead>
                              <TableHead>Duration</TableHead>
                              <TableHead>Week Count</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pagedCourses.map((course, i) => (
                              <TableRow
                                key={course.courseId}
                                data-ocid={`hod.courses.row.${(coursePage - 1) * PAGE_SIZE + i + 1}`}
                              >
                                <TableCell className="text-muted-foreground text-xs">
                                  {(coursePage - 1) * PAGE_SIZE + i + 1}
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  {course.courseId}
                                </TableCell>
                                <TableCell className="font-medium text-sm">
                                  {course.courseName}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">
                                    {course.duration}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {course.weekCount} wks
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <PaginationBar
                        page={coursePage}
                        total={totalCoursePages}
                        totalItems={filteredCourses.length}
                        onChange={setCoursePage}
                        ocidPrefix="hod.courses"
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* ══════════ DIALOGS ══════════ */}

      {/* View Enrollment Error */}
      {viewEnrollErr && (
        <Dialog open={true} onOpenChange={() => setViewEnrollErr(null)}>
          <DialogContent
            className="max-w-md"
            data-ocid="hod.view_enroll_error.dialog"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-blue-800">
                <Eye className="h-4 w-4" />
                Enrollment Error Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-lg bg-blue-50">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Course
                </p>
                <p className="font-bold text-base text-blue-800 mt-1">
                  {viewEnrollErr.courseName || "—"}
                </p>
                <p className="font-mono text-xs text-muted-foreground mt-0.5">
                  {viewEnrollErr.courseId}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Error Type:</span>
                <Badge variant="destructive" className="text-xs">
                  {viewEnrollErr.errorType}
                </Badge>
              </div>
              <div>
                <span className="font-semibold">Description: </span>
                <span className="text-muted-foreground">
                  {viewEnrollErr.description}
                </span>
              </div>
              <div className="border-t pt-3 space-y-1">
                <div>
                  <span className="font-semibold">Roll No: </span>
                  <span className="font-mono">{viewEnrollErr.studentId}</span>
                </div>
                <div>
                  <span className="font-semibold">Email: </span>
                  <span>{viewEnrollErr.email}</span>
                </div>
                <div>
                  <span className="font-semibold">Branch: </span>
                  <span>{viewEnrollErr.branch}</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewEnrollErr(null)}
              className="mt-2"
              data-ocid="hod.view_enroll_error.close_button"
            >
              <X className="h-3 w-3 mr-1" /> Close
            </Button>
          </DialogContent>
        </Dialog>
      )}

      {/* View Exam Reg Error */}
      {viewExamErr && (
        <Dialog open={true} onOpenChange={() => setViewExamErr(null)}>
          <DialogContent
            className="max-w-md"
            data-ocid="hod.view_exam_error.dialog"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-purple-800">
                <Eye className="h-4 w-4" />
                Exam Registration Error Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-lg bg-purple-50">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Course
                </p>
                <p className="font-bold text-base text-purple-800 mt-1">
                  {viewExamErr.courseName || "—"}
                </p>
                <p className="font-mono text-xs text-muted-foreground mt-0.5">
                  {viewExamErr.courseId}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Error Type:</span>
                <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                  {viewExamErr.errorType}
                </Badge>
              </div>
              <div>
                <span className="font-semibold">Description: </span>
                <span className="text-muted-foreground">
                  {viewExamErr.description}
                </span>
              </div>
              <div className="border-t pt-3 space-y-1">
                <div>
                  <span className="font-semibold">Roll No: </span>
                  <span className="font-mono">{viewExamErr.studentId}</span>
                </div>
                {viewExamErr.email && (
                  <div>
                    <span className="font-semibold">Email: </span>
                    <span>{viewExamErr.email}</span>
                  </div>
                )}
                {viewExamErr.paymentStatus && (
                  <div>
                    <span className="font-semibold">Payment Status: </span>
                    <span>{viewExamErr.paymentStatus}</span>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewExamErr(null)}
              className="mt-2"
              data-ocid="hod.view_exam_error.close_button"
            >
              <X className="h-3 w-3 mr-1" /> Close
            </Button>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Enrollment Record */}
      {editEnrollErr && (
        <Dialog open={true} onOpenChange={() => setEditEnrollErr(null)}>
          <DialogContent
            className="max-w-lg"
            data-ocid="hod.edit_enroll.dialog"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-blue-800">
                <PenLine className="h-4 w-4" />
                Edit Enrollment Record
              </DialogTitle>
            </DialogHeader>
            <div className="p-3 rounded-lg bg-blue-50/60 mb-2">
              <span className="text-xs text-muted-foreground">Course</span>
              <p className="font-bold text-blue-800">
                {editEnrollErr.courseName || "—"}
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                {editEnrollErr.courseId}
              </p>
            </div>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Roll No</Label>
                  <Input
                    value={editEnrollForm.studentId ?? ""}
                    onChange={(e) =>
                      setEditEnrollForm((p) => ({
                        ...p,
                        studentId: e.target.value,
                      }))
                    }
                    className="h-8 text-sm mt-1"
                    data-ocid="hod.enrollment_edit.studentid.input"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Email</Label>
                  <Input
                    value={editEnrollForm.email ?? ""}
                    onChange={(e) =>
                      setEditEnrollForm((p) => ({
                        ...p,
                        email: e.target.value,
                      }))
                    }
                    className="h-8 text-sm mt-1"
                    data-ocid="hod.enrollment_edit.email.input"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Course ID</Label>
                  <Input
                    value={editEnrollForm.courseId ?? ""}
                    onChange={(e) =>
                      setEditEnrollForm((p) => ({
                        ...p,
                        courseId: e.target.value,
                      }))
                    }
                    className="h-8 text-sm mt-1"
                    data-ocid="hod.enrollment_edit.courseid.input"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Branch</Label>
                  <Input
                    value={editEnrollErr.branch}
                    disabled
                    className="h-8 text-sm mt-1 bg-muted"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs font-semibold">Error Type</Label>
                  <Input
                    value={editEnrollErr.errorType}
                    disabled
                    className="h-8 text-sm mt-1 bg-muted"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditEnrollErr(null)}
                  data-ocid="hod.enrollment_edit.cancel_button"
                >
                  <X className="h-3 w-3 mr-1" /> Cancel
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={saveEditEnroll}
                  data-ocid="hod.enrollment_edit.save_button"
                >
                  <Save className="h-3 w-3 mr-1" /> Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Exam Reg Record */}
      {editExamErr && (
        <Dialog open={true} onOpenChange={() => setEditExamErr(null)}>
          <DialogContent className="max-w-lg" data-ocid="hod.edit_exam.dialog">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-purple-800">
                <PenLine className="h-4 w-4" />
                Edit Exam Registration Record
              </DialogTitle>
            </DialogHeader>
            <div className="p-3 rounded-lg bg-purple-50/60 mb-2">
              <span className="text-xs text-muted-foreground">Course</span>
              <p className="font-bold text-purple-800">
                {editExamErr.courseName || "—"}
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                {editExamErr.courseId}
              </p>
            </div>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Roll No</Label>
                  <Input
                    value={editExamForm.studentId ?? ""}
                    onChange={(e) =>
                      setEditExamForm((p) => ({
                        ...p,
                        studentId: e.target.value,
                      }))
                    }
                    className="h-8 text-sm mt-1"
                    data-ocid="hod.exam_edit.studentid.input"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Email</Label>
                  <Input
                    value={editExamErr.email ?? "—"}
                    disabled
                    className="h-8 text-sm mt-1 bg-muted"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Course ID</Label>
                  <Input
                    value={editExamForm.courseId ?? ""}
                    onChange={(e) =>
                      setEditExamForm((p) => ({
                        ...p,
                        courseId: e.target.value,
                      }))
                    }
                    className="h-8 text-sm mt-1"
                    data-ocid="hod.exam_edit.courseid.input"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">
                    Payment Status
                  </Label>
                  <Input
                    value={editExamForm.paymentStatus ?? ""}
                    onChange={(e) =>
                      setEditExamForm((p) => ({
                        ...p,
                        paymentStatus: e.target.value,
                      }))
                    }
                    className="h-8 text-sm mt-1"
                    data-ocid="hod.exam_edit.payment.input"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs font-semibold">Error Type</Label>
                  <Input
                    value={editExamErr.errorType}
                    disabled
                    className="h-8 text-sm mt-1 bg-muted"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditExamErr(null)}
                  data-ocid="hod.exam_edit.cancel_button"
                >
                  <X className="h-3 w-3 mr-1" /> Cancel
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={saveEditExam}
                  data-ocid="hod.exam_edit.save_button"
                >
                  <Save className="h-3 w-3 mr-1" /> Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
