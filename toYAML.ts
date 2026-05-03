/**
 * JSON → YAML converter
 * Uses the 'yaml' npm package (browser-compatible).
 * All processing is 100% client-side.
 */
import { stringify } from 'yaml'
import { normalizeRoot } from '../lib/utils'

export interface YAMLOptions {
  indent?: number
  lineWidth?: number
}

export function toYAML(data: unknown, options: YAMLOptions = {}): string {
  const { indent = 2, lineWidth = 80 } = options

  // Normalize arrays to objects for YAML root
  const normalized = Array.isArray(data) ? normalizeRoot(data) : data

  return stringify(normalized, {
    indent,
    lineWidth,
    defaultKeyType: 'PLAIN',
    defaultStringType: 'PLAIN',
  })
}
