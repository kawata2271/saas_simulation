/**
 * ゲームコア型定義
 * ゲーム全体の状態、時間、速度に関する型
 */

/** ゲーム速度設定 */
export const GAME_SPEEDS = {
  PAUSED: 0,
  NORMAL: 1,
  FAST: 2,
  FASTER: 4,
  FASTEST: 8,
} as const satisfies Record<string, number>

export type GameSpeed = (typeof GAME_SPEEDS)[keyof typeof GAME_SPEEDS]

/** ゲームフェーズ */
export const GAME_PHASES = {
  TITLE: 'title',
  SETUP: 'setup',
  PLAYING: 'playing',
  PAUSED: 'paused',
  EVENT: 'event',
  GAME_OVER: 'game_over',
  EXIT: 'exit',
} as const satisfies Record<string, string>

export type GamePhase = (typeof GAME_PHASES)[keyof typeof GAME_PHASES]

/** ゲーム内日付 */
export interface GameDate {
  readonly year: number
  readonly month: number
  readonly day: number
  readonly quarter: number
  readonly weekday: number
  readonly totalDays: number
}

/** ゲーム内時間状態 */
export interface GameTimeState {
  readonly currentDate: GameDate
  readonly speed: GameSpeed
  readonly tickCount: number
  readonly isPaused: boolean
}

/** セーブデータメタ情報 */
export interface SaveMeta {
  readonly id: string
  readonly slotIndex: number
  readonly companyName: string
  readonly date: GameDate
  readonly savedAt: number
  readonly playTimeMs: number
  readonly version: string
}

/** ゲーム全体のセーブデータ */
export interface SaveData {
  readonly meta: SaveMeta
  readonly gameTime: GameTimeState
  readonly companyState: unknown
  readonly marketState: unknown
  readonly eventState: unknown
  readonly seed: number
}

/** ゲーム設定 */
export interface GameSettings {
  readonly locale: string
  readonly masterVolume: number
  readonly bgmVolume: number
  readonly seVolume: number
  readonly autoSaveEnabled: boolean
  readonly autoSaveIntervalDays: number
  readonly showTutorial: boolean
}

/** ゲームバランス定数 */
export const GAME_CONSTANTS = {
  /** 1期あたりの営業日数 */
  BUSINESS_DAYS_PER_YEAR: 250,
  /** 1四半期あたりの営業日数 */
  BUSINESS_DAYS_PER_QUARTER: 63,
  /** 1ヶ月あたりの営業日数（概算） */
  BUSINESS_DAYS_PER_MONTH: 21,
  /** ティックレート（fps） */
  TICK_RATE: 60,
  /** 最大セーブスロット数 */
  MAX_SAVE_SLOTS: 10,
  /** セーブデータバージョン */
  SAVE_VERSION: '0.1.0',
  /** 自動セーブ間隔（営業日） */
  AUTO_SAVE_INTERVAL: 30,
} as const
