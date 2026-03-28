/**
 * ゲーム内時間フック
 * ゲーム内日付をフォーマットして提供する
 */

import { useGameStore } from '@ui/stores/gameStore.js'

/** ゲーム日付をフォーマットする */
function formatGameDate(year: number, month: number, day: number): string {
  return `Y${year} M${month} D${day}`
}

/** 四半期をフォーマットする */
function formatQuarter(year: number, quarter: number): string {
  return `Y${year} Q${quarter}`
}

interface GameTimeInfo {
  readonly dateString: string
  readonly quarterString: string
  readonly year: number
  readonly month: number
  readonly day: number
  readonly quarter: number
  readonly totalDays: number
}

/**
 * useGameTime — ゲーム内時間情報を取得する
 */
export function useGameTime(): GameTimeInfo {
  const { year, month, day, quarter, totalDays } = useGameStore(
    (s) => s.currentDate,
  )

  return {
    dateString: formatGameDate(year, month, day),
    quarterString: formatQuarter(year, quarter),
    year,
    month,
    day,
    quarter,
    totalDays,
  }
}
