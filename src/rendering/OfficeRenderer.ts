/**
 * オフィス描画メインモジュール
 * PixiJS 8 でアイソメトリックオフィスビューを統合描画する
 * - タイルマップ（ゾーン区画別カラー）
 * - キャラクター
 * - 家具
 * - 昼夜サイクル・天候エフェクト
 * - ビューポートカリング
 */

import { Application, Container, Graphics } from 'pixi.js'
import { TileMap } from './TileMap.js'
import { isoToScreen } from './IsometricEngine.js'
import { CameraController } from './camera/CameraController.js'
import { CharacterManager } from './CharacterManager.js'
import { FurnitureManager } from './FurnitureManager.js'
import { DayNightCycle } from './effects/DayNightCycle.js'
import { WeatherEffect } from './effects/WeatherEffect.js'
import { StatusParticles } from './effects/StatusParticles.js'
import {
  TILE_SIZE, TILE_TYPES, ZOOM_LEVELS,
  OFFICE_LEVELS, isWallTile,
} from '@game-types/rendering.js'
import type { TileType, OfficeLevel, ZoomLevel, CharacterSpriteState } from '@game-types/rendering.js'
import { SeededRandom } from '@utils/random.js'

// ─── タイル色テーブル ───

const TILE_COLORS: Record<string, number> = {
  [TILE_TYPES.EMPTY]: 0x0a0818,
  [TILE_TYPES.FLOOR_WOOD]: 0x5a4a32,
  [TILE_TYPES.FLOOR_CARPET]: 0x3a4a5a,
  [TILE_TYPES.FLOOR_CONCRETE]: 0x4a4a4a,
  [TILE_TYPES.FLOOR_TILE]: 0x5a6a5a,
  [TILE_TYPES.WALL_NORTH]: 0x2a2540,
  [TILE_TYPES.WALL_EAST]: 0x2a2540,
  [TILE_TYPES.WALL_SOUTH]: 0x2a2540,
  [TILE_TYPES.WALL_WEST]: 0x2a2540,
  [TILE_TYPES.WALL_CORNER_NE]: 0x222040,
  [TILE_TYPES.WALL_CORNER_NW]: 0x222040,
  [TILE_TYPES.WALL_CORNER_SE]: 0x222040,
  [TILE_TYPES.WALL_CORNER_SW]: 0x222040,
  [TILE_TYPES.DOOR]: 0x6a5a32,
  [TILE_TYPES.WINDOW]: 0x4488aa,
  [TILE_TYPES.PILLAR]: 0x555555,
  [TILE_TYPES.STAIRS]: 0x666644,
  [TILE_TYPES.ELEVATOR]: 0x555566,
}

/** キャラクターアクション色 */
const ACTION_COLORS: Record<string, number> = {
  idle: 0x44aa44,
  walking: 0x4488cc,
  meeting: 0xaa8844,
  break: 0x88aa44,
  phone: 0x6644aa,
  presenting: 0xcc8844,
  stressed: 0xcc4444,
  celebrating: 0xcccc44,
  leaving: 0x888888,
}

/**
 * OfficeRenderer — アイソメトリックオフィスの統合描画
 */
export class OfficeRenderer {
  private app: Application | null = null
  private worldContainer: Container | null = null
  private tileContainer: Container | null = null
  private characterContainer: Container | null = null
  private effectContainer: Container | null = null
  private camera: CameraController | null = null

  private tileMap: TileMap
  readonly characters: CharacterManager
  readonly furniture: FurnitureManager
  private dayNight: DayNightCycle
  private weather: WeatherEffect
  private statusParticles: StatusParticles
  private rng: SeededRandom

  private tickCounter = 0

  constructor(seed = 42) {
    this.rng = new SeededRandom(seed)
    this.tileMap = TileMap.generateFloor(OFFICE_LEVELS.GARAGE)
    this.characters = new CharacterManager(this.tileMap, this.rng.fork('characters'))
    this.furniture = new FurnitureManager(this.tileMap)
    this.dayNight = new DayNightCycle()
    this.weather = new WeatherEffect(this.rng.fork('weather'))
    this.statusParticles = new StatusParticles()
  }

  /** PixiJSアプリケーションを初期化しCanvasを返す */
  async init(parentElement: HTMLElement): Promise<void> {
    this.app = new Application()
    await this.app.init({
      background: 0x0a0818,
      resizeTo: parentElement,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })

    parentElement.appendChild(this.app.canvas)

    // コンテナ階層
    this.worldContainer = new Container()
    this.worldContainer.sortableChildren = true
    this.app.stage.addChild(this.worldContainer)

    this.tileContainer = new Container()
    this.tileContainer.zIndex = 0
    this.worldContainer.addChild(this.tileContainer)

    this.characterContainer = new Container()
    this.characterContainer.zIndex = 100
    this.characterContainer.sortableChildren = true
    this.worldContainer.addChild(this.characterContainer)

    this.effectContainer = new Container()
    this.effectContainer.zIndex = 200
    this.worldContainer.addChild(this.effectContainer)

    // カメラ
    this.camera = new CameraController(
      this.worldContainer,
      this.app.screen.width,
      this.app.screen.height,
    )
    this.camera.bindEvents(this.app.canvas as HTMLCanvasElement)

    // エフェクト初期化
    this.dayNight.attach(this.effectContainer, this.app.screen.width, this.app.screen.height)
    this.weather.attach(this.app.stage, this.app.screen.width, this.app.screen.height)
    this.statusParticles.attach(this.worldContainer)

    this.centerCamera()
    this.drawTileMap()

    // レンダリングループ
    this.app.ticker.add(() => this.renderFrame())
  }

  /** フレームごとの描画更新 */
  private renderFrame(): void {
    this.tickCounter++

    // エフェクト更新
    this.dayNight.update(this.tickCounter)
    this.weather.update()
    this.statusParticles.update()

    // キャラクター描画更新
    this.drawCharacters()
  }

  /** タイルマップ全体を描画する */
  private drawTileMap(): void {
    if (!this.tileContainer) return
    this.tileContainer.removeChildren()

    for (let row = 0; row < this.tileMap.height; row++) {
      for (let col = 0; col < this.tileMap.width; col++) {
        const tileData = this.tileMap.getTile({ col, row })
        if (!tileData || tileData.type === TILE_TYPES.EMPTY) continue

        const screen = isoToScreen({ col, row })
        const color = TILE_COLORS[tileData.type] ?? 0x3a3650
        const isWall = isWallTile(tileData.type as TileType)
        const g = this.drawIsometricTile(screen.x, screen.y, color, isWall ? 16 : 4)
        g.zIndex = col + row
        this.tileContainer.addChild(g)
      }
    }

    // 家具描画
    this.drawFurniture()
  }

  /** アイソメトリックタイルを1つ描画する */
  private drawIsometricTile(x: number, y: number, color: number, height: number): Graphics {
    const hw = TILE_SIZE.WIDTH / 2
    const hh = TILE_SIZE.HEIGHT / 2
    const g = new Graphics()

    // 上面
    g.poly([
      { x, y }, { x: x + hw, y: y + hh },
      { x, y: y + TILE_SIZE.HEIGHT }, { x: x - hw, y: y + hh },
    ])
    g.fill({ color })
    g.stroke({ color: 0x4a4660, width: 0.5, alpha: 0.3 })

    // 左側面
    g.poly([
      { x: x - hw, y: y + hh }, { x, y: y + TILE_SIZE.HEIGHT },
      { x, y: y + TILE_SIZE.HEIGHT + height }, { x: x - hw, y: y + hh + height },
    ])
    g.fill({ color: darken(color, 0.65) })

    // 右側面
    g.poly([
      { x: x + hw, y: y + hh }, { x, y: y + TILE_SIZE.HEIGHT },
      { x, y: y + TILE_SIZE.HEIGHT + height }, { x: x + hw, y: y + hh + height },
    ])
    g.fill({ color: darken(color, 0.45) })

    return g
  }

  /** キャラクターを描画する */
  private drawCharacters(): void {
    if (!this.characterContainer || !this.camera) return

    const zoomLevel = this.camera.getZoomLevel()
    this.characterContainer.removeChildren()

    // 俯瞰モードではキャラクター非表示
    if (zoomLevel === ZOOM_LEVELS.OVERVIEW) return

    const states = this.characters.getAllStates()
    const bounds = this.camera.getVisibleBounds()

    for (const char of states) {
      // カリング
      if (char.position.col < bounds.minCol || char.position.col > bounds.maxCol ||
          char.position.row < bounds.minRow || char.position.row > bounds.maxRow) {
        continue
      }

      const screen = isoToScreen(char.position)
      const g = this.drawCharacterSprite(screen.x, screen.y, char, zoomLevel)
      g.zIndex = char.position.col + char.position.row + 0.5
      this.characterContainer.addChild(g)
    }
  }

  /** キャラクタースプライトを描画する（プロシージャル） */
  private drawCharacterSprite(
    x: number, y: number,
    char: CharacterSpriteState,
    zoomLevel: ZoomLevel,
  ): Graphics {
    const g = new Graphics()
    const actionColor = ACTION_COLORS[char.action] ?? 0x44aa44
    const isCloseup = zoomLevel === ZOOM_LEVELS.CLOSEUP

    // 影
    g.ellipse(x, y + 14, 6, 3)
    g.fill({ color: 0x000000, alpha: 0.3 })

    // 体
    g.roundRect(x - 4, y - 8, 8, 16, 2)
    g.fill({ color: actionColor })

    // 頭
    const skinColors = [0xf5d0a9, 0xe8c090, 0xd4a574, 0xc08050, 0x8b5e3c, 0x5a3825]
    const skinColor = skinColors[char.appearance.skinTone % skinColors.length]
    g.circle(x, y - 12, 5)
    g.fill({ color: skinColor })

    // 髪
    const hairColors = [0x222222, 0x4a3020, 0x8a6040, 0xccaa44, 0xcc4422, 0x222266, 0x888888, 0xeeeeee]
    const hairColor = hairColors[char.appearance.hairColor % hairColors.length]
    g.arc(x, y - 14, 5, Math.PI, 0)
    g.fill({ color: hairColor })

    // 接写モードでは表情も
    if (isCloseup) {
      // 目
      g.circle(x - 2, y - 12, 1)
      g.circle(x + 2, y - 12, 1)
      g.fill({ color: 0x222222 })

      // ストレス表現
      if (char.action === 'stressed') {
        g.moveTo(x - 6, y - 20)
        g.lineTo(x - 3, y - 18)
        g.moveTo(x + 6, y - 20)
        g.lineTo(x + 3, y - 18)
        g.stroke({ color: 0xcc4444, width: 1.5 })
      }
    }

    return g
  }

  /** 家具を描画する */
  private drawFurniture(): void {
    if (!this.tileContainer) return

    for (const inst of this.furniture.getAll()) {
      const def = this.furniture.getDefinition(inst.definitionId)
      if (!def) continue

      const screen = isoToScreen(inst.position)
      const g = this.drawFurnitureSprite(screen.x, screen.y, def.category)
      g.zIndex = inst.position.col + inst.position.row + 0.3
      this.tileContainer.addChild(g)
    }
  }

  /** 家具スプライトを描画する（プロシージャル） */
  private drawFurnitureSprite(x: number, y: number, category: string): Graphics {
    const g = new Graphics()
    const hw = TILE_SIZE.WIDTH / 4
    const hh = TILE_SIZE.HEIGHT / 4

    const colors: Record<string, number> = {
      desk: 0x8b6914, chair: 0x5a4a3a, meeting: 0x6a5a44,
      storage: 0x666666, decoration: 0x44aa44, facility: 0x4466aa,
      kitchen: 0xaa6644, recreation: 0xaa44aa, lighting: 0xcccc44,
      partition: 0x888888,
    }
    const color = colors[category] ?? 0x666666

    g.poly([
      { x, y: y - 4 },
      { x: x + hw, y: y + hh - 4 },
      { x, y: y + TILE_SIZE.HEIGHT / 2 - 4 },
      { x: x - hw, y: y + hh - 4 },
    ])
    g.fill({ color })
    g.stroke({ color: darken(color, 0.7), width: 0.5 })

    return g
  }

  /** カメラをマップ中央に合わせる */
  private centerCamera(): void {
    if (!this.app || !this.worldContainer) return
    const center = isoToScreen({
      col: this.tileMap.width / 2,
      row: this.tileMap.height / 2,
    })
    this.worldContainer.x = this.app.screen.width / 2 - center.x
    this.worldContainer.y = this.app.screen.height / 3 - center.y
  }

  /** オフィスレベルを変更する */
  setOfficeLevel(level: OfficeLevel): void {
    this.tileMap = TileMap.generateFloor(level)
    // 既存のキャラクターと家具のtileMap参照は更新不可なので再構築が必要
    // Phase 2以降でより洗練された方法に移行する
    this.drawTileMap()
    this.centerCamera()
  }

  /** タイルマップを取得する */
  getTileMap(): TileMap {
    return this.tileMap
  }

  /** リサイズ対応 */
  resize(): void {
    if (this.app && this.camera) {
      this.camera.setViewport(this.app.screen.width, this.app.screen.height)
    }
  }

  /** リソースを解放する */
  destroy(): void {
    this.camera?.dispose()
    this.dayNight.destroy()
    this.weather.destroy()
    this.statusParticles.destroy()
    if (this.app) {
      this.app.destroy(true, { children: true })
      this.app = null
    }
    this.worldContainer = null
    this.tileContainer = null
    this.characterContainer = null
    this.effectContainer = null
    this.camera = null
  }
}

/** 色を暗くするヘルパー */
function darken(color: number, factor: number): number {
  const r = Math.floor(((color >> 16) & 0xff) * factor)
  const g = Math.floor(((color >> 8) & 0xff) * factor)
  const b = Math.floor((color & 0xff) * factor)
  return (r << 16) | (g << 8) | b
}
