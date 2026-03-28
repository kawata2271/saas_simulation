/**
 * メインゲームエンジン
 * 60fps固定ティックでゲームループを実行し、各サブシステムを統括する
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

/** ティックコールバック型 */
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
  private readonly tickCallbacks: Set<TickCallback> = new Set()

  constructor() {
    this.eventBus = new EventBus()
    this.scheduler = new TickScheduler(this.eventBus)
  }

  /** エンジン状態を取得 */
  getState(): EngineState {
    return this.state
  }

  /** ティックコールバックを登録する */
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

    const deltaMs = Math.min(timestamp - this.lastFrameTime, 100)
    this.lastFrameTime = timestamp

    const ticks = this.scheduler.update(deltaMs)

    if (ticks > 0) {
      for (const callback of this.tickCallbacks) {
        try {
          callback(this.scheduler.getState().tickCount, deltaMs)
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
    this.eventBus.clear()
    this.tickCallbacks.clear()
  }
}
