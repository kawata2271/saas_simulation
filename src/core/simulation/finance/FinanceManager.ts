/**
 * 財務エンジン — 三表連動会計システム
 * - PL/BS/CF連動
 * - 前受収益按分、減価償却
 * - 月次/四半期/年次決算フロー
 * - キャッシュアラート
 */

import type {
  ProfitAndLoss, BalanceSheet, CashFlow,
  SaaSMetrics, FinancialState, ValuationResult,
  FundingRound, MRRMovement,
} from '@game-types/finance.js'
import { FINANCE_CONSTANTS } from '@core/data/constants.js'
import { calculateMetrics, createMRRMovement } from './MetricsCalculator.js'
import type { MetricsInput } from './MetricsCalculator.js'
import { calculateValuation } from './ValuationEngine.js'
import type { ValuationInputs } from './ValuationEngine.js'

/** 月次トランザクション */
export interface MonthlyTransaction {
  subscriptionRevenue: number
  professionalServices: number
  hostingCost: number
  supportCost: number
  personnelCost: number
  rdCost: number
  salesMarketingCost: number
  gaCost: number
  officeCost: number
  otherCost: number
  capex: number
}

/**
 * FinanceManager — 三表連動の財務管理
 */
export class FinanceManager {
  // BS累積値
  private cash: number
  private accountsReceivable = 0
  private prepaidExpenses = 0
  private fixedAssets = 0
  private intangibleAssets = 0
  private accountsPayable = 0
  private deferredRevenue = 0
  private shortTermDebt = 0
  private longTermDebt = 0
  private commonStock: number
  private additionalPaidIn = 0
  private retainedEarnings = 0

  // CF追跡用（前期比較）
  private prevAR = 0
  private prevAP = 0
  private prevDeferred = 0

  // 月次蓄積
  private monthlyTx: MonthlyTransaction = this.emptyTransaction()
  private dailyExpenseAccumulator = 0

  // 履歴
  private readonly fundingHistory: FundingRound[] = []
  private totalFunding = 0
  private totalDepreciation = 0
  private lastPL: ProfitAndLoss | null = null
  private lastMetrics: SaaSMetrics | null = null
  private lastValuation: ValuationResult | null = null
  private readonly mrrHistory: MRRMovement[] = []

  // 前月MRR追跡
  private prevMRR = 0
  private prevCustomerCount = 0
  private prevQuarterSMSpend = 0
  private quarterARRGrowth = 0
  private monthCounter = 0

  constructor(initialCash: number) {
    this.cash = initialCash
    this.commonStock = initialCash
  }

  /** 現在の手持ち資金 */
  getCash(): number { return this.cash }

  /** 最新PL */
  getLastPL(): ProfitAndLoss | null { return this.lastPL }

  /** 最新メトリクス */
  getLastMetrics(): SaaSMetrics | null { return this.lastMetrics }

  /** 最新バリュエーション */
  getLastValuation(): ValuationResult | null { return this.lastValuation }

  /** MRR履歴 */
  getMRRHistory(): readonly MRRMovement[] { return this.mrrHistory }

  /** 資金調達履歴 */
  getFundingHistory(): readonly FundingRound[] { return this.fundingHistory }

  // ─── 日次処理 ───

  /** 日次経費を蓄積する */
  recordDailyExpense(dailyCost: number): void {
    this.dailyExpenseAccumulator += dailyCost
    this.cash -= dailyCost
  }

  /** 月次コストを設定する */
  setMonthlyTransaction(tx: Partial<MonthlyTransaction>): void {
    Object.assign(this.monthlyTx, tx)
  }

  // ─── 月次決算 ───

  /**
   * 月次決算を実行する
   */
  closeMonth(params: {
    mrr: number
    newMRR: number
    expansionMRR: number
    contractionMRR: number
    churnedMRR: number
    activeCustomers: number
    churnedCustomers: number
    newCustomers: number
    headcount: number
    stage: string
  }): { pl: ProfitAndLoss; metrics: SaaSMetrics } {
    this.monthCounter++
    const tx = this.monthlyTx

    // 売上認識
    tx.subscriptionRevenue = params.mrr
    const totalRevenue = tx.subscriptionRevenue + tx.professionalServices
    this.cash += totalRevenue

    // 売掛金の一部は翌月入金（10%）
    const newAR = Math.round(totalRevenue * 0.1)
    this.cash -= newAR
    this.accountsReceivable += newAR
    // 前月分回収
    const arCollected = Math.round(this.accountsReceivable * 0.8)
    this.cash += arCollected
    this.accountsReceivable -= arCollected

    // 前受収益（年契約の場合）— 簡略化:MRRの5%を前受扱い
    const deferredDelta = Math.round(params.mrr * 0.05)
    this.deferredRevenue += deferredDelta
    // 過去の前受収益の収益化
    const recognized = Math.round(this.deferredRevenue * 0.15)
    this.deferredRevenue -= recognized

    // PL生成
    const pl = this.generatePL(tx, totalRevenue)
    this.lastPL = pl

    // BS更新
    this.retainedEarnings += pl.netIncome

    // 減価償却
    const depreciation = Math.round(this.fixedAssets * 0.02)
    this.fixedAssets = Math.max(0, this.fixedAssets - depreciation)
    this.totalDepreciation += depreciation

    // メトリクス
    const metricsInput: MetricsInput = {
      currentMRR: params.mrr,
      previousMRR: this.prevMRR,
      newMRR: params.newMRR,
      expansionMRR: params.expansionMRR,
      contractionMRR: params.contractionMRR,
      churnedMRR: params.churnedMRR,
      totalCustomers: params.activeCustomers,
      previousCustomers: this.prevCustomerCount,
      churnedCustomers: params.churnedCustomers,
      salesMarketingSpend: tx.salesMarketingCost,
      newCustomers: params.newCustomers,
      totalMonthlyExpense: pl.totalCOGS + pl.totalOpex,
      cash: this.cash,
      headcount: params.headcount,
      personnelCost: tx.personnelCost,
      grossMargin: pl.grossMargin,
      prevQuarterSMSpend: this.prevQuarterSMSpend,
      quarterARRGrowth: this.quarterARRGrowth,
    }
    this.lastMetrics = calculateMetrics(metricsInput)

    // MRR履歴
    this.mrrHistory.push(createMRRMovement(this.monthCounter, metricsInput))
    if (this.mrrHistory.length > 60) this.mrrHistory.shift()

    // 前月値更新
    this.prevMRR = params.mrr
    this.prevCustomerCount = params.activeCustomers

    // 月次TX リセット
    this.monthlyTx = this.emptyTransaction()
    this.dailyExpenseAccumulator = 0

    return { pl, metrics: this.lastMetrics }
  }

  // ─── 四半期決算 ───

  closeQuarter(stage: string): FinancialState {
    const pl = this.lastPL ?? this.generatePL(this.monthlyTx, 0)
    const bs = this.generateBS()
    const cf = this.generateCF()
    const metrics = this.lastMetrics ?? this.emptyMetrics()

    // バリュエーション
    const valInputs: ValuationInputs = {
      stage: stage as ValuationInputs['stage'],
      arr: metrics.arr,
      nrr: metrics.netRevenueRetention / 100,
      grossMargin: pl.grossMargin,
      ruleOf40: metrics.ruleOf40,
      mrrGrowthRate: this.prevMRR > 0
        ? (metrics.mrr - this.prevMRR) / this.prevMRR : 0,
      marketGrowthRate: 0.15,
      competitorCount: 4,
      macroEconomyPhase: 'stable',
      saasMarketSentiment: 'normal',
    }
    this.lastValuation = calculateValuation(valInputs)

    // 四半期S&M集計
    this.prevQuarterSMSpend = pl.salesMarketingExpense * 3
    this.quarterARRGrowth = metrics.netNewMRR * 12

    // CF追跡リセット
    this.prevAR = this.accountsReceivable
    this.prevAP = this.accountsPayable
    this.prevDeferred = this.deferredRevenue

    return {
      pl, bs, cf, metrics,
      valuation: this.lastValuation,
      totalFunding: this.totalFunding,
      fundingHistory: [...this.fundingHistory],
    }
  }

  // ─── 資金調達 ───

  recordFunding(round: FundingRound): void {
    this.cash += round.amount
    this.additionalPaidIn += round.amount
    this.totalFunding += round.amount
    this.fundingHistory.push(round)
  }

  // ─── 設備投資 ───

  recordCapex(amount: number): void {
    this.cash -= amount
    this.fixedAssets += amount
  }

  // ─── 三表生成 ───

  private generatePL(tx: MonthlyTransaction, totalRevenue: number): ProfitAndLoss {
    const subscriptionRevenue = tx.subscriptionRevenue
    const professionalServices = tx.professionalServices

    const hostingCost = tx.hostingCost
    const supportCost = tx.supportCost
    const totalCOGS = hostingCost + supportCost
    const grossProfit = totalRevenue - totalCOGS
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

    const rdExpense = tx.personnelCost * 0.5 + tx.rdCost
    const salesMarketingExpense = tx.salesMarketingCost
    const gaExpense = tx.officeCost + tx.otherCost + tx.personnelCost * 0.15
    const totalOpex = rdExpense + salesMarketingExpense + gaExpense + tx.personnelCost * 0.35
    const operatingIncome = grossProfit - totalOpex
    const operatingMargin = totalRevenue > 0 ? (operatingIncome / totalRevenue) * 100 : 0

    const interestExpense = Math.round((this.shortTermDebt + this.longTermDebt) * 0.004)
    const taxable = operatingIncome - interestExpense
    const taxExpense = taxable > 0 ? Math.round(taxable * FINANCE_CONSTANTS.TAX_RATE) : 0
    const netIncome = taxable - taxExpense

    return {
      subscriptionRevenue, professionalServices,
      otherRevenue: 0, totalRevenue,
      hostingCost, supportCost, totalCOGS,
      grossProfit, grossMargin: Math.round(grossMargin * 10) / 10,
      rdExpense: Math.round(rdExpense),
      salesMarketingExpense, gaExpense: Math.round(gaExpense),
      totalOpex: Math.round(totalOpex),
      operatingIncome: Math.round(operatingIncome),
      operatingMargin: Math.round(operatingMargin * 10) / 10,
      interestExpense, otherIncome: 0,
      taxExpense, netIncome: Math.round(netIncome),
    }
  }

  generateBS(): BalanceSheet {
    const totalCurrentAssets = this.cash + this.accountsReceivable + this.prepaidExpenses
    const totalAssets = totalCurrentAssets + this.fixedAssets + this.intangibleAssets
    const totalCurrentLiabilities = this.accountsPayable + this.deferredRevenue + this.shortTermDebt
    const totalLiabilities = totalCurrentLiabilities + this.longTermDebt
    const totalEquity = this.commonStock + this.additionalPaidIn + this.retainedEarnings

    return {
      cash: this.cash,
      accountsReceivable: this.accountsReceivable,
      prepaidExpenses: this.prepaidExpenses,
      totalCurrentAssets,
      fixedAssets: this.fixedAssets,
      intangibleAssets: this.intangibleAssets,
      totalAssets,
      accountsPayable: this.accountsPayable,
      deferredRevenue: this.deferredRevenue,
      shortTermDebt: this.shortTermDebt,
      totalCurrentLiabilities,
      longTermDebt: this.longTermDebt,
      totalLiabilities,
      commonStock: this.commonStock,
      additionalPaidIn: this.additionalPaidIn,
      retainedEarnings: this.retainedEarnings,
      totalEquity,
    }
  }

  private generateCF(): CashFlow {
    const pl = this.lastPL
    const netIncome = pl?.netIncome ?? 0
    const depreciation = this.totalDepreciation
    const changeInAR = this.accountsReceivable - this.prevAR
    const changeInAP = this.accountsPayable - this.prevAP
    const changeInDeferred = this.deferredRevenue - this.prevDeferred
    const operatingCashFlow = netIncome + depreciation - changeInAR + changeInAP + changeInDeferred

    const capex = 0
    const softwareDev = 0
    const investingCashFlow = -(capex + softwareDev)

    const equityRaised = 0
    const debtBorrowed = 0
    const debtRepaid = 0
    const financingCashFlow = equityRaised + debtBorrowed - debtRepaid

    const netCashChange = operatingCashFlow + investingCashFlow + financingCashFlow

    return {
      netIncome, depreciation,
      changeInAR, changeInAP, changeInDeferred,
      operatingCashFlow,
      capex, softwareDev, investingCashFlow,
      equityRaised, debtBorrowed, debtRepaid, financingCashFlow,
      netCashChange,
      endingCash: this.cash,
    }
  }

  // ─── アラート ───

  isBankrupt(): boolean {
    return this.cash < FINANCE_CONSTANTS.BANKRUPTCY_THRESHOLD
  }

  isRunwayWarning(): boolean {
    const metrics = this.lastMetrics
    if (!metrics) return false
    return metrics.runway < FINANCE_CONSTANTS.RUNWAY_WARNING_MONTHS && metrics.burnRate > 0
  }

  getMonthlyTotalCost(): number {
    const tx = this.monthlyTx
    return tx.personnelCost + tx.hostingCost + tx.supportCost +
      tx.salesMarketingCost + tx.gaCost + tx.officeCost + tx.otherCost + tx.rdCost
  }

  // ─── ヘルパー ───

  private emptyTransaction(): MonthlyTransaction {
    return {
      subscriptionRevenue: 0, professionalServices: 0,
      hostingCost: 0, supportCost: 0, personnelCost: 0,
      rdCost: 0, salesMarketingCost: 0, gaCost: 0,
      officeCost: 0, otherCost: 0, capex: 0,
    }
  }

  private emptyMetrics(): SaaSMetrics {
    return {
      mrr: 0, arr: 0, newMRR: 0, expansionMRR: 0,
      contractionMRR: 0, churnedMRR: 0, netNewMRR: 0,
      arpu: 0, cac: 0, ltv: 0, ltvCacRatio: 0, paybackMonths: 0,
      grossChurnRate: 0, netRevenueRetention: 100, logoRetentionRate: 100,
      burnRate: 0, runway: 999, ruleOf40: 0, magicNumber: 0, burnMultiple: 0,
      revenuePerEmployee: 0, headcountCostRatio: 0,
      totalCustomers: 0, nps: 50,
    }
  }

  /** 状態を復元する */
  restore(data: {
    cash: number; totalFunding: number
    commonStock: number; retainedEarnings: number
    additionalPaidIn: number; prevMRR: number
  }): void {
    this.cash = data.cash
    this.totalFunding = data.totalFunding
    this.commonStock = data.commonStock
    this.retainedEarnings = data.retainedEarnings
    this.additionalPaidIn = data.additionalPaidIn
    this.prevMRR = data.prevMRR
  }
}
