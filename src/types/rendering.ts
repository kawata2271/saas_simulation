/**
 * 描画関連の型定義
 */

/** アイソメトリック座標（タイル座標） */
export interface IsoCoord {
  readonly col: number
  readonly row: number
}

/** スクリーン座標（ピクセル） */
export interface ScreenCoord {
  readonly x: number
  readonly y: number
}

/** タイルサイズ定数 */
export const TILE_SIZE = {
  WIDTH: 64,
  HEIGHT: 32,
} as const

/** タイル種別 */
export const TILE_TYPES = {
  FLOOR: 'floor',
  WALL: 'wall',
  DESK: 'desk',
  CHAIR: 'chair',
  MEETING_ROOM: 'meeting_room',
  KITCHEN: 'kitchen',
  SERVER_ROOM: 'server_room',
  LOUNGE: 'lounge',
  EMPTY: 'empty',
} as const satisfies Record<string, string>

export type TileType = (typeof TILE_TYPES)[keyof typeof TILE_TYPES]

/** タイルデータ */
export interface TileData {
  readonly type: TileType
  readonly walkable: boolean
  readonly occupied: boolean
  readonly occupantId?: string
}

/** オフィスマップデータ */
export interface OfficeMapData {
  readonly width: number
  readonly height: number
  readonly tiles: readonly (readonly TileData[])[]
}

/** カメラ状態 */
export interface CameraState {
  readonly x: number
  readonly y: number
  readonly zoom: number
  readonly minZoom: number
  readonly maxZoom: number
}

/** スプライトアニメーション定義 */
export interface SpriteAnimationDef {
  readonly name: string
  readonly frames: readonly string[]
  readonly speed: number
  readonly loop: boolean
}

/** キャラクターの向き */
export const DIRECTIONS = {
  SOUTH: 'south',
  NORTH: 'north',
  EAST: 'east',
  WEST: 'west',
} as const satisfies Record<string, string>

export type Direction = (typeof DIRECTIONS)[keyof typeof DIRECTIONS]

/** キャラクタースプライト状態 */
export interface CharacterSpriteState {
  readonly id: string
  readonly position: IsoCoord
  readonly direction: Direction
  readonly animation: string
  readonly tint: number
}

/** 昼夜サイクル状態 */
export interface DayNightState {
  /** 時間 (0-23) */
  readonly hour: number
  /** 明るさ (0-1) */
  readonly brightness: number
  /** 色温度のティント */
  readonly tint: number
}
