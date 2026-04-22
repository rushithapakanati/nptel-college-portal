import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle, ArrowLeft, BookOpen, Calendar, CheckCircle2,
  ClipboardCheck, Eye, GraduationCap, LogOut, MapPin, Shuffle, XCircle,
} from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import type { EnrollmentError, ExamRegError, ExamShuffleUploadRecord, StudentUploadRecord } from '../types'
import { normalizePaymentStatus } from '../constants'

// ─── Error description popup ──────────────────────────────────────────────────

function ErrorPopup({ error, onClose }: { error: EnrollmentError | ExamRegError | null; onClose: () => void }) {
  if (!error) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Error details"
    >
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm cursor-default"
        onClick={onClose}
        aria-label="Close dialog"
        tabIndex={-1}
      />
      <div
        className="relative z-10 w-full max-w-md rounded-xl bg-card border border-border shadow-xl p-6"
        data-ocid="student.error_dialog"
      >
        <button
          type="button"
          data-ocid="student.error_close_button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
          aria-label="Close"
        >
          <XCircle className="h-5 w-5" />
        </button>
        <h3 className="font-display font-bold text-base text-foreground mb-4 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" /> Error Details
        </h3>
        <div className="space-y-3 text-sm">
          {error.courseName && (
            <div>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Course</span>
              <p className="font-bold text-primary mt-0.5">{error.courseName}</p>
            </div>
          )}
          {error.courseId && (
            <div>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Course ID</span>
              <p className="font-mono text-sm mt-0.5 text-foreground">{error.courseId}</p>
            </div>
          )}
          <div>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Error Type</span>
            <p className="mt-0.5 text-foreground capitalize">{error.errorType.replace(/_/g, ' ')}</p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Description</span>
            <p className="mt-0.5 text-foreground">{error.description}</p>
          </div>
          {error.studentId && (
            <div>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Roll No</span>
              <p className="font-mono text-sm mt-0.5 text-foreground">{error.studentId}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Enrollment tab ───────────────────────────────────────────────────────────

function EnrollmentTab({
  records, errors, dataUploaded,
}: { records: StudentUploadRecord[]; errors: EnrollmentError[]; dataUploaded: boolean }) {
  const [selectedError, setSelectedError] = useState<EnrollmentError | null>(null)

  if (!dataUploaded) {
    return (
      <div data-ocid="student.enrollment_empty_state" className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <BookOpen className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-lg font-semibold text-muted-foreground">No enrollment data uploaded yet</p>
        <p className="text-sm text-muted-foreground">Contact your Dean or HOD to upload enrollment data</p>
      </div>
    )
  }
  if (records.length === 0) {
    return (
      <div data-ocid="student.enrollment_empty_state" className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <AlertCircle className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-lg font-semibold text-muted-foreground">Your records were not found in the uploaded data</p>
        <p className="text-sm text-muted-foreground">Verify your email or contact your HOD</p>
      </div>
    )
  }
  if (errors.length === 0) {
    return (
      <div data-ocid="student.enrollment_success_state" className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <CheckCircle2 className="h-12 w-12" style={{ color: 'var(--success)' }} />
        <p className="text-lg font-semibold text-foreground">No enrollment errors found</p>
        <p className="text-sm text-muted-foreground">Your enrollment data looks good — {records.length} course(s) enrolled</p>
      </div>
    )
  }
  return (
    <>
      <ErrorPopup error={selectedError} onClose={() => setSelectedError(null)} />
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{errors.length} error(s) found in your enrollment data</p>
        {errors.map((err, idx) => (
          <button
            key={err.id}
            type="button"
            data-ocid={`student.enrollment_error.${idx + 1}`}
            onClick={() => setSelectedError(err)}
            className="w-full text-left rounded-lg border border-border bg-card p-4 hover:border-destructive/50 hover:bg-muted/30 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-bold text-sm text-foreground">{err.courseName}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'oklch(0.55 0.22 25 / 0.12)', color: 'oklch(0.55 0.22 25)', border: '1px solid oklch(0.55 0.22 25 / 0.30)' }}
                  >
                    {err.errorType.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs font-mono text-muted-foreground">{err.courseId}</p>
              </div>
              <Eye className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </div>
          </button>
        ))}
      </div>
    </>
  )
}

// ─── Exam Reg tab ─────────────────────────────────────────────────────────────

function ExamRegTab({
  records, errors, dataUploaded,
}: { records: StudentUploadRecord[]; errors: ExamRegError[]; dataUploaded: boolean }) {
  const [selectedError, setSelectedError] = useState<ExamRegError | null>(null)

  if (!dataUploaded) {
    return (
      <div data-ocid="student.examreg_empty_state" className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <ClipboardCheck className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-lg font-semibold text-muted-foreground">No exam registration data uploaded yet</p>
      </div>
    )
  }
  if (records.length === 0) {
    return (
      <div data-ocid="student.examreg_empty_state" className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <AlertCircle className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-lg font-semibold text-muted-foreground">No exam registration records found</p>
      </div>
    )
  }

  const getPaymentBadge = (status?: string) => {
    const n = normalizePaymentStatus(status ?? '')
    if (n === 'done') return { label: 'Done', bg: 'oklch(0.55 0.15 145 / 0.12)', color: 'oklch(0.45 0.15 145)', border: '1px solid oklch(0.55 0.15 145 / 0.30)' }
    if (n === 'redo') return { label: 'Redo', bg: 'oklch(0.55 0.22 25 / 0.12)', color: 'oklch(0.55 0.22 25)', border: '1px solid oklch(0.55 0.22 25 / 0.30)' }
    return { label: 'Do First', bg: 'oklch(0.70 0.15 85 / 0.12)', color: 'oklch(0.55 0.15 85)', border: '1px solid oklch(0.70 0.15 85 / 0.30)' }
  }

  return (
    <>
      <ErrorPopup error={selectedError} onClose={() => setSelectedError(null)} />
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm" data-ocid="student.examreg_table">
          <thead>
            <tr style={{ background: 'oklch(0.95 0.005 264)' }}>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Course Name</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Course ID</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Registration Status</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {records.map((rec, idx) => {
              const badge = getPaymentBadge(rec.paymentStatus)
              const err = errors.find((e) => e.courseId === rec.courseId)
              return (
                <tr key={`${rec.studentId}-${rec.courseId}`} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{rec.courseName || rec.courseId}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{rec.courseId}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: badge.bg, color: badge.color, border: badge.border }}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {err ? (
                      <button
                        type="button"
                        data-ocid={`student.examreg_error.${idx + 1}`}
                        onClick={() => setSelectedError(err)}
                        className="flex items-center gap-1.5 text-xs text-destructive hover:underline"
                      >
                        <AlertCircle className="h-3.5 w-3.5" /> View Error
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ─── Exam Shuffle tab ─────────────────────────────────────────────────────────

function ExamShuffleTab({ record, shuffleUploaded }: { record: ExamShuffleUploadRecord | null; shuffleUploaded: boolean }) {
  if (!shuffleUploaded) {
    return (
      <div data-ocid="student.shuffle_empty_state" className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <Shuffle className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-lg font-semibold text-muted-foreground">Exam Shuffle Not Yet Released</p>
        <p className="text-sm text-muted-foreground">The Dean has not uploaded the exam shuffle file yet</p>
      </div>
    )
  }
  if (!record) {
    return (
      <div data-ocid="student.shuffle_empty_state" className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <AlertCircle className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-lg font-semibold text-muted-foreground">No shuffle record found for you</p>
      </div>
    )
  }
  const details = [
    { label: 'Roll No', value: record.rollNo, icon: GraduationCap },
    { label: 'Course Name', value: record.courseName, icon: BookOpen },
    { label: 'Course ID', value: record.courseId, icon: BookOpen },
    { label: 'Exam Center', value: record.examCenter, icon: MapPin },
    { label: 'Exam Date', value: record.examDate, icon: Calendar },
    { label: 'Time Slot', value: record.timeSlot, icon: ClipboardCheck },
    { label: 'Hall Ticket No', value: record.hallTicketNo, icon: ClipboardCheck },
    ...(record.seatingNo ? [{ label: 'Seating No', value: record.seatingNo, icon: MapPin }] : []),
  ]
  return (
    <div data-ocid="student.shuffle_details" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {details.filter((d) => d.value).map((detail) => (
        <div key={detail.label} className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{detail.label}</p>
          <p className="font-semibold text-foreground">{detail.value}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Main StudentDashboard ────────────────────────────────────────────────────

const TABS = ['Enrollment', 'Exam Registration', 'Exam Shuffle'] as const

export default function StudentDashboard() {
  const navigate = useNavigate()
  const params = useParams<{ collegeName: string }>()
  const collegeName = params.collegeName ? decodeURIComponent(params.collegeName) : ''
  const { currentUser, selectedYear, getCampusData, getStudentData, logout } = useAppContext()
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Enrollment')

  const campus = getCampusData(collegeName, selectedYear ?? '')
  const studentEmail = currentUser?.email ?? ''
  const studentData = getStudentData(collegeName, selectedYear ?? '', studentEmail)

  function handleLogout() {
    logout()
    navigate(`/college/${encodeURIComponent(collegeName)}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            data-ocid="student.back_button"
            onClick={() => navigate(`/college/${encodeURIComponent(collegeName)}`)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-display font-bold text-base text-foreground">Student Portal</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block truncate max-w-[160px]">{studentEmail}</span>
            <button
              type="button"
              data-ocid="student.logout_button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Hero strip */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <h1 className="font-display text-2xl font-bold text-foreground">{collegeName} — Student Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedYear} • {studentEmail}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-lg bg-muted w-fit mb-8 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              data-ocid={`student.tab.${tab.toLowerCase().replace(/\s+/g, '_')}`}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-200"
              style={
                activeTab === tab
                  ? { background: 'var(--card)', color: 'var(--foreground)', boxShadow: '0 1px 4px oklch(0 0 0 / 0.10)' }
                  : { color: 'var(--muted-foreground)' }
              }
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="max-w-3xl">
          {activeTab === 'Enrollment' && (
            <EnrollmentTab
              records={studentData.enrollmentRecords}
              errors={studentData.enrollmentErrors}
              dataUploaded={campus.deanStudentDataUploaded}
            />
          )}
          {activeTab === 'Exam Registration' && (
            <ExamRegTab
              records={studentData.examRegRecords}
              errors={studentData.examRegErrors}
              dataUploaded={campus.deanExamRegDataUploaded}
            />
          )}
          {activeTab === 'Exam Shuffle' && (
            <ExamShuffleTab
              record={studentData.shuffleRecord}
              shuffleUploaded={campus.deanShuffleDataUploaded}
            />
          )}
        </div>
      </div>
    </div>
  )
}
