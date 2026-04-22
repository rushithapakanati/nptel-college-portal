import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import { ACADEMIC_YEARS } from '../constants'

export default function YearSelectPage() {
  const { setSelectedYear } = useAppContext()
  const navigate = useNavigate()
  const [selectedYear, setLocalYear] = useState<string>('')

  function handleEnterPortal() {
    if (!selectedYear) return
    setSelectedYear(selectedYear)
    navigate('/portal')
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, oklch(0.12 0.07 264) 0%, oklch(0.18 0.10 264) 45%, oklch(0.26 0.12 264) 100%)',
      }}
    >
      {/* Radial glow overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 65% 55% at 15% 35%, oklch(0.50 0.22 264 / 0.20) 0%, transparent 60%),
            radial-gradient(ellipse 50% 45% at 85% 20%, oklch(0.78 0.16 85 / 0.16) 0%, transparent 55%),
            radial-gradient(ellipse 75% 45% at 50% 95%, oklch(0.40 0.14 264 / 0.15) 0%, transparent 55%)
          `,
        }}
      />
      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        aria-hidden="true"
        style={{
          backgroundImage: 'linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-7 w-full max-w-lg px-6">
        {/* Logo */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(145deg, oklch(0.28 0.18 264) 0%, oklch(0.46 0.22 264) 100%)',
            boxShadow: '0 0 0 4px oklch(0.75 0.16 85), 0 0 56px oklch(0.42 0.22 264 / 0.60), 0 8px 32px oklch(0.08 0.05 264 / 0.65)',
          }}
        >
          <GraduationCap className="h-12 w-12" style={{ color: 'oklch(0.97 0.10 85)' }} />
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1
            className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight leading-tight"
            style={{ color: 'oklch(0.97 0.04 85)' }}
          >
            WELCOME TO RGUKT NPTEL WEBSITE
          </h1>
          <p className="text-base font-semibold tracking-widest uppercase" style={{ color: 'oklch(0.62 0.10 264)' }}>
            RGUKT NPTEL PORTAL
          </p>
        </div>

        {/* Year selector card */}
        <div
          className="w-full rounded-2xl p-7 flex flex-col gap-5"
          style={{
            background: 'oklch(0.16 0.07 264 / 0.90)',
            border: '1px solid oklch(0.40 0.10 264 / 0.50)',
            boxShadow: '0 8px 48px oklch(0.10 0.06 264 / 0.55)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <p className="text-sm font-medium text-center" style={{ color: 'oklch(0.65 0.08 264)' }}>
            Select Academic Year &amp; Semester to Access the Portal
          </p>

          <select
            data-ocid="yearselect.select"
            value={selectedYear}
            onChange={(e) => setLocalYear(e.target.value)}
            className="w-full h-12 rounded-lg px-3 text-base font-semibold outline-none"
            style={{
              background: 'oklch(0.22 0.09 264 / 0.90)',
              border: '1px solid oklch(0.42 0.12 264 / 0.65)',
              color: selectedYear ? 'oklch(0.97 0.04 85)' : 'oklch(0.55 0.07 264)',
            }}
          >
            <option value="" style={{ background: 'oklch(0.22 0.09 264)', color: 'oklch(0.55 0.07 264)' }}>
              Select Academic Year / Semester
            </option>
            {ACADEMIC_YEARS.map((yr) => (
              <option key={yr} value={yr} style={{ background: 'oklch(0.22 0.09 264)', color: 'oklch(0.97 0.04 85)' }}>
                {yr}
              </option>
            ))}
          </select>

          <button
            type="button"
            data-ocid="yearselect.enter_button"
            disabled={!selectedYear}
            onClick={handleEnterPortal}
            className="w-full h-12 rounded-lg font-display font-bold text-base tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={
              selectedYear
                ? {
                    background: 'linear-gradient(135deg, oklch(0.42 0.18 264) 0%, oklch(0.55 0.20 264) 100%)',
                    color: 'oklch(0.97 0.04 85)',
                    boxShadow: '0 4px 20px oklch(0.42 0.18 264 / 0.55)',
                  }
                : {
                    background: 'oklch(0.28 0.07 264 / 0.70)',
                    color: 'oklch(0.55 0.07 264)',
                    border: '1px solid oklch(0.38 0.08 264 / 0.50)',
                  }
            }
          >
            Enter Portal
          </button>

          <p className="text-xs text-center" style={{ color: 'oklch(0.48 0.06 264)' }}>
            Each semester maintains its own separate database
          </p>
        </div>
      </div>
    </div>
  )
}
