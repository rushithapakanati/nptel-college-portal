import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Building2, MapPin, ChevronRight, ArrowLeft } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import { CAMPUS_DISPLAY } from '../constants'

export default function PortalPage() {
  const navigate = useNavigate()
  const { selectedYear } = useAppContext()

  useEffect(() => {
    if (!selectedYear) navigate('/')
  }, [selectedYear, navigate])

  if (!selectedYear) return null

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-20 text-white"
        style={{
          background: 'linear-gradient(90deg, oklch(0.16 0.09 264) 0%, oklch(0.24 0.12 264) 100%)',
          borderBottom: '1px solid oklch(0.35 0.10 264 / 0.60)',
        }}
      >
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            data-ocid="portal.back_button"
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="h-5 w-px bg-white/25" />
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6" style={{ color: 'oklch(0.88 0.14 85)' }} />
            <span className="font-display font-bold text-lg tracking-tight">NPTEL Portal</span>
          </div>
          <span
            className="ml-auto text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: 'oklch(0.78 0.14 85 / 0.16)', border: '1px solid oklch(0.78 0.14 85 / 0.40)', color: 'oklch(0.92 0.12 85)' }}
          >
            {selectedYear}
          </span>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden text-white text-center"
        style={{
          background: 'linear-gradient(150deg, oklch(0.14 0.08 264) 0%, oklch(0.26 0.12 264) 55%, oklch(0.36 0.14 264) 100%)',
          minHeight: '260px',
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
        <div className="container mx-auto px-4 py-14 relative z-10 flex flex-col items-center gap-5">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, oklch(0.28 0.18 264) 0%, oklch(0.46 0.22 264) 100%)',
              boxShadow: '0 0 0 4px oklch(0.75 0.16 85), 0 0 44px oklch(0.40 0.18 264 / 0.55)',
            }}
          >
            <GraduationCap className="h-10 w-10" style={{ color: 'oklch(0.96 0.10 85)' }} />
          </div>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              WELCOME TO{' '}
              <span style={{ color: 'oklch(0.88 0.16 85)' }}>RGUKT NPTEL WEBSITE</span>
            </h1>
            <p className="mt-3 text-base font-medium" style={{ color: 'oklch(0.68 0.10 264)' }}>
              {selectedYear} — Select Your Campus
            </p>
          </div>
        </div>
      </section>

      {/* Campus cards */}
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="font-display text-2xl font-bold text-foreground">Select Your Campus</h2>
            </div>
            <p className="text-muted-foreground text-sm">Choose your RGUKT institution to access the NPTEL portal</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {CAMPUS_DISPLAY.map((campus, idx) => (
              <button
                key={campus.key}
                type="button"
                data-ocid={`portal.campus_button.${idx + 1}`}
                onClick={() => navigate(`/college/${encodeURIComponent(campus.name)}`)}
                className="group w-full text-left rounded-xl border border-border bg-card shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${campus.gradientFrom} 0%, oklch(0.75 0.14 85) 100%)` }} />
                <div className="p-6">
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
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
