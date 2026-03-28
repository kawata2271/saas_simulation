/**
 * ゲーム状態ストア
 * ゲームエンジンの状態をReact UIに反映するためのZustand store
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { GameDate, GameSpeed } from '@game-types/game.js'
import { GAME_SPEEDS } from '@game-types/game.js'
import type { CompanyState } from '@game-types/company.js'
import type { SaaSMetrics } from '@game-types/finance.js'

interface GameStoreState {
  /** ゲーム内日付 */
  currentDate: GameDate
  /** ゲーム速度 */
  speed: GameSpeed
  /** 一時停止中か */
  isPaused: boolean
  /** 手持ち資金（万円） */
  cash: number
  /** 企業価値（万円） */
  valuation: number
  /** 会社情報 */
  company: CompanyState | null
  /** SaaSメトリクス（簡易） */
  metrics: SaaSMetrics | null
  /** 従業員数 */
  headcount: number
}

interface GameStoreActions {
  setDate: (date: GameDate) => void
  setSpeed: (speed: GameSpeed) => void
  setPaused: (paused: boolean) => void
  setCash: (cash: number) => void
  setValuation: (valuation: number) => void
  setCompany: (company: CompanyState) => void
  setMetrics: (metrics: SaaSMetrics) => void
  setHeadcount: (count: number) => void
  reset: () => void
}

const initialDate: GameDate = {
  year: 1,
  month: 1,
  day: 1,
  quarter: 1,
  weekday: 1,
  totalDays: 0,
}

const initialState: GameStoreState = {
  currentDate: initialDate,
  speed: GAME_SPEEDS.NORMAL,
  isPaused: true,
  cash: 500,
  valuation: 0,
  company: null,
  metrics: null,
  headcount: 1,
}

export const useGameStore = create<GameStoreState & GameStoreActions>()(
  immer((set) => ({
    ...initialState,

    setDate: (date) =>
      set((state) => {
        state.currentDate = date
      }),

    setSpeed: (speed) =>
      set((state) => {
        state.speed = speed
        state.isPaused = speed === GAME_SPEEDS.PAUSED
      }),

    setPaused: (paused) =>
      set((state) => {
        state.isPaused = paused
      }),

    setCash: (cash) =>
      set((state) => {
        state.cash = cash
      }),

    setValuation: (valuation) =>
      set((state) => {
        state.valuation = valuation
      }),

    setCompany: (company) =>
      set((state) => {
        state.company = company
      }),

    setMetrics: (metrics) =>
      set((state) => {
        state.metrics = metrics
      }),

    setHeadcount: (count) =>
      set((state) => {
        state.headcount = count
      }),

    reset: () => set(() => ({ ...initialState })),
  })),
)
