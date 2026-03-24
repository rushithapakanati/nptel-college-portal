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
  getStudentEmailDomain,
  getStudentEmailExample,
  getStudentEmailPattern,
  getStudentIdPrefix,
} from "../data/mockData";

// ─── localStorage helpers ────────────────────────────────────────────────────

function getDeanCredKey(campusKey: string) {
  return `nptel_dean_cred_${campusKey}`;
}
function getHodCredKey(campusKey: string, branch: string) {
  return `nptel_hod_cred_${campusKey}_${branch}`;
}
function getStudentPwdKey(campusKey: string, studentId: string) {
  return `nptel_student_pwd_${campusKey}_${studentId}`;
}

function normalizeCampusKey(name: string) {
  return name.toLowerCase().trim();
}

function loadDeanCred(
  campusKey: string,
): { email: string; password: string } | null {
  try {
    const raw = localStorage.getItem(getDeanCredKey(campusKey));
    if (!raw) return null;
    return JSON.parse(raw) as { email: string; password: string };
  } catch {
    return null;
  }
}
function saveDeanCred(campusKey: string, email: string, password: string) {
  localStorage.setItem(
    getDeanCredKey(campusKey),
    JSON.stringify({ email, password }),
  );
}

function loadHodCred(
  campusKey: string,
  branch: string,
): { password: string } | null {
  try {
    const raw = localStorage.getItem(getHodCredKey(campusKey, branch));
    if (!raw) return null;
    return JSON.parse(raw) as { password: string };
  } catch {
    return null;
  }
}
function saveHodCred(campusKey: string, branch: string, password: string) {
  localStorage.setItem(
    getHodCredKey(campusKey, branch),
    JSON.stringify({ password }),
  );
}

export function loadStudentPassword(
  campusKey: string,
  studentId: string,
): string {
  return (
    localStorage.getItem(getStudentPwdKey(campusKey, studentId)) ?? "student123"
  );
}
export function saveStudentPassword(
  campusKey: string,
  studentId: string,
  password: string,
) {
  localStorage.setItem(getStudentPwdKey(campusKey, studentId), password);
}

// ─── Role meta ───────────────────────────────────────────────────────────────

const ROLE_META = {
  student: {
    icon: GraduationCap,
    label: "Student Login",
    color: "from-blue-600 to-indigo-700",
  },
  hod: {
    icon: Users,
    label: "HOD Login",
    color: "from-emerald-600 to-teal-700",
  },
  dean: {
    icon: ShieldCheck,
    label: "Dean Login",
    color: "from-violet-600 to-purple-700",
  },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as {
    collegeName?: string;
    role?: string;
  };
  const collegeName = params.collegeName
    ? decodeURIComponent(params.collegeName)
    : "";
  const role = (params.role ?? "student") as "student" | "hod" | "dean";

  const { setCurrentUser, uploadedStudentRecords, hodUploadedRecords } =
    useAppContext();

  const campusKey = normalizeCampusKey(collegeName);

  // ── Campus helpers ──
  const emailPattern = getStudentEmailPattern(collegeName);
  const emailExample = getStudentEmailExample(collegeName);
  const emailDomain = getStudentEmailDomain(collegeName);
  const idPrefix = getStudentIdPrefix(collegeName);

  // ── Common form state ──
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [branch, setBranch] = useState<Branch>("CSE");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Setup form state (for first-time setup) ──
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // ── Account setup status ──
  // "checking" while we check localStorage, "setup" if no credentials found, "login" if found
  const [deanSetupMode, setDeanSetupMode] = useState<
    "checking" | "setup" | "login"
  >("checking");
  const [hodSetupMode, setHodSetupMode] = useState<
    "checking" | "setup" | "login"
  >("checking");

  // Initialize setup mode for dean on mount
  useEffect(() => {
    if (role === "dean") {
      const cred = loadDeanCred(campusKey);
      setDeanSetupMode(cred ? "login" : "setup");
    }
  }, [role, campusKey]);

  // Initialize setup mode for HOD when branch changes
  useEffect(() => {
    if (role === "hod") {
      const cred = loadHodCred(campusKey, branch);
      setHodSetupMode(cred ? "login" : "setup");
      // Clear form
      setPassword("");
      setConfirmPassword("");
      setError("");
    }
  }, [role, campusKey, branch]);

  const meta = ROLE_META[role] ?? ROLE_META.student;
  const Icon = meta.icon;

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      if (role === "student") {
        // Validate email format for the specific campus
        if (!emailPattern.test(email)) {
          // Fallback: check if the email exists in uploaded data (personal email support)
          const allRecords = [...uploadedStudentRecords, ...hodUploadedRecords];
          const foundInData = allRecords.find(
            (r) => r.email.toLowerCase() === email.toLowerCase(),
          );
          if (!foundInData) {
            setError(
              `Please use your ${collegeName} college/personal email (e.g., ${emailExample})`,
            );
            return;
          }
          // Found in uploaded data — allow login with personal email
          const studentId = email.split("@")[0];
          const storedPassword = loadStudentPassword(campusKey, studentId);
          if (password !== storedPassword) {
            setError("Incorrect password.");
            return;
          }
          setCurrentUser({ role: "student", college: collegeName, email });
          navigate({
            to: `/college/${encodeURIComponent(collegeName)}/student`,
          });
          return;
        }
        const studentId = email.split("@")[0];
        // emailPattern already validates prefix; skip redundant startsWith check
        // so double-prefixes like rr, rs, ro also pass
        const storedPassword = loadStudentPassword(campusKey, studentId);
        if (password !== storedPassword) {
          setError("Incorrect password.");
          return;
        }
        setCurrentUser({ role: "student", college: collegeName, email });
        navigate({ to: `/college/${encodeURIComponent(collegeName)}/student` });
      } else if (role === "hod") {
        const cred = loadHodCred(campusKey, branch);
        if (!cred) {
          setError("Account not set up yet. Please set your password first.");
          return;
        }
        if (password !== cred.password) {
          setError("Incorrect password.");
          return;
        }
        setCurrentUser({ role: "hod", college: collegeName, branch });
        navigate({
          to: `/college/${encodeURIComponent(collegeName)}/hod/${branch}`,
        });
      } else if (role === "dean") {
        const cred = loadDeanCred(campusKey);
        if (!cred) {
          setError(
            "Dean account not set up yet. Please set your credentials first.",
          );
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
        setCurrentUser({ role: "dean", college: collegeName, email });
        navigate({ to: `/college/${encodeURIComponent(collegeName)}/dean` });
      }
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
    saveDeanCred(campusKey, email, password);
    setDeanSetupMode("login");
    setCurrentUser({ role: "dean", college: collegeName, email });
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
    saveHodCred(campusKey, branch, password);
    setHodSetupMode("login");
    setCurrentUser({ role: "hod", college: collegeName, branch });
    navigate({
      to: `/college/${encodeURIComponent(collegeName)}/hod/${branch}`,
    });
  }

  // Render the appropriate form based on role and setup state
  function renderForm() {
    // ── Dean ──
    if (role === "dean") {
      if (deanSetupMode === "checking") {
        return (
          <div className="text-sm text-muted-foreground text-center py-4">
            Loading...
          </div>
        );
      }
      if (deanSetupMode === "setup") {
        return (
          <form onSubmit={handleDeanSetup} className="p-8 space-y-5">
            <div className="rounded-lg bg-violet-50 border border-violet-200 p-3 flex items-start gap-2">
              <KeyRound className="h-4 w-4 text-violet-600 mt-0.5 shrink-0" />
              <p className="text-sm text-violet-700">
                First-time setup: Set your Dean email and password for{" "}
                {collegeName} campus.
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
              <div className="relative">
                <Input
                  id="password-input"
                  data-ocid="login.password.input"
                  type={showPass ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  data-ocid="login.password.toggle"
                >
                  {showPass ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password-input" className="font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password-input"
                  data-ocid="login.confirm_password.input"
                  type={showConfirmPass ? "text" : "password"}
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPass ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                data-ocid="login.error_state"
                className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              data-ocid="login.submit_button"
              className="w-full"
            >
              Set Up Account &amp; Login
            </Button>
          </form>
        );
      }
      // dean login mode
      return (
        <form onSubmit={handleLogin} className="p-8 space-y-5">
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
            <div className="relative">
              <Input
                id="password-input"
                data-ocid="login.password.input"
                type={showPass ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                data-ocid="login.password.toggle"
              >
                {showPass ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div
              data-ocid="login.error_state"
              className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            data-ocid="login.submit_button"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in…
              </span>
            ) : (
              "Sign In"
            )}
          </Button>

          <button
            type="button"
            onClick={() => {
              setDeanSetupMode("setup");
              setEmail("");
              setPassword("");
              setError("");
            }}
            className="w-full text-xs text-muted-foreground hover:text-primary transition-colors text-center"
          >
            Reset / change credentials
          </button>
        </form>
      );
    }

    // ── HOD ──
    if (role === "hod") {
      return (
        <div className="p-8 space-y-5">
          {/* Branch select always shown */}
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

          {hodSetupMode === "checking" && (
            <div className="text-sm text-muted-foreground text-center py-4">
              Loading...
            </div>
          )}

          {hodSetupMode === "setup" && (
            <form onSubmit={handleHodSetup} className="space-y-4">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-start gap-2">
                <KeyRound className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-sm text-emerald-700">
                  First-time setup for {branch} HOD at {collegeName}. Set your
                  password.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password-input" className="font-medium">
                  Set Password
                </Label>
                <div className="relative">
                  <Input
                    id="password-input"
                    data-ocid="login.password.input"
                    type={showPass ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    data-ocid="login.password.toggle"
                  >
                    {showPass ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password-input" className="font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password-input"
                    data-ocid="login.confirm_password.input"
                    type={showConfirmPass ? "text" : "password"}
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPass ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  data-ocid="login.error_state"
                  className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                data-ocid="login.submit_button"
                className="w-full"
              >
                Set Up Account &amp; Login
              </Button>
            </form>
          )}

          {hodSetupMode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password-input" className="font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password-input"
                    data-ocid="login.password.input"
                    type={showPass ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    data-ocid="login.password.toggle"
                  >
                    {showPass ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  data-ocid="login.error_state"
                  className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                data-ocid="login.submit_button"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setHodSetupMode("setup");
                  setPassword("");
                  setConfirmPassword("");
                  setError("");
                }}
                className="w-full text-xs text-muted-foreground hover:text-primary transition-colors text-center"
              >
                Reset / change password
              </button>
            </form>
          )}
        </div>
      );
    }

    // ── Student ──
    return (
      <form onSubmit={handleLogin} className="p-8 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email-input" className="font-medium">
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
          {email && emailPattern.test(email) && (
            <p className="text-xs text-muted-foreground">
              Student ID:{" "}
              <span className="font-mono font-medium text-foreground">
                {email.split("@")[0]}
              </span>
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Format:{" "}
            <span className="font-mono">
              {idPrefix.toUpperCase()}&lt;6-digit roll number&gt;@{emailDomain}
            </span>
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password-input" className="font-medium">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password-input"
              data-ocid="login.password.input"
              type={showPass ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="login.password.toggle"
            >
              {showPass ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Default password is <span className="font-mono">student123</span>.
            You can change it after logging in.
          </p>
        </div>

        {error && (
          <div
            data-ocid="login.error_state"
            className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          data-ocid="login.submit_button"
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in…
            </span>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>
    );
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
            data-ocid="login.back.button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="h-5 w-px bg-white/30" />
          <span className="font-display font-bold text-xl">NPTEL Portal</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl border border-border bg-card shadow-nptel-card overflow-hidden">
            {/* Card header with gradient */}
            <div
              className={`bg-gradient-to-br ${meta.color} p-8 text-white text-center`}
            >
              <Icon className="h-12 w-12 mx-auto mb-3" />
              <h1 className="font-display text-2xl font-bold">{meta.label}</h1>
              <p className="text-white/75 text-sm mt-1">{collegeName}</p>
            </div>

            {renderForm()}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
