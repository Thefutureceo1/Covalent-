import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Detect circular references in an object.
 * Returns true if circular, false otherwise.
 */
export function hasCircularReference(obj: unknown): boolean {
  const seen = new WeakSet()
  function detect(value: unknown): boolean {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return true
      seen.add(value)
      for (const key of Object.keys(value as object)) {
        if (detect((value as Record<string, unknown>)[key])) return true
      }
      seen.delete(value)
    }
    return false
  }
  return detect(obj)
}

/**
 * Normalize root value: wrap arrays as { items: [...] }
 */
export function normalizeRoot(data: unknown): Record<string, unknown> {
  if (Array.isArray(data)) {
    return { items: data }
  }
  if (typeof data === 'object' && data !== null) {
    return data as Record<string, unknown>
  }
  return { value: data }
}

/**
 * Safely parse JSON with descriptive error messages
 */
export function safeParseJSON(input: string): { data: unknown; error: string | null } {
  if (!input.trim()) {
    return { data: null, error: 'Input is empty. Paste some JSON to get started.' }
  }
  try {
    const data = JSON.parse(input)
    return { data, error: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { data: null, error: `Invalid JSON: ${msg}` }
  }
}

/**
 * Download a string as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Download binary blob as a file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Get byte size of a string
 */
export function getByteSize(str: string): number {
  return new Blob([str]).size
}

/**
 * Format bytes to human-readable
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
