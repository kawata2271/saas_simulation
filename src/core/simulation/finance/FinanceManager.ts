/**
 * 財務エンジン
 * 日次経費処理、月次PL集計、四半期決算、SaaS KPI算出
 */

import type { ProfitAndLoss, BalanceSheet, CashFlow, SaaSMetrics, FinancialState } from '@game-types/finance.js'
import { FINANCE_CONSTANTS } from '@core/data/constants.js'
import { calcValuation, calcRunway, calcRuleOf40 } from '@core/data/formulas.js'

/**
 * FinanceManager — 財務状態の管理と計算
 */
export class FinanceManager {
  private cash: number
  private totalFunding = 0
  private monthlyRevenue = 0
  private monthlyPersonnelCost = 0
  private monthlyOfficeCost = 0
  private monthlyServerCost = 0
  private monthlyMarketingCost = 0
  private monthlyOtherCost = 0
  private retainedEarnings = 0
  private capital: number
  private lastMonthRevenue = 0
  private quarterRevenues: number[] = []

  constructor(initialCash: number) {
    this.cash = initialCash
    this.capital = initialCash
  }

  /** 現在の手持ち資金を取得する */
  getCash(): number {
    return this.cash
  }

  /** 月次コストを設定する */
  setMonthlyCosts(params: {
    personnelCost: number
    officeCost: number
    serverCost: number
    marketingCost: number
    otherCost?: number
  }): void {
    this.monthlyPersonnelCost = params.personnelCost
    this.monthlyOfficeCost = params.officeCost
    this.monthlyServerCost = params.serverCost
    this.monthlyMarketingCost = params.marketingCost
    this.monthlyOtherCost = params.otherCost ?? 0
  }

  /** 日次支出を処理する（1営業日分のキャッシュ減少） */
  processDailyExpense(): number {
    const dailyCost = this.getMonthlyTotalCost() / 21
    this.cash -= dailyCost
    return dailyCost
  }

  /** 月次売上を計上する */
  recordMonthlyRevenue(revenue: number): void {
    this.lastMonthRevenue = this.monthlyRevenue
    this.monthlyRevenue = revenue
    this.cash += revenue
    this.quarterRevenues.push(revenue)
  }

  /** 資金調達を記録する */
  recordFunding(amount: number): void {
    this.cash += amount
    this.totalFunding += amount
    this.capital += amount
  }

  /** 月次費用合計を取得する */
  getMonthlyTotalCost(): number {
    return (
      this.monthlyPersonnelCost +
      this.monthlyOfficeCost +
      this.monthlyServerCost +
      this.monthlyMarketingCost +
      this.monthlyOtherCost
    )
  }

  /** PLを生成する（月次） */
  generatePL(): ProfitAndLoss {
    const revenue = this.monthlyRevenue
    const cogs = this.monthlyServerCost
    const grossProfit = revenue - cogs
    const personnelCost = this.monthlyPersonnelCost
    const salesCost = this.monthlyMarketingCost
    const sgaCost = this.monthlyOfficeCost + this.monthlyOtherCost
    const rdCost = 0
    const operatingProfit = grossProfit - personnelCost - salesCost - sgaCost - rdCost
    const nonOperatingIncome = 0
    const ordinaryProfit = operatingProfit + nonOperatingIncome
    const profitBeforeTax = ordinaryProfit
    const tax = profitBeforeTax > 0
      ? Math.round(profitBeforeTax * FINANCE_CONSTANTS.TAX_RATE)
      : 0
    const netProfit = profitBeforeTax - tax

    return {
      mrr: revenue,
      arr: revenue * 12,
      revenue,
      cogs,
      grossProfit,
      personnelCost,
      salesCost,
      sgaCost,
      rdCost,
      operatingProfit,
      nonOperatingIncome,
      ordinaryProfit,
      profitBeforeTax,
      tax,
      netProfit,
    }
  }

  /** BSを生成する */
  generateBS(): BalanceSheet {
    const totalAssets = this.cash
    const totalLiabilities = 0
    const totalEquity = this.capital + this.retainedEarnings

    return {
      cash: this.cash,
      accountsReceivable: 0,
      otherCurrentAssets: 0,
      fixedAssets: 0,
      totalAssets,
      accountsPayable: 0,
      shortTermDebt: 0,
      longTermDebt: 0,
      totalLiabilities,
      capital: this.capital,
      retainedEarnings: this.retainedEarnings,
      totalEquity,
    }
  }

  /** CFを生成する（月次） */
  generateCF(): CashFlow {
    const pl = this.generatePL()
    const operating = pl.netProfit
    const investing = 0
    const financing = 0
    return {
      operating,
      investing,
      financing,
      total: operating + investing + financing,
      endingCash: this.cash,
    }
  }

  /** SaaS KPIを算出する */
  generateMetrics(
    mrr: number,
    activeCustomers: number,
    churnRate: number,
    nrr: number,
    cac?: number,
  ): SaaSMetrics {
    const arr = mrr * 12
    const arpu = activeCustomers > 0 ? mrr / activeCustomers : 0
    const ltv = churnRate > 0 ? arpu / churnRate : arpu * 100
    const actualCac = cac ?? (this.monthlyMarketingCost > 0
      ? this.monthlyMarketingCost / Math.max(1, activeCustomers * 0.1)
      : 0)
    const ltvCacRatio = actualCac > 0 ? ltv / actualCac : 0
    const burnRate = Math.max(0, this.getMonthlyTotalCost() - mrr)
    const runway = calcRunway(this.cash, burnRate)
    const growthRate = this.lastMonthRevenue > 0
      ? (mrr - this.lastMonthRevenue) / this.lastMonthRevenue
      : 0
    const profitMargin = mrr > 0
      ? (mrr - this.getMonthlyTotalCost()) / mrr
      : -1
    const ruleOf40 = calcRuleOf40(growthRate, profitMargin)

    return {
      mrr,
      arr,
      churnRate,
      ltv,
      cac: actualCac,
      ltvCacRatio,
      nrr,
      ruleOf40,
      activeCustomers,
      arpu,
      burnRate,
      runway,
    }
  }

  /** 四半期決算を実行する */
  closeQuarter(stage: string, mrrGrowthRate: number): FinancialState {
    const pl = this.generatePL()
    const bs = this.generateBS()
    const cf = this.generateCF()

    this.retainedEarnings += pl.netProfit
    this.quarterRevenues = []

    const arr = this.monthlyRevenue * 12
    const valuation = calcValuation(arr, stage, mrrGrowthRate)

    const metrics = this.generateMetrics(
      this.monthlyRevenue,
      0,
      0.03,
      1,
    )

    return {
      pl,
      bs,
      cf,
      metrics,
      valuation,
      totalFunding: this.totalFunding,
    }
  }

  /** 破産判定 */
  isBankrupt(): boolean {
    return this.cash < FINANCE_CONSTANTS.BANKRUPTCY_THRESHOLD
  }

  /** ランウェイ警告判定 */
  isRunwayWarning(): boolean {
    const burnRate = Math.max(0, this.getMonthlyTotalCost() - this.monthlyRevenue)
    if (burnRate <= 0) return false
    const runway = calcRunway(this.cash, burnRate)
    return runway < FINANCE_CONSTANTS.RUNWAY_WARNING_MONTHS
  }

  /** 状態を復元する */
  restore(data: {
    cash: number
    totalFunding: number
    capital: number
    retainedEarnings: number
    monthlyRevenue: number
  }): void {
    this.cash = data.cash
    this.totalFunding = data.totalFunding
    this.capital = data.capital
    this.retainedEarnings = data.retainedEarnings
    this.monthlyRevenue = data.monthlyRevenue
    this.lastMonthRevenue = data.monthlyRevenue
  }
}
