import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { BRANCHES, type Branch } from "../data/mockData";

function getYearLabel(value: string): string {
  return value;
}

const ROLES = [
  {
    id: "student",
    label: "Student",
    icon: GraduationCap,
    description: "View your enrollment and exam details",
    badge: "Read-only access",
    gradientFrom: "oklch(0.32 0.18 264)",
    gradientTo: "oklch(0.50 0.22 264)",
    glowColor: "oklch(0.40 0.18 264 / 0.38)",
    borderColor: "oklch(0.50 0.18 264 / 0.45)",
  },
  {
    id: "hod",
    label: "HOD",
    icon: Users,
    description: "Manage department registrations and errors",
    badge: "Department access",
    gradientFrom: "oklch(0.32 0.18 155)",
    gradientTo: "oklch(0.50 0.18 165)",
    glowColor: "oklch(0.40 0.16 160 / 0.38)",
    borderColor: "oklch(0.50 0.16 160 / 0.45)",
  },
  {
    id: "dean",
    label: "Dean",
    icon: ShieldCheck,
    description: "Campus-wide oversight and file management",
    badge: "Full access",
    gradientFrom: "oklch(0.32 0.20 295)",
    gradientTo: "oklch(0.50 0.22 305)",
    glowColor: "oklch(0.40 0.20 300 / 0.38)",
    borderColor: "oklch(0.50 0.20 300 / 0.45)",
  },
] as const;

export default function CollegeSelectPage() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { collegeName?: string };
  const collegeName = params.collegeName
    ? decodeURIComponent(params.collegeName)
    : "";
  const { selectedAcademicYear } = useAppContext();

  const [hodBranch, setHodBranch] = useState<Branch>("CSE");
  const [showBranchPicker, setShowBranchPicker] = useState(false);

  function handleRoleSelect(roleId: string) {
    if (roleId === "hod") {
      setShowBranchPicker(true);
      return;
    }
    navigate({
      to: `/college/${encodeURIComponent(collegeName)}/login/${roleId}`,
    });
  }

  function handleHodBranchConfirm() {
    navigate({
      to: `/college/${encodeURIComponent(collegeName)}/login/hod`,
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header
        className="sticky top-0 z-20 text-white"
        style={{
          background:
            "linear-gradient(90deg, oklch(0.16 0.09 264) 0%, oklch(0.24 0.12 264) 100%)",
          borderBottom: "1px solid oklch(0.35 0.10 264 / 0.60)",
        }}
      >
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/portal" })}
            className="text-white hover:bg-white/20 gap-1.5"
            data-ocid="college.back.button"
            aria-label="Back to campus selection"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="h-5 w-px bg-white/25" />
          <div className="flex items-center gap-2">
            <BookOpen
              className="h-5 w-5"
              style={{ color: "oklch(0.88 0.12 85)" }}
            />
            <span className="font-display font-bold text-lg">NPTEL Portal</span>
          </div>
          {selectedAcademicYear && (
            <span
              className="ml-auto text-xs font-semibold px-3 py-1 rounded-full"
              style={{
                background: "oklch(0.78 0.14 85 / 0.16)",
                border: "1px solid oklch(0.78 0.14 85 / 0.40)",
                color: "oklch(0.92 0.12 85)",
              }}
            >
              {getYearLabel(selectedAcademicYear)}
            </span>
          )}
        </div>
      </header>

      {/* Hero strip */}
      <div
        className="relative overflow-hidden py-12 text-white text-center"
        style={{
          background:
            "linear-gradient(150deg, oklch(0.14 0.08 264) 0%, oklch(0.28 0.12 264) 55%, oklch(0.38 0.14 264) 100%)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 55% 65% at 15% 40%, oklch(0.52 0.20 264 / 0.18) 0%, transparent 60%)",
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: "oklch(0.60 0.10 264)" }}
          >
            RGUKT — College Portal
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">
            {collegeName}
          </h1>
          <p className="mt-2 text-sm" style={{ color: "oklch(0.70 0.08 264)" }}>
            Select your role to continue
          </p>
        </motion.div>
      </div>

      {/* Role selection */}
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Branch picker overlay for HOD */}
          {showBranchPicker && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-xl border border-border bg-card p-6 shadow-md"
            >
              <h2 className="font-display text-lg font-bold text-foreground mb-1">
                Select Department / Branch
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Choose your branch to continue to the HOD login
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                <div className="flex-1 space-y-1.5">
                  <label
                    htmlFor="hod-branch-select"
                    className="text-sm font-medium text-foreground"
                  >
                    Branch
                  </label>
                  <Select
                    value={hodBranch}
                    onValueChange={(v) => setHodBranch(v as Branch)}
                  >
                    <SelectTrigger
                      id="hod-branch-select"
                      data-ocid="college.hod.branch.select"
                      className="w-full"
                    >
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
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowBranchPicker(false)}
                    data-ocid="college.hod.cancel.button"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleHodBranchConfirm}
                    data-ocid="college.hod.confirm.button"
                    className="gap-1.5"
                  >
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ROLES.map((role, idx) => {
              const Icon = role.icon;
              const isHodSelected = role.id === "hod" && showBranchPicker;
              return (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <button
                    type="button"
                    data-ocid={`college.role.button.${idx + 1}`}
                    onClick={() => handleRoleSelect(role.id)}
                    className="group w-full text-left rounded-xl border bg-card shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    style={{
                      borderColor: isHodSelected ? role.borderColor : undefined,
                    }}
                  >
                    {/* Gradient icon area */}
                    <div
                      className="px-8 py-9 flex flex-col items-center justify-center gap-3"
                      style={{
                        background: `linear-gradient(135deg, ${role.gradientFrom} 0%, ${role.gradientTo} 100%)`,
                      }}
                    >
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{
                          background: "oklch(1 0 0 / 0.12)",
                          boxShadow: `0 0 28px ${role.glowColor}`,
                          border: "1px solid oklch(1 0 0 / 0.20)",
                        }}
                      >
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <span className="font-display font-bold text-xl text-white">
                        {role.label}
                      </span>
                    </div>

                    {/* Details area */}
                    <div className="p-5">
                      <span className="inline-block text-xs bg-secondary text-secondary-foreground rounded-full px-2.5 py-0.5 font-medium mb-2">
                        {role.badge}
                      </span>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {role.description}
                      </p>
                      <div className="flex items-center gap-1 mt-3 text-sm font-semibold text-primary">
                        Select
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
