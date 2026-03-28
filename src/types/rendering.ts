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

/** 矩形 */
export interface Rect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

/** タイルサイズ定数 */
export const TILE_SIZE = {
  WIDTH: 64,
  HEIGHT: 32,
} as const

// ─── タイル種別 ───

export const TILE_TYPES = {
  EMPTY: 'empty',
  FLOOR_WOOD: 'floor_wood',
  FLOOR_CARPET: 'floor_carpet',
  FLOOR_CONCRETE: 'floor_concrete',
  FLOOR_TILE: 'floor_tile',
  WALL_NORTH: 'wall_north',
  WALL_EAST: 'wall_east',
  WALL_SOUTH: 'wall_south',
  WALL_WEST: 'wall_west',
  WALL_CORNER_NE: 'wall_corner_ne',
  WALL_CORNER_NW: 'wall_corner_nw',
  WALL_CORNER_SE: 'wall_corner_se',
  WALL_CORNER_SW: 'wall_corner_sw',
  DOOR: 'door',
  WINDOW: 'window',
  PILLAR: 'pillar',
  STAIRS: 'stairs',
  ELEVATOR: 'elevator',
} as const satisfies Record<string, string>

export type TileType = (typeof TILE_TYPES)[keyof typeof TILE_TYPES]

/** 床タイルかどうか */
export function isFloorTile(type: TileType): boolean {
  return type.startsWith('floor_')
}

/** 壁タイルかどうか */
export function isWallTile(type: TileType): boolean {
  return type.startsWith('wall_')
}

// ─── タイルデータ ───

export interface TileData {
  readonly type: TileType
  readonly walkable: boolean
  readonly occupied: boolean
  readonly occupantId?: string
  readonly zoneId?: string
}

// ─── オフィスゾーン ───

export const ZONE_TYPES = {
  WORKSPACE: 'workspace',
  MEETING_ROOM: 'meeting_room',
  EXECUTIVE_SUITE: 'executive_suite',
  SERVER_ROOM: 'server_room',
  KITCHEN: 'kitchen',
  LOUNGE: 'lounge',
  RECEPTION: 'reception',
  STORAGE: 'storage',
  GYM: 'gym',
  NAP_ROOM: 'nap_room',
} as const satisfies Record<string, string>

export type ZoneType = (typeof ZONE_TYPES)[keyof typeof ZONE_TYPES]

export interface OfficeZone {
  readonly id: string
  readonly type: ZoneType
  readonly bounds: Rect
  readonly capacity: number
}

// ─── オフィスフロア ───

export const OFFICE_LEVELS = {
  GARAGE: 1,
  SMALL_OFFICE: 2,
  ONE_FLOOR: 3,
  MULTI_FLOOR: 4,
  BUILDING: 5,
  CAMPUS: 6,
} as const satisfies Record<string, number>

export type OfficeLevel = (typeof OFFICE_LEVELS)[keyof typeof OFFICE_LEVELS]

/** オフィスレベルごとの仕様 */
export const OFFICE_LEVEL_SPECS: Record<OfficeLevel, {
  name: string; width: number; height: number; capacity: number; floors: number
}> = {
  [OFFICE_LEVELS.GARAGE]:       { name: 'ガレージ',       width: 6,  height: 6,  capacity: 10,   floors: 1 },
  [OFFICE_LEVELS.SMALL_OFFICE]: { name: '小オフィス',     width: 10, height: 10, capacity: 30,   floors: 1 },
  [OFFICE_LEVELS.ONE_FLOOR]:    { name: 'ワンフロア',     width: 16, height: 12, capacity: 80,   floors: 1 },
  [OFFICE_LEVELS.MULTI_FLOOR]:  { name: 'マルチフロア',   width: 16, height: 12, capacity: 250,  floors: 3 },
  [OFFICE_LEVELS.BUILDING]:     { name: '自社ビル',       width: 20, height: 16, capacity: 500,  floors: 5 },
  [OFFICE_LEVELS.CAMPUS]:       { name: 'キャンパス',     width: 24, height: 20, capacity: 2000, floors: 8 },
}

export interface OfficeFloorData {
  readonly id: string
  readonly level: OfficeLevel
  readonly floorIndex: number
  readonly width: number
  readonly height: number
  readonly tiles: readonly (readonly TileData[])[]
  readonly zones: readonly OfficeZone[]
}

// ─── 家具 ───

export const FURNITURE_CATEGORIES = {
  DESK: 'desk',
  CHAIR: 'chair',
  MEETING: 'meeting',
  STORAGE: 'storage',
  DECORATION: 'decoration',
  FACILITY: 'facility',
  KITCHEN: 'kitchen',
  RECREATION: 'recreation',
  LIGHTING: 'lighting',
  PARTITION: 'partition',
} as const satisfies Record<string, string>

export type FurnitureCategory =
  (typeof FURNITURE_CATEGORIES)[keyof typeof FURNITURE_CATEGORIES]

export interface FurnitureEffect {
  readonly stat: 'productivity' | 'stress' | 'motivation' | 'burnout_recovery' | 'break_efficiency'
  readonly operator: 'add' | 'multiply'
  readonly value: number
}

export interface FurnitureDefinition {
  readonly id: string
  readonly name: string
  readonly category: FurnitureCategory
  readonly size: { readonly width: number; readonly height: number }
  readonly cost: number
  readonly monthlyMaintenance: number
  readonly effects: readonly FurnitureEffect[]
  readonly spriteId: string
  readonly variants: number
  readonly unlockLevel?: OfficeLevel
}

export interface FurnitureInstance {
  readonly id: string
  readonly definitionId: string
  readonly position: IsoCoord
  readonly variant: number
}

// ─── キャラクター ───

export const CHARACTER_ACTIONS = {
  IDLE: 'idle',
  WALKING: 'walking',
  MEETING: 'meeting',
  BREAK: 'break',
  PHONE: 'phone',
  PRESENTING: 'presenting',
  STRESSED: 'stressed',
  CELEBRATING: 'celebrating',
  LEAVING: 'leaving',
} as const satisfies Record<string, string>

export type CharacterAction =
  (typeof CHARACTER_ACTIONS)[keyof typeof CHARACTER_ACTIONS]

export const DIRECTIONS = {
  SOUTH: 'south',
  SOUTH_EAST: 'south_east',
  EAST: 'east',
  NORTH_EAST: 'north_east',
  NORTH: 'north',
  NORTH_WEST: 'north_west',
  WEST: 'west',
  SOUTH_WEST: 'south_west',
} as const satisfies Record<string, string>

export type Direction = (typeof DIRECTIONS)[keyof typeof DIRECTIONS]

export const OUTFIT_TYPES = {
  CASUAL_TSHIRT: 'casual_tshirt',
  CASUAL_HOODIE: 'casual_hoodie',
  BUSINESS_CASUAL: 'business_casual',
  FORMAL_SUIT: 'formal_suit',
  ENGINEER_HOODIE: 'engineer_hoodie',
} as const satisfies Record<string, string>

export type OutfitType = (typeof OUTFIT_TYPES)[keyof typeof OUTFIT_TYPES]

export interface CharacterAppearance {
  readonly gender: 'male' | 'female'
  readonly bodyType: 1 | 2 | 3
  readonly hairStyle: number
  readonly hairColor: number
  readonly skinTone: number
  readonly outfit: OutfitType
}

export interface CharacterSpriteState {
  readonly id: string
  readonly employeeId: string
  readonly position: IsoCoord
  readonly targetPosition: IsoCoord | null
  readonly path: readonly IsoCoord[]
  readonly direction: Direction
  readonly action: CharacterAction
  readonly appearance: CharacterAppearance
  readonly statusIcon: string | null
}

// ─── カメラ ───

export const ZOOM_LEVELS = {
  OVERVIEW: 'overview',
  STANDARD: 'standard',
  CLOSEUP: 'closeup',
} as const satisfies Record<string, string>

export type ZoomLevel = (typeof ZOOM_LEVELS)[keyof typeof ZOOM_LEVELS]

export interface CameraState {
  readonly x: number
  readonly y: number
  readonly zoom: number
  readonly minZoom: number
  readonly maxZoom: number
  readonly zoomLevel: ZoomLevel
  readonly currentFloor: number
}

// ─── 昼夜サイクル ───

export const TIME_PERIODS = {
  DAWN: 'dawn',
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening',
  NIGHT: 'night',
  LATE_NIGHT: 'late_night',
} as const satisfies Record<string, string>

export type TimePeriod = (typeof TIME_PERIODS)[keyof typeof TIME_PERIODS]

export interface DayNightState {
  readonly hour: number
  readonly period: TimePeriod
  readonly brightness: number
  readonly tint: number
  readonly ambientColor: number
}

// ─── 天候 ───

export const WEATHER_TYPES = {
  CLEAR: 'clear',
  CLOUDY: 'cloudy',
  RAIN: 'rain',
  SNOW: 'snow',
  STORM: 'storm',
} as const satisfies Record<string, string>

export type WeatherType = (typeof WEATHER_TYPES)[keyof typeof WEATHER_TYPES]

export interface WeatherState {
  readonly type: WeatherType
  readonly intensity: number
  readonly duration: number
}

// ─── 通知パーティクル ───

export const STATUS_ICONS = {
  IDEA: 'idea',
  HIGH_PERFORMANCE: 'high_performance',
  FRUSTRATED: 'frustrated',
  TIRED: 'tired',
  CELEBRATING: 'celebrating',
  ALERT: 'alert',
  CHATTING: 'chatting',
} as const satisfies Record<string, string>

export type StatusIcon = (typeof STATUS_ICONS)[keyof typeof STATUS_ICONS]
