/**
 * タイルマップ管理システム
 * オフィスのタイル配置データを管理する
 */

import type { IsoCoord, TileData, OfficeMapData, TileType } from '@game-types/rendering.js'
import { TILE_TYPES } from '@game-types/rendering.js'

/** デフォルトのタイルデータを生成する */
function createDefaultTile(type: TileType = TILE_TYPES.FLOOR): TileData {
  return {
    type,
    walkable: type === TILE_TYPES.FLOOR || type === TILE_TYPES.LOUNGE,
    occupied: false,
  }
}

/**
 * TileMap — オフィスのタイル配置を管理する
 */
export class TileMap {
  private readonly tiles: TileData[][]
  readonly width: number
  readonly height: number

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.tiles = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => createDefaultTile()),
    )
  }

  /** 指定座標のタイルを取得する */
  getTile(coord: IsoCoord): TileData | null {
    if (!this.isInBounds(coord)) return null
    return this.tiles[coord.row][coord.col]
  }

  /** 指定座標にタイルを設置する */
  setTile(coord: IsoCoord, type: TileType): void {
    if (!this.isInBounds(coord)) return
    this.tiles[coord.row][coord.col] = createDefaultTile(type)
  }

  /** 指定座標が範囲内か判定する */
  isInBounds(coord: IsoCoord): boolean {
    return (
      coord.col >= 0 &&
      coord.col < this.width &&
      coord.row >= 0 &&
      coord.row < this.height
    )
  }

  /** 指定座標のタイルが歩行可能か判定する */
  isWalkable(coord: IsoCoord): boolean {
    const tile = this.getTile(coord)
    return tile !== null && tile.walkable && !tile.occupied
  }

  /** マップデータをシリアライズする */
  serialize(): OfficeMapData {
    return {
      width: this.width,
      height: this.height,
      tiles: this.tiles.map((row) => [...row]),
    }
  }

  /** シリアライズされたデータから復元する */
  static deserialize(data: OfficeMapData): TileMap {
    const map = new TileMap(data.width, data.height)
    for (let row = 0; row < data.height; row++) {
      for (let col = 0; col < data.width; col++) {
        if (data.tiles[row]?.[col]) {
          map.tiles[row][col] = { ...data.tiles[row][col] }
        }
      }
    }
    return map
  }

  /**
   * ガレージレベルのオフィスマップを生成する
   */
  static createGarageOffice(): TileMap {
    const map = new TileMap(8, 8)
    // 壁を配置
    for (let col = 0; col < 8; col++) {
      map.setTile({ col, row: 0 }, TILE_TYPES.WALL)
      map.setTile({ col, row: 7 }, TILE_TYPES.WALL)
    }
    for (let row = 0; row < 8; row++) {
      map.setTile({ col: 0, row }, TILE_TYPES.WALL)
      map.setTile({ col: 7, row }, TILE_TYPES.WALL)
    }
    // デスクを配置
    map.setTile({ col: 2, row: 2 }, TILE_TYPES.DESK)
    map.setTile({ col: 3, row: 2 }, TILE_TYPES.DESK)
    map.setTile({ col: 4, row: 2 }, TILE_TYPES.DESK)
    // キッチン
    map.setTile({ col: 5, row: 5 }, TILE_TYPES.KITCHEN)

    return map
  }
}
