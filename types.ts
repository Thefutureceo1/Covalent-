export type ConversionTab = 'csv' | 'yaml' | 'xml' | 'sql' | 'markdown' | 'excel'

export interface TabConfig {
  id: ConversionTab
  label: string
  extension: string
  mimeType: string
  requiresPlan: 'free' | 'plus' | 'pro'
  description: string
}

export const TABS: TabConfig[] = [
  {
    id: 'csv',
    label: 'CSV',
    extension: 'csv',
    mimeType: 'text/csv',
    requiresPlan: 'free',
    description: 'Comma-separated values',
  },
  {
    id: 'yaml',
    label: 'YAML',
    extension: 'yaml',
    mimeType: 'text/yaml',
    requiresPlan: 'free',
    description: 'Human-readable data serialization',
  },
  {
    id: 'xml',
    label: 'XML',
    extension: 'xml',
    mimeType: 'application/xml',
    requiresPlan: 'free',
    description: 'Extensible Markup Language',
  },
  {
    id: 'sql',
    label: 'SQL',
    extension: 'sql',
    mimeType: 'application/sql',
    requiresPlan: 'free',
    description: 'INSERT statements',
  },
  {
    id: 'markdown',
    label: 'Markdown',
    extension: 'md',
    mimeType: 'text/markdown',
    requiresPlan: 'free',
    description: 'Markdown table',
  },
  {
    id: 'excel',
    label: 'Excel',
    extension: 'xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    requiresPlan: 'plus',
    description: 'Microsoft Excel workbook',
  },
]

export type UpgradeModalTrigger = 'file-size' | 'daily-limit' | 'excel-tab' | 'batch' | 'advanced-format'

export interface UpgradeModalState {
  open: boolean
  trigger: UpgradeModalTrigger | null
}
