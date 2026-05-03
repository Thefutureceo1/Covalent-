import { useState, useCallback, useEffect } from 'react'
import { Header } from './components/Header'
import { EditorPanel } from './components/EditorPanel'
import { OutputPanel } from './components/OutputPanel'
import { TabBar } from './components/TabBar'
import { Footer } from './components/Footer'
import { UpgradeModal } from './components/UpgradeModal'
import { PricingModal } from './components/PricingModal'
import { useUserPlanWithClerk, useUserPlanFree } from './hooks/useUserPlan'
import type { UserPlan } from './hooks/useUserPlan'
import { useConversionLimit } from './hooks/useConversionLimit'
import { safeParseJSON, hasCircularReference, downloadFile, downloadBlob, getByteSize } from './lib/utils'
import { toCSV } from './converters/toCSV'
import { toYAML } from './converters/toYAML'
import { toXML } from './converters/toXML'
import { toSQL } from './converters/toSQL'
import { toMarkdown } from './converters/toMarkdown'
import { toExcelBlob } from './converters/toExcel'
import { TABS, type ConversionTab, type UpgradeModalTrigger, type UpgradeModalState } from './types'

const DEBOUNCE_MS = 400
const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function AppContent({ userPlan }: { userPlan: UserPlan }) {
  const [jsonInput, setJsonInput] = useState('')
  const [activeTab, setActiveTab] = useState<ConversionTab>('csv')
  const [output, setOutput] = useState('')
  const [isConverting, setIsConverting] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [fileSizeWarning, setFileSizeWarning] = useState<string | null>(null)

  const [upgradeModal, setUpgradeModal] = useState<UpgradeModalState>({ open: false, trigger: null })
  const [pricingOpen, setPricingOpen] = useState(false)
  const [pricingDefaultPlan, setPricingDefaultPlan] = useState<'plus' | 'pro'>('plus')

  const conversionLimit = useConversionLimit(userPlan)

  // ─── Conversion logic ────────────────────────────────────────────────────
  const runConversion = useCallback(
    (input: string, tab: ConversionTab) => {
      if (!input.trim()) {
        setOutput('')
        setParseError(null)
        setFileSizeWarning(null)
        return
      }

      // 1. File size check
      const bytes = getByteSize(input)
      if (bytes > userPlan.maxFileSizeBytes) {
        const mb = (bytes / 1024 / 1024).toFixed(1)
        const limitMb = (userPlan.maxFileSizeBytes / 1024 / 1024).toFixed(0)
        setFileSizeWarning(`File is ${mb} MB — exceeds your ${limitMb} MB limit.`)
        setUpgradeModal({ open: true, trigger: 'file-size' })
        setOutput('')
        return
      }
      setFileSizeWarning(null)

      // 2. Daily limit check (free only)
      if (conversionLimit.isAtLimit) {
        setUpgradeModal({ open: true, trigger: 'daily-limit' })
        return
      }

      // 3. Parse JSON
      const { data, error } = safeParseJSON(input)
      if (error) {
        setParseError(error)
        setOutput('')
        return
      }
      setParseError(null)

      // 4. Circular reference check
      if (hasCircularReference(data)) {
        setParseError('Circular reference detected in JSON. Please remove circular references before converting.')
        setOutput('')
        return
      }

      // 5. Convert
      setIsConverting(true)
      try {
        let result = ''
        switch (tab) {
          case 'csv':      result = toCSV(data); break
          case 'yaml':     result = toYAML(data); break
          case 'xml':      result = toXML(data); break
          case 'sql':      result = toSQL(data); break
          case 'markdown': result = toMarkdown(data); break
          case 'excel':
            // Excel is handled separately via download only
            result = '# Excel files cannot be previewed as text.\n# Click "Download .xlsx" to export.'
            break
          default:         result = ''
        }
        setOutput(result)
        conversionLimit.increment()
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setParseError(`Conversion failed: ${msg}`)
        setOutput('')
      } finally {
        setIsConverting(false)
      }
    },
    [userPlan.maxFileSizeBytes, conversionLimit]
  )

  // ─── Debounced auto-convert on input or tab change ────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab !== 'excel') {
        runConversion(jsonInput, activeTab)
      }
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [jsonInput, activeTab, runConversion])

  // ─── Tab change (with lock check) ────────────────────────────────────────
  const handleTabChange = useCallback((tab: ConversionTab) => {
    setActiveTab(tab)
    setOutput('')
  }, [])

  const handleLockedTabClick = useCallback((tab: ConversionTab) => {
    const tabConfig = TABS.find(t => t.id === tab)
    if (!tabConfig) return
    const trigger: UpgradeModalTrigger =
      tab === 'excel' ? 'excel-tab' : 'advanced-format'
    setUpgradeModal({ open: true, trigger })
  }, [])

  // ─── Download ─────────────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    const tabConfig = TABS.find(t => t.id === activeTab)
    if (!tabConfig) return

    const { data, error } = safeParseJSON(jsonInput)
    if (error || !data) return

    const filename = `covalent-export.${tabConfig.extension}`

    if (activeTab === 'excel') {
      if (!userPlan.canUseExcel) {
        setUpgradeModal({ open: true, trigger: 'excel-tab' })
        return
      }
      try {
        const blob = toExcelBlob(data)
        downloadBlob(blob, filename)
      } catch (err) {
        console.error('Excel export failed:', err)
      }
      return
    }

    if (!output) return
    downloadFile(output, filename, tabConfig.mimeType)
  }, [activeTab, jsonInput, output, userPlan.canUseExcel])

  // ─── Upgrade modal actions ─────────────────────────────────────────────
  const handleUpgradeSelect = useCallback((plan: 'plus' | 'pro') => {
    setUpgradeModal({ open: false, trigger: null })
    setPricingDefaultPlan(plan)
    setPricingOpen(true)
  }, [])

  const handleUpgradeClick = useCallback(() => {
    setPricingDefaultPlan('plus')
    setPricingOpen(true)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-bg overflow-hidden animate-fade-in">
      <Header userPlan={userPlan} onUpgradeClick={handleUpgradeClick} />

      <main className="flex flex-1 min-h-0">
        {/* Left: Editor */}
        <div className="w-1/2 flex flex-col border-r border-border min-h-0">
          <EditorPanel
            value={jsonInput}
            onChange={setJsonInput}
            error={parseError}
            fileSizeWarning={fileSizeWarning}
          />
        </div>

        {/* Right: Tab bar + Output */}
        <div className="w-1/2 flex flex-col min-h-0">
          <TabBar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            userPlan={userPlan}
            onLockedTabClick={handleLockedTabClick}
          />
          <div className="flex-1 min-h-0">
            <OutputPanel
              activeTab={activeTab}
              output={output}
              isConverting={isConverting}
              onDownload={handleDownload}
            />
          </div>
        </div>
      </main>

      <Footer conversionLimit={conversionLimit} />

      {/* Modals */}
      <UpgradeModal
        open={upgradeModal.open}
        trigger={upgradeModal.trigger}
        onClose={() => setUpgradeModal({ open: false, trigger: null })}
        onSelectPlan={handleUpgradeSelect}
      />

      <PricingModal
        open={pricingOpen}
        onClose={() => setPricingOpen(false)}
        defaultPlan={pricingDefaultPlan}
      />
    </div>
  )
}

// ─── Root: handle Clerk optional ───────────────────────────────────────────

/** With Clerk: reads real plan from publicMetadata */
function AppWithClerk() {
  const userPlan = useUserPlanWithClerk()
  return <AppContent userPlan={userPlan} />
}

/** Without Clerk: always free plan, shows dev warning */
function AppWithoutClerk() {
  const userPlan = useUserPlanFree()
  return (
    <div className="flex flex-col h-screen bg-bg overflow-hidden">
      <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-400 text-xs font-mono px-4 py-1.5 text-center shrink-0">
        ⚠ Running without Clerk — auth &amp; payments disabled. Set{' '}
        <code className="bg-amber-500/10 px-1 rounded">VITE_CLERK_PUBLISHABLE_KEY</code> in .env to enable.
      </div>
      <AppContent userPlan={userPlan} />
    </div>
  )
}

export default function App() {
  if (!CLERK_KEY) return <AppWithoutClerk />
  return <AppWithClerk />
}
