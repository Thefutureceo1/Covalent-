import { useCallback } from 'react'
import { Copy, Download, CheckCheck, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { cn, downloadFile, formatBytes, getByteSize } from '../lib/utils'
import { TABS, type ConversionTab } from '../types'

interface OutputPanelProps {
  activeTab: ConversionTab
  output: string
  isConverting: boolean
  onDownload: () => void
}

export function OutputPanel({ activeTab, output, isConverting, onDownload }: OutputPanelProps) {
  const [copied, setCopied] = useState(false)

  const tabConfig = TABS.find(t => t.id === activeTab)!

  const handleCopy = useCallback(async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }, [output])

  const byteSize = output ? getByteSize(output) : 0
  const lineCount = output ? output.split('\n').length : 0

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2 text-text-secondary">
          <span className="text-xs font-mono font-500 uppercase tracking-wider text-text-muted">
            {tabConfig.label}
          </span>
          {output && (
            <span className="text-[10px] text-text-muted font-mono">
              {lineCount} lines · {formatBytes(byteSize)}
            </span>
          )}
        </div>

        {output && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className={cn(
                'flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded transition-all',
                copied
                  ? 'bg-accent-green/15 text-accent-green border border-accent-green/25'
                  : 'text-text-muted hover:text-text-secondary hover:bg-bg-tertiary'
              )}
            >
              {copied ? <CheckCheck size={12} /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={onDownload}
              className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded text-text-muted hover:text-text-secondary hover:bg-bg-tertiary transition-all"
            >
              <Download size={12} />
              .{tabConfig.extension}
            </button>
          </div>
        )}
      </div>

      {/* Output content */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {isConverting ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 text-text-muted text-sm">
              <Loader2 size={16} className="animate-spin" />
              Converting…
            </div>
          </div>
        ) : output ? (
          <pre className="output-code h-full p-4 text-text-primary overflow-auto">{output}</pre>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-text-muted">
            <div className="w-10 h-10 rounded-xl bg-bg-tertiary border border-border flex items-center justify-center">
              <span className="text-lg font-mono font-600 text-text-muted">{ }</span>
            </div>
            <p className="text-sm">Paste JSON on the left to convert</p>
          </div>
        )}
      </div>
    </div>
  )
}
