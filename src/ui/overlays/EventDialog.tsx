/**
 * EventDialog — イベント通知ダイアログ
 * 画面下部中央にポップアップ、priority別スタイル、選択肢＋効果プレビュー
 */

import { type ReactNode, useState } from 'react'
import { getSimulation } from '@ui/hooks/useGameEngine.js'
import { useGameStore } from '@ui/stores/gameStore.js'
import type { EventChoice } from '@game-types/events.js'

/** priority別のスタイル */
const PRIORITY_STYLES: Record<string, { border: string; bg: string; icon: string }> = {
  critical:    { border: 'border-red-400', bg: 'bg-red-50', icon: '🚨' },
  warning:     { border: 'border-amber-400', bg: 'bg-amber-50', icon: '⚠️' },
  opportunity: { border: 'border-emerald-400', bg: 'bg-emerald-50', icon: '✨' },
  info:        { border: 'border-slate-300', bg: 'bg-slate-50', icon: '💬' },
}

/** リスクレベル色 */
function riskColor(effects: EventChoice['effects']): string {
  const hasNegative = effects.some((e) => e.value < 0 || (e.operator === 'multiply' && e.value < 1))
  const hasPositive = effects.some((e) => e.value > 0 || (e.operator === 'multiply' && e.value > 1))
  if (hasNegative && hasPositive) return 'text-amber-600'
  if (hasNegative) return 'text-red-500'
  return 'text-emerald-600'
}

export function EventDialog(): ReactNode {
  const sim = getSimulation()
  const activeEvents = sim.events.getActiveEvents()
  const currentDate = useGameStore((s) => s.currentDate)
  const [resolving, setResolving] = useState(false)

  if (activeEvents.length === 0) return null
  const event = activeEvents[0]
  const def = event.definition
  const style = PRIORITY_STYLES[def.severity] ?? PRIORITY_STYLES['info']

  const handleChoice = (choice: EventChoice): void => {
    setResolving(true)
    sim.events.resolveEvent(def.id, choice.id, currentDate.totalDays)
    setTimeout(() => setResolving(false), 100)
  }

  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 w-[480px] animate-slide-up">
      <div className={`glass-panel border-2 ${style.border} overflow-hidden`}>
        {/* ヘッダー */}
        <div className={`${style.bg} px-4 py-2.5 flex items-center gap-2`}>
          <span className="text-lg">{style.icon}</span>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-800">{def.titleKey}</h3>
            <p className="text-[10px] text-slate-500 uppercase">{def.category}</p>
          </div>
        </div>

        {/* 本文 */}
        <div className="px-4 py-3">
          <p className="text-[13px] text-slate-600 leading-relaxed">{def.descriptionKey}</p>
        </div>

        {/* 選択肢 */}
        {def.choices.length > 0 && (
          <div className="px-4 pb-4 space-y-2">
            {def.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleChoice(choice)}
                disabled={resolving}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800 group-hover:text-blue-700">
                    {choice.labelKey}
                  </span>
                  {choice.effects.length > 0 && (
                    <span className={`text-[10px] font-semibold ${riskColor(choice.effects)}`}>
                      {choice.effects.length}効果
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{choice.descriptionKey}</p>
                {/* 効果プレビュー */}
                {choice.effects.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {choice.effects.slice(0, 3).map((eff, i) => (
                      <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                        eff.value > 0 || (eff.operator === 'multiply' && eff.value > 1)
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-red-50 text-red-500'
                      }`}>
                        {eff.field} {eff.operator === 'add' ? (eff.value > 0 ? '+' : '') + eff.value : `×${eff.value}`}
                        {eff.duration > 0 ? ` (${eff.duration}日)` : ''}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
