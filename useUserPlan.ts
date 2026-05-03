/**
 * useUserPlan — reads Clerk publicMetadata and derives feature flags.
 * Falls back to "free" if unauthenticated or metadata is missing.
 *
 * Two variants:
 *  - useUserPlanWithClerk  → used inside ClerkProvider
 *  - useUserPlanFree       → used when Clerk is not configured
 *
 * useUserPlan() picks the right one based on env config.
 */
import { useUser } from '@clerk/clerk-react'

export type Plan = 'free' | 'plus' | 'pro'
export type Billing = 'monthly' | 'annual' | 'lifetime' | null

export interface UserPlan {
  plan: Plan
  billing: Billing
  expires: string | null
  isLoaded: boolean
  isSignedIn: boolean
  canUseExcel: boolean
  canUseBatch: boolean
  canUseAdvancedFormats: boolean
  canUseAPIKeys: boolean
  maxFileSizeBytes: number
  dailyConversionLimit: number // -1 = unlimited
}

const SIZE_FREE = 1 * 1024 * 1024
const SIZE_PLUS = 100 * 1024 * 1024
const SIZE_PRO  = 500 * 1024 * 1024

function buildFlags(plan: Plan, billing: Billing, expires: string | null, isLoaded: boolean, isSignedIn: boolean): UserPlan {
  const isExpired =
    expires !== null &&
    billing !== 'lifetime' &&
    new Date(expires) < new Date()

  const p: Plan = isExpired ? 'free' : plan

  return {
    plan: p, billing, expires, isLoaded, isSignedIn,
    canUseExcel: p === 'plus' || p === 'pro',
    canUseBatch: p === 'pro',
    canUseAdvancedFormats: p === 'pro',
    canUseAPIKeys: p === 'pro',
    maxFileSizeBytes: p === 'pro' ? SIZE_PRO : p === 'plus' ? SIZE_PLUS : SIZE_FREE,
    dailyConversionLimit: p === 'free' ? 10 : -1,
  }
}

/** Used inside ClerkProvider */
export function useUserPlanWithClerk(): UserPlan {
  const { isLoaded, isSignedIn, user } = useUser()

  if (!isLoaded) return buildFlags('free', null, null, false, false)
  if (!isSignedIn || !user) return buildFlags('free', null, null, true, false)

  const meta = user.publicMetadata as { plan?: Plan; billing?: Billing; expires?: string | null }
  return buildFlags(meta.plan ?? 'free', meta.billing ?? null, meta.expires ?? null, true, true)
}

/** Used when Clerk is not configured */
export function useUserPlanFree(): UserPlan {
  return buildFlags('free', null, null, true, false)
}

// Re-export a unified hook — App.tsx chooses which component tree to render,
// so this is always called in the right context.
export { useUserPlanWithClerk as useUserPlan }
