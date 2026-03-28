/**
 * チュートリアルエンジンフック
 * ステップ進行管理、条件判定、ハイライト対象追跡
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { TUTORIAL_STEPS, ADVANCE_CONDITIONS } from './TutorialSteps.js'
import type { TutorialStep, AdvanceCondition } from './TutorialSteps.js'
import { useSettingsStore } from '@ui/stores/settingsStore.js'
import { useGameStore } from '@ui/stores/gameStore.js'

export interface TutorialState {
  readonly active: boolean
  readonly currentStep: TutorialStep | null
  readonly stepIndex: number
  readonly totalSteps: number
  readonly progress: number
}

export interface TutorialActions {
  start: () => void
  next: () => void
  skip: () => void
  notifyAction: (action: AdvanceCondition) => void
}

/**
 * useTutorial — チュートリアルの状態管理と進行制御
 */
export function useTutorial(): [TutorialState, TutorialActions] {
  const [stepIndex, setStepIndex] = useState(-1)
  const [active, setActive] = useState(false)
  const setShowTutorial = useSettingsStore((s) => s.setShowTutorial)
  const tickRef = useRef(0)
  const waitStartTickRef = useRef(0)
  const currentDate = useGameStore((s) => s.currentDate)
  const isPaused = useGameStore((s) => s.isPaused)
  const prevPausedRef = useRef(true)

  // ティック追跡
  useEffect(() => {
    tickRef.current = currentDate.totalDays
  }, [currentDate.totalDays])

  // 速度変更の自動検知
  useEffect(() => {
    if (prevPausedRef.current !== isPaused && !isPaused) {
      // 一時停止→再開を検知
      if (currentStep?.advanceOn === ADVANCE_CONDITIONS.CHANGE_SPEED) {
        advance()
      }
    }
    prevPausedRef.current = isPaused
  }, [isPaused])

  const currentStep = active && stepIndex >= 0 && stepIndex < TUTORIAL_STEPS.length
    ? TUTORIAL_STEPS[stepIndex] : null

  // WAIT_TICKS条件の自動進行
  useEffect(() => {
    if (!currentStep || currentStep.advanceOn !== ADVANCE_CONDITIONS.WAIT_TICKS) return
    if (!currentStep.waitTicks) return

    const interval = setInterval(() => {
      const elapsed = tickRef.current - waitStartTickRef.current
      if (elapsed >= (currentStep.waitTicks ?? 0)) {
        advance()
      }
    }, 500)

    return () => clearInterval(interval)
  }, [currentStep?.id])

  const advance = useCallback((): void => {
    const nextIdx = stepIndex + 1
    if (nextIdx >= TUTORIAL_STEPS.length) {
      setActive(false)
      setStepIndex(-1)
      setShowTutorial(false)
      return
    }
    setStepIndex(nextIdx)
    waitStartTickRef.current = tickRef.current
  }, [stepIndex, setShowTutorial])

  const start = useCallback((): void => {
    setStepIndex(0)
    setActive(true)
    waitStartTickRef.current = tickRef.current
  }, [])

  const skip = useCallback((): void => {
    setActive(false)
    setStepIndex(-1)
    setShowTutorial(false)
  }, [setShowTutorial])

  const notifyAction = useCallback((action: AdvanceCondition): void => {
    if (!currentStep) return
    if (currentStep.advanceOn === action) {
      advance()
    }
  }, [currentStep, advance])

  const state: TutorialState = {
    active,
    currentStep,
    stepIndex,
    totalSteps: TUTORIAL_STEPS.length,
    progress: TUTORIAL_STEPS.length > 0
      ? ((stepIndex + 1) / TUTORIAL_STEPS.length) * 100 : 0,
  }

  const actions: TutorialActions = {
    start,
    next: advance,
    skip,
    notifyAction,
  }

  return [state, actions]
}
