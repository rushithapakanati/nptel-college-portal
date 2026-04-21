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
import { Switch } from "@/components/ui/switch";
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
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Download,
  Eye,
  FileText,
  Filter,
  LogOut,
  PenLine,
  PlusCircle,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Shuffle,
  Trash2,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { useAppContext } from "../context/AppContext";
import {
  BRANCHES,
  type Branch,
  type EnrollmentError,
  type ExamRegError,
  type HodPermission,
  type StudentUploadRecord,
} from "../data/mockData";
import {
  type CrossMatchError,
  crossMatchEnrollmentExamReg,
  getFileHeaders,
  parseCourseRows,
  parseExamRegRecords,
  parseExamShuffleRows,
  parseUploadedFile,
  validateEnrollmentRows,
  validateExamRegRows,
} from "../utils/fileParser";

// ─── Snapshot type (used by file versioning) ──────────────────────────────────
interface LocalSnapshot {
  fileName: string;
  timestamp: number;
  records: StudentUploadRecord[];
  errors: EnrollmentError[] | ExamRegError[];
}

const PIE_COLORS = ["#4f46e5", "#f59e0b", "#ef4444"];

// ─── Excel download helper ─────────────────────────────────────────────────────
async function downloadErrorsAsExcel(
  errors: (EnrollmentError | ExamRegError)[],
  filename: string,
) {
  // Dynamically load XLSX from window (loaded via CDN in index.html) or fallback to CSV
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const XLSX = (window as any).XLSX;
  if (!XLSX) {
    // Fallback: download as CSV
    const header =
      "Student ID,Email,Course ID,Course Name,Error Type,Description,Branch";
    const rows = errors.map((e) =>
      [
        `"${e.studentId}"`,
        `"${e.email}"`,
        `"${e.courseId}"`,
        `"${(e.courseName || "").replace(/"/g, '""')}"`,
        `"${e.errorType}"`,
        `"${(e.description || "").replace(/"/g, '""')}"`,
        `"${e.branch}"`,
      ].join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.replace(".xlsx", ".csv");
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const rowData = errors.map((e) => ({
    "Student ID": e.studentId,
    Email: e.email,
    "Course ID": e.courseId,
    "Course Name": e.courseName || "",
    "Error Type": e.errorType,
    Description: e.description || "",
    Branch: e.branch,
  }));
  const ws = XLSX.utils.json_to_sheet(rowData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Errors");
  XLSX.writeFile(wb, filename);
}

function classifyPaymentStatus(status?: string): "done" | "redo" | "doFirst" {
  if (!status) return "doFirst";
  const s = status.toLowerCase().replace(/[_\s]/g, "").trim();
  if (
    s === "paymentcomplete" ||
    s === "complete" ||
    s === "paymentsuccess" ||
    s === "success" ||
    s === "paymentfailed" ||
    s === "failed"
  ) {
    if (
      s === "paymentcomplete" ||
      s === "complete" ||
      s === "paymentsuccess" ||
      s === "success"
    )
      return "done";
    return "redo";
  }
  if (
    s === "paymentpending" ||
    s === "pending" ||
    s === "paymentdraft" ||
    s === "draft"
  )
    return "redo";
  return "doFirst";
}

function getErrorBadgeClass(errorType: string): string {
  const t = errorType.toLowerCase();
  if (t.includes("missing")) return "bg-red-100 text-red-700 border-red-300";
  if (t.includes("invalid") || t.includes("format"))
    return "bg-orange-100 text-orange-700 border-orange-300";
  if (t.includes("mismatch") || t.includes("cross"))
    return "bg-yellow-100 text-yellow-700 border-yellow-300";
  if (t.includes("payment") || t.includes("redo"))
    return "bg-amber-100 text-amber-700 border-amber-300";
  return "bg-destructive/10 text-destructive border-destructive/30";
}

// ─── Reusable paginated error table ───────────────────────────────────────────

interface ErrorTableProps {
  errors: (EnrollmentError | ExamRegError)[];
  page: number;
  pageSize: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  theme: "blue" | "purple" | "default";
  showPaymentStatus?: boolean;
  onView: (err: EnrollmentError | ExamRegError) => void;
  ocidPrefix: string;
}

function ErrorTable({
  errors,
  page,
  pageSize,
  totalPages,
  onPrev,
  onNext,
  theme,
  showPaymentStatus,
  onView,
  ocidPrefix,
}: ErrorTableProps) {
  const themeClass =
    theme === "blue"
      ? "bg-blue-50/60"
      : theme === "purple"
        ? "bg-purple-50/60"
        : "bg-muted/50";
  const headClass =
    theme === "blue"
      ? "text-blue-700"
      : theme === "purple"
        ? "text-purple-700"
        : "";

  if (errors.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-400" />
        <p>No errors found for selected filters.</p>
      </div>
    );
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, errors.length);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground px-1">
        Showing {start}–{end} of{" "}
        <strong className="text-foreground">{errors.length}</strong> errors
      </p>
      <div
        className="rounded-lg border overflow-x-auto"
        data-ocid={`${ocidPrefix}.table`}
      >
        <Table>
          <TableHeader>
            <TableRow className={themeClass}>
              <TableHead className={headClass}>#</TableHead>
              <TableHead className={headClass}>Branch</TableHead>
              <TableHead className={headClass}>Roll No</TableHead>
              <TableHead className={headClass}>Email</TableHead>
              <TableHead className={headClass}>Course Name</TableHead>
              <TableHead className={headClass}>Course ID</TableHead>
              {showPaymentStatus && (
                <TableHead className={headClass}>Payment Status</TableHead>
              )}
              <TableHead className={headClass}>Error Type</TableHead>
              <TableHead className={headClass}>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {errors.map((err, i) => (
              <TableRow
                key={`${err.id}-${i}`}
                data-ocid={`${ocidPrefix}.row.${i + 1}`}
              >
                <TableCell className="text-muted-foreground text-xs">
                  {(page - 1) * pageSize + i + 1}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {err.branch}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {err.studentId}
                </TableCell>
                <TableCell className="text-sm max-w-[160px] truncate">
                  {err.email}
                </TableCell>
                <TableCell className="text-sm max-w-xs">
                  <span className="font-semibold text-primary truncate block">
                    {err.courseName || "-"}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {err.courseId}
                </TableCell>
                {showPaymentStatus && (
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-xs border-amber-400 text-amber-700 bg-amber-50"
                    >
                      {"paymentStatus" in err
                        ? (err as ExamRegError).paymentStatus || "N/A"
                        : "N/A"}
                    </Badge>
                  </TableCell>
                )}
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getErrorBadgeClass(err.errorType)}`}
                  >
                    {err.errorType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onView(err)}
                    className="h-7 px-2 gap-1 text-blue-600 hover:text-blue-800"
                    data-ocid={`${ocidPrefix}.view_button`}
                  >
                    <Eye className="h-3 w-3" /> View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrev}
            disabled={page === 1}
            data-ocid={`${ocidPrefix}.pagination_prev`}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={page === totalPages}
            data-ocid={`${ocidPrefix}.pagination_next`}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function DeanDashboard() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { collegeName?: string };
  const collegeName = params.collegeName
    ? decodeURIComponent(params.collegeName)
    : "";

  const {
    hodPermissions,
    updateHodPermission,
    enrollmentErrors,
    examRegErrors,
    setEnrollmentErrors,
    setExamRegErrors,
    uploadedStudentRecords,
    setUploadedStudentRecords,
    uploadedExamRegRecords,
    setUploadedExamRegRecords,
    uploadedCourses,
    setUploadedCourses,
    deanStudentDataUploaded,
    setDeanStudentDataUploaded,
    enrollmentFileSnapshots,
    addEnrollmentSnapshot,
    examRegFileSnapshots,
    addExamRegSnapshot,
    deanCourseFileUploaded,
    setDeanCourseFileUploaded,
    deanExamRegDataUploaded,
    setDeanExamRegDataUploaded,
    setDeanShuffleDataUploaded,
    uploadedShuffleRecords,
    setUploadedShuffleRecords,
    hodEditedRecords,
    enrollmentFileRecordCount,
    examRegFileRecordCount,
    logout,
  } = useAppContext();

  // ── Dialog state ──
  const [viewErrorDialog, setViewErrorDialog] = useState<{
    description: string;
    courseName?: string;
    courseId?: string;
    errorType?: string;
    studentId?: string;
    email?: string;
    branch?: string;
  } | null>(null);

  // ── Parsing state ──
  const [parsingFile, setParsingFile] = useState<string | null>(null);

  // ── Permissions pending state ──
  const [pendingPerms, setPendingPerms] = useState<
    Record<Branch, HodPermission>
  >(
    JSON.parse(JSON.stringify(hodPermissions)) as Record<Branch, HodPermission>,
  );

  // ── Upload refs ──
  const courseFileRef = useRef<HTMLInputElement>(null);
  const studentDataFileRef = useRef<HTMLInputElement>(null);
  const examRegFileRef = useRef<HTMLInputElement>(null);
  const shuffleFileRef = useRef<HTMLInputElement>(null);

  // ── File name lists ──
  const [courseFileName, setCourseFileName] = useState<string | null>(null);
  const [enrollmentFileNames, setEnrollmentFileNames] = useState<string[]>([]);
  const [examRegFileNames, setExamRegFileNames] = useState<string[]>([]);
  const [shuffleFileNames, setShuffleFileNames] = useState<string[]>([]);
  const [courseFileHeaders, setCourseFileHeaders] = useState<string[]>([]);
  const [enrollmentFileHeaders, setEnrollmentFileHeaders] = useState<string[]>(
    [],
  );

  // ── Per-branch enrollment counts (from upload) ──
  const [enrollBranchCounts, setEnrollBranchCounts] = useState<
    Record<string, number>
  >({});

  // ── Cross-match errors ──
  const [crossMatchErrors, setCrossMatchErrors] = useState<CrossMatchError[]>(
    [],
  );

  // ── Snapshot selection ──
  const [selectedEnrollmentSnapshotIdx, setSelectedEnrollmentSnapshotIdx] =
    useState<number | null>(null);
  const [selectedExamRegSnapshotIdx, setSelectedExamRegSnapshotIdx] = useState<
    number | null
  >(null);

  // ── Filter state ──
  const [errorBranchFilter, setErrorBranchFilter] = useState<string>("All");
  const [errorTypeFilter, setErrorTypeFilter] = useState<string>("All");
  const [errorPage, setErrorPage] = useState(1);

  const [enrollErrBranchFilter, setEnrollErrBranchFilter] =
    useState<string>("All");
  const [enrollErrTypeFilter, setEnrollErrTypeFilter] = useState<string>("All");
  const [enrollErrPage, setEnrollErrPage] = useState(1);

  const [examErrBranchFilter, setExamErrBranchFilter] = useState<string>("All");
  const [examErrTypeFilter, setExamErrTypeFilter] = useState<string>("All");
  const [examErrPage, setExamErrPage] = useState(1);

  const [coursePage, setCoursePage] = useState(1);

  const [donePage, setDonePage] = useState(1);
  const [hodEditPage, setHodEditPage] = useState(1);

  // ── Done Registrations branch filter ──
  const [doneBranchFilter, setDoneBranchFilter] = useState<string>("All");

  const PAGE_SIZE = 50;
  const COURSE_PAGE_SIZE = 50;
  const DONE_PAGE_SIZE = 50;
  const HOD_EDIT_PAGE_SIZE = 50;

  // ─── Handlers ─────────────────────────────────────────────────────────────────

  const handleLogout = useCallback(() => {
    logout();
    navigate({ to: "/" });
  }, [logout, navigate]);

  function handleRefresh() {
    toast.success("Dashboard data refreshed.");
  }

  const savePerms = useCallback(
    (branch: Branch) => {
      updateHodPermission(branch, pendingPerms[branch]);
      toast.success(`Permissions saved for ${branch} HOD.`);
    },
    [updateHodPermission, pendingPerms],
  );

  const openErrorDialog = useCallback((err: EnrollmentError | ExamRegError) => {
    setViewErrorDialog({
      description: err.description,
      courseName: err.courseName,
      courseId: err.courseId,
      errorType: err.errorType,
      studentId: err.studentId,
      email: err.email,
      branch: err.branch,
    });
  }, []);

  async function handleCourseUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCourseFileName(file.name);
    try {
      toast.info(`Parsing course file "${file.name}"...`);
      const rows = await parseUploadedFile(file);
      const headers = getFileHeaders(rows);
      setCourseFileHeaders(headers);
      const courses = parseCourseRows(rows);
      setUploadedCourses(courses);
      setDeanCourseFileUploaded(true);
      toast.success(`Course file loaded — ${courses.length} 12-week courses.`);
      if (courses.length === 0 && rows.length > 0) {
        toast.warning(
          `No 12-week courses found. Detected columns: ${headers.join(", ")}`,
          { duration: 8000 },
        );
      }
    } catch (err) {
      toast.error(
        `Failed to parse: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async function handleStudentDataUpload(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setParsingFile(file.name);
    try {
      toast.info(`Parsing enrollment file "${file.name}"...`);
      const rows = await parseUploadedFile(file);
      const headers = getFileHeaders(rows);
      setEnrollmentFileHeaders(headers);
      const uploadedCourseIds = uploadedCourses.map((c) => c.courseId);
      const { records, errors } = validateEnrollmentRows(
        rows,
        collegeName,
        uploadedCourseIds,
        uploadedCourses,
      );
      setUploadedStudentRecords(records, records.length);
      setEnrollmentErrors(errors);
      setDeanStudentDataUploaded(true);
      setEnrollmentFileNames((prev) => [...prev, file.name]);
      const branchCountMap: Record<string, number> = {};
      for (const r of records) {
        branchCountMap[r.branch] = (branchCountMap[r.branch] ?? 0) + 1;
      }
      setEnrollBranchCounts(branchCountMap);
      addEnrollmentSnapshot({
        id: `snap-${Date.now()}`,
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        recordCount: records.length,
        isActive: true,
        data: records,
      });
      setSelectedEnrollmentSnapshotIdx(null);
      toast.success(
        `"${file.name}" — ${records.length} records, ${errors.length} errors.`,
      );
    } catch (err) {
      toast.error(
        `Failed to parse: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setParsingFile(null);
    }
  }

  function handleRemoveEnrollmentFile(fileName: string) {
    const newList = enrollmentFileNames.filter((n) => n !== fileName);
    setEnrollmentFileNames(newList);
    if (newList.length === 0) {
      setDeanStudentDataUploaded(false);
      setUploadedStudentRecords([]);
      setEnrollmentErrors([]);
    }
  }

  async function handleExamRegUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      toast.info(`Parsing exam registration file "${file.name}"...`);
      const rows = await parseUploadedFile(file);
      const enrollmentIds = uploadedStudentRecords.map((r) => r.studentId);
      const courseIdsForValidation = uploadedCourses.map((c) => c.courseId);
      const examErrors = validateExamRegRows(
        rows,
        enrollmentIds,
        courseIdsForValidation,
        collegeName,
      );
      const examRecords = parseExamRegRecords(rows);
      setUploadedExamRegRecords(examRecords, examRecords.length);
      setExamRegErrors(examErrors);
      setDeanExamRegDataUploaded(true);
      setExamRegFileNames((prev) => [...prev, file.name]);
      addExamRegSnapshot({
        id: `snap-${Date.now()}`,
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        recordCount: examRecords.length,
        isActive: true,
        data: examRecords,
      });
      setSelectedExamRegSnapshotIdx(null);
      const crossErrors = crossMatchEnrollmentExamReg(
        uploadedStudentRecords,
        examRecords,
        uploadedCourses,
      );
      setCrossMatchErrors(crossErrors);
      toast.success(
        `"${file.name}" — ${examRecords.length} records, ${examErrors.length} errors.`,
      );
    } catch (err) {
      toast.error(
        `Failed to parse: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  function handleRemoveExamRegFile(fileName: string) {
    const newList = examRegFileNames.filter((n) => n !== fileName);
    setExamRegFileNames(newList);
    if (newList.length === 0) {
      setDeanExamRegDataUploaded(false);
      setExamRegErrors([]);
      setUploadedExamRegRecords([]);
    }
  }

  async function handleShuffleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      toast.info(`Parsing shuffle file "${file.name}"...`);
      const rows = await parseUploadedFile(file);
      const shuffleRecs = parseExamShuffleRows(rows);
      const existingMap = new Map(
        uploadedShuffleRecords.map((r) => [`${r.studentId}::${r.courseId}`, r]),
      );
      for (const rec of shuffleRecs) {
        existingMap.set(`${rec.studentId}::${rec.courseId}`, rec);
      }
      setUploadedShuffleRecords(Array.from(existingMap.values()));
      setDeanShuffleDataUploaded(true);
      setShuffleFileNames((prev) => [...prev, file.name]);
      toast.success(
        `"${file.name}" — ${shuffleRecs.length} shuffle records loaded.`,
      );
    } catch (err) {
      toast.error(
        `Failed to parse: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  function handleRemoveShuffleFile(fileName: string) {
    const newList = shuffleFileNames.filter((n) => n !== fileName);
    setShuffleFileNames(newList);
    if (newList.length === 0) {
      setDeanShuffleDataUploaded(false);
      setUploadedShuffleRecords([]);
    }
  }

  // ─── Statistics computations ──────────────────────────────────────────────────

  const enrollBranchStats = useMemo(
    () =>
      BRANCHES.map((b) => ({
        branch: b,
        total: enrollBranchCounts[b] ?? 0,
        errors: enrollmentErrors.filter((e) => e.branch === b).length,
      })),
    [enrollBranchCounts, enrollmentErrors],
  );

  const examRegBranchStats = useMemo(() => {
    const statsMap = new Map<
      Branch,
      {
        total: number;
        done: number;
        redo: number;
        doFirst: number;
        errors: number;
      }
    >();
    for (const b of BRANCHES) {
      statsMap.set(b, { total: 0, done: 0, redo: 0, doFirst: 0, errors: 0 });
    }
    for (const r of uploadedExamRegRecords) {
      const stats = statsMap.get(r.branch);
      if (!stats) continue;
      stats.total++;
      const cls = classifyPaymentStatus(r.paymentStatus);
      stats[cls]++;
    }
    for (const e of examRegErrors) {
      const stats = statsMap.get(e.branch);
      if (stats) stats.errors++;
    }
    return BRANCHES.map((b) => ({
      branch: b,
      ...(statsMap.get(b) ?? {
        total: 0,
        done: 0,
        redo: 0,
        doFirst: 0,
        errors: 0,
      }),
    }));
  }, [uploadedExamRegRecords, examRegErrors]);

  const totalDone = useMemo(
    () => examRegBranchStats.reduce((a, b) => a + b.done, 0),
    [examRegBranchStats],
  );
  const totalRedo = useMemo(
    () => examRegBranchStats.reduce((a, b) => a + b.redo, 0),
    [examRegBranchStats],
  );
  const totalDoFirst = useMemo(
    () => examRegBranchStats.reduce((a, b) => a + b.doFirst, 0),
    [examRegBranchStats],
  );

  const pieData = useMemo(
    () => [
      { name: "Done", value: totalDone },
      { name: "Redo Registration", value: totalRedo },
      { name: "Do First Registration", value: totalDoFirst },
    ],
    [totalDone, totalRedo, totalDoFirst],
  );

  // ─── Done registrations ───────────────────────────────────────────────────────

  const doneRegistrations = useMemo(
    () =>
      uploadedExamRegRecords.filter(
        (r) => classifyPaymentStatus(r.paymentStatus) === "done",
      ),
    [uploadedExamRegRecords],
  );

  const filteredDoneRegs = useMemo(
    () =>
      doneBranchFilter === "All"
        ? doneRegistrations
        : doneRegistrations.filter((r) => r.branch === doneBranchFilter),
    [doneRegistrations, doneBranchFilter],
  );

  const pagedDoneRegs = useMemo(
    () =>
      filteredDoneRegs.slice(
        (donePage - 1) * DONE_PAGE_SIZE,
        donePage * DONE_PAGE_SIZE,
      ),
    [filteredDoneRegs, donePage],
  );
  const totalDonePages = Math.ceil(filteredDoneRegs.length / DONE_PAGE_SIZE);

  // ─── Courses ──────────────────────────────────────────────────────────────────

  const displayCourses = deanCourseFileUploaded ? uploadedCourses : [];
  const filteredCourses = useMemo(() => displayCourses, [displayCourses]);
  const pagedCourses = useMemo(
    () =>
      filteredCourses.slice(
        (coursePage - 1) * COURSE_PAGE_SIZE,
        coursePage * COURSE_PAGE_SIZE,
      ),
    [filteredCourses, coursePage],
  );
  const totalCoursePages = Math.ceil(filteredCourses.length / COURSE_PAGE_SIZE);

  // ─── All errors (combined) ────────────────────────────────────────────────────

  const allCombinedErrors = useMemo(
    () => [
      ...enrollmentErrors.map((e) => ({
        ...e,
        _source: "Enrollment" as const,
      })),
      ...examRegErrors.map((e) => ({ ...e, _source: "Exam Reg" as const })),
    ],
    [enrollmentErrors, examRegErrors],
  );

  const filteredAllErrors = useMemo(
    () =>
      allCombinedErrors.filter((e) => {
        const branchMatch =
          errorBranchFilter === "All" || e.branch === errorBranchFilter;
        const typeMatch =
          errorTypeFilter === "All" || e.errorType === errorTypeFilter;
        return branchMatch && typeMatch;
      }),
    [allCombinedErrors, errorBranchFilter, errorTypeFilter],
  );
  const uniqueAllErrorTypes = useMemo(
    () => Array.from(new Set(allCombinedErrors.map((e) => e.errorType))),
    [allCombinedErrors],
  );
  const totalAllErrorPages = Math.ceil(filteredAllErrors.length / PAGE_SIZE);
  const pagedAllErrors = useMemo(
    () =>
      filteredAllErrors.slice(
        (errorPage - 1) * PAGE_SIZE,
        errorPage * PAGE_SIZE,
      ),
    [filteredAllErrors, errorPage],
  );

  // ─── Enrollment errors filtered ───────────────────────────────────────────────

  const filteredEnrollErrors = useMemo(
    () =>
      enrollmentErrors.filter((e) => {
        const branchMatch =
          enrollErrBranchFilter === "All" || e.branch === enrollErrBranchFilter;
        const typeMatch =
          enrollErrTypeFilter === "All" || e.errorType === enrollErrTypeFilter;
        return branchMatch && typeMatch;
      }),
    [enrollmentErrors, enrollErrBranchFilter, enrollErrTypeFilter],
  );
  const uniqueEnrollErrTypes = useMemo(
    () => Array.from(new Set(enrollmentErrors.map((e) => e.errorType))),
    [enrollmentErrors],
  );
  const totalEnrollErrPages = Math.ceil(
    filteredEnrollErrors.length / PAGE_SIZE,
  );
  const pagedEnrollErrors = useMemo(
    () =>
      filteredEnrollErrors.slice(
        (enrollErrPage - 1) * PAGE_SIZE,
        enrollErrPage * PAGE_SIZE,
      ),
    [filteredEnrollErrors, enrollErrPage],
  );

  // ─── Exam reg errors filtered ─────────────────────────────────────────────────

  const filteredExamRegErrList = useMemo(
    () =>
      examRegErrors.filter((e) => {
        const branchMatch =
          examErrBranchFilter === "All" || e.branch === examErrBranchFilter;
        const typeMatch =
          examErrTypeFilter === "All" || e.errorType === examErrTypeFilter;
        return branchMatch && typeMatch;
      }),
    [examRegErrors, examErrBranchFilter, examErrTypeFilter],
  );
  const uniqueExamErrTypes = useMemo(
    () => Array.from(new Set(examRegErrors.map((e) => e.errorType))),
    [examRegErrors],
  );
  const totalExamErrPages = Math.ceil(
    filteredExamRegErrList.length / PAGE_SIZE,
  );
  const pagedExamErrors = useMemo(
    () =>
      filteredExamRegErrList.slice(
        (examErrPage - 1) * PAGE_SIZE,
        examErrPage * PAGE_SIZE,
      ),
    [filteredExamRegErrList, examErrPage],
  );

  // ─── HOD edited records ───────────────────────────────────────────────────────

  const pagedHodEdits = hodEditedRecords.slice(
    (hodEditPage - 1) * HOD_EDIT_PAGE_SIZE,
    hodEditPage * HOD_EDIT_PAGE_SIZE,
  );
  const totalHodEditPages = Math.ceil(
    hodEditedRecords.length / HOD_EDIT_PAGE_SIZE,
  );

  const noDataUploaded = !deanStudentDataUploaded && !deanExamRegDataUploaded;

  // ─── Upload card component ────────────────────────────────────────────────────

  function UploadCard({
    title,
    description,
    icon: Icon,
    iconColor = "text-primary",
    fileNames,
    onRemove,
    inputId,
    inputRef,
    onChange,
    extra,
    fileOcid,
    dropzoneOcid,
    borderColor = "border-primary/40",
    bgColor = "bg-primary/5",
    hoverBgColor = "hover:bg-primary/10",
    isParsing = false,
  }: {
    title: string;
    description: string;
    icon: React.ElementType;
    iconColor?: string;
    fileNames: string[];
    onRemove: (name: string) => void;
    inputId: string;
    inputRef: React.RefObject<HTMLInputElement | null>;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    extra?: React.ReactNode;
    fileOcid: string;
    dropzoneOcid: string;
    borderColor?: string;
    bgColor?: string;
    hoverBgColor?: string;
    isParsing?: boolean;
  }) {
    return (
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Icon className={`h-4 w-4 ${iconColor}`} />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isParsing && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700">
              <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin shrink-0" />
              Parsing file…
            </div>
          )}
          {fileNames.length > 0 && (
            <div className="space-y-2">
              {fileNames.map((fname) => (
                <div
                  key={fname}
                  className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <p className="text-sm font-medium text-green-700 flex-1 truncate min-w-0">
                    {fname}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemove(fname)}
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                    data-ocid={fileOcid}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <label
            htmlFor={inputId}
            data-ocid={dropzoneOcid}
            className={`flex items-center gap-3 p-4 rounded-lg border-2 border-dashed ${borderColor} ${bgColor} cursor-pointer ${hoverBgColor} transition-colors`}
          >
            <PlusCircle className={`h-6 w-6 ${iconColor} shrink-0`} />
            <div>
              <p className="font-medium text-sm">
                {fileNames.length > 0
                  ? `Upload another ${title.toLowerCase()} file`
                  : `Click to upload ${title} CSV/Excel`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Multiple uploads supported
              </p>
            </div>
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={onChange}
          />
          {extra}
        </CardContent>
      </Card>
    );
  }

  // ─── Snapshot selector helper ─────────────────────────────────────────────────

  function SnapshotSelector({
    snapshots,
    selectedIdx,
    onSelect,
    onRestore,
    label,
  }: {
    snapshots: LocalSnapshot[];
    selectedIdx: number | null;
    onSelect: (idx: number | null) => void;
    onRestore: (snap: LocalSnapshot) => void;
    label: string;
  }) {
    if (snapshots.length === 0) return null;
    return (
      <div className="mt-4 p-3 rounded-lg border bg-muted/30">
        <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" /> Previous {label} Files
        </p>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onSelect(null)}
            className={`w-full flex items-center justify-between p-2 rounded text-xs ${selectedIdx === null ? "bg-primary/10 border border-primary/30 font-medium" : "hover:bg-muted/50"}`}
          >
            <span>Latest (current)</span>
            <Badge variant="outline" className="text-xs">
              Active
            </Badge>
          </button>
          {snapshots.map((snap, idx) => (
            <div
              key={snap.timestamp}
              className={`w-full flex items-center justify-between p-2 rounded text-xs ${selectedIdx === idx ? "bg-amber-50 border border-amber-300 font-medium" : "hover:bg-muted/50"}`}
            >
              <button
                type="button"
                onClick={() => onSelect(idx)}
                className="flex items-center gap-1 flex-1 truncate text-left cursor-pointer min-w-0"
              >
                <span className="truncate flex-1">{snap.fileName}</span>
                <span className="text-muted-foreground ml-2 shrink-0">
                  {new Date(snap.timestamp).toLocaleDateString()}
                </span>
              </button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs ml-2 shrink-0 border-blue-300 text-blue-600 hover:bg-blue-50"
                onClick={() => {
                  onRestore(snap);
                  onSelect(null);
                }}
              >
                Restore
              </Button>
            </div>
          ))}
        </div>
        {selectedIdx !== null && (
          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
            ⚠️ Viewing historical data from{" "}
            <strong>{snapshots[selectedIdx]?.fileName}</strong>. This is not the
            current active data.
          </div>
        )}
      </div>
    );
  }

  // ─── Filter bar helper ────────────────────────────────────────────────────────

  function ErrorFilterBar({
    branchFilter,
    onBranchChange,
    typeFilter,
    onTypeChange,
    errorTypes,
    errors,
    filename,
    branchOcid,
    typeOcid,
    downloadOcid,
  }: {
    branchFilter: string;
    onBranchChange: (v: string) => void;
    typeFilter: string;
    onTypeChange: (v: string) => void;
    errorTypes: string[];
    errors: (EnrollmentError | ExamRegError)[];
    filename: string;
    branchOcid: string;
    typeOcid: string;
    downloadOcid: string;
  }) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={branchFilter} onValueChange={onBranchChange}>
          <SelectTrigger className="w-32 h-8" data-ocid={branchOcid}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Branches</SelectItem>
            {BRANCHES.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={onTypeChange}>
          <SelectTrigger className="w-44 h-8" data-ocid={typeOcid}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Error Types</SelectItem>
            {errorTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1 text-xs"
          data-ocid={downloadOcid}
          onClick={() => downloadErrorsAsExcel(errors, filename)}
        >
          <Download className="h-3 w-3" /> Download
        </Button>
      </div>
    );
  }

  // ─── Local snapshot lists (derived from context snapshots) ────────────────────
  const enrollLocalSnapshots: LocalSnapshot[] = useMemo(
    () =>
      enrollmentFileSnapshots.map((s) => ({
        fileName: s.fileName,
        timestamp: new Date(s.uploadedAt).getTime(),
        records: s.data as StudentUploadRecord[],
        errors: [] as EnrollmentError[],
      })),
    [enrollmentFileSnapshots],
  );

  const examRegLocalSnapshots: LocalSnapshot[] = useMemo(
    () =>
      examRegFileSnapshots.map((s) => ({
        fileName: s.fileName,
        timestamp: new Date(s.uploadedAt).getTime(),
        records: s.data as StudentUploadRecord[],
        errors: [] as ExamRegError[],
      })),
    [examRegFileSnapshots],
  );

  // ─── Render ───────────────────────────────────────────────────────────────────

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
            data-ocid="dean.back.button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="h-5 w-px bg-white/30" />
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            <span className="font-display font-bold">Dean Dashboard</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Badge className="bg-white/20 text-white border-white/30 hidden sm:flex">
              {collegeName}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="text-white hover:bg-white/20 gap-2"
              data-ocid="dean.refresh.button"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white hover:bg-white/20 gap-2"
              data-ocid="dean.logout.button"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Tabs defaultValue="overview" data-ocid="dean.tabs">
            <TabsList className="mb-6 flex-wrap h-auto gap-1">
              <TabsTrigger
                value="overview"
                data-ocid="dean.overview.tab"
                className="gap-1.5"
              >
                <BarChart3 className="h-4 w-4" /> Overview
              </TabsTrigger>
              <TabsTrigger
                value="data-upload"
                data-ocid="dean.data_upload.tab"
                className="gap-1.5"
              >
                <Upload className="h-4 w-4" /> Data Upload
              </TabsTrigger>
              <TabsTrigger
                value="permissions"
                data-ocid="dean.permissions.tab"
                className="gap-1.5"
              >
                <Settings className="h-4 w-4" /> Permissions
              </TabsTrigger>
              <TabsTrigger
                value="courses"
                data-ocid="dean.courses.tab"
                className="gap-1.5"
              >
                <BookOpen className="h-4 w-4" /> Courses
              </TabsTrigger>
              <TabsTrigger
                value="all-errors"
                data-ocid="dean.all_errors.tab"
                className="gap-1.5"
              >
                <AlertCircle className="h-4 w-4" /> All Errors
                {allCombinedErrors.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-1 text-xs px-1.5 py-0 h-4"
                  >
                    {allCombinedErrors.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="enrollment-errors"
                data-ocid="dean.enrollment_errors.tab"
                className="gap-1.5"
              >
                <BookOpen className="h-4 w-4" /> Enrollment Errors
                {enrollmentErrors.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-1 text-xs px-1.5 py-0 h-4"
                  >
                    {enrollmentErrors.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="examreg-errors"
                data-ocid="dean.examreg_errors.tab"
                className="gap-1.5"
              >
                <ClipboardCheck className="h-4 w-4" /> Exam Reg Errors
                {examRegErrors.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-1 text-xs px-1.5 py-0 h-4"
                  >
                    {examRegErrors.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="statistics"
                data-ocid="dean.statistics.tab"
                className="gap-1.5"
              >
                <BarChart3 className="h-4 w-4" /> Statistics
              </TabsTrigger>
            </TabsList>

            {/* ── Overview ── */}
            <TabsContent value="overview">
              {!deanStudentDataUploaded ? (
                <div
                  data-ocid="dean.overview.empty_state"
                  className="flex flex-col items-center gap-4 py-20 text-center text-muted-foreground"
                >
                  <Database className="h-14 w-14 text-muted-foreground/40" />
                  <div>
                    <p className="font-display font-bold text-lg text-foreground">
                      No Student Data Uploaded
                    </p>
                    <p className="text-sm mt-1 max-w-sm">
                      Upload student data to see overview statistics. Go to the{" "}
                      <strong>Data Upload</strong> tab to get started.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Enrollment Overview */}
                  <div>
                    <p className="text-sm font-semibold text-blue-700 mb-3 uppercase tracking-wide">
                      Enrollment Overview
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {[
                        {
                          label: "Total Enrolled",
                          value: enrollmentFileRecordCount,
                          icon: BookOpen,
                          bg: "bg-blue-50",
                          iconColor: "text-blue-400",
                        },
                        {
                          label: "Enrollment Errors",
                          value: enrollmentErrors.length,
                          icon: AlertCircle,
                          bg: "bg-red-50",
                          iconColor: "text-red-400",
                        },
                        {
                          label: "Clean Records",
                          value: Math.max(
                            0,
                            enrollmentFileRecordCount - enrollmentErrors.length,
                          ),
                          icon: CheckCircle2,
                          bg: "bg-green-50",
                          iconColor: "text-green-400",
                        },
                      ].map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                          <Card
                            key={stat.label}
                            data-ocid={`dean.overview.enroll.card.${i + 1}`}
                            className={stat.bg}
                          >
                            <CardContent className="pt-4 pb-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    {stat.label}
                                  </p>
                                  <p className="text-2xl font-display font-bold mt-0.5">
                                    {stat.value}
                                  </p>
                                </div>
                                <Icon
                                  className={`h-8 w-8 ${stat.iconColor} opacity-70`}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  {/* Exam Registration Overview */}
                  <div>
                    <p className="text-sm font-semibold text-purple-700 mb-3 uppercase tracking-wide">
                      Exam Registration Overview
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        {
                          label: "Total Registered",
                          value: examRegFileRecordCount,
                          icon: Users,
                          color: "text-purple-600",
                          bg: "bg-purple-50",
                        },
                        {
                          label: "Done",
                          value: totalDone,
                          icon: CheckCircle2,
                          color: "text-green-600",
                          bg: "bg-green-50",
                        },
                        {
                          label: "Redo Registration",
                          value: totalRedo,
                          icon: AlertCircle,
                          color: "text-amber-600",
                          bg: "bg-amber-50",
                        },
                        {
                          label: "First Time Registration",
                          value: totalDoFirst,
                          icon: Users,
                          color: "text-blue-600",
                          bg: "bg-blue-50",
                        },
                      ].map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                          <Card
                            key={stat.label}
                            data-ocid={`dean.overview.examreg.card.${i + 1}`}
                            className={stat.bg}
                          >
                            <CardContent className="pt-4 pb-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    {stat.label}
                                  </p>
                                  <p className="text-2xl font-display font-bold mt-0.5">
                                    {stat.value}
                                  </p>
                                </div>
                                <Icon
                                  className={`h-8 w-8 ${stat.color} opacity-70`}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  {/* Branch-wise Overview — only when exam reg uploaded */}
                  {deanExamRegDataUploaded && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-display text-base">
                          Branch-wise Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div
                          className="rounded-lg border overflow-x-auto"
                          data-ocid="dean.overview.table"
                        >
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead
                                  rowSpan={2}
                                  className="align-middle border-r"
                                >
                                  Branch
                                </TableHead>
                                <TableHead
                                  colSpan={2}
                                  className="text-center text-blue-700 border-r bg-blue-50/50"
                                >
                                  Enrollment
                                </TableHead>
                                <TableHead
                                  colSpan={5}
                                  className="text-center text-purple-700 bg-purple-50/50"
                                >
                                  Exam Registration
                                </TableHead>
                              </TableRow>
                              <TableRow className="bg-muted/30">
                                <TableHead className="text-blue-600 text-xs">
                                  Total
                                </TableHead>
                                <TableHead className="text-blue-600 text-xs border-r">
                                  Errors
                                </TableHead>
                                <TableHead className="text-purple-600 text-xs">
                                  Total
                                </TableHead>
                                <TableHead className="text-purple-600 text-xs">
                                  Done
                                </TableHead>
                                <TableHead className="text-purple-600 text-xs">
                                  Redo
                                </TableHead>
                                <TableHead className="text-purple-600 text-xs">
                                  Do First
                                </TableHead>
                                <TableHead className="text-purple-600 text-xs">
                                  Errors
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {BRANCHES.map((branch, i) => {
                                const eStats = enrollBranchStats.find(
                                  (b) => b.branch === branch,
                                );
                                const rStats = examRegBranchStats.find(
                                  (b) => b.branch === branch,
                                );
                                return (
                                  <TableRow
                                    key={branch}
                                    data-ocid={`dean.overview.row.${i + 1}`}
                                  >
                                    <TableCell className="border-r">
                                      <Badge variant="outline">{branch}</Badge>
                                    </TableCell>
                                    <TableCell className="font-medium text-blue-700">
                                      {eStats?.total ?? 0}
                                    </TableCell>
                                    <TableCell className="border-r">
                                      {(eStats?.errors ?? 0) > 0 ? (
                                        <Badge
                                          variant="destructive"
                                          className="text-xs"
                                        >
                                          {eStats?.errors}
                                        </Badge>
                                      ) : (
                                        <span className="text-green-600 text-sm">
                                          0
                                        </span>
                                      )}
                                    </TableCell>
                                    <TableCell className="font-medium text-purple-700">
                                      {rStats?.total ?? 0}
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-green-700 font-medium">
                                        {rStats?.done ?? 0}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-amber-600 font-medium">
                                        {rStats?.redo ?? 0}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-red-600 font-medium">
                                        {rStats?.doFirst ?? 0}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      {(rStats?.errors ?? 0) > 0 ? (
                                        <Badge
                                          variant="destructive"
                                          className="text-xs"
                                        >
                                          {rStats?.errors}
                                        </Badge>
                                      ) : (
                                        <span className="text-green-600 text-sm">
                                          0
                                        </span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            {/* ── Data Upload ── */}
            <TabsContent value="data-upload">
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <UploadCard
                    title="NPTEL Enrollment Data"
                    description="Upload NPTEL enrollment CSV/Excel. Multiple uploads supported."
                    icon={Upload}
                    fileNames={enrollmentFileNames}
                    onRemove={handleRemoveEnrollmentFile}
                    inputId="student-data-file"
                    inputRef={studentDataFileRef}
                    onChange={handleStudentDataUpload}
                    isParsing={parsingFile !== null}
                    fileOcid="dean.student_upload.delete_button"
                    dropzoneOcid="dean.student_upload.dropzone"
                    extra={
                      <>
                        {enrollmentFileNames.length > 0 && (
                          <p className="text-xs text-muted-foreground px-1">
                            {enrollmentFileRecordCount} records ·{" "}
                            {enrollmentErrors.length} errors
                          </p>
                        )}
                        {enrollmentFileHeaders.length > 0 && (
                          <div className="p-3 rounded-lg bg-muted/50 border text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">
                              Detected columns ({enrollmentFileHeaders.length}):{" "}
                            </span>
                            {enrollmentFileHeaders.join(" | ")}
                          </div>
                        )}
                        <SnapshotSelector
                          snapshots={enrollLocalSnapshots}
                          selectedIdx={selectedEnrollmentSnapshotIdx}
                          onSelect={setSelectedEnrollmentSnapshotIdx}
                          onRestore={(snap) => {
                            setUploadedStudentRecords(
                              snap.records,
                              snap.records.length,
                            );
                            setEnrollmentErrors(
                              snap.errors as EnrollmentError[],
                            );
                            toast.success(
                              `Restored enrollment data from "${snap.fileName}"`,
                            );
                          }}
                          label="Enrollment"
                        />
                      </>
                    }
                  />

                  <UploadCard
                    title="NPTEL Exam Registration Data"
                    description="Upload exam registration CSV/Excel. Upload in parallel with enrollment."
                    icon={FileText}
                    fileNames={examRegFileNames}
                    onRemove={handleRemoveExamRegFile}
                    inputId="exam-reg-file"
                    inputRef={examRegFileRef}
                    onChange={handleExamRegUpload}
                    fileOcid="dean.exam_upload.delete_button"
                    dropzoneOcid="dean.exam_upload.dropzone"
                    extra={
                      <>
                        {examRegFileNames.length > 0 && (
                          <p className="text-xs text-muted-foreground px-1">
                            {examRegFileRecordCount} records ·{" "}
                            {examRegErrors.length} errors
                          </p>
                        )}
                        <SnapshotSelector
                          snapshots={examRegLocalSnapshots}
                          selectedIdx={selectedExamRegSnapshotIdx}
                          onSelect={setSelectedExamRegSnapshotIdx}
                          onRestore={(snap) => {
                            setUploadedExamRegRecords(
                              snap.records,
                              snap.records.length,
                            );
                            setExamRegErrors(snap.errors as ExamRegError[]);
                            toast.success(
                              `Restored exam reg data from "${snap.fileName}"`,
                            );
                          }}
                          label="Exam Reg"
                        />
                      </>
                    }
                  />

                  <UploadCard
                    title="Exam Shuffle Data"
                    description="Upload the exam shuffle CSV/Excel. Students view details only after this."
                    icon={Shuffle}
                    iconColor="text-indigo-600"
                    fileNames={shuffleFileNames}
                    onRemove={handleRemoveShuffleFile}
                    inputId="shuffle-file"
                    inputRef={shuffleFileRef}
                    onChange={handleShuffleUpload}
                    fileOcid="dean.shuffle_upload.delete_button"
                    dropzoneOcid="dean.shuffle_upload.dropzone"
                    borderColor="border-indigo-300"
                    bgColor="bg-indigo-50/50"
                    hoverBgColor="hover:bg-indigo-50"
                    extra={
                      shuffleFileNames.length > 0 ? (
                        <p className="text-xs text-muted-foreground px-1">
                          {uploadedShuffleRecords.length} shuffle records loaded
                        </p>
                      ) : undefined
                    }
                  />
                </div>
              </div>
            </TabsContent>

            {/* ── Permissions ── */}
            <TabsContent value="permissions">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-base flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    HOD Permissions Management
                  </CardTitle>
                  <CardDescription>
                    Control upload access and edit credits for each department
                    HOD.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4" data-ocid="dean.permissions.table">
                    {BRANCHES.map((branch, i) => {
                      const perm = pendingPerms[branch] ?? {
                        branch,
                        canUpload: false,
                        uploadCredits: 0,
                      };
                      return (
                        <div
                          key={branch}
                          data-ocid={`dean.permissions.row.${i + 1}`}
                          className="rounded-lg border p-4 flex flex-wrap items-center gap-4"
                        >
                          <div className="w-16">
                            <Badge
                              variant="outline"
                              className="font-display font-bold text-sm"
                            >
                              {branch}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`upload-toggle-${branch}`}
                              checked={perm.canUpload}
                              onCheckedChange={(v) =>
                                setPendingPerms((prev) => ({
                                  ...prev,
                                  [branch]: { ...prev[branch], canUpload: v },
                                }))
                              }
                              data-ocid={`dean.permissions.upload_toggle.${i + 1}`}
                            />
                            <Label
                              htmlFor={`upload-toggle-${branch}`}
                              className="text-sm cursor-pointer"
                            >
                              Allow Upload
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground whitespace-nowrap">
                              Upload Credits:
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              max={20}
                              value={perm.uploadCredits}
                              onChange={(e) =>
                                setPendingPerms((prev) => ({
                                  ...prev,
                                  [branch]: {
                                    ...prev[branch],
                                    uploadCredits: Number(e.target.value),
                                  },
                                }))
                              }
                              className="h-8 w-16 text-sm"
                              data-ocid={`dean.permissions.credits.input.${i + 1}`}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-xs gap-1"
                              onClick={() =>
                                setPendingPerms((prev) => ({
                                  ...prev,
                                  [branch]: {
                                    ...prev[branch],
                                    uploadCredits:
                                      (prev[branch]?.uploadCredits ?? 0) + 1,
                                  },
                                }))
                              }
                              data-ocid={`dean.permissions.add_credits.${i + 1}`}
                            >
                              +1 Credit
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => savePerms(branch)}
                            className="gap-1.5 ml-auto"
                            data-ocid={`dean.permissions.save_button.${i + 1}`}
                          >
                            <Save className="h-3.5 w-3.5" />
                            Save
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Courses ── */}
            <TabsContent value="courses">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-base flex items-center gap-2">
                      <Upload className="h-4 w-4 text-primary" />
                      Upload Course File
                    </CardTitle>
                    <CardDescription>
                      Upload master course CSV/Excel for 12-week courses
                      (visible to all HODs and Dean).
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {courseFileName && deanCourseFileUploaded ? (
                      <div
                        data-ocid="dean.course_upload.success_state"
                        className="space-y-2"
                      >
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-green-700">
                              {courseFileName}
                            </p>
                            <p className="text-xs text-green-600">
                              Course file uploaded — {uploadedCourses.length}{" "}
                              12-week courses loaded
                            </p>
                          </div>
                        </div>
                        {courseFileHeaders.length > 0 && (
                          <div className="p-3 rounded-lg bg-muted/50 border text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">
                              Detected columns:{" "}
                            </span>
                            {courseFileHeaders.join(" | ")}
                          </div>
                        )}
                      </div>
                    ) : (
                      <label
                        htmlFor="course-file"
                        data-ocid="dean.course.dropzone"
                        className="flex flex-col items-center gap-3 p-10 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                      >
                        <Upload className="h-10 w-10 text-primary" />
                        <div className="text-center">
                          <p className="font-medium">
                            Click to upload course CSV/Excel
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Master course list for all branches
                          </p>
                        </div>
                      </label>
                    )}
                    <input
                      ref={courseFileRef}
                      id="course-file"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={handleCourseUpload}
                      data-ocid="dean.course.upload_button"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-base">
                      12-Week Courses
                      {deanCourseFileUploaded && (
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          ({filteredCourses.length} total)
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!deanCourseFileUploaded ? (
                      <div
                        data-ocid="dean.courses.empty_state"
                        className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground"
                      >
                        <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                        <p className="font-medium">No Course File Uploaded</p>
                        <p className="text-sm max-w-sm">
                          Upload a course file above to see the 12-week courses.
                        </p>
                      </div>
                    ) : filteredCourses.length === 0 ? (
                      <div
                        data-ocid="dean.courses.empty_state"
                        className="text-center py-10 text-muted-foreground"
                      >
                        <p>No 12-week courses found.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground px-1">
                          Showing {(coursePage - 1) * COURSE_PAGE_SIZE + 1}–
                          {Math.min(
                            coursePage * COURSE_PAGE_SIZE,
                            filteredCourses.length,
                          )}{" "}
                          of{" "}
                          <strong className="text-foreground">
                            {filteredCourses.length}
                          </strong>{" "}
                          courses
                        </p>
                        <div
                          className="rounded-lg border overflow-x-auto"
                          data-ocid="dean.courses.table"
                        >
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead>#</TableHead>
                                <TableHead>Course ID</TableHead>
                                <TableHead>Course Name</TableHead>
                                <TableHead>Duration</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {pagedCourses.map((c, i) => (
                                <TableRow
                                  key={`${c.courseId}-${i}`}
                                  data-ocid={`dean.courses.row.${i + 1}`}
                                >
                                  <TableCell className="text-muted-foreground text-xs">
                                    {(coursePage - 1) * COURSE_PAGE_SIZE +
                                      i +
                                      1}
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {c.courseId}
                                  </TableCell>
                                  <TableCell>{c.courseName}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {c.duration}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        {totalCoursePages > 1 && (
                          <div className="flex items-center justify-between pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCoursePage((p) => Math.max(1, p - 1))
                              }
                              disabled={coursePage === 1}
                              data-ocid="dean.courses.pagination_prev"
                            >
                              Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                              Page {coursePage} of {totalCoursePages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCoursePage((p) =>
                                  Math.min(totalCoursePages, p + 1),
                                )
                              }
                              disabled={coursePage === totalCoursePages}
                              data-ocid="dean.courses.pagination_next"
                            >
                              Next
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── All Errors ── */}
            <TabsContent value="all-errors">
              {noDataUploaded ? (
                <div
                  data-ocid="dean.errors.empty_state"
                  className="flex flex-col items-center gap-4 py-20 text-center text-muted-foreground"
                >
                  <AlertCircle className="h-14 w-14 text-muted-foreground/40" />
                  <div>
                    <p className="font-display font-bold text-lg text-foreground">
                      No Data Uploaded
                    </p>
                    <p className="text-sm mt-1 max-w-sm">
                      Upload student data to see errors.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex flex-wrap items-center gap-3 justify-between">
                        <CardTitle className="font-display text-base flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          All Student Errors
                          <Badge variant="destructive">
                            {filteredAllErrors.length}
                          </Badge>
                        </CardTitle>
                        <ErrorFilterBar
                          branchFilter={errorBranchFilter}
                          onBranchChange={(v) => {
                            setErrorBranchFilter(v);
                            setErrorPage(1);
                          }}
                          typeFilter={errorTypeFilter}
                          onTypeChange={(v) => {
                            setErrorTypeFilter(v);
                            setErrorPage(1);
                          }}
                          errorTypes={uniqueAllErrorTypes}
                          errors={filteredAllErrors}
                          filename={`all-errors-${new Date().toISOString().slice(0, 10)}.xlsx`}
                          branchOcid="dean.errors.branch.select"
                          typeOcid="dean.errors.type.select"
                          downloadOcid="dean.errors.download_button"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ErrorTable
                        errors={pagedAllErrors}
                        page={errorPage}
                        pageSize={PAGE_SIZE}
                        totalPages={totalAllErrorPages}
                        onPrev={() => setErrorPage((p) => Math.max(1, p - 1))}
                        onNext={() =>
                          setErrorPage((p) =>
                            Math.min(totalAllErrorPages, p + 1),
                          )
                        }
                        theme="default"
                        onView={openErrorDialog}
                        ocidPrefix="dean.errors"
                      />
                    </CardContent>
                  </Card>

                  {/* HOD Edited Records */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-display text-base flex items-center gap-2">
                        <PenLine className="h-4 w-4 text-indigo-600" />
                        HOD Edited Records
                        <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 ml-1">
                          {hodEditedRecords.length}
                        </Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Records edited by HODs — visible to both HOD and Dean.
                      </p>
                    </CardHeader>
                    <CardContent>
                      {hodEditedRecords.length === 0 ? (
                        <div
                          data-ocid="dean.hod_edits.empty_state"
                          className="text-center py-10 text-muted-foreground"
                        >
                          <PenLine className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
                          <p>
                            No HOD edits yet. Edits made by HODs will appear
                            here.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs text-muted-foreground px-1">
                            Showing {(hodEditPage - 1) * HOD_EDIT_PAGE_SIZE + 1}
                            –
                            {Math.min(
                              hodEditPage * HOD_EDIT_PAGE_SIZE,
                              hodEditedRecords.length,
                            )}{" "}
                            of{" "}
                            <strong className="text-foreground">
                              {hodEditedRecords.length}
                            </strong>{" "}
                            edits
                          </p>
                          <div
                            className="rounded-lg border overflow-x-auto"
                            data-ocid="dean.hod_edits.table"
                          >
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-indigo-50/60">
                                  {[
                                    "#",
                                    "Branch",
                                    "Student ID",
                                    "Course ID",
                                    "Edited By",
                                    "Edited At",
                                    "Old Value",
                                    "New Value",
                                  ].map((h) => (
                                    <TableHead
                                      key={h}
                                      className="text-indigo-700"
                                    >
                                      {h}
                                    </TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pagedHodEdits.map((rec, i) => (
                                  <TableRow
                                    key={`${rec.id}-${i}`}
                                    data-ocid={`dean.hod_edits.row.${i + 1}`}
                                  >
                                    <TableCell className="text-muted-foreground text-xs">
                                      {(hodEditPage - 1) * HOD_EDIT_PAGE_SIZE +
                                        i +
                                        1}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {rec.branch}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                      {rec.studentId}
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                      {rec.courseId}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {rec.editedBy}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                      {new Date(rec.editedAt).toLocaleString(
                                        "en-IN",
                                      )}
                                    </TableCell>
                                    <TableCell className="text-xs text-red-600 max-w-[120px] truncate">
                                      {Object.entries(rec.oldValues ?? {})
                                        .map(([k, v]) => `${k}: ${v}`)
                                        .join(", ") || "-"}
                                    </TableCell>
                                    <TableCell className="text-xs text-green-700 max-w-[120px] truncate">
                                      {Object.entries(rec.newValues ?? {})
                                        .map(([k, v]) => `${k}: ${v}`)
                                        .join(", ") || "-"}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          {totalHodEditPages > 1 && (
                            <div className="flex items-center justify-between pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setHodEditPage((p) => Math.max(1, p - 1))
                                }
                                disabled={hodEditPage === 1}
                                data-ocid="dean.hod_edits.pagination_prev"
                              >
                                Previous
                              </Button>
                              <span className="text-sm text-muted-foreground">
                                Page {hodEditPage} of {totalHodEditPages}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setHodEditPage((p) =>
                                    Math.min(totalHodEditPages, p + 1),
                                  )
                                }
                                disabled={hodEditPage === totalHodEditPages}
                                data-ocid="dean.hod_edits.pagination_next"
                              >
                                Next
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Cross-match errors */}
                  {crossMatchErrors.length > 0 && (
                    <Card className="border-orange-200">
                      <CardHeader>
                        <CardTitle className="font-display text-base flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          Cross-match Errors (Enrollment vs Exam Registration)
                          <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                            {crossMatchErrors.length}
                          </Badge>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          Students enrolled in 12-week courses without exam
                          registration, or exam registered without enrollment
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-lg border overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                {[
                                  "Student ID",
                                  "Email",
                                  "Course Name",
                                  "Course ID",
                                  "Error Type",
                                  "Description",
                                  "Branch",
                                ].map((h) => (
                                  <TableHead key={h}>{h}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {crossMatchErrors.slice(0, 100).map((err, i) => (
                                <TableRow
                                  key={`cm-${err.studentId}-${err.courseId}-${err.errorType}`}
                                  data-ocid={`dean.crossmatch.row.${i + 1}`}
                                >
                                  <TableCell className="font-mono text-xs">
                                    {err.studentId}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {err.email}
                                  </TableCell>
                                  <TableCell>
                                    <span className="font-semibold text-primary text-xs">
                                      {err.courseName || "-"}
                                    </span>
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">
                                    {err.courseId}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        err.errorType ===
                                        "Missing Exam Registration"
                                          ? "destructive"
                                          : "outline"
                                      }
                                      className="text-xs whitespace-nowrap"
                                    >
                                      {err.errorType}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    {err.details}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {err.branch}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        {crossMatchErrors.length > 100 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Showing first 100 of {crossMatchErrors.length}{" "}
                            cross-match errors.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            {/* ── Enrollment Errors ── */}
            <TabsContent value="enrollment-errors">
              {!deanStudentDataUploaded ? (
                <div
                  data-ocid="dean.enrollment_errors.empty_state"
                  className="flex flex-col items-center gap-4 py-20 text-center text-muted-foreground"
                >
                  <BookOpen className="h-14 w-14 text-muted-foreground/40" />
                  <div>
                    <p className="font-display font-bold text-lg text-foreground">
                      No Enrollment Data Uploaded
                    </p>
                    <p className="text-sm mt-1 max-w-sm">
                      Upload student enrollment data first to see enrollment
                      errors.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex flex-wrap items-center gap-3 justify-between">
                        <CardTitle className="font-display text-base flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                          <span className="text-blue-700">
                            Enrollment Errors
                          </span>
                          <Badge variant="destructive">
                            {filteredEnrollErrors.length}
                          </Badge>
                        </CardTitle>
                        <ErrorFilterBar
                          branchFilter={enrollErrBranchFilter}
                          onBranchChange={(v) => {
                            setEnrollErrBranchFilter(v);
                            setEnrollErrPage(1);
                          }}
                          typeFilter={enrollErrTypeFilter}
                          onTypeChange={(v) => {
                            setEnrollErrTypeFilter(v);
                            setEnrollErrPage(1);
                          }}
                          errorTypes={uniqueEnrollErrTypes}
                          errors={filteredEnrollErrors}
                          filename={`enrollment-errors-${new Date().toISOString().slice(0, 10)}.xlsx`}
                          branchOcid="dean.enrollment_errors.branch.select"
                          typeOcid="dean.enrollment_errors.type.select"
                          downloadOcid="dean.enrollment_errors.download_button"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ErrorTable
                        errors={pagedEnrollErrors}
                        page={enrollErrPage}
                        pageSize={PAGE_SIZE}
                        totalPages={totalEnrollErrPages}
                        onPrev={() =>
                          setEnrollErrPage((p) => Math.max(1, p - 1))
                        }
                        onNext={() =>
                          setEnrollErrPage((p) =>
                            Math.min(totalEnrollErrPages, p + 1),
                          )
                        }
                        theme="blue"
                        onView={openErrorDialog}
                        ocidPrefix="dean.enrollment_errors"
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* ── Exam Reg Errors ── */}
            <TabsContent value="examreg-errors">
              {!deanExamRegDataUploaded ? (
                <div
                  data-ocid="dean.examreg_errors.empty_state"
                  className="flex flex-col items-center gap-4 py-20 text-center text-muted-foreground"
                >
                  <XCircle className="h-14 w-14 text-muted-foreground/40" />
                  <div>
                    <p className="font-display font-bold text-lg text-foreground">
                      No Exam Registration Data Uploaded
                    </p>
                    <p className="text-sm mt-1 max-w-sm">
                      Upload exam registration data to see errors. Go to the{" "}
                      <strong>Data Upload</strong> tab.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex flex-wrap items-center gap-3 justify-between">
                        <CardTitle className="font-display text-base flex items-center gap-2">
                          <ClipboardCheck className="h-4 w-4 text-purple-600" />
                          <span className="text-purple-700">
                            Exam Registration Errors
                          </span>
                          <Badge variant="destructive">
                            {filteredExamRegErrList.length}
                          </Badge>
                        </CardTitle>
                        <ErrorFilterBar
                          branchFilter={examErrBranchFilter}
                          onBranchChange={(v) => {
                            setExamErrBranchFilter(v);
                            setExamErrPage(1);
                          }}
                          typeFilter={examErrTypeFilter}
                          onTypeChange={(v) => {
                            setExamErrTypeFilter(v);
                            setExamErrPage(1);
                          }}
                          errorTypes={uniqueExamErrTypes}
                          errors={filteredExamRegErrList}
                          filename={`examreg-errors-${new Date().toISOString().slice(0, 10)}.xlsx`}
                          branchOcid="dean.examreg_errors.branch.select"
                          typeOcid="dean.examreg_errors.type.select"
                          downloadOcid="dean.examreg_errors.download_button"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ErrorTable
                        errors={pagedExamErrors}
                        page={examErrPage}
                        pageSize={PAGE_SIZE}
                        totalPages={totalExamErrPages}
                        onPrev={() => setExamErrPage((p) => Math.max(1, p - 1))}
                        onNext={() =>
                          setExamErrPage((p) =>
                            Math.min(totalExamErrPages, p + 1),
                          )
                        }
                        theme="purple"
                        showPaymentStatus
                        onView={openErrorDialog}
                        ocidPrefix="dean.examreg_errors"
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* ── Statistics ── */}
            <TabsContent value="statistics">
              {!deanExamRegDataUploaded ? (
                <div
                  data-ocid="dean.statistics.empty_state"
                  className="flex flex-col items-center gap-4 py-20 text-center text-muted-foreground"
                >
                  <BarChart3 className="h-14 w-14 text-muted-foreground/40" />
                  <div>
                    <p className="font-display font-bold text-lg text-foreground">
                      No Exam Registration Data
                    </p>
                    <p className="text-sm mt-1 max-w-sm">
                      Upload the exam registration file to view statistics.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Count cards */}
                  <div
                    className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                    data-ocid="dean.statistics.summary"
                  >
                    {[
                      {
                        label: "Registration Done",
                        value: totalDone,
                        icon: CheckCircle2,
                        bg: "bg-green-50",
                        border: "border-green-200",
                        iconColor: "text-green-600",
                        textColor: "text-green-700",
                        desc: "payment_complete / complete",
                      },
                      {
                        label: "Redo Registration",
                        value: totalRedo,
                        icon: ClipboardCheck,
                        bg: "bg-amber-50",
                        border: "border-amber-200",
                        iconColor: "text-amber-600",
                        textColor: "text-amber-700",
                        desc: "payment_pending / payment_draft",
                      },
                      {
                        label: "Do First Registration",
                        value: totalDoFirst,
                        icon: AlertCircle,
                        bg: "bg-red-50",
                        border: "border-red-200",
                        iconColor: "text-red-500",
                        textColor: "text-red-700",
                        desc: "Not yet registered",
                      },
                      {
                        label: "Total Students",
                        value: examRegFileRecordCount,
                        icon: Users,
                        bg: "bg-blue-50",
                        border: "border-blue-200",
                        iconColor: "text-blue-600",
                        textColor: "text-blue-700",
                        desc: "All exam reg students",
                      },
                    ].map((card, idx) => {
                      const CardIcon = card.icon;
                      return (
                        <Card
                          key={card.label}
                          data-ocid={`dean.statistics.card.${idx + 1}`}
                          className={`border ${card.border} ${card.bg}`}
                        >
                          <CardContent className="pt-5 pb-4">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p
                                  className={`text-xs font-medium ${card.textColor}`}
                                >
                                  {card.label}
                                </p>
                                <p
                                  className={`text-3xl font-display font-bold mt-1 ${card.textColor}`}
                                >
                                  {card.value}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {card.desc}
                                </p>
                              </div>
                              <CardIcon
                                className={`h-8 w-8 ${card.iconColor} opacity-70 shrink-0`}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Branch-wise bar chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-display text-base">
                        Branch-wise Exam Registration Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div
                        data-ocid="dean.statistics.chart"
                        style={{ height: 360 }}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={examRegBranchStats}
                            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="branch" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar
                              dataKey="done"
                              name="Done"
                              fill="#4f46e5"
                              radius={[3, 3, 0, 0]}
                            />
                            <Bar
                              dataKey="redo"
                              name="Redo Registration"
                              fill="#f59e0b"
                              radius={[3, 3, 0, 0]}
                            />
                            <Bar
                              dataKey="doFirst"
                              name="Do First Registration"
                              fill="#ef4444"
                              radius={[3, 3, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-display text-base">
                          Overall Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div
                          data-ocid="dean.statistics.pie"
                          style={{ height: 300 }}
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={4}
                                dataKey="value"
                                label={({ name, percent }) =>
                                  `${name} ${(percent * 100).toFixed(0)}%`
                                }
                              >
                                {pieData.map((entry, index) => (
                                  <Cell
                                    key={entry.name}
                                    fill={PIE_COLORS[index]}
                                  />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="font-display text-base">
                          Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[
                            {
                              label: "Total Done",
                              value: totalDone,
                              color: "bg-indigo-500",
                            },
                            {
                              label: "Redo Registration",
                              value: totalRedo,
                              color: "bg-amber-500",
                            },
                            {
                              label: "Do First Registration",
                              value: totalDoFirst,
                              color: "bg-red-500",
                            },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3"
                            >
                              <div
                                className={`w-3 h-3 rounded-full ${item.color}`}
                              />
                              <span className="text-sm flex-1">
                                {item.label}
                              </span>
                              <span className="font-display font-bold text-lg">
                                {item.value}
                              </span>
                            </div>
                          ))}
                          <div className="border-t pt-3 flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Grand Total
                            </span>
                            <span className="font-display font-bold text-xl">
                              {examRegFileRecordCount}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Branch-wise stats table */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-display text-base">
                        Branch-wise Detailed Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div
                        className="rounded-lg border overflow-x-auto"
                        data-ocid="dean.statistics.table"
                      >
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead
                                rowSpan={2}
                                className="align-middle border-r"
                              >
                                Branch
                              </TableHead>
                              <TableHead
                                colSpan={2}
                                className="text-center text-blue-700 bg-blue-50/50 border-r"
                              >
                                Enrollment
                              </TableHead>
                              <TableHead
                                colSpan={5}
                                className="text-center text-purple-700 bg-purple-50/50"
                              >
                                Exam Registration
                              </TableHead>
                            </TableRow>
                            <TableRow className="bg-muted/30">
                              <TableHead className="text-blue-600 text-xs">
                                Total
                              </TableHead>
                              <TableHead className="text-blue-600 text-xs border-r">
                                Errors
                              </TableHead>
                              <TableHead className="text-purple-600 text-xs">
                                Total
                              </TableHead>
                              <TableHead className="text-green-600 text-xs">
                                Done
                              </TableHead>
                              <TableHead className="text-amber-600 text-xs">
                                Redo
                              </TableHead>
                              <TableHead className="text-red-600 text-xs">
                                Do First
                              </TableHead>
                              <TableHead className="text-purple-600 text-xs">
                                Errors
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {BRANCHES.map((branch, i) => {
                              const eStats = enrollBranchStats.find(
                                (b) => b.branch === branch,
                              );
                              const rStats = examRegBranchStats.find(
                                (b) => b.branch === branch,
                              );
                              return (
                                <TableRow
                                  key={branch}
                                  data-ocid={`dean.statistics.row.${i + 1}`}
                                >
                                  <TableCell className="border-r">
                                    <Badge variant="outline">{branch}</Badge>
                                  </TableCell>
                                  <TableCell className="font-medium text-blue-700">
                                    {eStats?.total ?? 0}
                                  </TableCell>
                                  <TableCell className="border-r">
                                    {(eStats?.errors ?? 0) > 0 ? (
                                      <Badge
                                        variant="destructive"
                                        className="text-xs"
                                      >
                                        {eStats?.errors}
                                      </Badge>
                                    ) : (
                                      <span className="text-green-600 text-sm">
                                        0
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="font-medium text-purple-700">
                                    {rStats?.total ?? 0}
                                  </TableCell>
                                  <TableCell className="font-medium text-green-700">
                                    {rStats?.done ?? 0}
                                  </TableCell>
                                  <TableCell className="font-medium text-amber-600">
                                    {rStats?.redo ?? 0}
                                  </TableCell>
                                  <TableCell className="font-medium text-red-600">
                                    {rStats?.doFirst ?? 0}
                                  </TableCell>
                                  <TableCell>
                                    {(rStats?.errors ?? 0) > 0 ? (
                                      <Badge
                                        variant="destructive"
                                        className="text-xs"
                                      >
                                        {rStats?.errors}
                                      </Badge>
                                    ) : (
                                      <span className="text-green-600 text-sm">
                                        0
                                      </span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            <TableRow className="bg-muted/30 border-t-2 font-bold">
                              <TableCell className="border-r font-display font-bold">
                                Total
                              </TableCell>
                              <TableCell className="font-bold text-blue-700">
                                {enrollmentFileRecordCount}
                              </TableCell>
                              <TableCell className="border-r font-bold text-red-600">
                                {enrollmentErrors.length}
                              </TableCell>
                              <TableCell className="font-bold text-purple-700">
                                {examRegFileRecordCount}
                              </TableCell>
                              <TableCell className="font-bold text-green-700">
                                {totalDone}
                              </TableCell>
                              <TableCell className="font-bold text-amber-600">
                                {totalRedo}
                              </TableCell>
                              <TableCell className="font-bold text-red-600">
                                {totalDoFirst}
                              </TableCell>
                              <TableCell className="font-bold text-red-600">
                                {examRegErrors.length}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Done Registrations Detail */}
                  <Card>
                    <CardHeader>
                      <div className="flex flex-wrap items-center gap-3 justify-between">
                        <CardTitle className="font-display text-base flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Done Registrations
                          <Badge className="bg-green-100 text-green-800 border-green-200 ml-1">
                            {doneRegistrations.length}
                          </Badge>
                        </CardTitle>
                        <Select
                          value={doneBranchFilter}
                          onValueChange={(v) => {
                            setDoneBranchFilter(v);
                            setDonePage(1);
                          }}
                        >
                          <SelectTrigger
                            className="w-32 h-8"
                            data-ocid="dean.statistics.done.branch.select"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">All Branches</SelectItem>
                            {BRANCHES.map((b) => (
                              <SelectItem key={b} value={b}>
                                {b}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Students with payment_complete / complete status —
                        registration confirmed.
                      </p>
                    </CardHeader>
                    <CardContent>
                      {filteredDoneRegs.length === 0 ? (
                        <div
                          data-ocid="dean.statistics.done.empty_state"
                          className="text-center py-10 text-muted-foreground"
                        >
                          <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
                          <p>No done registrations found yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs text-muted-foreground px-1">
                            Showing {(donePage - 1) * DONE_PAGE_SIZE + 1}–
                            {Math.min(
                              donePage * DONE_PAGE_SIZE,
                              filteredDoneRegs.length,
                            )}{" "}
                            of{" "}
                            <strong className="text-foreground">
                              {filteredDoneRegs.length}
                            </strong>{" "}
                            done registrations
                          </p>
                          <div
                            className="rounded-lg border overflow-x-auto"
                            data-ocid="dean.statistics.done.table"
                          >
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-green-50">
                                  {[
                                    "#",
                                    "Roll No",
                                    "Email",
                                    "Course ID",
                                    "Branch",
                                    "Payment Status",
                                  ].map((h) => (
                                    <TableHead
                                      key={h}
                                      className="text-green-700"
                                    >
                                      {h}
                                    </TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pagedDoneRegs.map((r, i) => (
                                  <TableRow
                                    key={`done-${r.studentId}-${i}`}
                                    data-ocid={`dean.statistics.done.row.${i + 1}`}
                                  >
                                    <TableCell className="text-muted-foreground text-xs">
                                      {(donePage - 1) * DONE_PAGE_SIZE + i + 1}
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                      {r.studentId}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {r.email || "-"}
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                      {r.courseId}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {r.branch}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                        {r.paymentStatus}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          {totalDonePages > 1 && (
                            <div className="flex items-center justify-between pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setDonePage((p) => Math.max(1, p - 1))
                                }
                                disabled={donePage === 1}
                                data-ocid="dean.statistics.done.pagination_prev"
                              >
                                Previous
                              </Button>
                              <span className="text-sm text-muted-foreground">
                                Page {donePage} of {totalDonePages}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setDonePage((p) =>
                                    Math.min(totalDonePages, p + 1),
                                  )
                                }
                                disabled={donePage === totalDonePages}
                                data-ocid="dean.statistics.done.pagination_next"
                              >
                                Next
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Error details dialog */}
      {viewErrorDialog && (
        <Dialog open={true} onOpenChange={() => setViewErrorDialog(null)}>
          <DialogContent
            className="max-w-md"
            data-ocid="dean.view_error.dialog"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Eye className="h-4 w-4" />
                Error Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              {viewErrorDialog.courseName && (
                <div>
                  <span className="font-semibold text-foreground">
                    Course Name:{" "}
                  </span>
                  <span className="font-bold text-blue-700">
                    {viewErrorDialog.courseName}
                  </span>
                </div>
              )}
              {viewErrorDialog.courseId && (
                <div>
                  <span className="font-semibold text-foreground">
                    Course ID:{" "}
                  </span>
                  <span className="font-mono">{viewErrorDialog.courseId}</span>
                </div>
              )}
              {viewErrorDialog.errorType && (
                <div>
                  <span className="font-semibold text-foreground">
                    Error Type:{" "}
                  </span>
                  <Badge variant="destructive" className="text-xs">
                    {viewErrorDialog.errorType}
                  </Badge>
                </div>
              )}
              <div>
                <span className="font-semibold text-foreground">
                  Description:{" "}
                </span>
                <span className="text-muted-foreground">
                  {viewErrorDialog.description}
                </span>
              </div>
              {viewErrorDialog.studentId && (
                <div>
                  <span className="font-semibold text-foreground">
                    Roll No:{" "}
                  </span>
                  <span className="font-mono">{viewErrorDialog.studentId}</span>
                </div>
              )}
              {viewErrorDialog.email && (
                <div>
                  <span className="font-semibold text-foreground">Email: </span>
                  <span>{viewErrorDialog.email}</span>
                </div>
              )}
              {viewErrorDialog.branch && (
                <div>
                  <span className="font-semibold text-foreground">
                    Branch:{" "}
                  </span>
                  <Badge variant="secondary">{viewErrorDialog.branch}</Badge>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
