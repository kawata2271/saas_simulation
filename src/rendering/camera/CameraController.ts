/**
 * カメラコントローラー
 * パン（ドラッグ）とズーム（ホイール）を提供する
 */

import type { Container } from 'pixi.js'
import type { CameraState } from '@game-types/rendering.js'

const DEFAULT_CAMERA: CameraState = {
  x: 0,
  y: 0,
  zoom: 1,
  minZoom: 0.3,
  maxZoom: 3,
}

/**
 * CameraController — PixiJSのContainerに対するパン/ズーム操作
 */
export class CameraController {
  private state: CameraState
  private readonly target: Container
  viewportWidth: number
  viewportHeight: number

  private dragging = false
  private lastPointerX = 0
  private lastPointerY = 0

  private boundOnPointerDown: (e: PointerEvent) => void
  private boundOnPointerMove: (e: PointerEvent) => void
  private boundOnPointerUp: (e: PointerEvent) => void
  private boundOnWheel: (e: WheelEvent) => void
  private canvas: HTMLCanvasElement | null = null

  constructor(
    target: Container,
    viewportWidth: number,
    viewportHeight: number,
  ) {
    this.target = target
    this.viewportWidth = viewportWidth
    this.viewportHeight = viewportHeight
    this.state = { ...DEFAULT_CAMERA }

    this.boundOnPointerDown = this.onPointerDown.bind(this)
    this.boundOnPointerMove = this.onPointerMove.bind(this)
    this.boundOnPointerUp = this.onPointerUp.bind(this)
    this.boundOnWheel = this.onWheel.bind(this)
  }

  /** Canvasにイベントをバインドする */
  bindEvents(canvas: HTMLCanvasElement): void {
    this.canvas = canvas
    canvas.addEventListener('pointerdown', this.boundOnPointerDown)
    canvas.addEventListener('pointermove', this.boundOnPointerMove)
    canvas.addEventListener('pointerup', this.boundOnPointerUp)
    canvas.addEventListener('pointerleave', this.boundOnPointerUp)
    canvas.addEventListener('wheel', this.boundOnWheel, { passive: false })
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

  /** ズームレベルを設定する */
  setZoom(zoom: number): void {
    this.state = {
      ...this.state,
      zoom: Math.max(this.state.minZoom, Math.min(this.state.maxZoom, zoom)),
    }
    this.applyTransform()
  }

  private onPointerDown(e: PointerEvent): void {
    this.dragging = true
    this.lastPointerX = e.clientX
    this.lastPointerY = e.clientY
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.dragging) return
    const dx = e.clientX - this.lastPointerX
    const dy = e.clientY - this.lastPointerY
    this.lastPointerX = e.clientX
    this.lastPointerY = e.clientY

    this.state = {
      ...this.state,
      x: this.state.x + dx,
      y: this.state.y + dy,
    }
    this.applyTransform()
  }

  private onPointerUp(_e: PointerEvent): void {
    this.dragging = false
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
    const newZoom = Math.max(
      this.state.minZoom,
      Math.min(this.state.maxZoom, this.state.zoom * zoomFactor),
    )

    // ポインタ位置を中心にズーム
    const rect = this.canvas?.getBoundingClientRect()
    if (rect) {
      const pointerX = e.clientX - rect.left
      const pointerY = e.clientY - rect.top
      const scale = newZoom / this.state.zoom

      this.state = {
        ...this.state,
        zoom: newZoom,
        x: pointerX - (pointerX - this.state.x) * scale,
        y: pointerY - (pointerY - this.state.y) * scale,
      }
    } else {
      this.state = { ...this.state, zoom: newZoom }
    }

    this.applyTransform()
  }

  /** Containerにトランスフォームを適用する */
  private applyTransform(): void {
    this.target.x = this.state.x
    this.target.y = this.state.y
    this.target.scale.set(this.state.zoom)
  }

  /** イベントリスナーを解除する */
  dispose(): void {
    if (!this.canvas) return
    this.canvas.removeEventListener('pointerdown', this.boundOnPointerDown)
    this.canvas.removeEventListener('pointermove', this.boundOnPointerMove)
    this.canvas.removeEventListener('pointerup', this.boundOnPointerUp)
    this.canvas.removeEventListener('pointerleave', this.boundOnPointerUp)
    this.canvas.removeEventListener('wheel', this.boundOnWheel)
    this.canvas = null
  }
}
