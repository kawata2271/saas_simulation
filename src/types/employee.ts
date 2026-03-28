/**
 * 従業員関連の型定義
 */

/** 部門 */
export const DEPARTMENTS = {
  ENGINEERING: 'engineering',
  PRODUCT: 'product',
  SALES: 'sales',
  MARKETING: 'marketing',
  CUSTOMER_SUCCESS: 'customer_success',
  HR: 'hr',
  FINANCE: 'finance',
  LEGAL: 'legal',
  EXECUTIVE: 'executive',
} as const satisfies Record<string, string>

export type Department = (typeof DEPARTMENTS)[keyof typeof DEPARTMENTS]

/** 職種グレード */
export const GRADES = {
  JUNIOR: 'junior',
  MID: 'mid',
  SENIOR: 'senior',
  LEAD: 'lead',
  EXECUTIVE: 'executive',
} as const satisfies Record<string, string>

export type Grade = (typeof GRADES)[keyof typeof GRADES]

/** グレード → レベル範囲マッピング */
export const GRADE_LEVEL_RANGES = {
  junior: { min: 1, max: 3 },
  mid: { min: 4, max: 6 },
  senior: { min: 7, max: 8 },
  lead: { min: 9, max: 9 },
  executive: { min: 10, max: 10 },
} as const satisfies Record<Grade, { min: number; max: number }>

/** 従業員能力値 */
export interface EmployeeStats {
  /** 技術力 (1-100) */
  readonly technical: number
  /** 営業力 (1-100) */
  readonly sales: number
  /** 企画力 (1-100) */
  readonly planning: number
  /** マネジメント力 (1-100) */
  readonly management: number
  /** 忠誠心 (1-100) */
  readonly loyalty: number
}

/** 従業員感情状態 */
export interface EmployeeMood {
  /** モチベーション (0-100) */
  readonly motivation: number
  /** ストレス (0-100) */
  readonly stress: number
  /** 成長欲求 (0-100) */
  readonly growthDesire: number
  /** 職場満足度 (0-100) */
  readonly satisfaction: number
}

/** 特殊能力ID */
export const SPECIAL_ABILITIES = {
  TEN_X_ENGINEER: '10x_engineer',
  CLOSER: 'closer',
  MOOD_MAKER: 'mood_maker',
  MENTOR: 'mentor',
  VISIONARY: 'visionary',
  FIREFIGHTER: 'firefighter',
  DATA_DRIVEN: 'data_driven',
  NETWORKING: 'networking',
  NIGHT_OWL: 'night_owl',
  EARLY_BIRD: 'early_bird',
} as const satisfies Record<string, string>

export type SpecialAbility = (typeof SPECIAL_ABILITIES)[keyof typeof SPECIAL_ABILITIES]

/** 従業員状態 */
export interface EmployeeState {
  readonly id: string
  readonly name: string
  readonly department: Department
  readonly grade: Grade
  readonly level: number
  readonly stats: EmployeeStats
  readonly mood: EmployeeMood
  readonly salary: number
  readonly hiredDate: number
  readonly specialAbilities: readonly SpecialAbility[]
  readonly isRemote: boolean
}

/** 採用候補者 */
export interface Candidate {
  readonly id: string
  readonly name: string
  readonly department: Department
  readonly grade: Grade
  readonly level: number
  readonly stats: EmployeeStats
  readonly expectedSalary: number
  readonly specialAbilities: readonly SpecialAbility[]
  readonly availableUntil: number
}
