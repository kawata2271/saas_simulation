/**
 * 従業員関連の型定義
 */

// ─── 部門 ───

export const DEPARTMENTS = {
  ENGINEERING: 'engineering',
  PRODUCT: 'product',
  DESIGN: 'design',
  SALES: 'sales',
  MARKETING: 'marketing',
  CUSTOMER_SUCCESS: 'customer_success',
  HR: 'hr',
  FINANCE: 'finance',
  LEGAL: 'legal',
  OPERATIONS: 'operations',
  EXECUTIVE: 'executive',
} as const satisfies Record<string, string>

export type Department = (typeof DEPARTMENTS)[keyof typeof DEPARTMENTS]

// ─── 職位 ───

export const POSITIONS = {
  INTERN: 'intern',
  JUNIOR: 'junior',
  MID: 'mid',
  SENIOR: 'senior',
  LEAD: 'lead',
  MANAGER: 'manager',
  DIRECTOR: 'director',
  VP: 'vp',
  CXO: 'cxo',
  CEO: 'ceo',
} as const satisfies Record<string, string>

export type Position = (typeof POSITIONS)[keyof typeof POSITIONS]

/** 職位 → グレードマッピング */
export const POSITION_GRADES: Record<Position, number> = {
  [POSITIONS.INTERN]: 1,
  [POSITIONS.JUNIOR]: 2,
  [POSITIONS.MID]: 4,
  [POSITIONS.SENIOR]: 6,
  [POSITIONS.LEAD]: 7,
  [POSITIONS.MANAGER]: 8,
  [POSITIONS.DIRECTOR]: 9,
  [POSITIONS.VP]: 9,
  [POSITIONS.CXO]: 10,
  [POSITIONS.CEO]: 10,
}

/** 職位別基本年俸（万円） */
export const POSITION_BASE_SALARY: Record<Position, number> = {
  [POSITIONS.INTERN]: 200,
  [POSITIONS.JUNIOR]: 360,
  [POSITIONS.MID]: 540,
  [POSITIONS.SENIOR]: 780,
  [POSITIONS.LEAD]: 960,
  [POSITIONS.MANAGER]: 1080,
  [POSITIONS.DIRECTOR]: 1440,
  [POSITIONS.VP]: 1800,
  [POSITIONS.CXO]: 2400,
  [POSITIONS.CEO]: 3000,
}

// ─── レガシー互換 ───

export const GRADES = POSITIONS
export type Grade = Position
export const GRADE_LEVEL_RANGES = {
  intern: { min: 1, max: 1 },
  junior: { min: 2, max: 3 },
  mid: { min: 4, max: 5 },
  senior: { min: 6, max: 7 },
  lead: { min: 7, max: 8 },
  manager: { min: 8, max: 8 },
  director: { min: 9, max: 9 },
  vp: { min: 9, max: 9 },
  cxo: { min: 10, max: 10 },
  ceo: { min: 10, max: 10 },
} as const satisfies Record<Position, { min: number; max: number }>

// ─── 能力値 ───

export interface EmployeeStats {
  readonly engineering: number
  readonly sales: number
  readonly planning: number
  readonly management: number
  readonly creativity: number
  readonly communication: number
  readonly resilience: number
  readonly loyalty: number
  readonly growthPotential: number
}

// ─── 感情/状態 ───

export interface EmployeeMorale {
  motivation: number
  stress: number
  satisfaction: number
  burnoutRisk: number
  growthDesire: number
  belongingness: number
}

// ─── 人間関係 ───

export const RELATIONSHIP_LEVELS = {
  STRANGER: 'stranger',
  ACQUAINTANCE: 'acquaintance',
  COLLEAGUE: 'colleague',
  FRIEND: 'friend',
  CLOSE_FRIEND: 'close_friend',
  RIVAL: 'rival',
} as const satisfies Record<string, string>

export type RelationshipLevel = (typeof RELATIONSHIP_LEVELS)[keyof typeof RELATIONSHIP_LEVELS]

export interface Relationship {
  readonly targetId: string
  readonly level: RelationshipLevel
  readonly affinity: number
}

// ─── 特殊能力 ───

export const ABILITY_RARITIES = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
} as const satisfies Record<string, string>

export type AbilityRarity = (typeof ABILITY_RARITIES)[keyof typeof ABILITY_RARITIES]

export interface SpecialAbilityDef {
  readonly id: string
  readonly name: string
  readonly rarity: AbilityRarity
  readonly description: string
  readonly effects: readonly AbilityEffect[]
}

export interface AbilityEffect {
  readonly target: string
  readonly stat: string
  readonly operator: 'add' | 'multiply'
  readonly value: number
}

export const SPECIAL_ABILITIES_CATALOG: readonly SpecialAbilityDef[] = [
  // エンジニアリング
  { id: '10x_engineer', name: '10xエンジニア', rarity: 'legendary',
    description: '開発速度+300%, コードレビュー厳格化',
    effects: [{ target: 'product', stat: 'dev_speed', operator: 'multiply', value: 4.0 }] },
  { id: 'bug_hunter', name: 'バグハンター', rarity: 'epic',
    description: 'バグ発見率+200%, テスト工程半減',
    effects: [{ target: 'product', stat: 'bug_detect', operator: 'multiply', value: 3.0 }] },
  { id: 'architect', name: 'アーキテクト', rarity: 'epic',
    description: '技術的負債蓄積速度-50%',
    effects: [{ target: 'product', stat: 'tech_debt_rate', operator: 'multiply', value: 0.5 }] },
  { id: 'full_stack', name: 'フルスタック', rarity: 'rare',
    description: '全開発タスクに参加可能、効率+50%',
    effects: [{ target: 'product', stat: 'versatility', operator: 'multiply', value: 1.5 }] },
  { id: 'devops_guru', name: 'DevOpsの達人', rarity: 'epic',
    description: 'インフラコスト-30%, デプロイ速度+100%',
    effects: [{ target: 'finance', stat: 'hosting_cost', operator: 'multiply', value: 0.7 }] },
  // 営業
  { id: 'closer', name: 'クロージャー', rarity: 'legendary',
    description: '商談成約率+100%, 大型案件獲得UP',
    effects: [{ target: 'sales', stat: 'close_rate', operator: 'multiply', value: 2.0 }] },
  { id: 'rainmaker', name: 'レインメーカー', rarity: 'epic',
    description: 'リード獲得数+150%',
    effects: [{ target: 'sales', stat: 'lead_gen', operator: 'multiply', value: 2.5 }] },
  { id: 'networker', name: 'ネットワーカー', rarity: 'rare',
    description: 'リファラル採用成功率+80%',
    effects: [{ target: 'hr', stat: 'referral_rate', operator: 'multiply', value: 1.8 }] },
  { id: 'enterprise_whisperer', name: 'エンタープライズの囁き手', rarity: 'legendary',
    description: 'エンタープライズ案件ARPU+200%',
    effects: [{ target: 'sales', stat: 'enterprise_arpu', operator: 'multiply', value: 3.0 }] },
  // マネジメント
  { id: 'people_magnet', name: 'ピープルマグネット', rarity: 'epic',
    description: '部下モチベーション自動回復+5/日',
    effects: [{ target: 'hr', stat: 'motivation_recovery', operator: 'add', value: 5 }] },
  { id: 'crisis_leader', name: 'クライシスリーダー', rarity: 'legendary',
    description: '危機イベントのネガティブ影響-60%',
    effects: [{ target: 'event', stat: 'crisis_impact', operator: 'multiply', value: 0.4 }] },
  { id: 'mentor_master', name: 'メンターマスター', rarity: 'epic',
    description: '部下の成長速度+100%',
    effects: [{ target: 'hr', stat: 'growth_rate', operator: 'multiply', value: 2.0 }] },
  // カルチャー
  { id: 'mood_maker', name: 'ムードメーカー', rarity: 'rare',
    description: '周囲3名のストレス-2/日',
    effects: [{ target: 'hr', stat: 'nearby_stress', operator: 'add', value: -2 }] },
  { id: 'innovator', name: 'イノベーター', rarity: 'legendary',
    description: '四半期ごとに新機能アイデア自動生成',
    effects: [{ target: 'product', stat: 'idea_gen', operator: 'add', value: 1 }] },
  { id: 'culture_champion', name: 'カルチャーチャンピオン', rarity: 'epic',
    description: '企業文化スコア上昇速度+50%',
    effects: [{ target: 'culture', stat: 'culture_growth', operator: 'multiply', value: 1.5 }] },
  // 企画
  { id: 'visionary', name: 'ビジョナリー', rarity: 'legendary',
    description: 'プロダクト方向性の正確さ+80%',
    effects: [{ target: 'product', stat: 'direction_accuracy', operator: 'multiply', value: 1.8 }] },
  { id: 'data_driven', name: 'データドリブン', rarity: 'rare',
    description: '意思決定の精度+40%',
    effects: [{ target: 'company', stat: 'decision_accuracy', operator: 'multiply', value: 1.4 }] },
  // ユニーク
  { id: 'night_owl', name: 'ナイトオウル', rarity: 'rare',
    description: '残業時の生産性低下なし',
    effects: [{ target: 'hr', stat: 'overtime_penalty', operator: 'multiply', value: 0 }] },
  { id: 'early_bird', name: 'アーリーバード', rarity: 'rare',
    description: '午前中の生産性+30%',
    effects: [{ target: 'hr', stat: 'morning_boost', operator: 'add', value: 30 }] },
  { id: 'firefighter', name: 'ファイアファイター', rarity: 'epic',
    description: '緊急バグ修正速度+200%',
    effects: [{ target: 'product', stat: 'hotfix_speed', operator: 'multiply', value: 3.0 }] },
  { id: 'serial_entrepreneur', name: 'シリアルアントレプレナー', rarity: 'legendary',
    description: '投資家との関係構築速度+100%',
    effects: [{ target: 'investor', stat: 'relationship_speed', operator: 'multiply', value: 2.0 }] },
]

// ─── 採用チャネル ───

export const RECRUITMENT_CHANNELS = {
  JOB_BOARD: 'job_board',
  HEADHUNTER: 'headhunter',
  REFERRAL: 'referral',
  SNS_BRANDING: 'sns_branding',
  UNIVERSITY: 'university',
  DIRECT_SCOUT: 'direct_scout',
} as const satisfies Record<string, string>

export type RecruitmentChannel = (typeof RECRUITMENT_CHANNELS)[keyof typeof RECRUITMENT_CHANNELS]

export interface RecruitmentChannelDef {
  readonly id: RecruitmentChannel
  readonly name: string
  readonly costPerHire: number
  readonly qualityMin: number
  readonly qualityMax: number
  readonly volumePerMonth: number
  readonly durationDays: number
  readonly requirements?: string
}

export const CHANNEL_DEFINITIONS: Record<RecruitmentChannel, RecruitmentChannelDef> = {
  [RECRUITMENT_CHANNELS.JOB_BOARD]: {
    id: 'job_board', name: '求人サイト', costPerHire: 50, qualityMin: 20, qualityMax: 70,
    volumePerMonth: 8, durationDays: 30 },
  [RECRUITMENT_CHANNELS.HEADHUNTER]: {
    id: 'headhunter', name: 'ヘッドハンター', costPerHire: 200, qualityMin: 50, qualityMax: 95,
    volumePerMonth: 2, durationDays: 45, requirements: 'シニア以上' },
  [RECRUITMENT_CHANNELS.REFERRAL]: {
    id: 'referral', name: 'リファラル', costPerHire: 20, qualityMin: 40, qualityMax: 85,
    volumePerMonth: 3, durationDays: 20 },
  [RECRUITMENT_CHANNELS.SNS_BRANDING]: {
    id: 'sns_branding', name: 'SNS/ブランディング', costPerHire: 10, qualityMin: 30, qualityMax: 75,
    volumePerMonth: 5, durationDays: 40 },
  [RECRUITMENT_CHANNELS.UNIVERSITY]: {
    id: 'university', name: '大学採用', costPerHire: 30, qualityMin: 10, qualityMax: 60,
    volumePerMonth: 4, durationDays: 60, requirements: '新卒のみ' },
  [RECRUITMENT_CHANNELS.DIRECT_SCOUT]: {
    id: 'direct_scout', name: '逆スカウト', costPerHire: 300, qualityMin: 70, qualityMax: 100,
    volumePerMonth: 1, durationDays: 60 },
}

// ─── 採用パイプライン ───

export const PIPELINE_STAGES = {
  APPLIED: 'applied',
  SCREENING: 'screening',
  INTERVIEW_1: 'interview_1',
  INTERVIEW_2: 'interview_2',
  INTERVIEW_3: 'interview_3',
  OFFER: 'offer',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const satisfies Record<string, string>

export type PipelineStage = (typeof PIPELINE_STAGES)[keyof typeof PIPELINE_STAGES]

export interface Applicant {
  readonly id: string
  readonly name: string
  currentStage: PipelineStage
  readonly stats: EmployeeStats
  readonly revealedStats: Set<keyof EmployeeStats>
  readonly salaryExpectation: number
  readonly otherOffers: number
  interestLevel: number
  readonly fitScore: number
  readonly channel: RecruitmentChannel
  readonly appliedDay: number
}

// ─── 退職予告 ───

export const TURNOVER_FLAGS = {
  NONE: 'none',
  LOW_ENERGY: 'low_energy',
  CONSIDERING: 'considering',
  DECIDED: 'decided',
} as const satisfies Record<string, string>

export type TurnoverFlag = (typeof TURNOVER_FLAGS)[keyof typeof TURNOVER_FLAGS]

// ─── 引き留め施策 ───

export const RETENTION_ACTIONS = {
  SALARY_RAISE: 'salary_raise',
  PROMOTION: 'promotion',
  ROLE_CHANGE: 'role_change',
  MENTORING: 'mentoring',
  ONE_ON_ONE: 'one_on_one',
  STOCK_OPTIONS: 'stock_options',
} as const satisfies Record<string, string>

export type RetentionAction = (typeof RETENTION_ACTIONS)[keyof typeof RETENTION_ACTIONS]

// ─── 従業員状態（統合） ───

export interface EmployeeState {
  readonly id: string
  readonly name: string
  readonly department: Department
  readonly position: Position
  readonly grade: number
  readonly level: number
  readonly stats: EmployeeStats
  readonly morale: EmployeeMorale
  readonly salary: number
  readonly hiredDate: number
  readonly specialAbilities: readonly string[]
  readonly isRemote: boolean
  readonly experience: number
  readonly relationships: readonly Relationship[]
  readonly mentorId: string | null
  readonly managerId: string | null
  readonly turnoverFlag: TurnoverFlag
  readonly lastPromotionDate: number | null
  readonly stockOptions: number
}

// ─── レガシー互換: Candidate ───

export interface Candidate {
  readonly id: string
  readonly name: string
  readonly department: Department
  readonly grade: Grade
  readonly level: number
  readonly stats: EmployeeStats
  readonly expectedSalary: number
  readonly specialAbilities: readonly string[]
  readonly availableUntil: number
}
