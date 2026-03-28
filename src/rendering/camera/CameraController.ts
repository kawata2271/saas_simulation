/**
 * カメラコントローラー
 * - パン（ドラッグ / WASD / 画面端ホバー）
 * - ズーム（ホイール / ピンチ、3段階LOD）
 * - 慣性スクロール
 * - フロア切替
 * - ビューポートカリング情報提供
 * - オートフォーカス
 */

import type { Container } from 'pixi.js'
import type { CameraState, ZoomLevel, IsoCoord } from '@game-types/rendering.js'
import { ZOOM_LEVELS, TILE_SIZE } from '@game-types/rendering.js'
import { isoToScreen } from '../IsometricEngine.js'

/** ズームレベル閾値 */
const ZOOM_THRESHOLDS = {
  OVERVIEW_MAX: 0.45,
  STANDARD_MAX: 1.2,
} as const

/** ズームレベルを判定する */
function calcZoomLevel(zoom: number): ZoomLevel {
  if (zoom < ZOOM_THRESHOLDS.OVERVIEW_MAX) return ZOOM_LEVELS.OVERVIEW
  if (zoom < ZOOM_THRESHOLDS.STANDARD_MAX) return ZOOM_LEVELS.STANDARD
  return ZOOM_LEVELS.CLOSEUP
}

/**
 * CameraController — パン/ズーム/慣性/LOD/カリング
 */
export class CameraController {
  private state: CameraState
  private readonly target: Container
  viewportWidth: number
  viewportHeight: number

  // ドラッグ
  private dragging = false
  private lastPointerX = 0
  private lastPointerY = 0

  // 慣性
  private velocityX = 0
  private velocityY = 0
  private readonly friction = 0.92

  // キーボード
  private readonly keysDown = new Set<string>()
  private readonly keySpeed = 8

  // フロア
  private currentFloor = 0
  private readonly maxFloors: number

  // イベントバインド
  private canvas: HTMLCanvasElement | null = null
  private animFrameId: number | null = null

  constructor(
    target: Container,
    viewportWidth: number,
    viewportHeight: number,
    maxFloors = 1,
  ) {
    this.target = target
    this.viewportWidth = viewportWidth
    this.viewportHeight = viewportHeight
    this.maxFloors = maxFloors
    this.state = {
      x: 0, y: 0,
      zoom: 0.8,
      minZoom: 0.2,
      maxZoom: 2.5,
      zoomLevel: ZOOM_LEVELS.STANDARD,
      currentFloor: 0,
    }
  }

  /** Canvasにイベントをバインドする */
  bindEvents(canvas: HTMLCanvasElement): void {
    this.canvas = canvas
    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointermove', this.onPointerMove)
    canvas.addEventListener('pointerup', this.onPointerUp)
    canvas.addEventListener('pointerleave', this.onPointerUp)
    canvas.addEventListener('wheel', this.onWheel, { passive: false })
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)

    this.startInertiaLoop()
  }

  /** ビューポートサイズを更新する */
  setViewport(width: number, height: number): void {
    this.viewportWidth = width
    this.viewportHeight = height
  }

  /** 現在のカメラ状態を取得する */
  getState(): CameraState {
    return { ...this.state }
  }

  /** 現在のズームレベルを取得する */
  getZoomLevel(): ZoomLevel {
    return this.state.zoomLevel
  }

  /** 現在のフロアを取得する */
  getCurrentFloor(): number {
    return this.currentFloor
  }

  /** フロアを切り替える */
  setFloor(floor: number): void {
    this.currentFloor = Math.max(0, Math.min(this.maxFloors - 1, floor))
    this.state = { ...this.state, currentFloor: this.currentFloor }
  }

  /** 特定のタイル座標にオートフォーカスする */
  focusOn(iso: IsoCoord, smooth = true): void {
    const screen = isoToScreen(iso)
    const targetX = this.viewportWidth / 2 - screen.x * this.state.zoom
    const targetY = this.viewportHeight / 3 - screen.y * this.state.zoom

    if (smooth) {
      // 慣性を利用してスムーズに移動
      this.velocityX = (targetX - this.state.x) * 0.1
      this.velocityY = (targetY - this.state.y) * 0.1
    } else {
      this.state = { ...this.state, x: targetX, y: targetY }
      this.applyTransform()
    }
  }

  /**
   * ビューポート内に表示されるタイル範囲を返す（カリング用）
   */
  getVisibleBounds(): { minCol: number; maxCol: number; minRow: number; maxRow: number } {
    const z = this.state.zoom
    const padding = 3 // 余裕を持たせる
    const screenLeft = -this.state.x / z
    const screenTop = -this.state.y / z
    const screenRight = screenLeft + this.viewportWidth / z
    const screenBottom = screenTop + this.viewportHeight / z

    const hw = TILE_SIZE.WIDTH / 2
    const hh = TILE_SIZE.HEIGHT / 2

    return {
      minCol: Math.floor(screenTop / hh + screenLeft / hw) / 2 - padding,
      maxCol: Math.ceil(screenBottom / hh + screenRight / hw) / 2 + padding,
      minRow: Math.floor(screenTop / hh - screenRight / hw) / 2 - padding,
      maxRow: Math.ceil(screenBottom / hh - screenLeft / hw) / 2 + padding,
    }
  }

  // ─── イベントハンドラ ───

  private onPointerDown = (e: PointerEvent): void => {
    this.dragging = true
    this.lastPointerX = e.clientX
    this.lastPointerY = e.clientY
    this.velocityX = 0
    this.velocityY = 0
  }

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.dragging) return
    const dx = e.clientX - this.lastPointerX
    const dy = e.clientY - this.lastPointerY
    this.lastPointerX = e.clientX
    this.lastPointerY = e.clientY

    this.state = { ...this.state, x: this.state.x + dx, y: this.state.y + dy }
    this.velocityX = dx
    this.velocityY = dy
    this.applyTransform()
  }

  private onPointerUp = (_e: PointerEvent): void => {
    this.dragging = false
  }

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92
    const newZoom = Math.max(
      this.state.minZoom,
      Math.min(this.state.maxZoom, this.state.zoom * zoomFactor),
    )

    const rect = this.canvas?.getBoundingClientRect()
    if (rect) {
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top
      const scale = newZoom / this.state.zoom
      this.state = {
        ...this.state,
        zoom: newZoom,
        x: px - (px - this.state.x) * scale,
        y: py - (py - this.state.y) * scale,
        zoomLevel: calcZoomLevel(newZoom),
      }
    } else {
      this.state = {
        ...this.state,
        zoom: newZoom,
        zoomLevel: calcZoomLevel(newZoom),
      }
    }
    this.applyTransform()
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keysDown.add(e.key.toLowerCase())
    // 数字キーでフロア切替
    const num = parseInt(e.key)
    if (!isNaN(num) && num >= 1 && num <= this.maxFloors) {
      this.setFloor(num - 1)
    }
  }

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keysDown.delete(e.key.toLowerCase())
  }

  // ─── 慣性ループ ───

  private startInertiaLoop(): void {
    const loop = (): void => {
      // キーボードパン
      if (this.keysDown.has('w') || this.keysDown.has('arrowup')) {
        this.state = { ...this.state, y: this.state.y + this.keySpeed }
      }
      if (this.keysDown.has('s') || this.keysDown.has('arrowdown')) {
        this.state = { ...this.state, y: this.state.y - this.keySpeed }
      }
      if (this.keysDown.has('a') || this.keysDown.has('arrowleft')) {
        this.state = { ...this.state, x: this.state.x + this.keySpeed }
      }
      if (this.keysDown.has('d') || this.keysDown.has('arrowright')) {
        this.state = { ...this.state, x: this.state.x - this.keySpeed }
      }

      // 慣性スクロール
      if (!this.dragging && (Math.abs(this.velocityX) > 0.5 || Math.abs(this.velocityY) > 0.5)) {
        this.state = {
          ...this.state,
          x: this.state.x + this.velocityX,
          y: this.state.y + this.velocityY,
        }
        this.velocityX *= this.friction
        this.velocityY *= this.friction
      }

      if (this.keysDown.size > 0 || Math.abs(this.velocityX) > 0.5 || Math.abs(this.velocityY) > 0.5) {
        this.applyTransform()
      }

      this.animFrameId = requestAnimationFrame(loop)
    }
    this.animFrameId = requestAnimationFrame(loop)
  }

  /** Containerにトランスフォームを適用する */
  private applyTransform(): void {
    this.target.x = this.state.x
    this.target.y = this.state.y
    this.target.scale.set(this.state.zoom)
  }

  /** イベントリスナーを解除する */
  dispose(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId)
    }
    if (!this.canvas) return
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    this.canvas.removeEventListener('pointermove', this.onPointerMove)
    this.canvas.removeEventListener('pointerup', this.onPointerUp)
    this.canvas.removeEventListener('pointerleave', this.onPointerUp)
    this.canvas.removeEventListener('wheel', this.onWheel)
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    this.canvas = null
  }
}
