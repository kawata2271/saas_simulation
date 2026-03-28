/**
 * メインゲームエンジン
 * - 60fps固定ティック + requestAnimationFrame
 * - ISubsystemによるpriority順更新
 * - maxTicksPerFrameによるフレームスキップ上限
 * - サブシステム登録/解除API
 */

import { EventBus } from './EventBus.js'
import { TickScheduler } from './TickScheduler.js'
import type { GameSpeed } from '@game-types/game.js'

/** ゲームエンジンの状態 */
export const ENGINE_STATES = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
} as const satisfies Record<string, string>

export type EngineState = (typeof ENGINE_STATES)[keyof typeof ENGINE_STATES]

/**
 * サブシステムインターフェース
 * priority順に毎ティック更新される
 */
export interface ISubsystem {
  /** 一意な識別子 */
  readonly id: string
  /** 更新順序（小さい方が先に実行される） */
  readonly priority: number
  /** エンジン登録時の初期化 */
  init(engine: GameEngine): void
  /** ティックごとの更新 */
  update(tick: number): void
  /** リソース解放 */
  dispose(): void
}

/** エンジン設定 */
export interface GameEngineConfig {
  /** 1ティックの基準ms（x1速度時）、デフォルト1000 */
  readonly tickRate?: number
  /** 1フレームあたりの最大ティック数、デフォルト4 */
  readonly maxTicksPerFrame?: number
}

/** ティックコールバック型（サブシステム以外の簡易フック用） */
type TickCallback = (tickCount: number, deltaMs: number) => void

/**
 * GameEngine — ゲーム全体のライフサイクルとメインループを管理
 */
export class GameEngine {
  readonly eventBus: EventBus
  readonly scheduler: TickScheduler

  private state: EngineState = ENGINE_STATES.IDLE
  private animationFrameId: number | null = null
  private lastFrameTime = 0
  private readonly maxTicksPerFrame: number

  private readonly subsystems: ISubsystem[] = []
  private readonly tickCallbacks: Set<TickCallback> = new Set()

  constructor(config?: GameEngineConfig) {
    this.eventBus = new EventBus()
    this.scheduler = new TickScheduler(this.eventBus)
    this.maxTicksPerFrame = config?.maxTicksPerFrame ?? 4
  }

  /** エンジン状態を取得 */
  getState(): EngineState {
    return this.state
  }

  /**
   * サブシステムを登録する（priority順にソートされる）
   */
  registerSubsystem(subsystem: ISubsystem): void {
    if (this.subsystems.some((s) => s.id === subsystem.id)) {
      console.warn(`[GameEngine] Subsystem "${subsystem.id}" already registered`)
      return
    }
    this.subsystems.push(subsystem)
    this.subsystems.sort((a, b) => a.priority - b.priority)
    subsystem.init(this)
  }

  /** サブシステムを解除する */
  unregisterSubsystem(id: string): void {
    const idx = this.subsystems.findIndex((s) => s.id === id)
    if (idx >= 0) {
      this.subsystems[idx].dispose()
      this.subsystems.splice(idx, 1)
    }
  }

  /** 登録済みサブシステム一覧を取得する */
  getSubsystems(): readonly ISubsystem[] {
    return this.subsystems
  }

  /** IDでサブシステムを取得する */
  getSubsystem<T extends ISubsystem>(id: string): T | null {
    return (this.subsystems.find((s) => s.id === id) as T) ?? null
  }

  /** ティックコールバックを登録する（サブシステム以外の簡易フック） */
  onTick(callback: TickCallback): () => void {
    this.tickCallbacks.add(callback)
    return () => {
      this.tickCallbacks.delete(callback)
    }
  }

  /** ゲームを開始する */
  start(): void {
    if (this.state === ENGINE_STATES.RUNNING) return

    this.state = ENGINE_STATES.RUNNING
    this.lastFrameTime = performance.now()
    this.scheduler.resume()
    this.loop(this.lastFrameTime)
  }

  /** ゲームを一時停止する */
  pause(): void {
    this.state = ENGINE_STATES.PAUSED
    this.scheduler.pause()
  }

  /** ゲームを再開する */
  resume(): void {
    if (this.state !== ENGINE_STATES.PAUSED) return

    this.state = ENGINE_STATES.RUNNING
    this.lastFrameTime = performance.now()
    this.scheduler.resume()
    this.loop(this.lastFrameTime)
  }

  /** ゲームを停止する */
  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    this.state = ENGINE_STATES.IDLE
    this.scheduler.pause()
  }

  /** ゲーム速度を変更する */
  setSpeed(speed: GameSpeed): void {
    this.scheduler.setSpeed(speed)
  }

  /** メインループ */
  private loop = (timestamp: number): void => {
    if (this.state !== ENGINE_STATES.RUNNING) return

    const deltaMs = Math.min(timestamp - this.lastFrameTime, 200)
    this.lastFrameTime = timestamp

    const ticks = this.scheduler.update(deltaMs, this.maxTicksPerFrame)

    if (ticks > 0) {
      const currentTick = this.scheduler.getState().tickCount

      // サブシステムをpriority順に更新
      for (const subsystem of this.subsystems) {
        try {
          subsystem.update(currentTick)
        } catch (error) {
          console.error(`[GameEngine] Subsystem "${subsystem.id}" error:`, error)
        }
      }

      // ティックコールバック
      for (const callback of this.tickCallbacks) {
        try {
          callback(currentTick, deltaMs)
        } catch (error) {
          console.error('[GameEngine] Tick callback error:', error)
        }
      }
    }

    this.animationFrameId = requestAnimationFrame(this.loop)
  }

  /** リソースを解放する */
  destroy(): void {
    this.stop()
    for (const subsystem of this.subsystems) {
      try {
        subsystem.dispose()
      } catch (error) {
        console.error(`[GameEngine] Subsystem "${subsystem.id}" dispose error:`, error)
      }
    }
    this.subsystems.length = 0
    this.eventBus.clear()
    this.tickCallbacks.clear()
  }
}
