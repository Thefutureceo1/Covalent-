/**
 * useConversionLimit — tracks daily conversion count in localStorage.
 * Resets at UTC midnight. Unlimited for plus/pro.
 */
import { useState, useCallback } from 'react'
import type { UserPlan } from './useUserPlan'

const KEY_COUNT = 'covalent_daily_count'
const KEY_DATE  = 'covalent_daily_date'

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10) // "YYYY-MM-DD"
}

function readCount(): number {
  try {
    const storedDate  = localStorage.getItem(KEY_DATE)
    const storedCount = localStorage.getItem(KEY_COUNT)
    if (storedDate !== todayUTC()) {
      // New day — reset
      localStorage.setItem(KEY_DATE, todayUTC())
      localStorage.setItem(KEY_COUNT, '0')
      return 0
    }
    return parseInt(storedCount ?? '0', 10) || 0
  } catch {
    return 0
  }
}

function writeCount(n: number): void {
  try {
    localStorage.setItem(KEY_DATE, todayUTC())
    localStorage.setItem(KEY_COUNT, String(n))
  } catch {
    // localStorage unavailable — silently degrade
  }
}

export interface ConversionLimit {
  used: number
  limit: number          // -1 = unlimited
  remaining: number      // -1 = unlimited
  isAtLimit: boolean
  increment: () => void  // call after each successful conversion
  reset: () => void      // for testing
}

export function useConversionLimit(userPlan: UserPlan): ConversionLimit {
  const [used, setUsed] = useState<number>(() => {
    // Only track for free users
    if (userPlan.dailyConversionLimit === -1) return 0
    return readCount()
  })

  const limit = userPlan.dailyConversionLimit // -1 = unlimited

  const increment = useCallback(() => {
    if (limit === -1) return // unlimited
    const current = readCount()
    const next = current + 1
    writeCount(next)
    setUsed(next)
  }, [limit])

  const reset = useCallback(() => {
    writeCount(0)
    setUsed(0)
  }, [])

  if (limit === -1) {
    return { used: 0, limit: -1, remaining: -1, isAtLimit: false, increment, reset }
  }

  const remaining = Math.max(0, limit - used)
  const isAtLimit = used >= limit

  return { used, limit, remaining, isAtLimit, increment, reset }
}
