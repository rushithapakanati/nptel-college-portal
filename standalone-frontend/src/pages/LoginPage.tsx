import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, GraduationCap, KeyRound, ShieldCheck, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useAppContext } from '../context/AppContext'
import { BRANCHES, getCampusConfig, isValidStudentEmail } from '../constants'
import type { Branch } from '../types'

type LoginRole = 'student' | 'hod' | 'dean'

// ─── localStorage helpers ─────────────────────────────────────────────────────

function getDeanCredKey(campus: string) { return `nptel_dean_cred_${campus.toLowerCase()}` }
function getHodCredKey(campus: string, branch: string) { return `nptel_hod_cred_${campus.toLowerCase()}_${branch}` }
function getStudentPwdKey(campus: string, studentId: string) { return `nptel_student_pwd_${campus.toLowerCase()}_${studentId}` }

function loadDeanCred(campus: string): { email: string; password: string } | null {
  try { const raw = localStorage.getItem(getDeanCredKey(campus)); return raw ? JSON.parse(raw) : null }
  catch { return null }
}
function saveDeanCred(campus: string, email: string, password: string) {
  localStorage.setItem(getDeanCredKey(campus), JSON.stringify({ email, password }))
}

function loadHodCred(campus: string, branch: string): { password: string } | null {
  try { const raw = localStorage.getItem(getHodCredKey(campus, branch)); return raw ? JSON.parse(raw) : null }
  catch { return null }
}
function saveHodCred(campus: string, branch: string, password: string) {
  localStorage.setItem(getHodCredKey(campus, branch), JSON.stringify({ password }))
}

export function loadStudentPassword(campus: string, studentId: string): string {
  return localStorage.getItem(getStudentPwdKey(campus, studentId)) ?? 'student123'
}
export function saveStudentPassword(campus: string, studentId: string, password: string) {
  localStorage.setItem(getStudentPwdKey(campus, studentId), password)
}

// ─── Role meta ────────────────────────────────────────────────────────────────

const ROLE_META: Record<LoginRole, { icon: React.ElementType; label: string; color: string }> = {
  student: { icon: GraduationCap, label: 'Student', color: 'oklch(0.40 0.18 264)' },
  hod: { icon: Users, label: 'Head of Department', color: 'oklch(0.40 0.16 160)' },
  dean: { icon: ShieldCheck, label: 'Dean', color: 'oklch(0.40 0.20 300)' },
}

export default function LoginPage() {
  const navigate = useNavigate()
  const params = useParams<{ collegeName: string; role: string }>()
  const [searchParams] = useSearchParams()
  const collegeName = params.collegeName ? decodeURIComponent(params.collegeName) : ''
  const role = (params.role ?? 'student') as LoginRole
  const branch = (searchParams.get('branch') ?? 'CSE') as Branch

  const { setCurrentUser, setSelectedCampus, selectedYear, getCampusData } = useAppContext()
  const config = getCampusConfig(collegeName)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isFirstLogin, setIsFirstLogin] = useState(false)
  const [setupEmail, setSetupEmail] = useState('')
  const [setupPassword, setSetupPassword] = useState('')
  const [setupConfirm, setSetupConfirm] = useState('')
  const [selectedBranch, setSelectedBranch] = useState<Branch>(branch)

  useEffect(() => {
    if (role === 'dean') {
      const cred = loadDeanCred(collegeName)
      setIsFirstLogin(!cred)
      if (cred) setEmail(cred.email)
    } else if (role === 'hod') {
      const cred = loadHodCred(collegeName, selectedBranch)
      setIsFirstLogin(!cred)
    }
  }, [role, collegeName, selectedBranch])

  const { icon: RoleIcon, label: roleLabel, color: roleColor } = ROLE_META[role] ?? ROLE_META.student

  function handleSetupAccount(e: React.FormEvent) {
    e.preventDefault()
    if (role === 'dean') {
      if (!setupEmail || !setupPassword) { setError('Please fill all fields'); return }
      if (setupPassword !== setupConfirm) { setError('Passwords do not match'); return }
      if (!setupEmail.includes('@')) { setError('Enter a valid email'); return }
      saveDeanCred(collegeName, setupEmail, setupPassword)
      setIsFirstLogin(false)
      setEmail(setupEmail)
      toast.success('Account created! Please log in.')
    } else if (role === 'hod') {
      if (!setupPassword) { setError('Please enter a password'); return }
      if (setupPassword !== setupConfirm) { setError('Passwords do not match'); return }
      saveHodCred(collegeName, selectedBranch, setupPassword)
      setIsFirstLogin(false)
      toast.success('Account created! Please log in.')
    }
    setError('')
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const year = selectedYear ?? ''
    const campusData = getCampusData(collegeName, year)

    if (role === 'dean') {
      const cred = loadDeanCred(collegeName)
      if (!cred) { setError('Account not set up yet'); return }
      const deanEmail = config?.deanEmail ?? ''
      const valid = (email.toLowerCase() === cred.email.toLowerCase() || email.toLowerCase() === deanEmail.toLowerCase()) && password === cred.password
      if (!valid) { setError('Invalid credentials'); return }
      setCurrentUser({ email, role: 'dean', campus: collegeName, year })
      setSelectedCampus(collegeName)
      navigate(`/college/${encodeURIComponent(collegeName)}/dean`)
    } else if (role === 'hod') {
      const cred = loadHodCred(collegeName, selectedBranch)
      if (!cred) { setError('Account not set up yet'); return }
      if (password !== cred.password) { setError('Incorrect password'); return }
      setCurrentUser({ email, role: 'hod', campus: collegeName, branch: selectedBranch, year })
      setSelectedCampus(collegeName)
      navigate(`/college/${encodeURIComponent(collegeName)}/hod/${encodeURIComponent(selectedBranch)}`)
    } else {
      // Student login: check enrolled records
      const emailLower = email.toLowerCase()
      const prefix = emailLower.split('@')[0]
      const allRecords = [...campusData.enrollmentRecords, ...campusData.examRegRecords]
      const found = allRecords.some((r) => {
        const rEmail = (r.email ?? '').toLowerCase()
        const rId = (r.studentId ?? '').toLowerCase()
        return rEmail === emailLower || rId === prefix || rEmail.split('@')[0] === prefix || r.personalEmail?.toLowerCase() === emailLower
      })
      const isCollegeEmail = config ? isValidStudentEmail(email, collegeName) : false

      if (!found && !isCollegeEmail) { setError('Email not found in uploaded data and is not a recognized college email'); return }

      const studentId = prefix
      const savedPwd = loadStudentPassword(collegeName, studentId)
      if (allRecords.length === 0 && isCollegeEmail) {
        // College email, no data yet — allow with default or set password
        if (savedPwd && password !== savedPwd) { setError('Incorrect password'); return }
        if (!savedPwd) { saveStudentPassword(collegeName, studentId, password) }
      } else if (password !== savedPwd) {
        setError('Incorrect password')
        return
      }
      setCurrentUser({ email, role: 'student', campus: collegeName, year })
      setSelectedCampus(collegeName)
      navigate(`/college/${encodeURIComponent(collegeName)}/student`)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(160deg, oklch(0.12 0.07 264) 0%, oklch(0.18 0.10 264) 50%, oklch(0.24 0.12 264) 100%)' }}
    >
      <div className="w-full max-w-md">
        <button
          type="button"
          data-ocid="login.back_button"
          onClick={() => navigate(`/college/${encodeURIComponent(collegeName)}`)}
          className="flex items-center gap-1.5 text-sm font-medium mb-6 hover:opacity-80 transition-opacity"
          style={{ color: 'oklch(0.70 0.10 264)' }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to role selection
        </button>

        <div
          className="rounded-2xl p-8 space-y-6"
          style={{
            background: 'oklch(0.16 0.07 264 / 0.90)',
            border: '1px solid oklch(0.40 0.10 264 / 0.50)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: `${roleColor} / 0.20`, border: `1px solid ${roleColor} / 0.30` }}>
              <RoleIcon className="h-8 w-8" style={{ color: 'oklch(0.88 0.14 85)' }} />
            </div>
            <h1 className="font-display font-bold text-xl" style={{ color: 'oklch(0.97 0.04 85)' }}>
              {isFirstLogin ? `Setup ${roleLabel} Account` : `${roleLabel} Login`}
            </h1>
            <p className="text-sm" style={{ color: 'oklch(0.60 0.08 264)' }}>{collegeName}</p>
          </div>

          {/* HOD branch selector */}
          {role === 'hod' && (
            <div className="space-y-1.5">
              <label htmlFor="login-branch-select" className="text-sm font-medium" style={{ color: 'oklch(0.75 0.06 264)' }}>Department / Branch</label>
              <select
                id="login-branch-select"
                data-ocid="login.branch_select"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value as Branch)}
                className="w-full h-10 rounded-lg px-3 text-sm outline-none"
                style={{ background: 'oklch(0.22 0.09 264 / 0.90)', border: '1px solid oklch(0.42 0.12 264 / 0.65)', color: 'oklch(0.90 0.04 264)' }}
              >
                {BRANCHES.map((b) => <option key={b} value={b} style={{ background: 'oklch(0.22 0.09 264)' }}>{b}</option>)}
              </select>
            </div>
          )}

          {error && (
            <div
              data-ocid="login.error_state"
              className="flex items-center gap-2 p-3 rounded-lg text-sm"
              style={{ background: 'oklch(0.55 0.22 25 / 0.15)', border: '1px solid oklch(0.55 0.22 25 / 0.40)', color: 'oklch(0.85 0.12 25)' }}
            >
              {error}
            </div>
          )}

          {/* Setup form */}
          {isFirstLogin ? (
            <form onSubmit={handleSetupAccount} className="space-y-4">
              {role === 'dean' && (
                <div className="space-y-1.5">
                  <label htmlFor="setup-email" className="text-sm font-medium" style={{ color: 'oklch(0.75 0.06 264)' }}>Your Email</label>
                  <input
                    id="setup-email"
                    data-ocid="login.setup_email_input"
                    type="email"
                    value={setupEmail}
                    onChange={(e) => setSetupEmail(e.target.value)}
                    placeholder="dean@campus.ac.in"
                    className="w-full h-10 rounded-lg px-3 text-sm outline-none"
                    style={{ background: 'oklch(0.22 0.09 264 / 0.90)', border: '1px solid oklch(0.42 0.12 264 / 0.65)', color: 'oklch(0.90 0.04 264)' }}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label htmlFor="setup-password" className="text-sm font-medium" style={{ color: 'oklch(0.75 0.06 264)' }}>Set Password</label>
                <input
                  id="setup-password"
                  data-ocid="login.setup_password_input"
                  type="password"
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full h-10 rounded-lg px-3 text-sm outline-none"
                  style={{ background: 'oklch(0.22 0.09 264 / 0.90)', border: '1px solid oklch(0.42 0.12 264 / 0.65)', color: 'oklch(0.90 0.04 264)' }}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="setup-confirm" className="text-sm font-medium" style={{ color: 'oklch(0.75 0.06 264)' }}>Confirm Password</label>
                <input
                  id="setup-confirm"
                  data-ocid="login.setup_confirm_input"
                  type="password"
                  value={setupConfirm}
                  onChange={(e) => setSetupConfirm(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full h-10 rounded-lg px-3 text-sm outline-none"
                  style={{ background: 'oklch(0.22 0.09 264 / 0.90)', border: '1px solid oklch(0.42 0.12 264 / 0.65)', color: 'oklch(0.90 0.04 264)' }}
                />
              </div>
              <button
                type="submit"
                data-ocid="login.setup_submit_button"
                className="w-full h-11 rounded-lg font-display font-bold text-sm transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, oklch(0.42 0.18 264) 0%, oklch(0.55 0.20 264) 100%)', color: 'oklch(0.97 0.04 85)' }}
              >
                Create Account
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {role !== 'hod' && (
                <div className="space-y-1.5">
                  <label htmlFor="login-email" className="text-sm font-medium" style={{ color: 'oklch(0.75 0.06 264)' }}>
                    {role === 'student' ? 'College Email / Personal Email' : 'Email'}
                  </label>
                  <input
                    id="login-email"
                    data-ocid="login.email_input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === 'student' ? 'n210001@rguktn.ac.in' : 'dean@campus.ac.in'}
                    className="w-full h-10 rounded-lg px-3 text-sm outline-none"
                    style={{ background: 'oklch(0.22 0.09 264 / 0.90)', border: '1px solid oklch(0.42 0.12 264 / 0.65)', color: 'oklch(0.90 0.04 264)' }}
                    autoComplete="email"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label htmlFor="login-password" className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'oklch(0.75 0.06 264)' }}>
                  <KeyRound className="h-3.5 w-3.5" /> Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    data-ocid="login.password_input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full h-10 rounded-lg px-3 pr-10 text-sm outline-none"
                    style={{ background: 'oklch(0.22 0.09 264 / 0.90)', border: '1px solid oklch(0.42 0.12 264 / 0.65)', color: 'oklch(0.90 0.04 264)' }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'oklch(0.55 0.07 264)' }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {role === 'student' && (
                <p className="text-xs" style={{ color: 'oklch(0.48 0.06 264)' }}>
                  Default password is &quot;student123&quot; — you can change it after login
                </p>
              )}
              <button
                type="submit"
                data-ocid="login.submit_button"
                className="w-full h-11 rounded-lg font-display font-bold text-sm transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, oklch(0.42 0.18 264) 0%, oklch(0.55 0.20 264) 100%)', color: 'oklch(0.97 0.04 85)' }}
              >
                Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
