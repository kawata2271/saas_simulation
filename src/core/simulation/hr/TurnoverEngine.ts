/**
 * 退職/離職シミュレーションエンジン
 * 退職リスク計算、退職予告フラグ、引き留め、連鎖退職
 */

import type { EmployeeState, TurnoverFlag, RetentionAction } from '@game-types/employee.js'
import { TURNOVER_FLAGS } from '@game-types/employee.js'
import type { SeededRandom } from '@utils/random.js'
import { clamp } from '@utils/math.js'

/** 退職リスク計算結果 */
export interface TurnoverRisk {
  readonly employeeId: string
  readonly riskScore: number
  readonly factors: readonly string[]
  readonly flag: TurnoverFlag
}

/** 引き留め施策の効果 */
const RETENTION_EFFECTS: Record<RetentionAction, {
  satisfactionDelta: number
  motivationDelta: number
  burnoutDelta: number
  riskReduction: number
  cost: number
}> = {
  salary_raise:  { satisfactionDelta: 15, motivationDelta: 10, burnoutDelta: 0,  riskReduction: 0.3, cost: 0 },
  promotion:     { satisfactionDelta: 25, motivationDelta: 20, burnoutDelta: -5, riskReduction: 0.5, cost: 0 },
  role_change:   { satisfactionDelta: 10, motivationDelta: 15, burnoutDelta: -10, riskReduction: 0.25, cost: 0 },
  mentoring:     { satisfactionDelta: 8,  motivationDelta: 5,  burnoutDelta: -3, riskReduction: 0.1, cost: 0 },
  one_on_one:    { satisfactionDelta: 5,  motivationDelta: 8,  burnoutDelta: -5, riskReduction: 0.15, cost: 0 },
  stock_options: { satisfactionDelta: 12, motivationDelta: 8,  burnoutDelta: 0,  riskReduction: 0.4, cost: 0 },
}

/**
 * 退職リスクスコアを計算する (0-1)
 */
export function calcTurnoverRisk(
  employee: EmployeeState,
  marketDemand: number,
  companyGrowthRate: number,
  daysSincePromotion: number,
): TurnoverRisk {
  let risk = 0.01 // ベースライン月次1%
  const factors: string[] = []

  // 満足度
  if (employee.morale.satisfaction < 40) {
    risk += 0.08
    factors.push('低満足度')
  } else if (employee.morale.satisfaction < 60) {
    risk += 0.03
  }

  // バーンアウトリスク
  if (employee.morale.burnoutRisk > 70) {
    risk += 0.06
    factors.push('バーンアウト危険')
  } else if (employee.morale.burnoutRisk > 50) {
    risk += 0.02
  }

  // モチベーション
  if (employee.morale.motivation < 30) {
    risk += 0.05
    factors.push('低モチベーション')
  }

  // 昇進停滞
  if (daysSincePromotion > 500) {
    risk += 0.04
    factors.push('昇進停滞(2年以上)')
  }

  // 市場需要
  if (marketDemand > 0.7) {
    risk += 0.03
    factors.push('市場の人材需要高')
  }

  // 帰属意識
  if (employee.morale.belongingness < 30) {
    risk += 0.04
    factors.push('低帰属意識')
  }

  // ─── リスク低下要因 ───

  // ストックオプション
  if (employee.stockOptions > 0) {
    risk *= 0.5
    factors.push('SO未行使(低下)')
  }

  // メンター関係
  if (employee.mentorId) {
    risk *= 0.85
  }

  // 帰属意識が高い
  if (employee.morale.belongingness > 80) {
    risk *= 0.7
    factors.push('高帰属意識(低下)')
  }

  // 会社成長
  if (companyGrowthRate > 0.3) {
    risk *= 0.8
    factors.push('高成長企業(低下)')
  }

  // 最近の昇進
  if (daysSincePromotion < 90) {
    risk *= 0.4
    factors.push('直近昇進(低下)')
  }

  risk = clamp(risk, 0.001, 0.25)

  // フラグ判定
  let flag: TurnoverFlag = TURNOVER_FLAGS.NONE
  if (risk > 0.15) {
    flag = TURNOVER_FLAGS.DECIDED
  } else if (risk > 0.08) {
    flag = TURNOVER_FLAGS.CONSIDERING
  } else if (risk > 0.05) {
    flag = TURNOVER_FLAGS.LOW_ENERGY
  }

  return { employeeId: employee.id, riskScore: risk, factors, flag }
}

/**
 * 月次退職判定を実行する
 */
export function processMonthlyTurnover(
  employees: EmployeeState[],
  rng: SeededRandom,
  marketDemand: number,
  companyGrowthRate: number,
  currentDay: number,
): { quitIds: string[]; risks: TurnoverRisk[] } {
  const quitIds: string[] = []
  const risks: TurnoverRisk[] = []

  for (const emp of employees) {
    const daysSincePromotion = emp.lastPromotionDate
      ? currentDay - emp.lastPromotionDate : currentDay - emp.hiredDate

    const risk = calcTurnoverRisk(emp, marketDemand, companyGrowthRate, daysSincePromotion)
    risks.push(risk)

    if (rng.chance(risk.riskScore)) {
      quitIds.push(emp.id)
    }
  }

  // 連鎖退職: 親しい同僚が辞めたら追加リスク
  const chainQuits: string[] = []
  for (const emp of employees) {
    if (quitIds.includes(emp.id)) continue
    const hasQuittingFriend = emp.relationships.some(
      (rel) => quitIds.includes(rel.targetId) &&
        (rel.level === 'friend' || rel.level === 'close_friend'),
    )
    if (hasQuittingFriend && rng.chance(0.15)) {
      chainQuits.push(emp.id)
    }
  }

  return { quitIds: [...quitIds, ...chainQuits], risks }
}

/**
 * 引き留め施策を適用する
 */
export function applyRetentionAction(
  employee: EmployeeState,
  action: RetentionAction,
  rng: SeededRandom,
): { success: boolean; updatedMorale: EmployeeState['morale'] } {
  const effect = RETENTION_EFFECTS[action]
  const successChance = 0.5 + effect.riskReduction

  const success = rng.chance(clamp(successChance, 0.2, 0.9))

  const morale: EmployeeState['morale'] = {
    motivation: clamp(employee.morale.motivation + effect.motivationDelta * (success ? 1 : 0.3), 0, 100),
    stress: employee.morale.stress,
    satisfaction: clamp(employee.morale.satisfaction + effect.satisfactionDelta * (success ? 1 : 0.3), 0, 100),
    burnoutRisk: clamp(employee.morale.burnoutRisk + effect.burnoutDelta, 0, 100),
    growthDesire: employee.morale.growthDesire,
    belongingness: clamp(
      employee.morale.belongingness + (success ? 10 : -5), 0, 100,
    ),
  }

  return { success, updatedMorale: morale }
}
