import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "@tanstack/react-router";
import { CalendarDays, GraduationCap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useAppContext } from "../context/AppContext";

const ACADEMIC_YEARS = [
  { value: "2026-sem1", label: "2026 Sem-1" },
  { value: "2026-sem2", label: "2026 Sem-2" },
];

export default function YearSelectPage() {
  const { setSelectedAcademicYear } = useAppContext();
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<string>("");

  function handleProceed() {
    if (!selectedYear) return;
    setSelectedAcademicYear(selectedYear);
    navigate({ to: "/portal" });
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.15 0.07 264) 0%, oklch(0.22 0.10 264) 40%, oklch(0.30 0.13 264) 100%)",
      }}
    >
      {/* Decorative radial glows */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 15% 40%, oklch(0.55 0.18 264 / 0.18) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 20%, oklch(0.75 0.16 85 / 0.12) 0%, transparent 45%),
            radial-gradient(ellipse at 50% 90%, oklch(0.45 0.14 264 / 0.10) 0%, transparent 50%)
          `,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center gap-8 w-full max-w-md px-6"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex items-center justify-center"
        >
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl border-4"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.35 0.15 264) 0%, oklch(0.50 0.18 264) 100%)",
              borderColor: "oklch(0.80 0.16 85)",
              boxShadow:
                "0 0 40px oklch(0.55 0.18 264 / 0.5), 0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            <GraduationCap className="h-12 w-12 text-yellow-300" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-center"
        >
          <h1
            className="font-display font-bold text-3xl sm:text-4xl tracking-tight leading-tight"
            style={{ color: "oklch(0.97 0.02 85)" }}
          >
            RGUKT NPTEL PORTAL
          </h1>
          <p
            className="mt-3 text-base font-medium"
            style={{ color: "oklch(0.75 0.08 264)" }}
          >
            Select Academic Year to Continue
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.35 }}
          className="w-full rounded-2xl p-8 flex flex-col gap-6"
          style={{
            background: "oklch(0.20 0.07 264 / 0.85)",
            border: "1px solid oklch(0.40 0.10 264 / 0.5)",
            boxShadow:
              "0 4px 40px oklch(0.15 0.07 264 / 0.6), 0 1px 0 oklch(0.45 0.12 264 / 0.2) inset",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="academic-year-select"
              className="flex items-center gap-2 text-sm font-semibold"
              style={{ color: "oklch(0.80 0.10 264)" }}
            >
              <CalendarDays className="h-4 w-4" />
              Academic Year
            </Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger
                id="academic-year-select"
                data-ocid="yearselect.select"
                className="w-full h-12 text-base"
                style={{
                  background: "oklch(0.25 0.08 264 / 0.8)",
                  borderColor: "oklch(0.42 0.12 264 / 0.6)",
                  color: selectedYear
                    ? "oklch(0.95 0.03 85)"
                    : "oklch(0.60 0.07 264)",
                }}
              >
                <SelectValue placeholder="Choose a semester..." />
              </SelectTrigger>
              <SelectContent>
                {ACADEMIC_YEARS.map((yr) => (
                  <SelectItem key={yr.value} value={yr.value}>
                    {yr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            data-ocid="yearselect.primary_button"
            onClick={handleProceed}
            disabled={!selectedYear}
            className="w-full h-12 text-base font-bold tracking-wide transition-all duration-200"
            style={{
              background: selectedYear
                ? "linear-gradient(90deg, oklch(0.45 0.18 264) 0%, oklch(0.52 0.20 264) 100%)"
                : undefined,
            }}
          >
            Proceed to Portal
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
