/**
 * アイソメトリック座標変換エンジン
 * タイル座標 ↔ スクリーン座標の相互変換を提供する
 */

import type { IsoCoord, ScreenCoord } from '@game-types/rendering.js'
import { TILE_SIZE } from '@game-types/rendering.js'

/** タイル座標 → スクリーン座標 (diamond projection) */
export function isoToScreen(iso: IsoCoord): ScreenCoord {
  return {
    x: (iso.col - iso.row) * (TILE_SIZE.WIDTH / 2),
    y: (iso.col + iso.row) * (TILE_SIZE.HEIGHT / 2),
  }
}

/** スクリーン座標 → タイル座標 */
export function screenToIso(screen: ScreenCoord): IsoCoord {
  const col =
    screen.x / TILE_SIZE.WIDTH + screen.y / TILE_SIZE.HEIGHT
  const row =
    screen.y / TILE_SIZE.HEIGHT - screen.x / TILE_SIZE.WIDTH

  return {
    col: Math.floor(col),
    row: Math.floor(row),
  }
}

/** タイル座標がマップ範囲内か判定する */
export function isInBounds(
  iso: IsoCoord,
  mapWidth: number,
  mapHeight: number,
): boolean {
  return (
    iso.col >= 0 &&
    iso.col < mapWidth &&
    iso.row >= 0 &&
    iso.row < mapHeight
  )
}

/** 2タイル間のマンハッタン距離を返す */
export function isoDistance(a: IsoCoord, b: IsoCoord): number {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row)
}

/**
 * タイルのスクリーン座標でのソート順を返す
 * 奥のタイルから先に描画するための深度値
 */
export function isoDepth(iso: IsoCoord): number {
  return iso.col + iso.row
}
