/**
 * キャラクタースプライト管理システム
 * 従業員の行動スケジュール、移動、アニメーション状態を管理
 */

import type {
  IsoCoord, CharacterSpriteState, CharacterAppearance,
  CharacterAction, Direction, StatusIcon, ZoneType,
} from '@game-types/rendering.js'
import {
  CHARACTER_ACTIONS, DIRECTIONS, OUTFIT_TYPES, ZONE_TYPES,
} from '@game-types/rendering.js'
import type { SeededRandom } from '@utils/random.js'
import type { TileMap } from './TileMap.js'
import { findPath, getDirectionFromDelta } from './Pathfinder.js'

/** 行動スケジュールスロット */
interface ScheduleSlot {
  readonly startHour: number
  readonly endHour: number
  readonly action: CharacterAction
  readonly targetZone: ZoneType | null
}

/** デフォルトの行動スケジュール */
const DEFAULT_SCHEDULE: readonly ScheduleSlot[] = [
  { startHour: 9,  endHour: 12, action: CHARACTER_ACTIONS.IDLE,    targetZone: ZONE_TYPES.WORKSPACE },
  { startHour: 12, endHour: 13, action: CHARACTER_ACTIONS.BREAK,   targetZone: ZONE_TYPES.KITCHEN },
  { startHour: 13, endHour: 15, action: CHARACTER_ACTIONS.IDLE,    targetZone: ZONE_TYPES.WORKSPACE },
  { startHour: 15, endHour: 16, action: CHARACTER_ACTIONS.MEETING, targetZone: ZONE_TYPES.MEETING_ROOM },
  { startHour: 16, endHour: 18, action: CHARACTER_ACTIONS.IDLE,    targetZone: ZONE_TYPES.WORKSPACE },
]

/** 外見をランダム生成する */
function generateAppearance(rng: SeededRandom): CharacterAppearance {
  const outfits = Object.values(OUTFIT_TYPES)
  return {
    gender: rng.chance(0.5) ? 'male' : 'female',
    bodyType: rng.nextInt(1, 3) as 1 | 2 | 3,
    hairStyle: rng.nextInt(0, 15),
    hairColor: rng.nextInt(0, 7),
    skinTone: rng.nextInt(0, 5),
    outfit: rng.pick(outfits),
  }
}

/** 内部キャラクター状態 */
interface CharacterInternal {
  state: CharacterSpriteState
  schedule: readonly ScheduleSlot[]
  currentSlotIndex: number
  moveTimer: number
  actionTimer: number
  assignedDesk: IsoCoord | null
}

/**
 * CharacterManager — 全キャラクターの行動・描画状態を管理
 */
export class CharacterManager {
  private readonly characters = new Map<string, CharacterInternal>()
  private readonly tileMap: TileMap
  private readonly rng: SeededRandom

  constructor(tileMap: TileMap, rng: SeededRandom) {
    this.tileMap = tileMap
    this.rng = rng
  }

  /** キャラクターを追加する */
  addCharacter(employeeId: string, deskPosition: IsoCoord): void {
    if (this.characters.has(employeeId)) return

    const appearance = generateAppearance(this.rng)
    const entryPoint = this.findEntryPoint()

    const state: CharacterSpriteState = {
      id: `char_${employeeId}`,
      employeeId,
      position: entryPoint,
      targetPosition: deskPosition,
      path: [],
      direction: DIRECTIONS.SOUTH as Direction,
      action: CHARACTER_ACTIONS.WALKING,
      appearance,
      statusIcon: null,
    }

    this.characters.set(employeeId, {
      state,
      schedule: this.generateSchedule(),
      currentSlotIndex: 0,
      moveTimer: 0,
      actionTimer: 0,
      assignedDesk: deskPosition,
    })
  }

  /** キャラクターを除去する */
  removeCharacter(employeeId: string): void {
    const char = this.characters.get(employeeId)
    if (char) {
      this.tileMap.setOccupied(char.state.position, false)
    }
    this.characters.delete(employeeId)
  }

  /** 全キャラクターの表示状態を取得する */
  getAllStates(): CharacterSpriteState[] {
    return [...this.characters.values()].map((c) => c.state)
  }

  /** ステータスアイコンを設定する */
  setStatusIcon(employeeId: string, icon: StatusIcon | null): void {
    const char = this.characters.get(employeeId)
    if (!char) return
    char.state = { ...char.state, statusIcon: icon }
  }

  /**
   * ティックごとの更新
   * @param hour ゲーム内の時間（0-23、営業日内の概算）
   */
  update(hour: number): void {
    for (const char of this.characters.values()) {
      this.updateCharacter(char, hour)
    }
  }

  /** 個別キャラクターの更新 */
  private updateCharacter(char: CharacterInternal, hour: number): void {
    // スケジュール判定
    const slot = this.getScheduleSlot(char.schedule, hour)
    if (slot && char.currentSlotIndex !== char.schedule.indexOf(slot)) {
      char.currentSlotIndex = char.schedule.indexOf(slot)
      this.assignAction(char, slot)
    }

    // 移動処理
    if (char.state.path.length > 0) {
      char.moveTimer++
      if (char.moveTimer >= 3) { // 3フレームに1歩
        char.moveTimer = 0
        this.moveStep(char)
      }
    } else if (char.state.action === CHARACTER_ACTIONS.WALKING) {
      // 到着 → 目的地での行動に切り替え
      char.state = {
        ...char.state,
        action: this.getScheduleSlot(char.schedule, hour)?.action ?? CHARACTER_ACTIONS.IDLE,
      }
    }

    // アクションタイマー（ランダム行動挿入用）
    char.actionTimer++
    if (char.actionTimer > 200 && char.state.action === CHARACTER_ACTIONS.IDLE) {
      char.actionTimer = 0
      if (this.rng.chance(0.1)) {
        // たまに近くを散歩
        this.wander(char)
      }
    }
  }

  /** スケジュールスロットを取得する */
  private getScheduleSlot(
    schedule: readonly ScheduleSlot[],
    hour: number,
  ): ScheduleSlot | null {
    for (const slot of schedule) {
      if (hour >= slot.startHour && hour < slot.endHour) return slot
    }
    return null
  }

  /** アクションを割り当てる（移動先決定） */
  private assignAction(char: CharacterInternal, slot: ScheduleSlot): void {
    if (!slot.targetZone) {
      char.state = { ...char.state, action: slot.action }
      return
    }

    // ゾーン内のランダムな座標を目標に
    const target = this.findZonePosition(slot.targetZone)
    if (!target) {
      char.state = { ...char.state, action: slot.action }
      return
    }

    const path = findPath(this.tileMap, char.state.position, target)
    if (path && path.length > 1) {
      char.state = {
        ...char.state,
        action: CHARACTER_ACTIONS.WALKING,
        targetPosition: target,
        path: path.slice(1), // 現在位置は除く
      }
    } else {
      char.state = { ...char.state, action: slot.action }
    }
  }

  /** 1歩移動する */
  private moveStep(char: CharacterInternal): void {
    if (char.state.path.length === 0) return

    const nextPos = char.state.path[0]
    const remainingPath = char.state.path.slice(1)

    // 方向を計算
    const dc = nextPos.col - char.state.position.col
    const dr = nextPos.row - char.state.position.row
    const direction = getDirectionFromDelta(dc, dr) as Direction

    // タイル占有更新
    this.tileMap.setOccupied(char.state.position, false)
    this.tileMap.setOccupied(nextPos, true, char.state.employeeId)

    char.state = {
      ...char.state,
      position: nextPos,
      path: remainingPath,
      direction,
    }
  }

  /** ランダムに近くを散歩する */
  private wander(char: CharacterInternal): void {
    const pos = char.state.position
    const dx = this.rng.nextInt(-2, 2)
    const dy = this.rng.nextInt(-2, 2)
    const target: IsoCoord = { col: pos.col + dx, row: pos.row + dy }

    if (!this.tileMap.isWalkable(target)) return

    const path = findPath(this.tileMap, pos, target)
    if (path && path.length > 1) {
      char.state = {
        ...char.state,
        action: CHARACTER_ACTIONS.WALKING,
        targetPosition: target,
        path: path.slice(1),
      }
    }
  }

  /** エントリーポイント（ドアの位置）を探す */
  private findEntryPoint(): IsoCoord {
    // 下壁のドアを探す
    for (let c = 0; c < this.tileMap.width; c++) {
      const t = this.tileMap.getTile({ col: c, row: this.tileMap.height - 1 })
      if (t?.type === 'door') {
        return { col: c, row: this.tileMap.height - 2 }
      }
    }
    return { col: 1, row: 1 }
  }

  /** ゾーン内の歩行可能な位置をランダムに取得する */
  private findZonePosition(zoneType: ZoneType): IsoCoord | null {
    const zone = this.tileMap.zones.find((z) => z.type === zoneType)
    if (!zone) return null

    for (let attempt = 0; attempt < 10; attempt++) {
      const col = this.rng.nextInt(zone.bounds.x, zone.bounds.x + zone.bounds.width - 1)
      const row = this.rng.nextInt(zone.bounds.y, zone.bounds.y + zone.bounds.height - 1)
      if (this.tileMap.isWalkable({ col, row })) {
        return { col, row }
      }
    }
    return null
  }

  /** 個別スケジュールを生成する（ランダムに会議時間をずらす） */
  private generateSchedule(): ScheduleSlot[] {
    const schedule = [...DEFAULT_SCHEDULE]
    // 30%で午前会議に変更
    if (this.rng.chance(0.3)) {
      schedule[0] = { ...schedule[0], action: CHARACTER_ACTIONS.MEETING, targetZone: ZONE_TYPES.MEETING_ROOM }
    }
    // 20%で電話スロット挿入
    if (this.rng.chance(0.2)) {
      schedule[2] = { ...schedule[2], action: CHARACTER_ACTIONS.PHONE, targetZone: ZONE_TYPES.WORKSPACE }
    }
    return schedule
  }

  /** キャラクター数 */
  getCount(): number {
    return this.characters.size
  }
}
