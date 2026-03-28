/**
 * RightPanel — 右側ステータスパネル群
 * CompanyStatus / HR Summary / Service Status / KPI Mini Dashboard
 */

import { type ReactNode, useState } from 'react'
import { getSimulation } from '@ui/hooks/useGameEngine.js'
import { useGameStore } from '@ui/stores/gameStore.js'

/** 折りたたみ可能なセクション */
function Section(props: { title: string; defaultOpen?: boolean; children: ReactNode }): ReactNode {
  const [open, setOpen] = useState(props.defaultOpen ?? true)
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50/50 transition-colors"
        aria-expanded={open}>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{props.title}</span>
        <span className="text-slate-300 text-[10px]">{open ? '▼' : '▶'}</span>
      </button>
      {open && <div className="px-4 pb-3">{props.children}</div>}
    </div>
  )
}

/** ステータスバッジ */
function Badge(props: { label: string; level: 'low' | 'mid' | 'high' }): ReactNode {
  const colors = {
    low: 'bg-red-50 text-red-600',
    mid: 'bg-amber-50 text-amber-600',
    high: 'bg-emerald-50 text-emerald-600',
  }
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${colors[props.level]}`}>
      {props.label}
    </span>
  )
}

/** KPIカード */
function KpiCard(props: { label: string; value: string; sub?: string; color?: string }): ReactNode {
  return (
    <div className="bg-slate-50 rounded-lg p-2 text-center">
      <p className="text-[10px] text-slate-400 font-medium">{props.label}</p>
      <p className={`font-mono text-sm font-bold ${props.color ?? 'text-slate-800'}`}>{props.value}</p>
      {props.sub && <p className="text-[9px] text-slate-400">{props.sub}</p>}
    </div>
  )
}

/** 情報行 */
function InfoRow(props: { label: string; value: string | ReactNode }): ReactNode {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[11px] text-slate-400">{props.label}</span>
      {typeof props.value === 'string'
        ? <span className="text-[11px] font-medium text-slate-700">{props.value}</span>
        : props.value}
    </div>
  )
}

export function RightPanel(): ReactNode {
  const sim = getSimulation()
  const company = sim.company.getState()
  const headcount = useGameStore((s) => s.headcount)
  const snap = sim.getSnapshot()
  const metrics = sim.finance.getLastMetrics()

  if (!company) return null

  const employees = sim.hr.getEmployees()
  const deptCounts = sim.hr.getHeadcountByDept()
  const seniorCount = employees.filter((e) => e.level >= 7).length

  return (
    <div className="absolute top-16 right-3 z-30 w-[260px] max-h-[calc(100vh-80px)] overflow-y-auto glass-panel" data-tutorial="right-panel">
      {/* 会社状況 */}
      <Section title="会社状況">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <InfoRow label="従業員" value={`${headcount}名`} />
          <InfoRow label="高度人材" value={`${seniorCount}名`} />
          <InfoRow label="ステージ" value={snap.stage.replace('_', ' ').toUpperCase()} />
          <InfoRow label="評判" value={`${snap.reputation}`} />
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <Badge label={snap.reputation > 50 ? '高評判' : snap.reputation > 25 ? '普通' : '低評判'}
            level={snap.reputation > 50 ? 'high' : snap.reputation > 25 ? 'mid' : 'low'} />
          <Badge label={`経済: ${snap.economicPhase}`} level={snap.economicPhase === 'recession' ? 'low' : snap.economicPhase === 'boom' ? 'high' : 'mid'} />
        </div>
      </Section>

      {/* 人事サマリー */}
      <Section title="人事">
        <div className="space-y-0.5">
          {Object.entries(deptCounts).slice(0, 5).map(([dept, count]) => (
            <div key={dept} className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 capitalize">{dept}</span>
              <div className="flex items-center gap-1">
                <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-400" style={{ width: `${Math.min(100, count * 10)}%` }} />
                </div>
                <span className="text-[10px] font-mono text-slate-600 w-4 text-right">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* サービス状況 */}
      <Section title="サービス">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <InfoRow label="顧客数" value={`${snap.activeCustomers}`} />
          <InfoRow label="競合" value={`${snap.competitorCount}社`} />
          <InfoRow label="品質" value={`${snap.productScore}`} />
          <InfoRow label="バグ" value={`${snap.bugCount}`} />
        </div>
      </Section>

      {/* KPIミニダッシュボード */}
      <Section title="KPI">
        <div className="grid grid-cols-2 gap-1.5">
          <KpiCard label="MRR" value={`${snap.mrr.toLocaleString()}`} sub="万円" color="text-emerald-600" />
          <KpiCard label="ARR" value={`${snap.arr.toLocaleString()}`} sub="万円" color="text-blue-600" />
          <KpiCard label="NRR" value={`${metrics?.netRevenueRetention.toFixed(0) ?? '-'}%`}
            color={(metrics?.netRevenueRetention ?? 100) >= 100 ? 'text-emerald-600' : 'text-red-500'} />
          <KpiCard label="Rule of 40" value={`${metrics?.ruleOf40.toFixed(0) ?? '-'}`}
            color={(metrics?.ruleOf40 ?? 0) >= 40 ? 'text-emerald-600' : (metrics?.ruleOf40 ?? 0) >= 20 ? 'text-amber-600' : 'text-red-500'} />
          <KpiCard label="Runway" value={`${metrics?.runway ?? '∞'}`} sub="ヶ月"
            color={(metrics?.runway ?? 999) < 6 ? 'text-red-500' : 'text-slate-700'} />
          <KpiCard label="LTV/CAC" value={`${metrics?.ltvCacRatio.toFixed(1) ?? '-'}x`}
            color={(metrics?.ltvCacRatio ?? 0) >= 3 ? 'text-emerald-600' : 'text-amber-600'} />
        </div>
      </Section>
    </div>
  )
}
