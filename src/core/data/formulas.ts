/**
 * 計算式集約
 * ゲーム内の全計算ロジックをここに集約して一覧性を確保する
 */

import { HR_CONSTANTS, SALES_CONSTANTS, FINANCE_CONSTANTS } from './constants.js'
import { clamp } from '@utils/math.js'

/** 従業員の給与を計算する（万円/月） */
export function calcSalary(
  baseSalary: number,
  level: number,
  performanceBonus: number,
): number {
  return Math.round(baseSalary * (1 + (level - 1) * 0.1) * (1 + performanceBonus))
}

/** オファー承諾率を計算する */
export function calcOfferAcceptRate(
  reputation: number,
  salaryRatio: number,
): number {
  const base = HR_CONSTANTS.OFFER_ACCEPT_BASE
  const repBonus = reputation * HR_CONSTANTS.OFFER_ACCEPT_REP_BONUS
  const salaryFactor = clamp(salaryRatio, 0.5, 1.5)
  return clamp(base + repBonus + (salaryFactor - 1) * 0.3, 0.1, 0.95)
}

/** 退職確率を計算する（/日） */
export function calcQuitRate(
  motivation: number,
  stress: number,
  satisfaction: number,
): number {
  const stressFactor = stress > 70
    ? HR_CONSTANTS.QUIT_STRESS_MULTIPLIER
    : 1
  const motivationFactor = motivation < 30 ? 2.0 : 1.0
  const satFactor = satisfaction < 30 ? 1.5 : 1.0
  return HR_CONSTANTS.QUIT_BASE_RATE * stressFactor * motivationFactor * satFactor
}

/** 機能開発の必要工数を計算する（人日） */
export function calcFeatureEffort(complexity: number): number {
  return Math.round(SALES_CONSTANTS.BASE_ARPU + complexity * 15)
}

/** プロダクト品質スコアを計算する */
export function calcProductScore(
  features: number,
  bugs: number,
  techDebt: number,
  avgQuality: number,
): number {
  const featureScore = features * 5
  const bugPenalty = bugs * 3
  const debtPenalty = techDebt * 0.5
  const qualityBonus = avgQuality * 0.3
  return clamp(featureScore - bugPenalty - debtPenalty + qualityBonus, 0, 100)
}

/** リード生成数を計算する（/日） */
export function calcDailyLeads(
  salesHeadcount: number,
  marketingBudget: number,
  productScore: number,
  reputation: number,
): number {
  const salesLeads = salesHeadcount * SALES_CONSTANTS.LEAD_GEN_BASE
  const marketingLeads = marketingBudget * SALES_CONSTANTS.MARKETING_LEAD_FACTOR
  const productBonus = productScore * 0.02
  const repBonus = reputation * 0.01
  return Math.max(0, salesLeads + marketingLeads + productBonus + repBonus)
}

/** MRRを計算する */
export function calcMRR(
  activeCustomers: number,
  arpu: number,
): number {
  return Math.round(activeCustomers * arpu)
}

/** 解約率を計算する（月次） */
export function calcChurnRate(
  productScore: number,
  bugs: number,
): number {
  const base = SALES_CONSTANTS.CHURN_BASE_RATE
  const productReduction = productScore * SALES_CONSTANTS.CHURN_PRODUCT_FACTOR
  const bugIncrease = bugs * 0.005
  return clamp(base - productReduction + bugIncrease, 0.005, 0.15)
}

/** ARPUを計算する */
export function calcARPU(productScore: number): number {
  return SALES_CONSTANTS.BASE_ARPU + productScore * SALES_CONSTANTS.ARPU_PRODUCT_FACTOR
}

/** 企業価値を計算する（万円） */
export function calcValuation(
  arr: number,
  stage: string,
  growthRate: number,
): number {
  const multiples = FINANCE_CONSTANTS.VALUATION_MULTIPLES
  const baseMultiple = multiples[stage as keyof typeof multiples] ?? 10
  const growthBonus = clamp(growthRate, 0, 3) * 5
  return Math.round(arr * (baseMultiple + growthBonus))
}

/** ランウェイを計算する（月数） */
export function calcRunway(cash: number, burnRate: number): number {
  if (burnRate <= 0) return 999
  return Math.floor(cash / burnRate)
}

/** Rule of 40を計算する */
export function calcRuleOf40(
  revenueGrowthRate: number,
  profitMargin: number,
): number {
  return revenueGrowthRate * 100 + profitMargin * 100
}

/** 月次経費合計を計算する */
export function calcMonthlyExpenses(
  personnelCost: number,
  officeRent: number,
  serverCost: number,
  marketingBudget: number,
  otherCosts: number,
): number {
  return personnelCost + officeRent + serverCost + marketingBudget + otherCosts
}
