/**
 * 財務関連の型定義
 * 全金額は「万円」単位（内部は整数演算）
 */

// ─── P/L（損益計算書） ───

export interface ProfitAndLoss {
  // 売上
  readonly subscriptionRevenue: number
  readonly professionalServices: number
  readonly otherRevenue: number
  readonly totalRevenue: number

  // 売上原価
  readonly hostingCost: number
  readonly supportCost: number
  readonly totalCOGS: number
  readonly grossProfit: number
  readonly grossMargin: number

  // 営業費用
  readonly rdExpense: number
  readonly salesMarketingExpense: number
  readonly gaExpense: number
  readonly totalOpex: number
  readonly operatingIncome: number
  readonly operatingMargin: number

  // 営業外
  readonly interestExpense: number
  readonly otherIncome: number
  readonly taxExpense: number
  readonly netIncome: number
}

// ─── B/S（貸借対照表） ───

export interface BalanceSheet {
  // 資産
  readonly cash: number
  readonly accountsReceivable: number
  readonly prepaidExpenses: number
  readonly totalCurrentAssets: number
  readonly fixedAssets: number
  readonly intangibleAssets: number
  readonly totalAssets: number

  // 負債
  readonly accountsPayable: number
  readonly deferredRevenue: number
  readonly shortTermDebt: number
  readonly totalCurrentLiabilities: number
  readonly longTermDebt: number
  readonly totalLiabilities: number

  // 純資産
  readonly commonStock: number
  readonly additionalPaidIn: number
  readonly retainedEarnings: number
  readonly totalEquity: number
}

// ─── C/F（キャッシュフロー計算書） ───

export interface CashFlow {
  // 営業CF
  readonly netIncome: number
  readonly depreciation: number
  readonly changeInAR: number
  readonly changeInAP: number
  readonly changeInDeferred: number
  readonly operatingCashFlow: number

  // 投資CF
  readonly capex: number
  readonly softwareDev: number
  readonly investingCashFlow: number

  // 財務CF
  readonly equityRaised: number
  readonly debtBorrowed: number
  readonly debtRepaid: number
  readonly financingCashFlow: number

  readonly netCashChange: number
  readonly endingCash: number
}

// ─── SaaS KPI ───

export interface SaaSMetrics {
  // 収益指標
  readonly mrr: number
  readonly arr: number
  readonly newMRR: number
  readonly expansionMRR: number
  readonly contractionMRR: number
  readonly churnedMRR: number
  readonly netNewMRR: number

  // ユニットエコノミクス
  readonly arpu: number
  readonly cac: number
  readonly ltv: number
  readonly ltvCacRatio: number
  readonly paybackMonths: number

  // リテンション
  readonly grossChurnRate: number
  readonly netRevenueRetention: number
  readonly logoRetentionRate: number

  // 効率性
  readonly burnRate: number
  readonly runway: number
  readonly ruleOf40: number
  readonly magicNumber: number
  readonly burnMultiple: number

  // 従業員
  readonly revenuePerEmployee: number
  readonly headcountCostRatio: number

  // 顧客
  readonly totalCustomers: number
  readonly nps: number
}

// ─── バリュエーション ───

export const FUNDING_TYPES = {
  BOOTSTRAP: 'bootstrap',
  ANGEL: 'angel',
  SEED: 'seed',
  SERIES_A: 'series_a',
  SERIES_B: 'series_b',
  SERIES_C: 'series_c',
  SERIES_D: 'series_d',
  DEBT: 'debt',
  PRE_IPO: 'pre_ipo',
  IPO: 'ipo',
} as const satisfies Record<string, string>

export type FundingType = (typeof FUNDING_TYPES)[keyof typeof FUNDING_TYPES]

export interface ValuationFactor {
  readonly name: string
  readonly multiplier: number
  readonly reason: string
}

export interface ValuationResult {
  readonly stage: FundingType
  readonly baseMultiple: number
  readonly adjustedMultiple: number
  readonly factors: readonly ValuationFactor[]
  readonly estimatedValuation: number
  readonly range: { readonly low: number; readonly high: number }
}

export interface FundingRound {
  readonly id: string
  readonly type: FundingType
  readonly amount: number
  readonly preMoneyValuation: number
  readonly postMoneyValuation: number
  readonly dilution: number
  readonly investorNames: readonly string[]
  readonly closedDate: number
}

// ─── 財務状態の統合 ───

export interface FinancialState {
  readonly pl: ProfitAndLoss
  readonly bs: BalanceSheet
  readonly cf: CashFlow
  readonly metrics: SaaSMetrics
  readonly valuation: ValuationResult
  readonly totalFunding: number
  readonly fundingHistory: readonly FundingRound[]
}

// ─── MRR変動追跡 ───

export interface MRRMovement {
  readonly month: number
  readonly newMRR: number
  readonly expansionMRR: number
  readonly contractionMRR: number
  readonly churnedMRR: number
  readonly netNewMRR: number
  readonly endingMRR: number
}
