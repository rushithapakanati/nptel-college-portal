import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  GraduationCap,
  MapPin,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useAppContext } from "../context/AppContext";
const CAMPUS_CARDS = [
  {
    name: "Nuzvid",
    abbr: "NUZ",
    location: "Nuzvid, Andhra Pradesh",
    gradientFrom: "oklch(0.30 0.16 264)",
    gradientTo: "oklch(0.48 0.20 264)",
    glowColor: "oklch(0.38 0.18 264 / 0.40)",
    accentHue: 264,
  },
  {
    name: "Srikakulam",
    abbr: "SKL",
    location: "Srikakulam, Andhra Pradesh",
    gradientFrom: "oklch(0.30 0.16 250)",
    gradientTo: "oklch(0.48 0.18 240)",
    glowColor: "oklch(0.38 0.16 245 / 0.40)",
    accentHue: 248,
  },
  {
    name: "RK Valley",
    abbr: "RKV",
    location: "Idupulapaya, Andhra Pradesh",
    gradientFrom: "oklch(0.30 0.16 275)",
    gradientTo: "oklch(0.48 0.20 285)",
    glowColor: "oklch(0.38 0.18 280 / 0.40)",
    accentHue: 278,
  },
  {
    name: "Ongole",
    abbr: "ONG",
    location: "Ongole, Andhra Pradesh",
    gradientFrom: "oklch(0.30 0.14 235)",
    gradientTo: "oklch(0.46 0.16 220)",
    glowColor: "oklch(0.36 0.14 228 / 0.40)",
    accentHue: 228,
  },
] as const;

function getYearLabel(value: string): string {
  return value;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function PortalPage() {
  const navigate = useNavigate();
  const { selectedAcademicYear } = useAppContext();

  // Redirect to home if no year selected (direct URL access)
  useEffect(() => {
    if (!selectedAcademicYear) {
      navigate({ to: "/" });
    }
  }, [selectedAcademicYear, navigate]);

  function handleCampusClick(campusName: string) {
    navigate({ to: `/college/${encodeURIComponent(campusName)}` });
  }

  if (!selectedAcademicYear) return null;

  return (
    <div className="min-h-screen flex flex-col">
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
            onClick={() => navigate({ to: "/" })}
            className="text-white hover:bg-white/20 gap-1.5"
            data-ocid="portal.back.button"
            aria-label="Back to year selection"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="h-5 w-px bg-white/25" />
          <div className="flex items-center gap-2">
            <GraduationCap
              className="h-6 w-6"
              style={{ color: "oklch(0.88 0.14 85)" }}
            />
            <span className="font-display font-bold text-lg tracking-tight">
              NPTEL Portal
            </span>
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

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(150deg, oklch(0.14 0.08 264) 0%, oklch(0.26 0.12 264) 55%, oklch(0.36 0.14 264) 100%)",
          minHeight: "260px",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 55% 65% at 20% 50%, oklch(0.52 0.20 264 / 0.20) 0%, transparent 60%),
              radial-gradient(ellipse 45% 50% at 82% 20%, oklch(0.78 0.15 85 / 0.14) 0%, transparent 50%)
            `,
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(oklch(1 0 0 / 1) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="container mx-auto px-4 py-14 relative z-10 text-white text-center">
          <motion.div
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-5"
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(145deg, oklch(0.28 0.18 264) 0%, oklch(0.46 0.22 264) 100%)",
                boxShadow:
                  "0 0 0 4px oklch(0.75 0.16 85), 0 0 44px oklch(0.40 0.18 264 / 0.55)",
              }}
            >
              <GraduationCap
                className="h-10 w-10"
                style={{ color: "oklch(0.96 0.10 85)" }}
              />
            </div>

            <div>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                WELCOME TO{" "}
                <span style={{ color: "oklch(0.88 0.16 85)" }}>
                  RGUKT NPTEL WEBSITE
                </span>
              </h1>
              <p
                className="mt-3 text-base font-medium"
                style={{ color: "oklch(0.68 0.10 264)" }}
              >
                {getYearLabel(selectedAcademicYear)} — Select Your Campus
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Campus cards */}
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="text-center mb-10">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Select Your Campus
                </h2>
              </div>
              <p className="text-muted-foreground text-sm">
                Choose your RGUKT institution to access the NPTEL portal
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {CAMPUS_CARDS.map((campus, idx) => (
                <motion.div key={campus.name} variants={itemVariants}>
                  <button
                    type="button"
                    data-ocid={`portal.campus.button.${idx + 1}`}
                    onClick={() => handleCampusClick(campus.name)}
                    className="group w-full text-left rounded-xl border border-border bg-card shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {/* Color top bar */}
                    <div
                      className="h-1.5 w-full"
                      style={{
                        background: `linear-gradient(90deg, ${campus.gradientFrom} 0%, oklch(0.75 0.14 85) 100%)`,
                      }}
                    />
                    <div className="p-6">
                      {/* Abbr badge */}
                      <div
                        className="inline-flex items-center justify-center w-14 h-14 rounded-xl text-white font-display font-bold text-lg mb-4"
                        style={{
                          background: `linear-gradient(135deg, ${campus.gradientFrom} 0%, ${campus.gradientTo} 100%)`,
                          boxShadow: `0 4px 16px ${campus.glowColor}`,
                        }}
                      >
                        {campus.abbr}
                      </div>

                      <h3 className="font-display font-bold text-xl mb-1 text-foreground group-hover:text-primary transition-colors">
                        {campus.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {campus.location}
                      </p>
                      <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                        Access Portal
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
