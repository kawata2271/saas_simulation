/**
 * TopBar — 常時表示のヘッダーバー
 * CompanyInfo(左) | Timer/Speed(中央) | Cash/Valuation(右)
 */

import { useEffect, useRef, type ReactNode } from 'react'
import { useGameStore } from '@ui/stores/gameStore.js'
import { useGameTime } from '@ui/hooks/useGameTime.js'
import { useGameEngine } from '@ui/hooks/useGameEngine.js'
import { GAME_SPEEDS } from '@game-types/game.js'
import type { GameSpeed } from '@game-types/game.js'

/** 数値をアニメーション付きで表示するフック */
function useAnimatedNumber(target: number, speed = 0.15): number {
  const ref = useRef(target)
  const frameRef = useRef(0)

  useEffect(() => {
    const animate = (): void => {
      ref.current += (target - ref.current) * speed
      if (Math.abs(target - ref.current) < 0.5) ref.current = target
      frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, speed])

  return Math.round(ref.current)
}

/** 金額フォーマット */
function formatMoney(amount: number): string {
  if (Math.abs(amount) >= 10000) return `${(amount / 10000).toFixed(1)}億円`
  return `${amount.toLocaleString()}万円`
}

/** トレンドバッジ */
function TrendBadge(props: { value: number }): ReactNode {
  if (props.value === 0) return null
  const isUp = props.value > 0
  return (
    <span className={`text-[10px] font-semibold px-1 py-0.5 rounded ${
      isUp ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'
    }`}>
      {isUp ? '+' : ''}{props.value.toFixed(1)}%
    </span>
  )
}

export function TopBar(): ReactNode {
  const { engine } = useGameEngine()
  const { dateString, quarterString, year } = useGameTime()
  const cash = useGameStore((s) => s.cash)
  const valuation = useGameStore((s) => s.valuation)
  const speed = useGameStore((s) => s.speed)
  const isPaused = useGameStore((s) => s.isPaused)
  const headcount = useGameStore((s) => s.headcount)
  const company = useGameStore((s) => s.company)

  const animatedCash = useAnimatedNumber(cash)
  const animatedVal = useAnimatedNumber(valuation)

  const setSpeed = (s: GameSpeed): void => {
    engine.setSpeed(s)
    useGameStore.getState().setSpeed(s)
  }
  const togglePause = (): void => {
    if (isPaused) engine.resume()
    else engine.pause()
  }

  return (
    <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="mx-3 mt-2 glass-panel pointer-events-auto flex items-center justify-between px-4 py-2" data-tutorial="top-bar">
        {/* 左: Company Info */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            S
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 leading-tight">
              {company?.name ?? 'SAAS EMPIRE'}
            </p>
            <p className="text-[11px] text-slate-400">
              {company?.industry?.replace('_', ' ') ?? 'SaaS Simulation'}
            </p>
          </div>
        </div>

        {/* 中央: Timer & Speed */}
        <div className="flex flex-col items-center" data-tutorial="speed-controls">
          <div className="flex items-center gap-2">
            <span className={`font-mono text-lg font-semibold tracking-tight ${
              isPaused ? 'text-red-500 animate-pulse-soft' : 'text-slate-800'
            }`}>
              {dateString}
            </span>
            <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              {quarterString}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <button onClick={togglePause}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                isPaused ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
              aria-label={isPaused ? 'Resume' : 'Pause'}>
              {isPaused ? '⏸ PAUSED' : '▶'}
            </button>
            {([
              { label: 'x1', s: GAME_SPEEDS.NORMAL },
              { label: 'x2', s: GAME_SPEEDS.FAST },
              { label: 'x4', s: GAME_SPEEDS.FASTER },
              { label: 'x8', s: GAME_SPEEDS.FASTEST },
            ] as const).map(({ label, s }) => (
              <button key={label} onClick={() => setSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                  speed === s && !isPaused
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}>{label}</button>
            ))}
          </div>
        </div>

        {/* 右: Cash / Valuation / Period */}
        <div className="flex items-center gap-5 min-w-[300px] justify-end" data-tutorial="cash-display">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-medium">従業員</p>
            <p className="text-sm font-semibold text-blue-600">{headcount}名</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-medium">手持ち資金</p>
            <p className={`font-mono text-sm font-semibold ${
              cash < 100 ? 'text-red-500' : 'text-emerald-600'
            }`}>
              {formatMoney(animatedCash)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-medium">企業価値</p>
            <div className="flex items-center gap-1 justify-end">
              <p className="font-mono text-sm font-semibold text-slate-800">
                {formatMoney(animatedVal)}
              </p>
              <TrendBadge value={valuation > 0 ? 5.2 : 0} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-medium">期</p>
            <p className="font-mono text-sm font-bold text-amber-600">Y{year}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
