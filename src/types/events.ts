/**
 * イベントシステム型定義
 */

/** イベントカテゴリ */
export const EVENT_CATEGORIES = {
  MACRO: 'macro',
  INDUSTRY: 'industry',
  COMPANY: 'company',
  HR: 'hr',
  PRODUCT: 'product',
  SALES: 'sales',
  FUNDING: 'funding',
  CRISIS: 'crisis',
  MILESTONE: 'milestone',
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
  /** 最速発火ティック */
  readonly earliestTick: number
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
  // Tick / Calendar
  'tick': { day: number }
  'month-end': { month: number; year: number }
  'quarter-end': { quarter: number; year: number }
  'year-end': { year: number }
  'holiday': { name: string; day: number }

  // Company
  'company:founded': { companyId: string }
  'company:stage-changed': { from: string; to: string }
  'company:bankrupt': { debt: number }
  'company:office-upgraded': { level: number }

  // HR
  'employee:hired': { employeeId: string; department: string; salary: number }
  'employee:quit': { employeeId: string; reason: string }
  'employee:fired': { employeeId: string }
  'employee:promoted': { employeeId: string; fromGrade: string; toGrade: string }
  'employee:burnout': { employeeId: string; severity: number }

  // Product
  'product:released': { version: string; quality: number }
  'product:bug-found': { featureId: string; severity: number }
  'product:bug-fixed': { bugId: string }
  'product:tech-debt-increased': { amount: number; total: number }

  // Finance
  'finance:revenue-recorded': { amount: number; source: string }
  'finance:expense-recorded': { amount: number; category: string }
  'funding:closed': { roundId: string; amount: number; valuation: number }
  'finance:cash-critical': { cash: number; runway: number }

  // Sales
  'sales:deal-won': { customerId: string; mrr: number }
  'sales:churn': { customerId: string; mrr: number; reason: string }
  'sales:mrr-changed': { oldMrr: number; newMrr: number }

  // Market
  'market:trend-changed': { trend: string; impact: number }
  'market:economy-shift': { phase: string; severity: number }

  // Events
  'event:fired': { eventId: string }
  'event:resolved': { eventId: string; choiceId: string }

  // Game
  'game:saved': { slotIndex: number; timestamp: number }
  'game:loaded': { slotIndex: number }
  'game:speed-changed': { speed: number }
  'game:paused': Record<string, never>
  'game:resumed': Record<string, never>

  // Notifications
  'notification:info': { title: string; message: string }
  'notification:warning': { title: string; message: string }
  'notification:critical': { title: string; message: string; requiresAction: boolean }
}
