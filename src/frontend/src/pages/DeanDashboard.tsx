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
import { useRef, useState } from "react";
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
} from "../data/mockData";
import {
  type CrossMatchError,
  crossMatchEnrollmentExamReg,
  getFileHeaders,
  loadXLSXLib,
  parseCourseRows,
  parseExamRegRecords,
  parseExamShuffleRows,
  parseUploadedFile,
  validateEnrollmentRows,
  validateExamRegRows,
} from "../utils/fileParser";

const PIE_COLORS = ["#4f46e5", "#f59e0b", "#ef4444"];

async function downloadErrorsAsExcel<
  T extends {
    studentId: string;
    email: string;
    courseId: string;
    courseName?: string;
    errorType: string;
    details?: string;
  },
>(errors: T[], filename: string) {
  const XLSX = await loadXLSXLib();
  const rows = errors.map((e) => ({
    "Student ID": e.studentId,
    Email: e.email,
    "Course ID": e.courseId,
    "Course Name": e.courseName || "",
    "Error Type": e.errorType,
    Description: e.details || "",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Errors");
  XLSX.writeFile(wb, filename);
}

function classifyPaymentStatus(status?: string): "done" | "redo" | "doFirst" {
  if (!status) return "doFirst";
  // Normalize underscores to spaces so "payment_failed" matches "payment failed"
  const s = status.toLowerCase().replace(/_/g, " ").trim();
  if (
    s === "payment failed" ||
    s === "failed" ||
    s === "payment complete" ||
    s === "complete"
  )
    return "done";
  if (
    s === "payment pending" ||
    s === "pending" ||
    s === "payment draft" ||
    s === "draft"
  )
    return "redo";
  return "doFirst";
}

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
    deanShuffleDataUploaded: _deanShuffleDataUploaded,
    setDeanShuffleDataUploaded,
    uploadedShuffleRecords,
    setUploadedShuffleRecords,
    hodEditedRecords,
    logout,
  } = useAppContext();

  // ── local perm edit state per branch ──
  const [viewErrorDeanDialog, setViewErrorDeanDialog] = useState<{
    details: string;
    courseName?: string;
    courseId?: string;
    errorType?: string;
    studentId?: string;
  } | null>(null);
  const [pendingPerms, setPendingPerms] = useState<
    Record<Branch, HodPermission>
  >(
    JSON.parse(JSON.stringify(hodPermissions)) as Record<Branch, HodPermission>,
  );

  // ── Upload state ──
  const courseFileRef = useRef<HTMLInputElement>(null);
  const studentDataFileRef = useRef<HTMLInputElement>(null);
  const examRegFileRef = useRef<HTMLInputElement>(null);
  const shuffleFileRef = useRef<HTMLInputElement>(null);
  const [courseFileName, setCourseFileName] = useState<string | null>(null);
  // Multiple file support for enrollment and exam reg
  const [enrollmentFileNames, setEnrollmentFileNames] = useState<string[]>([]);
  const [examRegFileNames, setExamRegFileNames] = useState<string[]>([]);
  const [shuffleFileNames, setShuffleFileNames] = useState<string[]>([]);

  // ── Detected headers (for debug display) ──
  const [courseFileHeaders, setCourseFileHeaders] = useState<string[]>([]);
  const [enrollmentFileHeaders, setEnrollmentFileHeaders] = useState<string[]>(
    [],
  );
  const [_examRegFileHeaders, setExamRegFileHeaders] = useState<string[]>([]);

  // ── Filter state ──
  const [courseBranchFilter, setCourseBranchFilter] = useState<string>("All");
  const [errorBranchFilter, setErrorBranchFilter] = useState<string>("All");
  const [errorTypeFilter, setErrorTypeFilter] = useState<string>("All");

  // ── Enrollment errors tab filters ──
  const [enrollErrBranchFilter, setEnrollErrBranchFilter] =
    useState<string>("All");
  const [enrollErrTypeFilter, setEnrollErrTypeFilter] = useState<string>("All");
  const [enrollErrPage, setEnrollErrPage] = useState(1);

  // ── Exam reg errors tab filters ──
  const [examErrBranchFilter, setExamErrBranchFilter] = useState<string>("All");
  const [examErrTypeFilter, setExamErrTypeFilter] = useState<string>("All");
  const [examErrPage, setExamErrPage] = useState(1);

  const ERRORS_PAGE_SIZE = 100;

  // ── Error table pagination ──
  const ERROR_PAGE_SIZE = 100;
  const [errorPage, setErrorPage] = useState(1);

  // ── Course table pagination ──
  const COURSE_PAGE_SIZE = 50;
  const [coursePage, setCoursePage] = useState(1);

  // ── Enrollment/Exam Reg record counts (tracked separately) ──
  const [enrollmentRecordCount, setEnrollmentRecordCount] = useState(0);
  const [enrollBranchCounts, setEnrollBranchCounts] = useState<
    Record<string, number>
  >({});
  const [_examRegRecordCount, setExamRegRecordCount] = useState(0);
  // ── Cross-match errors ──
  const [crossMatchErrors, setCrossMatchErrors] = useState<CrossMatchError[]>(
    [],
  );
  // ── Snapshot selection (for viewing previous file data) ──
  const [selectedEnrollmentSnapshotIdx, setSelectedEnrollmentSnapshotIdx] =
    useState<number | null>(null);
  const [selectedExamRegSnapshotIdx, setSelectedExamRegSnapshotIdx] = useState<
    number | null
  >(null);
  // ── Refresh state ──
  const [_refreshKey, setRefreshKey] = useState(0);
  function handleRefresh() {
    setRefreshKey((k) => k + 1);
    toast.success("Dashboard data refreshed.");
  }

  function handleLogout() {
    logout();
    navigate({ to: "/" });
  }

  function savePerms(branch: Branch) {
    updateHodPermission(branch, pendingPerms[branch]);
    toast.success(`Permissions saved for ${branch} HOD.`);
  }

  async function handleCourseUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCourseFileName(file.name);
    try {
      toast.info(`Parsing course file "${file.name}"...`);
      const rows = await parseUploadedFile(file);
      const headers = getFileHeaders(rows);
      setCourseFileHeaders(headers);
      console.log("[Course File] Detected headers:", headers);
      console.log("[Course File] Sample row:", rows[0]);
      const courses = parseCourseRows(rows);
      setUploadedCourses(courses);
      setDeanCourseFileUploaded(true);
      toast.success(
        `Course file "${file.name}" uploaded. ${courses.length} 12-week courses loaded from ${rows.length} total rows.`,
      );
      if (courses.length === 0 && rows.length > 0) {
        toast.warning(
          `No 12-week courses found. Detected columns: ${headers.join(", ")}. Check that your file has a Duration/Weeks column with value "12".`,
          { duration: 8000 },
        );
      }
    } catch (err) {
      toast.error(
        `Failed to parse course file: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async function handleStudentDataUpload(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset the input so same file can be re-uploaded
    e.target.value = "";
    try {
      toast.info(
        `Parsing student data file "${file.name}"... This may take a moment for large files.`,
      );
      const rows = await parseUploadedFile(file);
      const headers = getFileHeaders(rows);
      setEnrollmentFileHeaders(headers);
      console.log("[Enrollment File] Detected headers:", headers);
      console.log("[Enrollment File] Sample row:", rows[0]);
      const uploadedCourseIds = uploadedCourses.map((c) => c.courseId);
      const { records, errors } = validateEnrollmentRows(
        rows,
        collegeName,
        uploadedCourseIds,
        uploadedCourses,
      );
      setUploadedStudentRecords(records);
      setEnrollmentErrors(errors);
      setDeanStudentDataUploaded(true);
      setEnrollmentFileNames((prev) => [...prev, file.name]);
      setEnrollmentRecordCount(records.length);
      // Build per-branch enrollment counts from this file only
      const branchCountMap: Record<string, number> = {};
      for (const r of records) {
        if (r.profession?.toLowerCase() === "faculty") continue;
        branchCountMap[r.branch] = (branchCountMap[r.branch] ?? 0) + 1;
      }
      setEnrollBranchCounts(branchCountMap);
      // Save snapshot for versioning
      addEnrollmentSnapshot({
        fileName: file.name,
        records,
        errors,
        timestamp: Date.now(),
      });
      setSelectedEnrollmentSnapshotIdx(null); // show latest
      toast.success(
        `Student data "${file.name}" parsed: ${records.length} student records, ${errors.length} errors found.`,
      );
      if (errors.length === 0 && records.length > 0) {
        toast.info(
          `All ${records.length} records passed validation. Detected columns: ${headers.slice(0, 6).join(", ")}${headers.length > 6 ? "..." : ""}`,
          { duration: 6000 },
        );
      }
    } catch (err) {
      toast.error(
        `Failed to parse student file: ${err instanceof Error ? err.message : String(err)}`,
      );
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
    // Reset the input so same file can be re-uploaded
    e.target.value = "";
    try {
      toast.info(`Parsing exam registration file "${file.name}"...`);
      const rows = await parseUploadedFile(file);
      const headers = getFileHeaders(rows);
      setExamRegFileHeaders(headers);
      console.log("[Exam Reg File] Detected headers:", headers);
      console.log("[Exam Reg File] Sample row:", rows[0]);
      const enrollmentIds = uploadedStudentRecords.map((r) => r.studentId);
      const courseIdsForValidation = uploadedCourses.map((c) => c.courseId);
      const examErrors = validateExamRegRows(
        rows,
        enrollmentIds,
        courseIdsForValidation,
        collegeName,
      );
      const examRecords = parseExamRegRecords(rows);
      // Merge exam records into uploaded student records for statistics
      const examMap = new Map(examRecords.map((r) => [r.studentId, r]));
      const mergedRecords = uploadedStudentRecords
        .map((r) => {
          const er = examMap.get(r.studentId);
          return er
            ? {
                ...r,
                paymentStatus: er.paymentStatus,
                examCourseId: er.examCourseId,
              }
            : r;
        })
        .concat(
          examRecords.filter(
            (er) =>
              !uploadedStudentRecords.some((r) => r.studentId === er.studentId),
          ),
        );
      setUploadedStudentRecords(mergedRecords);
      setExamRegErrors(examErrors);
      setDeanExamRegDataUploaded(true);
      setExamRegFileNames((prev) => [...prev, file.name]);
      setExamRegRecordCount(examRecords.length);
      // Save snapshot for versioning
      addExamRegSnapshot({
        fileName: file.name,
        records: examRecords,
        errors: examErrors,
        timestamp: Date.now(),
      });
      setSelectedExamRegSnapshotIdx(null); // show latest
      // Run cross-match if both files uploaded
      const crossErrors = crossMatchEnrollmentExamReg(
        uploadedStudentRecords,
        examRecords,
        uploadedCourses,
      );
      setCrossMatchErrors(crossErrors);
      toast.success(
        `Exam registration "${file.name}" parsed: ${examErrors.length} errors found.`,
      );
    } catch (err) {
      toast.error(
        `Failed to parse exam registration file: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  function handleRemoveExamRegFile(fileName: string) {
    const newList = examRegFileNames.filter((n) => n !== fileName);
    setExamRegFileNames(newList);
    if (newList.length === 0) {
      setDeanExamRegDataUploaded(false);
      setExamRegErrors([]);
      // Remove exam reg data from merged records
      const cleanedRecords = uploadedStudentRecords.map((r) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { paymentStatus: _p, examCourseId: _e, ...rest } = r;
        return rest;
      });
      setUploadedStudentRecords(cleanedRecords);
    }
  }

  async function handleShuffleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      toast.info(`Parsing exam shuffle file "${file.name}"...`);
      const rows = await parseUploadedFile(file);
      const shuffleRecs = parseExamShuffleRows(rows);
      // Merge with existing shuffle records (replace by studentId+courseId key)
      const existingMap = new Map(
        uploadedShuffleRecords.map((r) => [`${r.studentId}::${r.courseId}`, r]),
      );
      for (const rec of shuffleRecs) {
        existingMap.set(`${rec.studentId}::${rec.courseId}`, rec);
      }
      const merged = Array.from(existingMap.values());
      setUploadedShuffleRecords(merged);
      setDeanShuffleDataUploaded(true);
      setShuffleFileNames((prev) => [...prev, file.name]);
      toast.success(
        `Exam shuffle file "${file.name}" uploaded. ${shuffleRecs.length} student shuffle records loaded.`,
      );
    } catch (err) {
      toast.error(
        `Failed to parse shuffle file: ${err instanceof Error ? err.message : String(err)}`,
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

  // ── Enrollment branch stats (all uploaded student records = enrollment data) ──

  const enrollBranchStats = BRANCHES.map((b) => ({
    branch: b,
    total: enrollBranchCounts[b] ?? 0,
  }));

  // ── Exam reg branch stats (records that have paymentStatus = have exam reg data) ──
  const examRegBranchStatsMap = new Map<
    Branch,
    { done: number; redo: number; doFirst: number }
  >();
  for (const b of BRANCHES) {
    examRegBranchStatsMap.set(b, { done: 0, redo: 0, doFirst: 0 });
  }
  for (const r of uploadedStudentRecords.filter(
    (record) =>
      record.profession?.toLowerCase() !== "faculty" &&
      record.paymentStatus !== undefined &&
      record.paymentStatus !== null &&
      record.paymentStatus !== "",
  )) {
    const stats = examRegBranchStatsMap.get(r.branch);
    if (!stats) continue;
    const cls = classifyPaymentStatus(r.paymentStatus);
    stats[cls]++;
  }
  const dynamicBranchStats = BRANCHES.map((b) => ({
    branch: b,
    ...(examRegBranchStatsMap.get(b) ?? { done: 0, redo: 0, doFirst: 0 }),
  }));

  const _totalEnrollStudents = uploadedStudentRecords.filter(
    (r) => r.profession?.toLowerCase() !== "faculty",
  ).length;
  const totalStudents = uploadedStudentRecords.filter(
    (r) =>
      r.profession?.toLowerCase() !== "faculty" &&
      r.paymentStatus !== undefined &&
      r.paymentStatus !== null &&
      r.paymentStatus !== "",
  ).length;
  // enrollmentErrors.length + examRegErrors.length tracked separately
  const _branchesWithData = new Set(
    uploadedStudentRecords
      .filter((r) => r.profession?.toLowerCase() !== "faculty")
      .map((r) => r.branch),
  ).size;

  const totalDone = dynamicBranchStats.reduce((a, b) => a + b.done, 0);
  const totalRedo = dynamicBranchStats.reduce((a, b) => a + b.redo, 0);
  const totalDoFirst = dynamicBranchStats.reduce((a, b) => a + b.doFirst, 0);
  const pieData = [
    { name: "Done", value: totalDone },
    { name: "Redo Registration", value: totalRedo },
    { name: "Do First Registration", value: totalDoFirst },
  ];

  // ── Courses: use uploadedCourses if available, else empty ──
  const displayCourses = deanCourseFileUploaded ? uploadedCourses : [];
  const filteredCourses =
    courseBranchFilter === "All"
      ? displayCourses
      : displayCourses.filter((c) => c.branch === courseBranchFilter);

  // ── Combined errors ──
  const allErrors = [
    ...enrollmentErrors.map((e) => ({
      ...e,
      type: "Enrollment",
      paymentStatus: "-",
      classification: "-",
    })),
    ...examRegErrors.map((e) => ({
      ...e,
      type: "Exam Reg",
      details: e.details ?? "-",
    })),
  ];
  const filteredErrors = allErrors.filter((e) => {
    const branchMatch =
      errorBranchFilter === "All" || e.branch === errorBranchFilter;
    const typeMatch =
      errorTypeFilter === "All" || e.errorType === errorTypeFilter;
    return branchMatch && typeMatch;
  });

  const uniqueErrorTypes = Array.from(
    new Set(allErrors.map((e) => e.errorType)),
  );

  // Paginated slice for display
  const totalErrorPages = Math.ceil(filteredErrors.length / ERROR_PAGE_SIZE);
  const pagedErrors = filteredErrors.slice(
    (errorPage - 1) * ERROR_PAGE_SIZE,
    errorPage * ERROR_PAGE_SIZE,
  );

  // ── Enrollment errors (separate tab) ──
  const filteredEnrollErrors = enrollmentErrors.filter((e) => {
    const branchMatch =
      enrollErrBranchFilter === "All" || e.branch === enrollErrBranchFilter;
    const typeMatch =
      enrollErrTypeFilter === "All" || e.errorType === enrollErrTypeFilter;
    return branchMatch && typeMatch;
  });
  const uniqueEnrollErrTypes = Array.from(
    new Set(enrollmentErrors.map((e) => e.errorType)),
  );
  const totalEnrollErrPages = Math.ceil(
    filteredEnrollErrors.length / ERRORS_PAGE_SIZE,
  );
  const pagedEnrollErrors = filteredEnrollErrors.slice(
    (enrollErrPage - 1) * ERRORS_PAGE_SIZE,
    enrollErrPage * ERRORS_PAGE_SIZE,
  );

  // ── Exam reg errors (separate tab) ──
  const filteredExamRegErrList = examRegErrors.filter((e) => {
    const branchMatch =
      examErrBranchFilter === "All" || e.branch === examErrBranchFilter;
    const typeMatch =
      examErrTypeFilter === "All" || e.errorType === examErrTypeFilter;
    return branchMatch && typeMatch;
  });
  const uniqueExamErrTypes = Array.from(
    new Set(examRegErrors.map((e) => e.errorType)),
  );
  const totalExamErrPages = Math.ceil(
    filteredExamRegErrList.length / ERRORS_PAGE_SIZE,
  );
  const pagedExamErrors = filteredExamRegErrList.slice(
    (examErrPage - 1) * ERRORS_PAGE_SIZE,
    examErrPage * ERRORS_PAGE_SIZE,
  );

  const noDataUploaded = !deanStudentDataUploaded && !deanExamRegDataUploaded;

  // ── Done registrations (for the detail table) ──
  const doneRegistrations = uploadedStudentRecords.filter((r) => {
    if (r.profession?.toLowerCase() === "faculty") return false;
    return classifyPaymentStatus(r.paymentStatus) === "done";
  });

  // ── HOD edited records pagination ──
  const [hodEditPage, setHodEditPage] = useState(1);
  const HOD_EDIT_PAGE_SIZE = 50;
  const pagedHodEdits = hodEditedRecords.slice(
    (hodEditPage - 1) * HOD_EDIT_PAGE_SIZE,
    hodEditPage * HOD_EDIT_PAGE_SIZE,
  );
  const totalHodEditPages = Math.ceil(
    hodEditedRecords.length / HOD_EDIT_PAGE_SIZE,
  );

  // Done registrations pagination
  const [donePage, setDonePage] = useState(1);
  const DONE_PAGE_SIZE = 100;
  const pagedDoneRegs = doneRegistrations.slice(
    (donePage - 1) * DONE_PAGE_SIZE,
    donePage * DONE_PAGE_SIZE,
  );
  const totalDonePages = Math.ceil(doneRegistrations.length / DONE_PAGE_SIZE);

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
                value="statistics"
                data-ocid="dean.statistics.tab"
                className="gap-1.5"
              >
                <BarChart3 className="h-4 w-4" /> Statistics
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
                <>
                  {/* Enrollment Overview */}
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                      Enrollment Overview
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <Card className="bg-blue-50">
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Total Enrolled
                              </p>
                              <p className="text-2xl font-display font-bold mt-0.5">
                                {enrollmentRecordCount}
                              </p>
                            </div>
                            <BookOpen className="h-8 w-8 text-blue-400 opacity-70" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-red-50">
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Enrollment Errors
                              </p>
                              <p className="text-2xl font-display font-bold mt-0.5">
                                {enrollmentErrors.length}
                              </p>
                            </div>
                            <AlertCircle className="h-8 w-8 text-red-400 opacity-70" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-slate-50">
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Clean Records
                              </p>
                              <p className="text-2xl font-display font-bold mt-0.5">
                                {Math.max(
                                  0,
                                  enrollmentRecordCount -
                                    enrollmentErrors.length,
                                )}
                              </p>
                            </div>
                            <CheckCircle2 className="h-8 w-8 text-green-400 opacity-70" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Exam Registration Overview */}
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                      Exam Registration Overview
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        {
                          label: "Total Registered",
                          value: totalStudents,
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
                            data-ocid={`dean.overview.card.${i + 1}`}
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

                  {/* Per-branch summary */}
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
                              const enrollStats = enrollBranchStats.find(
                                (b) => b.branch === branch,
                              );
                              const examStats = dynamicBranchStats.find(
                                (b) => b.branch === branch,
                              );
                              const eErr = enrollmentErrors.filter(
                                (e) => e.branch === branch,
                              ).length;
                              const rErr = examRegErrors.filter(
                                (e) => e.branch === branch,
                              ).length;
                              const examTotal =
                                (examStats?.done ?? 0) +
                                (examStats?.redo ?? 0) +
                                (examStats?.doFirst ?? 0);
                              return (
                                <TableRow
                                  key={branch}
                                  data-ocid={`dean.overview.row.${i + 1}`}
                                >
                                  <TableCell className="border-r">
                                    <Badge variant="outline">{branch}</Badge>
                                  </TableCell>
                                  <TableCell className="font-medium text-blue-700">
                                    {enrollStats?.total ?? 0}
                                  </TableCell>
                                  <TableCell className="border-r">
                                    {eErr > 0 ? (
                                      <Badge
                                        variant="destructive"
                                        className="text-xs"
                                      >
                                        {eErr}
                                      </Badge>
                                    ) : (
                                      <span className="text-green-600 text-sm">
                                        0
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="font-medium text-purple-700">
                                    {examTotal}
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-green-700 font-medium">
                                      {examStats?.done ?? 0}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-amber-600 font-medium">
                                      {examStats?.redo ?? 0}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-red-600 font-medium">
                                      {examStats?.doFirst ?? 0}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {rErr > 0 ? (
                                      <Badge
                                        variant="destructive"
                                        className="text-xs"
                                      >
                                        {rErr}
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
                </>
              )}
            </TabsContent>

            {/* ── Data Upload ── */}
            <TabsContent value="data-upload">
              <div className="space-y-6">
                {/* Refresh button */}
                {(deanStudentDataUploaded || deanExamRegDataUploaded) && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      className="gap-2"
                      data-ocid="dean.data_upload.refresh.button"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh / Update Data
                    </Button>
                  </div>
                )}
                {/* NPTEL Enrollment Data */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-base flex items-center gap-2">
                      <Upload className="h-4 w-4 text-primary" />
                      NPTEL Enrollment Data
                    </CardTitle>
                    <CardDescription>
                      Upload NPTEL enrollment CSV/Excel files. Multiple uploads
                      supported — each upload appends records.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      data-ocid="dean.student_upload.success_state"
                      className="space-y-3"
                    >
                      {/* Uploaded file list */}
                      {enrollmentFileNames.length > 0 && (
                        <div className="space-y-2">
                          {enrollmentFileNames.map((fname) => (
                            <div
                              key={fname}
                              className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200"
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                              <p className="text-sm font-medium text-green-700 flex-1 truncate">
                                {fname}
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleRemoveEnrollmentFile(fname)
                                }
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                data-ocid="dean.student_upload.delete_button"
                                title="Remove this file"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                          <p className="text-xs text-muted-foreground px-1">
                            {
                              uploadedStudentRecords.filter(
                                (r) =>
                                  r.profession?.toLowerCase() !== "faculty",
                              ).length
                            }{" "}
                            student records loaded · {enrollmentErrors.length}{" "}
                            errors found
                          </p>
                        </div>
                      )}
                      {/* Upload dropzone — always visible */}
                      <label
                        htmlFor="student-data-file"
                        data-ocid="dean.student_upload.dropzone"
                        className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                      >
                        <PlusCircle className="h-6 w-6 text-primary shrink-0" />
                        <div>
                          <p className="font-medium text-sm">
                            {enrollmentFileNames.length > 0
                              ? "Upload another enrollment file"
                              : "Click to upload student enrollment CSV/Excel"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Multiple files supported — each upload appends
                            records
                          </p>
                        </div>
                      </label>
                      {enrollmentFileHeaders.length > 0 && (
                        <div className="p-3 rounded-lg bg-muted/50 border text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">
                            Detected columns ({enrollmentFileHeaders.length}):{" "}
                          </span>
                          {enrollmentFileHeaders.join(" | ")}
                        </div>
                      )}
                    </div>
                    <input
                      ref={studentDataFileRef}
                      id="student-data-file"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={handleStudentDataUpload}
                      data-ocid="dean.student_upload.upload_button"
                    />
                    {/* Previous Files Selector */}
                    {enrollmentFileSnapshots.length > 0 && (
                      <div className="mt-4 p-3 rounded-lg border bg-muted/30">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" /> Previous
                          Enrollment Files
                        </p>
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedEnrollmentSnapshotIdx(null)
                            }
                            className={`w-full flex items-center justify-between p-2 rounded cursor-pointer text-xs ${selectedEnrollmentSnapshotIdx === null ? "bg-primary/10 border border-primary/30 font-medium" : "hover:bg-muted/50"}`}
                          >
                            <span>Latest (current)</span>
                            <Badge variant="outline" className="text-xs">
                              Active
                            </Badge>
                          </button>
                          {enrollmentFileSnapshots.map((snap, idx) => (
                            <div
                              key={snap.timestamp}
                              className={`w-full flex items-center justify-between p-2 rounded text-xs ${selectedEnrollmentSnapshotIdx === idx ? "bg-amber-50 border border-amber-300 font-medium" : "hover:bg-muted/50"}`}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedEnrollmentSnapshotIdx(idx)
                                }
                                className="flex items-center gap-1 flex-1 truncate text-left cursor-pointer"
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
                                onClick={() => {
                                  setUploadedStudentRecords(snap.records);
                                  setEnrollmentErrors(
                                    snap.errors as EnrollmentError[],
                                  );
                                  setSelectedEnrollmentSnapshotIdx(null);
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
                        {selectedEnrollmentSnapshotIdx !== null && (
                          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                            ⚠️ Viewing historical data from{" "}
                            <strong>
                              {
                                enrollmentFileSnapshots[
                                  selectedEnrollmentSnapshotIdx
                                ]?.fileName
                              }
                            </strong>{" "}
                            uploaded on{" "}
                            {new Date(
                              enrollmentFileSnapshots[
                                selectedEnrollmentSnapshotIdx
                              ]?.timestamp,
                            ).toLocaleString()}
                            . This is not the current active data.
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* NPTEL Exam Registration Data — active in parallel with enrollment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      NPTEL Exam Registration Data
                    </CardTitle>
                    <CardDescription>
                      Upload NPTEL exam registration CSV/Excel files. Payment
                      status and exam details — upload in parallel with
                      enrollment.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      data-ocid="dean.exam_upload.success_state"
                      className="space-y-3"
                    >
                      {/* Uploaded exam reg file list */}
                      {examRegFileNames.length > 0 && (
                        <div className="space-y-2">
                          {examRegFileNames.map((fname) => (
                            <div
                              key={fname}
                              className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200"
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                              <p className="text-sm font-medium text-green-700 flex-1 truncate">
                                {fname}
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveExamRegFile(fname)}
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                data-ocid="dean.exam_upload.delete_button"
                                title="Remove this file"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                          <p className="text-xs text-muted-foreground px-1">
                            {examRegErrors.length} exam registration errors
                            found
                          </p>
                        </div>
                      )}
                      {/* Upload dropzone — always visible */}
                      <label
                        htmlFor="exam-reg-file"
                        data-ocid="dean.exam_upload.dropzone"
                        className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                      >
                        <PlusCircle className="h-6 w-6 text-primary shrink-0" />
                        <div>
                          <p className="font-medium text-sm">
                            {examRegFileNames.length > 0
                              ? "Upload another exam registration file"
                              : "Click to upload exam registration CSV/Excel"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Payment status and exam details — upload in parallel
                            with enrollment
                          </p>
                        </div>
                      </label>
                    </div>
                    <input
                      ref={examRegFileRef}
                      id="exam-reg-file"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={handleExamRegUpload}
                      data-ocid="dean.exam_upload.upload_button"
                    />
                    {/* Previous Files Selector */}
                    {examRegFileSnapshots.length > 0 && (
                      <div className="mt-4 p-3 rounded-lg border bg-muted/30">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" /> Previous Exam Reg
                          Files
                        </p>
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => setSelectedExamRegSnapshotIdx(null)}
                            className={`w-full flex items-center justify-between p-2 rounded cursor-pointer text-xs ${selectedExamRegSnapshotIdx === null ? "bg-primary/10 border border-primary/30 font-medium" : "hover:bg-muted/50"}`}
                          >
                            <span>Latest (current)</span>
                            <Badge variant="outline" className="text-xs">
                              Active
                            </Badge>
                          </button>
                          {examRegFileSnapshots.map((snap, idx) => (
                            <div
                              key={snap.timestamp}
                              className={`w-full flex items-center justify-between p-2 rounded text-xs ${selectedExamRegSnapshotIdx === idx ? "bg-amber-50 border border-amber-300 font-medium" : "hover:bg-muted/50"}`}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedExamRegSnapshotIdx(idx)
                                }
                                className="flex items-center gap-1 flex-1 truncate text-left cursor-pointer"
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
                                onClick={() => {
                                  setExamRegErrors(
                                    snap.errors as ExamRegError[],
                                  );
                                  setSelectedExamRegSnapshotIdx(null);
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
                        {selectedExamRegSnapshotIdx !== null && (
                          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                            ⚠️ Viewing historical data from{" "}
                            <strong>
                              {
                                examRegFileSnapshots[selectedExamRegSnapshotIdx]
                                  ?.fileName
                              }
                            </strong>{" "}
                            uploaded on{" "}
                            {new Date(
                              examRegFileSnapshots[selectedExamRegSnapshotIdx]
                                ?.timestamp,
                            ).toLocaleString()}
                            . This is not the current active data.
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Exam Shuffle Data Upload — separate section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-base flex items-center gap-2">
                      <Shuffle className="h-4 w-4 text-indigo-600" />
                      Exam Shuffle Data Upload
                    </CardTitle>
                    <CardDescription>
                      Upload the NPTEL exam shuffle CSV/Excel file. Students can
                      view their exam center, date, and slot only after this
                      file is uploaded.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      data-ocid="dean.shuffle_upload.success_state"
                      className="space-y-3"
                    >
                      {shuffleFileNames.length > 0 && (
                        <div className="space-y-2">
                          {shuffleFileNames.map((fname) => (
                            <div
                              key={fname}
                              className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 border border-indigo-200"
                            >
                              <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                              <p className="text-sm font-medium text-indigo-700 flex-1 truncate">
                                {fname}
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveShuffleFile(fname)}
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                data-ocid="dean.shuffle_upload.delete_button"
                                title="Remove this file"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                          <p className="text-xs text-muted-foreground px-1">
                            {uploadedShuffleRecords.length} student shuffle
                            records loaded
                          </p>
                        </div>
                      )}
                      <label
                        htmlFor="shuffle-file"
                        data-ocid="dean.shuffle_upload.dropzone"
                        className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-indigo-300 bg-indigo-50/50 cursor-pointer hover:bg-indigo-50 transition-colors"
                      >
                        <PlusCircle className="h-6 w-6 text-indigo-600 shrink-0" />
                        <div>
                          <p className="font-medium text-sm">
                            {shuffleFileNames.length > 0
                              ? "Upload another shuffle file"
                              : "Click to upload exam shuffle CSV/Excel"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Exam center, date, time slot per student
                          </p>
                        </div>
                      </label>
                    </div>
                    <input
                      ref={shuffleFileRef}
                      id="shuffle-file"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={handleShuffleUpload}
                      data-ocid="dean.shuffle_upload.upload_button"
                    />
                  </CardContent>
                </Card>
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
                    Control upload and edit access for each department HOD.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4" data-ocid="dean.permissions.table">
                    {BRANCHES.map((branch, i) => {
                      const perm = pendingPerms[branch];
                      return (
                        <div
                          key={branch}
                          data-ocid={`dean.permissions.row.${i + 1}`}
                          className="rounded-lg border p-4 flex flex-wrap items-center gap-4"
                        >
                          {/* Branch */}
                          <div className="w-16">
                            <Badge
                              variant="outline"
                              className="font-display font-bold text-sm"
                            >
                              {branch}
                            </Badge>
                          </div>

                          {/* Enrollment Upload Toggle */}
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`enroll-toggle-${branch}`}
                              checked={perm.canUploadEnrollment}
                              onCheckedChange={(v) =>
                                setPendingPerms((prev) => ({
                                  ...prev,
                                  [branch]: {
                                    ...prev[branch],
                                    canUploadEnrollment: v,
                                  },
                                }))
                              }
                              data-ocid={`dean.permissions.enrollment_toggle.${i + 1}`}
                            />
                            <Label
                              htmlFor={`enroll-toggle-${branch}`}
                              className="text-sm cursor-pointer"
                            >
                              Enrollment Upload
                            </Label>
                          </div>

                          {/* Enrollment Edits count */}
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground whitespace-nowrap">
                              Enrollment Edits:
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              max={20}
                              value={perm.enrollmentEdits}
                              onChange={(e) =>
                                setPendingPerms((prev) => ({
                                  ...prev,
                                  [branch]: {
                                    ...prev[branch],
                                    enrollmentEdits: Number(e.target.value),
                                  },
                                }))
                              }
                              className="h-8 w-16 text-sm"
                              data-ocid={`dean.permissions.enrollment_edits.input.${i + 1}`}
                            />
                          </div>

                          {/* Exam Reg Upload Toggle */}
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`exam-toggle-${branch}`}
                              checked={perm.canUploadExamReg}
                              onCheckedChange={(v) =>
                                setPendingPerms((prev) => ({
                                  ...prev,
                                  [branch]: {
                                    ...prev[branch],
                                    canUploadExamReg: v,
                                  },
                                }))
                              }
                              data-ocid={`dean.permissions.exam_toggle.${i + 1}`}
                            />
                            <Label
                              htmlFor={`exam-toggle-${branch}`}
                              className="text-sm cursor-pointer"
                            >
                              Exam Reg Upload
                            </Label>
                          </div>

                          {/* Exam Reg Edits count */}
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground whitespace-nowrap">
                              Exam Reg Edits:
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              max={20}
                              value={perm.examRegEdits}
                              onChange={(e) =>
                                setPendingPerms((prev) => ({
                                  ...prev,
                                  [branch]: {
                                    ...prev[branch],
                                    examRegEdits: Number(e.target.value),
                                  },
                                }))
                              }
                              className="h-8 w-16 text-sm"
                              data-ocid={`dean.permissions.exam_edits.input.${i + 1}`}
                            />
                          </div>

                          {/* Save button */}
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
                      Upload master course CSV/Excel for all branches (12-week
                      courses will be displayed)
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
                              Detected columns ({courseFileHeaders.length}):{" "}
                            </span>
                            {courseFileHeaders.join(" | ")}
                          </div>
                        )}
                        {uploadedCourses.length === 0 &&
                          courseFileHeaders.length > 0 && (
                            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                              <strong>0 courses loaded.</strong> The parser
                              looks for a Duration/Weeks column with value "12".
                              If your file uses a different column name for
                              duration, the courses above show the detected
                              column names. If all courses are 12-week in the
                              file and there is no duration column, they will
                              still be included.
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

                {/* Branch-wise course count summary — click to filter */}
                {deanCourseFileUploaded && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-display text-base flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        Branch-wise 12-Week Course Count
                      </CardTitle>
                      <CardDescription>
                        Click a branch to filter the course table below
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div
                        className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3"
                        data-ocid="dean.courses.branch_summary"
                      >
                        {/* "All" card */}
                        <button
                          type="button"
                          onClick={() => {
                            setCourseBranchFilter("All");
                            setCoursePage(1);
                          }}
                          className={`flex flex-col items-center justify-center rounded-lg border p-3 text-center gap-1 cursor-pointer transition-colors w-full ${
                            courseBranchFilter === "All"
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted/30 hover:bg-muted/60"
                          }`}
                          data-ocid="dean.courses.branch_all.button"
                        >
                          <Badge
                            variant={
                              courseBranchFilter === "All"
                                ? "secondary"
                                : "outline"
                            }
                            className="font-display font-bold text-sm mb-1"
                          >
                            All
                          </Badge>
                          <span
                            className={`text-2xl font-display font-bold ${courseBranchFilter === "All" ? "text-primary-foreground" : "text-primary"}`}
                          >
                            {uploadedCourses.length}
                          </span>
                          <span className="text-xs opacity-70">courses</span>
                        </button>
                        {BRANCHES.map((branch) => {
                          const count = uploadedCourses.filter(
                            (c) => c.branch === branch,
                          ).length;
                          const isSelected = courseBranchFilter === branch;
                          return (
                            <button
                              type="button"
                              key={branch}
                              onClick={() => {
                                setCourseBranchFilter(branch);
                                setCoursePage(1);
                              }}
                              className={`flex flex-col items-center justify-center rounded-lg border p-3 text-center gap-1 cursor-pointer transition-colors w-full ${
                                isSelected
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-muted/30 hover:bg-muted/60"
                              }`}
                              data-ocid={`dean.courses.branch_card.${branch.toLowerCase()}`}
                            >
                              <Badge
                                variant={isSelected ? "secondary" : "outline"}
                                className="font-display font-bold text-sm mb-1"
                              >
                                {branch}
                              </Badge>
                              <span
                                className={`text-2xl font-display font-bold ${isSelected ? "text-primary-foreground" : "text-primary"}`}
                              >
                                {count}
                              </span>
                              <span className="text-xs opacity-70">
                                {count === 1 ? "course" : "courses"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <CardTitle className="font-display text-base">
                        12-Week Courses
                        {deanCourseFileUploaded && (
                          <span className="ml-2 text-sm font-normal text-muted-foreground">
                            {courseBranchFilter === "All"
                              ? `(${filteredCourses.length} total)`
                              : `— ${courseBranchFilter} (${filteredCourses.length})`}
                          </span>
                        )}
                      </CardTitle>
                    </div>
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
                        <p>No 12-week courses found for the selected branch.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Row count info */}
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
                                <TableHead>Branch</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredCourses
                                .slice(
                                  (coursePage - 1) * COURSE_PAGE_SIZE,
                                  coursePage * COURSE_PAGE_SIZE,
                                )
                                .map((c, i) => (
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
                                        {c.durationWeeks} weeks
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="secondary">
                                        {c.branch}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>
                        {/* Pagination controls */}
                        {Math.ceil(filteredCourses.length / COURSE_PAGE_SIZE) >
                          1 && (
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
                              Page {coursePage} of{" "}
                              {Math.ceil(
                                filteredCourses.length / COURSE_PAGE_SIZE,
                              )}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCoursePage((p) =>
                                  Math.min(
                                    Math.ceil(
                                      filteredCourses.length / COURSE_PAGE_SIZE,
                                    ),
                                    p + 1,
                                  ),
                                )
                              }
                              disabled={
                                coursePage ===
                                Math.ceil(
                                  filteredCourses.length / COURSE_PAGE_SIZE,
                                )
                              }
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
                      Upload the exam registration file to view statistics. Go
                      to the <strong>Data Upload</strong> tab and upload the
                      exam registration file.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* ── Count cards at top ── */}
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
                        desc: "Payment failed = registered",
                      },
                      {
                        label: "Redo Registration",
                        value: totalRedo,
                        icon: ClipboardCheck,
                        bg: "bg-amber-50",
                        border: "border-amber-200",
                        iconColor: "text-amber-600",
                        textColor: "text-amber-700",
                        desc: "Payment pending / draft",
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
                        value: totalStudents,
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

                  {/* ── Branch-wise bar chart ── */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-display text-base">
                        Branch-wise Exam Registration Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div
                        data-ocid="dean.statistics.chart"
                        className="w-full"
                        style={{ height: 360 }}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={dynamicBranchStats}
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
                              {totalStudents}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* ── Branch-wise stats table ── */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-display text-base">
                        Branch-wise Registration Count
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
                              <TableHead>Branch</TableHead>
                              <TableHead className="text-green-700">
                                Done
                              </TableHead>
                              <TableHead className="text-amber-600">
                                Redo Registration
                              </TableHead>
                              <TableHead className="text-red-600">
                                Do First Registration
                              </TableHead>
                              <TableHead>Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dynamicBranchStats.map((stat, i) => {
                              const branchTotal =
                                stat.done + stat.redo + stat.doFirst;
                              return (
                                <TableRow
                                  key={stat.branch}
                                  data-ocid={`dean.statistics.row.${i + 1}`}
                                >
                                  <TableCell>
                                    <Badge variant="outline">
                                      {stat.branch}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-medium text-green-700">
                                    {stat.done}
                                  </TableCell>
                                  <TableCell className="font-medium text-amber-600">
                                    {stat.redo}
                                  </TableCell>
                                  <TableCell className="font-medium text-red-600">
                                    {stat.doFirst}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {branchTotal}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            {/* Totals row */}
                            <TableRow className="bg-muted/30 font-bold border-t-2">
                              <TableCell className="font-display font-bold">
                                Total
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
                              <TableCell className="font-bold">
                                {totalStudents}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* ── Done Registrations Detail Table ── */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-display text-base flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Done Registrations
                        <Badge className="bg-green-100 text-green-800 border-green-200 ml-1">
                          {doneRegistrations.length}
                        </Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Students with payment_failed or payment_complete status
                        — registration confirmed.
                      </p>
                    </CardHeader>
                    <CardContent>
                      {doneRegistrations.length === 0 ? (
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
                              doneRegistrations.length,
                            )}{" "}
                            of{" "}
                            <strong className="text-foreground">
                              {doneRegistrations.length}
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
                                  <TableHead className="text-green-700">
                                    #
                                  </TableHead>
                                  <TableHead className="text-green-700">
                                    Student ID
                                  </TableHead>
                                  <TableHead className="text-green-700">
                                    Email
                                  </TableHead>
                                  <TableHead className="text-green-700">
                                    Course ID
                                  </TableHead>
                                  <TableHead className="text-green-700">
                                    Branch
                                  </TableHead>
                                  <TableHead className="text-green-700">
                                    Payment Status
                                  </TableHead>
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
                                      {r.examCourseId ?? r.courseId}
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

            {/* ── All Errors ── */}
            <TabsContent value="errors">
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
                      No data uploaded yet. Upload student data to see errors.
                      Go to the <strong>Data Upload</strong> tab to get started.
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
                            {filteredErrors.length}
                          </Badge>
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Filter className="h-4 w-4 text-muted-foreground" />
                          <Select
                            value={errorBranchFilter}
                            onValueChange={(v) => {
                              setErrorBranchFilter(v);
                              setErrorPage(1);
                            }}
                          >
                            <SelectTrigger
                              className="w-32 h-8"
                              data-ocid="dean.errors.branch.select"
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
                          <Select
                            value={errorTypeFilter}
                            onValueChange={(v) => {
                              setErrorTypeFilter(v);
                              setErrorPage(1);
                            }}
                          >
                            <SelectTrigger
                              className="w-44 h-8"
                              data-ocid="dean.errors.type.select"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="All">
                                All Error Types
                              </SelectItem>
                              {uniqueErrorTypes.map((t) => (
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
                            data-ocid="dean.errors.download_button"
                            onClick={() =>
                              downloadErrorsAsExcel(
                                filteredErrors,
                                `all-errors-${new Date().toISOString().slice(0, 10)}.xlsx`,
                              )
                            }
                          >
                            <Download className="h-3 w-3" /> Download
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {filteredErrors.length === 0 ? (
                        <div
                          data-ocid="dean.errors.empty_state"
                          className="text-center py-12 text-muted-foreground"
                        >
                          <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-400" />
                          <p>No errors match the selected filters.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Row count info */}
                          <p className="text-xs text-muted-foreground px-1">
                            Showing {(errorPage - 1) * ERROR_PAGE_SIZE + 1}–
                            {Math.min(
                              errorPage * ERROR_PAGE_SIZE,
                              filteredErrors.length,
                            )}{" "}
                            of{" "}
                            <strong className="text-foreground">
                              {filteredErrors.length}
                            </strong>{" "}
                            errors
                          </p>
                          <div
                            className="rounded-lg border overflow-x-auto"
                            data-ocid="dean.errors.table"
                          >
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/50">
                                  <TableHead>Type</TableHead>
                                  <TableHead>Branch</TableHead>
                                  <TableHead>Student ID</TableHead>
                                  <TableHead>Email</TableHead>
                                  <TableHead>Course ID</TableHead>
                                  <TableHead>Course Name</TableHead>
                                  <TableHead>Error Type</TableHead>
                                  <TableHead>Details</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pagedErrors.map((err, i) => (
                                  <TableRow
                                    key={`${err.id}-${i}`}
                                    data-ocid={`dean.errors.row.${i + 1}`}
                                  >
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className={`text-xs ${
                                          err.type === "Enrollment"
                                            ? "border-blue-400 text-blue-700"
                                            : "border-purple-400 text-purple-700"
                                        }`}
                                      >
                                        {err.type}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {err.branch}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                      {err.studentId}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {err.email}
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                      {err.courseId}
                                    </TableCell>
                                    <TableCell className="text-sm max-w-xs truncate">
                                      {err.courseName || "-"}
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
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                          setViewErrorDeanDialog({
                                            details: err.details,
                                            courseName: err.courseName,
                                            courseId: err.courseId,
                                            errorType: err.errorType,
                                            studentId: err.studentId,
                                          })
                                        }
                                        className="h-7 px-2 gap-1 text-blue-600 hover:text-blue-800"
                                        data-ocid="dean.errors.view_button"
                                      >
                                        <Eye className="h-3 w-3" /> View
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          {/* Pagination controls */}
                          {totalErrorPages > 1 && (
                            <div className="flex items-center justify-between pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setErrorPage((p) => Math.max(1, p - 1))
                                }
                                disabled={errorPage === 1}
                                data-ocid="dean.errors.pagination_prev"
                              >
                                Previous
                              </Button>
                              <span className="text-sm text-muted-foreground">
                                Page {errorPage} of {totalErrorPages}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setErrorPage((p) =>
                                    Math.min(totalErrorPages, p + 1),
                                  )
                                }
                                disabled={errorPage === totalErrorPages}
                                data-ocid="dean.errors.pagination_next"
                              >
                                Next
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* ── HOD Edited Records ── */}
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
                                  <TableHead className="text-indigo-700">
                                    #
                                  </TableHead>
                                  <TableHead className="text-indigo-700">
                                    Branch
                                  </TableHead>
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
                                      {rec.newEmail &&
                                        rec.newEmail !== rec.email && (
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
                                      {new Date(rec.editedAt).toLocaleString(
                                        "en-IN",
                                      )}
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
                  {/* Cross-match Errors */}
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
                                <TableHead>Student ID</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Course Name</TableHead>
                                <TableHead>Course ID</TableHead>
                                <TableHead>Error Type</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Branch</TableHead>
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
            {/* ── Enrollment Errors (separate tab) ── */}
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
                          Enrollment Errors
                          <Badge variant="destructive">
                            {filteredEnrollErrors.length}
                          </Badge>
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Filter className="h-4 w-4 text-muted-foreground" />
                          <Select
                            value={enrollErrBranchFilter}
                            onValueChange={(v) => {
                              setEnrollErrBranchFilter(v);
                              setEnrollErrPage(1);
                            }}
                          >
                            <SelectTrigger
                              className="w-32 h-8"
                              data-ocid="dean.enrollment_errors.branch.select"
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
                          <Select
                            value={enrollErrTypeFilter}
                            onValueChange={(v) => {
                              setEnrollErrTypeFilter(v);
                              setEnrollErrPage(1);
                            }}
                          >
                            <SelectTrigger
                              className="w-44 h-8"
                              data-ocid="dean.enrollment_errors.type.select"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="All">
                                All Error Types
                              </SelectItem>
                              {uniqueEnrollErrTypes.map((t) => (
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
                            data-ocid="dean.enrollment_errors.download_button"
                            onClick={() =>
                              downloadErrorsAsExcel(
                                filteredEnrollErrors,
                                `enrollment-errors-${new Date().toISOString().slice(0, 10)}.xlsx`,
                              )
                            }
                          >
                            <Download className="h-3 w-3" /> Download
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {filteredEnrollErrors.length === 0 ? (
                        <div
                          data-ocid="dean.enrollment_errors.empty_state"
                          className="text-center py-12 text-muted-foreground"
                        >
                          <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-400" />
                          <p>
                            No enrollment errors found
                            {enrollErrBranchFilter !== "All" ||
                            enrollErrTypeFilter !== "All"
                              ? " for selected filters"
                              : ""}
                            .
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs text-muted-foreground px-1">
                            Showing {(enrollErrPage - 1) * ERRORS_PAGE_SIZE + 1}
                            –
                            {Math.min(
                              enrollErrPage * ERRORS_PAGE_SIZE,
                              filteredEnrollErrors.length,
                            )}{" "}
                            of{" "}
                            <strong className="text-foreground">
                              {filteredEnrollErrors.length}
                            </strong>{" "}
                            enrollment errors
                          </p>
                          <div
                            className="rounded-lg border overflow-x-auto"
                            data-ocid="dean.enrollment_errors.table"
                          >
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-blue-50/60">
                                  <TableHead className="text-blue-700">
                                    #
                                  </TableHead>
                                  <TableHead className="text-blue-700">
                                    Branch
                                  </TableHead>
                                  <TableHead className="text-blue-700">
                                    Student ID
                                  </TableHead>
                                  <TableHead className="text-blue-700">
                                    Email
                                  </TableHead>
                                  <TableHead className="text-blue-700">
                                    Course ID
                                  </TableHead>
                                  <TableHead className="text-blue-700">
                                    Course Name
                                  </TableHead>
                                  <TableHead className="text-blue-700">
                                    Error Type
                                  </TableHead>
                                  <TableHead className="text-blue-700">
                                    Details
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pagedEnrollErrors.map((err, i) => (
                                  <TableRow
                                    key={`${err.id}-${i}`}
                                    data-ocid={`dean.enrollment_errors.row.${i + 1}`}
                                  >
                                    <TableCell className="text-muted-foreground text-xs">
                                      {(enrollErrPage - 1) * ERRORS_PAGE_SIZE +
                                        i +
                                        1}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {err.branch}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                      {err.studentId}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {err.email}
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                      {err.courseId}
                                    </TableCell>
                                    <TableCell className="text-sm max-w-xs truncate">
                                      {err.courseName || "-"}
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
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                          setViewErrorDeanDialog({
                                            details: err.details,
                                            courseName: err.courseName,
                                            courseId: err.courseId,
                                            errorType: err.errorType,
                                            studentId: err.studentId,
                                          })
                                        }
                                        className="h-7 px-2 gap-1 text-blue-600 hover:text-blue-800"
                                        data-ocid="dean.enrollment_errors.view_button"
                                      >
                                        <Eye className="h-3 w-3" /> View
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          {totalEnrollErrPages > 1 && (
                            <div className="flex items-center justify-between pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setEnrollErrPage((p) => Math.max(1, p - 1))
                                }
                                disabled={enrollErrPage === 1}
                                data-ocid="dean.enrollment_errors.pagination_prev"
                              >
                                Previous
                              </Button>
                              <span className="text-sm text-muted-foreground">
                                Page {enrollErrPage} of {totalEnrollErrPages}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setEnrollErrPage((p) =>
                                    Math.min(totalEnrollErrPages, p + 1),
                                  )
                                }
                                disabled={enrollErrPage === totalEnrollErrPages}
                                data-ocid="dean.enrollment_errors.pagination_next"
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

            {/* ── Exam Reg Errors (separate tab) ── */}
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
                      Upload exam registration data to see exam registration
                      errors. Go to the <strong>Data Upload</strong> tab to
                      upload the exam registration file.
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
                          Exam Registration Errors
                          <Badge variant="destructive">
                            {filteredExamRegErrList.length}
                          </Badge>
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Filter className="h-4 w-4 text-muted-foreground" />
                          <Select
                            value={examErrBranchFilter}
                            onValueChange={(v) => {
                              setExamErrBranchFilter(v);
                              setExamErrPage(1);
                            }}
                          >
                            <SelectTrigger
                              className="w-32 h-8"
                              data-ocid="dean.examreg_errors.branch.select"
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
                          <Select
                            value={examErrTypeFilter}
                            onValueChange={(v) => {
                              setExamErrTypeFilter(v);
                              setExamErrPage(1);
                            }}
                          >
                            <SelectTrigger
                              className="w-44 h-8"
                              data-ocid="dean.examreg_errors.type.select"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="All">
                                All Error Types
                              </SelectItem>
                              {uniqueExamErrTypes.map((t) => (
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
                            data-ocid="dean.examreg_errors.download_button"
                            onClick={() =>
                              downloadErrorsAsExcel(
                                filteredExamRegErrList,
                                `examreg-errors-${new Date().toISOString().slice(0, 10)}.xlsx`,
                              )
                            }
                          >
                            <Download className="h-3 w-3" /> Download
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {filteredExamRegErrList.length === 0 ? (
                        <div
                          data-ocid="dean.examreg_errors.empty_state"
                          className="text-center py-12 text-muted-foreground"
                        >
                          <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-400" />
                          <p>
                            No exam registration errors found
                            {examErrBranchFilter !== "All" ||
                            examErrTypeFilter !== "All"
                              ? " for selected filters"
                              : ""}
                            .
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs text-muted-foreground px-1">
                            Showing {(examErrPage - 1) * ERRORS_PAGE_SIZE + 1}–
                            {Math.min(
                              examErrPage * ERRORS_PAGE_SIZE,
                              filteredExamRegErrList.length,
                            )}{" "}
                            of{" "}
                            <strong className="text-foreground">
                              {filteredExamRegErrList.length}
                            </strong>{" "}
                            exam registration errors
                          </p>
                          <div
                            className="rounded-lg border overflow-x-auto"
                            data-ocid="dean.examreg_errors.table"
                          >
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-purple-50/60">
                                  <TableHead className="text-purple-700">
                                    #
                                  </TableHead>
                                  <TableHead className="text-purple-700">
                                    Branch
                                  </TableHead>
                                  <TableHead className="text-purple-700">
                                    Student ID
                                  </TableHead>
                                  <TableHead className="text-purple-700">
                                    Email
                                  </TableHead>
                                  <TableHead className="text-purple-700">
                                    Course ID
                                  </TableHead>
                                  <TableHead className="text-purple-700">
                                    Course Name
                                  </TableHead>
                                  <TableHead className="text-purple-700">
                                    Payment Status
                                  </TableHead>
                                  <TableHead className="text-purple-700">
                                    Error Type
                                  </TableHead>
                                  <TableHead className="text-purple-700">
                                    Details
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pagedExamErrors.map((err, i) => (
                                  <TableRow
                                    key={`${err.id}-${i}`}
                                    data-ocid={`dean.examreg_errors.row.${i + 1}`}
                                  >
                                    <TableCell className="text-muted-foreground text-xs">
                                      {(examErrPage - 1) * ERRORS_PAGE_SIZE +
                                        i +
                                        1}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {err.branch}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                      {err.studentId}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {err.email}
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                      {err.courseId}
                                    </TableCell>
                                    <TableCell className="text-sm max-w-xs truncate">
                                      {err.courseName || "-"}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className="text-xs border-amber-400 text-amber-700 bg-amber-50"
                                      >
                                        {err.paymentStatus || "N/A"}
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
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                          setViewErrorDeanDialog({
                                            details: err.details ?? "",
                                            courseName: err.courseName,
                                            courseId: (err as any).courseId,
                                            errorType: err.errorType,
                                            studentId: err.studentId,
                                          })
                                        }
                                        className="h-7 px-2 gap-1 text-blue-600 hover:text-blue-800"
                                        data-ocid="dean.examreg_errors.view_button"
                                      >
                                        <Eye className="h-3 w-3" /> View
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          {totalExamErrPages > 1 && (
                            <div className="flex items-center justify-between pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setExamErrPage((p) => Math.max(1, p - 1))
                                }
                                disabled={examErrPage === 1}
                                data-ocid="dean.examreg_errors.pagination_prev"
                              >
                                Previous
                              </Button>
                              <span className="text-sm text-muted-foreground">
                                Page {examErrPage} of {totalExamErrPages}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setExamErrPage((p) =>
                                    Math.min(totalExamErrPages, p + 1),
                                  )
                                }
                                disabled={examErrPage === totalExamErrPages}
                                data-ocid="dean.examreg_errors.pagination_next"
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
      {/* View Error Details Dialog - Dean */}
      {viewErrorDeanDialog && (
        <Dialog open={true} onOpenChange={() => setViewErrorDeanDialog(null)}>
          <DialogContent
            className="max-w-md"
            data-ocid="dean.view_error.dialog"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-700">
                <Eye className="h-4 w-4" />
                Error Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              {viewErrorDeanDialog.courseName && (
                <div>
                  <span className="font-semibold text-foreground">
                    Course Name:{" "}
                  </span>
                  <span className="font-bold text-blue-700">
                    {viewErrorDeanDialog.courseName}
                  </span>
                </div>
              )}
              {viewErrorDeanDialog.courseId && (
                <div>
                  <span className="font-semibold text-foreground">
                    Course ID:{" "}
                  </span>
                  <span className="font-mono">
                    {viewErrorDeanDialog.courseId}
                  </span>
                </div>
              )}
              {viewErrorDeanDialog.errorType && (
                <div>
                  <span className="font-semibold text-foreground">
                    Error Type:{" "}
                  </span>
                  <Badge variant="destructive" className="text-xs">
                    {viewErrorDeanDialog.errorType}
                  </Badge>
                </div>
              )}
              <div>
                <span className="font-semibold text-foreground">
                  Description:{" "}
                </span>
                <span className="text-muted-foreground">
                  {viewErrorDeanDialog.details}
                </span>
              </div>
              {viewErrorDeanDialog.studentId && (
                <div>
                  <span className="font-semibold text-foreground">
                    Student ID:{" "}
                  </span>
                  <span className="font-mono">
                    {viewErrorDeanDialog.studentId}
                  </span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
