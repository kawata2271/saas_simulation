/**
 * 財務関連の型定義
 * 全金額は「万円」単位（内部は整数演算）
 */

/** 損益計算書（PL） */
export interface ProfitAndLoss {
  /** MRR（月次経常収益） */
  readonly mrr: number
  /** ARR（年間経常収益） */
  readonly arr: number
  /** 売上高 */
  readonly revenue: number
  /** 売上原価 */
  readonly cogs: number
  /** 売上総利益 */
  readonly grossProfit: number
  /** 人件費 */
  readonly personnelCost: number
  /** 営業費（マーケティング等） */
  readonly salesCost: number
  /** 一般管理費 */
  readonly sgaCost: number
  /** 開発費 */
  readonly rdCost: number
  /** 営業利益 */
  readonly operatingProfit: number
  /** 営業外収益/費用 */
  readonly nonOperatingIncome: number
  /** 経常利益 */
  readonly ordinaryProfit: number
  /** 税引前利益 */
  readonly profitBeforeTax: number
  /** 法人税等 */
  readonly tax: number
  /** 当期純利益 */
  readonly netProfit: number
}

/** 貸借対照表（BS） */
export interface BalanceSheet {
  /** 現金及び預金 */
  readonly cash: number
  /** 売掛金 */
  readonly accountsReceivable: number
  /** その他流動資産 */
  readonly otherCurrentAssets: number
  /** 固定資産 */
  readonly fixedAssets: number
  /** 資産合計 */
  readonly totalAssets: number
  /** 買掛金 */
  readonly accountsPayable: number
  /** 短期借入金 */
  readonly shortTermDebt: number
  /** 長期借入金 */
  readonly longTermDebt: number
  /** 負債合計 */
  readonly totalLiabilities: number
  /** 資本金 */
  readonly capital: number
  /** 利益剰余金 */
  readonly retainedEarnings: number
  /** 純資産合計 */
  readonly totalEquity: number
}

/** キャッシュフロー計算書（CF） */
export interface CashFlow {
  /** 営業CF */
  readonly operating: number
  /** 投資CF */
  readonly investing: number
  /** 財務CF */
  readonly financing: number
  /** CF合計 */
  readonly total: number
  /** 期末現金残高 */
  readonly endingCash: number
}

/** SaaS KPIメトリクス */
export interface SaaSMetrics {
  /** 月次経常収益 */
  readonly mrr: number
  /** 年間経常収益 */
  readonly arr: number
  /** 解約率（月次） */
  readonly churnRate: number
  /** 顧客生涯価値 */
  readonly ltv: number
  /** 顧客獲得コスト */
  readonly cac: number
  /** LTV/CAC比率 */
  readonly ltvCacRatio: number
  /** ネットレベニューリテンション */
  readonly nrr: number
  /** Rule of 40 スコア */
  readonly ruleOf40: number
  /** 月間アクティブ顧客数 */
  readonly activeCustomers: number
  /** ARPU（顧客単価） */
  readonly arpu: number
  /** バーンレート（月次） */
  readonly burnRate: number
  /** ランウェイ（月数） */
  readonly runway: number
}

/** 財務状態の統合 */
export interface FinancialState {
  readonly pl: ProfitAndLoss
  readonly bs: BalanceSheet
  readonly cf: CashFlow
  readonly metrics: SaaSMetrics
  /** 企業価値（万円） */
  readonly valuation: number
  /** 累計調達額 */
  readonly totalFunding: number
}

/** 資金調達ラウンド */
export interface FundingRound {
  readonly id: string
  readonly type: FundingType
  readonly amount: number
  readonly valuation: number
  readonly dilution: number
  readonly investorNames: readonly string[]
  readonly closedDate: number
}

/** 資金調達タイプ */
export const FUNDING_TYPES = {
  BOOTSTRAP: 'bootstrap',
  ANGEL: 'angel',
  SEED: 'seed',
  SERIES_A: 'series_a',
  SERIES_B: 'series_b',
  SERIES_C: 'series_c',
  DEBT: 'debt',
  IPO: 'ipo',
} as const satisfies Record<string, string>

export type FundingType = (typeof FUNDING_TYPES)[keyof typeof FUNDING_TYPES]
