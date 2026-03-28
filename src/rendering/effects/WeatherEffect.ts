/**
 * 天候エフェクトシステム
 * パーティクルベースの天候表現（晴/曇/雨/雪/嵐）
 */

import type { Container } from 'pixi.js'
import { Graphics } from 'pixi.js'
import type { WeatherType, WeatherState } from '@game-types/rendering.js'
import { WEATHER_TYPES } from '@game-types/rendering.js'
import type { SeededRandom } from '@utils/random.js'

/** 雨/雪パーティクル */
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  alpha: number
  size: number
}

/** 天候ごとのパーティクル設定 */
interface WeatherConfig {
  particleCount: number
  speedMin: number
  speedMax: number
  sizeMin: number
  sizeMax: number
  color: number
  windX: number
}

const WEATHER_CONFIGS: Record<WeatherType, WeatherConfig> = {
  [WEATHER_TYPES.CLEAR]:  { particleCount: 0, speedMin: 0, speedMax: 0, sizeMin: 0, sizeMax: 0, color: 0, windX: 0 },
  [WEATHER_TYPES.CLOUDY]: { particleCount: 0, speedMin: 0, speedMax: 0, sizeMin: 0, sizeMax: 0, color: 0, windX: 0 },
  [WEATHER_TYPES.RAIN]:   { particleCount: 150, speedMin: 8, speedMax: 14, sizeMin: 1, sizeMax: 2, color: 0x6688cc, windX: 2 },
  [WEATHER_TYPES.SNOW]:   { particleCount: 80, speedMin: 1, speedMax: 3, sizeMin: 2, sizeMax: 4, color: 0xeeeeff, windX: 0.5 },
  [WEATHER_TYPES.STORM]:  { particleCount: 250, speedMin: 12, speedMax: 20, sizeMin: 1, sizeMax: 3, color: 0x556699, windX: 6 },
}

/**
 * WeatherEffect — 天候パーティクルの描画管理
 */
export class WeatherEffect {
  private particles: Particle[] = []
  private graphics: Graphics | null = null
  private currentWeather: WeatherState
  private screenWidth = 800
  private screenHeight = 600
  private flashTimer = 0

  private readonly rng: SeededRandom

  constructor(rng: SeededRandom) {
    this.rng = rng
    this.currentWeather = {
      type: WEATHER_TYPES.CLEAR,
      intensity: 1,
      duration: 0,
    }
  }

  /** コンテナにアタッチする */
  attach(container: Container, width: number, height: number): void {
    this.screenWidth = width
    this.screenHeight = height
    this.graphics = new Graphics()
    this.graphics.zIndex = 9500
    container.addChild(this.graphics)
  }

  /** 天候を変更する */
  setWeather(type: WeatherType, intensity = 1, duration = 500): void {
    this.currentWeather = { type, intensity, duration }
    this.initParticles()
  }

  /** 天候状態を取得する */
  getWeather(): WeatherState {
    return this.currentWeather
  }

  /** パーティクルを初期化する */
  private initParticles(): void {
    const config = WEATHER_CONFIGS[this.currentWeather.type]
    const count = Math.floor(config.particleCount * this.currentWeather.intensity)
    this.particles = []

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(config, true))
    }
  }

  /** パーティクルを1つ生成する */
  private createParticle(config: WeatherConfig, randomY: boolean): Particle {
    return {
      x: this.rng.nextFloat(0, this.screenWidth),
      y: randomY ? this.rng.nextFloat(-this.screenHeight, this.screenHeight) : -10,
      vx: config.windX + this.rng.nextFloat(-0.5, 0.5),
      vy: this.rng.nextFloat(config.speedMin, config.speedMax),
      life: 1,
      alpha: this.rng.nextFloat(0.3, 0.8),
      size: this.rng.nextFloat(config.sizeMin, config.sizeMax),
    }
  }

  /** フレームごとの更新 */
  update(): void {
    if (!this.graphics) return
    if (this.currentWeather.type === WEATHER_TYPES.CLEAR ||
        this.currentWeather.type === WEATHER_TYPES.CLOUDY) {
      this.graphics.clear()
      return
    }

    const config = WEATHER_CONFIGS[this.currentWeather.type]

    // パーティクル移動
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx
      p.y += p.vy

      if (p.y > this.screenHeight || p.x > this.screenWidth + 50) {
        this.particles[i] = this.createParticle(config, false)
      }
    }

    // 嵐の稲妻フラッシュ
    if (this.currentWeather.type === WEATHER_TYPES.STORM) {
      this.flashTimer++
      if (this.flashTimer > 120 && this.rng.chance(0.01)) {
        this.flashTimer = 0
        // フラッシュ効果は alpha で表現
        this.graphics.alpha = 1.5
        setTimeout(() => {
          if (this.graphics) this.graphics.alpha = 1
        }, 80)
      }
    }

    // 描画
    this.graphics.clear()
    for (const p of this.particles) {
      if (this.currentWeather.type === WEATHER_TYPES.SNOW) {
        this.graphics.circle(p.x, p.y, p.size)
        this.graphics.fill({ color: config.color, alpha: p.alpha })
      } else {
        // 雨は縦線
        this.graphics.moveTo(p.x, p.y)
        this.graphics.lineTo(p.x + p.vx * 0.5, p.y + p.vy * 1.5)
        this.graphics.stroke({ color: config.color, width: p.size, alpha: p.alpha })
      }
    }

    // 持続時間
    if (this.currentWeather.duration > 0) {
      this.currentWeather = {
        ...this.currentWeather,
        duration: this.currentWeather.duration - 1,
      }
      if (this.currentWeather.duration <= 0) {
        this.setWeather(WEATHER_TYPES.CLEAR)
      }
    }
  }

  /** リソース解放 */
  destroy(): void {
    this.particles = []
    if (this.graphics) {
      this.graphics.destroy()
      this.graphics = null
    }
  }
}
