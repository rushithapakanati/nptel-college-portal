import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizePaymentStatus(status: string): 'done' | 'redo' | 'dofirst' {
  const s = status.toLowerCase().trim().replace(/[_\s]/g, '')
  if (['paymentcomplete', 'complete', 'done', 'paid', 'success', 'completed', 'paymentsuccess'].includes(s))
    return 'done'
  if (['paymentfailed', 'failed', 'redo', 'failedpayment', 'paymentpending', 'pending', 'paymentdraft', 'draft'].includes(s))
    return 'redo'
  return 'dofirst'
}

export function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email)
}

export function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

export function downloadExcel(
  rows: Record<string, string>[],
  filename: string,
) {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const csvLines = [
    headers.join(','),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const val = r[h] ?? ''
          return val.includes(',') || val.includes('"')
            ? `"${val.replace(/"/g, '""')}"`
            : val
        })
        .join(','),
    ),
  ]
  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
