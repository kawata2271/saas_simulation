/**
 * デバッグユーティリティ
 */

const IS_DEV = import.meta.env.DEV

/** 開発環境のみログ出力する */
export function devLog(tag: string, ...args: unknown[]): void {
  if (IS_DEV) {
    console.log(`[${tag}]`, ...args)
  }
}

/** 開発環境のみ警告出力する */
export function devWarn(tag: string, ...args: unknown[]): void {
  if (IS_DEV) {
    console.warn(`[${tag}]`, ...args)
  }
}

/** パフォーマンス計測用タイマー */
export function createTimer(label: string): { stop: () => number } {
  const start = performance.now()
  return {
    stop(): number {
      const elapsed = performance.now() - start
      if (IS_DEV) {
        console.log(`[Timer:${label}] ${elapsed.toFixed(2)}ms`)
      }
      return elapsed
    },
  }
}
