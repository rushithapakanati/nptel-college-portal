import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  ShieldCheck,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import {
  BRANCHES,
  type Branch,
  getCollegeConfig,
  getStudentEmailExample,
  isValidStudentEmail,
} from "../data/mockData";

// ─── localStorage helpers ─────────────────────────────────────────────────────

function getDeanCredKey(key: string) {
  return `nptel_dean_cred_${key}`;
}
function getHodCredKey(key: string, branch: string) {
  return `nptel_hod_cred_${key}_${branch}`;
}
function getStudentPwdKey(key: string, studentId: string) {
  return `nptel_student_pwd_${key}_${studentId}`;
}

function campusKey(name: string) {
  return name.toLowerCase().trim();
}

function loadDeanCred(key: string): { email: string; password: string } | null {
  try {
    const raw = localStorage.getItem(getDeanCredKey(key));
    return raw
      ? (JSON.parse(raw) as { email: string; password: string })
      : null;
  } catch {
    return null;
  }
}
function saveDeanCred(key: string, email: string, password: string) {
  localStorage.setItem(
    getDeanCredKey(key),
    JSON.stringify({ email, password }),
  );
}

function loadHodCred(key: string, branch: string): { password: string } | null {
  try {
    const raw = localStorage.getItem(getHodCredKey(key, branch));
    return raw ? (JSON.parse(raw) as { password: string }) : null;
  } catch {
    return null;
  }
}
function saveHodCred(key: string, branch: string, password: string) {
  localStorage.setItem(
    getHodCredKey(key, branch),
    JSON.stringify({ password }),
  );
}

export function loadStudentPassword(key: string, studentId: string): string {
  return localStorage.getItem(getStudentPwdKey(key, studentId)) ?? "student123";
}
export function saveStudentPassword(
  key: string,
  studentId: string,
  password: string,
) {
  localStorage.setItem(getStudentPwdKey(key, studentId), password);
}

// ─── Role meta ────────────────────────────────────────────────────────────────

type LoginRole = "student" | "hod" | "dean";

const ROLE_META: Record<
  LoginRole,
  {
    icon: React.ElementType;
    label: string;
    badgeLabel: string;
    infoBg: string;
    infoText: string;
    infoIcon: string;
  }
> = {
  student: {
    icon: GraduationCap,
    label: "Student Login",
    badgeLabel: "Student Portal",
    infoBg: "bg-blue-50 border-blue-200",
    infoText: "text-blue-700",
    infoIcon: "text-blue-600",
  },
  hod: {
    icon: Users,
    label: "HOD Login",
    badgeLabel: "Head of Department",
    infoBg: "bg-emerald-50 border-emerald-200",
    infoText: "text-emerald-700",
    infoIcon: "text-emerald-600",
  },
  dean: {
    icon: ShieldCheck,
    label: "Dean Login",
    badgeLabel: "Dean's Portal",
    infoBg: "bg-violet-50 border-violet-200",
    infoText: "text-violet-700",
    infoIcon: "text-violet-600",
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function PasswordInput({
  id,
  ocid,
  value,
  onChange,
  placeholder,
  autoComplete,
  show,
  onToggle,
}: {
  id: string;
  ocid: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        data-ocid={ocid}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        autoComplete={autoComplete}
        className="pr-10"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        data-ocid={`${ocid}.toggle`}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      data-ocid="login.error_state"
      className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3"
    >
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </motion.div>
  );
}

function SubmitButton({
  loading,
  label = "Sign In",
}: {
  loading: boolean;
  label?: string;
}) {
  return (
    <Button
      type="submit"
      data-ocid="login.submit_button"
      className="w-full font-semibold"
      disabled={loading}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          Signing in…
        </span>
      ) : (
        label
      )}
    </Button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as {
    collegeName?: string;
    role?: string;
  };
  const collegeName = params.collegeName
    ? decodeURIComponent(params.collegeName)
    : "";
  const role = (params.role ?? "student") as LoginRole;

  const { setCurrentUser, uploadedStudentRecords, hodUploadedRecords } =
    useAppContext();
  const ck = campusKey(collegeName);

  const config = getCollegeConfig(collegeName);
  const emailExample = getStudentEmailExample(collegeName);
  const emailDomain = config?.emailDomain ?? "rguktn.ac.in";
  const idPrefix = config?.studentPrefixes[0] ?? "n";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [branch, setBranch] = useState<Branch>("CSE");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deanMode, setDeanMode] = useState<"checking" | "setup" | "login">(
    "checking",
  );
  const [hodMode, setHodMode] = useState<"checking" | "setup" | "login">(
    "checking",
  );

  // Determine dean setup/login mode on mount
  useEffect(() => {
    if (role === "dean") {
      setDeanMode(loadDeanCred(ck) ? "login" : "setup");
    }
  }, [role, ck]);

  // Determine HOD setup/login mode whenever branch changes
  useEffect(() => {
    if (role === "hod") {
      setHodMode(loadHodCred(ck, branch) ? "login" : "setup");
      setPassword("");
      setConfirmPassword("");
      setError("");
    }
  }, [role, ck, branch]);

  const meta = ROLE_META[role] ?? ROLE_META.student;
  const Icon = meta.icon;

  // Show derived student ID hint when email format matches
  const derivedStudentId =
    email && isValidStudentEmail(email, collegeName)
      ? email.split("@")[0]
      : null;

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function handleStudentLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const allRecords = [...uploadedStudentRecords, ...hodUploadedRecords];

      // Allow login if college email format OR personal email found in uploaded data
      if (!isValidStudentEmail(email, collegeName)) {
        const foundInData = allRecords.find(
          (r) => r.email.toLowerCase() === email.toLowerCase(),
        );
        if (!foundInData) {
          setError(
            `Please use your ${collegeName} college or personal email. E.g., ${emailExample}`,
          );
          return;
        }
        const studentId = email.split("@")[0];
        const storedPassword = loadStudentPassword(ck, studentId);
        if (password !== storedPassword) {
          setError("Incorrect password.");
          return;
        }
        setCurrentUser({
          role: "student",
          campus: collegeName,
          college: collegeName,
          email,
        });
        navigate({ to: `/college/${encodeURIComponent(collegeName)}/student` });
        return;
      }

      const studentId = email.split("@")[0];
      const storedPassword = loadStudentPassword(ck, studentId);
      if (password !== storedPassword) {
        setError("Incorrect password.");
        return;
      }
      setCurrentUser({
        role: "student",
        campus: collegeName,
        college: collegeName,
        email,
      });
      navigate({ to: `/college/${encodeURIComponent(collegeName)}/student` });
    }, 600);
  }

  function handleHodLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const cred = loadHodCred(ck, branch);
      if (!cred) {
        setError("Account not set up yet. Please set your password first.");
        return;
      }
      if (password !== cred.password) {
        setError("Incorrect password.");
        return;
      }
      setCurrentUser({
        role: "hod",
        campus: collegeName,
        college: collegeName,
        branch,
        email: "",
      });
      navigate({
        to: `/college/${encodeURIComponent(collegeName)}/hod/${branch}`,
      });
    }, 600);
  }

  function handleDeanLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const cred = loadDeanCred(ck);
      if (!cred) {
        setError("Dean account not set up yet. Please set credentials first.");
        return;
      }
      if (email !== cred.email) {
        setError("Incorrect email.");
        return;
      }
      if (password !== cred.password) {
        setError("Incorrect password.");
        return;
      }
      setCurrentUser({
        role: "dean",
        campus: collegeName,
        college: collegeName,
        email,
      });
      navigate({ to: `/college/${encodeURIComponent(collegeName)}/dean` });
    }, 600);
  }

  function handleDeanSetup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    saveDeanCred(ck, email, password);
    setCurrentUser({
      role: "dean",
      campus: collegeName,
      college: collegeName,
      email,
    });
    navigate({ to: `/college/${encodeURIComponent(collegeName)}/dean` });
  }

  function handleHodSetup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    saveHodCred(ck, branch, password);
    setCurrentUser({
      role: "hod",
      campus: collegeName,
      college: collegeName,
      branch,
      email: "",
    });
    navigate({
      to: `/college/${encodeURIComponent(collegeName)}/hod/${branch}`,
    });
  }

  // ─── Form renderers ──────────────────────────────────────────────────────────

  function renderStudentForm() {
    return (
      <form onSubmit={handleStudentLogin} className="p-8 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email-input" className="font-medium text-foreground">
            College Email / Personal Email
          </Label>
          <Input
            id="email-input"
            data-ocid="login.email.input"
            type="email"
            placeholder={emailExample}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          {derivedStudentId && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="text-xs text-muted-foreground flex items-center gap-1.5"
            >
              <span>Student ID:</span>
              <span className="font-mono font-semibold text-primary bg-primary/8 px-1.5 py-0.5 rounded">
                {derivedStudentId}
              </span>
            </motion.p>
          )}
          <p className="text-xs text-muted-foreground">
            Format:{" "}
            <span className="font-mono">
              {idPrefix.toUpperCase()}&#60;6-digit roll&#62;@{emailDomain}
            </span>
          </p>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="password-input"
            className="font-medium text-foreground"
          >
            Password
          </Label>
          <PasswordInput
            id="password-input"
            ocid="login.password.input"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
            autoComplete="current-password"
            show={showPass}
            onToggle={() => setShowPass(!showPass)}
          />
          <p className="text-xs text-muted-foreground">
            Default:{" "}
            <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground/70">
              student123
            </span>
          </p>
        </div>

        {error && <ErrorAlert message={error} />}
        <SubmitButton loading={loading} />
      </form>
    );
  }

  function renderDeanSetupForm() {
    return (
      <form onSubmit={handleDeanSetup} className="p-8 space-y-5">
        <div
          className={`rounded-lg ${meta.infoBg} border p-3 flex items-start gap-2`}
        >
          <KeyRound className={`h-4 w-4 ${meta.infoIcon} mt-0.5 shrink-0`} />
          <p className={`text-sm ${meta.infoText}`}>
            First-time setup: Set your Dean email and password for{" "}
            <strong>{collegeName}</strong> campus.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email-input" className="font-medium">
            Dean Email
          </Label>
          <Input
            id="email-input"
            data-ocid="login.email.input"
            type="email"
            placeholder="dean@campus.ac.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password-input" className="font-medium">
            Set Password
          </Label>
          <PasswordInput
            id="password-input"
            ocid="login.password.input"
            value={password}
            onChange={setPassword}
            placeholder="Min. 6 characters"
            show={showPass}
            onToggle={() => setShowPass(!showPass)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-password-input" className="font-medium">
            Confirm Password
          </Label>
          <PasswordInput
            id="confirm-password-input"
            ocid="login.confirm_password.input"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Repeat password"
            show={showConfirmPass}
            onToggle={() => setShowConfirmPass(!showConfirmPass)}
          />
        </div>

        {error && <ErrorAlert message={error} />}
        <SubmitButton loading={false} label="Set Up Account & Login" />
      </form>
    );
  }

  function renderDeanLoginForm() {
    return (
      <form onSubmit={handleDeanLogin} className="p-8 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email-input" className="font-medium">
            Dean Email
          </Label>
          <Input
            id="email-input"
            data-ocid="login.email.input"
            type="email"
            placeholder="Your dean email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password-input" className="font-medium">
            Password
          </Label>
          <PasswordInput
            id="password-input"
            ocid="login.password.input"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
            autoComplete="current-password"
            show={showPass}
            onToggle={() => setShowPass(!showPass)}
          />
        </div>

        {error && <ErrorAlert message={error} />}
        <SubmitButton loading={loading} />

        <button
          type="button"
          onClick={() => {
            setDeanMode("setup");
            setEmail("");
            setPassword("");
            setError("");
          }}
          className="w-full text-xs text-muted-foreground hover:text-primary transition-colors text-center"
          data-ocid="login.reset_credentials.button"
        >
          Reset / change credentials
        </button>
      </form>
    );
  }

  function renderHodSetupForm() {
    return (
      <form onSubmit={handleHodSetup} className="space-y-4">
        <div
          className={`rounded-lg ${meta.infoBg} border p-3 flex items-start gap-2`}
        >
          <KeyRound className={`h-4 w-4 ${meta.infoIcon} mt-0.5 shrink-0`} />
          <p className={`text-sm ${meta.infoText}`}>
            First-time setup for <strong>{branch}</strong> HOD at {collegeName}.
            Set your password.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password-input" className="font-medium">
            Set Password
          </Label>
          <PasswordInput
            id="password-input"
            ocid="login.password.input"
            value={password}
            onChange={setPassword}
            placeholder="Min. 6 characters"
            show={showPass}
            onToggle={() => setShowPass(!showPass)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-password-input" className="font-medium">
            Confirm Password
          </Label>
          <PasswordInput
            id="confirm-password-input"
            ocid="login.confirm_password.input"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Repeat password"
            show={showConfirmPass}
            onToggle={() => setShowConfirmPass(!showConfirmPass)}
          />
        </div>

        {error && <ErrorAlert message={error} />}
        <SubmitButton loading={false} label="Set Up Account & Login" />
      </form>
    );
  }

  function renderHodLoginForm() {
    return (
      <form onSubmit={handleHodLogin} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password-input" className="font-medium">
            Password
          </Label>
          <PasswordInput
            id="password-input"
            ocid="login.password.input"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
            autoComplete="current-password"
            show={showPass}
            onToggle={() => setShowPass(!showPass)}
          />
        </div>

        {error && <ErrorAlert message={error} />}
        <SubmitButton loading={loading} />

        <button
          type="button"
          onClick={() => {
            setHodMode("setup");
            setPassword("");
            setConfirmPassword("");
            setError("");
          }}
          className="w-full text-xs text-muted-foreground hover:text-primary transition-colors text-center"
          data-ocid="login.reset_password.button"
        >
          Reset / change password
        </button>
      </form>
    );
  }

  function renderForm() {
    if (role === "dean") {
      if (deanMode === "checking") {
        return (
          <div className="p-8 text-center py-10">
            <span className="inline-block h-5 w-5 border-2 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        );
      }
      return deanMode === "setup"
        ? renderDeanSetupForm()
        : renderDeanLoginForm();
    }

    if (role === "hod") {
      return (
        <div className="p-8 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="branch-select" className="font-medium">
              Department / Branch
            </Label>
            <Select
              value={branch}
              onValueChange={(v) => setBranch(v as Branch)}
            >
              <SelectTrigger id="branch-select" data-ocid="login.branch.select">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {BRANCHES.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hodMode === "checking" && (
            <div className="text-center py-4">
              <span className="inline-block h-5 w-5 border-2 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          )}
          {hodMode === "setup" && renderHodSetupForm()}
          {hodMode === "login" && renderHodLoginForm()}
        </div>
      );
    }

    return renderStudentForm();
  }

  // ─── Page layout ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header
        className="text-white"
        style={{
          background:
            "linear-gradient(90deg, oklch(0.16 0.09 264) 0%, oklch(0.24 0.12 264) 100%)",
          borderBottom: "1px solid oklch(0.35 0.10 264 / 0.60)",
        }}
      >
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              navigate({ to: `/college/${encodeURIComponent(collegeName)}` })
            }
            className="text-white hover:bg-white/20 gap-2"
            data-ocid="login.back.button"
            aria-label="Back to role selection"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="h-5 w-px bg-white/25" />
          <GraduationCap
            className="h-5 w-5"
            style={{ color: "oklch(0.88 0.12 85)" }}
          />
          <span className="font-display font-bold text-xl tracking-tight">
            NPTEL Portal
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6 bg-muted/30">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Campus label */}
          <p className="text-center text-sm text-muted-foreground mb-3 font-medium tracking-wide uppercase">
            {collegeName}
          </p>

          <div className="rounded-2xl border border-border bg-card shadow-md overflow-hidden">
            {/* Card header */}
            <div
              className="px-8 py-7 text-white flex flex-col items-center gap-3"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.20 0.09 264) 0%, oklch(0.34 0.13 264) 100%)",
              }}
            >
              <div className="relative">
                <div className="h-14 w-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <Icon className="h-7 w-7 text-white" />
                </div>
                {/* Gold accent dot */}
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2"
                  style={{
                    background: "oklch(0.78 0.14 85)",
                    borderColor: "oklch(0.26 0.10 264)",
                  }}
                />
              </div>
              <div className="text-center">
                <h1 className="font-display text-2xl font-bold leading-tight">
                  {meta.label}
                </h1>
                <span className="inline-block mt-1 text-xs font-medium tracking-widest uppercase text-white/60 bg-white/10 px-3 py-0.5 rounded-full">
                  {meta.badgeLabel}
                </span>
              </div>
            </div>

            {/* Gold divider */}
            <div
              className="h-0.5"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, oklch(0.78 0.14 85) 50%, transparent 100%)",
              }}
            />

            {/* Form body */}
            {renderForm()}
          </div>

          {/* Change campus link */}
          <p className="text-center mt-4 text-xs text-muted-foreground">
            Not your campus?{" "}
            <button
              type="button"
              onClick={() => navigate({ to: "/portal" })}
              className="text-primary hover:underline font-medium"
              data-ocid="login.change_campus.link"
            >
              Change campus
            </button>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
