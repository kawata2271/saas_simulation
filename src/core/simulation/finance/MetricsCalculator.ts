/**
 * SaaS KPI メトリクス計算エンジン
 * MRR分解、ユニットエコノミクス、効率性指標を算出
 */

import type { SaaSMetrics, MRRMovement } from '@game-types/finance.js'
import { clamp } from '@utils/math.js'

/** メトリクス計算に必要な入力 */
export interface MetricsInput {
  /** 今月のMRR */
  readonly currentMRR: number
  /** 先月のMRR */
  readonly previousMRR: number
  /** 新規顧客からのMRR */
  readonly newMRR: number
  /** アップセルによるMRR増 */
  readonly expansionMRR: number
  /** ダウングレードによるMRR減 */
  readonly contractionMRR: number
  /** 解約によるMRR減 */
  readonly churnedMRR: number
  /** アクティブ顧客数 */
  readonly totalCustomers: number
  /** 先月の顧客数 */
  readonly previousCustomers: number
  /** 解約した顧客数（今月） */
  readonly churnedCustomers: number
  /** 月間マーケティング+営業費用 */
  readonly salesMarketingSpend: number
  /** 新規獲得顧客数（今月） */
  readonly newCustomers: number
  /** 月間総費用 */
  readonly totalMonthlyExpense: number
  /** 手持ち現金 */
  readonly cash: number
  /** 従業員数 */
  readonly headcount: number
  /** 月間人件費 */
  readonly personnelCost: number
  /** 粗利率 */
  readonly grossMargin: number
  /** 先四半期のS&M費用 */
  readonly prevQuarterSMSpend: number
  /** 今四半期のARR増分 */
  readonly quarterARRGrowth: number
}

/**
 * SaaS KPIを全指標算出する
 */
export function calculateMetrics(input: MetricsInput): SaaSMetrics {
  const mrr = input.currentMRR
  const arr = mrr * 12

  // MRR分解
  const netNewMRR = input.newMRR + input.expansionMRR
    - input.contractionMRR - input.churnedMRR

  // ユニットエコノミクス
  const arpu = input.totalCustomers > 0
    ? mrr / input.totalCustomers : 0
  const cac = input.newCustomers > 0
    ? input.salesMarketingSpend / input.newCustomers : 0
  const grossChurnRate = input.previousCustomers > 0
    ? (input.churnedCustomers / input.previousCustomers) * 100 : 0
  const monthlyChurnRate = grossChurnRate / 100
  const ltv = monthlyChurnRate > 0
    ? (arpu * (input.grossMargin / 100)) / monthlyChurnRate : arpu * 100
  const ltvCacRatio = cac > 0 ? ltv / cac : 0
  const paybackMonths = arpu > 0 ? cac / (arpu * (input.grossMargin / 100)) : 0

  // リテンション
  const nrr = input.previousMRR > 0
    ? ((input.previousMRR + input.expansionMRR - input.contractionMRR - input.churnedMRR) / input.previousMRR) * 100
    : 100
  const logoRetention = input.previousCustomers > 0
    ? ((input.previousCustomers - input.churnedCustomers) / input.previousCustomers) * 100
    : 100

  // 効率性
  const burnRate = Math.max(0, input.totalMonthlyExpense - mrr)
  const runway = burnRate > 0
    ? Math.floor(input.cash / burnRate) : 999
  const mrrGrowthRate = input.previousMRR > 0
    ? ((mrr - input.previousMRR) / input.previousMRR) * 100 * 12 // 年率換算
    : 0
  const operatingMargin = mrr > 0
    ? ((mrr - input.totalMonthlyExpense) / mrr) * 100 : -100
  const ruleOf40 = mrrGrowthRate + operatingMargin
  const magicNumber = input.prevQuarterSMSpend > 0
    ? input.quarterARRGrowth / input.prevQuarterSMSpend : 0
  const burnMultiple = netNewMRR > 0
    ? burnRate / netNewMRR : burnRate > 0 ? 999 : 0

  // 従業員
  const revenuePerEmployee = input.headcount > 0
    ? arr / input.headcount : 0
  const headcountCostRatio = mrr > 0
    ? (input.personnelCost / mrr) * 100 : 0

  // NPS（プロダクトスコアから概算 — 外部から渡す方が良いが簡易的に）
  const nps = clamp(50 + (nrr - 100) * 2, -100, 100)

  return {
    mrr, arr, newMRR: input.newMRR,
    expansionMRR: input.expansionMRR,
    contractionMRR: input.contractionMRR,
    churnedMRR: input.churnedMRR,
    netNewMRR,
    arpu: round2(arpu),
    cac: round2(cac),
    ltv: Math.round(ltv),
    ltvCacRatio: round1(ltvCacRatio),
    paybackMonths: round1(paybackMonths),
    grossChurnRate: round2(grossChurnRate),
    netRevenueRetention: round2(nrr),
    logoRetentionRate: round2(logoRetention),
    burnRate: Math.round(burnRate),
    runway,
    ruleOf40: round1(ruleOf40),
    magicNumber: round1(magicNumber),
    burnMultiple: round1(burnMultiple),
    revenuePerEmployee: Math.round(revenuePerEmployee),
    headcountCostRatio: round1(headcountCostRatio),
    totalCustomers: input.totalCustomers,
    nps: Math.round(nps),
  }
}

/**
 * MRR変動レコードを生成する
 */
export function createMRRMovement(
  month: number,
  input: MetricsInput,
): MRRMovement {
  return {
    month,
    newMRR: input.newMRR,
    expansionMRR: input.expansionMRR,
    contractionMRR: input.contractionMRR,
    churnedMRR: input.churnedMRR,
    netNewMRR: input.newMRR + input.expansionMRR - input.contractionMRR - input.churnedMRR,
    endingMRR: input.currentMRR,
  }
}

function round1(v: number): number {
  return Math.round(v * 10) / 10
}

function round2(v: number): number {
  return Math.round(v * 100) / 100
}
