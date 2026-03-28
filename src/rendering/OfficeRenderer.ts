/**
 * オフィス描画メインモジュール
 * PixiJSを使用してアイソメトリックオフィスビューを描画する
 */

import { Application, Container, Graphics } from 'pixi.js'
import { TileMap } from './TileMap.js'
import { isoToScreen } from './IsometricEngine.js'
import { TILE_SIZE, TILE_TYPES } from '@game-types/rendering.js'
import type { TileType } from '@game-types/rendering.js'
import { CameraController } from './camera/CameraController.js'

/** タイル種別ごとの色定義 */
const TILE_COLORS: Record<TileType, number> = {
  [TILE_TYPES.FLOOR]: 0x3a3650,
  [TILE_TYPES.WALL]: 0x2a2540,
  [TILE_TYPES.DESK]: 0x8b6914,
  [TILE_TYPES.CHAIR]: 0x5a4a3a,
  [TILE_TYPES.MEETING_ROOM]: 0x2e5a5a,
  [TILE_TYPES.KITCHEN]: 0x4a6a4a,
  [TILE_TYPES.SERVER_ROOM]: 0x3a3a6a,
  [TILE_TYPES.LOUNGE]: 0x6a4a5a,
  [TILE_TYPES.EMPTY]: 0x1a1828,
}

/**
 * OfficeRenderer — アイソメトリックオフィスの描画を管理する
 */
export class OfficeRenderer {
  private app: Application | null = null
  private worldContainer: Container | null = null
  private tileContainer: Container | null = null
  private camera: CameraController | null = null
  private tileMap: TileMap

  constructor() {
    this.tileMap = TileMap.createGarageOffice()
  }

  /** PixiJSアプリケーションを初期化しCanvasを返す */
  async init(parentElement: HTMLElement): Promise<void> {
    this.app = new Application()
    await this.app.init({
      background: 0x1e1b2e,
      resizeTo: parentElement,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })

    parentElement.appendChild(this.app.canvas)

    this.worldContainer = new Container()
    this.app.stage.addChild(this.worldContainer)

    this.tileContainer = new Container()
    this.worldContainer.addChild(this.tileContainer)

    this.camera = new CameraController(
      this.worldContainer,
      this.app.screen.width,
      this.app.screen.height,
    )
    this.camera.bindEvents(this.app.canvas as HTMLCanvasElement)

    this.centerCamera()
    this.drawTileMap()
  }

  /** タイルマップ全体を描画する */
  private drawTileMap(): void {
    if (!this.tileContainer) return
    this.tileContainer.removeChildren()

    for (let row = 0; row < this.tileMap.height; row++) {
      for (let col = 0; col < this.tileMap.width; col++) {
        const tile = this.tileMap.getTile({ col, row })
        if (!tile) continue

        const screen = isoToScreen({ col, row })
        const color = TILE_COLORS[tile.type]
        const g = this.drawIsometricTile(screen.x, screen.y, color)
        this.tileContainer.addChild(g)
      }
    }
  }

  /** アイソメトリックタイルを1つ描画する */
  private drawIsometricTile(
    x: number,
    y: number,
    color: number,
  ): Graphics {
    const hw = TILE_SIZE.WIDTH / 2
    const hh = TILE_SIZE.HEIGHT / 2
    const tileHeight = 8

    const g = new Graphics()

    // タイル上面
    g.poly([
      { x: x, y: y },
      { x: x + hw, y: y + hh },
      { x: x, y: y + TILE_SIZE.HEIGHT },
      { x: x - hw, y: y + hh },
    ])
    g.fill({ color })
    g.stroke({ color: 0x4a4660, width: 1, alpha: 0.5 })

    // タイル左側面
    g.poly([
      { x: x - hw, y: y + hh },
      { x: x, y: y + TILE_SIZE.HEIGHT },
      { x: x, y: y + TILE_SIZE.HEIGHT + tileHeight },
      { x: x - hw, y: y + hh + tileHeight },
    ])
    g.fill({ color: darkenColor(color, 0.7) })

    // タイル右側面
    g.poly([
      { x: x + hw, y: y + hh },
      { x: x, y: y + TILE_SIZE.HEIGHT },
      { x: x, y: y + TILE_SIZE.HEIGHT + tileHeight },
      { x: x + hw, y: y + hh + tileHeight },
    ])
    g.fill({ color: darkenColor(color, 0.5) })

    return g
  }

  /** カメラをマップ中央に合わせる */
  private centerCamera(): void {
    if (!this.app || !this.worldContainer) return
    const centerIso = {
      col: this.tileMap.width / 2,
      row: this.tileMap.height / 2,
    }
    const centerScreen = isoToScreen(centerIso)
    this.worldContainer.x = this.app.screen.width / 2 - centerScreen.x
    this.worldContainer.y = this.app.screen.height / 3 - centerScreen.y
  }

  /** タイルマップを差し替える */
  setTileMap(tileMap: TileMap): void {
    this.tileMap = tileMap
    this.drawTileMap()
    this.centerCamera()
  }

  /** リサイズ対応 */
  resize(): void {
    if (this.app && this.camera) {
      this.camera.setViewport(
        this.app.screen.width,
        this.app.screen.height,
      )
    }
  }

  /** リソースを解放する */
  destroy(): void {
    this.camera?.dispose()
    if (this.app) {
      this.app.destroy(true, { children: true })
      this.app = null
    }
    this.worldContainer = null
    this.tileContainer = null
    this.camera = null
  }
}

/** 色を暗くするヘルパー */
function darkenColor(color: number, factor: number): number {
  const r = Math.floor(((color >> 16) & 0xff) * factor)
  const g = Math.floor(((color >> 8) & 0xff) * factor)
  const b = Math.floor((color & 0xff) * factor)
  return (r << 16) | (g << 8) | b
}
