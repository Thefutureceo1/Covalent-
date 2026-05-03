/**
 * JSON → Excel XLSX converter
 * Uses SheetJS (xlsx) — browser-compatible.
 * PRO FEATURE — gated behind plan check.
 * All processing is 100% client-side.
 */
import * as XLSX from 'xlsx'

export interface ExcelOptions {
  sheetName?: string
  freezeHeader?: boolean
  autoWidth?: boolean
}

/**
 * Flatten a nested object (same logic as CSV)
 */
function flattenRow(obj: unknown, prefix = ''): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  if (obj === null || obj === undefined) {
    result[prefix || 'value'] = null
    return result
  }
  if (Array.isArray(obj)) {
    result[prefix || 'value'] = JSON.stringify(obj)
    return result
  }
  if (typeof obj === 'object') {
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      const fullKey = prefix ? `${prefix}.${key}` : key
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        Object.assign(result, flattenRow(val, fullKey))
      } else if (Array.isArray(val)) {
        result[fullKey] = JSON.stringify(val)
      } else {
        result[fullKey] = val
      }
    }
    return result
  }
  result[prefix || 'value'] = obj
  return result
}

export function toExcelBlob(data: unknown, options: ExcelOptions = {}): Blob {
  const { sheetName = 'Sheet1', autoWidth = true } = options

  // Normalize to array
  let rows: unknown[]
  if (Array.isArray(data)) {
    rows = data
  } else if (typeof data === 'object' && data !== null) {
    const vals = Object.values(data as Record<string, unknown>)
    if (vals.length === 1 && Array.isArray(vals[0])) {
      rows = vals[0] as unknown[]
    } else {
      rows = [data]
    }
  } else {
    rows = [{ value: data }]
  }

  const flatRows = rows.map(r => flattenRow(r))

  // Create worksheet from JSON
  const ws = XLSX.utils.json_to_sheet(flatRows)

  // Auto column width
  if (autoWidth && flatRows.length > 0) {
    const allKeys = Object.keys(flatRows[0])
    const colWidths = allKeys.map(key => {
      const maxDataLen = Math.max(
        key.length,
        ...flatRows.map(row => String(row[key] ?? '').length).slice(0, 100)
      )
      return { wch: Math.min(Math.max(maxDataLen + 2, 8), 60) }
    })
    ws['!cols'] = colWidths
  }

  // Style header row (bold)
  if (flatRows.length > 0) {
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col })
      if (ws[cellAddr]) {
        ws[cellAddr].s = { font: { bold: true } }
      }
    }
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31)) // Excel sheet name limit

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
