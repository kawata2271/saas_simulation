/**
 * ゲーム内時間管理システム
 * 1ティック = 1営業日として、ゲーム内カレンダーを進行させる
 */

import type { GameDate, GameSpeed, GameTimeState } from '@game-types/game.js'
import { GAME_CONSTANTS, GAME_SPEEDS } from '@game-types/game.js'
import type { EventBus } from './EventBus.js'

/** 月ごとの営業日数（概算） */
const DAYS_PER_MONTH = [21, 19, 22, 21, 21, 21, 22, 22, 20, 22, 20, 19]

/** 年間の月初営業日目（累積） */
const MONTH_START_DAYS: number[] = []
let cumulative = 0
for (const d of DAYS_PER_MONTH) {
  MONTH_START_DAYS.push(cumulative)
  cumulative += d
}

/**
 * 営業日数からGameDateを計算する
 */
function totalDaysToDate(totalDays: number): GameDate {
  const year = Math.floor(totalDays / GAME_CONSTANTS.BUSINESS_DAYS_PER_YEAR) + 1
  const dayInYear = totalDays % GAME_CONSTANTS.BUSINESS_DAYS_PER_YEAR

  let month = 1
  for (let i = 11; i >= 0; i--) {
    if (dayInYear >= MONTH_START_DAYS[i]) {
      month = i + 1
      break
    }
  }

  const day = dayInYear - MONTH_START_DAYS[month - 1] + 1
  const quarter = Math.ceil(month / 3)
  const weekday = (totalDays % 5) + 1

  return { year, month, day, quarter, weekday, totalDays }
}

/**
 * TickScheduler — ゲーム内時間を管理し、ティックごとにイベントバスに通知する
 */
export class TickScheduler {
  private tickCount = 0
  private speed: GameSpeed = GAME_SPEEDS.NORMAL
  private paused = true
  private accumulator = 0
  private lastQuarter = 0
  private lastYear = 0

  private readonly eventBus: EventBus

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus
  }

  /** 現在のゲーム日付を取得 */
  getCurrentDate(): GameDate {
    return totalDaysToDate(this.tickCount)
  }

  /** 現在の時間状態を取得 */
  getState(): GameTimeState {
    return {
      currentDate: this.getCurrentDate(),
      speed: this.speed,
      tickCount: this.tickCount,
      isPaused: this.paused,
    }
  }

  /** ゲーム速度を変更する */
  setSpeed(speed: GameSpeed): void {
    this.speed = speed
    if (speed === GAME_SPEEDS.PAUSED) {
      this.paused = true
      this.eventBus.emit('game:paused', {})
    } else {
      if (this.paused) {
        this.paused = false
        this.eventBus.emit('game:resumed', {})
      }
      this.eventBus.emit('game:speed-changed', { speed })
    }
  }

  /** 一時停止 */
  pause(): void {
    this.paused = true
    this.eventBus.emit('game:paused', {})
  }

  /** 再開 */
  resume(): void {
    if (this.speed === GAME_SPEEDS.PAUSED) {
      this.speed = GAME_SPEEDS.NORMAL
    }
    this.paused = false
    this.eventBus.emit('game:resumed', {})
  }

  /**
   * フレームごとに呼ばれる更新関数
   * @param deltaMs 前フレームからの経過ミリ秒
   * @returns 今回のフレームで進んだティック数
   */
  update(deltaMs: number): number {
    if (this.paused || this.speed === GAME_SPEEDS.PAUSED) {
      return 0
    }

    const msPerTick = 1000 / this.speed
    this.accumulator += deltaMs
    let ticksThisFrame = 0

    while (this.accumulator >= msPerTick) {
      this.accumulator -= msPerTick
      this.tickCount++
      ticksThisFrame++

      const date = this.getCurrentDate()
      this.eventBus.emit('tick', { day: this.tickCount })

      if (date.quarter !== this.lastQuarter) {
        this.lastQuarter = date.quarter
        this.eventBus.emit('quarter-end', {
          quarter: date.quarter,
          year: date.year,
        })
      }

      if (date.year !== this.lastYear) {
        this.lastYear = date.year
        this.eventBus.emit('year-end', { year: date.year })
      }
    }

    return ticksThisFrame
  }

  /** セーブデータから復元 */
  restore(state: GameTimeState): void {
    this.tickCount = state.tickCount
    this.speed = state.speed
    this.paused = state.isPaused

    const date = this.getCurrentDate()
    this.lastQuarter = date.quarter
    this.lastYear = date.year
  }

  /** リセット */
  reset(): void {
    this.tickCount = 0
    this.speed = GAME_SPEEDS.NORMAL
    this.paused = true
    this.accumulator = 0
    this.lastQuarter = 0
    this.lastYear = 0
  }
}
