import { useState, useCallback } from 'react'
import { X, Check, Zap, Loader2, AlertCircle, ExternalLink } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import { cn } from '../lib/utils'
import { PayPalSubscriptionButton } from './PayPalButtons'
import type { Plan, Billing } from '../hooks/useUserPlan'

interface PricingModalProps {
  open: boolean
  onClose: () => void
  defaultPlan?: 'plus' | 'pro'
}

type BillingCycle = 'monthly' | 'annual' | 'lifetime'

const PLAN_IDS = {
  plus_monthly: import.meta.env.VITE_PAYPAL_PLUS_MONTHLY_PLAN_ID ?? '',
  plus_annual:  import.meta.env.VITE_PAYPAL_PLUS_ANNUAL_PLAN_ID  ?? '',
  pro_monthly:  import.meta.env.VITE_PAYPAL_PRO_MONTHLY_PLAN_ID  ?? '',
  pro_annual:   import.meta.env.VITE_PAYPAL_PRO_ANNUAL_PLAN_ID   ?? '',
}

const LIFETIME_URL = import.meta.env.VITE_PAYPAL_PRO_LIFETIME_URL ?? ''

const PRICES = {
  plus_monthly: { price: '$10', period: '/mo',       save: ''         },
  plus_annual:  { price: '$99', period: '/yr',       save: 'Save $21' },
  pro_monthly:  { price: '$20', period: '/mo',       save: ''         },
  pro_annual:   { price: '$199', period: '/yr',      save: 'Save $41' },
  pro_lifetime: { price: '$150', period: ' one-time', save: 'Best value' },
}

const PLUS_FEATURES = [
  'Excel (.xlsx) export',
  '100 MB file size limit',
  'Unlimited conversions',
  'Conversion history',
]

const PRO_FEATURES = [
  'Everything in Plus',
  '500 MB file size limit',
  'Batch conversion',
  'GeoJSON, JSON-LD, JSON Schema',
  'API key access',
  'Priority chat support',
]

async function updateClerkPlan(
  userId: string,
  plan: Plan,
  billing: Billing,
  subscriptionId: string
): Promise<void> {
  const expires =
    billing === 'lifetime' ? null :
    billing === 'annual'   ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() :
                             new Date(Date.now() + 31  * 24 * 60 * 60 * 1000).toISOString()

  const res = await fetch('/api/update-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, plan, billing, expires, subscriptionId }),
  })
  if (!res.ok) throw new Error(`Plan update failed: ${res.statusText}`)
}

export function PricingModal({ open, onClose, defaultPlan = 'plus' }: PricingModalProps) {
  const { user } = useUser()
  const [billing, setBilling]           = useState<BillingCycle>('monthly')
  const [selectedPlan, setSelectedPlan] = useState<'plus' | 'pro'>(defaultPlan)
  const [status, setStatus]             = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg]         = useState('')

  const isLifetime = billing === 'lifetime' && selectedPlan === 'pro'

  const handlePayPalSuccess = useCallback(async (subscriptionId: string, plan: Plan, billingType: Billing) => {
    if (!user) return
    setStatus('processing')
    try {
      await updateClerkPlan(user.id, plan, billingType, subscriptionId)
      setStatus('success')
      setTimeout(() => window.location.reload(), 2000)
    } catch (err) {
      console.error(err)
      setErrorMsg('Payment received but plan update failed. Contact support with subscription ID: ' + subscriptionId)
      setStatus('error')
    }
  }, [user])

  const handleLifetimeClick = useCallback(() => {
    if (LIFETIME_URL) window.open(LIFETIME_URL, '_blank', 'noopener')
  }, [])

  if (!open) return null

  const planKey = isLifetime
    ? 'pro_lifetime'
    : `${selectedPlan}_${billing}` as keyof typeof PRICES
  const currentPrice  = PRICES[planKey]
  const currentPlanId = isLifetime ? '' : PLAN_IDS[`${selectedPlan}_${billing}` as keyof typeof PLAN_IDS] ?? ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl bg-bg-secondary border border-border rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all z-10">
          <X size={16} />
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center border-b border-border">
          <div className="inline-flex items-center gap-2 mb-3">
            <Zap size={16} className="text-accent-cyan" />
            <span className="text-xs font-mono text-accent-cyan tracking-wider uppercase">Upgrade Covalent</span>
          </div>
          <h2 className="font-display font-800 text-2xl text-text-primary">Unlock the full toolkit</h2>
          <p className="text-sm text-text-muted mt-2">All conversion happens in your browser. Zero data uploaded.</p>
        </div>

        {/* Billing toggle */}
        <div className="px-8 pt-5 flex items-center justify-center gap-1">
          {(['monthly', 'annual', 'lifetime'] as BillingCycle[]).map(cycle => (
            <button
              key={cycle}
              onClick={() => setBilling(cycle)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-xs font-500 transition-all capitalize',
                billing === cycle
                  ? 'bg-bg-tertiary border border-border text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {cycle}
              {cycle === 'annual'   && <span className="ml-1.5 text-[9px] text-accent-green font-600">-17%</span>}
              {cycle === 'lifetime' && <span className="ml-1.5 text-[9px] text-accent-purple font-600">Pro only</span>}
            </button>
          ))}
        </div>

        {/* Plan cards */}
        <div className="px-8 py-5 grid grid-cols-2 gap-4">
          {/* Plus */}
          <div
            onClick={() => { setSelectedPlan('plus'); if (billing === 'lifetime') setBilling('monthly') }}
            className={cn(
              'p-5 rounded-xl border cursor-pointer transition-all',
              selectedPlan === 'plus'
                ? 'border-accent-cyan/40 bg-accent-cyan/5'
                : 'border-border hover:bg-bg-tertiary'
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-display font-700 text-text-primary">Plus</span>
              <div className={cn('w-4 h-4 rounded-full border-2 transition-all', selectedPlan === 'plus' ? 'border-accent-cyan bg-accent-cyan' : 'border-text-muted')} />
            </div>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-2xl font-display font-700 text-text-primary">
                {billing === 'lifetime' ? '$10' : PRICES[`plus_${billing}` as keyof typeof PRICES]?.price}
              </span>
              <span className="text-xs text-text-muted">
                {billing === 'lifetime' ? '/mo' : PRICES[`plus_${billing}` as keyof typeof PRICES]?.period}
              </span>
              {billing !== 'lifetime' && PRICES[`plus_${billing}` as keyof typeof PRICES]?.save && (
                <span className="ml-1 text-[10px] text-accent-green font-600">{PRICES[`plus_${billing}` as keyof typeof PRICES].save}</span>
              )}
            </div>
            <ul className="space-y-2">
              {PLUS_FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                  <Check size={11} className="text-accent-cyan shrink-0" />{f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div
            onClick={() => setSelectedPlan('pro')}
            className={cn(
              'relative p-5 rounded-xl border cursor-pointer transition-all',
              selectedPlan === 'pro'
                ? 'border-accent-purple/40 bg-accent-purple/5'
                : 'border-border hover:bg-bg-tertiary'
            )}
          >
            <div className="absolute -top-2.5 left-4 text-[9px] font-600 px-2 py-0.5 rounded-full bg-accent-purple/20 text-accent-purple">
              Most Popular
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-display font-700 text-text-primary">Pro</span>
              <div className={cn('w-4 h-4 rounded-full border-2 transition-all', selectedPlan === 'pro' ? 'border-accent-purple bg-accent-purple' : 'border-text-muted')} />
            </div>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-2xl font-display font-700 text-text-primary">{currentPrice?.price}</span>
              <span className="text-xs text-text-muted">{currentPrice?.period}</span>
              {currentPrice?.save && (
                <span className="ml-1 text-[10px] text-accent-green font-600">{currentPrice.save}</span>
              )}
            </div>
            <ul className="space-y-2">
              {PRO_FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                  <Check size={11} className="text-accent-purple shrink-0" />{f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Payment section */}
        <div className="px-8 pb-8">
          <div className="bg-bg-tertiary border border-border rounded-xl p-5">
            {status === 'success' ? (
              <div className="text-center py-4">
                <div className="w-10 h-10 rounded-full bg-accent-green/15 border border-accent-green/25 flex items-center justify-center mx-auto mb-3">
                  <Check size={18} className="text-accent-green" />
                </div>
                <div className="font-600 text-text-primary">Plan activated!</div>
                <div className="text-xs text-text-muted mt-1">Reloading to apply your changes…</div>
              </div>
            ) : status === 'processing' ? (
              <div className="text-center py-4 flex items-center justify-center gap-2 text-text-muted text-sm">
                <Loader2 size={16} className="animate-spin" />Activating your plan…
              </div>
            ) : status === 'error' ? (
              <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <AlertCircle size={13} className="shrink-0 mt-0.5" />{errorMsg}
              </div>
            ) : isLifetime ? (
              /* Lifetime → redirect to PayPal NCP link */
              <>
                <div className="flex items-center justify-between mb-4 text-xs">
                  <span className="text-text-secondary font-500">Pro · Lifetime</span>
                  <span className="font-display font-700 text-text-primary">$150 <span className="text-text-muted font-400">one-time</span></span>
                </div>
                <button
                  onClick={handleLifetimeClick}
                  className="w-full py-2.5 rounded-lg bg-[#FFB300] hover:bg-[#FFA000] text-[#1C1003] font-700 text-sm flex items-center justify-center gap-2 transition-all"
                >
                  Pay with PayPal <ExternalLink size={13} />
                </button>
                <p className="text-center text-[11px] text-text-muted mt-2">
                  Opens PayPal checkout. Return here after payment and refresh.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4 text-xs">
                  <span className="text-text-secondary font-500">
                    {selectedPlan === 'plus' ? 'Plus' : 'Pro'} · {billing}
                  </span>
                  <span className="font-display font-700 text-text-primary">
                    {currentPrice?.price}<span className="text-text-muted font-400 text-[11px]">{currentPrice?.period}</span>
                  </span>
                </div>
                {currentPlanId ? (
                  <PayPalSubscriptionButton
                    planId={currentPlanId}
                    plan={selectedPlan}
                    billing={billing}
                    onSuccess={handlePayPalSuccess}
                    onError={() => { setErrorMsg('PayPal encountered an error. Please try again.'); setStatus('error') }}
                  />
                ) : (
                  <div className="text-center text-xs text-text-muted py-2 border border-dashed border-border rounded-lg">
                    PayPal not configured — set <code className="font-mono">VITE_PAYPAL_*_PLAN_ID</code> in .env
                  </div>
                )}
              </>
            )}
          </div>
          <p className="text-center text-[11px] text-text-muted mt-3">
            Secured by PayPal · Cancel anytime · No hidden fees
          </p>
        </div>
      </div>
    </div>
  )
}
