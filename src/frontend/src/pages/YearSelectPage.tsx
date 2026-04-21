import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { ACADEMIC_YEARS } from "../data/mockData";

// Map raw values to display labels
const YEAR_OPTIONS: { label: string; value: string }[] = ACADEMIC_YEARS.map(
  (y) => ({ label: y, value: y.toLowerCase().replace(/\s+/g, "-") }),
);

export default function YearSelectPage() {
  const { setSelectedAcademicYear } = useAppContext();
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<string>("");

  function handleEnterPortal() {
    if (!selectedYear) return;
    setSelectedAcademicYear(selectedYear);
    navigate({ to: "/portal" });
  }

  function handleYearChange(value: string) {
    setSelectedYear(value);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.12 0.07 264) 0%, oklch(0.18 0.10 264) 45%, oklch(0.26 0.12 264) 100%)",
      }}
    >
      {/* Animated radial gradient glows */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 65% 55% at 15% 35%, oklch(0.50 0.22 264 / 0.20) 0%, transparent 60%),
            radial-gradient(ellipse 50% 45% at 85% 20%, oklch(0.78 0.16 85 / 0.16) 0%, transparent 55%),
            radial-gradient(ellipse 75% 45% at 50% 95%, oklch(0.40 0.14 264 / 0.15) 0%, transparent 55%)
          `,
          animation: "pulse 8s ease-in-out infinite alternate",
        }}
      />

      {/* Grid overlay pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(oklch(1 0 0 / 1) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 44 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center gap-7 w-full max-w-lg px-6"
      >
        {/* Logo Icon */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "backOut" }}
        >
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background:
                "linear-gradient(145deg, oklch(0.28 0.18 264) 0%, oklch(0.46 0.22 264) 100%)",
              boxShadow:
                "0 0 0 4px oklch(0.75 0.16 85), 0 0 56px oklch(0.42 0.22 264 / 0.60), 0 8px 32px oklch(0.08 0.05 264 / 0.65)",
            }}
          >
            <GraduationCap
              className="h-12 w-12"
              style={{ color: "oklch(0.97 0.10 85)" }}
            />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.22 }}
          className="text-center space-y-2"
        >
          <h1
            className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight leading-tight"
            style={{ color: "oklch(0.97 0.04 85)" }}
          >
            WELCOME TO RGUKT NPTEL WEBSITE
          </h1>
          <p
            className="text-base font-semibold tracking-widest uppercase"
            style={{ color: "oklch(0.62 0.10 264)" }}
          >
            RGUKT NPTEL PORTAL
          </p>
        </motion.div>

        {/* Year selector card */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.34 }}
          className="w-full rounded-2xl p-7 flex flex-col gap-5"
          style={{
            background: "oklch(0.16 0.07 264 / 0.90)",
            border: "1px solid oklch(0.40 0.10 264 / 0.50)",
            boxShadow:
              "0 8px 48px oklch(0.10 0.06 264 / 0.55), 0 1px 0 oklch(0.50 0.14 264 / 0.20) inset",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="text-center">
            <p
              className="text-sm font-medium"
              style={{ color: "oklch(0.65 0.08 264)" }}
            >
              Select Academic Year &amp; Semester to Access the Portal
            </p>
          </div>

          <Select value={selectedYear} onValueChange={handleYearChange}>
            <SelectTrigger
              id="academic-year-select"
              data-ocid="yearselect.select"
              className="w-full h-12 text-base font-semibold"
              style={{
                background: "oklch(0.22 0.09 264 / 0.90)",
                borderColor: "oklch(0.42 0.12 264 / 0.65)",
                color: selectedYear
                  ? "oklch(0.97 0.04 85)"
                  : "oklch(0.55 0.07 264)",
              }}
            >
              <SelectValue placeholder="Select Academic Year / Semester" />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((yr) => (
                <SelectItem
                  key={yr.value}
                  value={yr.value}
                  className="text-base font-medium"
                >
                  {yr.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            type="button"
            data-ocid="yearselect.enter_button"
            disabled={!selectedYear}
            onClick={handleEnterPortal}
            className="w-full h-12 rounded-lg font-display font-bold text-base tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={
              selectedYear
                ? {
                    background:
                      "linear-gradient(135deg, oklch(0.42 0.18 264) 0%, oklch(0.55 0.20 264) 100%)",
                    color: "oklch(0.97 0.04 85)",
                    boxShadow:
                      "0 4px 20px oklch(0.42 0.18 264 / 0.55), 0 1px 0 oklch(1 0 0 / 0.12) inset",
                  }
                : {
                    background: "oklch(0.28 0.07 264 / 0.70)",
                    color: "oklch(0.55 0.07 264)",
                    border: "1px solid oklch(0.38 0.08 264 / 0.50)",
                  }
            }
          >
            Enter Portal
          </button>

          <p
            className="text-xs text-center"
            style={{ color: "oklch(0.48 0.06 264)" }}
          >
            Each semester maintains its own separate database
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
