/**
 * JSON → XML converter
 * Uses xmlbuilder2 (browser-compatible).
 * All processing is 100% client-side.
 */
import { create } from 'xmlbuilder2'
import { normalizeRoot } from '../lib/utils'

export interface XMLOptions {
  rootElement?: string
  prettyPrint?: boolean
  indent?: string
}

function buildXMLNode(parent: ReturnType<typeof create>, key: string, value: unknown): void {
  if (value === null || value === undefined) {
    parent.ele(sanitizeKey(key)).txt('null')
    return
  }

  if (Array.isArray(value)) {
    const arr = value as unknown[]
    if (arr.length === 0) {
      parent.ele(sanitizeKey(key))
      return
    }
    for (const item of arr) {
      const itemKey = singularize(sanitizeKey(key))
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        const node = parent.ele(itemKey)
        for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
          buildXMLNode(node, k, v)
        }
      } else {
        parent.ele(itemKey).txt(String(item))
      }
    }
    return
  }

  if (typeof value === 'object') {
    const node = parent.ele(sanitizeKey(key))
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      buildXMLNode(node, k, v)
    }
    return
  }

  parent.ele(sanitizeKey(key)).txt(String(value))
}

/** Remove characters illegal in XML element names */
function sanitizeKey(key: string): string {
  // XML names can't start with a number or contain certain chars
  let safe = key.replace(/[^a-zA-Z0-9_\-\.]/g, '_')
  if (/^[0-9\-\.]/.test(safe)) {
    safe = '_' + safe
  }
  return safe || '_element'
}

/** Naive singularize for array item names */
function singularize(word: string): string {
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y'
  if (word.endsWith('ses') || word.endsWith('xes') || word.endsWith('ches') || word.endsWith('shes')) {
    return word.slice(0, -2)
  }
  if (word.endsWith('s') && word.length > 3) return word.slice(0, -1)
  return word
}

export function toXML(data: unknown, options: XMLOptions = {}): string {
  const { rootElement = 'root', prettyPrint = true, indent = '  ' } = options

  const normalized = normalizeRoot(data)

  const doc = create({ version: '1.0', encoding: 'UTF-8' })
  const root = doc.ele(sanitizeKey(rootElement))

  for (const [key, value] of Object.entries(normalized)) {
    buildXMLNode(root, key, value)
  }

  return doc.end({ prettyPrint, indent, newline: '\n' })
}
