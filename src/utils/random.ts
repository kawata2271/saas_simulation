/**
 * シード付き擬似乱数ジェネレータ
 * ゲームの再現性を保証するためにシード値で初期化可能
 */

/**
 * Mulberry32 PRNG — シード付き32bit乱数
 */
export class SeededRandom {
  private state: number

  constructor(seed: number) {
    this.state = seed | 0
  }

  /** 0以上1未満の乱数を返す */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /** min以上max以下の整数を返す */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  /** 確率判定（0-1の確率でtrueを返す） */
  chance(probability: number): boolean {
    return this.next() < probability
  }

  /** 配列からランダムに1つ選ぶ */
  pick<T>(array: readonly T[]): T {
    return array[Math.floor(this.next() * array.length)]
  }

  /** 配列をシャッフルする（非破壊） */
  shuffle<T>(array: readonly T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }

  /** 現在のシード状態を取得する（セーブ用） */
  getState(): number {
    return this.state
  }
}
