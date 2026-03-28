/**
 * 会社管理システム
 * 会社設立、ステージ進行、レピュテーション管理
 */

import type { CompanyState, CompanyFoundingParams, CultureState } from '@game-types/company.js'
import { COMPANY_STAGES } from '@game-types/company.js'
import type { CompanyStage } from '@game-types/company.js'
import { CULTURE_CONSTANTS, OFFICE_CAPACITY } from '@core/data/constants.js'
import { clamp } from '@utils/math.js'

/** ステージ昇格条件（ARR万円） */
const STAGE_THRESHOLDS: Record<string, number> = {
  [COMPANY_STAGES.PRE_SEED]: 0,
  [COMPANY_STAGES.SEED]: 120,
  [COMPANY_STAGES.SERIES_A]: 1200,
  [COMPANY_STAGES.SERIES_B]: 6000,
  [COMPANY_STAGES.SERIES_C]: 24000,
  [COMPANY_STAGES.PRE_IPO]: 60000,
  [COMPANY_STAGES.PUBLIC]: 120000,
}

/** ステージ順序 */
const STAGE_ORDER: CompanyStage[] = [
  COMPANY_STAGES.PRE_SEED,
  COMPANY_STAGES.SEED,
  COMPANY_STAGES.SERIES_A,
  COMPANY_STAGES.SERIES_B,
  COMPANY_STAGES.SERIES_C,
  COMPANY_STAGES.PRE_IPO,
  COMPANY_STAGES.PUBLIC,
]

/**
 * CompanyManager — 会社の状態管理と進行
 */
export class CompanyManager {
  private state: CompanyState | null = null

  /** 会社を設立する */
  found(params: CompanyFoundingParams, dayNumber: number): CompanyState {
    const culture: CultureState = { ...CULTURE_CONSTANTS.INITIAL_CULTURE }
    this.state = {
      id: `company_${Date.now()}`,
      name: params.name,
      industry: params.industry,
      stage: COMPANY_STAGES.PRE_SEED,
      founderName: params.founderName,
      mission: params.mission,
      foundedDate: dayNumber,
      reputation: 10,
      culture,
      officeLevel: 0,
      headcount: 1,
    }
    return this.state
  }

  /** 現在の会社状態を取得する */
  getState(): CompanyState | null {
    return this.state
  }

  /** 会社状態を外部から設定する（ロード時等） */
  setState(state: CompanyState): void {
    this.state = state
  }

  /** 日次更新 */
  updateDaily(headcount: number, reputation: number): void {
    if (!this.state) return
    this.state = {
      ...this.state,
      headcount,
      reputation: clamp(reputation, 0, 100),
    }
  }

  /** ARRに基づくステージ判定・昇格 */
  checkStageProgression(arr: number): CompanyStage | null {
    if (!this.state) return null

    const currentIndex = STAGE_ORDER.indexOf(this.state.stage)
    if (currentIndex >= STAGE_ORDER.length - 1) return null

    const nextStage = STAGE_ORDER[currentIndex + 1]
    const threshold = STAGE_THRESHOLDS[nextStage]

    if (arr >= threshold) {
      this.state = { ...this.state, stage: nextStage }
      return nextStage
    }
    return null
  }

  /** オフィスアップグレードが必要か判定する */
  needsOfficeUpgrade(): boolean {
    if (!this.state) return false
    const capacity = OFFICE_CAPACITY[this.state.officeLevel]
    return this.state.headcount >= capacity
  }

  /** オフィスをアップグレードする */
  upgradeOffice(): number | null {
    if (!this.state) return null
    if (this.state.officeLevel >= OFFICE_CAPACITY.length - 1) return null
    const newLevel = this.state.officeLevel + 1
    this.state = { ...this.state, officeLevel: newLevel }
    return newLevel
  }

  /** 企業文化を更新する */
  updateCulture(delta: Partial<CultureState>): void {
    if (!this.state) return
    const c = this.state.culture
    this.state = {
      ...this.state,
      culture: {
        innovation: clamp(c.innovation + (delta.innovation ?? 0), 0, 100),
        workLifeBalance: clamp(c.workLifeBalance + (delta.workLifeBalance ?? 0), 0, 100),
        meritocracy: clamp(c.meritocracy + (delta.meritocracy ?? 0), 0, 100),
        transparency: clamp(c.transparency + (delta.transparency ?? 0), 0, 100),
        teamwork: clamp(c.teamwork + (delta.teamwork ?? 0), 0, 100),
      },
    }
  }

  /** レピュテーションを変動させる */
  adjustReputation(delta: number): void {
    if (!this.state) return
    this.state = {
      ...this.state,
      reputation: clamp(this.state.reputation + delta, 0, 100),
    }
  }
}
