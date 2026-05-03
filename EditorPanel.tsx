import { useRef, useCallback } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import { FileJson, Clipboard, Trash2, AlertCircle } from 'lucide-react'
import { cn, formatBytes, getByteSize } from '../lib/utils'

interface EditorPanelProps {
  value: string
  onChange: (value: string) => void
  error: string | null
  fileSizeWarning: string | null
}

const SAMPLE_JSON = `{
  "users": [
    {
      "id": 1,
      "name": "Alice Chen",
      "email": "alice@example.com",
      "role": "admin",
      "active": true,
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "name": "Bob Muller",
      "email": "bob@example.com",
      "role": "editor",
      "active": false,
      "createdAt": "2024-03-22T14:15:00Z"
    }
  ],
  "total": 2,
  "page": 1
}`

export function EditorPanel({ value, onChange, error, fileSizeWarning }: EditorPanelProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)

  const handleMount: OnMount = useCallback((editor) => {
    editorRef.current = editor
    // Format on mount
    setTimeout(() => {
      editor.getAction('editor.action.formatDocument')?.run()
    }, 300)
  }, [])

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      onChange(text)
    } catch {
      // Clipboard API not available
    }
  }, [onChange])

  const handleClear = useCallback(() => {
    onChange('')
  }, [onChange])

  const handleSample = useCallback(() => {
    onChange(SAMPLE_JSON)
  }, [onChange])

  const byteSize = getByteSize(value)
  const hasContent = value.trim().length > 0

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2 text-text-secondary">
          <FileJson size={14} />
          <span className="text-xs font-mono font-500">JSON Input</span>
          {hasContent && (
            <span className="text-[10px] text-text-muted font-mono ml-1">
              {formatBytes(byteSize)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleSample}
            className="text-[11px] px-2.5 py-1 rounded text-text-muted hover:text-text-secondary hover:bg-bg-tertiary transition-all"
            title="Load sample JSON"
          >
            Sample
          </button>
          <button
            onClick={handlePaste}
            className="p-1.5 rounded text-text-muted hover:text-text-secondary hover:bg-bg-tertiary transition-all"
            title="Paste from clipboard"
          >
            <Clipboard size={13} />
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 rounded text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-all"
            title="Clear editor"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Error/warning banners */}
      {(error || fileSizeWarning) && (
        <div className={cn(
          'flex items-start gap-2 px-4 py-2.5 text-xs shrink-0 border-b',
          error
            ? 'bg-red-500/10 border-red-500/20 text-red-400'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
        )}>
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          <span className="font-mono leading-relaxed">{error ?? fileSizeWarning}</span>
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language="json"
          value={value}
          onChange={(v) => onChange(v ?? '')}
          onMount={handleMount}
          theme="vs-dark"
          options={{
            fontSize: 13,
            fontFamily: '"JetBrains Mono", monospace',
            fontLigatures: true,
            lineNumbers: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 2,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            smoothScrolling: true,
            cursorSmoothCaretAnimation: 'on',
            bracketPairColorization: { enabled: true },
            formatOnPaste: true,
            renderLineHighlight: 'gutter',
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
            },
          }}
        />
      </div>
    </div>
  )
}
