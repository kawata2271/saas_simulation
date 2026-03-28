/**
 * 市場/競合シミュレーション
 * TAM/SAM/SOM動的計算、競合AI、マクロ経済サイクル
 */

import type { SeededRandom } from '@utils/random.js'
import { clamp } from '@utils/math.js'

// ─── 経済フェーズ ───

export const ECONOMIC_PHASES = {
  BOOM: 'boom',
  OVERHEAT: 'overheat',
  STAGNATION: 'stagnation',
  RECESSION: 'recession',
  RECOVERY: 'recovery',
} as const satisfies Record<string, string>

export type EconomicPhase = (typeof ECONOMIC_PHASES)[keyof typeof ECONOMIC_PHASES]

/** フェーズの遷移順序 */
const PHASE_ORDER: EconomicPhase[] = [
  ECONOMIC_PHASES.BOOM,
  ECONOMIC_PHASES.OVERHEAT,
  ECONOMIC_PHASES.STAGNATION,
  ECONOMIC_PHASES.RECESSION,
  ECONOMIC_PHASES.RECOVERY,
]

/** フェーズごとの影響係数 */
const PHASE_EFFECTS: Record<EconomicPhase, {
  cacMultiplier: number; fundingEase: number; valuationMultiplier: number; churnModifier: number
}> = {
  [ECONOMIC_PHASES.BOOM]:       { cacMultiplier: 0.8, fundingEase: 1.3, valuationMultiplier: 1.2, churnModifier: 0.9 },
  [ECONOMIC_PHASES.OVERHEAT]:   { cacMultiplier: 1.1, fundingEase: 1.0, valuationMultiplier: 1.1, churnModifier: 0.95 },
  [ECONOMIC_PHASES.STAGNATION]: { cacMultiplier: 1.2, fundingEase: 0.8, valuationMultiplier: 0.9, churnModifier: 1.1 },
  [ECONOMIC_PHASES.RECESSION]:  { cacMultiplier: 1.5, fundingEase: 0.5, valuationMultiplier: 0.7, churnModifier: 1.3 },
  [ECONOMIC_PHASES.RECOVERY]:   { cacMultiplier: 1.0, fundingEase: 1.1, valuationMultiplier: 1.0, churnModifier: 1.0 },
}

// ─── 競合 ───

export const COMPETITOR_TYPES = {
  STARTUP: 'startup',
  SCALEUP: 'scaleup',
  ENTERPRISE: 'enterprise',
  BIGTECH: 'bigtech',
} as const satisfies Record<string, string>

export type CompetitorType = (typeof COMPETITOR_TYPES)[keyof typeof COMPETITOR_TYPES]

export interface Competitor {
  readonly id: string
  readonly name: string
  readonly type: CompetitorType
  marketShare: number
  productScore: number
  aggression: number
  readonly strengths: readonly string[]
}

/** 競合企業名テンプレート */
const COMPETITOR_NAMES: Record<CompetitorType, readonly string[]> = {
  [COMPETITOR_TYPES.STARTUP]:    ['NovaSaaS', 'CloudSpark', 'ZenithApp', 'ByteFlow', 'PulseLab'],
  [COMPETITOR_TYPES.SCALEUP]:    ['ScaleTech', 'GrowthStack', 'DataBridge', 'FlexiCloud', 'VeloSys'],
  [COMPETITOR_TYPES.ENTERPRISE]: ['EnterpriseCorp', 'SynergyPlatform', 'OmniSuite', 'CoreLogic'],
  [COMPETITOR_TYPES.BIGTECH]:    ['TechGiant Cloud', 'MegaCorp SaaS', 'GlobalTech Platform'],
}

// ─── 市場トレンド ───

export interface MarketTrend {
  readonly id: string
  readonly name: string
  strength: number
  duration: number
}

const TREND_POOL = [
  'AI/ML', 'ノーコード', 'セキュリティ', 'リモートワーク', 'ESG',
  'DX推進', 'ブロックチェーン', 'IoT', 'エッジコンピューティング',
  '量子コンピューティング', 'サステナビリティ', 'メタバース',
]

/**
 * MarketSimulation — 市場環境の動的シミュレーション
 */
export class MarketSimulation {
  private tam: number
  private sam: number
  private som: number
  private readonly growthRate: number
  private phase: EconomicPhase
  private phaseTicksRemaining: number
  private readonly competitors: Competitor[] = []
  private readonly trends: MarketTrend[] = []
  private readonly rng: SeededRandom

  constructor(rng: SeededRandom, _industry: string) {
    this.rng = rng
    this.tam = 500000 + rng.nextInt(0, 500000) // 50-100億円市場
    this.sam = Math.round(this.tam * 0.3)
    this.som = Math.round(this.sam * 0.1)
    this.growthRate = 0.1 + rng.next() * 0.2 // 10-30%年成長
    this.phase = ECONOMIC_PHASES.BOOM
    this.phaseTicksRemaining = rng.nextInt(120, 250) // 6-12ヶ月

    this.initCompetitors()
    this.initTrends()
  }

  /** TAM/SAM/SOMを取得する */
  getMarketSize(): { tam: number; sam: number; som: number } {
    return { tam: this.tam, sam: this.sam, som: this.som }
  }

  /** 現在の経済フェーズを取得する */
  getPhase(): EconomicPhase {
    return this.phase
  }

  /** フェーズの影響係数を取得する */
  getPhaseEffects(): typeof PHASE_EFFECTS[EconomicPhase] {
    return PHASE_EFFECTS[this.phase]
  }

  /** 競合一覧を取得する */
  getCompetitors(): readonly Competitor[] {
    return this.competitors
  }

  /** トレンド一覧を取得する */
  getTrends(): readonly MarketTrend[] {
    return this.trends
  }

  /** 市場成長率を取得する */
  getGrowthRate(): number {
    return this.growthRate
  }

  /** 競合数を取得する */
  getCompetitorCount(): number {
    return this.competitors.length
  }

  /**
   * 四半期ごとの更新
   */
  updateQuarterly(playerARR: number, playerProductScore: number): void {
    // 市場成長
    const quarterGrowth = 1 + this.growthRate / 4
    this.tam = Math.round(this.tam * quarterGrowth)
    this.sam = Math.round(this.sam * quarterGrowth)
    this.som = Math.round(this.som * quarterGrowth * 1.05)

    // 経済サイクル
    this.phaseTicksRemaining -= 63 // ~1四半期
    if (this.phaseTicksRemaining <= 0) {
      this.advancePhase()
    }

    // 競合の行動
    this.updateCompetitors(playerARR, playerProductScore)

    // トレンド更新
    this.updateTrends()
  }

  /** 経済フェーズを進める */
  private advancePhase(): void {
    const currentIdx = PHASE_ORDER.indexOf(this.phase)
    const nextIdx = (currentIdx + 1) % PHASE_ORDER.length
    this.phase = PHASE_ORDER[nextIdx]
    this.phaseTicksRemaining = this.rng.nextInt(120, 250)
  }

  /** 競合企業を初期化する */
  private initCompetitors(): void {
    const count = this.rng.nextInt(3, 6)
    const types: CompetitorType[] = [
      COMPETITOR_TYPES.STARTUP,
      COMPETITOR_TYPES.STARTUP,
      COMPETITOR_TYPES.SCALEUP,
      COMPETITOR_TYPES.ENTERPRISE,
      COMPETITOR_TYPES.BIGTECH,
    ]

    for (let i = 0; i < count; i++) {
      const type = types[i % types.length]
      const names = COMPETITOR_NAMES[type]
      this.competitors.push({
        id: `comp_${i}`,
        name: this.rng.pick(names),
        type,
        marketShare: this.rng.nextFloat(0.02, 0.2),
        productScore: this.rng.nextInt(20, 70),
        aggression: this.rng.nextInt(20, 80),
        strengths: this.rng.shuffle(['価格', '品質', 'ブランド', '機能', 'サポート']).slice(0, 2),
      })
    }
  }

  /** 競合の行動を更新する */
  private updateCompetitors(_playerARR: number, playerProductScore: number): void {
    for (const comp of this.competitors) {
      // プロダクトスコア成長
      comp.productScore = clamp(
        comp.productScore + this.rng.nextInt(-3, 5), 10, 95,
      )

      // プレイヤーが強い場合、攻撃性が上がる
      if (playerProductScore > comp.productScore) {
        comp.aggression = clamp(comp.aggression + 2, 0, 100)
      }

      // 市場シェアの微変動
      comp.marketShare = clamp(
        comp.marketShare + this.rng.nextFloat(-0.01, 0.01), 0.01, 0.4,
      )
    }

    // 低確率で新規参入/退場
    if (this.rng.chance(0.05) && this.competitors.length < 8) {
      const type = this.rng.pick(Object.values(COMPETITOR_TYPES))
      const names = COMPETITOR_NAMES[type]
      this.competitors.push({
        id: `comp_new_${Date.now()}`,
        name: this.rng.pick(names),
        type,
        marketShare: 0.01,
        productScore: this.rng.nextInt(15, 40),
        aggression: this.rng.nextInt(40, 90),
        strengths: [this.rng.pick(['AI', '価格', '速度'])],
      })
    }

    if (this.rng.chance(0.03) && this.competitors.length > 2) {
      const weakest = this.competitors.reduce((a, b) =>
        a.marketShare < b.marketShare ? a : b,
      )
      const idx = this.competitors.indexOf(weakest)
      if (idx >= 0) this.competitors.splice(idx, 1)
    }
  }

  /** トレンドを初期化する */
  private initTrends(): void {
    const count = this.rng.nextInt(2, 4)
    const selected = this.rng.shuffle([...TREND_POOL]).slice(0, count)
    for (const name of selected) {
      this.trends.push({
        id: `trend_${name}`,
        name,
        strength: this.rng.nextFloat(0.3, 0.8),
        duration: this.rng.nextInt(120, 500),
      })
    }
  }

  /** トレンドを更新する */
  private updateTrends(): void {
    for (let i = this.trends.length - 1; i >= 0; i--) {
      this.trends[i].duration -= 63
      this.trends[i].strength = clamp(
        this.trends[i].strength + this.rng.nextFloat(-0.05, 0.05), 0.1, 1.0,
      )
      if (this.trends[i].duration <= 0) {
        this.trends.splice(i, 1)
      }
    }

    // 新トレンド追加
    if (this.rng.chance(0.15) && this.trends.length < 5) {
      const available = TREND_POOL.filter(
        (t) => !this.trends.some((tr) => tr.name === t),
      )
      if (available.length > 0) {
        this.trends.push({
          id: `trend_${this.rng.pick(available)}`,
          name: this.rng.pick(available),
          strength: this.rng.nextFloat(0.3, 0.7),
          duration: this.rng.nextInt(120, 500),
        })
      }
    }
  }
}
