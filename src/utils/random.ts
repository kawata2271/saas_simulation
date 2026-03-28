/**
 * xoshiro256** 擬似乱数ジェネレータ
 * - 高品質な256bit状態PRNG
 * - fork()による独立ストリーム生成
 * - 正規分布、加重選択などの分布関数
 * - 状態の保存/復元によるリプレイ再現
 */

/** RNG内部状態（4つの64bit値を32bit×2で表現） */
export interface RNGState {
  readonly s0h: number
  readonly s0l: number
  readonly s1h: number
  readonly s1l: number
  readonly s2h: number
  readonly s2l: number
  readonly s3h: number
  readonly s3l: number
}

/** シード値からxoshiro256**の初期状態を生成する（SplitMix64） */
function splitmix64(seed: number): RNGState {
  let s = seed | 0
  const values: number[] = []
  for (let i = 0; i < 8; i++) {
    s = (s + 0x9e3779b9) | 0
    let z = s
    z = Math.imul(z ^ (z >>> 15), 0x85ebca6b)
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35)
    z = z ^ (z >>> 16)
    values.push(z >>> 0)
  }
  return {
    s0h: values[0], s0l: values[1],
    s1h: values[2], s1l: values[3],
    s2h: values[4], s2l: values[5],
    s3h: values[6], s3l: values[7],
  }
}

/** 文字列からハッシュ値を生成する（forkのストリームID用） */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(hash ^ str.charCodeAt(i), 0x5bd1e995)
    hash = hash ^ (hash >>> 15)
  }
  return hash >>> 0
}

/**
 * SeededRandom — xoshiro256**ベースの高品質PRNG
 */
export class SeededRandom {
  private s0h: number
  private s0l: number
  private s1h: number
  private s1l: number
  private s2h: number
  private s2l: number
  private s3h: number
  private s3l: number

  constructor(seed: number | RNGState) {
    if (typeof seed === 'number') {
      const state = splitmix64(seed)
      this.s0h = state.s0h; this.s0l = state.s0l
      this.s1h = state.s1h; this.s1l = state.s1l
      this.s2h = state.s2h; this.s2l = state.s2l
      this.s3h = state.s3h; this.s3l = state.s3l
    } else {
      this.s0h = seed.s0h; this.s0l = seed.s0l
      this.s1h = seed.s1h; this.s1l = seed.s1l
      this.s2h = seed.s2h; this.s2l = seed.s2l
      this.s3h = seed.s3h; this.s3l = seed.s3l
    }
  }

  /** [0, 1) の一様乱数を返す */
  next(): number {
    // xoshiro256** の result = rotl(s1 * 5, 7) * 9
    // 32bitに簡略化した高速版を使用
    const result = Math.imul(this.s1h, 5)
    const rotated = ((result << 7) | (result >>> 25)) >>> 0
    const out = Math.imul(rotated, 9) >>> 0

    // advance state
    const t0h = this.s1h << 17
    const t0l = this.s1l << 17

    this.s2h ^= this.s0h
    this.s2l ^= this.s0l
    this.s3h ^= this.s1h
    this.s3l ^= this.s1l
    this.s1h ^= this.s2h
    this.s1l ^= this.s2l
    this.s0h ^= this.s3h
    this.s0l ^= this.s3l

    this.s2h ^= t0h
    this.s2l ^= t0l

    // rotl(s3, 45) — 45 = 32 + 13 なので swap + rotl(13)
    const tmp3h = this.s3l
    const tmp3l = this.s3h
    this.s3h = ((tmp3h << 13) | (tmp3l >>> 19)) >>> 0
    this.s3l = ((tmp3l << 13) | (tmp3h >>> 19)) >>> 0

    return (out >>> 0) / 4294967296
  }

  /** [min, max] の整数を返す */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  /** [min, max) の浮動小数を返す */
  nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min)
  }

  /** 正規分布（Box-Muller変換） */
  normal(mean: number, stddev: number): number {
    let u: number, v: number, s: number
    do {
      u = this.next() * 2 - 1
      v = this.next() * 2 - 1
      s = u * u + v * v
    } while (s >= 1 || s === 0)
    const mul = Math.sqrt(-2 * Math.log(s) / s)
    return mean + stddev * u * mul
  }

  /** 加重選択 — weightsに比例した確率で選択する */
  weighted<T>(items: ReadonlyArray<{ value: T; weight: number }>): T {
    let totalWeight = 0
    for (const item of items) {
      totalWeight += item.weight
    }
    let roll = this.next() * totalWeight
    for (const item of items) {
      roll -= item.weight
      if (roll <= 0) return item.value
    }
    return items[items.length - 1].value
  }

  /** probability の確率で true を返す */
  chance(probability: number): boolean {
    return this.next() < probability
  }

  /** 配列からランダムに1つ選ぶ */
  pick<T>(array: readonly T[]): T {
    return array[Math.floor(this.next() * array.length)]
  }

  /** 配列をシャッフルする（非破壊、Fisher-Yates） */
  shuffle<T>(array: readonly T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }

  /** 独立ストリームを分岐する（元のRNGの状態は変化しない） */
  fork(streamId: string): SeededRandom {
    const hash = hashString(streamId)
    const state = this.getState()
    return new SeededRandom({
      s0h: state.s0h ^ hash,
      s0l: state.s0l ^ (hash >>> 16),
      s1h: state.s1h ^ (hash * 0x9e3779b9),
      s1l: state.s1l ^ (hash * 0x517cc1b7),
      s2h: state.s2h ^ hash,
      s2l: state.s2l ^ (hash >>> 8),
      s3h: state.s3h ^ (hash * 0x6c62272e),
      s3l: state.s3l ^ (hash * 0x85ebca6b),
    })
  }

  /** 現在の内部状態を取得する（セーブ/リプレイ用） */
  getState(): RNGState {
    return {
      s0h: this.s0h, s0l: this.s0l,
      s1h: this.s1h, s1l: this.s1l,
      s2h: this.s2h, s2l: this.s2l,
      s3h: this.s3h, s3l: this.s3l,
    }
  }
}
