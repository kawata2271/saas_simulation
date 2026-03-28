/**
 * オーディオマネージャー
 * Howler.jsを使用したBGM/SE管理（Phase 0では基盤のみ、音声ファイルはPhase 3で追加）
 */

import { Howl } from 'howler'

/** BGMトラック定義 */
interface MusicTrack {
  readonly id: string
  readonly src: string[]
  readonly volume: number
  readonly loop: boolean
}

/**
 * AudioManager — BGMとSEの再生を管理する
 */
export class AudioManager {
  private bgm: Howl | null = null
  private readonly sfxPool = new Map<string, Howl>()
  private masterVolume = 0.8
  private bgmVolume = 0.6
  private seVolume = 0.8
  private muted = false

  /** マスター音量を設定する */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume))
    this.updateVolumes()
  }

  /** BGM音量を設定する */
  setBgmVolume(volume: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, volume))
    this.updateVolumes()
  }

  /** SE音量を設定する */
  setSeVolume(volume: number): void {
    this.seVolume = Math.max(0, Math.min(1, volume))
  }

  /** ミュート切り替え */
  toggleMute(): boolean {
    this.muted = !this.muted
    if (this.bgm) {
      this.bgm.mute(this.muted)
    }
    return this.muted
  }

  /** BGMを再生する */
  playBGM(track: MusicTrack): void {
    this.stopBGM()
    this.bgm = new Howl({
      src: track.src,
      volume: track.volume * this.bgmVolume * this.masterVolume,
      loop: track.loop,
      html5: true,
    })
    this.bgm.play()
  }

  /** BGMを停止する */
  stopBGM(): void {
    if (this.bgm) {
      this.bgm.fade(this.bgm.volume(), 0, 500)
      const ref = this.bgm
      setTimeout(() => {
        ref.stop()
        ref.unload()
      }, 500)
      this.bgm = null
    }
  }

  /** SEを登録する */
  registerSFX(id: string, src: string[]): void {
    if (this.sfxPool.has(id)) return
    this.sfxPool.set(
      id,
      new Howl({ src, volume: this.seVolume * this.masterVolume }),
    )
  }

  /** SEを再生する */
  playSFX(id: string): void {
    const sfx = this.sfxPool.get(id)
    if (sfx) {
      sfx.volume(this.seVolume * this.masterVolume)
      sfx.play()
    }
  }

  /** 音量を一括更新する */
  private updateVolumes(): void {
    if (this.bgm) {
      this.bgm.volume(this.bgmVolume * this.masterVolume)
    }
  }

  /** 全リソースを解放する */
  destroy(): void {
    this.stopBGM()
    for (const sfx of this.sfxPool.values()) {
      sfx.unload()
    }
    this.sfxPool.clear()
  }
}
