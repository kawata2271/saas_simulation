/**
 * TutorialOverlay — チュートリアル吹き出しUI
 * ハイライトマスク + 吹き出し + 進捗バー + スキップボタン
 */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { TutorialState, TutorialActions } from './useTutorial.js'
import { HIGHLIGHT_TARGETS, ADVANCE_CONDITIONS } from './TutorialSteps.js'
import type { HighlightTarget } from './TutorialSteps.js'

/** data-tutorial属性でハイライト対象要素を検索する */
function findHighlightRect(target: HighlightTarget): DOMRect | null {
  if (target === HIGHLIGHT_TARGETS.NONE) return null
  const el = document.querySelector(`[data-tutorial="${target}"]`)
  return el?.getBoundingClientRect() ?? null
}

interface TutorialOverlayProps {
  state: TutorialState
  actions: TutorialActions
}

export function TutorialOverlay(props: TutorialOverlayProps): ReactNode {
  const { state, actions } = props
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const step = state.currentStep
  if (!state.active || !step) return null

  // ハイライト位置を更新
  useEffect(() => {
    const update = (): void => {
      setHighlightRect(findHighlightRect(step.highlight))
    }
    update()
    const timer = setInterval(update, 300)
    return () => clearInterval(timer)
  }, [step.highlight])

  const isClickNext = step.advanceOn === ADVANCE_CONDITIONS.CLICK_NEXT
  const isLast = state.stepIndex === state.totalSteps - 1

  // 吹き出し位置計算
  const tooltipStyle = calcTooltipPosition(step.position, highlightRect)

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[9999]" onClick={(e) => {
      // ハイライト領域クリックならCLICK_TARGET通知
      if (step.advanceOn === ADVANCE_CONDITIONS.CLICK_TARGET && highlightRect) {
        const r = highlightRect
        if (e.clientX >= r.left && e.clientX <= r.right &&
            e.clientY >= r.top && e.clientY <= r.bottom) {
          actions.notifyAction(ADVANCE_CONDITIONS.CLICK_TARGET)
        }
      }
    }}>
      {/* マスクオーバーレイ（ハイライト部分を透過） */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        <defs>
          <mask id="tutorial-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {highlightRect && (
              <rect
                x={highlightRect.left - 6}
                y={highlightRect.top - 6}
                width={highlightRect.width + 12}
                height={highlightRect.height + 12}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.4)" mask="url(#tutorial-mask)" />
      </svg>

      {/* ハイライト枠（パルスアニメーション） */}
      {highlightRect && (
        <div className="absolute rounded-lg border-2 border-blue-400 animate-pulse pointer-events-none"
          style={{
            left: highlightRect.left - 6,
            top: highlightRect.top - 6,
            width: highlightRect.width + 12,
            height: highlightRect.height + 12,
            zIndex: 2,
            boxShadow: '0 0 20px rgba(37, 99, 235, 0.3)',
          }} />
      )}

      {/* 吹き出し */}
      <div className="absolute glass-panel p-5 max-w-[380px] animate-slide-up pointer-events-auto"
        style={{ ...tooltipStyle, zIndex: 3 }}>
        {/* 進捗バー */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${state.progress}%` }} />
          </div>
          <span className="text-[10px] text-slate-400 font-mono shrink-0">
            {state.stepIndex + 1}/{state.totalSteps}
          </span>
        </div>

        {/* タイトル */}
        <h3 className="text-sm font-bold text-slate-800 mb-1">{step.title}</h3>

        {/* メッセージ */}
        <p className="text-[13px] text-slate-500 leading-relaxed">{step.message}</p>

        {/* ボタン */}
        <div className="flex items-center justify-between mt-4">
          <button onClick={actions.skip}
            className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors">
            スキップ
          </button>
          {isClickNext && (
            <button onClick={actions.next}
              className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm">
              {isLast ? '始める！' : '次へ'}
            </button>
          )}
          {!isClickNext && (
            <span className="text-[10px] text-blue-500 font-medium animate-pulse-soft">
              {getConditionHint(step.advanceOn)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/** 条件のヒントテキスト */
function getConditionHint(condition: string): string {
  switch (condition) {
    case ADVANCE_CONDITIONS.CLICK_TARGET: return '対象をクリック →'
    case ADVANCE_CONDITIONS.HIRE_EMPLOYEE: return '候補者を採用してください →'
    case ADVANCE_CONDITIONS.START_FEATURE: return '機能開発を開始してください →'
    case ADVANCE_CONDITIONS.SET_BUDGET: return '予算を設定してください →'
    case ADVANCE_CONDITIONS.CHANGE_SPEED: return '速度を変更してください →'
    case ADVANCE_CONDITIONS.WAIT_TICKS: return 'しばらくお待ちください…'
    default: return ''
  }
}

/** 吹き出しの位置を計算する */
function calcTooltipPosition(
  position: string,
  rect: DOMRect | null,
): React.CSSProperties {
  if (!rect || position === 'center') {
    return {
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
    }
  }

  const gap = 16
  switch (position) {
    case 'bottom':
      return { left: rect.left + rect.width / 2 - 190, top: rect.bottom + gap }
    case 'top':
      return { left: rect.left + rect.width / 2 - 190, bottom: window.innerHeight - rect.top + gap }
    case 'left':
      return { right: window.innerWidth - rect.left + gap, top: rect.top }
    case 'right':
      return { left: rect.right + gap, top: rect.top }
    default:
      return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
  }
}
