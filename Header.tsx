import { Zap } from 'lucide-react'
import type { UserPlan } from '../hooks/useUserPlan'
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from '@clerk/clerk-react'

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const PLAN_BADGE: Record<string, { label: string; className: string }> = {
  free:  { label: 'Free',  className: 'bg-text-muted/30 text-text-secondary' },
  plus:  { label: 'Plus',  className: 'bg-accent-cyan/15 text-accent-cyan' },
  pro:   { label: 'Pro',   className: 'bg-accent-purple/20 text-accent-purple' },
}

interface HeaderProps {
  userPlan: UserPlan
  onUpgradeClick: () => void
}

function Logo({ badge }: { badge: { label: string; className: string } }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
        <Zap size={14} className="text-bg fill-bg" />
      </div>
      <span className="font-display font-700 text-[17px] tracking-tight text-text-primary">
        Covalent
      </span>
      <span className={`text-[10px] font-mono font-500 px-2 py-0.5 rounded-full ${badge.className}`}>
        {badge.label}
      </span>
    </div>
  )
}

function UpgradeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-sm px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-accent-cyan/10 to-accent-purple/10 hover:from-accent-cyan/20 hover:to-accent-purple/20 text-text-primary font-500 border border-accent-cyan/20 transition-all flex items-center gap-1.5"
    >
      <Zap size={13} className="text-accent-cyan" />
      Upgrade
    </button>
  )
}

function HeaderWithClerk({ userPlan, onUpgradeClick }: HeaderProps) {
  const { isSignedIn } = useUser()
  const badge = PLAN_BADGE[userPlan.plan] ?? PLAN_BADGE.free

  return (
    <header className="h-14 flex items-center justify-between px-5 border-b border-border bg-bg-secondary shrink-0">
      <Logo badge={badge} />
      <div className="flex items-center gap-3">
        {!isSignedIn ? (
          <>
            <SignInButton mode="modal">
              <button className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="text-sm px-3.5 py-1.5 rounded-lg bg-accent-cyan/10 hover:bg-accent-cyan/20 text-accent-cyan font-500 border border-accent-cyan/20 transition-all">
                Sign up free
              </button>
            </SignUpButton>
          </>
        ) : (
          <>
            {userPlan.plan === 'free' && <UpgradeButton onClick={onUpgradeClick} />}
            <UserButton appearance={{ elements: { avatarBox: 'w-8 h-8' } }} />
          </>
        )}
      </div>
    </header>
  )
}

function HeaderWithoutClerk({ userPlan }: HeaderProps) {
  const badge = PLAN_BADGE[userPlan.plan] ?? PLAN_BADGE.free
  return (
    <header className="h-14 flex items-center justify-between px-5 border-b border-border bg-bg-secondary shrink-0">
      <Logo badge={badge} />
      <div className="flex items-center gap-3">
        <span className="text-xs text-text-muted italic">Auth not configured</span>
      </div>
    </header>
  )
}

export function Header(props: HeaderProps) {
  if (!CLERK_KEY) return <HeaderWithoutClerk {...props} />
  return <HeaderWithClerk {...props} />
}
