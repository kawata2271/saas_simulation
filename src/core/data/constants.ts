/**
 * ゲームバランス定数
 * 全シミュレーションの数値基盤
 */

/** 採用関連定数 */
export const HR_CONSTANTS = {
  /** 候補者プール更新間隔（日） */
  CANDIDATE_REFRESH_DAYS: 5,
  /** 同時表示される候補者数 */
  CANDIDATE_POOL_SIZE: 5,
  /** 基本給与テーブル（万円/月、グレード別） */
  BASE_SALARY: {
    junior: 30,
    mid: 50,
    senior: 80,
    lead: 120,
    executive: 200,
  },
  /** 給与の振れ幅（±%） */
  SALARY_VARIANCE: 0.2,
  /** 採用オファー承諾率ベース */
  OFFER_ACCEPT_BASE: 0.7,
  /** レピュテーションによる承諾率ボーナス（/100） */
  OFFER_ACCEPT_REP_BONUS: 0.003,
  /** 自然退職確率ベース（/日） */
  QUIT_BASE_RATE: 0.0003,
  /** ストレスによる退職確率倍率 */
  QUIT_STRESS_MULTIPLIER: 3.0,
  /** モチベーション回復速度（/日） */
  MOTIVATION_RECOVERY: 0.1,
  /** ストレス蓄積速度ベース（/日） */
  STRESS_ACCUMULATION: 0.05,
} as const

/** プロダクト関連定数 */
export const PRODUCT_CONSTANTS = {
  /** 機能開発に必要な基本工数（人日） */
  FEATURE_BASE_EFFORT: 20,
  /** 機能品質に影響する技術力の係数 */
  QUALITY_TECH_FACTOR: 0.6,
  /** 機能品質に影響する企画力の係数 */
  QUALITY_PLAN_FACTOR: 0.4,
  /** バグ発生確率ベース（リリース時） */
  BUG_BASE_RATE: 0.15,
  /** 技術的負債の蓄積速度（/機能） */
  TECH_DEBT_PER_FEATURE: 2,
  /** 技術的負債のバグ発生への影響 */
  TECH_DEBT_BUG_FACTOR: 0.005,
  /** バグ修正に必要な基本工数（人日） */
  BUG_FIX_BASE_EFFORT: 5,
  /** 最大同時開発機能数 */
  MAX_CONCURRENT_FEATURES: 3,
  /** プロダクトスコア初期値 */
  INITIAL_PRODUCT_SCORE: 10,
} as const

/** 営業・マーケティング関連定数 */
export const SALES_CONSTANTS = {
  /** リード生成の基本レート（/日/営業人員） */
  LEAD_GEN_BASE: 0.5,
  /** マーケティング投資からのリード生成効率 */
  MARKETING_LEAD_FACTOR: 0.01,
  /** リードからトライアルへの変換率ベース */
  LEAD_TO_TRIAL_BASE: 0.15,
  /** トライアルから有料への変換率ベース */
  TRIAL_TO_PAID_BASE: 0.10,
  /** プロダクトスコアによる変換率ボーナス */
  PRODUCT_SCORE_CONV_FACTOR: 0.002,
  /** 月次解約率ベース */
  CHURN_BASE_RATE: 0.03,
  /** プロダクトスコアによる解約率低減 */
  CHURN_PRODUCT_FACTOR: 0.0003,
  /** 基本ARPU（万円/月） */
  BASE_ARPU: 3,
  /** プロダクトスコアによるARPU上昇 */
  ARPU_PRODUCT_FACTOR: 0.05,
  /** アップセル確率（/月/顧客） */
  UPSELL_RATE: 0.02,
  /** アップセル額倍率 */
  UPSELL_MULTIPLIER: 1.5,
} as const

/** 財務関連定数 */
export const FINANCE_CONSTANTS = {
  /** 法人税率 */
  TAX_RATE: 0.30,
  /** オフィス賃料（万円/月、レベル別） */
  OFFICE_RENT: [0, 20, 50, 120, 300, 800, 2000],
  /** サーバー費用ベース（万円/月） */
  SERVER_COST_BASE: 5,
  /** 顧客あたりサーバー費用増（万円/月） */
  SERVER_COST_PER_CUSTOMER: 0.1,
  /** 初期資金（万円） */
  INITIAL_CASH: 500,
  /** バリュエーション倍率（ARR x 倍率、ステージ別） */
  VALUATION_MULTIPLES: {
    pre_seed: 10,
    seed: 15,
    series_a: 20,
    series_b: 15,
    series_c: 12,
    pre_ipo: 10,
    public: 8,
  },
  /** ランウェイ警告閾値（月） */
  RUNWAY_WARNING_MONTHS: 6,
  /** 破産判定の負債上限 */
  BANKRUPTCY_THRESHOLD: -1000,
} as const

/** 企業文化関連定数 */
export const CULTURE_CONSTANTS = {
  /** 文化値の変動速度 */
  CULTURE_CHANGE_SPEED: 0.1,
  /** 文化がモチベーションに影響する係数 */
  CULTURE_MOTIVATION_FACTOR: 0.3,
  /** 初期文化値 */
  INITIAL_CULTURE: {
    innovation: 50,
    workLifeBalance: 50,
    meritocracy: 50,
    transparency: 50,
    teamwork: 50,
  },
} as const

/** オフィスレベルごとの最大人数 */
export const OFFICE_CAPACITY = [3, 10, 30, 80, 200, 500, 2000] as const
