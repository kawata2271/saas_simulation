/**
 * 数学ユーティリティ
 */

/** 値をmin-max範囲にクランプする */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** 線形補間 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1)
}

/** 百分率を計算する（0除算セーフ） */
export function percentage(value: number, total: number): number {
  if (total === 0) return 0
  return (value / total) * 100
}

/** 整数で四捨五入する（万円単位の計算用） */
export function roundToInt(value: number): number {
  return Math.round(value) | 0
}

/** 複利計算 */
export function compoundGrowth(
  principal: number,
  rate: number,
  periods: number,
): number {
  return principal * Math.pow(1 + rate, periods)
}

/** 移動平均を計算する */
export function movingAverage(
  values: readonly number[],
  window: number,
): number {
  if (values.length === 0) return 0
  const slice = values.slice(-window)
  return slice.reduce((sum, v) => sum + v, 0) / slice.length
}
