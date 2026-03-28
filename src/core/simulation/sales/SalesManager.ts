/**
 * 営業・マーケティング管理システム
 * リード生成、ファネル管理、契約、解約、MRR計算
 */

import type { SeededRandom } from '@utils/random.js'
import { SALES_CONSTANTS } from '@core/data/constants.js'
import { calcDailyLeads, calcChurnRate, calcARPU, calcMRR } from '@core/data/formulas.js'
import { clamp } from '@utils/math.js'

/** 顧客状態 */
export const CUSTOMER_STATES = {
  LEAD: 'lead',
  TRIAL: 'trial',
  ACTIVE: 'active',
  CHURNED: 'churned',
} as const satisfies Record<string, string>

export type CustomerState = (typeof CUSTOMER_STATES)[keyof typeof CUSTOMER_STATES]

/** ファネル統計 */
export interface FunnelStats {
  readonly leads: number
  readonly trials: number
  readonly activeCustomers: number
  readonly churnedThisMonth: number
  readonly newCustomersThisMonth: number
}

/**
 * SalesManager — 営業/マーケティングを管理する
 */
export class SalesManager {
  private leads = 0
  private trials = 0
  private activeCustomers = 0
  private monthlyChurned = 0
  private monthlyNew = 0
  private marketingBudget = 0
  private currentMRR = 0
  private currentARPU: number = SALES_CONSTANTS.BASE_ARPU
  private totalRevenue = 0
  private lastMonthMRR = 0

  /** MRRを取得する */
  getMRR(): number {
    return this.currentMRR
  }

  /** ARRを取得する */
  getARR(): number {
    return this.currentMRR * 12
  }

  /** アクティブ顧客数を取得する */
  getActiveCustomers(): number {
    return this.activeCustomers
  }

  /** ARPUを取得する */
  getARPU(): number {
    return this.currentARPU
  }

  /** 累計売上を取得する */
  getTotalRevenue(): number {
    return this.totalRevenue
  }

  /** ファネル統計を取得する */
  getFunnelStats(): FunnelStats {
    return {
      leads: this.leads,
      trials: this.trials,
      activeCustomers: this.activeCustomers,
      churnedThisMonth: this.monthlyChurned,
      newCustomersThisMonth: this.monthlyNew,
    }
  }

  /** マーケティング予算を設定する（万円/月） */
  setMarketingBudget(budget: number): void {
    this.marketingBudget = Math.max(0, budget)
  }

  /** マーケティング予算を取得する */
  getMarketingBudget(): number {
    return this.marketingBudget
  }

  /**
   * 日次更新: リード生成とファネル進行
   */
  updateDaily(
    salesHeadcount: number,
    productScore: number,
    reputation: number,
    rng: SeededRandom,
  ): void {
    // リード生成
    const newLeads = calcDailyLeads(
      salesHeadcount,
      this.marketingBudget,
      productScore,
      reputation,
    )
    this.leads += newLeads

    // リード → トライアル変換
    const convToTrial = SALES_CONSTANTS.LEAD_TO_TRIAL_BASE +
      productScore * SALES_CONSTANTS.PRODUCT_SCORE_CONV_FACTOR
    const leadsConverting = Math.floor(this.leads * convToTrial * 0.1)
    if (leadsConverting > 0 && rng.chance(0.3)) {
      const actual = Math.max(1, leadsConverting)
      this.leads = Math.max(0, this.leads - actual)
      this.trials += actual
    }

    // トライアル → 有料変換
    const convToPaid = SALES_CONSTANTS.TRIAL_TO_PAID_BASE +
      productScore * SALES_CONSTANTS.PRODUCT_SCORE_CONV_FACTOR
    if (this.trials > 0 && rng.chance(convToPaid)) {
      const converting = Math.max(1, Math.floor(this.trials * 0.15))
      this.trials = Math.max(0, this.trials - converting)
      this.activeCustomers += converting
      this.monthlyNew += converting
    }

    // ARPU更新
    this.currentARPU = calcARPU(productScore)

    // MRR更新
    this.currentMRR = calcMRR(this.activeCustomers, this.currentARPU)
  }

  /**
   * 月次更新: 解約処理と売上計上
   */
  updateMonthly(
    productScore: number,
    bugCount: number,
    rng: SeededRandom,
  ): { revenue: number; churned: number } {
    // 解約
    const churnRate = calcChurnRate(productScore, bugCount)
    const churned = Math.floor(this.activeCustomers * churnRate)
    this.activeCustomers = Math.max(0, this.activeCustomers - churned)
    this.monthlyChurned = churned

    // アップセル
    const upsells = Math.floor(
      this.activeCustomers * SALES_CONSTANTS.UPSELL_RATE,
    )
    if (upsells > 0 && rng.chance(0.5)) {
      this.currentARPU = clamp(
        this.currentARPU * (1 + upsells * 0.001),
        SALES_CONSTANTS.BASE_ARPU,
        SALES_CONSTANTS.BASE_ARPU * 10,
      )
    }

    // MRR再計算
    this.lastMonthMRR = this.currentMRR
    this.currentMRR = calcMRR(this.activeCustomers, this.currentARPU)

    // 月次売上
    const revenue = this.currentMRR
    this.totalRevenue += revenue
    this.monthlyNew = 0

    return { revenue, churned }
  }

  /** MRR成長率を取得する（月次） */
  getMRRGrowthRate(): number {
    if (this.lastMonthMRR === 0) return this.currentMRR > 0 ? 1 : 0
    return (this.currentMRR - this.lastMonthMRR) / this.lastMonthMRR
  }

  /** NRR (Net Revenue Retention) を計算する */
  getNRR(): number {
    if (this.lastMonthMRR === 0) return 1
    return this.currentMRR / this.lastMonthMRR
  }

  /** 状態を復元する */
  restore(data: {
    leads: number
    trials: number
    activeCustomers: number
    marketingBudget: number
    totalRevenue: number
    currentMRR: number
  }): void {
    this.leads = data.leads
    this.trials = data.trials
    this.activeCustomers = data.activeCustomers
    this.marketingBudget = data.marketingBudget
    this.totalRevenue = data.totalRevenue
    this.currentMRR = data.currentMRR
    this.lastMonthMRR = data.currentMRR
  }
}
