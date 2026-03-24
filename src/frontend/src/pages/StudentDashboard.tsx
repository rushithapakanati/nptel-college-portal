import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ClipboardCheck,
  Eye,
  EyeOff,
  FileX,
  GraduationCap,
  KeyRound,
  LogOut,
  MapPin,
  Shuffle,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAppContext } from "../context/AppContext";
import { loadStudentPassword, saveStudentPassword } from "./LoginPage";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { collegeName?: string };
  const collegeName = params.collegeName
    ? decodeURIComponent(params.collegeName)
    : "";
  const {
    currentUser,
    logout,
    uploadedStudentRecords,
    hodUploadedRecords,
    deanStudentDataUploaded,
    deanExamRegDataUploaded,
    deanShuffleDataUploaded,
    uploadedShuffleRecords,
    enrollmentErrors,
    examRegErrors,
  } = useAppContext();

  // Change password state
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  function handleLogout() {
    logout();
    navigate({ to: "/" });
  }

  const studentEmail = currentUser?.email ?? "";
  const rollNo = studentEmail.split("@")[0];
  const campusKey = collegeName.toLowerCase().trim();

  // Whether any data has been uploaded (enrollment or exam reg) at this campus
  const anyDataUploaded =
    deanStudentDataUploaded ||
    deanExamRegDataUploaded ||
    hodUploadedRecords.length > 0;

  // Merge dean-uploaded and hod-uploaded records for this student
  // Deduplicate by studentId+courseId to avoid showing same record twice
  const allUploadedRecords = (() => {
    const combined = [...uploadedStudentRecords, ...hodUploadedRecords];
    const seen = new Set<string>();
    return combined.filter((r) => {
      const key = `${r.studentId.toLowerCase()}::${(r.courseId ?? "").toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();

  // Derive records for this student from uploaded data
  // Match by email (case-insensitive) OR by studentId matching the roll number
  const myRecords = allUploadedRecords.filter((r) => {
    if (!r) return false;
    const emailMatch =
      r.email && r.email.toLowerCase() === studentEmail.toLowerCase();
    const idMatch =
      r.studentId && r.studentId.toLowerCase() === rollNo.toLowerCase();
    return emailMatch || idMatch;
  });

  // Only student records (not faculty)
  const studentRecords = myRecords.filter(
    (r) => !r.profession || r.profession.toLowerCase() !== "faculty",
  );

  // Auto-fetch student name from uploaded records (or from shuffle records)
  const studentName =
    studentRecords.find((r) => r.name)?.name ??
    uploadedShuffleRecords.find(
      (r) =>
        r.email?.toLowerCase() === studentEmail.toLowerCase() ||
        r.studentId?.toLowerCase() === rollNo.toLowerCase(),
    )?.name ??
    null;

  // Whether the student's record was found in the uploaded data (reserved for future use)
  const _studentRecordFound = studentRecords.length > 0;

  // Enrollment records: all records with courseId
  const enrollmentRecordsDisplay = studentRecords.filter((r) => r.courseId);

  // Exam registration records: only records with paymentStatus (from exam reg file)
  const examRegRecords = studentRecords.filter((r) => r.paymentStatus);

  // Check if this student has errors in enrollment or exam reg
  const myEnrollmentErrors = enrollmentErrors.filter(
    (e) =>
      e.email?.toLowerCase() === studentEmail.toLowerCase() ||
      e.studentId?.toLowerCase() === rollNo.toLowerCase(),
  );
  const myExamRegErrors = examRegErrors.filter(
    (e) =>
      e.email?.toLowerCase() === studentEmail.toLowerCase() ||
      e.studentId?.toLowerCase() === rollNo.toLowerCase(),
  );

  // ── NEW LOGIC ──
  // Enrollment tab: show details ONLY if this student has enrollment errors
  // Exam Reg tab: show details ONLY if this student has exam reg errors
  // If no errors for this student, show "No errors found" message
  const hasEnrollmentErrors = myEnrollmentErrors.length > 0;
  const hasExamRegErrors = myExamRegErrors.length > 0;

  // Exam shuffle: from dean's dedicated shuffle upload (separate from exam reg file)
  const myShuffleRecords = uploadedShuffleRecords.filter(
    (r) =>
      r.email?.toLowerCase() === studentEmail.toLowerCase() ||
      r.studentId?.toLowerCase() === rollNo.toLowerCase(),
  );

  // Classify payment status
  function classifyPayment(status?: string): {
    label: string;
    action: string;
    color: string;
    badgeClass: string;
  } {
    if (!status) {
      return {
        label: "Do First Registration",
        action: "Register for exam first",
        color: "red",
        badgeClass: "bg-red-100 text-red-800 border-red-200",
      };
    }
    // Normalize underscores to spaces so "payment_failed" matches "payment failed"
    const s = status.toLowerCase().replace(/_/g, " ").trim();
    if (
      s === "payment failed" ||
      s === "failed" ||
      s === "payment complete" ||
      s === "complete"
    ) {
      return {
        label: "Done",
        action: "Registration complete",
        color: "green",
        badgeClass: "bg-green-100 text-green-800 border-green-200",
      };
    }
    if (
      s === "payment pending" ||
      s === "pending" ||
      s === "payment draft" ||
      s === "draft"
    ) {
      return {
        label: "Redo Registration",
        action: "Re-submit payment",
        color: "amber",
        badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200",
      };
    }
    return {
      label: "Do First Registration",
      action: "Register for exam first",
      color: "red",
      badgeClass: "bg-red-100 text-red-800 border-red-200",
    };
  }

  const hasEnrollmentData = enrollmentRecordsDisplay.length > 0;
  const hasExamRegData = examRegRecords.length > 0;
  const hasShuffleData = myShuffleRecords.length > 0;

  // ── Change password handler ──
  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdError("");
    const storedPwd = loadStudentPassword(campusKey, rollNo);
    if (currentPwd !== storedPwd) {
      setPwdError("Current password is incorrect.");
      return;
    }
    if (newPwd.length < 6) {
      setPwdError("New password must be at least 6 characters.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError("New passwords do not match.");
      return;
    }
    saveStudentPassword(campusKey, rollNo, newPwd);
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
    toast.success("Password changed successfully!");
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
            data-ocid="student.back.button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="h-5 w-px bg-white/30" />
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            <span className="font-display font-bold">Student Dashboard</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-sm text-white/70 hidden sm:block">
              {studentEmail}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white hover:bg-white/20 gap-2"
              data-ocid="student.logout.button"
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
          {/* Profile strip */}
          <div className="mb-8 rounded-xl bg-gradient-to-r from-primary/10 to-secondary p-6 flex items-center gap-4">
            <div
              className="h-14 w-14 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
              style={{ background: "oklch(0.38 0.12 264)" }}
            >
              {rollNo.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                Student
              </p>
              {/* Change-1: Show name from uploaded records if found */}
              {studentName ? (
                <>
                  <h2 className="font-display font-bold text-xl">
                    {studentName}
                  </h2>
                  <p className="text-sm text-muted-foreground font-mono">
                    {rollNo}
                  </p>
                </>
              ) : (
                <h2 className="font-display font-bold text-xl">{rollNo}</h2>
              )}
              <p className="text-sm text-muted-foreground">
                {collegeName} · NPTEL 2026
              </p>
            </div>
            {hasEnrollmentData && (
              <Badge
                variant="secondary"
                className="ml-auto bg-green-100 text-green-800"
                data-ocid="student.status.badge"
              >
                Active Enrollment
              </Badge>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="enrollment" data-ocid="student.tabs">
            <TabsList className="mb-6 w-full sm:w-auto flex-wrap h-auto gap-1">
              <TabsTrigger
                value="enrollment"
                data-ocid="student.enrollment.tab"
                className="gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Enrollment Details
              </TabsTrigger>
              <TabsTrigger
                value="exam-reg"
                data-ocid="student.exam_reg.tab"
                className="gap-2"
              >
                <ClipboardCheck className="h-4 w-4" />
                Exam Registration Details
              </TabsTrigger>
              <TabsTrigger
                value="shuffle"
                data-ocid="student.shuffle.tab"
                className="gap-2"
              >
                <Shuffle className="h-4 w-4" />
                Exam Shuffle
              </TabsTrigger>
              <TabsTrigger
                value="account"
                data-ocid="student.account.tab"
                className="gap-2"
              >
                <KeyRound className="h-4 w-4" />
                Account
              </TabsTrigger>
            </TabsList>

            {/* ── Enrollment ── */}
            <TabsContent value="enrollment">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Enrollment Details
                    <Badge variant="secondary" className="text-xs">
                      Read-only
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!anyDataUploaded ? (
                    <div
                      data-ocid="student.enrollment.empty_state"
                      className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground"
                    >
                      <FileX className="h-10 w-10 text-muted-foreground/50" />
                      <p className="font-medium">
                        No Enrollment Data Available
                      </p>
                      <p className="text-sm max-w-sm">
                        Dean or HOD has not uploaded student data yet. Your
                        enrollment details will appear here once the data is
                        uploaded.
                      </p>
                    </div>
                  ) : !hasEnrollmentErrors ? (
                    <div
                      data-ocid="student.enrollment.empty_state"
                      className="flex flex-col items-center gap-3 py-12 text-center"
                    >
                      <CheckCircle2 className="h-10 w-10 text-green-500/70" />
                      <p className="font-medium text-green-700">
                        No Enrollment Errors Found
                      </p>
                      <p className="text-sm max-w-sm text-muted-foreground">
                        {anyDataUploaded
                          ? "Your enrollment data has no errors. Your details are correctly registered."
                          : "Data has been uploaded but no errors were found for your Student ID."}
                      </p>
                      {hasEnrollmentData && (
                        <div
                          className="mt-4 w-full rounded-lg border overflow-hidden"
                          data-ocid="student.enrollment.table"
                        >
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead>#</TableHead>
                                <TableHead>Student ID</TableHead>
                                <TableHead>Email ID</TableHead>
                                <TableHead>Course ID</TableHead>
                                <TableHead>Course Name</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {enrollmentRecordsDisplay.map((row, i) => (
                                <TableRow
                                  key={`${row.courseId}-${i}`}
                                  data-ocid={`student.enrollment.row.${i + 1}`}
                                >
                                  <TableCell className="text-muted-foreground text-xs">
                                    {i + 1}
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {row.studentId || "-"}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {row.email || "-"}
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {row.courseId}
                                  </TableCell>
                                  <TableCell>{row.courseName ?? "-"}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {row.durationWeeks
                                        ? `${row.durationWeeks} weeks`
                                        : "12 weeks"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className="bg-green-100 text-green-800">
                                      {row.enrollmentStatus ?? "Enrolled"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Show enrollment record details */}
                      {hasEnrollmentData && (
                        <div
                          className="rounded-lg border overflow-hidden"
                          data-ocid="student.enrollment.table"
                        >
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead>#</TableHead>
                                <TableHead>Student ID</TableHead>
                                <TableHead>Email ID</TableHead>
                                <TableHead>Course ID</TableHead>
                                <TableHead>Course Name</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {enrollmentRecordsDisplay.map((row, i) => (
                                <TableRow
                                  key={`${row.courseId}-${i}`}
                                  data-ocid={`student.enrollment.row.${i + 1}`}
                                >
                                  <TableCell className="text-muted-foreground text-xs">
                                    {i + 1}
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {row.studentId || "-"}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {row.email || "-"}
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {row.courseId}
                                  </TableCell>
                                  <TableCell>{row.courseName ?? "-"}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {row.durationWeeks
                                        ? `${row.durationWeeks} weeks`
                                        : "12 weeks"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className="bg-green-100 text-green-800">
                                      {row.enrollmentStatus ?? "Enrolled"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                      {/* Show enrollment errors for this student */}
                      <div
                        className="rounded-lg border border-red-200 bg-red-50 p-4"
                        data-ocid="student.enrollment.errors"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <p className="font-medium text-red-700 text-sm">
                            Enrollment Errors Found ({myEnrollmentErrors.length}
                            ) — Please correct the following:
                          </p>
                        </div>
                        <div className="space-y-2">
                          {myEnrollmentErrors.map((err, i) => (
                            <div
                              key={err.id}
                              className="rounded border border-red-200 bg-red-50 p-3 text-sm"
                              data-ocid={`student.enrollment.error.${i + 1}`}
                            >
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                {err.courseName && (
                                  <span className="font-bold text-blue-800 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
                                    {err.courseName}
                                  </span>
                                )}
                                <Badge
                                  variant="destructive"
                                  className="text-xs shrink-0"
                                >
                                  {err.errorType}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-2 mb-1">
                                {err.courseId && (
                                  <span className="text-xs font-mono bg-white border border-red-200 rounded px-1 py-0.5 text-gray-600">
                                    ID: {err.courseId}
                                  </span>
                                )}
                              </div>
                              <span className="text-red-700 text-xs">
                                {err.details}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Exam Registration Details (Change-7) ── */}
            <TabsContent value="exam-reg">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-indigo-600" />
                    Exam Registration Details
                    <Badge variant="secondary" className="text-xs">
                      Read-only
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!deanExamRegDataUploaded &&
                  !hodUploadedRecords.some((r) => r.paymentStatus) ? (
                    <div
                      data-ocid="student.exam_reg.empty_state"
                      className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground"
                    >
                      <FileX className="h-10 w-10 text-muted-foreground/50" />
                      <p className="font-medium">No Exam Registration Data</p>
                      <p className="text-sm max-w-sm">
                        Dean or HOD has not uploaded exam registration data yet.
                        Your registration details will appear here once
                        uploaded.
                      </p>
                    </div>
                  ) : !hasExamRegErrors ? (
                    <div
                      data-ocid="student.exam_reg.empty_state"
                      className="flex flex-col items-center gap-3 py-12 text-center"
                    >
                      <CheckCircle2 className="h-10 w-10 text-green-500/70" />
                      <p className="font-medium text-green-700">
                        No Exam Registration Errors Found
                      </p>
                      <p className="text-sm max-w-sm text-muted-foreground">
                        Your exam registration data has no errors. Your
                        registration is correctly processed.
                      </p>
                      {hasExamRegData && (
                        <div className="mt-4 w-full space-y-3">
                          <div
                            className="rounded-lg border overflow-x-auto"
                            data-ocid="student.exam_reg.table"
                          >
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-indigo-50/60">
                                  <TableHead className="text-indigo-700">
                                    #
                                  </TableHead>
                                  <TableHead className="text-indigo-700">
                                    Student ID
                                  </TableHead>
                                  <TableHead className="text-indigo-700">
                                    Email ID
                                  </TableHead>
                                  <TableHead className="text-indigo-700">
                                    Course ID
                                  </TableHead>
                                  <TableHead className="text-indigo-700">
                                    Course Name
                                  </TableHead>
                                  <TableHead className="text-indigo-700">
                                    Payment Status
                                  </TableHead>
                                  <TableHead className="text-indigo-700">
                                    Registration Status
                                  </TableHead>
                                  <TableHead className="text-indigo-700">
                                    Action Needed
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {examRegRecords.map((row, i) => {
                                  const cls = classifyPayment(
                                    row.paymentStatus,
                                  );
                                  return (
                                    <TableRow
                                      key={`${row.examCourseId ?? row.courseId}-${i}`}
                                      data-ocid={`student.exam_reg.row.${i + 1}`}
                                    >
                                      <TableCell className="text-muted-foreground text-xs">
                                        {i + 1}
                                      </TableCell>
                                      <TableCell className="font-mono text-sm">
                                        {row.studentId || "-"}
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {row.email || "-"}
                                      </TableCell>
                                      <TableCell className="font-mono text-sm">
                                        {row.examCourseId ?? row.courseId}
                                      </TableCell>
                                      <TableCell>
                                        {row.courseName ?? "-"}
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          className={cls.badgeClass}
                                          variant="outline"
                                        >
                                          {row.paymentStatus || "N/A"}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          variant="outline"
                                          className={
                                            cls.color === "green"
                                              ? "border-green-400 text-green-700 bg-green-50"
                                              : cls.color === "amber"
                                                ? "border-amber-400 text-amber-700 bg-amber-50"
                                                : "border-red-400 text-red-700 bg-red-50"
                                          }
                                        >
                                          {cls.label}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-sm text-muted-foreground">
                                        {cls.action}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Show exam reg record details */}
                      {hasExamRegData && (
                        <>
                          <div
                            className="rounded-lg border overflow-x-auto"
                            data-ocid="student.exam_reg.table"
                          >
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-indigo-50/60">
                                  <TableHead className="text-indigo-700">
                                    #
                                  </TableHead>
                                  <TableHead className="text-indigo-700">
                                    Student ID
                                  </TableHead>
                                  <TableHead className="text-indigo-700">
                                    Email ID
                                  </TableHead>
                                  <TableHead className="text-indigo-700">
                                    Course ID
                                  </TableHead>
                                  <TableHead className="text-indigo-700">
                                    Course Name
                                  </TableHead>
                                  <TableHead className="text-indigo-700">
                                    Payment Status
                                  </TableHead>
                                  <TableHead className="text-indigo-700">
                                    Registration Status
                                  </TableHead>
                                  <TableHead className="text-indigo-700">
                                    Action Needed
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {examRegRecords.map((row, i) => {
                                  const cls = classifyPayment(
                                    row.paymentStatus,
                                  );
                                  return (
                                    <TableRow
                                      key={`${row.examCourseId ?? row.courseId}-${i}`}
                                      data-ocid={`student.exam_reg.row.${i + 1}`}
                                    >
                                      <TableCell className="text-muted-foreground text-xs">
                                        {i + 1}
                                      </TableCell>
                                      <TableCell className="font-mono text-sm">
                                        {row.studentId || "-"}
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {row.email || "-"}
                                      </TableCell>
                                      <TableCell className="font-mono text-sm">
                                        {row.examCourseId ?? row.courseId}
                                      </TableCell>
                                      <TableCell>
                                        {row.courseName ?? "-"}
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          className={cls.badgeClass}
                                          variant="outline"
                                        >
                                          {row.paymentStatus || "N/A"}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          variant="outline"
                                          className={
                                            cls.color === "green"
                                              ? "border-green-400 text-green-700 bg-green-50"
                                              : cls.color === "amber"
                                                ? "border-amber-400 text-amber-700 bg-amber-50"
                                                : "border-red-400 text-red-700 bg-red-50"
                                          }
                                        >
                                          {cls.label}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-sm text-muted-foreground">
                                        {cls.action}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                          <p className="text-xs text-muted-foreground italic px-1">
                            * Registration Status is based on payment status
                            from the exam registration file. "Payment Failed"
                            means the registration is complete (payment was
                            processed).
                          </p>
                        </>
                      )}
                      {/* Show exam reg errors for this student */}
                      <div
                        className="rounded-lg border border-red-200 bg-red-50 p-4"
                        data-ocid="student.exam_reg.errors"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <p className="font-medium text-red-700 text-sm">
                            Exam Registration Errors Found (
                            {myExamRegErrors.length}) — Please correct the
                            following:
                          </p>
                        </div>
                        <div className="space-y-2">
                          {myExamRegErrors.map((err, i) => (
                            <div
                              key={err.id}
                              className="rounded border border-red-200 bg-red-50 p-3 text-sm"
                              data-ocid={`student.exam_reg.error.${i + 1}`}
                            >
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                {err.courseName && (
                                  <span className="font-bold text-blue-800 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
                                    {err.courseName}
                                  </span>
                                )}
                                <Badge
                                  variant="destructive"
                                  className="text-xs shrink-0"
                                >
                                  {err.errorType}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-2 mb-1">
                                {err.courseId && (
                                  <span className="text-xs font-mono bg-white border border-red-200 rounded px-1 py-0.5 text-gray-600">
                                    ID: {err.courseId}
                                  </span>
                                )}
                              </div>
                              <span className="text-red-700 text-xs">
                                {err.details}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Exam Shuffle ── */}
            <TabsContent value="shuffle">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Shuffle className="h-5 w-5 text-primary" />
                    Exam Shuffle Details
                    <Badge variant="secondary" className="text-xs">
                      Read-only
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!deanShuffleDataUploaded ? (
                    <div
                      data-ocid="student.shuffle.empty_state"
                      className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground"
                    >
                      <FileX className="h-10 w-10 text-muted-foreground/50" />
                      <p className="font-medium">
                        Exam Shuffle Not Yet Released
                      </p>
                      <p className="text-sm max-w-sm">
                        The Dean has not uploaded the exam shuffle file yet.
                        Your exam center, date, and time slot will appear here
                        once the shuffle is released.
                      </p>
                    </div>
                  ) : !hasShuffleData ? (
                    <div
                      data-ocid="student.shuffle.empty_state"
                      className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground"
                    >
                      <FileX className="h-10 w-10 text-muted-foreground/50" />
                      <p className="font-medium">No Shuffle Details Found</p>
                      <p className="text-sm">
                        The exam shuffle file has been uploaded but your Student
                        ID ({rollNo}) was not found in the shuffle data. Please
                        contact your Dean.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div
                        className="rounded-lg border overflow-hidden"
                        data-ocid="student.shuffle.table"
                      >
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-indigo-50/50">
                              <TableHead className="text-indigo-700">
                                #
                              </TableHead>
                              <TableHead className="text-indigo-700">
                                Roll No
                              </TableHead>
                              <TableHead className="text-indigo-700">
                                Email ID
                              </TableHead>
                              <TableHead className="text-indigo-700">
                                Course ID
                              </TableHead>
                              <TableHead className="text-indigo-700">
                                Course Name
                              </TableHead>
                              <TableHead className="text-indigo-700">
                                Exam Center
                              </TableHead>
                              <TableHead className="text-indigo-700">
                                Exam Date
                              </TableHead>
                              <TableHead className="text-indigo-700">
                                Time Slot
                              </TableHead>
                              {myShuffleRecords.some(
                                (r) => r.seatingNumber,
                              ) && (
                                <TableHead className="text-indigo-700">
                                  Seating No
                                </TableHead>
                              )}
                              {myShuffleRecords.some((r) => r.hallTicketNo) && (
                                <TableHead className="text-indigo-700">
                                  Hall Ticket
                                </TableHead>
                              )}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {myShuffleRecords.map((row, i) => (
                              <TableRow
                                key={`${row.courseId}-${i}`}
                                data-ocid={`student.shuffle.row.${i + 1}`}
                              >
                                <TableCell className="text-muted-foreground text-xs">
                                  {i + 1}
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {row.studentId || "-"}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {row.email || "-"}
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {row.courseId || "-"}
                                </TableCell>
                                <TableCell>{row.courseName ?? "-"}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                    {row.examCenter || "-"}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {row.examDate ? row.examDate : "-"}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className="border-indigo-300 text-indigo-700 bg-indigo-50"
                                  >
                                    {row.examSlot || "-"}
                                  </Badge>
                                </TableCell>
                                {myShuffleRecords.some(
                                  (r) => r.seatingNumber,
                                ) && (
                                  <TableCell className="font-mono text-sm">
                                    {row.seatingNumber || "-"}
                                  </TableCell>
                                )}
                                {myShuffleRecords.some(
                                  (r) => r.hallTicketNo,
                                ) && (
                                  <TableCell className="font-mono text-sm">
                                    {row.hallTicketNo || "-"}
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3 italic">
                        * Exam center and time slot are final. Contact your Dean
                        for queries regarding the shuffle.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Account / Change Password (Change-6) ── */}
            <TabsContent value="account">
              <div className="max-w-md">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-lg flex items-center gap-2">
                      <KeyRound className="h-5 w-5 text-primary" />
                      Change Password
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="current-pwd">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="current-pwd"
                            data-ocid="student.account.current_pwd.input"
                            type={showCurrentPwd ? "text" : "password"}
                            placeholder="Enter current password"
                            value={currentPwd}
                            onChange={(e) => setCurrentPwd(e.target.value)}
                            required
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showCurrentPwd ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="new-pwd">New Password</Label>
                        <div className="relative">
                          <Input
                            id="new-pwd"
                            data-ocid="student.account.new_pwd.input"
                            type={showNewPwd ? "text" : "password"}
                            placeholder="Min. 6 characters"
                            value={newPwd}
                            onChange={(e) => setNewPwd(e.target.value)}
                            required
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPwd(!showNewPwd)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showNewPwd ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="confirm-pwd">
                          Confirm New Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirm-pwd"
                            data-ocid="student.account.confirm_pwd.input"
                            type={showConfirmPwd ? "text" : "password"}
                            placeholder="Repeat new password"
                            value={confirmPwd}
                            onChange={(e) => setConfirmPwd(e.target.value)}
                            required
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showConfirmPwd ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {pwdError && (
                        <div
                          data-ocid="student.account.error_state"
                          className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3"
                        >
                          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                          <span>{pwdError}</span>
                        </div>
                      )}

                      <Button
                        type="submit"
                        data-ocid="student.account.save_button"
                        className="w-full gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Update Password
                      </Button>
                    </form>

                    <div className="mt-4 p-3 rounded-lg bg-muted/50 border text-xs text-muted-foreground">
                      <p>
                        Your Student ID:{" "}
                        <span className="font-mono font-medium text-foreground">
                          {rollNo}
                        </span>
                      </p>
                      <p className="mt-1">
                        Default password is{" "}
                        <span className="font-mono">student123</span>. It is
                        strongly recommended to change it.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
