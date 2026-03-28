/**
 * フォーマットユーティリティ
 */

/** 金額をフォーマットする（万円単位） */
export function formatMoney(amount: number, locale = 'ja-JP'): string {
  if (locale === 'ja-JP' || locale === 'ja') {
    if (Math.abs(amount) >= 10000) {
      return `${(amount / 10000).toFixed(1)}億円`
    }
    return `${amount.toLocaleString('ja-JP')}万円`
  }
  // 万円 → ドル換算（概算レート）
  const dollars = amount * 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: dollars >= 1_000_000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(dollars)
}

/** パーセントをフォーマットする */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/** 大きな数値を短縮表記する */
export function formatCompact(value: number): string {
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}億`
  if (value >= 10_000) return `${(value / 10_000).toFixed(1)}万`
  return value.toLocaleString()
}

/** ゲーム内日付を文字列にフォーマットする */
export function formatGameDate(
  year: number,
  month: number,
  day: number,
): string {
  return `${year}年目 ${month}月 ${day}日`
}
