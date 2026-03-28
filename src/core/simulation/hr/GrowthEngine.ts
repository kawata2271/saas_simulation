/**
 * 成長/昇進/特殊能力システム
 * 経験値蓄積、昇進審査、特殊能力発動
 */

import type { EmployeeState, Position, SpecialAbilityDef } from '@game-types/employee.js'
import {
  POSITIONS, POSITION_BASE_SALARY,
  SPECIAL_ABILITIES_CATALOG, ABILITY_RARITIES,
} from '@game-types/employee.js'
import type { SeededRandom } from '@utils/random.js'
import { clamp } from '@utils/math.js'

/** 昇進に必要な経験値テーブル */
const PROMOTION_EXP: Record<number, number> = {
  1: 100,    // intern → junior
  2: 300,    // junior → mid
  3: 500,
  4: 800,    // mid → senior
  5: 1200,
  6: 2000,   // senior → lead
  7: 3500,   // lead → manager
  8: 6000,   // manager → director
  9: 10000,  // director → VP/CXO
  10: 99999, // max
}

/** グレード → 次の職位マッピング */
const GRADE_TO_NEXT_POSITION: Record<number, Position | null> = {
  1: POSITIONS.JUNIOR,
  2: POSITIONS.MID,
  3: POSITIONS.MID,
  4: POSITIONS.SENIOR,
  5: POSITIONS.SENIOR,
  6: POSITIONS.LEAD,
  7: POSITIONS.MANAGER,
  8: POSITIONS.DIRECTOR,
  9: POSITIONS.VP,
  10: null,
}

/** レアリティ別の出現確率 */
const RARITY_CHANCES: Record<string, number> = {
  [ABILITY_RARITIES.COMMON]: 0.03,
  [ABILITY_RARITIES.RARE]: 0.01,
  [ABILITY_RARITIES.EPIC]: 0.003,
  [ABILITY_RARITIES.LEGENDARY]: 0.0005,
}

/**
 * 日次経験値を計算する
 */
export function calcDailyExp(
  employee: EmployeeState,
  workload: number,
  hasMentor: boolean,
  isOnProject: boolean,
): number {
  let exp = employee.grade * 0.5 // ベースEXP

  // プロジェクト参加ボーナス
  if (isOnProject) exp += 1.5

  // メンタリングボーナス
  if (hasMentor) exp += 0.5

  // 高負荷ボーナス（ストレスと引き換え）
  if (workload > 1.5) exp *= 1.5

  // 成長可能性補正
  exp *= 0.8 + (employee.stats.growthPotential / 100) * 0.4

  // モチベーション補正
  exp *= 0.5 + (employee.morale.motivation / 100) * 0.5

  return Math.max(0.1, exp)
}

/**
 * 昇進可能か判定する
 */
export function canPromote(employee: EmployeeState): boolean {
  const required = PROMOTION_EXP[employee.grade] ?? 99999
  if (employee.experience < required) return false
  if (employee.grade >= 10) return false
  return true
}

/**
 * 昇進を実行する
 */
export function promote(
  employee: EmployeeState,
  currentDay: number,
): EmployeeState | null {
  if (!canPromote(employee)) return null

  const nextPosition = GRADE_TO_NEXT_POSITION[employee.grade]
  if (!nextPosition) return null

  const newGrade = employee.grade + 1
  const baseSalary = POSITION_BASE_SALARY[nextPosition] ?? employee.salary
  const newSalary = Math.max(employee.salary, Math.round(baseSalary / 12))

  return {
    ...employee,
    position: nextPosition,
    grade: newGrade,
    level: newGrade,
    salary: newSalary,
    lastPromotionDate: currentDay,
    morale: {
      ...employee.morale,
      motivation: clamp(employee.morale.motivation + 20, 0, 100),
      satisfaction: clamp(employee.morale.satisfaction + 15, 0, 100),
      growthDesire: clamp(employee.morale.growthDesire - 10, 0, 100),
      belongingness: clamp(employee.morale.belongingness + 10, 0, 100),
      burnoutRisk: employee.morale.burnoutRisk,
      stress: employee.morale.stress,
    },
  }
}

/**
 * 特殊能力の抽選を行う（レベルアップ時に実行）
 */
export function rollSpecialAbility(
  rng: SeededRandom,
  existingAbilities: readonly string[],
  department: string,
): SpecialAbilityDef | null {
  // 既に3つ持っていたら抽選しない
  if (existingAbilities.length >= 3) return null

  // 部門に関連する能力を優先的に抽選
  const candidates = SPECIAL_ABILITIES_CATALOG.filter(
    (a) => !existingAbilities.includes(a.id),
  )
  if (candidates.length === 0) return null

  for (const ability of rng.shuffle(candidates)) {
    const chance = RARITY_CHANCES[ability.rarity] ?? 0.01
    // 部門マッチでボーナス
    const deptBonus = ability.effects.some((e) => e.target === department) ? 2 : 1
    if (rng.chance(chance * deptBonus)) {
      return ability
    }
  }

  return null
}

/**
 * メンタリングの効果を計算する（メンター/メンティー双方）
 */
export function calcMentoringEffect(
  mentor: EmployeeState,
  mentee: EmployeeState,
): { mentorExp: number; menteeExp: number; menteeStatBoost: number } {
  const skillGap = mentor.grade - mentee.grade
  if (skillGap <= 0) return { mentorExp: 0, menteeExp: 0, menteeStatBoost: 0 }

  const menteeExp = skillGap * 0.3 + mentor.stats.communication * 0.02
  const mentorExp = 0.2 + mentor.stats.management * 0.01
  const menteeStatBoost = clamp(
    skillGap * 0.1 * (mentor.stats.communication / 100), 0, 1,
  )

  return {
    mentorExp: Math.max(0.1, mentorExp),
    menteeExp: Math.max(0.1, menteeExp),
    menteeStatBoost,
  }
}
