/**
 * PayPalSubscriptionButton
 * Dynamically loads PayPal SDK using VITE_PAYPAL_CLIENT_ID.
 * Style matches PayPal's generated code: pill shape, gold color.
 */
import { useEffect, useRef, useState } from 'react'
import type { Plan, Billing } from '../hooks/useUserPlan'

interface PayPalButtonProps {
  planId: string
  plan: Plan
  billing: Billing
  onSuccess: (subscriptionId: string, plan: Plan, billing: Billing) => void
  onError?: (err: unknown) => void
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (opts: Record<string, unknown>) => {
        render: (container: HTMLElement) => Promise<void>
        close: () => void
        isEligible: () => boolean
      }
    }
  }
}

const CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID ?? ''

let sdkPromise: Promise<void> | null = null

function loadSDK(): Promise<void> {
  if (sdkPromise) return sdkPromise
  if (window.paypal) return Promise.resolve()
  if (!CLIENT_ID) return Promise.reject(new Error('No PayPal Client ID'))

  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${CLIENT_ID}&vault=true&intent=subscription`
    script.setAttribute('data-sdk-integration-source', 'button-factory')
    script.onload  = () => resolve()
    script.onerror = () => { sdkPromise = null; reject(new Error('PayPal SDK failed to load')) }
    document.head.appendChild(script)
  })
  return sdkPromise
}

export function PayPalSubscriptionButton({ planId, plan, billing, onSuccess, onError }: PayPalButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef    = useRef<ReturnType<NonNullable<typeof window.paypal>['Buttons']> | null>(null)
  const [ready, setReady]   = useState(Boolean(window.paypal))
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!CLIENT_ID) return
    loadSDK().then(() => setReady(true)).catch(() => setFailed(true))
  }, [])

  useEffect(() => {
    if (!ready || !window.paypal || !containerRef.current || !planId) return
    containerRef.current.innerHTML = ''
    try { buttonRef.current?.close() } catch { /* ignore */ }

    try {
      const btn = window.paypal.Buttons({
        style: {
          shape: 'pill',
          color: 'gold',
          layout: 'vertical',
          label: 'subscribe',
          height: 40,
        },
        createSubscription: (_data: unknown, actions: Record<string, unknown>) => {
          const sub = actions.subscription as Record<string, (o: unknown) => unknown>
          return sub.create({ plan_id: planId })
        },
        onApprove: (data: Record<string, unknown>) => {
          onSuccess(data.subscriptionID as string, plan, billing)
        },
        onError: (err: unknown) => { console.error('PayPal:', err); onError?.(err) },
      })

      buttonRef.current = btn
      if (btn.isEligible()) btn.render(containerRef.current)
    } catch (err) {
      console.error('PayPal render failed:', err)
      onError?.(err)
    }

    return () => { try { buttonRef.current?.close() } catch { /* ignore */ } }
  }, [ready, planId, plan, billing, onSuccess, onError])

  if (!CLIENT_ID) {
    return (
      <div className="text-center text-xs text-text-muted py-3 border border-dashed border-border rounded-lg font-mono">
        Set <code>VITE_PAYPAL_CLIENT_ID</code> in .env
      </div>
    )
  }

  if (failed) {
    return (
      <div className="text-center text-xs text-red-400 py-3 border border-dashed border-red-500/20 rounded-lg">
        Failed to load PayPal. Check your connection and try again.
      </div>
    )
  }

  return (
    <div ref={containerRef} className="min-h-[44px]">
      {!ready && <div className="h-11 rounded-full bg-[#FFB300]/20 animate-pulse" />}
    </div>
  )
}
