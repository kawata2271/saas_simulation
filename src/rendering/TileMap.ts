/**
 * タイルマップ管理システム
 * オフィスレベルに応じたフロア自動生成（ゾーン区画付き）
 */

import type {
  IsoCoord, TileData, OfficeFloorData, OfficeZone,
  OfficeLevel, ZoneType,
} from '@game-types/rendering.js'
import { TILE_TYPES, ZONE_TYPES, OFFICE_LEVEL_SPECS } from '@game-types/rendering.js'

/** タイル生成ヘルパー */
function tile(
  type: string,
  walkable: boolean,
  zoneId?: string,
): TileData {
  return { type: type as TileData['type'], walkable, occupied: false, zoneId }
}

/**
 * TileMap — オフィスのタイル配置を管理する
 */
export class TileMap {
  private tiles: TileData[][]
  readonly width: number
  readonly height: number
  readonly zones: OfficeZone[]

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.zones = []
    this.tiles = Array.from({ length: height }, () =>
      Array.from({ length: width }, () =>
        tile(TILE_TYPES.FLOOR_WOOD, true),
      ),
    )
  }

  /** 指定座標のタイルを取得する */
  getTile(coord: IsoCoord): TileData | null {
    if (!this.isInBounds(coord)) return null
    return this.tiles[coord.row][coord.col]
  }

  /** 指定座標にタイルを設置する */
  setTile(coord: IsoCoord, data: TileData): void {
    if (!this.isInBounds(coord)) return
    this.tiles[coord.row][coord.col] = data
  }

  /** 指定座標が範囲内か判定する */
  isInBounds(coord: IsoCoord): boolean {
    return coord.col >= 0 && coord.col < this.width &&
           coord.row >= 0 && coord.row < this.height
  }

  /** 指定座標のタイルが歩行可能か判定する */
  isWalkable(coord: IsoCoord): boolean {
    const t = this.getTile(coord)
    return t !== null && t.walkable && !t.occupied
  }

  /** タイルの占有状態を更新する */
  setOccupied(coord: IsoCoord, occupied: boolean, occupantId?: string): void {
    if (!this.isInBounds(coord)) return
    const old = this.tiles[coord.row][coord.col]
    this.tiles[coord.row][coord.col] = { ...old, occupied, occupantId }
  }

  /** シリアライズ */
  serialize(): OfficeFloorData {
    return {
      id: 'floor_0',
      level: 1 as OfficeLevel,
      floorIndex: 0,
      width: this.width,
      height: this.height,
      tiles: this.tiles.map((row) => [...row]),
      zones: [...this.zones],
    }
  }

  /** デシリアライズ */
  static deserialize(data: OfficeFloorData): TileMap {
    const map = new TileMap(data.width, data.height)
    for (let r = 0; r < data.height; r++) {
      for (let c = 0; c < data.width; c++) {
        if (data.tiles[r]?.[c]) {
          map.tiles[r][c] = { ...data.tiles[r][c] }
        }
      }
    }
    map.zones.push(...data.zones)
    return map
  }

  // ─── フロア自動生成 ───

  /** オフィスレベルに応じたフロアを生成する */
  static generateFloor(level: OfficeLevel, _floorIndex = 0): TileMap {
    const spec = OFFICE_LEVEL_SPECS[level]
    const map = new TileMap(spec.width, spec.height)

    // 外壁
    map.buildWalls()

    // ドア
    map.setTile(
      { col: Math.floor(spec.width / 2), row: spec.height - 1 },
      tile(TILE_TYPES.DOOR, true),
    )

    // ゾーン配置（レベルに応じて）
    switch (level) {
      case 1: map.layoutGarage(); break
      case 2: map.layoutSmallOffice(); break
      case 3: map.layoutOneFloor(); break
      default: map.layoutLargeOffice(level); break
    }

    return map
  }

  /** 外壁を配置する */
  private buildWalls(): void {
    for (let c = 0; c < this.width; c++) {
      this.tiles[0][c] = tile(TILE_TYPES.WALL_NORTH, false)
      this.tiles[this.height - 1][c] = tile(TILE_TYPES.WALL_SOUTH, false)
    }
    for (let r = 0; r < this.height; r++) {
      this.tiles[r][0] = tile(TILE_TYPES.WALL_WEST, false)
      this.tiles[r][this.width - 1] = tile(TILE_TYPES.WALL_EAST, false)
    }
    // 角
    this.tiles[0][0] = tile(TILE_TYPES.WALL_CORNER_NW, false)
    this.tiles[0][this.width - 1] = tile(TILE_TYPES.WALL_CORNER_NE, false)
    this.tiles[this.height - 1][0] = tile(TILE_TYPES.WALL_CORNER_SW, false)
    this.tiles[this.height - 1][this.width - 1] = tile(TILE_TYPES.WALL_CORNER_SE, false)

    // 窓を北壁・東壁に配置
    for (let c = 2; c < this.width - 2; c += 3) {
      this.tiles[0][c] = tile(TILE_TYPES.WINDOW, false)
    }
    for (let r = 2; r < this.height - 2; r += 3) {
      this.tiles[r][this.width - 1] = tile(TILE_TYPES.WINDOW, false)
    }
  }

  /** ゾーンを追加するヘルパー */
  private addZone(
    type: ZoneType, x: number, y: number, w: number, h: number,
    floorType: string = TILE_TYPES.FLOOR_WOOD,
  ): void {
    const id = `zone_${this.zones.length}`
    this.zones.push({ id, type, bounds: { x, y, width: w, height: h }, capacity: w * h })
    for (let r = y; r < y + h && r < this.height - 1; r++) {
      for (let c = x; c < x + w && c < this.width - 1; c++) {
        if (this.tiles[r]?.[c]?.walkable !== false) {
          this.tiles[r][c] = tile(floorType, true, id)
        }
      }
    }
  }

  /** ガレージレイアウト (6x6) */
  private layoutGarage(): void {
    this.addZone(ZONE_TYPES.WORKSPACE, 1, 1, 4, 3, TILE_TYPES.FLOOR_CONCRETE)
    this.addZone(ZONE_TYPES.KITCHEN, 1, 4, 2, 1, TILE_TYPES.FLOOR_TILE)
  }

  /** 小オフィスレイアウト (10x10) */
  private layoutSmallOffice(): void {
    this.addZone(ZONE_TYPES.WORKSPACE, 1, 1, 5, 5, TILE_TYPES.FLOOR_CARPET)
    this.addZone(ZONE_TYPES.MEETING_ROOM, 7, 1, 2, 3, TILE_TYPES.FLOOR_WOOD)
    this.addZone(ZONE_TYPES.KITCHEN, 7, 5, 2, 3, TILE_TYPES.FLOOR_TILE)
    this.addZone(ZONE_TYPES.LOUNGE, 1, 7, 4, 2, TILE_TYPES.FLOOR_CARPET)
    this.addZone(ZONE_TYPES.RECEPTION, 3, 8, 4, 1, TILE_TYPES.FLOOR_WOOD)
  }

  /** ワンフロアレイアウト (16x12) */
  private layoutOneFloor(): void {
    this.addZone(ZONE_TYPES.WORKSPACE, 1, 1, 8, 6, TILE_TYPES.FLOOR_CARPET)
    this.addZone(ZONE_TYPES.WORKSPACE, 1, 7, 6, 4, TILE_TYPES.FLOOR_CARPET)
    this.addZone(ZONE_TYPES.MEETING_ROOM, 10, 1, 4, 3, TILE_TYPES.FLOOR_WOOD)
    this.addZone(ZONE_TYPES.MEETING_ROOM, 10, 5, 4, 3, TILE_TYPES.FLOOR_WOOD)
    this.addZone(ZONE_TYPES.EXECUTIVE_SUITE, 10, 9, 4, 2, TILE_TYPES.FLOOR_WOOD)
    this.addZone(ZONE_TYPES.KITCHEN, 8, 7, 3, 4, TILE_TYPES.FLOOR_TILE)
    this.addZone(ZONE_TYPES.LOUNGE, 12, 7, 3, 2, TILE_TYPES.FLOOR_CARPET)
    this.addZone(ZONE_TYPES.SERVER_ROOM, 14, 1, 1, 2, TILE_TYPES.FLOOR_CONCRETE)
    this.addZone(ZONE_TYPES.RECEPTION, 6, 10, 3, 1, TILE_TYPES.FLOOR_WOOD)
  }

  /** 大規模オフィスレイアウト (16+) */
  private layoutLargeOffice(_level: OfficeLevel): void {
    const w = this.width - 2
    const h = this.height - 2
    // ワークスペース (左半分)
    this.addZone(ZONE_TYPES.WORKSPACE, 1, 1, Math.floor(w * 0.55), Math.floor(h * 0.6), TILE_TYPES.FLOOR_CARPET)
    // 第2ワークスペース (左下)
    this.addZone(ZONE_TYPES.WORKSPACE, 1, Math.floor(h * 0.65) + 1, Math.floor(w * 0.4), Math.floor(h * 0.3), TILE_TYPES.FLOOR_CARPET)
    // 会議室群 (右上)
    const mrX = Math.floor(w * 0.6) + 1
    this.addZone(ZONE_TYPES.MEETING_ROOM, mrX, 1, Math.floor(w * 0.35), 3, TILE_TYPES.FLOOR_WOOD)
    this.addZone(ZONE_TYPES.MEETING_ROOM, mrX, 5, Math.floor(w * 0.35), 3, TILE_TYPES.FLOOR_WOOD)
    // 役員室 (右)
    this.addZone(ZONE_TYPES.EXECUTIVE_SUITE, mrX, 9, Math.floor(w * 0.35), 3, TILE_TYPES.FLOOR_WOOD)
    // キッチン
    this.addZone(ZONE_TYPES.KITCHEN, Math.floor(w * 0.45), Math.floor(h * 0.65) + 1, 4, 3, TILE_TYPES.FLOOR_TILE)
    // ラウンジ
    this.addZone(ZONE_TYPES.LOUNGE, mrX, Math.floor(h * 0.65) + 1, 4, 3, TILE_TYPES.FLOOR_CARPET)
    // サーバー室
    this.addZone(ZONE_TYPES.SERVER_ROOM, w - 1, Math.floor(h * 0.8), 2, 2, TILE_TYPES.FLOOR_CONCRETE)
    // レセプション
    this.addZone(ZONE_TYPES.RECEPTION, Math.floor(w * 0.35), h - 1, 4, 1, TILE_TYPES.FLOOR_WOOD)
  }
}
