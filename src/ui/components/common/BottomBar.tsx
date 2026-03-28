/**
 * ボトムバー
 * 画面下部のアクションバー: 採用、開発、営業、リリースの各アクション
 */

import { useState, type ReactNode } from 'react'
import type { SimulationManager } from '@core/simulation/SimulationManager.js'
import { useGameStore } from '@ui/stores/gameStore.js'
import { HirePanel } from '@ui/components/hr/HirePanel.js'
import { DevPanel } from '@ui/components/product/DevPanel.js'
import { SalesPanel } from '@ui/components/dashboard/SalesPanel.js'

type ActivePanel = 'none' | 'hire' | 'dev' | 'sales'

interface BottomBarProps {
  simulation: SimulationManager
}

export function BottomBar(props: BottomBarProps): ReactNode {
  const [activePanel, setActivePanel] = useState<ActivePanel>('none')
  const isPaused = useGameStore((s) => s.isPaused)

  const togglePanel = (panel: ActivePanel): void => {
    setActivePanel((prev) => (prev === panel ? 'none' : panel))
  }

  return (
    <>
      {/* アクションパネル（ボトムバーの上に表示） */}
      {activePanel === 'hire' && (
        <HirePanel
          simulation={props.simulation}
          onClose={() => setActivePanel('none')}
        />
      )}
      {activePanel === 'dev' && (
        <DevPanel
          simulation={props.simulation}
          onClose={() => setActivePanel('none')}
        />
      )}
      {activePanel === 'sales' && (
        <SalesPanel
          simulation={props.simulation}
          onClose={() => setActivePanel('none')}
        />
      )}

      {/* ボトムバー */}
      <div
        className="absolute bottom-0 left-0 right-0 z-40 px-4 py-2"
        style={{
          background: 'linear-gradient(0deg, rgba(30,27,46,0.98) 60%, rgba(30,27,46,0) 100%)',
        }}
      >
        <div className="flex items-center justify-between">
          {/* 左: ステータス */}
          <div className="flex items-center gap-3">
            {isPaused && (
              <span className="text-red-400 text-xs font-bold animate-pulse">
                PAUSED
              </span>
            )}
            <span className="text-gray-600 text-xs">
              ドラッグで移動 / スクロールでズーム
            </span>
          </div>

          {/* 右: アクションボタン */}
          <div className="flex items-center gap-2">
            <ActionButton
              label="採用"
              active={activePanel === 'hire'}
              color="blue"
              onClick={() => togglePanel('hire')}
            />
            <ActionButton
              label="開発"
              active={activePanel === 'dev'}
              color="green"
              onClick={() => togglePanel('dev')}
            />
            <ActionButton
              label="営業"
              active={activePanel === 'sales'}
              color="purple"
              onClick={() => togglePanel('sales')}
            />
          </div>
        </div>
      </div>
    </>
  )
}

function ActionButton(props: {
  label: string
  active: boolean
  color: string
  onClick: () => void
}): ReactNode {
  const colorMap: Record<string, string> = {
    blue: props.active ? 'bg-blue-500 text-white' : 'bg-blue-900/40 text-blue-300 hover:bg-blue-800/40',
    green: props.active ? 'bg-green-500 text-white' : 'bg-green-900/40 text-green-300 hover:bg-green-800/40',
    purple: props.active ? 'bg-purple-500 text-white' : 'bg-purple-900/40 text-purple-300 hover:bg-purple-800/40',
  }

  return (
    <button
      onClick={props.onClick}
      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${colorMap[props.color] ?? ''}`}
    >
      {props.label}
    </button>
  )
}
