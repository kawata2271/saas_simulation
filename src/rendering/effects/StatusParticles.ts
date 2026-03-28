/**
 * ステータス通知パーティクル
 * キャラクター上に表示するアイコンエフェクト
 */

import type { Container } from 'pixi.js'
import { Graphics, Text, TextStyle } from 'pixi.js'
import type { IsoCoord, StatusIcon } from '@game-types/rendering.js'
import { STATUS_ICONS } from '@game-types/rendering.js'
import { isoToScreen } from '../IsometricEngine.js'

/** アイコン → 絵文字マッピング */
const ICON_EMOJI: Record<StatusIcon, string> = {
  [STATUS_ICONS.IDEA]: '💡',
  [STATUS_ICONS.HIGH_PERFORMANCE]: '🔥',
  [STATUS_ICONS.FRUSTRATED]: '😤',
  [STATUS_ICONS.TIRED]: '💤',
  [STATUS_ICONS.CELEBRATING]: '🎉',
  [STATUS_ICONS.ALERT]: '❗',
  [STATUS_ICONS.CHATTING]: '💬',
}

/** アクティブなパーティクル */
interface ActiveParticle {
  readonly id: string
  text: Text
  background: Graphics
  life: number
  floatY: number
}

const TEXT_STYLE = new TextStyle({
  fontSize: 16,
  fill: 0xffffff,
})

/**
 * StatusParticles — キャラクター上のステータスアイコン管理
 */
export class StatusParticles {
  private readonly particles = new Map<string, ActiveParticle>()
  private container: Container | null = null

  /** コンテナにアタッチする */
  attach(container: Container): void {
    this.container = container
  }

  /** ステータスアイコンを表示する */
  show(characterId: string, icon: StatusIcon, position: IsoCoord): void {
    this.hide(characterId)
    if (!this.container) return

    const screen = isoToScreen(position)
    const emoji = ICON_EMOJI[icon]

    const bg = new Graphics()
    bg.roundRect(-12, -12, 24, 24, 6)
    bg.fill({ color: 0x1e1b2e, alpha: 0.8 })
    bg.x = screen.x
    bg.y = screen.y - 30
    bg.zIndex = 10000

    const text = new Text({ text: emoji, style: TEXT_STYLE })
    text.anchor.set(0.5)
    text.x = screen.x
    text.y = screen.y - 30
    text.zIndex = 10001

    this.container.addChild(bg)
    this.container.addChild(text)

    this.particles.set(characterId, {
      id: characterId,
      text,
      background: bg,
      life: 180, // 3秒（60fps）
      floatY: 0,
    })
  }

  /** ステータスアイコンを非表示にする */
  hide(characterId: string): void {
    const particle = this.particles.get(characterId)
    if (particle) {
      particle.text.destroy()
      particle.background.destroy()
      this.particles.delete(characterId)
    }
  }

  /** フレームごとの更新（フロートアニメーション） */
  update(): void {
    for (const [id, p] of this.particles) {
      p.life--
      p.floatY += 0.02
      const bobY = Math.sin(p.floatY * 4) * 2
      p.text.y += bobY * 0.1
      p.background.y += bobY * 0.1

      // フェードアウト
      if (p.life < 30) {
        const alpha = p.life / 30
        p.text.alpha = alpha
        p.background.alpha = alpha
      }

      if (p.life <= 0) {
        this.hide(id)
      }
    }
  }

  /** リソース解放 */
  destroy(): void {
    for (const [id] of this.particles) {
      this.hide(id)
    }
  }
}
