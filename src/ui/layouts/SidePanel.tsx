/**
 * サイドパネル
 * 右側にスライドインする詳細情報パネル
 */

import type { ReactNode } from 'react'
import { useUIStore, SIDE_PANEL_TABS } from '@ui/stores/uiStore.js'
import type { SidePanelTab } from '@ui/stores/uiStore.js'
import { getSimulation } from '@ui/hooks/useGameEngine.js'
import { useGameStore } from '@ui/stores/gameStore.js'

/** タブ定義 */
const TAB_LABELS: Record<SidePanelTab, string> = {
  [SIDE_PANEL_TABS.OVERVIEW]: '概要',
  [SIDE_PANEL_TABS.FINANCE]: '財務',
  [SIDE_PANEL_TABS.HR]: '人事',
  [SIDE_PANEL_TABS.PRODUCT]: '開発',
  [SIDE_PANEL_TABS.MARKET]: '市場',
}

function OverviewTab(): ReactNode {
  const sim = getSimulation()
  const company = sim.company.getState()
  const cash = useGameStore((s) => s.cash)
  const headcount = useGameStore((s) => s.headcount)
  const snap = sim.getSnapshot()

  if (!company) return <p className="text-gray-500 text-xs p-4">会社未設立</p>

  return (
    <div className="p-4 space-y-3">
      <div>
        <h4 className="text-amber-400 font-bold text-sm">{company.name}</h4>
        <p className="text-gray-500 text-xs">{company.mission}</p>
      </div>
      <InfoRow label="ステージ" value={snap.stage.toUpperCase()} />
      <InfoRow label="従業員数" value={`${headcount}名`} />
      <InfoRow label="資金" value={`${cash.toLocaleString()}万円`} />
      <InfoRow label="MRR" value={`${snap.mrr.toLocaleString()}万円`} />
      <InfoRow label="顧客数" value={`${snap.activeCustomers}`} />
      <InfoRow label="レピュテーション" value={`${snap.reputation}`} />
    </div>
  )
}

function FinanceTab(): ReactNode {
  const sim = getSimulation()
  const snap = sim.getSnapshot()
  const monthlyPayroll = sim.hr.calcMonthlyPayroll()
  const monthlyCost = sim.finance.getMonthlyTotalCost()

  return (
    <div className="p-4 space-y-3">
      <h4 className="text-green-400 font-bold text-xs">収支</h4>
      <InfoRow label="MRR" value={`${snap.mrr.toLocaleString()}万円`} />
      <InfoRow label="ARR" value={`${snap.arr.toLocaleString()}万円`} />
      <InfoRow label="月次コスト" value={`${Math.round(monthlyCost).toLocaleString()}万円`} />
      <InfoRow label="人件費" value={`${monthlyPayroll.toLocaleString()}万円/月`} />
      <InfoRow label="企業価値" value={`${snap.valuation.toLocaleString()}万円`} />
      <div className="border-t border-gray-700/50 pt-2 mt-2">
        <InfoRow
          label="月次損益"
          value={`${(snap.mrr - Math.round(monthlyCost)).toLocaleString()}万円`}
          valueColor={snap.mrr >= monthlyCost ? 'text-green-400' : 'text-red-400'}
        />
      </div>
    </div>
  )
}

function HRTab(): ReactNode {
  const sim = getSimulation()
  const employees = sim.hr.getEmployees()
  const deptCounts = sim.hr.getHeadcountByDept()

  return (
    <div className="p-4 space-y-3">
      <h4 className="text-blue-400 font-bold text-xs">
        従業員一覧 ({employees.length}名)
      </h4>
      {Object.entries(deptCounts).map(([dept, count]) => (
        <InfoRow key={dept} label={dept} value={`${count}名`} />
      ))}
      <div className="border-t border-gray-700/50 pt-2 mt-2 space-y-1">
        {employees.slice(0, 8).map((emp) => (
          <div key={emp.id} className="flex items-center justify-between text-xs">
            <span className="text-white truncate max-w-[140px]">{emp.name}</span>
            <span className="text-gray-400">
              {emp.grade} | M:{Math.round(emp.mood.motivation)} S:{Math.round(emp.mood.stress)}
            </span>
          </div>
        ))}
        {employees.length > 8 && (
          <p className="text-gray-600 text-[10px]">...他{employees.length - 8}名</p>
        )}
      </div>
    </div>
  )
}

function ProductTab(): ReactNode {
  const sim = getSimulation()
  const snap = sim.getSnapshot()

  return (
    <div className="p-4 space-y-3">
      <h4 className="text-green-400 font-bold text-xs">プロダクト</h4>
      <InfoRow label="プロダクトスコア" value={`${snap.productScore}`} />
      <InfoRow label="リリース済み機能" value={`${snap.releasedFeatures}`} />
      <InfoRow label="技術的負債" value={`${snap.techDebt}`} />
      <InfoRow label="バグ数" value={`${snap.bugCount}`} />
    </div>
  )
}

function MarketTab(): ReactNode {
  const sim = getSimulation()
  const snap = sim.getSnapshot()

  return (
    <div className="p-4 space-y-3">
      <h4 className="text-purple-400 font-bold text-xs">市場</h4>
      <InfoRow label="顧客数" value={`${snap.activeCustomers}`} />
      <InfoRow label="ARPU" value={`${sim.sales.getARPU().toFixed(1)}万円`} />
      <p className="text-gray-500 text-xs mt-4">
        競合AI・市場シミュレーションはPhase 2で実装
      </p>
    </div>
  )
}

function InfoRow(props: {
  label: string
  value: string
  valueColor?: string
}): ReactNode {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400 text-xs">{props.label}</span>
      <span className={`${props.valueColor ?? 'text-white'} text-xs font-medium`}>
        {props.value}
      </span>
    </div>
  )
}

/** タブコンテンツ */
const TAB_COMPONENTS: Record<SidePanelTab, () => ReactNode> = {
  [SIDE_PANEL_TABS.OVERVIEW]: OverviewTab,
  [SIDE_PANEL_TABS.FINANCE]: FinanceTab,
  [SIDE_PANEL_TABS.HR]: HRTab,
  [SIDE_PANEL_TABS.PRODUCT]: ProductTab,
  [SIDE_PANEL_TABS.MARKET]: MarketTab,
}

/**
 * SidePanel — 右側詳細パネル
 */
export function SidePanel(): ReactNode {
  const isOpen = useUIStore((s) => s.sidePanelOpen)
  const currentTab = useUIStore((s) => s.sidePanelTab)
  const togglePanel = useUIStore((s) => s.toggleSidePanel)
  const setTab = useUIStore((s) => s.setSidePanelTab)

  const TabComponent = TAB_COMPONENTS[currentTab]

  return (
    <>
      <button
        onClick={togglePanel}
        className="absolute right-4 top-16 z-40 px-2 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
        style={{ background: 'rgba(42,39,64,0.9)' }}
      >
        {isOpen ? '▶' : '◀'}
      </button>

      <div
        className={`absolute top-0 right-0 h-full z-30 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          width: '280px',
          background: 'rgba(30,27,46,0.95)',
          borderLeft: '1px solid rgba(74,70,96,0.5)',
        }}
      >
        <div className="flex border-b border-gray-700/50 mt-12">
          {Object.entries(TAB_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key as SidePanelTab)}
              className={`flex-1 px-1 py-2 text-[10px] font-medium transition-colors ${
                currentTab === key
                  ? 'text-amber-400 border-b-2 border-amber-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
          <TabComponent />
        </div>
      </div>
    </>
  )
}
