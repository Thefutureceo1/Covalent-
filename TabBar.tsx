import { Lock } from 'lucide-react'
import { cn } from '../lib/utils'
import { TABS, type ConversionTab } from '../types'
import type { UserPlan } from '../hooks/useUserPlan'

interface TabBarProps {
  activeTab: ConversionTab
  onTabChange: (tab: ConversionTab) => void
  userPlan: UserPlan
  onLockedTabClick: (tab: ConversionTab) => void
}

const PLAN_ORDER = { free: 0, plus: 1, pro: 2 }

function isTabLocked(tabRequires: 'free' | 'plus' | 'pro', userPlan: UserPlan): boolean {
  return PLAN_ORDER[tabRequires] > PLAN_ORDER[userPlan.plan]
}

const LOCKED_BADGE: Record<string, string> = {
  plus: 'Plus',
  pro: 'Pro',
}

export function TabBar({ activeTab, onTabChange, userPlan, onLockedTabClick }: TabBarProps) {
  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-bg-secondary shrink-0 overflow-x-auto">
      {TABS.map((tab) => {
        const locked = isTabLocked(tab.requiresPlan, userPlan)
        const isActive = activeTab === tab.id && !locked

        return (
          <button
            key={tab.id}
            onClick={() => {
              if (locked) {
                onLockedTabClick(tab.id)
              } else {
                onTabChange(tab.id)
              }
            }}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-500 transition-all shrink-0',
              isActive
                ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/25 tab-active'
                : locked
                  ? 'text-text-muted hover:text-text-secondary hover:bg-bg-tertiary cursor-pointer opacity-60'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary border border-transparent'
            )}
            title={locked ? `Requires ${LOCKED_BADGE[tab.requiresPlan]} plan` : tab.description}
          >
            <span>{tab.label}</span>
            {locked && (
              <span className={cn(
                'flex items-center gap-0.5 text-[9px] font-600 px-1.5 py-0.5 rounded-full',
                tab.requiresPlan === 'pro'
                  ? 'bg-accent-purple/20 text-accent-purple'
                  : 'bg-accent-cyan/15 text-accent-cyan'
              )}>
                <Lock size={8} />
                {LOCKED_BADGE[tab.requiresPlan]}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
