import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Calendar,
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
import { memo, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppContext } from "../context/AppContext";
import type {
  EnrollmentError,
  ExamRegError,
  ExamShuffleUploadRecord,
  StudentUploadRecord,
} from "../data/mockData";
import { normalizePaymentStatus } from "../data/mockData";
import { loadStudentPassword, saveStudentPassword } from "./LoginPage";

// ─── Error popup ──────────────────────────────────────────────────────────────

interface ErrorPopupProps {
  error: EnrollmentError | ExamRegError | null;
  onClose: () => void;
}

const ErrorPopup = memo(function ErrorPopup({
  error,
  onClose,
}: ErrorPopupProps) {
  if (!error) return null;
  return (
    <Dialog open={!!error} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-base flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            Error Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          {error.courseName && (
            <div>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Course
              </span>
              <p className="font-bold text-primary mt-0.5">
                {error.courseName}
              </p>
            </div>
          )}
          {error.courseId && (
            <div>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Course ID
              </span>
              <p className="font-mono text-foreground mt-0.5">
                {error.courseId}
              </p>
            </div>
          )}
          <div>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Error Type
            </span>
            <p className="mt-0.5">
              <Badge variant="destructive" className="text-xs">
                {error.errorType}
              </Badge>
            </p>
          </div>
          {error.description && (
            <div>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Description
              </span>
              <p className="mt-0.5 text-foreground leading-relaxed">
                {error.description}
              </p>
            </div>
          )}
          {error.studentId && (
            <div className="pt-2 border-t">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Student Details
              </span>
              <div className="mt-1 space-y-0.5">
                <p className="font-mono text-sm">ID: {error.studentId}</p>
                {error.email && (
                  <p className="text-sm text-muted-foreground">{error.email}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});

// ─── Payment badge ─────────────────────────────────────────────────────────────

function PaymentBadge({ status }: { status?: string }) {
  if (!status) {
    return (
      <Badge
        variant="outline"
        className="border-orange-400 text-orange-700 bg-orange-50 text-xs"
      >
        Do First
      </Badge>
    );
  }
  const norm = normalizePaymentStatus(status);
  if (norm === "done") {
    return (
      <Badge
        variant="outline"
        className="border-green-400 text-green-700 bg-green-50 text-xs"
      >
        Done
      </Badge>
    );
  }
  if (norm === "redo") {
    return (
      <Badge
        variant="outline"
        className="border-yellow-400 text-yellow-700 bg-yellow-50 text-xs"
      >
        Redo
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-orange-400 text-orange-700 bg-orange-50 text-xs"
    >
      Do First
    </Badge>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface EmptyStateProps {
  ocid: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

const EmptyState = memo(function EmptyState({
  ocid,
  title,
  description,
  icon,
}: EmptyStateProps) {
  return (
    <div
      data-ocid={ocid}
      className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground"
    >
      {icon ?? <FileX className="h-10 w-10 text-muted-foreground/50" />}
      <p className="font-medium">{title}</p>
      <p className="text-sm max-w-sm">{description}</p>
    </div>
  );
});

interface EnrollmentTableProps {
  records: StudentUploadRecord[];
  ocid: string;
}

const EnrollmentTable = memo(function EnrollmentTable({
  records,
  ocid,
}: EnrollmentTableProps) {
  return (
    <div
      className="rounded-lg border overflow-hidden overflow-x-auto"
      data-ocid={ocid}
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
          {records.map((row, i) => (
            <TableRow
              key={`${row.courseId}-${i}`}
              data-ocid={`enrollment.row.${i + 1}`}
            >
              <TableCell className="text-muted-foreground text-xs">
                {i + 1}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {row.studentId || "-"}
              </TableCell>
              <TableCell className="text-sm">{row.email || "-"}</TableCell>
              <TableCell className="font-mono text-sm">
                {row.courseId}
              </TableCell>
              <TableCell>{row.courseName ?? "-"}</TableCell>
              <TableCell>
                <Badge variant="outline">{row.duration ?? "12 weeks"}</Badge>
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
  );
});

interface ExamRegTableProps {
  records: StudentUploadRecord[];
  ocid: string;
}

const ExamRegTable = memo(function ExamRegTable({
  records,
  ocid,
}: ExamRegTableProps) {
  return (
    <div
      className="rounded-lg border overflow-hidden overflow-x-auto"
      data-ocid={ocid}
    >
      <Table>
        <TableHeader>
          <TableRow className="bg-indigo-50/60">
            <TableHead className="text-indigo-700">#</TableHead>
            <TableHead className="text-indigo-700">Student ID</TableHead>
            <TableHead className="text-indigo-700">Email ID</TableHead>
            <TableHead className="text-indigo-700">Course ID</TableHead>
            <TableHead className="text-indigo-700">Course Name</TableHead>
            <TableHead className="text-indigo-700">Payment Status</TableHead>
            <TableHead className="text-indigo-700">
              Registration Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((row, i) => {
            const norm = normalizePaymentStatus(row.paymentStatus ?? "");
            const regLabel =
              norm === "done"
                ? "Complete"
                : norm === "redo"
                  ? "Redo Registration"
                  : "Register First";
            return (
              <TableRow
                key={`${row.courseId}-${i}`}
                data-ocid={`exam_reg.row.${i + 1}`}
              >
                <TableCell className="text-muted-foreground text-xs">
                  {i + 1}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {row.studentId || "-"}
                </TableCell>
                <TableCell className="text-sm">{row.email || "-"}</TableCell>
                <TableCell className="font-mono text-sm">
                  {row.courseId}
                </TableCell>
                <TableCell>{row.courseName ?? "-"}</TableCell>
                <TableCell>
                  <PaymentBadge status={row.paymentStatus} />
                </TableCell>
                <TableCell>
                  <span
                    className={`text-sm font-medium ${norm === "done" ? "text-green-700" : norm === "redo" ? "text-yellow-700" : "text-orange-700"}`}
                  >
                    {regLabel}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
});

interface ErrorListProps {
  errors: (EnrollmentError | ExamRegError)[];
  ocid: string;
  rowOcidPrefix: string;
  onSelect: (err: EnrollmentError | ExamRegError) => void;
}

const ErrorList = memo(function ErrorList({
  errors,
  ocid,
  rowOcidPrefix,
  onSelect,
}: ErrorListProps) {
  return (
    <div
      className="rounded-lg border border-red-200 bg-red-50 p-4"
      data-ocid={ocid}
    >
      <div className="flex items-center gap-2 mb-3">
        <XCircle className="h-4 w-4 text-red-600" />
        <p className="font-medium text-red-700 text-sm">
          Errors Found ({errors.length}) — Click an error to view details
        </p>
      </div>
      <div className="space-y-2">
        {errors.map((err, i) => (
          <button
            key={err.id}
            type="button"
            onClick={() => onSelect(err)}
            data-ocid={`${rowOcidPrefix}.${i + 1}`}
            className="w-full text-left rounded border border-red-200 bg-card hover:bg-red-50 hover:border-red-300 transition-colors p-3 text-sm cursor-pointer"
          >
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {err.courseName && (
                <span className="font-bold text-primary bg-primary/10 border border-primary/20 rounded px-2 py-0.5 text-sm">
                  {err.courseName}
                </span>
              )}
              <Badge variant="destructive" className="text-xs shrink-0">
                {err.errorType}
              </Badge>
            </div>
            {err.courseId && (
              <span className="text-xs font-mono text-muted-foreground">
                ID: {err.courseId}
              </span>
            )}
            <p className="text-xs text-muted-foreground mt-1 italic">
              Click to view full description →
            </p>
          </button>
        ))}
      </div>
    </div>
  );
});

// ─── Shuffle details card ──────────────────────────────────────────────────────

function ShuffleCard({ record }: { record: ExamShuffleUploadRecord }) {
  return (
    <div className="rounded-xl border bg-card shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
          <Shuffle className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <p className="font-display font-bold text-base">
            {record.courseName ?? "Exam Details"}
          </p>
          {record.courseId && (
            <p className="text-xs font-mono text-muted-foreground">
              {record.courseId}
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <InfoField
          label="Roll No"
          value={record.rollNo}
          icon={<GraduationCap className="h-3.5 w-3.5" />}
        />
        {record.examCenter && (
          <InfoField
            label="Exam Center"
            value={record.examCenter}
            icon={<MapPin className="h-3.5 w-3.5" />}
          />
        )}
        {record.examDate && (
          <InfoField
            label="Exam Date"
            value={record.examDate}
            icon={<Calendar className="h-3.5 w-3.5" />}
          />
        )}
        {record.timeSlot && (
          <InfoField
            label="Time Slot"
            value={record.timeSlot}
            icon={<Calendar className="h-3.5 w-3.5" />}
          />
        )}
        {record.hallTicketNo && (
          <InfoField label="Hall Ticket No" value={record.hallTicketNo} />
        )}
        {record.seatingNo && (
          <InfoField label="Seating No" value={record.seatingNo} />
        )}
      </div>
    </div>
  );
}

function InfoField({
  label,
  value,
  icon,
}: { label: string; value?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className="font-medium text-sm truncate">{value ?? "-"}</span>
    </div>
  );
}

// ─── Password field ────────────────────────────────────────────────────────────

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
  ocid: string;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  ocid,
}: PasswordFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          data-ocid={ocid}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="pr-10"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { collegeName?: string };
  const collegeName = params.collegeName
    ? decodeURIComponent(params.collegeName)
    : "";

  const {
    currentUser,
    logout,
    uploadedExamRegRecords,
    hodUploadedRecords,
    deanStudentDataUploaded,
    deanExamRegDataUploaded,
    deanShuffleDataUploaded,
    uploadedShuffleRecords,
    enrollmentErrors,
    examRegErrors,
    enrollmentIndexByStudentId,
    enrollmentIndexByEmail,
    examRegIndexByStudentId,
    examRegIndexByEmail,
    shuffleIndexByStudentId,
    shuffleIndexByEmail,
    enrollmentErrorsByStudentId,
    enrollmentErrorsByEmail,
    examRegErrorsByStudentId,
    examRegErrorsByEmail,
  } = useAppContext();

  const [selectedError, setSelectedError] = useState<
    EnrollmentError | ExamRegError | null
  >(null);
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
  const rollNoLower = rollNo.toLowerCase();
  const emailLower = studentEmail.toLowerCase();
  const campusKey = collegeName.toLowerCase().trim();

  // ── O(1) enrollment record lookups ──
  const myEnrollmentRecords = useMemo<StudentUploadRecord[]>(() => {
    const byId = enrollmentIndexByStudentId.get(rollNoLower) ?? [];
    const byEmail = enrollmentIndexByEmail.get(emailLower) ?? [];
    const seen = new Set<string>();
    const merged: StudentUploadRecord[] = [];
    for (const r of [...byId, ...byEmail]) {
      const key = `${r.studentId.toLowerCase()}::${(r.courseId ?? "").toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (!r.courseId) continue;
      merged.push(r);
    }
    return merged;
  }, [
    enrollmentIndexByStudentId,
    enrollmentIndexByEmail,
    rollNoLower,
    emailLower,
  ]);

  // ── O(1) exam reg record lookups ──
  const myExamRegRecords = useMemo<StudentUploadRecord[]>(() => {
    const byId = examRegIndexByStudentId.get(rollNoLower) ?? [];
    const byEmail = examRegIndexByEmail.get(emailLower) ?? [];
    const seen = new Set<string>();
    const merged: StudentUploadRecord[] = [];
    for (const r of [...byId, ...byEmail]) {
      const key = `${r.studentId.toLowerCase()}::${(r.courseId ?? "").toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(r);
    }
    // Also check hodUploadedRecords for exam reg records
    for (const r of hodUploadedRecords) {
      if (!r.paymentStatus) continue;
      if (
        r.studentId?.toLowerCase() !== rollNoLower &&
        r.email?.toLowerCase() !== emailLower
      )
        continue;
      const key = `${r.studentId.toLowerCase()}::${(r.courseId ?? "").toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(r);
    }
    return merged;
  }, [
    examRegIndexByStudentId,
    examRegIndexByEmail,
    rollNoLower,
    emailLower,
    hodUploadedRecords,
  ]);

  // ── O(1) shuffle lookups ──
  const myShuffleRecords = useMemo<ExamShuffleUploadRecord[]>(() => {
    const hasIndex =
      shuffleIndexByStudentId.size > 0 || shuffleIndexByEmail.size > 0;
    if (hasIndex) {
      const byId = shuffleIndexByStudentId.get(rollNoLower) ?? [];
      const byEmail = shuffleIndexByEmail.get(emailLower) ?? [];
      const seen = new Set<string>();
      return [...byId, ...byEmail].filter((r) => {
        const key = `${r.rollNo}::${r.courseId ?? ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    return uploadedShuffleRecords.filter(
      (r) => r.rollNo?.toLowerCase() === rollNoLower,
    );
  }, [
    shuffleIndexByStudentId,
    shuffleIndexByEmail,
    rollNoLower,
    emailLower,
    uploadedShuffleRecords,
  ]);

  // ── O(1) error lookups ──
  const myEnrollmentErrors = useMemo<EnrollmentError[]>(() => {
    const hasIndex =
      enrollmentErrorsByStudentId.size > 0 || enrollmentErrorsByEmail.size > 0;
    if (hasIndex) {
      const byId = (enrollmentErrorsByStudentId.get(rollNoLower) ??
        []) as EnrollmentError[];
      const byEmail = (enrollmentErrorsByEmail.get(emailLower) ??
        []) as EnrollmentError[];
      const seen = new Set<string>();
      return [...byId, ...byEmail].filter((e) => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });
    }
    return enrollmentErrors.filter(
      (e) =>
        e.email?.toLowerCase() === emailLower ||
        e.studentId?.toLowerCase() === rollNoLower,
    );
  }, [
    enrollmentErrorsByStudentId,
    enrollmentErrorsByEmail,
    rollNoLower,
    emailLower,
    enrollmentErrors,
  ]);

  const myExamRegErrors = useMemo<ExamRegError[]>(() => {
    const hasIndex =
      examRegErrorsByStudentId.size > 0 || examRegErrorsByEmail.size > 0;
    if (hasIndex) {
      const byId = (examRegErrorsByStudentId.get(rollNoLower) ??
        []) as ExamRegError[];
      const byEmail = (examRegErrorsByEmail.get(emailLower) ??
        []) as ExamRegError[];
      const seen = new Set<string>();
      return [...byId, ...byEmail].filter((e) => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });
    }
    return examRegErrors.filter(
      (e) =>
        e.email?.toLowerCase() === emailLower ||
        e.studentId?.toLowerCase() === rollNoLower,
    );
  }, [
    examRegErrorsByStudentId,
    examRegErrorsByEmail,
    rollNoLower,
    emailLower,
    examRegErrors,
  ]);

  // Student name from any uploaded record
  const studentName = useMemo(
    () =>
      myEnrollmentRecords.find((r) => r.name)?.name ??
      myExamRegRecords.find((r) => r.name)?.name ??
      myShuffleRecords.find((r) => r.name)?.name ??
      null,
    [myEnrollmentRecords, myExamRegRecords, myShuffleRecords],
  );

  const anyEnrollmentUploaded =
    deanStudentDataUploaded || hodUploadedRecords.length > 0;
  const anyExamRegUploaded =
    deanExamRegDataUploaded ||
    hodUploadedRecords.some((r) => r.paymentStatus) ||
    (uploadedExamRegRecords ?? []).length > 0;

  const hasEnrollmentData = myEnrollmentRecords.length > 0;
  const hasExamRegData = myExamRegRecords.length > 0;
  const hasShuffleData = myShuffleRecords.length > 0;

  // ── Change password ──
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
      <ErrorPopup
        error={selectedError}
        onClose={() => setSelectedError(null)}
      />

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
            <span className="font-display font-bold">
              Student Portal — {collegeName}
            </span>
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
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                Student
              </p>
              {studentName ? (
                <>
                  <h2 className="font-display font-bold text-xl truncate">
                    {studentName}
                  </h2>
                  <p className="text-sm text-muted-foreground font-mono">
                    {rollNo}
                  </p>
                </>
              ) : (
                <h2 className="font-display font-bold text-xl">{rollNo}</h2>
              )}
              <p className="text-sm text-muted-foreground">{collegeName}</p>
            </div>
            {hasEnrollmentData && (
              <Badge
                variant="secondary"
                className="ml-auto bg-green-100 text-green-800 shrink-0"
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
                Enrollment
              </TabsTrigger>
              <TabsTrigger
                value="exam-reg"
                data-ocid="student.exam_reg.tab"
                className="gap-2"
              >
                <ClipboardCheck className="h-4 w-4" />
                Exam Registration
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

            {/* ── Enrollment Tab ── */}
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
                  {!anyEnrollmentUploaded ? (
                    <EmptyState
                      ocid="student.enrollment.empty_state"
                      title="No Enrollment Data Available"
                      description="Enrollment data has not been uploaded yet. Please check back later."
                    />
                  ) : !hasEnrollmentData && myEnrollmentErrors.length === 0 ? (
                    <EmptyState
                      ocid="student.enrollment.not_found"
                      title="Record Not Found"
                      description="Your enrollment data was not found in the uploaded file. Please contact your HOD or Dean."
                    />
                  ) : myEnrollmentErrors.length === 0 ? (
                    <div
                      data-ocid="student.enrollment.no_error_state"
                      className="space-y-4"
                    >
                      <div className="flex flex-col items-center gap-3 py-6 text-center">
                        <CheckCircle2 className="h-10 w-10 text-green-500" />
                        <p className="font-medium text-green-700">
                          ✓ No Enrollment Errors Found
                        </p>
                        <p className="text-sm max-w-sm text-muted-foreground">
                          Your enrollment data has no errors and is correctly
                          registered.
                        </p>
                      </div>
                      {hasEnrollmentData && (
                        <EnrollmentTable
                          records={myEnrollmentRecords}
                          ocid="student.enrollment.table"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {hasEnrollmentData && (
                        <EnrollmentTable
                          records={myEnrollmentRecords}
                          ocid="student.enrollment.table"
                        />
                      )}
                      <ErrorList
                        errors={myEnrollmentErrors}
                        ocid="student.enrollment.errors"
                        rowOcidPrefix="student.enrollment.error"
                        onSelect={setSelectedError}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Exam Registration Tab ── */}
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
                  {!anyExamRegUploaded ? (
                    <EmptyState
                      ocid="student.exam_reg.empty_state"
                      title="No Exam Registration Data"
                      description="Exam registration data has not been uploaded yet. Please check back later."
                    />
                  ) : !hasExamRegData && myExamRegErrors.length === 0 ? (
                    <EmptyState
                      ocid="student.exam_reg.not_found"
                      title="Record Not Found"
                      description="Your exam registration data was not found in the uploaded file. Please contact your HOD or Dean."
                    />
                  ) : myExamRegErrors.length === 0 ? (
                    <div
                      data-ocid="student.exam_reg.no_error_state"
                      className="space-y-4"
                    >
                      <div className="flex flex-col items-center gap-3 py-6 text-center">
                        <CheckCircle2 className="h-10 w-10 text-green-500" />
                        <p className="font-medium text-green-700">
                          ✓ No Exam Registration Errors Found
                        </p>
                        <p className="text-sm max-w-sm text-muted-foreground">
                          Your exam registration is correctly processed with no
                          errors.
                        </p>
                      </div>
                      {hasExamRegData && (
                        <ExamRegTable
                          records={myExamRegRecords}
                          ocid="student.exam_reg.table"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {hasExamRegData && (
                        <ExamRegTable
                          records={myExamRegRecords}
                          ocid="student.exam_reg.table"
                        />
                      )}
                      <ErrorList
                        errors={myExamRegErrors}
                        ocid="student.exam_reg.errors"
                        rowOcidPrefix="student.exam_reg.error"
                        onSelect={setSelectedError}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Exam Shuffle Tab ── */}
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
                    <EmptyState
                      ocid="student.shuffle.empty_state"
                      title="Exam Shuffle Not Yet Released"
                      description="Please check back after the Dean uploads the shuffle file. Your exam center, date, and time slot will appear here."
                      icon={
                        <Calendar className="h-10 w-10 text-muted-foreground/50" />
                      }
                    />
                  ) : !hasShuffleData ? (
                    <EmptyState
                      ocid="student.shuffle.not_found"
                      title="No Shuffle Details Found"
                      description={`The exam shuffle file has been uploaded but your details (${rollNo}) were not found. Please check with your department.`}
                    />
                  ) : (
                    <div
                      className="space-y-3"
                      data-ocid="student.shuffle.table"
                    >
                      {myShuffleRecords.map((record, i) => (
                        <ShuffleCard
                          key={`${record.courseId ?? ""}-${i}`}
                          record={record}
                        />
                      ))}
                      <p className="text-xs text-muted-foreground mt-3 italic">
                        * Exam center and time slot are final. Contact your Dean
                        for queries.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Account Tab ── */}
            <TabsContent value="account">
              <div className="max-w-md">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-lg flex items-center gap-2">
                      <KeyRound className="h-5 w-5 text-primary" />
                      Account
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 rounded-lg bg-muted/50 border text-sm">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Logged in as
                      </p>
                      <p className="font-mono font-medium text-foreground">
                        {studentEmail}
                      </p>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium mb-4">
                        Change Password
                      </p>
                      <form
                        onSubmit={handleChangePassword}
                        className="space-y-4"
                      >
                        <PasswordField
                          id="current-pwd"
                          label="Current Password"
                          value={currentPwd}
                          onChange={setCurrentPwd}
                          show={showCurrentPwd}
                          onToggle={() => setShowCurrentPwd(!showCurrentPwd)}
                          placeholder="Enter current password"
                          ocid="student.account.current_pwd.input"
                        />
                        <PasswordField
                          id="new-pwd"
                          label="New Password"
                          value={newPwd}
                          onChange={setNewPwd}
                          show={showNewPwd}
                          onToggle={() => setShowNewPwd(!showNewPwd)}
                          placeholder="Min. 6 characters"
                          ocid="student.account.new_pwd.input"
                        />
                        <PasswordField
                          id="confirm-pwd"
                          label="Confirm New Password"
                          value={confirmPwd}
                          onChange={setConfirmPwd}
                          show={showConfirmPwd}
                          onToggle={() => setShowConfirmPwd(!showConfirmPwd)}
                          placeholder="Repeat new password"
                          ocid="student.account.confirm_pwd.input"
                        />
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
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border text-xs text-muted-foreground">
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
