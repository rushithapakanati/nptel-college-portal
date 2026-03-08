import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { motion } from "motion/react";

const ROLES = [
  {
    id: "student",
    label: "Student",
    icon: GraduationCap,
    desc: "View your enrollment, exam registration, and shuffle details",
    color: "from-blue-600 to-indigo-700",
    badge: "Read-only access",
  },
  {
    id: "hod",
    label: "HOD",
    icon: Users,
    desc: "Upload data files, view student errors, manage department records",
    color: "from-emerald-600 to-teal-700",
    badge: "Department access",
  },
  {
    id: "dean",
    label: "Dean",
    icon: ShieldCheck,
    desc: "Manage permissions, view statistics, oversee all departments",
    color: "from-violet-600 to-purple-700",
    badge: "Full access",
  },
] as const;

export default function CollegeSelectPage() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { collegeName?: string };
  const collegeName = params.collegeName
    ? decodeURIComponent(params.collegeName)
    : "";

  function handleRoleSelect(role: string) {
    navigate({
      to: `/college/${encodeURIComponent(collegeName)}/login/${role}`,
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="nptel-gradient text-white">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/" })}
            className="text-white hover:bg-white/20 gap-2"
            data-ocid="college.back.button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="h-5 w-px bg-white/30" />
          <span className="font-display font-bold text-xl">NPTEL Portal</span>
        </div>
      </header>

      {/* Hero strip */}
      <div
        className="py-10 text-white text-center"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.2 0.09 264) 0%, oklch(0.35 0.13 264) 100%)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-sm font-medium text-white/60 mb-1 uppercase tracking-widest">
            College Portal
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">
            {collegeName}
          </h1>
          <p className="text-white/70 mt-2 text-sm">
            Select your role to continue
          </p>
        </motion.div>
      </div>

      {/* Role Selection */}
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ROLES.map((role, idx) => {
              const Icon = role.icon;
              return (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <button
                    type="button"
                    data-ocid={`college.role.button.${idx + 1}`}
                    onClick={() => handleRoleSelect(role.id)}
                    className="group w-full text-left rounded-xl border border-border bg-card shadow-nptel-card hover:shadow-nptel-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div
                      className={`bg-gradient-to-br ${role.color} p-8 flex items-center justify-center`}
                    >
                      <Icon className="h-12 w-12 text-white" />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-display font-bold text-xl group-hover:text-primary transition-colors">
                          {role.label}
                        </h3>
                        <span className="text-xs bg-secondary text-secondary-foreground rounded-full px-2 py-0.5">
                          {role.badge}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {role.desc}
                      </p>
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
