/**
 * 採用パイプラインシステム
 * チャネル選択→応募→書類選考→面接→オファー→入社
 */

import type {
  Applicant, PipelineStage, RecruitmentChannel, Department, Position,
  EmployeeStats,
} from '@game-types/employee.js'
import {
  PIPELINE_STAGES, CHANNEL_DEFINITIONS, POSITION_GRADES,
} from '@game-types/employee.js'
import type { SeededRandom } from '@utils/random.js'
import { generateName } from './NameGenerator.js'
import { clamp } from '@utils/math.js'

/** 求人情報 */
export interface JobPosting {
  readonly id: string
  readonly department: Department
  readonly position: Position
  readonly channel: RecruitmentChannel
  readonly salaryMin: number
  readonly salaryMax: number
  readonly postedDay: number
  readonly deadline: number
  active: boolean
}

/** パイプライン進行結果 */
export interface PipelineResult {
  readonly advanced: Applicant[]
  readonly rejected: Applicant[]
  readonly withdrawn: Applicant[]
  readonly hired: Applicant[]
}

/** ステージ通過率 */
const STAGE_PASS_RATES: Record<string, number> = {
  [PIPELINE_STAGES.APPLIED]: 0.6,
  [PIPELINE_STAGES.SCREENING]: 0.5,
  [PIPELINE_STAGES.INTERVIEW_1]: 0.5,
  [PIPELINE_STAGES.INTERVIEW_2]: 0.6,
  [PIPELINE_STAGES.INTERVIEW_3]: 0.7,
  [PIPELINE_STAGES.OFFER]: 0.8,
}

/** ステージ順序 */
const STAGE_ORDER: PipelineStage[] = [
  PIPELINE_STAGES.APPLIED,
  PIPELINE_STAGES.SCREENING,
  PIPELINE_STAGES.INTERVIEW_1,
  PIPELINE_STAGES.INTERVIEW_2,
  PIPELINE_STAGES.OFFER,
  PIPELINE_STAGES.ACCEPTED,
]

/**
 * RecruitmentPipeline — 採用パイプライン管理
 */
export class RecruitmentPipeline {
  private readonly postings: Map<string, JobPosting> = new Map()
  private readonly applicants: Map<string, Applicant[]> = new Map()
  private nextId = 1

  /** 求人を作成する */
  createPosting(
    department: Department,
    position: Position,
    channel: RecruitmentChannel,
    salaryMin: number,
    salaryMax: number,
    currentDay: number,
  ): JobPosting {
    const channelDef = CHANNEL_DEFINITIONS[channel]
    const posting: JobPosting = {
      id: `post_${this.nextId++}`,
      department, position, channel,
      salaryMin, salaryMax,
      postedDay: currentDay,
      deadline: currentDay + channelDef.durationDays,
      active: true,
    }
    this.postings.set(posting.id, posting)
    this.applicants.set(posting.id, [])
    return posting
  }

  /** 求人を閉じる */
  closePosting(postingId: string): void {
    const posting = this.postings.get(postingId)
    if (posting) posting.active = false
  }

  /** アクティブな求人一覧 */
  getActivePostings(): JobPosting[] {
    return [...this.postings.values()].filter((p) => p.active)
  }

  /** 求人の候補者一覧 */
  getApplicants(postingId: string): Applicant[] {
    return this.applicants.get(postingId) ?? []
  }

  /**
   * 日次更新: 応募者の自動生成
   */
  generateApplicants(
    rng: SeededRandom,
    currentDay: number,
    reputation: number,
  ): void {
    for (const posting of this.postings.values()) {
      if (!posting.active) continue
      if (currentDay > posting.deadline) {
        posting.active = false
        continue
      }

      const channelDef = CHANNEL_DEFINITIONS[posting.channel]
      const dailyRate = channelDef.volumePerMonth / 21
      const repBonus = reputation * 0.005

      if (rng.chance(dailyRate + repBonus)) {
        const applicant = this.generateApplicant(
          rng, posting, channelDef.qualityMin, channelDef.qualityMax, currentDay,
        )
        this.applicants.get(posting.id)!.push(applicant)
      }
    }
  }

  /** 候補者を1人生成する */
  private generateApplicant(
    rng: SeededRandom,
    posting: JobPosting,
    qualityMin: number,
    qualityMax: number,
    currentDay: number,
  ): Applicant {
    const grade = POSITION_GRADES[posting.position]
    const quality = rng.nextInt(qualityMin, qualityMax)

    const genStat = (): number => clamp(
      Math.round(quality * 0.8 + rng.nextInt(-15, 15) + grade * 3), 1, 100,
    )

    const stats: EmployeeStats = {
      engineering: genStat(), sales: genStat(), planning: genStat(),
      management: genStat(), creativity: genStat(), communication: genStat(),
      resilience: genStat(), loyalty: rng.nextInt(30, 80),
      growthPotential: rng.nextInt(20, 90),
    }

    // 面接前は一部のみ開示
    const revealed = new Set<keyof EmployeeStats>()

    const salaryExpect = Math.round(
      (posting.salaryMin + posting.salaryMax) / 2 *
      (0.85 + rng.next() * 0.3),
    )

    return {
      id: `app_${this.nextId++}`,
      name: generateName(rng),
      currentStage: PIPELINE_STAGES.APPLIED,
      stats,
      revealedStats: revealed,
      salaryExpectation: salaryExpect,
      otherOffers: rng.nextInt(0, 3),
      interestLevel: rng.nextInt(40, 90),
      fitScore: rng.nextInt(30, 95),
      channel: posting.channel,
      appliedDay: currentDay,
    }
  }

  /**
   * パイプラインを進行させる（面接実行）
   */
  advancePipeline(
    postingId: string,
    applicantId: string,
    rng: SeededRandom,
    interviewerSkill: number,
  ): { passed: boolean; newStage: PipelineStage; revealedStat?: keyof EmployeeStats } {
    const applicants = this.applicants.get(postingId)
    if (!applicants) return { passed: false, newStage: PIPELINE_STAGES.REJECTED }

    const applicant = applicants.find((a) => a.id === applicantId)
    if (!applicant) return { passed: false, newStage: PIPELINE_STAGES.REJECTED }

    const currentIdx = STAGE_ORDER.indexOf(applicant.currentStage)
    if (currentIdx < 0 || currentIdx >= STAGE_ORDER.length - 1) {
      return { passed: false, newStage: applicant.currentStage }
    }

    const passRate = (STAGE_PASS_RATES[applicant.currentStage] ?? 0.5)
      + (interviewerSkill - 50) * 0.003
      + applicant.fitScore * 0.002

    const passed = rng.chance(clamp(passRate, 0.1, 0.95))

    // 面接で能力値を1つ開示
    const statKeys: (keyof EmployeeStats)[] = [
      'engineering', 'sales', 'planning', 'management',
      'creativity', 'communication', 'resilience',
    ]
    const unrevealed = statKeys.filter((k) => !applicant.revealedStats.has(k))
    let revealedStat: keyof EmployeeStats | undefined
    if (unrevealed.length > 0) {
      revealedStat = rng.pick(unrevealed)
      applicant.revealedStats.add(revealedStat)
    }

    if (passed) {
      const nextStage = STAGE_ORDER[currentIdx + 1]
      applicant.currentStage = nextStage
      return { passed: true, newStage: nextStage, revealedStat }
    }

    applicant.currentStage = PIPELINE_STAGES.REJECTED
    return { passed: false, newStage: PIPELINE_STAGES.REJECTED, revealedStat }
  }

  /** オファーを出す */
  extendOffer(postingId: string, applicantId: string, _salary: number): boolean {
    const applicant = this.applicants.get(postingId)?.find((a) => a.id === applicantId)
    if (!applicant || applicant.currentStage !== PIPELINE_STAGES.OFFER) return false
    applicant.currentStage = PIPELINE_STAGES.ACCEPTED
    return true
  }

  /** 候補者の辞退 */
  withdrawApplicant(postingId: string, applicantId: string): void {
    const applicant = this.applicants.get(postingId)?.find((a) => a.id === applicantId)
    if (applicant) applicant.currentStage = PIPELINE_STAGES.WITHDRAWN
  }

  /** 採用コストを計算する */
  getHiringCost(channel: RecruitmentChannel, salary: number): number {
    const def = CHANNEL_DEFINITIONS[channel]
    if (channel === 'headhunter') {
      return Math.round(salary * 0.33) // 年俸の33%
    }
    return def.costPerHire
  }
}
