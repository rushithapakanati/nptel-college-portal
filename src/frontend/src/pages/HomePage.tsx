import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { Building2, ChevronRight, GraduationCap } from "lucide-react";
import { motion } from "motion/react";
import { COLLEGES } from "../data/mockData";

const COLLEGE_INFO = [
  { name: "Nuzvid", abbr: "NUZ" },
  { name: "Srikakulam", abbr: "SKL" },
  { name: "RK Valley", abbr: "RKV" },
  { name: "Ongole", abbr: "ONG" },
];

export default function HomePage() {
  const navigate = useNavigate();

  function handleCollegeClick(college: string) {
    navigate({ to: `/college/${encodeURIComponent(college)}` });
  }

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="nptel-gradient text-white">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-yellow-300" />
            <span className="font-display font-bold text-xl tracking-tight">
              NPTEL Portal
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.2 0.09 264) 0%, oklch(0.32 0.12 264) 50%, oklch(0.4 0.14 264) 100%)",
          minHeight: "420px",
        }}
      >
        {/* Geometric overlay only — no background image */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, oklch(0.65 0.18 264 / 0.4) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, oklch(0.78 0.14 85 / 0.3) 0%, transparent 40%)`,
          }}
        />

        <div className="container mx-auto px-4 py-16 relative z-10 text-white text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-6"
          >
            {/* NPTEL Logo */}
            <div className="flex items-center justify-center">
              <div className="w-28 h-28 rounded-full shadow-lg border-4 border-yellow-300 bg-blue-700 flex items-center justify-center">
                <GraduationCap className="h-16 w-16 text-white" />
              </div>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              WELCOME TO{" "}
              <span style={{ color: "oklch(0.9 0.15 85)" }}>
                RGUKT NPTEL WEBSITE
              </span>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* College Selection */}
      <main className="flex-1 container mx-auto px-4 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="font-display text-2xl font-bold text-foreground">
                Select Your College
              </h2>
            </div>
            <p className="text-muted-foreground">
              Choose your institution to access the portal
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {COLLEGE_INFO.map((college, idx) => (
              <motion.div key={college.name} variants={itemVariants}>
                <button
                  type="button"
                  data-ocid={`home.college.button.${idx + 1}`}
                  onClick={() => handleCollegeClick(college.name)}
                  className="group w-full text-left rounded-xl border border-border bg-card shadow-nptel-card hover:shadow-nptel-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {/* Card accent top */}
                  <div
                    className="h-2 w-full"
                    style={{
                      background: `linear-gradient(90deg, oklch(${0.35 + idx * 0.07} 0.14 ${264 - idx * 20}) 0%, oklch(${0.5 + idx * 0.05} 0.14 85) 100%)`,
                    }}
                  />
                  <div className="p-6">
                    {/* Abbr badge */}
                    <div
                      className="inline-flex items-center justify-center w-14 h-14 rounded-xl text-white font-display font-bold text-lg mb-4 shadow-md"
                      style={{
                        background: `linear-gradient(135deg, oklch(${0.35 + idx * 0.06} 0.14 264) 0%, oklch(${0.45 + idx * 0.05} 0.14 ${264 - idx * 15}) 100%)`,
                      }}
                    >
                      {college.abbr}
                    </div>
                    <h3 className="font-display font-bold text-xl mb-1 group-hover:text-primary transition-colors">
                      {college.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm font-medium text-primary">
                      Access Portal
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export { COLLEGES };
