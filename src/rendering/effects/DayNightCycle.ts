/**
 * 昼夜サイクルシステム
 * ゲーム内時間に連動した照明変化・色温度制御
 */

import type { Container } from 'pixi.js'
import { Graphics } from 'pixi.js'
import type { DayNightState, TimePeriod } from '@game-types/rendering.js'
import { TIME_PERIODS } from '@game-types/rendering.js'

/** 時間帯ごとの照明設定 */
interface LightingConfig {
  brightness: number
  tint: number
  ambientColor: number
}

const LIGHTING_TABLE: Record<TimePeriod, LightingConfig> = {
  [TIME_PERIODS.DAWN]:       { brightness: 0.6,  tint: 0xffd699, ambientColor: 0x332211 },
  [TIME_PERIODS.MORNING]:    { brightness: 0.85, tint: 0xffeebb, ambientColor: 0x222222 },
  [TIME_PERIODS.AFTERNOON]:  { brightness: 1.0,  tint: 0xffffff, ambientColor: 0x111111 },
  [TIME_PERIODS.EVENING]:    { brightness: 0.75, tint: 0xff9944, ambientColor: 0x331100 },
  [TIME_PERIODS.NIGHT]:      { brightness: 0.4,  tint: 0x4466aa, ambientColor: 0x000022 },
  [TIME_PERIODS.LATE_NIGHT]: { brightness: 0.2,  tint: 0x223355, ambientColor: 0x000011 },
}

/** 時間 → 時間帯 */
function getTimePeriod(hour: number): TimePeriod {
  if (hour >= 5 && hour < 8) return TIME_PERIODS.DAWN
  if (hour >= 8 && hour < 12) return TIME_PERIODS.MORNING
  if (hour >= 12 && hour < 17) return TIME_PERIODS.AFTERNOON
  if (hour >= 17 && hour < 20) return TIME_PERIODS.EVENING
  if (hour >= 20 && hour < 23) return TIME_PERIODS.NIGHT
  return TIME_PERIODS.LATE_NIGHT
}

/** 2つの色を線形補間する */
function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return (r << 16) | (g << 8) | bl
}

/**
 * DayNightCycle — 昼夜サイクルの照明管理
 */
export class DayNightCycle {
  private overlay: Graphics | null = null
  private currentState: DayNightState
  private targetState: DayNightState

  constructor() {
    const initial = this.calcState(9)
    this.currentState = initial
    this.targetState = initial
  }

  /** PixiJSコンテナにオーバーレイを追加する */
  attach(container: Container, width: number, height: number): void {
    this.overlay = new Graphics()
    this.overlay.rect(-width, -height, width * 3, height * 3)
    this.overlay.fill({ color: 0x000000, alpha: 0 })
    this.overlay.alpha = 0
    this.overlay.zIndex = 9000
    container.addChild(this.overlay)
  }

  /** 時間を更新する（営業日内の時間を概算） */
  update(tickInDay: number): void {
    // 1ティック = 1営業日 → 日中の時間帯をシミュレート
    // tickInDay: 0-59 の範囲を 7:00-22:00 にマッピング
    const hour = 7 + (tickInDay % 60) / 60 * 15
    this.targetState = this.calcState(hour)
    this.interpolateState()
    this.applyOverlay()
  }

  /** 現在の昼夜状態を取得する */
  getState(): DayNightState {
    return this.currentState
  }

  /** 状態を計算する */
  private calcState(hour: number): DayNightState {
    const period = getTimePeriod(hour)
    const config = LIGHTING_TABLE[period]
    return {
      hour: Math.floor(hour),
      period,
      brightness: config.brightness,
      tint: config.tint,
      ambientColor: config.ambientColor,
    }
  }

  /** 現在状態をターゲットに向けて補間する */
  private interpolateState(): void {
    const t = 0.05 // 補間速度
    this.currentState = {
      hour: this.targetState.hour,
      period: this.targetState.period,
      brightness: this.currentState.brightness + (this.targetState.brightness - this.currentState.brightness) * t,
      tint: lerpColor(this.currentState.tint, this.targetState.tint, t),
      ambientColor: lerpColor(this.currentState.ambientColor, this.targetState.ambientColor, t),
    }
  }

  /** オーバーレイに反映する */
  private applyOverlay(): void {
    if (!this.overlay) return
    const darkness = 1 - this.currentState.brightness
    this.overlay.alpha = darkness * 0.6
    this.overlay.tint = this.currentState.ambientColor
  }

  /** リソース解放 */
  destroy(): void {
    if (this.overlay) {
      this.overlay.destroy()
      this.overlay = null
    }
  }
}
