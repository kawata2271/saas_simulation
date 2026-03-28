/**
 * ヘッドアップディスプレイ（HUD）
 * 画面上部に常時表示される情報バー：日付、資金、企業価値、速度コントロール
 */

import type { ReactNode } from 'react'
import { useGameStore } from '@ui/stores/gameStore.js'
import { useGameTime } from '@ui/hooks/useGameTime.js'
import { useGameEngine } from '@ui/hooks/useGameEngine.js'
import { GAME_SPEEDS } from '@game-types/game.js'
import type { GameSpeed } from '@game-types/game.js'

/** 金額を読みやすくフォーマットする（万円単位） */
function formatMoney(amount: number): string {
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(1)}億円`
  }
  return `${amount.toLocaleString()}万円`
}

/** 速度ボタン */
function SpeedButton(props: {
  label: string
  speed: GameSpeed
  currentSpeed: GameSpeed
  isPaused: boolean
  onClick: () => void
}): ReactNode {
  const isActive =
    props.speed === props.currentSpeed && !props.isPaused

  return (
    <button
      onClick={props.onClick}
      className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
        isActive
          ? 'bg-amber-500 text-gray-900'
          : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
      }`}
    >
      {props.label}
    </button>
  )
}

/**
 * HUD — 画面上部の情報バー
 */
export function HUD(): ReactNode {
  const { engine } = useGameEngine()
  const { dateString, quarterString } = useGameTime()
  const cash = useGameStore((s) => s.cash)
  const valuation = useGameStore((s) => s.valuation)
  const speed = useGameStore((s) => s.speed)
  const isPaused = useGameStore((s) => s.isPaused)
  const headcount = useGameStore((s) => s.headcount)

  const handleSpeedChange = (newSpeed: GameSpeed): void => {
    engine.setSpeed(newSpeed)
    useGameStore.getState().setSpeed(newSpeed)
  }

  const handlePauseToggle = (): void => {
    if (isPaused) {
      engine.resume()
    } else {
      engine.pause()
    }
  }

  return (
    <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="flex items-center justify-between px-4 py-2 pointer-events-auto"
           style={{ background: 'linear-gradient(180deg, rgba(30,27,46,0.95) 0%, rgba(30,27,46,0.7) 100%)' }}>
        {/* 左: 日付 & 四半期 */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-amber-400 font-bold text-sm">{dateString}</span>
            <span className="text-gray-400 text-xs">{quarterString}</span>
          </div>
        </div>

        {/* 中央: 速度コントロール */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePauseToggle}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
              isPaused
                ? 'bg-red-500/80 text-white'
                : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
            }`}
          >
            {isPaused ? '⏸' : '▶'}
          </button>
          <SpeedButton label="x1" speed={GAME_SPEEDS.NORMAL} currentSpeed={speed} isPaused={isPaused} onClick={() => handleSpeedChange(GAME_SPEEDS.NORMAL)} />
          <SpeedButton label="x2" speed={GAME_SPEEDS.FAST} currentSpeed={speed} isPaused={isPaused} onClick={() => handleSpeedChange(GAME_SPEEDS.FAST)} />
          <SpeedButton label="x4" speed={GAME_SPEEDS.FASTER} currentSpeed={speed} isPaused={isPaused} onClick={() => handleSpeedChange(GAME_SPEEDS.FASTER)} />
          <SpeedButton label="x8" speed={GAME_SPEEDS.FASTEST} currentSpeed={speed} isPaused={isPaused} onClick={() => handleSpeedChange(GAME_SPEEDS.FASTEST)} />
        </div>

        {/* 右: 資金 & 企業価値 & 従業員数 */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-gray-400 text-xs">従業員</span>
            <span className="text-blue-400 font-bold text-sm">{headcount}名</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-gray-400 text-xs">手持ち資金</span>
            <span className="text-green-400 font-bold text-sm">{formatMoney(cash)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-gray-400 text-xs">企業価値</span>
            <span className="text-amber-400 font-bold text-sm">{formatMoney(valuation)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
