/**
 * 人事管理システム
 * 採用候補者生成、雇用、退職、給与計算、感情変動
 */

import type { EmployeeState, EmployeeMorale, Candidate, Department, Position } from '@game-types/employee.js'
import { DEPARTMENTS, POSITIONS, GRADE_LEVEL_RANGES, POSITION_BASE_SALARY } from '@game-types/employee.js'
import type { SeededRandom } from '@utils/random.js'
import { HR_CONSTANTS } from '@core/data/constants.js'
import { calcQuitRate } from '@core/data/formulas.js'
import { clamp } from '@utils/math.js'
import { generateName } from './NameGenerator.js'

/** 部門リスト（採用対象） */
const HIREABLE_DEPARTMENTS: Department[] = [
  DEPARTMENTS.ENGINEERING,
  DEPARTMENTS.PRODUCT,
  DEPARTMENTS.SALES,
  DEPARTMENTS.MARKETING,
  DEPARTMENTS.CUSTOMER_SUCCESS,
]

/** グレードリスト */
const GRADE_LIST: Position[] = [
  POSITIONS.JUNIOR,
  POSITIONS.MID,
  POSITIONS.SENIOR,
  POSITIONS.LEAD,
]

/**
 * HRManager — 人事全般を管理する
 */
export class HRManager {
  private employees: Map<string, EmployeeState> = new Map()
  private candidates: Candidate[] = []
  private lastCandidateRefresh = 0
  private nextEmployeeId = 1

  /** 全従業員を取得する */
  getEmployees(): EmployeeState[] {
    return [...this.employees.values()]
  }

  /** 従業員数を取得する */
  getHeadcount(): number {
    return this.employees.size
  }

  /** 部門別従業員数を取得する */
  getHeadcountByDept(): Record<string, number> {
    const counts: Record<string, number> = {}
    for (const emp of this.employees.values()) {
      counts[emp.department] = (counts[emp.department] ?? 0) + 1
    }
    return counts
  }

  /** 候補者一覧を取得する */
  getCandidates(): Candidate[] {
    return [...this.candidates]
  }

  /** 候補者プールを更新する */
  refreshCandidates(rng: SeededRandom, dayNumber: number, reputation: number): void {
    if (dayNumber - this.lastCandidateRefresh < HR_CONSTANTS.CANDIDATE_REFRESH_DAYS) return
    this.lastCandidateRefresh = dayNumber
    this.candidates = []

    for (let i = 0; i < HR_CONSTANTS.CANDIDATE_POOL_SIZE; i++) {
      this.candidates.push(this.generateCandidate(rng, dayNumber, reputation))
    }
  }

  /** 候補者を1人生成する */
  private generateCandidate(
    rng: SeededRandom,
    dayNumber: number,
    _reputation: number,
  ): Candidate {
    const dept = rng.pick(HIREABLE_DEPARTMENTS)
    const grade = rng.pick(GRADE_LIST)
    const range = GRADE_LEVEL_RANGES[grade]
    const level = rng.nextInt(range.min, range.max)

    const baseSalary = POSITION_BASE_SALARY[grade] / 12
    const variance = 1 + (rng.next() - 0.5) * HR_CONSTANTS.SALARY_VARIANCE * 2
    const expectedSalary = Math.round(baseSalary * variance)

    return {
      id: `cand_${dayNumber}_${this.nextEmployeeId++}`,
      name: generateName(rng),
      department: dept,
      grade,
      level,
      stats: {
        engineering: rng.nextInt(level * 8, Math.min(level * 12 + 10, 100)),
        sales: rng.nextInt(level * 5, Math.min(level * 10 + 10, 100)),
        planning: rng.nextInt(level * 5, Math.min(level * 10 + 10, 100)),
        management: rng.nextInt(level * 3, Math.min(level * 8 + 5, 100)),
        creativity: rng.nextInt(level * 4, Math.min(level * 10 + 10, 100)),
        communication: rng.nextInt(level * 4, Math.min(level * 10 + 10, 100)),
        resilience: rng.nextInt(level * 4, Math.min(level * 10 + 10, 100)),
        loyalty: rng.nextInt(30, 80),
        growthPotential: rng.nextInt(20, 90),
      },
      expectedSalary,
      specialAbilities: [],
      availableUntil: dayNumber + 30,
    }
  }

  /** 候補者を採用する */
  hire(candidateId: string, dayNumber: number): EmployeeState | null {
    const idx = this.candidates.findIndex((c) => c.id === candidateId)
    if (idx === -1) return null

    const candidate = this.candidates[idx]
    this.candidates.splice(idx, 1)

    const employee: EmployeeState = {
      id: `emp_${this.nextEmployeeId++}`,
      name: candidate.name,
      department: candidate.department,
      position: candidate.grade,
      grade: GRADE_LEVEL_RANGES[candidate.grade].min,
      level: candidate.level,
      stats: candidate.stats,
      morale: {
        motivation: 80,
        stress: 10,
        growthDesire: 60,
        satisfaction: 70,
        burnoutRisk: 10,
        belongingness: 60,
      },
      salary: candidate.expectedSalary,
      hiredDate: dayNumber,
      specialAbilities: candidate.specialAbilities,
      isRemote: false,
      experience: 0,
      relationships: [],
      mentorId: null,
      managerId: null,
      turnoverFlag: 'none',
      lastPromotionDate: null,
      stockOptions: 0,
    }

    this.employees.set(employee.id, employee)
    return employee
  }

  /** 従業員を解雇する */
  fire(employeeId: string): boolean {
    return this.employees.delete(employeeId)
  }

  /** 日次更新: 感情変動と退職判定 */
  updateDaily(
    rng: SeededRandom,
    dayNumber: number,
    workload: number,
    cultureSatisfaction: number,
  ): string[] {
    const quitIds: string[] = []

    for (const [id, emp] of this.employees) {
      // 感情変動
      const newMorale = this.updateMorale(emp.morale, workload, cultureSatisfaction)
      const updatedEmp = { ...emp, morale: newMorale }

      // 退職判定
      const quitRate = calcQuitRate(
        newMorale.motivation,
        newMorale.stress,
        newMorale.satisfaction,
      )
      if (rng.chance(quitRate)) {
        quitIds.push(id)
        this.employees.delete(id)
        continue
      }

      // 期限切れ候補者の除去もここで（別系統だが）
      this.employees.set(id, updatedEmp)
    }

    // 期限切れ候補者を除去
    this.candidates = this.candidates.filter((c) => c.availableUntil > dayNumber)

    return quitIds
  }

  /** 感情を更新する */
  private updateMorale(
    morale: EmployeeMorale,
    workload: number,
    cultureSatisfaction: number,
  ): EmployeeMorale {
    const stressDelta = workload > 1.2
      ? HR_CONSTANTS.STRESS_ACCUMULATION * workload
      : -HR_CONSTANTS.STRESS_ACCUMULATION * 0.5

    const motivDelta = cultureSatisfaction > 50
      ? HR_CONSTANTS.MOTIVATION_RECOVERY
      : -HR_CONSTANTS.MOTIVATION_RECOVERY * 0.5

    return {
      motivation: clamp(morale.motivation + motivDelta, 0, 100),
      stress: clamp(morale.stress + stressDelta, 0, 100),
      growthDesire: morale.growthDesire,
      satisfaction: clamp(
        morale.satisfaction + (cultureSatisfaction - 50) * 0.01,
        0,
        100,
      ),
      burnoutRisk: morale.burnoutRisk,
      belongingness: morale.belongingness,
    }
  }

  /** 月次給与総額を計算する（万円） */
  calcMonthlyPayroll(): number {
    let total = 0
    for (const emp of this.employees.values()) {
      total += emp.salary
    }
    return total
  }

  /** 従業員の平均能力値を計算する */
  getAverageStats(): { engineering: number; sales: number; planning: number } {
    if (this.employees.size === 0) {
      return { engineering: 0, sales: 0, planning: 0 }
    }
    let tech = 0, sales = 0, plan = 0
    for (const emp of this.employees.values()) {
      tech += emp.stats.engineering
      sales += emp.stats.sales
      plan += emp.stats.planning
    }
    const n = this.employees.size
    return {
      engineering: Math.round(tech / n),
      sales: Math.round(sales / n),
      planning: Math.round(plan / n),
    }
  }

  /** 状態を復元する */
  restore(employees: EmployeeState[], candidates: Candidate[]): void {
    this.employees.clear()
    for (const emp of employees) {
      this.employees.set(emp.id, emp)
    }
    this.candidates = [...candidates]
  }
}
