/**
 * バリュエーションエンジン
 * ステージ別Revenue Multiple + 修正係数による企業価値算出
 */

import type { ValuationResult, ValuationFactor, FundingType } from '@game-types/finance.js'
import { clamp } from '@utils/math.js'

/** ステージ別ベース倍率（ARR倍率） */
const BASE_MULTIPLES: Record<string, { low: number; mid: number; high: number }> = {
  bootstrap:  { low: 5,  mid: 8,  high: 12 },
  angel:      { low: 8,  mid: 15, high: 25 },
  seed:       { low: 15, mid: 25, high: 40 },
  series_a:   { low: 12, mid: 20, high: 30 },
  series_b:   { low: 8,  mid: 15, high: 25 },
  series_c:   { low: 6,  mid: 12, high: 20 },
  series_d:   { low: 5,  mid: 10, high: 15 },
  pre_ipo:    { low: 8,  mid: 12, high: 15 },
  ipo:        { low: 6,  mid: 10, high: 14 },
  debt:       { low: 3,  mid: 5,  high: 8 },
}

/** Pre-Seed/Seed固定バリュエーション範囲（万円） */
const EARLY_STAGE_FIXED: Record<string, { low: number; high: number }> = {
  bootstrap: { low: 100, high: 500 },
  angel:     { low: 300, high: 3000 },
  seed:      { low: 1000, high: 10000 },
}

/** バリュエーション修正パラメータ */
export interface ValuationInputs {
  readonly stage: FundingType
  readonly arr: number
  readonly nrr: number
  readonly grossMargin: number
  readonly ruleOf40: number
  readonly mrrGrowthRate: number
  readonly marketGrowthRate: number
  readonly competitorCount: number
  readonly macroEconomyPhase: 'boom' | 'stable' | 'recession'
  readonly saasMarketSentiment: 'hot' | 'normal' | 'cold'
}

/**
 * 企業価値を算出する
 */
export function calculateValuation(inputs: ValuationInputs): ValuationResult {
  const { stage, arr } = inputs
  const multiples = BASE_MULTIPLES[stage] ?? BASE_MULTIPLES['seed']
  const factors: ValuationFactor[] = []
  let adjustedMultiple = multiples.mid

  // アーリーステージでARRが極小の場合は固定バリュエーション
  const fixed = EARLY_STAGE_FIXED[stage]
  if (fixed && arr < 120) {
    const estimated = Math.round((fixed.low + fixed.high) / 2)
    return {
      stage,
      baseMultiple: 0,
      adjustedMultiple: 0,
      factors: [{ name: '初期段階固定評価', multiplier: 1, reason: 'ARR不足のため固定レンジ' }],
      estimatedValuation: estimated,
      range: { low: fixed.low, high: fixed.high },
    }
  }

  // NRR修正
  if (inputs.nrr > 1.3) {
    adjustedMultiple *= 1.3
    factors.push({ name: 'NRR > 130%', multiplier: 1.3, reason: '極めて高い収益維持率' })
  } else if (inputs.nrr > 1.2) {
    adjustedMultiple *= 1.15
    factors.push({ name: 'NRR > 120%', multiplier: 1.15, reason: '高い収益維持率' })
  } else if (inputs.nrr < 0.9) {
    adjustedMultiple *= 0.75
    factors.push({ name: 'NRR < 90%', multiplier: 0.75, reason: '低い収益維持率' })
  }

  // 粗利率修正
  if (inputs.grossMargin > 80) {
    adjustedMultiple *= 1.2
    factors.push({ name: '粗利率 > 80%', multiplier: 1.2, reason: '優れた収益構造' })
  } else if (inputs.grossMargin < 50) {
    adjustedMultiple *= 0.8
    factors.push({ name: '粗利率 < 50%', multiplier: 0.8, reason: '低い粗利率' })
  }

  // Rule of 40修正
  if (inputs.ruleOf40 > 60) {
    adjustedMultiple *= 1.25
    factors.push({ name: 'Rule of 40 > 60', multiplier: 1.25, reason: '卓越した成長効率' })
  } else if (inputs.ruleOf40 > 40) {
    adjustedMultiple *= 1.1
    factors.push({ name: 'Rule of 40達成', multiplier: 1.1, reason: '健全な成長効率' })
  } else if (inputs.ruleOf40 < 20) {
    adjustedMultiple *= 0.85
    factors.push({ name: 'Rule of 40未達', multiplier: 0.85, reason: '成長効率に課題' })
  }

  // 市場成長率修正
  if (inputs.marketGrowthRate > 0.3) {
    adjustedMultiple *= 1.15
    factors.push({ name: '高成長市場', multiplier: 1.15, reason: '市場成長率 > 30%' })
  }

  // 競合修正
  if (inputs.competitorCount <= 2) {
    adjustedMultiple *= 1.1
    factors.push({ name: '競合少', multiplier: 1.1, reason: '市場独占に近い' })
  } else if (inputs.competitorCount >= 8) {
    adjustedMultiple *= 0.85
    factors.push({ name: '競合過多', multiplier: 0.85, reason: 'レッドオーシャン' })
  }

  // マクロ経済修正
  if (inputs.macroEconomyPhase === 'recession') {
    adjustedMultiple *= 0.7
    factors.push({ name: 'マクロ不況', multiplier: 0.7, reason: '景気後退局面' })
  } else if (inputs.macroEconomyPhase === 'boom') {
    adjustedMultiple *= 1.15
    factors.push({ name: '景気拡大', multiplier: 1.15, reason: '好況' })
  }

  // SaaS市場センチメント修正
  if (inputs.saasMarketSentiment === 'cold') {
    adjustedMultiple *= 0.6
    factors.push({ name: 'SaaS冷え込み', multiplier: 0.6, reason: 'SaaS投資市場の冷却' })
  } else if (inputs.saasMarketSentiment === 'hot') {
    adjustedMultiple *= 1.2
    factors.push({ name: 'SaaS好調', multiplier: 1.2, reason: 'SaaS投資が活発' })
  }

  adjustedMultiple = clamp(adjustedMultiple, multiples.low * 0.5, multiples.high * 1.5)

  const estimated = Math.round(arr * adjustedMultiple)
  const rangeFactor = 0.3
  const low = Math.round(estimated * (1 - rangeFactor))
  const high = Math.round(estimated * (1 + rangeFactor))

  return {
    stage,
    baseMultiple: multiples.mid,
    adjustedMultiple: Math.round(adjustedMultiple * 10) / 10,
    factors,
    estimatedValuation: estimated,
    range: { low, high },
  }
}
