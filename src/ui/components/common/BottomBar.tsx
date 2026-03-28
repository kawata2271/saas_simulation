/**
 * BottomBar — 画面下部のアクションバー（ライトテーマ版）
 */

import { useState, type ReactNode } from 'react'
import type { SimulationManager } from '@core/simulation/SimulationManager.js'
import { useGameStore } from '@ui/stores/gameStore.js'
import { HirePanel } from '@ui/components/hr/HirePanel.js'
import { DevPanel } from '@ui/components/product/DevPanel.js'
import { SalesPanel } from '@ui/components/dashboard/SalesPanel.js'
import type { TutorialActions } from '@ui/components/tutorial/useTutorial.js'
import { ADVANCE_CONDITIONS } from '@ui/components/tutorial/TutorialSteps.js'

type ActivePanel = 'none' | 'hire' | 'dev' | 'sales'

interface BottomBarProps {
  simulation: SimulationManager
  tutorialActions?: TutorialActions
}

export function BottomBar(props: BottomBarProps): ReactNode {
  const [activePanel, setActivePanel] = useState<ActivePanel>('none')
  const isPaused = useGameStore((s) => s.isPaused)
  const notify = props.tutorialActions?.notifyAction

  const toggle = (panel: ActivePanel): void => {
    setActivePanel((p) => (p === panel ? 'none' : panel))
    // チュートリアル通知
    if (panel === 'hire') notify?.(ADVANCE_CONDITIONS.CLICK_TARGET)
    if (panel === 'dev') notify?.(ADVANCE_CONDITIONS.CLICK_TARGET)
    if (panel === 'sales') notify?.(ADVANCE_CONDITIONS.CLICK_TARGET)
  }

  return (
    <>
      {activePanel === 'hire' && (
        <HirePanel simulation={props.simulation}
          onClose={() => setActivePanel('none')}
          onHired={() => notify?.(ADVANCE_CONDITIONS.HIRE_EMPLOYEE)} />
      )}
      {activePanel === 'dev' && (
        <DevPanel simulation={props.simulation}
          onClose={() => setActivePanel('none')}
          onStarted={() => notify?.(ADVANCE_CONDITIONS.START_FEATURE)} />
      )}
      {activePanel === 'sales' && (
        <SalesPanel simulation={props.simulation}
          onClose={() => setActivePanel('none')}
          onBudgetSet={() => notify?.(ADVANCE_CONDITIONS.SET_BUDGET)} />
      )}

      <div className="absolute bottom-0 left-0 right-0 z-40 px-3 pb-2 pointer-events-none" data-tutorial="bottom-bar">
        <div className="glass-panel pointer-events-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPaused && (
              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded animate-pulse-soft">
                PAUSED
              </span>
            )}
            <span className="text-[11px] text-slate-400">
              ドラッグで移動 / スクロールでズーム / WASD
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ActionBtn label="採用" active={activePanel === 'hire'} color="blue"
              onClick={() => toggle('hire')} tutorialId="hire-button" />
            <ActionBtn label="開発" active={activePanel === 'dev'} color="emerald"
              onClick={() => toggle('dev')} tutorialId="dev-button" />
            <ActionBtn label="営業" active={activePanel === 'sales'} color="violet"
              onClick={() => toggle('sales')} tutorialId="sales-button" />
          </div>
        </div>
      </div>
    </>
  )
}

function ActionBtn(props: {
  label: string; active: boolean; color: string; onClick: () => void; tutorialId: string
}): ReactNode {
  const styles: Record<string, { active: string; inactive: string }> = {
    blue: { active: 'bg-blue-600 text-white shadow-sm', inactive: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
    emerald: { active: 'bg-emerald-600 text-white shadow-sm', inactive: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
    violet: { active: 'bg-violet-600 text-white shadow-sm', inactive: 'bg-violet-50 text-violet-600 hover:bg-violet-100' },
  }
  const s = styles[props.color] ?? styles['blue']

  return (
    <button onClick={props.onClick} data-tutorial={props.tutorialId}
      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${props.active ? s.active : s.inactive}`}>
      {props.label}
    </button>
  )
}
