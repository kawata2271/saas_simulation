/**
 * 採用パネル — ライトテーマ版
 */

import { useState, type ReactNode } from 'react'
import type { SimulationManager } from '@core/simulation/SimulationManager.js'
import type { Candidate } from '@game-types/employee.js'
import { useGameStore } from '@ui/stores/gameStore.js'

const GRADE_LABELS: Record<string, string> = {
  intern: 'Int', junior: 'Jr', mid: 'Mid', senior: 'Sr', lead: 'Lead',
  manager: 'Mgr', director: 'Dir', vp: 'VP', cxo: 'CxO', ceo: 'CEO',
}
const DEPT_LABELS: Record<string, string> = {
  engineering: 'エンジニア', product: '企画', design: 'デザイン',
  sales: '営業', marketing: 'マーケ', customer_success: 'CS',
  hr: '人事', finance: '経理', legal: '法務',
  operations: 'Ops', executive: '経営',
}

interface HirePanelProps {
  simulation: SimulationManager
  onClose: () => void
  onHired?: () => void
}

export function HirePanel(props: HirePanelProps): ReactNode {
  const [, forceUpdate] = useState(0)
  const candidates = props.simulation.getCandidates()
  const currentDate = useGameStore((s) => s.currentDate)
  const cash = useGameStore((s) => s.cash)

  const handleHire = (c: Candidate): void => {
    if (cash < c.expectedSalary * 3) return
    props.simulation.hireCandidate(c.id, currentDate.totalDays)
    forceUpdate((n) => n + 1)
    props.onHired?.()
  }

  return (
    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-50 w-[660px] max-h-[380px] glass-panel border border-blue-200 overflow-hidden animate-slide-up">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
        <h3 className="text-sm font-bold text-blue-600">採用候補者</h3>
        <button onClick={props.onClose} className="text-slate-400 hover:text-slate-600 text-xs font-medium">閉じる</button>
      </div>
      <div className="p-3 space-y-2 overflow-y-auto max-h-[320px]">
        {candidates.length === 0 ? (
          <p className="text-slate-400 text-xs text-center py-8">候補者がいません。数日お待ちください。</p>
        ) : candidates.map((c) => (
          <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-blue-50/50 transition-colors border border-transparent hover:border-blue-100">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-800 truncate">{c.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">
                  {DEPT_LABELS[c.department] ?? c.department}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                  {GRADE_LABELS[c.grade] ?? c.grade} Lv.{c.level}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <StatBar label="技術" value={c.stats.engineering} />
                <StatBar label="営業" value={c.stats.sales} />
                <StatBar label="企画" value={c.stats.planning} />
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[11px] text-slate-400 font-mono">{c.expectedSalary}万/月</span>
              <button onClick={() => handleHire(c)}
                disabled={cash < c.expectedSalary * 3}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  cash >= c.expectedSalary * 3
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}>採用</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatBar(props: { label: string; value: number }): ReactNode {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-slate-400 w-5">{props.label}</span>
      <div className="w-14 h-1.5 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full rounded-full bg-blue-400" style={{ width: `${props.value}%` }} />
      </div>
      <span className="text-[10px] text-slate-500 font-mono w-5 text-right">{props.value}</span>
    </div>
  )
}
