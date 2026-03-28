/**
 * 会社関連の型定義
 */

/** 会社ステージ */
export const COMPANY_STAGES = {
  PRE_SEED: 'pre_seed',
  SEED: 'seed',
  SERIES_A: 'series_a',
  SERIES_B: 'series_b',
  SERIES_C: 'series_c',
  PRE_IPO: 'pre_ipo',
  PUBLIC: 'public',
} as const satisfies Record<string, string>

export type CompanyStage = (typeof COMPANY_STAGES)[keyof typeof COMPANY_STAGES]

/** 業界 */
export const INDUSTRIES = {
  HORIZONTAL_SAAS: 'horizontal_saas',
  VERTICAL_SAAS: 'vertical_saas',
  FINTECH: 'fintech',
  HEALTHTECH: 'healthtech',
  EDTECH: 'edtech',
  HR_TECH: 'hr_tech',
  SECURITY: 'security',
  AI_ML: 'ai_ml',
  DEV_TOOLS: 'dev_tools',
  MARTECH: 'martech',
} as const satisfies Record<string, string>

export type Industry = (typeof INDUSTRIES)[keyof typeof INDUSTRIES]

/** 会社設立パラメータ */
export interface CompanyFoundingParams {
  readonly name: string
  readonly industry: Industry
  readonly founderName: string
  readonly initialCash: number
  readonly mission: string
}

/** 会社状態 */
export interface CompanyState {
  readonly id: string
  readonly name: string
  readonly industry: Industry
  readonly stage: CompanyStage
  readonly founderName: string
  readonly mission: string
  readonly foundedDate: number
  readonly reputation: number
  readonly culture: CultureState
  readonly officeLevel: number
  readonly headcount: number
}

/** 企業文化状態 */
export interface CultureState {
  /** イノベーション志向 (0-100) */
  readonly innovation: number
  /** ワークライフバランス (0-100) */
  readonly workLifeBalance: number
  /** 成果主義 (0-100) */
  readonly meritocracy: number
  /** 透明性 (0-100) */
  readonly transparency: number
  /** チームワーク (0-100) */
  readonly teamwork: number
}

// OfficeLevel / OFFICE_LEVELS は rendering.ts で定義（統一）
