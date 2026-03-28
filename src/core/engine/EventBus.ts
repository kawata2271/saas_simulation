/**
 * Pub/Subイベントバスシステム
 * ゲーム内の各システム間通信に使用する型安全なイベントバス
 */

import type { GameEventMap } from '@game-types/events.js'

type EventHandler<T> = (payload: T) => void

/**
 * 型安全なイベントバス
 * GameEventMapに定義されたイベントのみ発火/購読可能
 */
export class EventBus {
  private readonly listeners = new Map<string, Set<EventHandler<unknown>>>()

  /** イベントリスナーを登録する */
  on<K extends keyof GameEventMap>(
    event: K,
    handler: EventHandler<GameEventMap[K]>,
  ): () => void {
    const key = event as string
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    const handlers = this.listeners.get(key)!
    handlers.add(handler as EventHandler<unknown>)

    return () => {
      handlers.delete(handler as EventHandler<unknown>)
      if (handlers.size === 0) {
        this.listeners.delete(key)
      }
    }
  }

  /** イベントを発火する */
  emit<K extends keyof GameEventMap>(
    event: K,
    payload: GameEventMap[K],
  ): void {
    const key = event as string
    const handlers = this.listeners.get(key)
    if (!handlers) return

    for (const handler of handlers) {
      try {
        handler(payload)
      } catch (error) {
        console.error(`[EventBus] Error in handler for "${key}":`, error)
      }
    }
  }

  /** 特定イベントの全リスナーを解除する */
  off<K extends keyof GameEventMap>(event: K): void {
    this.listeners.delete(event as string)
  }

  /** 全リスナーを解除する */
  clear(): void {
    this.listeners.clear()
  }

  /** デバッグ用: 登録中のリスナー数を返す */
  getListenerCount(event?: keyof GameEventMap): number {
    if (event) {
      return this.listeners.get(event as string)?.size ?? 0
    }
    let total = 0
    for (const handlers of this.listeners.values()) {
      total += handlers.size
    }
    return total
  }
}
