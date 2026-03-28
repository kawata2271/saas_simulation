/**
 * 人事管理システム
 * 採用候補者生成、雇用、退職、給与計算、感情変動
 */

import type { EmployeeState, EmployeeMood, Candidate, Department, Grade } from '@game-types/employee.js'
import { DEPARTMENTS, GRADES, GRADE_LEVEL_RANGES } from '@game-types/employee.js'
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
const GRADE_LIST: Grade[] = [
  GRADES.JUNIOR,
  GRADES.MID,
  GRADES.SENIOR,
  GRADES.LEAD,
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

    const baseSalary = HR_CONSTANTS.BASE_SALARY[grade]
    const variance = 1 + (rng.next() - 0.5) * HR_CONSTANTS.SALARY_VARIANCE * 2
    const expectedSalary = Math.round(baseSalary * variance)

    return {
      id: `cand_${dayNumber}_${this.nextEmployeeId++}`,
      name: generateName(rng),
      department: dept,
      grade,
      level,
      stats: {
        technical: rng.nextInt(level * 8, Math.min(level * 12 + 10, 100)),
        sales: rng.nextInt(level * 5, Math.min(level * 10 + 10, 100)),
        planning: rng.nextInt(level * 5, Math.min(level * 10 + 10, 100)),
        management: rng.nextInt(level * 3, Math.min(level * 8 + 5, 100)),
        loyalty: rng.nextInt(30, 80),
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
      grade: candidate.grade,
      level: candidate.level,
      stats: candidate.stats,
      mood: {
        motivation: 80,
        stress: 10,
        growthDesire: 60,
        satisfaction: 70,
      },
      salary: candidate.expectedSalary,
      hiredDate: dayNumber,
      specialAbilities: candidate.specialAbilities,
      isRemote: false,
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
      const newMood = this.updateMood(emp.mood, workload, cultureSatisfaction)
      const updatedEmp = { ...emp, mood: newMood }

      // 退職判定
      const quitRate = calcQuitRate(
        newMood.motivation,
        newMood.stress,
        newMood.satisfaction,
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
  private updateMood(
    mood: EmployeeMood,
    workload: number,
    cultureSatisfaction: number,
  ): EmployeeMood {
    const stressDelta = workload > 1.2
      ? HR_CONSTANTS.STRESS_ACCUMULATION * workload
      : -HR_CONSTANTS.STRESS_ACCUMULATION * 0.5

    const motivDelta = cultureSatisfaction > 50
      ? HR_CONSTANTS.MOTIVATION_RECOVERY
      : -HR_CONSTANTS.MOTIVATION_RECOVERY * 0.5

    return {
      motivation: clamp(mood.motivation + motivDelta, 0, 100),
      stress: clamp(mood.stress + stressDelta, 0, 100),
      growthDesire: mood.growthDesire,
      satisfaction: clamp(
        mood.satisfaction + (cultureSatisfaction - 50) * 0.01,
        0,
        100,
      ),
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
  getAverageStats(): { technical: number; sales: number; planning: number } {
    if (this.employees.size === 0) {
      return { technical: 0, sales: 0, planning: 0 }
    }
    let tech = 0, sales = 0, plan = 0
    for (const emp of this.employees.values()) {
      tech += emp.stats.technical
      sales += emp.stats.sales
      plan += emp.stats.planning
    }
    const n = this.employees.size
    return {
      technical: Math.round(tech / n),
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
