/**
 * シミュレーション統合マネージャー
 * 全サブシステムを統括し、ティックごとの更新を調整する
 */

import type { CompanyFoundingParams } from '@game-types/company.js'
import type { GameDate } from '@game-types/game.js'
import type { EventBus } from '@core/engine/EventBus.js'
import { CompanyManager } from './company/CompanyManager.js'
import { HRManager } from './hr/HRManager.js'
import { ProductManager } from './product/ProductManager.js'
import { SalesManager } from './sales/SalesManager.js'
import { FinanceManager } from './finance/FinanceManager.js'
import { MarketSimulation } from './market/MarketSimulation.js'
import { EventEngine } from '@core/event/EventEngine.js'
import type { GameStateSnapshot } from '@core/event/EventEngine.js'
import { ALL_EVENTS } from '@core/event/events/index.js'
import { FINANCE_CONSTANTS } from '@core/data/constants.js'
import { SeededRandom } from '@utils/random.js'

/** シミュレーション全体のスナップショット */
export interface SimulationSnapshot {
  readonly cash: number
  readonly valuation: number
  readonly headcount: number
  readonly mrr: number
  readonly arr: number
  readonly activeCustomers: number
  readonly productScore: number
  readonly techDebt: number
  readonly bugCount: number
  readonly releasedFeatures: number
  readonly reputation: number
  readonly stage: string
  readonly economicPhase: string
  readonly competitorCount: number
  readonly activeEventCount: number
}

/**
 * SimulationManager — ゲームのコアループを実行する
 */
export class SimulationManager {
  readonly company: CompanyManager
  readonly hr: HRManager
  readonly product: ProductManager
  readonly sales: SalesManager
  finance: FinanceManager
  readonly market: MarketSimulation
  readonly events: EventEngine

  private rng: SeededRandom
  private readonly eventBus: EventBus
  private lastMonth = 0
  private lastQuarter = 0
  private initialized = false

  constructor(eventBus: EventBus, seed?: number) {
    this.eventBus = eventBus
    this.rng = new SeededRandom(seed ?? Date.now())
    this.company = new CompanyManager()
    this.hr = new HRManager()
    this.product = new ProductManager()
    this.sales = new SalesManager()
    this.finance = new FinanceManager(FINANCE_CONSTANTS.INITIAL_CASH)
    this.market = new MarketSimulation(this.rng.fork('market'), 'horizontal_saas')
    this.events = new EventEngine(eventBus, this.rng.fork('events'))
    this.events.registerEvents(ALL_EVENTS)
  }

  /** ゲームが初期化済みかどうか */
  isInitialized(): boolean {
    return this.initialized
  }

  /** 会社を設立してシミュレーションを開始する */
  foundCompany(params: CompanyFoundingParams, dayNumber: number): void {
    this.company.found(params, dayNumber)
    this.finance = new FinanceManager(params.initialCash)
    this.initialized = true
    this.eventBus.emit('company:founded', {
      companyId: this.company.getState()!.id,
    })
  }

  /** 採用候補者を取得する */
  getCandidates(): ReturnType<HRManager['getCandidates']> {
    return this.hr.getCandidates()
  }

  /** 候補者を採用する */
  hireCandidate(candidateId: string, dayNumber: number): boolean {
    const emp = this.hr.hire(candidateId, dayNumber)
    if (!emp) return false
    this.eventBus.emit('employee:hired', {
      employeeId: emp.id,
      department: emp.department,
      salary: emp.salary,
    })
    return true
  }

  /** 従業員を解雇する */
  fireEmployee(employeeId: string): boolean {
    return this.hr.fire(employeeId)
  }

  /** 機能開発を開始する */
  startFeature(name: string, complexity: number): boolean {
    return this.product.startFeature(name, complexity) !== null
  }

  /** 完成した機能をリリースする */
  releaseFeatures(): void {
    const result = this.product.releaseFeatures(this.rng)
    for (const feat of result.released) {
      this.eventBus.emit('product:released', { version: feat.name, quality: feat.quality })
    }
  }

  /** マーケティング予算を設定する */
  setMarketingBudget(budget: number): void {
    this.sales.setMarketingBudget(budget)
  }

  /**
   * ティックごとの更新（1営業日）
   */
  updateTick(date: GameDate): SimulationSnapshot {
    if (!this.initialized) return this.getSnapshot()

    const company = this.company.getState()!
    const dayNumber = date.totalDays

    // 候補者プール更新
    this.hr.refreshCandidates(this.rng, dayNumber, company.reputation)

    // 従業員の日次更新（感情・退職）
    const workload = this.calcWorkload()
    const cultureSat = this.calcCultureSatisfaction()
    const quitIds = this.hr.updateDaily(this.rng, dayNumber, workload, cultureSat)
    for (const id of quitIds) {
      this.eventBus.emit('employee:quit', { employeeId: id, reason: 'voluntary' })
    }

    // プロダクト開発の日次更新
    const deptCounts = this.hr.getHeadcountByDept()
    const engineerCount = (deptCounts['engineering'] ?? 0) + 1 // 創業者も含む
    const avgStats = this.hr.getAverageStats()
    this.product.updateDaily(
      engineerCount,
      avgStats.engineering || 50,
      avgStats.planning || 50,
      this.rng,
    )

    // 営業の日次更新
    const salesCount = deptCounts['sales'] ?? 0
    this.sales.updateDaily(
      salesCount,
      this.product.getProductScore(),
      company.reputation,
      this.rng,
    )

    // 財務の日次経費処理
    this.updateFinanceCosts()
    const dailyCost = this.finance.getMonthlyTotalCost() / 21
    this.finance.recordDailyExpense(dailyCost)

    // 月次処理
    if (date.month !== this.lastMonth) {
      this.processMonthEnd(date)
      this.lastMonth = date.month
    }

    // 四半期処理
    if (date.quarter !== this.lastQuarter) {
      this.processQuarterEnd(date)
      this.lastQuarter = date.quarter
    }

    // イベント評価
    this.evaluateEvents(date)

    // 会社状態更新
    this.company.updateDaily(
      this.hr.getHeadcount() + 1, // +1 for founder
      company.reputation,
    )

    // ステージ進行チェック
    this.company.checkStageProgression(this.sales.getARR())

    return this.getSnapshot()
  }

  /** 月末処理 */
  private processMonthEnd(_date: GameDate): void {
    const salesResult = this.sales.updateMonthly(
      this.product.getProductScore(),
      this.product.getBugCount(),
      this.rng,
    )
    const funnel = this.sales.getFunnelStats()
    const company = this.company.getState()!

    this.finance.closeMonth({
      mrr: this.sales.getMRR(),
      newMRR: salesResult.revenue > 0 ? Math.round(salesResult.revenue * 0.3) : 0,
      expansionMRR: Math.round(salesResult.revenue * 0.05),
      contractionMRR: 0,
      churnedMRR: Math.round(salesResult.churned * this.sales.getARPU()),
      activeCustomers: funnel.activeCustomers,
      churnedCustomers: salesResult.churned,
      newCustomers: funnel.newCustomersThisMonth,
      headcount: this.hr.getHeadcount() + 1,
      stage: company.stage,
    })

    // 自動リリース
    this.releaseFeatures()
  }

  /** 四半期末処理 */
  private processQuarterEnd(date: GameDate): void {
    const company = this.company.getState()!
    this.finance.closeQuarter(company.stage)

    // 市場シミュレーション更新
    this.market.updateQuarterly(
      this.sales.getARR(),
      this.product.getProductScore(),
    )

    this.eventBus.emit('quarter-end', {
      quarter: date.quarter,
      year: date.year,
    })
  }

  /** イベント評価 */
  private evaluateEvents(date: GameDate): void {
    const company = this.company.getState()!
    const snapshot: GameStateSnapshot = {
      tick: date.totalDays,
      employees: this.hr.getHeadcount(),
      cash: this.finance.getCash(),
      mrr: this.sales.getMRR(),
      arr: this.sales.getARR(),
      runway: this.finance.getLastMetrics()?.runway ?? 999,
      productScore: this.product.getProductScore(),
      techDebt: this.product.getTechDebt(),
      bugCount: this.product.getBugCount(),
      activeCustomers: this.sales.getActiveCustomers(),
      reputation: company.reputation,
      stage: company.stage,
      companyAge: date.totalDays - company.foundedDate,
      headcount: this.hr.getHeadcount() + 1,
      flags: new Set(),
      completedEventIds: new Set(this.events.getHistory().map((h) => h.eventId)),
    }
    this.events.evaluate(snapshot)
  }

  /** 財務コストを更新する */
  private updateFinanceCosts(): void {
    const company = this.company.getState()!
    const officeRent = FINANCE_CONSTANTS.OFFICE_RENT[company.officeLevel] ?? 0
    const serverCost = FINANCE_CONSTANTS.SERVER_COST_BASE +
      this.sales.getActiveCustomers() * FINANCE_CONSTANTS.SERVER_COST_PER_CUSTOMER

    this.finance.setMonthlyTransaction({
      personnelCost: this.hr.calcMonthlyPayroll(),
      officeCost: officeRent,
      hostingCost: Math.round(serverCost),
      salesMarketingCost: this.sales.getMarketingBudget(),
    })
  }

  /** ワークロードを計算する（1.0 = 通常） */
  private calcWorkload(): number {
    const headcount = this.hr.getHeadcount() + 1
    const features = this.product.getFeatures()
      .filter((f) => f.state === 'in_progress').length
    const bugs = this.product.getBugCount()
    return Math.min(2.0, (features * 3 + bugs * 2) / Math.max(1, headcount))
  }

  /** 企業文化からの満足度を計算する */
  private calcCultureSatisfaction(): number {
    const company = this.company.getState()
    if (!company) return 50
    const c = company.culture
    return (c.workLifeBalance + c.teamwork + c.transparency) / 3
  }

  /** 現在のスナップショットを取得する */
  getSnapshot(): SimulationSnapshot {
    const company = this.company.getState()
    return {
      cash: Math.round(this.finance.getCash()),
      valuation: Math.round(
        this.sales.getARR() * 10,
      ),
      headcount: this.hr.getHeadcount() + 1,
      mrr: this.sales.getMRR(),
      arr: this.sales.getARR(),
      activeCustomers: this.sales.getActiveCustomers(),
      productScore: this.product.getProductScore(),
      techDebt: this.product.getTechDebt(),
      bugCount: this.product.getBugCount(),
      releasedFeatures: this.product.getReleasedFeatureCount(),
      reputation: company?.reputation ?? 0,
      stage: company?.stage ?? 'pre_seed',
      economicPhase: this.market.getPhase(),
      competitorCount: this.market.getCompetitorCount(),
      activeEventCount: this.events.getActiveEvents().length,
    }
  }
}
