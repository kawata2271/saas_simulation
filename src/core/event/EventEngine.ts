/**
 * イベント発火/条件評価エンジン
 * - 毎ティック全イベント条件をチェック（最適化済み）
 * - 同時発火上限3、クールダウン管理、重複防止
 * - 重み付き抽選、優先度付きディスパッチ
 */

import type {
  GameEventDefinition, EventCondition, EventRecord,
  EventSystemState, EventChoice,
} from '@game-types/events.js'
import type { EventBus } from '@core/engine/EventBus.js'
import type { SeededRandom } from '@utils/random.js'

/** イベント優先度（高い方が優先） */
export const EVENT_PRIORITIES = {
  CRITICAL: 4,
  IMPORTANT: 3,
  NORMAL: 2,
  FLAVOR: 1,
} as const

/** 条件評価に渡す現在のゲーム状態スナップショット */
export interface GameStateSnapshot {
  readonly tick: number
  readonly employees: number
  readonly cash: number
  readonly mrr: number
  readonly arr: number
  readonly runway: number
  readonly productScore: number
  readonly techDebt: number
  readonly bugCount: number
  readonly activeCustomers: number
  readonly reputation: number
  readonly stage: string
  readonly companyAge: number
  readonly headcount: number
  readonly flags: ReadonlySet<string>
  readonly completedEventIds: ReadonlySet<string>
}

/** 同時発火上限 */
const MAX_CONCURRENT_EVENTS = 3

/** 発火結果 */
export interface FiredEvent {
  readonly definition: GameEventDefinition
  readonly priority: number
}

/**
 * EventEngine — イベントの条件評価と発火管理
 */
export class EventEngine {
  private readonly definitions: Map<string, GameEventDefinition> = new Map()
  private readonly history: EventRecord[] = []
  private readonly lastFiredMap: Map<string, number> = new Map()
  private readonly occurrenceCount: Map<string, number> = new Map()
  private readonly gameFlags: Set<string> = new Set()
  private activeEvents: FiredEvent[] = []
  private readonly eventBus: EventBus
  private readonly rng: SeededRandom

  constructor(eventBus: EventBus, rng: SeededRandom) {
    this.eventBus = eventBus
    this.rng = rng
  }

  /** イベント定義を登録する */
  registerEvent(def: GameEventDefinition): void {
    this.definitions.set(def.id, def)
  }

  /** 複数イベントを一括登録する */
  registerEvents(defs: readonly GameEventDefinition[]): void {
    for (const def of defs) {
      this.definitions.set(def.id, def)
    }
  }

  /** ゲームフラグを設定する */
  setFlag(flag: string): void {
    this.gameFlags.add(flag)
  }

  /** ゲームフラグを確認する */
  hasFlag(flag: string): boolean {
    return this.gameFlags.has(flag)
  }

  /** 現在アクティブなイベント一覧 */
  getActiveEvents(): readonly FiredEvent[] {
    return this.activeEvents
  }

  /** イベント履歴 */
  getHistory(): readonly EventRecord[] {
    return this.history
  }

  /**
   * ティックごとのイベント評価
   * @returns 新たに発火したイベントのリスト
   */
  evaluate(state: GameStateSnapshot): FiredEvent[] {
    if (this.activeEvents.length >= MAX_CONCURRENT_EVENTS) return []

    const candidates: Array<{ def: GameEventDefinition; weight: number }> = []

    for (const def of this.definitions.values()) {
      // 最速発火ティック
      if (state.tick < def.earliestTick) continue

      // 最大発生回数
      if (def.maxOccurrences > 0) {
        const count = this.occurrenceCount.get(def.id) ?? 0
        if (count >= def.maxOccurrences) continue
      }

      // クールダウン
      const lastFired = this.lastFiredMap.get(def.id) ?? -Infinity
      if (state.tick - lastFired < def.cooldownDays) continue

      // 条件評価
      if (!this.evaluateConditions(def.conditions, state)) continue

      // 確率抽選
      if (!this.rng.chance(def.probability)) continue

      const priority = this.getPriorityValue(def.severity)
      candidates.push({ def, weight: priority * def.probability })
    }

    if (candidates.length === 0) return []

    // 優先度+重み付きで選出（上限まで）
    candidates.sort((a, b) => b.weight - a.weight)
    const slots = MAX_CONCURRENT_EVENTS - this.activeEvents.length
    const selected = candidates.slice(0, Math.min(slots, 2))

    const fired: FiredEvent[] = []
    for (const { def } of selected) {
      const event: FiredEvent = {
        definition: def,
        priority: this.getPriorityValue(def.severity),
      }
      this.activeEvents.push(event)
      this.lastFiredMap.set(def.id, state.tick)
      this.occurrenceCount.set(def.id, (this.occurrenceCount.get(def.id) ?? 0) + 1)
      this.eventBus.emit('event:fired', { eventId: def.id })
      fired.push(event)
    }

    return fired
  }

  /**
   * プレイヤーがイベントの選択肢を選んだ
   */
  resolveEvent(
    eventId: string,
    choiceId: string,
    tick: number,
  ): EventChoice | null {
    const idx = this.activeEvents.findIndex((e) => e.definition.id === eventId)
    if (idx < 0) return null

    const event = this.activeEvents[idx]
    const choice = event.definition.choices.find((c) => c.id === choiceId)
    if (!choice) return null

    // 履歴記録
    this.history.push({
      eventId,
      firedAt: tick,
      chosenOptionId: choiceId,
    })

    // アクティブから除去
    this.activeEvents.splice(idx, 1)

    this.eventBus.emit('event:resolved', { eventId, choiceId })

    return choice
  }

  /** 条件群を評価する（AND結合） */
  private evaluateConditions(
    conditions: readonly EventCondition[],
    state: GameStateSnapshot,
  ): boolean {
    for (const cond of conditions) {
      if (!this.evaluateSingleCondition(cond, state)) return false
    }
    return true
  }

  /** 単一条件を評価する */
  private evaluateSingleCondition(
    cond: EventCondition,
    state: GameStateSnapshot,
  ): boolean {
    const fieldValue = this.resolveField(cond.field, state)
    const targetValue = cond.value

    switch (cond.operator) {
      case 'gt':  return fieldValue > Number(targetValue)
      case 'gte': return fieldValue >= Number(targetValue)
      case 'lt':  return fieldValue < Number(targetValue)
      case 'lte': return fieldValue <= Number(targetValue)
      case 'eq':  return fieldValue === Number(targetValue)
      case 'neq': return fieldValue !== Number(targetValue)
      default: return false
    }
  }

  /** フィールドパスからゲーム状態の値を取得する */
  private resolveField(field: string, state: GameStateSnapshot): number {
    switch (field) {
      case 'tick': return state.tick
      case 'employees': return state.employees
      case 'cash': return state.cash
      case 'mrr': return state.mrr
      case 'arr': return state.arr
      case 'runway': return state.runway
      case 'productScore': return state.productScore
      case 'techDebt': return state.techDebt
      case 'bugCount': return state.bugCount
      case 'activeCustomers': return state.activeCustomers
      case 'reputation': return state.reputation
      case 'companyAge': return state.companyAge
      case 'headcount': return state.headcount
      default: return 0
    }
  }

  /** 重要度からpriority数値へ */
  private getPriorityValue(severity: string): number {
    switch (severity) {
      case 'critical': return EVENT_PRIORITIES.CRITICAL
      case 'warning':  return EVENT_PRIORITIES.IMPORTANT
      case 'opportunity': return EVENT_PRIORITIES.NORMAL
      default: return EVENT_PRIORITIES.FLAVOR
    }
  }

  /** 状態を取得する */
  getState(): EventSystemState {
    return {
      activeEvent: this.activeEvents[0]?.definition ?? null,
      history: [...this.history],
      lastFiredMap: Object.fromEntries(this.lastFiredMap),
      occurrenceCount: Object.fromEntries(this.occurrenceCount),
    }
  }

  /** リセット */
  reset(): void {
    this.activeEvents = []
    this.history.length = 0
    this.lastFiredMap.clear()
    this.occurrenceCount.clear()
    this.gameFlags.clear()
  }
}
