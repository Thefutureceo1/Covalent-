/**
 * JSON → CSV converter
 * Uses json2csv (browser-compatible transform)
 * All processing is 100% client-side.
 */

export interface CSVOptions {
  delimiter?: string
  includeHeaders?: boolean
}

/**
 * Flatten a nested object into dot-notation keys
 */
function flattenObject(obj: unknown, prefix = ''): Record<string, string | number | boolean | null> {
  const result: Record<string, string | number | boolean | null> = {}

  if (obj === null || obj === undefined) {
    result[prefix || 'value'] = null
    return result
  }

  if (typeof obj !== 'object' || Array.isArray(obj)) {
    result[prefix || 'value'] = Array.isArray(obj) ? JSON.stringify(obj) : String(obj)
    return result
  }

  const record = obj as Record<string, unknown>
  for (const key of Object.keys(record)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    const val = record[key]
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(result, flattenObject(val, fullKey))
    } else if (Array.isArray(val)) {
      result[fullKey] = JSON.stringify(val)
    } else {
      result[fullKey] = val as string | number | boolean | null
    }
  }
  return result
}

/**
 * Escape a CSV field
 */
function escapeCSVField(value: string | number | boolean | null, delimiter: string): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  const needsQuoting = str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')
  if (needsQuoting) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function toCSV(data: unknown, options: CSVOptions = {}): string {
  const { delimiter = ',', includeHeaders = true } = options

  // Normalize to array of objects
  let rows: unknown[]
  if (Array.isArray(data)) {
    rows = data
  } else if (typeof data === 'object' && data !== null) {
    // If it's an object with a single array value, use that
    const vals = Object.values(data as Record<string, unknown>)
    if (vals.length === 1 && Array.isArray(vals[0])) {
      rows = vals[0] as unknown[]
    } else {
      rows = [data]
    }
  } else {
    rows = [{ value: data }]
  }

  if (rows.length === 0) {
    return ''
  }

  // Flatten all rows
  const flatRows = rows.map(row => flattenObject(row))

  // Collect all keys (union of all row keys)
  const allKeys = Array.from(
    new Set(flatRows.flatMap(row => Object.keys(row)))
  )

  const lines: string[] = []

  if (includeHeaders) {
    lines.push(allKeys.map(k => escapeCSVField(k, delimiter)).join(delimiter))
  }

  for (const row of flatRows) {
    const line = allKeys.map(key => {
      const val = key in row ? row[key] : null
      return escapeCSVField(val, delimiter)
    }).join(delimiter)
    lines.push(line)
  }

  return lines.join('\n')
}
