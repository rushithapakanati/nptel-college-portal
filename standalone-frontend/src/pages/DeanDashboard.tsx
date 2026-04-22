import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle, ArrowLeft, BarChart3, BookOpen, CheckCircle2,
  ClipboardCheck, Download, Eye, FileText, Filter, LogOut,
  PenLine, RefreshCw, Save, ShieldCheck, Shuffle, Upload, Users, X, XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppContext } from '../context/AppContext'
import type { Course, EnrollmentError, ExamRegError, StudentUploadRecord } from '../types'
import { downloadExcel } from '../utils/helpers'
import { normalizePaymentStatus, BRANCHES } from '../constants'
import type { Branch } from '../types'

const PAGE_SIZE = 50

// ─── Shared dialogs ───────────────────────────────────────────────────────────

function ErrorDialog({ error, onClose }: { error: (EnrollmentError | ExamRegError) | null; onClose: () => void }) {
  if (!error) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-foreground/40 backdrop-blur-sm cursor-default" onClick={onClose} aria-label="Close" tabIndex={-1} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-card border border-border shadow-xl p-6" data-ocid="dean.error_dialog">
        <button type="button" data-ocid="dean.error_close_button" onClick={onClose} className="absolute top-4 right-4 p-1 rounded hover:bg-muted transition-colors text-muted-foreground" aria-label="Close"><X className="h-5 w-5" /></button>
        <h3 className="font-display font-bold text-base text-foreground mb-4 flex items-center gap-2"><AlertCircle className="h-4 w-4 text-destructive" /> Error Details</h3>
        <div className="space-y-3 text-sm">
          {error.courseName && <div><span className="text-xs uppercase tracking-wide text-muted-foreground">Course</span><p className="font-bold text-primary mt-0.5">{error.courseName}</p></div>}
          {error.courseId && <div><span className="text-xs uppercase tracking-wide text-muted-foreground">Course ID</span><p className="font-mono text-sm mt-0.5 text-foreground">{error.courseId}</p></div>}
          <div><span className="text-xs uppercase tracking-wide text-muted-foreground">Error Type</span><p className="mt-0.5 text-foreground capitalize">{error.errorType.replace(/_/g, ' ')}</p></div>
          <div><span className="text-xs uppercase tracking-wide text-muted-foreground">Description</span><p className="mt-0.5 text-foreground">{error.description}</p></div>
          {error.studentId && <div><span className="text-xs uppercase tracking-wide text-muted-foreground">Roll No</span><p className="font-mono text-sm mt-0.5 text-foreground">{error.studentId}</p></div>}
        </div>
      </div>
    </div>
  )
}

// ─── Upload card ──────────────────────────────────────────────────────────────

interface UploadCardProps {
  title: string
  icon: React.ElementType
  snapshots: { id: string; fileName: string; uploadedAt: string; recordCount: number; isActive: boolean }[]
  onUpload: (file: File) => Promise<void>
  onRestore: (id: string) => void
  uploading: boolean
  color: string
  ocidPrefix: string
}

function UploadCard({ title, icon: Icon, snapshots, onUpload, onRestore, uploading, color, ocidPrefix }: UploadCardProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const active = snapshots.find((s) => s.isActive)
  const previous = snapshots.filter((s) => !s.isActive).reverse()

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 flex flex-col">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color} / 0.12` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <span className="font-semibold text-sm text-foreground">{title}</span>
      </div>

      {active && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <div className="flex items-center gap-2 text-foreground font-medium text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--success)' }} />
            <span className="truncate">{active.fileName}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{active.recordCount.toLocaleString()} records • {new Date(active.uploadedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      )}

      <button
        type="button"
        data-ocid={`${ocidPrefix}.upload_button`}
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-dashed border-border hover:border-primary hover:bg-muted/30 transition-colors disabled:opacity-50 w-full justify-center"
      >
        {uploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {uploading ? 'Uploading…' : 'Upload CSV/Excel'}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          await onUpload(file)
          e.target.value = ''
        }}
      />

      {previous.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Previous Files</p>
          {previous.map((snap) => (
            <div key={snap.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{snap.fileName}</p>
                <p className="text-xs text-muted-foreground">{snap.recordCount.toLocaleString()} records</p>
              </div>
              <button
                type="button"
                data-ocid={`${ocidPrefix}.restore_button`}
                onClick={() => onRestore(snap.id)}
                className="text-xs text-primary hover:underline shrink-0 ml-2"
              >
                Restore
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Error table ──────────────────────────────────────────────────────────────

function ErrorTable({
  errors, label, color, ocidPrefix,
}: { errors: (EnrollmentError | ExamRegError)[]; label: string; color: string; ocidPrefix: string }) {
  const [page, setPage] = useState(1)
  const [branchFilter, setBranchFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedError, setSelectedError] = useState<(EnrollmentError | ExamRegError) | null>(null)

  const filtered = useMemo(() => {
    return errors.filter((e) => {
      const branchOk = branchFilter === 'all' || e.branch === branchFilter
      const typeOk = typeFilter === 'all' || e.errorType === typeFilter
      return branchOk && typeOk
    })
  }, [errors, branchFilter, typeFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const errorTypes = [...new Set(errors.map((e) => e.errorType))]
  const branches = [...new Set(errors.map((e) => e.branch))]

  function handleDownload() {
    downloadExcel(
      filtered.map((e) => ({
        'Roll No': e.studentId, 'Name': e.name ?? '', 'Email': e.email,
        'Branch': e.branch, 'Course Name': e.courseName, 'Course ID': e.courseId,
        'Error Type': e.errorType, 'Description': e.description,
      })),
      `${label.toLowerCase().replace(/\s+/g, '-')}-errors.csv`,
    )
    toast.success('Downloaded errors as CSV')
  }

  return (
    <>
      <ErrorDialog error={selectedError} onClose={() => setSelectedError(null)} />
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              data-ocid={`${ocidPrefix}.branch_filter`}
              value={branchFilter}
              onChange={(e) => { setBranchFilter(e.target.value); setPage(1) }}
              className="h-8 text-xs rounded-lg border border-input bg-background px-2 focus:outline-none"
            >
              <option value="all">All Branches</option>
              {branches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <select
              data-ocid={`${ocidPrefix}.type_filter`}
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
              className="h-8 text-xs rounded-lg border border-input bg-background px-2 focus:outline-none"
            >
              <option value="all">All Types</option>
              {errorTypes.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
            <span className="text-xs text-muted-foreground">{filtered.length} errors</span>
          </div>
          <button
            type="button"
            data-ocid={`${ocidPrefix}.download_button`}
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </button>
        </div>

        {filtered.length === 0 ? (
          <div data-ocid={`${ocidPrefix}.empty_state`} className="flex flex-col items-center justify-center py-12 text-center gap-3 rounded-lg border border-border bg-card">
            <CheckCircle2 className="h-10 w-10" style={{ color: 'var(--success)' }} />
            <p className="font-semibold text-foreground">No errors</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm" data-ocid={`${ocidPrefix}.table`}>
              <thead>
                <tr style={{ background: 'oklch(0.95 0.005 264)' }}>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Roll No</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Branch</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Course Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Course ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Error Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((err, idx) => (
                  <tr key={err.id} data-ocid={`${ocidPrefix}.row.${(page - 1) * PAGE_SIZE + idx + 1}`} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{err.studentId}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{err.branch}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{err.courseName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{err.courseId}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${color} / 0.10`, color, border: `1px solid ${color} / 0.25` }}>
                        {err.errorType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        data-ocid={`${ocidPrefix}.view_button.${(page - 1) * PAGE_SIZE + idx + 1}`}
                        onClick={() => setSelectedError(err)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <button type="button" data-ocid={`${ocidPrefix}.pagination_prev`} disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1.5 text-xs rounded-lg border border-border disabled:opacity-40 hover:bg-muted transition-colors">Previous</button>
              <button type="button" data-ocid={`${ocidPrefix}.pagination_next`} disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1.5 text-xs rounded-lg border border-border disabled:opacity-40 hover:bg-muted transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Dean Dashboard ───────────────────────────────────────────────────────────

const TABS = ['Data Upload', 'Overview', 'Errors', 'Statistics'] as const
type TabType = (typeof TABS)[number]
const ERROR_TABS = ['All Errors', 'Enrollment Errors', 'Exam Reg Errors'] as const
type ErrTabType = (typeof ERROR_TABS)[number]

export default function DeanDashboard() {
  const navigate = useNavigate()
  const params = useParams<{ collegeName: string }>()
  const collegeName = params.collegeName ? decodeURIComponent(params.collegeName) : ''

  const { currentUser, selectedYear, getCampusData, logout, uploadEnrollmentFile, uploadExamRegFile, uploadShuffleFile, uploadCourseFile, restoreSnapshot } = useAppContext()
  const [activeTab, setActiveTab] = useState<TabType>('Data Upload')
  const [activeErrTab, setActiveErrTab] = useState<ErrTabType>('All Errors')
  const [uploadingEnroll, setUploadingEnroll] = useState(false)
  const [uploadingExamReg, setUploadingExamReg] = useState(false)
  const [uploadingShuffle, setUploadingShuffle] = useState(false)
  const [uploadingCourse, setUploadingCourse] = useState(false)
  const courseFileRef = useRef<HTMLInputElement>(null)
  const [statsPage, setStatsPage] = useState(1)

  const data = getCampusData(collegeName, selectedYear ?? '')
  const allErrors = [...data.enrollmentErrors, ...data.examRegErrors]
  const enrollErrors = data.enrollmentErrors
  const examRegErrors = data.examRegErrors
  const doneReg = data.doneRegistrations

  const enrollTotalCount = data.enrollmentFileTotalCount
  const examRegTotalCount = data.examRegFileTotalCount
  const doneCount = doneReg.length
  const redoCount = data.examRegRecords.filter((r) => normalizePaymentStatus(r.paymentStatus ?? '') === 'redo').length
  const doFirstCount = data.examRegRecords.filter((r) => normalizePaymentStatus(r.paymentStatus ?? '') === 'dofirst').length

  // Branch-wise stats
  const branchStats = useMemo(() => {
    return BRANCHES.map((branch: Branch) => {
      const enrollCount = data.enrollmentRecords.filter((r) => r.branch === branch).length
      const enrollErrCount = enrollErrors.filter((e) => e.branch === branch).length
      const examCount = data.examRegRecords.filter((r) => r.branch === branch).length
      const done = data.examRegRecords.filter((r) => r.branch === branch && normalizePaymentStatus(r.paymentStatus ?? '') === 'done').length
      const redo = data.examRegRecords.filter((r) => r.branch === branch && normalizePaymentStatus(r.paymentStatus ?? '') === 'redo').length
      const doFirst = data.examRegRecords.filter((r) => r.branch === branch && normalizePaymentStatus(r.paymentStatus ?? '') === 'dofirst').length
      const examErrCount = examRegErrors.filter((e) => e.branch === branch).length
      return { branch, enrollCount, enrollErrCount, examCount, done, redo, doFirst, examErrCount }
    })
  }, [data.enrollmentRecords, data.examRegRecords, enrollErrors, examRegErrors])

  const statsTotalPages = Math.max(1, Math.ceil(doneReg.length / PAGE_SIZE))
  const statsPaginated = doneReg.slice((statsPage - 1) * PAGE_SIZE, statsPage * PAGE_SIZE)

  function handleLogout() {
    logout()
    navigate(`/college/${encodeURIComponent(collegeName)}`)
  }

  const handleEnrollUpload = useCallback(async (file: File) => {
    setUploadingEnroll(true)
    try {
      await uploadEnrollmentFile(collegeName, selectedYear ?? '', file)
      toast.success(`Enrollment data uploaded — ${file.name}`)
    } catch { toast.error('Failed to parse file') } finally { setUploadingEnroll(false) }
  }, [collegeName, selectedYear, uploadEnrollmentFile])

  const handleExamRegUpload = useCallback(async (file: File) => {
    setUploadingExamReg(true)
    try {
      await uploadExamRegFile(collegeName, selectedYear ?? '', file)
      toast.success(`Exam registration data uploaded — ${file.name}`)
    } catch { toast.error('Failed to parse file') } finally { setUploadingExamReg(false) }
  }, [collegeName, selectedYear, uploadExamRegFile])

  const handleShuffleUpload = useCallback(async (file: File) => {
    setUploadingShuffle(true)
    try {
      await uploadShuffleFile(collegeName, selectedYear ?? '', file)
      toast.success(`Exam shuffle data uploaded — ${file.name}`)
    } catch { toast.error('Failed to parse file') } finally { setUploadingShuffle(false) }
  }, [collegeName, selectedYear, uploadShuffleFile])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button type="button" data-ocid="dean.back_button" onClick={() => navigate(`/college/${encodeURIComponent(collegeName)}`)} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="h-5 w-px bg-border" />
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-display font-bold text-base text-foreground">Dean Dashboard</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">{currentUser?.email}</span>
            <button type="button" data-ocid="dean.logout_button" onClick={handleLogout} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <h1 className="font-display text-2xl font-bold text-foreground">{collegeName} — Dean Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">{selectedYear}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-lg bg-muted w-fit mb-8 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              data-ocid={`dean.tab.${tab.toLowerCase().replace(/\s+/g, '_')}`}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-200 relative"
              style={activeTab === tab ? { background: 'var(--card)', color: 'var(--foreground)', boxShadow: '0 1px 4px oklch(0 0 0 / 0.10)' } : { color: 'var(--muted-foreground)' }}
            >
              {tab}
              {tab === 'Errors' && allErrors.length > 0 && (
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-destructive text-white font-bold">{allErrors.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Data Upload ── */}
        {activeTab === 'Data Upload' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-lg text-foreground">Upload Files</h2>
              <button
                type="button"
                data-ocid="dean.refresh_button"
                onClick={() => toast.info('Data refreshed')}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <UploadCard
                title="NPTEL Enrollment Data"
                icon={Users}
                snapshots={data.enrollmentSnapshots}
                onUpload={handleEnrollUpload}
                onRestore={(id) => { restoreSnapshot(collegeName, selectedYear ?? '', 'enrollment', id); toast.success('Enrollment data restored') }}
                uploading={uploadingEnroll}
                color="oklch(0.40 0.18 264)"
                ocidPrefix="dean.enrollment"
              />
              <UploadCard
                title="NPTEL Exam Registration Data"
                icon={ClipboardCheck}
                snapshots={data.examRegSnapshots}
                onUpload={handleExamRegUpload}
                onRestore={(id) => { restoreSnapshot(collegeName, selectedYear ?? '', 'examreg', id); toast.success('Exam registration data restored') }}
                uploading={uploadingExamReg}
                color="oklch(0.40 0.20 295)"
                ocidPrefix="dean.examreg"
              />
              <UploadCard
                title="Exam Shuffle Data"
                icon={Shuffle}
                snapshots={data.shuffleSnapshots}
                onUpload={handleShuffleUpload}
                onRestore={(id) => { restoreSnapshot(collegeName, selectedYear ?? '', 'shuffle', id); toast.success('Shuffle data restored') }}
                uploading={uploadingShuffle}
                color="oklch(0.40 0.16 160)"
                ocidPrefix="dean.shuffle"
              />
            </div>

            {/* 12-week course file */}
            <div className="mt-8">
              <h3 className="font-display font-semibold text-base text-foreground mb-4">12-Week Courses File</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  data-ocid="dean.courses_upload_button"
                  disabled={uploadingCourse}
                  onClick={() => courseFileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-dashed border-border hover:border-primary hover:bg-muted/30 transition-colors"
                >
                  {uploadingCourse ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
                  Upload 12-Week Courses
                </button>
                {data.twelveWeekCourses.length > 0 && (
                  <span className="text-sm text-muted-foreground">{data.twelveWeekCourses.length} courses loaded</span>
                )}
                <input
                  ref={courseFileRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setUploadingCourse(true)
                    try {
                      await uploadCourseFile(collegeName, selectedYear ?? '', file)
                      toast.success('Course file uploaded')
                    } catch { toast.error('Failed to parse') } finally { setUploadingCourse(false); e.target.value = '' }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Overview ── */}
        {activeTab === 'Overview' && (
          <div className="space-y-8">
            {/* Enrollment section */}
            <div>
              <h2 className="font-display font-bold text-base text-foreground mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" style={{ color: 'oklch(0.40 0.18 264)' }} /> Enrollment Overview
              </h2>
              {!data.deanStudentDataUploaded ? (
                <div data-ocid="dean.enrollment_empty_state" className="text-sm text-muted-foreground p-6 rounded-lg border border-border bg-card text-center">No enrollment data uploaded</div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Total Enrolled', value: enrollTotalCount, color: 'oklch(0.40 0.18 264)' },
                    { label: 'Enrollment Errors', value: enrollErrors.length, color: 'var(--destructive)' },
                    { label: 'Clean Records', value: Math.max(0, enrollTotalCount - enrollErrors.length), color: 'var(--success)' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-border bg-card p-5 text-center">
                      <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Exam Reg section */}
            <div>
              <h2 className="font-display font-bold text-base text-foreground mb-4 flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" style={{ color: 'oklch(0.40 0.20 295)' }} /> Exam Registration Overview
              </h2>
              {!data.deanExamRegDataUploaded ? (
                <div data-ocid="dean.examreg_empty_state" className="text-sm text-muted-foreground p-6 rounded-lg border border-border bg-card text-center">No exam registration data uploaded</div>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Total Registered', value: examRegTotalCount, color: 'oklch(0.40 0.20 295)' },
                    { label: 'Done', value: doneCount, color: 'var(--success)' },
                    { label: 'Redo', value: redoCount, color: 'var(--destructive)' },
                    { label: 'Do First', value: doFirstCount, color: 'oklch(0.55 0.15 85)' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-border bg-card p-5 text-center">
                      <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Branch-wise table */}
            {data.deanStudentDataUploaded && data.deanExamRegDataUploaded && (
              <div>
                <h2 className="font-display font-bold text-base text-foreground mb-4">Branch-wise Overview</h2>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm" data-ocid="dean.branch_overview_table">
                    <thead>
                      <tr style={{ background: 'oklch(0.93 0.01 264)' }}>
                        <th className="text-left px-4 py-3 font-semibold text-foreground" rowSpan={2}>Branch</th>
                        <th className="text-center px-4 py-2 font-semibold text-foreground border-l border-border" colSpan={2} style={{ color: 'oklch(0.40 0.18 264)' }}>Enrollment</th>
                        <th className="text-center px-4 py-2 font-semibold text-foreground border-l border-border" colSpan={5} style={{ color: 'oklch(0.40 0.20 295)' }}>Exam Registration</th>
                      </tr>
                      <tr style={{ background: 'oklch(0.95 0.005 264)' }}>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground border-l border-border">Total</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">Errors</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground border-l border-border">Total</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">Done</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">Redo</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">Do First</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">Errors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchStats.map((row) => (
                        <tr key={row.branch} className="border-t border-border hover:bg-muted/20">
                          <td className="px-4 py-3 font-semibold text-foreground">{row.branch}</td>
                          <td className="px-3 py-3 text-right font-mono text-sm border-l border-border">{row.enrollCount.toLocaleString()}</td>
                          <td className="px-3 py-3 text-right font-mono text-sm text-destructive">{row.enrollErrCount > 0 ? row.enrollErrCount.toLocaleString() : '—'}</td>
                          <td className="px-3 py-3 text-right font-mono text-sm border-l border-border">{row.examCount.toLocaleString()}</td>
                          <td className="px-3 py-3 text-right font-mono text-sm" style={{ color: 'var(--success)' }}>{row.done > 0 ? row.done.toLocaleString() : '—'}</td>
                          <td className="px-3 py-3 text-right font-mono text-sm text-destructive">{row.redo > 0 ? row.redo.toLocaleString() : '—'}</td>
                          <td className="px-3 py-3 text-right font-mono text-sm" style={{ color: 'oklch(0.55 0.15 85)' }}>{row.doFirst > 0 ? row.doFirst.toLocaleString() : '—'}</td>
                          <td className="px-3 py-3 text-right font-mono text-sm text-destructive">{row.examErrCount > 0 ? row.examErrCount.toLocaleString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 12-week courses table */}
            {data.twelveWeekCourses.length > 0 && (
              <div>
                <h2 className="font-display font-bold text-base text-foreground mb-4">12-Week Courses</h2>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'oklch(0.95 0.005 264)' }}>
                        <th className="text-left px-4 py-3 font-semibold text-foreground">Course ID</th>
                        <th className="text-left px-4 py-3 font-semibold text-foreground">Course Name</th>
                        <th className="text-left px-4 py-3 font-semibold text-foreground">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.twelveWeekCourses.map((c: Course) => (
                        <tr key={c.courseId} className="border-t border-border hover:bg-muted/20">
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.courseId}</td>
                          <td className="px-4 py-3 font-medium text-foreground">{c.courseName}</td>
                          <td className="px-4 py-3 text-muted-foreground">{c.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Errors ── */}
        {activeTab === 'Errors' && (
          <div>
            {/* Error sub-tabs */}
            <div className="flex gap-1 p-1 rounded-lg bg-muted w-fit mb-6 overflow-x-auto">
              {ERROR_TABS.map((t) => {
                const count = t === 'All Errors' ? allErrors.length : t === 'Enrollment Errors' ? enrollErrors.length : examRegErrors.length
                return (
                  <button
                    key={t}
                    type="button"
                    data-ocid={`dean.error_tab.${t.toLowerCase().replace(/\s+/g, '_')}`}
                    onClick={() => setActiveErrTab(t)}
                    className="px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1.5"
                    style={activeErrTab === t ? { background: 'var(--card)', color: 'var(--foreground)', boxShadow: '0 1px 4px oklch(0 0 0 / 0.10)' } : { color: 'var(--muted-foreground)' }}
                  >
                    {t}
                    {count > 0 && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                        style={
                          t === 'Enrollment Errors'
                            ? { background: 'oklch(0.40 0.18 264 / 0.15)', color: 'oklch(0.40 0.18 264)' }
                            : t === 'Exam Reg Errors'
                            ? { background: 'oklch(0.40 0.20 295 / 0.15)', color: 'oklch(0.40 0.20 295)' }
                            : { background: 'var(--destructive) / 0.15', color: 'var(--destructive)' }
                        }
                      >
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {activeErrTab === 'All Errors' && <ErrorTable errors={allErrors} label="All" color="oklch(0.45 0.15 264)" ocidPrefix="dean.all_errors" />}
            {activeErrTab === 'Enrollment Errors' && <ErrorTable errors={enrollErrors} label="Enrollment" color="oklch(0.40 0.18 264)" ocidPrefix="dean.enrollment_errors" />}
            {activeErrTab === 'Exam Reg Errors' && <ErrorTable errors={examRegErrors} label="Exam Reg" color="oklch(0.40 0.20 295)" ocidPrefix="dean.examreg_errors" />}
          </div>
        )}

        {/* ── Statistics ── */}
        {activeTab === 'Statistics' && (
          <div className="space-y-6">
            <h2 className="font-display font-bold text-lg text-foreground">Done Registrations</h2>
            {doneReg.length === 0 ? (
              <div data-ocid="dean.stats_empty_state" className="flex flex-col items-center py-12 text-center gap-3 rounded-lg border border-border bg-card">
                <BarChart3 className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-muted-foreground">No done registrations yet</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm" data-ocid="dean.stats_table">
                    <thead>
                      <tr style={{ background: 'oklch(0.95 0.005 264)' }}>
                        <th className="text-left px-4 py-3 font-semibold text-foreground">Roll No</th>
                        <th className="text-left px-4 py-3 font-semibold text-foreground">Name</th>
                        <th className="text-left px-4 py-3 font-semibold text-foreground">Branch</th>
                        <th className="text-left px-4 py-3 font-semibold text-foreground">Course Name</th>
                        <th className="text-left px-4 py-3 font-semibold text-foreground">Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsPaginated.map((rec: StudentUploadRecord) => (
                        <tr key={`${rec.studentId}-${rec.courseId}`} data-ocid={`dean.stats.row.${statsPaginated.indexOf(rec) + 1}`} className="border-t border-border hover:bg-muted/20">
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{rec.studentId}</td>
                          <td className="px-4 py-3 text-foreground">{rec.name ?? '—'}</td>
                          <td className="px-4 py-3 text-muted-foreground">{rec.branch}</td>
                          <td className="px-4 py-3 font-medium text-foreground">{rec.courseName || rec.courseId}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--success) / 0.12', color: 'var(--success)', border: '1px solid var(--success) / 0.30' }}>
                              Done
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {statsTotalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Page {statsPage} of {statsTotalPages}</span>
                    <div className="flex gap-1">
                      <button type="button" data-ocid="dean.stats.pagination_prev" disabled={statsPage === 1} onClick={() => setStatsPage((p) => Math.max(1, p - 1))} className="px-3 py-1.5 text-xs rounded-lg border border-border disabled:opacity-40 hover:bg-muted transition-colors">Previous</button>
                      <button type="button" data-ocid="dean.stats.pagination_next" disabled={statsPage === statsTotalPages} onClick={() => setStatsPage((p) => Math.min(statsTotalPages, p + 1))} className="px-3 py-1.5 text-xs rounded-lg border border-border disabled:opacity-40 hover:bg-muted transition-colors">Next</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
