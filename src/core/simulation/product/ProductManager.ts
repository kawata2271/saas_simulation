/**
 * プロダクト開発管理システム
 * 機能開発、バグ管理、技術的負債、リリース、品質スコア
 */

import type { SeededRandom } from '@utils/random.js'
import { PRODUCT_CONSTANTS } from '@core/data/constants.js'
import { calcProductScore } from '@core/data/formulas.js'
import { clamp } from '@utils/math.js'

/** 機能の開発状態 */
export const FEATURE_STATES = {
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  RELEASED: 'released',
} as const satisfies Record<string, string>

export type FeatureState = (typeof FEATURE_STATES)[keyof typeof FEATURE_STATES]

/** 機能定義 */
export interface Feature {
  readonly id: string
  readonly name: string
  state: FeatureState
  /** 残り工数（人日） */
  remainingEffort: number
  /** 総工数（人日） */
  totalEffort: number
  /** 品質スコア (0-100) */
  quality: number
  /** 複雑度 (1-5) */
  complexity: number
}

/** バグ */
export interface Bug {
  readonly id: string
  readonly featureId: string
  /** 残り修正工数（人日） */
  remainingEffort: number
  /** 深刻度 (1-3) */
  severity: number
}

/**
 * ProductManager — プロダクト開発全般を管理する
 */
export class ProductManager {
  private features: Feature[] = []
  private bugs: Bug[] = []
  private techDebt = 0
  private productScore: number = PRODUCT_CONSTANTS.INITIAL_PRODUCT_SCORE
  private nextId = 1
  private totalReleased = 0

  /** プロダクトスコアを取得する */
  getProductScore(): number {
    return this.productScore
  }

  /** 技術的負債を取得する */
  getTechDebt(): number {
    return this.techDebt
  }

  /** バグ数を取得する */
  getBugCount(): number {
    return this.bugs.length
  }

  /** リリース済み機能数を取得する */
  getReleasedFeatureCount(): number {
    return this.totalReleased
  }

  /** 全機能リストを取得する */
  getFeatures(): Feature[] {
    return [...this.features]
  }

  /** 全バグリストを取得する */
  getBugs(): Bug[] {
    return [...this.bugs]
  }

  /** 新機能の開発を開始する */
  startFeature(name: string, complexity: number): Feature | null {
    const inProgress = this.features.filter(
      (f) => f.state === FEATURE_STATES.IN_PROGRESS,
    )
    if (inProgress.length >= PRODUCT_CONSTANTS.MAX_CONCURRENT_FEATURES) {
      return null
    }

    const effort = PRODUCT_CONSTANTS.FEATURE_BASE_EFFORT + complexity * 15
    const feature: Feature = {
      id: `feat_${this.nextId++}`,
      name,
      state: FEATURE_STATES.IN_PROGRESS,
      remainingEffort: effort,
      totalEffort: effort,
      quality: 50,
      complexity: clamp(complexity, 1, 5),
    }
    this.features.push(feature)
    return feature
  }

  /**
   * 日次更新: エンジニア工数を開発に投入する
   * @returns 完成した機能のリスト
   */
  updateDaily(
    engineeringPower: number,
    avgTechSkill: number,
    avgPlanSkill: number,
    _rng: SeededRandom,
  ): Feature[] {
    const completedFeatures: Feature[] = []
    let remainingPower = engineeringPower

    // バグ修正を優先（工数の30%まで）
    const bugBudget = remainingPower * 0.3
    let bugPowerUsed = 0
    for (const bug of [...this.bugs]) {
      if (bugPowerUsed >= bugBudget) break
      const power = Math.min(bug.remainingEffort, bugBudget - bugPowerUsed)
      bug.remainingEffort -= power
      bugPowerUsed += power

      if (bug.remainingEffort <= 0) {
        this.bugs = this.bugs.filter((b) => b.id !== bug.id)
      }
    }
    remainingPower -= bugPowerUsed

    // 機能開発
    const inProgress = this.features.filter(
      (f) => f.state === FEATURE_STATES.IN_PROGRESS,
    )
    if (inProgress.length > 0) {
      const powerPerFeature = remainingPower / inProgress.length
      for (const feature of inProgress) {
        feature.remainingEffort -= powerPerFeature

        if (feature.remainingEffort <= 0) {
          feature.remainingEffort = 0
          feature.state = FEATURE_STATES.COMPLETED
          feature.quality = clamp(
            avgTechSkill * PRODUCT_CONSTANTS.QUALITY_TECH_FACTOR +
            avgPlanSkill * PRODUCT_CONSTANTS.QUALITY_PLAN_FACTOR -
            this.techDebt * 0.3,
            10,
            100,
          )
          completedFeatures.push(feature)
        }
      }
    }

    return completedFeatures
  }

  /** 完成した機能をリリースする */
  releaseFeatures(rng: SeededRandom): { released: Feature[]; newBugs: Bug[] } {
    const completed = this.features.filter(
      (f) => f.state === FEATURE_STATES.COMPLETED,
    )
    const released: Feature[] = []
    const newBugs: Bug[] = []

    for (const feature of completed) {
      feature.state = FEATURE_STATES.RELEASED
      released.push(feature)
      this.totalReleased++
      this.techDebt += PRODUCT_CONSTANTS.TECH_DEBT_PER_FEATURE

      // バグ発生判定
      const bugRate = PRODUCT_CONSTANTS.BUG_BASE_RATE +
        this.techDebt * PRODUCT_CONSTANTS.TECH_DEBT_BUG_FACTOR -
        (feature.quality / 100) * 0.1

      if (rng.chance(bugRate)) {
        const bug: Bug = {
          id: `bug_${this.nextId++}`,
          featureId: feature.id,
          remainingEffort: PRODUCT_CONSTANTS.BUG_FIX_BASE_EFFORT +
            rng.nextInt(0, 5),
          severity: rng.nextInt(1, 3),
        }
        this.bugs.push(bug)
        newBugs.push(bug)
      }
    }

    this.recalcProductScore()
    return { released, newBugs }
  }

  /** 技術的負債を返済する（リファクタリング） */
  reduceTechDebt(effort: number): number {
    const reduced = Math.min(this.techDebt, effort * 0.5)
    this.techDebt = Math.max(0, this.techDebt - reduced)
    this.recalcProductScore()
    return reduced
  }

  /** プロダクトスコアを再計算する */
  private recalcProductScore(): void {
    const avgQuality = this.totalReleased > 0
      ? this.features
          .filter((f) => f.state === FEATURE_STATES.RELEASED)
          .reduce((sum, f) => sum + f.quality, 0) / this.totalReleased
      : 50

    this.productScore = calcProductScore(
      this.totalReleased,
      this.bugs.length,
      this.techDebt,
      avgQuality,
    )
  }

  /** 状態を復元する */
  restore(data: {
    features: Feature[]
    bugs: Bug[]
    techDebt: number
    totalReleased: number
  }): void {
    this.features = data.features
    this.bugs = data.bugs
    this.techDebt = data.techDebt
    this.totalReleased = data.totalReleased
    this.recalcProductScore()
  }
}
