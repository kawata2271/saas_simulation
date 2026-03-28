/**
 * 優先度付きPub/Subイベントバス
 * - 型安全（GameEventMapによる型推論）
 * - 優先度付きリスナー（小さい値ほど先に実行）
 * - イベントキュー（同一ティック内の発火順序保証）
 * - デバッグログ（開発モード時）
 * - auto-unsubscribe用のdispose関数返却
 */

import type { GameEventMap } from '@game-types/events.js'

/** リスナーオプション */
interface ListenerOptions {
  /** 実行優先度（小さいほど先、デフォルト100） */
  readonly priority?: number
  /** trueの場合、1回だけ実行して自動解除 */
  readonly once?: boolean
}

/** 内部リスナーエントリ */
interface ListenerEntry<T> {
  handler: (payload: T) => void
  priority: number
  once: boolean
  id: number
}

/** キューに積まれたイベント */
interface QueuedEvent {
  event: string
  payload: unknown
}

const IS_DEV = typeof import.meta !== 'undefined' && import.meta.env?.DEV

/**
 * EventBus — 型安全・優先度付き・キュー付きイベントバス
 */
export class EventBus {
  private readonly listeners = new Map<string, ListenerEntry<unknown>[]>()
  private readonly queue: QueuedEvent[] = []
  private flushing = false
  private nextId = 0
  private debugEnabled = IS_DEV

  /** デバッグログの有効/無効を切り替える */
  setDebug(enabled: boolean): void {
    this.debugEnabled = enabled
  }

  /**
   * イベントリスナーを登録する
   * @returns unsubscribe関数
   */
  on<K extends keyof GameEventMap>(
    event: K,
    handler: (payload: GameEventMap[K]) => void,
    options?: ListenerOptions,
  ): () => void {
    const key = event as string
    if (!this.listeners.has(key)) {
      this.listeners.set(key, [])
    }

    const entry: ListenerEntry<unknown> = {
      handler: handler as (payload: unknown) => void,
      priority: options?.priority ?? 100,
      once: options?.once ?? false,
      id: this.nextId++,
    }

    const entries = this.listeners.get(key)!
    entries.push(entry)
    // 優先度順にソート（安定ソート:同一優先度は登録順）
    entries.sort((a, b) => a.priority - b.priority || a.id - b.id)

    return () => {
      this.removeEntry(key, entry.id)
    }
  }

  /**
   * 1回だけ実行するリスナーを登録する
   */
  once<K extends keyof GameEventMap>(
    event: K,
    handler: (payload: GameEventMap[K]) => void,
    priority?: number,
  ): () => void {
    return this.on(event, handler, { once: true, priority })
  }

  /**
   * イベントをキューに積む（同一ティック内の順序保証）
   * flush中でなければ即座にflushする
   */
  emit<K extends keyof GameEventMap>(
    event: K,
    payload: GameEventMap[K],
  ): void {
    this.queue.push({ event: event as string, payload })

    if (!this.flushing) {
      this.flush()
    }
  }

  /**
   * キュー内のイベントを順番に処理する
   * イベントハンドラ内からemitされた場合もキューに追加��れ順序保証される
   */
  private flush(): void {
    this.flushing = true

    while (this.queue.length > 0) {
      const item = this.queue.shift()!
      this.dispatch(item.event, item.payload)
    }

    this.flushing = false
  }

  /** 単一イベントをディスパッチする */
  private dispatch(event: string, payload: unknown): void {
    const entries = this.listeners.get(event)
    if (!entries || entries.length === 0) return

    if (this.debugEnabled && event !== 'tick') {
      console.log(`[EventBus] ${event}`, payload)
    }

    const onceIds: number[] = []

    for (const entry of entries) {
      try {
        entry.handler(payload)
      } catch (error) {
        console.error(`[EventBus] Error in handler for "${event}":`, error)
      }
      if (entry.once) {
        onceIds.push(entry.id)
      }
    }

    // once リスナーを除去
    if (onceIds.length > 0) {
      const remaining = entries.filter((e) => !onceIds.includes(e.id))
      if (remaining.length > 0) {
        this.listeners.set(event, remaining)
      } else {
        this.listeners.delete(event)
      }
    }
  }

  /** 特定IDのリスナーを除去する */
  private removeEntry(event: string, id: number): void {
    const entries = this.listeners.get(event)
    if (!entries) return
    const filtered = entries.filter((e) => e.id !== id)
    if (filtered.length > 0) {
      this.listeners.set(event, filtered)
    } else {
      this.listeners.delete(event)
    }
  }

  /** 特定イベントの全リスナーを解除する */
  off<K extends keyof GameEventMap>(event: K): void {
    this.listeners.delete(event as string)
  }

  /** 全リスナーを解除しキューをクリアする */
  clear(): void {
    this.listeners.clear()
    this.queue.length = 0
    this.flushing = false
  }

  /** デバッグ用: 登録中のリスナー数を返す */
  getListenerCount(event?: keyof GameEventMap): number {
    if (event) {
      return this.listeners.get(event as string)?.length ?? 0
    }
    let total = 0
    for (const entries of this.listeners.values()) {
      total += entries.length
    }
    return total
  }

  /** デバッグ用: 登録中のイベント一覧を返す */
  getRegisteredEvents(): string[] {
    return [...this.listeners.keys()]
  }
}
