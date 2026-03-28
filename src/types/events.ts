/**
 * イベントシステム型定義
 */

/** イベントカテゴリ */
export const EVENT_CATEGORIES = {
  MACRO: 'macro',
  COMPANY: 'company',
  HR: 'hr',
  PRODUCT: 'product',
  SALES: 'sales',
  FUNDING: 'funding',
  CRISIS: 'crisis',
  RANDOM: 'random',
} as const satisfies Record<string, string>

export type EventCategory = (typeof EVENT_CATEGORIES)[keyof typeof EVENT_CATEGORIES]

/** イベント重要度 */
export const EVENT_SEVERITIES = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
  OPPORTUNITY: 'opportunity',
} as const satisfies Record<string, string>

export type EventSeverity = (typeof EVENT_SEVERITIES)[keyof typeof EVENT_SEVERITIES]

/** イベント選択肢 */
export interface EventChoice {
  readonly id: string
  readonly labelKey: string
  readonly descriptionKey: string
  readonly effects: readonly EventEffect[]
  /** 選択に必要な条件（オプション） */
  readonly requirements?: EventRequirement
}

/** イベント効果 */
export interface EventEffect {
  readonly target: string
  readonly field: string
  readonly operator: 'add' | 'multiply' | 'set'
  readonly value: number
  /** 効果の持続日数（0 = 永続） */
  readonly duration: number
}

/** イベント発火条件 */
export interface EventCondition {
  readonly type: 'stat' | 'date' | 'stage' | 'random' | 'event_history'
  readonly field: string
  readonly operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
  readonly value: number | string
}

/** イベント選択に必要な条件 */
export interface EventRequirement {
  readonly minCash?: number
  readonly minHeadcount?: number
  readonly minReputation?: number
  readonly requiredStage?: string
}

/** イベント定義 */
export interface GameEventDefinition {
  readonly id: string
  readonly category: EventCategory
  readonly severity: EventSeverity
  readonly titleKey: string
  readonly descriptionKey: string
  readonly choices: readonly EventChoice[]
  readonly conditions: readonly EventCondition[]
  /** 同一イベントの再発火クールダウン（日数） */
  readonly cooldownDays: number
  /** 1ゲーム内での最大発火回数 */
  readonly maxOccurrences: number
  /** イベント発生確率（0-1、条件を満たした場合） */
  readonly probability: number
}

/** 発火済みイベント記録 */
export interface EventRecord {
  readonly eventId: string
  readonly firedAt: number
  readonly chosenOptionId: string
}

/** イベントシステム状態 */
export interface EventSystemState {
  /** 現在表示中のイベント */
  readonly activeEvent: GameEventDefinition | null
  /** 発火履歴 */
  readonly history: readonly EventRecord[]
  /** イベントごとの最終発火日 */
  readonly lastFiredMap: Readonly<Record<string, number>>
  /** イベントごとの発火回数 */
  readonly occurrenceCount: Readonly<Record<string, number>>
}

/** EventBus用のイベント型マップ */
export interface GameEventMap {
  'tick': { day: number }
  'quarter-end': { quarter: number; year: number }
  'year-end': { year: number }
  'company:founded': { companyId: string }
  'employee:hired': { employeeId: string }
  'employee:quit': { employeeId: string }
  'product:released': { version: string }
  'funding:closed': { roundId: string; amount: number }
  'event:fired': { eventId: string }
  'event:resolved': { eventId: string; choiceId: string }
  'game:saved': { slotIndex: number }
  'game:loaded': { slotIndex: number }
  'game:speed-changed': { speed: number }
  'game:paused': Record<string, never>
  'game:resumed': Record<string, never>
}
