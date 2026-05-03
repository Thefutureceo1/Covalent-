import { Shield, Github } from 'lucide-react'
import type { ConversionLimit } from '../hooks/useConversionLimit'

interface FooterProps {
  conversionLimit: ConversionLimit
}

export function Footer({ conversionLimit }: FooterProps) {
  const { used, limit, remaining } = conversionLimit
  const isUnlimited = limit === -1

  return (
    <footer className="h-8 flex items-center justify-between px-5 border-t border-border bg-bg-secondary shrink-0">
      <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
        <Shield size={11} className="text-accent-green" />
        <span>🔒 All conversion happens locally in your browser. Zero data uploaded.</span>
      </div>
      <div className="flex items-center gap-4 text-[11px] text-text-muted">
        {!isUnlimited && (
          <span>
            <span className={remaining === 0 ? 'text-red-400 font-600' : remaining <= 3 ? 'text-accent-amber' : ''}>
              {used}/{limit}
            </span>
            {' '}conversions today
          </span>
        )}
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-text-secondary transition-colors"
        >
          <Github size={11} />
          GitHub
        </a>
      </div>
    </footer>
  )
}
