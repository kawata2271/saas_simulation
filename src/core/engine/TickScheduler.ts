/**
 * ゲーム内時間管理システム
 * - 1ティック = 1営業日（月〜金）
 * - 祝日対応（日本の祝日ベース）
 * - isMonthEnd/isQuarterEnd/isYearEndフラグ
 * - scheduler.on/scheduler.at によるスケジュールイベント
 */

import type { GameDate, GameSpeed, GameTimeState } from '@game-types/game.js'
import { GAME_SPEEDS } from '@game-types/game.js'
import type { EventBus } from './EventBus.js'

/** 月ごとの営業日数（概算、祝日考慮前） */
const BASE_DAYS_PER_MONTH = [21, 19, 22, 21, 21, 21, 22, 22, 20, 22, 20, 19]

/** 年間の月初営業日目（累積） */
const MONTH_START_DAYS: number[] = []
let cumulative = 0
for (const d of BASE_DAYS_PER_MONTH) {
  MONTH_START_DAYS.push(cumulative)
  cumulative += d
}

/** 日本の主要祝日（月, 日）— 営業日カレンダー上の概算位置 */
const HOLIDAYS: ReadonlyArray<{ month: number; day: number; name: string }> = [
  { month: 1, day: 1, name: '元日' },
  { month: 1, day: 10, name: '成人の日' },
  { month: 2, day: 11, name: '建国記念の日' },
  { month: 3, day: 21, name: '春分の日' },
  { month: 4, day: 29, name: '昭和の日' },
  { month: 5, day: 3, name: '憲法記念日' },
  { month: 5, day: 4, name: 'みどりの日' },
  { month: 5, day: 5, name: 'こどもの日' },
  { month: 7, day: 18, name: '海の日' },
  { month: 8, day: 11, name: '山の日' },
  { month: 9, day: 19, name: '敬老の日' },
  { month: 9, day: 23, name: '秋分の日' },
  { month: 10, day: 10, name: 'スポーツの日' },
  { month: 11, day: 3, name: '文化の日' },
  { month: 11, day: 23, name: '勤労感謝の日' },
]

/** スケジュールイベント定義 */
interface ScheduledEvent {
  readonly id: string
  readonly condition: (date: GameDate) => boolean
  readonly handler: (date: GameDate) => void
}

/** カレンダーイベントコールバック */
type CalendarCallback = (date: GameDate) => void

/** 営業日数 → GameDate変換 */
function totalDaysToDate(totalDays: number): GameDate {
  const businessDaysPerYear = 250
  const year = Math.floor(totalDays / businessDaysPerYear) + 1
  const dayInYear = totalDays % businessDaysPerYear

  let month = 1
  for (let i = 11; i >= 0; i--) {
    if (dayInYear >= MONTH_START_DAYS[i]) {
      month = i + 1
      break
    }
  }

  const day = dayInYear - MONTH_START_DAYS[month - 1] + 1
  const quarter = Math.ceil(month / 3)
  const weekday = (totalDays % 5) + 1 // 1=Mon ... 5=Fri
  const daysInMonth = BASE_DAYS_PER_MONTH[month - 1]
  const isMonthEnd = day >= daysInMonth
  const isQuarterEnd = isMonthEnd && (month % 3 === 0)
  const isYearEnd = isMonthEnd && month === 12

  // 祝日判定
  const holiday = HOLIDAYS.find((h) => h.month === month && h.day === day)

  return {
    year, month, day, quarter, weekday, totalDays,
    isMonthEnd, isQuarterEnd, isYearEnd,
    isHoliday: holiday !== undefined,
    holidayName: holiday?.name ?? null,
  }
}

/**
 * TickScheduler — ゲーム内時間管理 + スケジュールイベント
 */
export class TickScheduler {
  private tickCount = 0
  private speed: GameSpeed = GAME_SPEEDS.NORMAL
  private paused = true
  private accumulator = 0
  private lastMonth = 0
  private lastQuarter = 0
  private lastYear = 0

  private readonly scheduledEvents: ScheduledEvent[] = []
  private readonly calendarCallbacks = new Map<string, CalendarCallback[]>()
  private nextScheduleId = 0

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
   * カレンダーイベントを登録する
   * @example scheduler.on('monthEnd', (date) => financeSystem.closeMonth())
   */
  on(
    event: 'monthEnd' | 'quarterEnd' | 'yearEnd' | 'holiday',
    handler: CalendarCallback,
  ): () => void {
    if (!this.calendarCallbacks.has(event)) {
      this.calendarCallbacks.set(event, [])
    }
    const callbacks = this.calendarCallbacks.get(event)!
    callbacks.push(handler)
    return () => {
      const idx = callbacks.indexOf(handler)
      if (idx >= 0) callbacks.splice(idx, 1)
    }
  }

  /**
   * 特定日付条件でスケジュールイベントを登録する
   * @example scheduler.at({ month: 3, day: 15 }, () => legalSystem.taxDeadline())
   */
  at(
    condition: { month?: number; day?: number; quarter?: number; weekday?: number },
    handler: CalendarCallback,
  ): () => void {
    const id = `sched_${this.nextScheduleId++}`
    const entry: ScheduledEvent = {
      id,
      condition: (date) => {
        if (condition.month !== undefined && date.month !== condition.month) return false
        if (condition.day !== undefined && date.day !== condition.day) return false
        if (condition.quarter !== undefined && date.quarter !== condition.quarter) return false
        if (condition.weekday !== undefined && date.weekday !== condition.weekday) return false
        return true
      },
      handler,
    }
    this.scheduledEvents.push(entry)
    return () => {
      const idx = this.scheduledEvents.findIndex((e) => e.id === id)
      if (idx >= 0) this.scheduledEvents.splice(idx, 1)
    }
  }

  /**
   * フレームごとに呼ばれる更新関数
   * @returns 今回のフレームで進んだティック数
   */
  update(deltaMs: number, maxTicksPerFrame = 4): number {
    if (this.paused || this.speed === GAME_SPEEDS.PAUSED) {
      return 0
    }

    const msPerTick = 1000 / this.speed
    this.accumulator += deltaMs
    let ticksThisFrame = 0

    while (this.accumulator >= msPerTick && ticksThisFrame < maxTicksPerFrame) {
      this.accumulator -= msPerTick
      this.tickCount++
      ticksThisFrame++

      const date = this.getCurrentDate()
      this.eventBus.emit('tick', { day: this.tickCount })

      // 祝日通知
      if (date.isHoliday && date.holidayName) {
        this.eventBus.emit('holiday', { name: date.holidayName, day: this.tickCount })
        this.fireCallbacks('holiday', date)
      }

      // 月末
      if (date.month !== this.lastMonth) {
        this.eventBus.emit('month-end', { month: this.lastMonth || date.month, year: date.year })
        this.fireCallbacks('monthEnd', date)
        this.lastMonth = date.month
      }

      // 四半期末
      if (date.quarter !== this.lastQuarter) {
        this.eventBus.emit('quarter-end', { quarter: date.quarter, year: date.year })
        this.fireCallbacks('quarterEnd', date)
        this.lastQuarter = date.quarter
      }

      // 年末
      if (date.year !== this.lastYear) {
        this.eventBus.emit('year-end', { year: date.year })
        this.fireCallbacks('yearEnd', date)
        this.lastYear = date.year
      }

      // スケジュールイベント実行
      for (const sched of this.scheduledEvents) {
        if (sched.condition(date)) {
          try {
            sched.handler(date)
          } catch (err) {
            console.error(`[TickScheduler] Scheduled event error:`, err)
          }
        }
      }
    }

    // 余剰accumulatorをリセット（フレームスキップ超過分は捨てる）
    if (this.accumulator > msPerTick * maxTicksPerFrame) {
      this.accumulator = 0
    }

    return ticksThisFrame
  }

  /** カレンダーコールバックを実行する */
  private fireCallbacks(event: string, date: GameDate): void {
    const callbacks = this.calendarCallbacks.get(event)
    if (!callbacks) return
    for (const cb of callbacks) {
      try {
        cb(date)
      } catch (err) {
        console.error(`[TickScheduler] Calendar callback error (${event}):`, err)
      }
    }
  }

  /** セーブデータから復元 */
  restore(state: GameTimeState): void {
    this.tickCount = state.tickCount
    this.speed = state.speed
    this.paused = state.isPaused

    const date = this.getCurrentDate()
    this.lastMonth = date.month
    this.lastQuarter = date.quarter
    this.lastYear = date.year
  }

  /** リセット */
  reset(): void {
    this.tickCount = 0
    this.speed = GAME_SPEEDS.NORMAL
    this.paused = true
    this.accumulator = 0
    this.lastMonth = 0
    this.lastQuarter = 0
    this.lastYear = 0
    this.scheduledEvents.length = 0
    this.calendarCallbacks.clear()
  }
}
