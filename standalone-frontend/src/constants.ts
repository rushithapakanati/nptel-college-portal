// ─── Constants for RGUKT NPTEL Portal ────────────────────────────────────────

export const COLLEGE_CONFIGS = {
  nuzvid: {
    name: 'RGUKT Nuzvid',
    shortName: 'Nuzvid',
    emailDomain: 'rguktn.ac.in',
    deanEmail: 'dean@rguktn.ac.in',
    studentPrefixes: ['n'],
    color: 'blue',
  },
  srikakulam: {
    name: 'RGUKT Srikakulam',
    shortName: 'Srikakulam',
    emailDomain: 'rguktsklm.ac.in',
    deanEmail: 'dean@rguktsklm.ac.in',
    studentPrefixes: ['s', 'rs'],
    color: 'green',
  },
  rkvalley: {
    name: 'RGUKT RK Valley',
    shortName: 'RK Valley',
    emailDomain: 'rguktrkv.ac.in',
    deanEmail: 'dean@rguktrkv.ac.in',
    studentPrefixes: ['r', 'rr'],
    color: 'purple',
  },
  ongole: {
    name: 'RGUKT Ongole',
    shortName: 'Ongole',
    emailDomain: 'rguktong.ac.in',
    deanEmail: 'dean@rguktong.ac.in',
    studentPrefixes: ['o', 'ro'],
    color: 'orange',
  },
} as const

export type CampusKey = keyof typeof COLLEGE_CONFIGS

export const BRANCHES = ['CSE', 'ECE', 'EEE', 'ME', 'MME', 'CHEM', 'CE'] as const

export const ACADEMIC_YEARS = ['2026 Sem-1', '2026 Sem-2'] as const

export const CAMPUS_DISPLAY = [
  {
    key: 'nuzvid',
    name: 'Nuzvid',
    abbr: 'NUZ',
    location: 'Nuzvid, Andhra Pradesh',
    gradientFrom: 'oklch(0.30 0.16 264)',
    gradientTo: 'oklch(0.48 0.20 264)',
    glowColor: 'oklch(0.38 0.18 264 / 0.40)',
  },
  {
    key: 'srikakulam',
    name: 'Srikakulam',
    abbr: 'SKL',
    location: 'Srikakulam, Andhra Pradesh',
    gradientFrom: 'oklch(0.30 0.16 155)',
    gradientTo: 'oklch(0.48 0.18 165)',
    glowColor: 'oklch(0.38 0.16 160 / 0.40)',
  },
  {
    key: 'rkvalley',
    name: 'RK Valley',
    abbr: 'RKV',
    location: 'Idupulapaya, Andhra Pradesh',
    gradientFrom: 'oklch(0.30 0.16 275)',
    gradientTo: 'oklch(0.48 0.20 285)',
    glowColor: 'oklch(0.38 0.18 280 / 0.40)',
  },
  {
    key: 'ongole',
    name: 'Ongole',
    abbr: 'ONG',
    location: 'Ongole, Andhra Pradesh',
    gradientFrom: 'oklch(0.30 0.14 235)',
    gradientTo: 'oklch(0.46 0.16 220)',
    glowColor: 'oklch(0.36 0.14 228 / 0.40)',
  },
] as const

export function getCampusConfig(name: string) {
  const normalized = name.toLowerCase().replace(/\s+/g, '').replace('-', '')
  // Direct key match
  if (normalized in COLLEGE_CONFIGS) return COLLEGE_CONFIGS[normalized as CampusKey]
  // Match by short name
  for (const [, config] of Object.entries(COLLEGE_CONFIGS)) {
    if (config.shortName.toLowerCase().replace(/\s+/g, '') === normalized) return config
  }
  return null
}

export function getCampusKey(name: string): CampusKey | null {
  const normalized = name.toLowerCase().replace(/\s+/g, '')
  for (const [key, config] of Object.entries(COLLEGE_CONFIGS)) {
    if (
      key === normalized ||
      config.shortName.toLowerCase().replace(/\s+/g, '') === normalized
    ) {
      return key as CampusKey
    }
  }
  return null
}

export function isValidStudentEmail(email: string, campus: string): boolean {
  const config = getCampusConfig(campus)
  if (!config) return false
  const lower = email.toLowerCase()
  if (!lower.endsWith(`@${config.emailDomain}`)) return false
  const localPart = lower.split('@')[0]
  return config.studentPrefixes.some((prefix) => {
    const rest = localPart.startsWith(prefix) ? localPart.slice(prefix.length) : null
    return rest !== null && /^\d{6}$/.test(rest)
  })
}

export function normalizePaymentStatus(status: string): 'done' | 'redo' | 'dofirst' {
  const s = status.toLowerCase().trim().replace(/[_\s]/g, '')
  if (['paymentcomplete', 'complete', 'done', 'paid', 'success', 'completed', 'paymentsuccess'].includes(s))
    return 'done'
  if (['paymentfailed', 'failed', 'redo', 'failedpayment', 'paymentpending', 'pending', 'paymentdraft', 'draft'].includes(s))
    return 'redo'
  return 'dofirst'
}

export function createEmptyCampusData() {
  return {
    enrollmentRecords: [],
    examRegRecords: [],
    shuffleRecords: [],
    twelveWeekCourses: [],
    enrollmentErrors: [],
    examRegErrors: [],
    enrollmentSnapshots: [],
    examRegSnapshots: [],
    shuffleSnapshots: [],
    hodEditedRecords: [],
    hodPermissions: {},
    enrollmentFileTotalCount: 0,
    examRegFileTotalCount: 0,
    doneRegistrations: [],
    deanStudentDataUploaded: false,
    deanExamRegDataUploaded: false,
    deanShuffleDataUploaded: false,
  }
}
