import { X, Zap, FileSpreadsheet, BarChart3, Clock } from 'lucide-react'
import { cn } from '../lib/utils'
import type { UpgradeModalTrigger } from '../types'

interface UpgradeModalProps {
  open: boolean
  trigger: UpgradeModalTrigger | null
  onClose: () => void
  onSelectPlan: (plan: 'plus' | 'pro') => void
}

const TRIGGER_CONTENT: Record<UpgradeModalTrigger, {
  icon: React.ReactNode
  headline: string
  subline: string
  recommendedPlan: 'plus' | 'pro'
}> = {
  'file-size': {
    icon: <FileSpreadsheet size={20} className="text-accent-amber" />,
    headline: 'File too large for free tier',
    subline: 'Free plan supports files up to 1 MB. Upgrade to Plus for 100 MB or Pro for 500 MB.',
    recommendedPlan: 'plus',
  },
  'daily-limit': {
    icon: <Clock size={20} className="text-accent-amber" />,
    headline: "You've hit your daily limit",
    subline: 'Free plan allows 10 conversions per day. Upgrade for unlimited conversions.',
    recommendedPlan: 'plus',
  },
  'excel-tab': {
    icon: <FileSpreadsheet size={20} className="text-accent-cyan" />,
    headline: 'Excel export is a paid feature',
    subline: 'Export to XLSX with proper formatting, column widths, and bold headers.',
    recommendedPlan: 'plus',
  },
  'batch': {
    icon: <BarChart3 size={20} className="text-accent-purple" />,
    headline: 'Batch conversion is Pro only',
    subline: 'Convert multiple JSON files at once with a single click.',
    recommendedPlan: 'pro',
  },
  'advanced-format': {
    icon: <Zap size={20} className="text-accent-purple" />,
    headline: 'Advanced formats require Pro',
    subline: 'GeoJSON, JSON-LD, JSON Schema and more are available on Pro.',
    recommendedPlan: 'pro',
  },
}

interface PlanCardProps {
  name: string
  price: string
  period: string
  features: string[]
  isRecommended?: boolean
  accentClass: string
  borderClass: string
  onSelect: () => void
}

function PlanCard({ name, price, period, features, isRecommended, accentClass, borderClass, onSelect }: PlanCardProps) {
  return (
    <div className={cn(
      'relative flex flex-col gap-4 p-5 rounded-xl border transition-all cursor-pointer group hover:bg-bg-tertiary',
      isRecommended ? borderClass : 'border-border'
    )}
      onClick={onSelect}
    >
      {isRecommended && (
        <div className={cn('absolute -top-2.5 left-4 text-[10px] font-600 px-2.5 py-0.5 rounded-full', accentClass)}>
          Recommended
        </div>
      )}
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-display font-700 text-text-primary">{price}</span>
          <span className="text-sm text-text-muted">/{period}</span>
        </div>
        <div className="text-sm font-600 text-text-secondary mt-0.5">{name}</div>
      </div>
      <ul className="space-y-1.5">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-xs text-text-secondary">
            <span className={cn('w-1 h-1 rounded-full shrink-0', accentClass.includes('cyan') ? 'bg-accent-cyan' : 'bg-accent-purple')} />
            {f}
          </li>
        ))}
      </ul>
      <button className={cn(
        'mt-auto w-full py-2 rounded-lg text-sm font-600 transition-all',
        isRecommended
          ? cn('text-bg', accentClass.includes('cyan') ? 'bg-accent-cyan hover:bg-accent-cyan/90' : 'bg-accent-purple hover:bg-accent-purple/90')
          : 'bg-bg-tertiary hover:bg-bg text-text-primary border border-border'
      )}>
        Choose {name}
      </button>
    </div>
  )
}

export function UpgradeModal({ open, trigger, onClose, onSelectPlan }: UpgradeModalProps) {
  if (!open || !trigger) return null

  const content = TRIGGER_CONTENT[trigger]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-bg-secondary border border-border rounded-2xl shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-bg-tertiary border border-border flex items-center justify-center">
              {content.icon}
            </div>
            <div>
              <h2 className="font-display font-700 text-text-primary text-base">{content.headline}</h2>
              <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{content.subline}</p>
            </div>
          </div>
        </div>

        {/* Plan cards */}
        <div className="p-6 grid grid-cols-2 gap-3">
          <PlanCard
            name="Plus"
            price="$10"
            period="mo"
            isRecommended={content.recommendedPlan === 'plus'}
            accentClass="bg-accent-cyan/15 text-accent-cyan"
            borderClass="border-accent-cyan/30"
            features={[
              'Excel (.xlsx) export',
              '100 MB file size',
              'Unlimited conversions',
              'Conversion history',
            ]}
            onSelect={() => onSelectPlan('plus')}
          />
          <PlanCard
            name="Pro"
            price="$20"
            period="mo"
            isRecommended={content.recommendedPlan === 'pro'}
            accentClass="bg-accent-purple/20 text-accent-purple"
            borderClass="border-accent-purple/30"
            features={[
              'Everything in Plus',
              '500 MB file size',
              'Batch conversions',
              'GeoJSON, JSON-LD, Schema',
              'API key access',
            ]}
            onSelect={() => onSelectPlan('pro')}
          />
        </div>

        <div className="px-6 pb-5 text-center text-xs text-text-muted">
          Annual plans save up to 17% · Lifetime deal available for Pro
        </div>
      </div>
    </div>
  )
}
