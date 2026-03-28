/**
 * 採用パネル
 * 候補者一覧の表示と採用アクション
 */

import { useState, type ReactNode } from 'react'
import type { SimulationManager } from '@core/simulation/SimulationManager.js'
import type { Candidate } from '@game-types/employee.js'
import { useGameStore } from '@ui/stores/gameStore.js'

/** グレードの日本語ラベル */
const GRADE_LABELS: Record<string, string> = {
  junior: 'Jr',
  mid: 'Mid',
  senior: 'Sr',
  lead: 'Lead',
  executive: 'Exec',
}

/** 部門の日本語ラベル */
const DEPT_LABELS: Record<string, string> = {
  engineering: 'エンジニア',
  product: '企画',
  sales: '営業',
  marketing: 'マーケ',
  customer_success: 'CS',
  hr: '人事',
  finance: '経理',
  legal: '法務',
  executive: '経営',
}

interface HirePanelProps {
  simulation: SimulationManager
  onClose: () => void
}

export function HirePanel(props: HirePanelProps): ReactNode {
  const [, forceUpdate] = useState(0)
  const candidates = props.simulation.getCandidates()
  const currentDate = useGameStore((s) => s.currentDate)
  const cash = useGameStore((s) => s.cash)

  const handleHire = (candidate: Candidate): void => {
    if (cash < candidate.expectedSalary * 3) return
    props.simulation.hireCandidate(candidate.id, currentDate.totalDays)
    forceUpdate((n) => n + 1)
  }

  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 w-[700px] max-h-[400px]
                    rounded-xl overflow-hidden"
         style={{ background: 'rgba(30,27,46,0.98)', border: '1px solid rgba(59,130,246,0.3)' }}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700/50">
        <h3 className="text-blue-400 font-bold text-sm">採用候補者</h3>
        <button onClick={props.onClose} className="text-gray-500 hover:text-white text-xs">
          閉じる
        </button>
      </div>

      {/* 候補者リスト */}
      <div className="p-3 space-y-2 overflow-y-auto max-h-[340px]">
        {candidates.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-8">
            現在、候補者はいません。数日お待ちください。
          </p>
        ) : (
          candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              canAfford={cash >= candidate.expectedSalary * 3}
              onHire={() => handleHire(candidate)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function CandidateCard(props: {
  candidate: Candidate
  canAfford: boolean
  onHire: () => void
}): ReactNode {
  const { candidate } = props
  const topStat = Math.max(
    candidate.stats.engineering,
    candidate.stats.sales,
    candidate.stats.planning,
  )

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/40 hover:bg-gray-800/60 transition-colors">
      {/* 名前・役職 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-medium truncate">
            {candidate.name}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300">
            {DEPT_LABELS[candidate.department] ?? candidate.department}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700/60 text-gray-300">
            {GRADE_LABELS[candidate.grade] ?? candidate.grade} Lv.{candidate.level}
          </span>
        </div>
        {/* 能力バー */}
        <div className="flex items-center gap-3 mt-1.5">
          <StatMini label="技術" value={candidate.stats.engineering} max={topStat} />
          <StatMini label="営業" value={candidate.stats.sales} max={topStat} />
          <StatMini label="企画" value={candidate.stats.planning} max={topStat} />
        </div>
      </div>

      {/* 希望年俸 & 採用ボタン */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-gray-400 text-xs">
          {candidate.expectedSalary}万円/月
        </span>
        <button
          onClick={props.onHire}
          disabled={!props.canAfford}
          className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
            props.canAfford
              ? 'bg-blue-500 text-white hover:bg-blue-400'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          採用
        </button>
      </div>
    </div>
  )
}

function StatMini(props: { label: string; value: number; max: number }): ReactNode {
  const width = props.max > 0 ? (props.value / 100) * 100 : 0
  return (
    <div className="flex items-center gap-1">
      <span className="text-gray-500 text-[10px] w-5">{props.label}</span>
      <div className="w-16 h-1.5 rounded-full bg-gray-700/60 overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-400/70"
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-gray-400 text-[10px] w-5 text-right">{props.value}</span>
    </div>
  )
}
