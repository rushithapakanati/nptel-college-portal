import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle, ArrowLeft, BookOpen, CheckCircle2, ClipboardEdit,
  Download, Eye, FileText, Filter, LogOut, PenLine, RefreshCw,
  Save, Upload, Users, X, XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppContext } from '../context/AppContext'
import type { Course, EnrollmentError, ExamRegError } from '../types'
import { parseFile, parseCourseRows } from '../utils/fileParser'
import { downloadExcel } from '../utils/helpers'
import { normalizePaymentStatus } from '../constants'

const PAGE_SIZE = 50

// ─── Error popup ──────────────────────────────────────────────────────────────

function ErrorDetailDialog({ error, onClose }: { error: (EnrollmentError | ExamRegError) | null; onClose: () => void }) {
  if (!error) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-foreground/40 backdrop-blur-sm cursor-default" onClick={onClose} aria-label="Close" tabIndex={-1} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-card border border-border shadow-xl p-6" data-ocid="hod.error_dialog">
        <button type="button" data-ocid="hod.error_close_button" onClick={onClose} className="absolute top-4 right-4 p-1 rounded hover:bg-muted transition-colors text-muted-foreground" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
        <h3 className="font-display font-bold text-base text-foreground mb-4 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" /> Error Details
        </h3>
        <div className="space-y-3 text-sm">
          {error.courseName && <div><span className="text-xs uppercase tracking-wide text-muted-foreground">Course</span><p className="font-bold text-primary mt-0.5">{error.courseName}</p></div>}
          {error.courseId && <div><span className="text-xs uppercase tracking-wide text-muted-foreground">Course ID</span><p className="font-mono text-sm mt-0.5 text-foreground">{error.courseId}</p></div>}
          <div><span className="text-xs uppercase tracking-wide text-muted-foreground">Error Type</span><p className="mt-0.5 text-foreground capitalize">{error.errorType.replace(/_/g, ' ')}</p></div>
          <div><span className="text-xs uppercase tracking-wide text-muted-foreground">Description</span><p className="mt-0.5 text-foreground">{error.description}</p></div>
          {error.studentId && <div><span className="text-xs uppercase tracking-wide text-muted-foreground">Roll No</span><p className="font-mono text-sm mt-0.5 text-foreground">{error.studentId}</p></div>}
          {error.email && <div><span className="text-xs uppercase tracking-wide text-muted-foreground">Email</span><p className="text-sm mt-0.5 text-foreground">{error.email}</p></div>}
        </div>
      </div>
    </div>
  )
}

// ─── Edit dialog ──────────────────────────────────────────────────────────────

function EditStudentDialog({
  error, onClose, onSave,
}: { error: (EnrollmentError | ExamRegError) | null; onClose: () => void; onSave: (changes: Record<string, string>) => void }) {
  const [fields, setFields] = useState<Record<string, string>>({})
  if (!error) return null

  const defaultFields = {
    studentId: error.studentId, email: error.email,
    courseId: error.courseId, courseName: error.courseName,
    ...('paymentStatus' in error ? { paymentStatus: (error as ExamRegError).paymentStatus ?? '' } : {}),
  }
  const display = { ...defaultFields, ...fields }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-foreground/40 backdrop-blur-sm cursor-default" onClick={onClose} aria-label="Close" tabIndex={-1} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-card border border-border shadow-xl p-6" data-ocid="hod.edit_dialog">
        <button type="button" data-ocid="hod.edit_close_button" onClick={onClose} className="absolute top-4 right-4 p-1 rounded hover:bg-muted transition-colors text-muted-foreground" aria-label="Close"><X className="h-5 w-5" /></button>
        <h3 className="font-display font-bold text-base text-foreground mb-4 flex items-center gap-2"><PenLine className="h-4 w-4 text-primary" /> Edit Student Record</h3>
        <div className="space-y-3">
          {Object.entries(defaultFields).map(([key, val]) => (
            <div key={key}>
              <label htmlFor={`edit-${key}`} className="block text-xs font-medium text-muted-foreground mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
              <input
                id={`edit-${key}`}
                type="text"
                defaultValue={val ?? ''}
                onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-6 justify-end">
          <button type="button" data-ocid="hod.edit_cancel_button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors">Cancel</button>
          <button
            type="button"
            data-ocid="hod.edit_save_button"
            onClick={() => onSave({ ...defaultFields, ...fields })}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-primary-foreground hover:opacity-90 transition-opacity"
            style={{ background: 'var(--primary)' }}
          >
            <Save className="h-4 w-4" /> Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── File upload card ─────────────────────────────────────────────────────────

interface UploadCardProps {
  title: string
  snapshots: { id: string; fileName: string; uploadedAt: string; recordCount: number; isActive: boolean }[]
  onUpload: (file: File) => Promise<void>
  onRestore: (id: string) => void
  uploading: boolean
  credits: number
  ocidPrefix: string
}

function UploadCard({ title, snapshots, onUpload, onRestore, uploading, credits, ocidPrefix }: UploadCardProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const active = snapshots.find((s) => s.isActive)
  const previous = snapshots.filter((s) => !s.isActive).reverse()

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-foreground">{title}</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">{credits} credits</span>
      </div>

      {active && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--success)' }} />
            {active.fileName}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{active.recordCount.toLocaleString()} records • {new Date(active.uploadedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      )}

      <button
        type="button"
        data-ocid={`${ocidPrefix}.upload_button`}
        disabled={uploading || credits <= 0}
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

// ─── Errors table ─────────────────────────────────────────────────────────────

function ErrorsTable({
  errors, type, bulkEditMode, onEnableBulkEdit, onSaveAllEdits, ocidPrefix,
}: {
  errors: (EnrollmentError | ExamRegError)[]
  type: 'enrollment' | 'examreg'
  bulkEditMode: boolean
  onEnableBulkEdit: () => void
  onSaveAllEdits: () => void
  ocidPrefix: string
}) {
  const [page, setPage] = useState(1)
  const [branchFilter, setBranchFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedError, setSelectedError] = useState<(EnrollmentError | ExamRegError) | null>(null)
  const [editingError, setEditingError] = useState<(EnrollmentError | ExamRegError) | null>(null)

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

  const themeColor = type === 'enrollment' ? 'oklch(0.40 0.18 264)' : 'oklch(0.40 0.20 295)'

  function handleDownload() {
    downloadExcel(
      filtered.map((e) => ({
        'Roll No': e.studentId, 'Name': e.name ?? '', 'Email': e.email,
        'Branch': e.branch, 'Course Name': e.courseName, 'Course ID': e.courseId,
        'Error Type': e.errorType, 'Description': e.description,
        ...('paymentStatus' in e ? { 'Payment Status': (e as ExamRegError).paymentStatus ?? '' } : {}),
      })),
      `${type}-errors.csv`,
    )
    toast.success('Downloaded errors as CSV')
  }

  return (
    <>
      <ErrorDetailDialog error={selectedError} onClose={() => setSelectedError(null)} />
      <EditStudentDialog
        error={editingError}
        onClose={() => setEditingError(null)}
        onSave={(changes) => {
          toast.success('Changes saved')
          setEditingError(null)
        }}
      />
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                data-ocid={`${ocidPrefix}.branch_filter`}
                value={branchFilter}
                onChange={(e) => { setBranchFilter(e.target.value); setPage(1) }}
                className="h-8 text-xs rounded-lg border border-input bg-background px-2 focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Branches</option>
                {branches.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <select
                data-ocid={`${ocidPrefix}.type_filter`}
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
                className="h-8 text-xs rounded-lg border border-input bg-background px-2 focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Types</option>
                {errorTypes.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <span className="text-xs text-muted-foreground">{filtered.length} errors</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              data-ocid={`${ocidPrefix}.download_button`}
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </button>
            {!bulkEditMode ? (
              <button
                type="button"
                data-ocid={`${ocidPrefix}.enable_edit_button`}
                onClick={onEnableBulkEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-dashed border-border hover:bg-muted transition-colors"
              >
                <ClipboardEdit className="h-3.5 w-3.5" /> Enable Editing (1 credit)
              </button>
            ) : (
              <button
                type="button"
                data-ocid={`${ocidPrefix}.save_all_button`}
                onClick={onSaveAllEdits}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-primary-foreground hover:opacity-90 transition-opacity"
                style={{ background: 'var(--primary)' }}
              >
                <Save className="h-3.5 w-3.5" /> End Editing / Save All
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div data-ocid={`${ocidPrefix}.empty_state`} className="flex flex-col items-center justify-center py-12 text-center gap-3 rounded-lg border border-border bg-card">
            <CheckCircle2 className="h-10 w-10" style={{ color: 'var(--success)' }} />
            <p className="font-semibold text-foreground">No errors found</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm" data-ocid={`${ocidPrefix}.table`}>
              <thead>
                <tr style={{ background: 'oklch(0.95 0.005 264)' }}>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Roll No</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Course Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Course ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Error</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((err, idx) => (
                  <tr key={err.id} data-ocid={`${ocidPrefix}.row.${(page - 1) * PAGE_SIZE + idx + 1}`} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{err.studentId}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-foreground">{err.courseName}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{err.courseId}</td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: `${themeColor} / 0.10`, color: themeColor, border: `1px solid ${themeColor} / 0.25` }}
                      >
                        {err.errorType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          data-ocid={`${ocidPrefix}.view_button.${(page - 1) * PAGE_SIZE + idx + 1}`}
                          onClick={() => setSelectedError(err)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="View error details"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        {bulkEditMode && (
                          <button
                            type="button"
                            data-ocid={`${ocidPrefix}.edit_button.${(page - 1) * PAGE_SIZE + idx + 1}`}
                            onClick={() => setEditingError(err)}
                            className="flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <PenLine className="h-3.5 w-3.5" /> Edit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <button
                type="button"
                data-ocid={`${ocidPrefix}.pagination_prev`}
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs rounded-lg border border-border disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Previous
              </button>
              <button
                type="button"
                data-ocid={`${ocidPrefix}.pagination_next`}
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 text-xs rounded-lg border border-border disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ─── HOD Dashboard ────────────────────────────────────────────────────────────

const TABS = ['Data Upload', 'Overview', 'Errors', '12-Week Courses'] as const

export default function HODDashboard() {
  const navigate = useNavigate()
  const params = useParams<{ collegeName: string; branch: string }>()
  const collegeName = params.collegeName ? decodeURIComponent(params.collegeName) : ''
  const branch = params.branch ? decodeURIComponent(params.branch) : 'CSE'

  const { currentUser, selectedYear, getCampusData, logout, uploadHodEnrollmentFile, uploadHodExamRegFile, uploadCourseFile, restoreSnapshot, setHodPermission, saveHodEdit } = useAppContext()
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Data Upload')
  const [uploadingEnroll, setUploadingEnroll] = useState(false)
  const [uploadingExamReg, setUploadingExamReg] = useState(false)
  const [uploadingCourse, setUploadingCourse] = useState(false)
  const [bulkEditEnroll, setBulkEditEnroll] = useState(false)
  const [bulkEditExamReg, setBulkEditExamReg] = useState(false)

  const data = getCampusData(collegeName, selectedYear ?? '')
  const enrollErrors = data.enrollmentErrors.filter((e) => e.source === 'hod' && e.branch === branch)
  const examRegErrors = data.examRegErrors.filter((e) => e.branch === branch)
  const enrollRecords = data.enrollmentRecords.filter((r) => r.hodBranch === branch)
  const cleanEnroll = enrollRecords.length - enrollErrors.length
  const perm = data.hodPermissions[branch] ?? { branch, uploadCredits: 3, editCredits: 3 }

  const courseFileRef = useRef<HTMLInputElement>(null)

  const handleEnrollUpload = useCallback(async (file: File) => {
    if (perm.uploadCredits <= 0) { toast.error('No upload credits remaining'); return }
    setUploadingEnroll(true)
    try {
      await uploadHodEnrollmentFile(collegeName, selectedYear ?? '', branch, file)
      setHodPermission(collegeName, selectedYear ?? '', branch, { uploadCredits: perm.uploadCredits - 1 })
      toast.success(`Enrollment data uploaded — ${file.name}`)
    } catch {
      toast.error('Failed to parse file')
    } finally {
      setUploadingEnroll(false)
    }
  }, [collegeName, selectedYear, branch, perm.uploadCredits, uploadHodEnrollmentFile, setHodPermission])

  const handleExamRegUpload = useCallback(async (file: File) => {
    if (perm.uploadCredits <= 0) { toast.error('No upload credits remaining'); return }
    setUploadingExamReg(true)
    try {
      await uploadHodExamRegFile(collegeName, selectedYear ?? '', branch, file)
      setHodPermission(collegeName, selectedYear ?? '', branch, { uploadCredits: perm.uploadCredits - 1 })
      toast.success(`Exam reg data uploaded — ${file.name}`)
    } catch {
      toast.error('Failed to parse file')
    } finally {
      setUploadingExamReg(false)
    }
  }, [collegeName, selectedYear, branch, perm.uploadCredits, uploadHodExamRegFile, setHodPermission])

  function handleLogout() {
    logout()
    navigate(`/college/${encodeURIComponent(collegeName)}`)
  }

  const enrollStats = { total: enrollRecords.length, errors: enrollErrors.length, clean: Math.max(0, cleanEnroll) }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button type="button" data-ocid="hod.back_button" onClick={() => navigate(`/college/${encodeURIComponent(collegeName)}`)} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="h-5 w-px bg-border" />
          <Users className="h-5 w-5 text-primary" />
          <span className="font-display font-bold text-base text-foreground">HOD Dashboard</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">{branch}</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">{currentUser?.email}</span>
            <button type="button" data-ocid="hod.logout_button" onClick={handleLogout} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <h1 className="font-display text-2xl font-bold text-foreground">{collegeName} — {branch} HOD</h1>
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
              data-ocid={`hod.tab.${tab.toLowerCase().replace(/[\s-]+/g, '_')}`}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-200 relative"
              style={activeTab === tab ? { background: 'var(--card)', color: 'var(--foreground)', boxShadow: '0 1px 4px oklch(0 0 0 / 0.10)' } : { color: 'var(--muted-foreground)' }}
            >
              {tab}
              {tab === 'Errors' && (enrollErrors.length + examRegErrors.length) > 0 && (
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-destructive text-white font-bold">{enrollErrors.length + examRegErrors.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Data Upload tab */}
        {activeTab === 'Data Upload' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
            <UploadCard
              title="Enrollment File"
              snapshots={data.enrollmentSnapshots.filter((s) => s.fileName.includes(branch) || true)}
              onUpload={handleEnrollUpload}
              onRestore={(id) => { restoreSnapshot(collegeName, selectedYear ?? '', 'enrollment', id); toast.success('Restored previous enrollment data') }}
              uploading={uploadingEnroll}
              credits={perm.uploadCredits}
              ocidPrefix="hod.enrollment"
            />
            <UploadCard
              title="Exam Registration File"
              snapshots={data.examRegSnapshots}
              onUpload={handleExamRegUpload}
              onRestore={(id) => { restoreSnapshot(collegeName, selectedYear ?? '', 'examreg', id); toast.success('Restored previous exam reg data') }}
              uploading={uploadingExamReg}
              credits={perm.uploadCredits}
              ocidPrefix="hod.examreg"
            />
          </div>
        )}

        {/* Overview tab */}
        {activeTab === 'Overview' && (
          <div className="space-y-6 max-w-2xl">
            {enrollRecords.length === 0 ? (
              <div data-ocid="hod.overview_empty_state" className="flex flex-col items-center py-12 text-center gap-3">
                <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-muted-foreground">No enrollment data uploaded yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Enrolled', value: enrollStats.total, color: 'var(--primary)' },
                  { label: 'Enrollment Errors', value: enrollStats.errors, color: 'var(--destructive)' },
                  { label: 'Clean Records', value: enrollStats.clean, color: 'var(--success)' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-border bg-card p-5 text-center">
                    <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Errors tab */}
        {activeTab === 'Errors' && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-display font-bold text-base text-foreground">Enrollment Errors</h2>
                {enrollErrors.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'oklch(0.40 0.18 264 / 0.12)', color: 'oklch(0.40 0.18 264)', border: '1px solid oklch(0.40 0.18 264 / 0.30)' }}>
                    {enrollErrors.length}
                  </span>
                )}
              </div>
              <ErrorsTable
                errors={enrollErrors}
                type="enrollment"
                bulkEditMode={bulkEditEnroll}
                onEnableBulkEdit={() => { if (perm.editCredits <= 0) { toast.error('No edit credits remaining'); return }; setBulkEditEnroll(true) }}
                onSaveAllEdits={() => { setHodPermission(collegeName, selectedYear ?? '', branch, { editCredits: Math.max(0, perm.editCredits - 1) }); setBulkEditEnroll(false); toast.success('All edits saved — 1 credit used') }}
                ocidPrefix="hod.enroll_errors"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-display font-bold text-base text-foreground">Exam Registration Errors</h2>
                {examRegErrors.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'oklch(0.40 0.20 295 / 0.12)', color: 'oklch(0.40 0.20 295)', border: '1px solid oklch(0.40 0.20 295 / 0.30)' }}>
                    {examRegErrors.length}
                  </span>
                )}
              </div>
              <ErrorsTable
                errors={examRegErrors}
                type="examreg"
                bulkEditMode={bulkEditExamReg}
                onEnableBulkEdit={() => { if (perm.editCredits <= 0) { toast.error('No edit credits remaining'); return }; setBulkEditExamReg(true) }}
                onSaveAllEdits={() => { setHodPermission(collegeName, selectedYear ?? '', branch, { editCredits: Math.max(0, perm.editCredits - 1) }); setBulkEditExamReg(false); toast.success('All edits saved — 1 credit used') }}
                ocidPrefix="hod.examreg_errors"
              />
            </div>
          </div>
        )}

        {/* 12-Week Courses tab */}
        {activeTab === '12-Week Courses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-base text-foreground">12-Week Courses</h2>
              <button
                type="button"
                data-ocid="hod.courses_upload_button"
                disabled={uploadingCourse}
                onClick={() => courseFileRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-dashed border-border hover:border-primary hover:bg-muted/30 transition-colors"
              >
                {uploadingCourse ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload Course File
              </button>
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
                  } catch { toast.error('Failed to parse file') } finally {
                    setUploadingCourse(false); e.target.value = ''
                  }
                }}
              />
            </div>
            {data.twelveWeekCourses.length === 0 ? (
              <div data-ocid="hod.courses_empty_state" className="flex flex-col items-center py-12 text-center gap-3 rounded-lg border border-border bg-card">
                <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-muted-foreground">No 12-week courses uploaded yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm" data-ocid="hod.courses_table">
                  <thead>
                    <tr style={{ background: 'oklch(0.95 0.005 264)' }}>
                      <th className="text-left px-4 py-3 font-semibold text-foreground">Course ID</th>
                      <th className="text-left px-4 py-3 font-semibold text-foreground">Course Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-foreground">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.twelveWeekCourses.map((course: Course) => (
                      <tr key={course.courseId} className="border-t border-border hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{course.courseId}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{course.courseName}</td>
                        <td className="px-4 py-3 text-muted-foreground">{course.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
