import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, ChevronRight, GraduationCap, ShieldCheck, Users } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import { BRANCHES } from '../constants'
import type { Branch } from '../types'

const ROLES = [
  {
    id: 'student',
    label: 'Student',
    Icon: GraduationCap,
    description: 'View your enrollment and exam details',
    badge: 'Read-only access',
    gradientFrom: 'oklch(0.32 0.18 264)',
    gradientTo: 'oklch(0.50 0.22 264)',
    glowColor: 'oklch(0.40 0.18 264 / 0.38)',
  },
  {
    id: 'hod',
    label: 'HOD',
    Icon: Users,
    description: 'Manage department registrations and errors',
    badge: 'Department access',
    gradientFrom: 'oklch(0.32 0.18 155)',
    gradientTo: 'oklch(0.50 0.18 165)',
    glowColor: 'oklch(0.40 0.16 160 / 0.38)',
  },
  {
    id: 'dean',
    label: 'Dean',
    Icon: ShieldCheck,
    description: 'Campus-wide oversight and file management',
    badge: 'Full access',
    gradientFrom: 'oklch(0.32 0.20 295)',
    gradientTo: 'oklch(0.50 0.22 305)',
    glowColor: 'oklch(0.40 0.20 300 / 0.38)',
  },
] as const

export default function CollegeSelectPage() {
  const navigate = useNavigate()
  const params = useParams<{ collegeName: string }>()
  const collegeName = params.collegeName ? decodeURIComponent(params.collegeName) : ''
  const { selectedYear } = useAppContext()
  const [hodBranch, setHodBranch] = useState<Branch>('CSE')
  const [showBranchPicker, setShowBranchPicker] = useState(false)

  function handleRoleSelect(roleId: string) {
    if (roleId === 'hod') { setShowBranchPicker(true); return }
    navigate(`/college/${encodeURIComponent(collegeName)}/login/${roleId}`)
  }

  function handleHodBranchConfirm() {
    navigate(`/college/${encodeURIComponent(collegeName)}/login/hod?branch=${encodeURIComponent(hodBranch)}`)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
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
            data-ocid="college.back_button"
            onClick={() => navigate('/portal')}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="h-5 w-px bg-white/25" />
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" style={{ color: 'oklch(0.88 0.12 85)' }} />
            <span className="font-display font-bold text-lg">NPTEL Portal</span>
          </div>
          {selectedYear && (
            <span
              className="ml-auto text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: 'oklch(0.78 0.14 85 / 0.16)', border: '1px solid oklch(0.78 0.14 85 / 0.40)', color: 'oklch(0.92 0.12 85)' }}
            >
              {selectedYear}
            </span>
          )}
        </div>
      </header>

      {/* Hero */}
      <div
        className="relative overflow-hidden py-12 text-white text-center"
        style={{ background: 'linear-gradient(150deg, oklch(0.14 0.08 264) 0%, oklch(0.28 0.12 264) 55%, oklch(0.38 0.14 264) 100%)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'oklch(0.60 0.10 264)' }}>
          RGUKT — College Portal
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold">{collegeName}</h1>
        <p className="mt-2 text-sm" style={{ color: 'oklch(0.70 0.08 264)' }}>Select your role to continue</p>
      </div>

      {/* Roles */}
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Branch picker for HOD */}
          {showBranchPicker && (
            <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-md">
              <h2 className="font-display text-lg font-bold text-foreground mb-1">Select Department / Branch</h2>
              <p className="text-sm text-muted-foreground mb-4">Choose your branch to continue to the HOD login</p>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                <div className="flex-1 space-y-1.5">
                  <label htmlFor="hod-branch-select" className="text-sm font-medium text-foreground">Branch</label>
                  <select
                    id="hod-branch-select"
                    data-ocid="college.hod.branch_select"
                    value={hodBranch}
                    onChange={(e) => setHodBranch(e.target.value as Branch)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    data-ocid="college.hod.cancel_button"
                    onClick={() => setShowBranchPicker(false)}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    data-ocid="college.hod.confirm_button"
                    onClick={handleHodBranchConfirm}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-primary-foreground hover:opacity-90 transition-opacity"
                    style={{ background: 'var(--primary)' }}
                  >
                    Continue <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ROLES.map((role, idx) => {
              const { Icon } = role
              return (
                <button
                  key={role.id}
                  type="button"
                  data-ocid={`college.role_button.${idx + 1}`}
                  onClick={() => handleRoleSelect(role.id)}
                  className="group w-full text-left rounded-xl border bg-card shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div
                    className="px-8 py-9 flex flex-col items-center justify-center gap-3"
                    style={{ background: `linear-gradient(135deg, ${role.gradientFrom} 0%, ${role.gradientTo} 100%)` }}
                  >
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: 'oklch(1 0 0 / 0.12)', boxShadow: `0 0 28px ${role.glowColor}`, border: '1px solid oklch(1 0 0 / 0.20)' }}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <span className="font-display font-bold text-xl text-white">{role.label}</span>
                  </div>
                  <div className="p-5">
                    <span className="inline-block text-xs bg-secondary text-secondary-foreground rounded-full px-2.5 py-0.5 font-medium mb-2">
                      {role.badge}
                    </span>
                    <p className="text-sm text-muted-foreground leading-relaxed">{role.description}</p>
                    <div className="flex items-center gap-1 mt-3 text-sm font-semibold text-primary">
                      Select <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
