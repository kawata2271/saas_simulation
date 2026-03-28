/**
 * 家具管理システム
 * 家具の配置/除去、効果計算、アンロック条件管理
 */

import type {
  IsoCoord, FurnitureDefinition, FurnitureInstance,
  FurnitureCategory, OfficeLevel,
} from '@game-types/rendering.js'
import { FURNITURE_CATEGORIES, OFFICE_LEVELS } from '@game-types/rendering.js'
import type { TileMap } from './TileMap.js'

/** 家具マスターデータ */
const FURNITURE_CATALOG: readonly FurnitureDefinition[] = [
  // デスク
  { id: 'desk_basic', name: '標準デスク', category: FURNITURE_CATEGORIES.DESK,
    size: { width: 1, height: 1 }, cost: 5, monthlyMaintenance: 0,
    effects: [], spriteId: 'desk_basic', variants: 2 },
  { id: 'desk_standing', name: 'スタンディングデスク', category: FURNITURE_CATEGORIES.DESK,
    size: { width: 1, height: 1 }, cost: 15, monthlyMaintenance: 0,
    effects: [{ stat: 'productivity', operator: 'add', value: 3 }],
    spriteId: 'desk_standing', variants: 1, unlockLevel: OFFICE_LEVELS.SMALL_OFFICE },
  { id: 'desk_booth', name: '個室ブース', category: FURNITURE_CATEGORIES.DESK,
    size: { width: 1, height: 2 }, cost: 30, monthlyMaintenance: 1,
    effects: [{ stat: 'productivity', operator: 'add', value: 5 }, { stat: 'stress', operator: 'add', value: -2 }],
    spriteId: 'desk_booth', variants: 1, unlockLevel: OFFICE_LEVELS.ONE_FLOOR },
  // 椅子
  { id: 'chair_basic', name: '標準チェア', category: FURNITURE_CATEGORIES.CHAIR,
    size: { width: 1, height: 1 }, cost: 2, monthlyMaintenance: 0,
    effects: [], spriteId: 'chair_basic', variants: 3 },
  { id: 'chair_ergonomic', name: 'エルゴノミクスチェア', category: FURNITURE_CATEGORIES.CHAIR,
    size: { width: 1, height: 1 }, cost: 20, monthlyMaintenance: 0,
    effects: [{ stat: 'stress', operator: 'add', value: -3 }, { stat: 'productivity', operator: 'add', value: 2 }],
    spriteId: 'chair_ergo', variants: 2, unlockLevel: OFFICE_LEVELS.SMALL_OFFICE },
  { id: 'chair_gaming', name: 'ゲーミングチェア', category: FURNITURE_CATEGORIES.CHAIR,
    size: { width: 1, height: 1 }, cost: 25, monthlyMaintenance: 0,
    effects: [{ stat: 'motivation', operator: 'add', value: 3 }, { stat: 'stress', operator: 'add', value: -2 }],
    spriteId: 'chair_gaming', variants: 4, unlockLevel: OFFICE_LEVELS.ONE_FLOOR },
  // 会議
  { id: 'meeting_table', name: '会議テーブル', category: FURNITURE_CATEGORIES.MEETING,
    size: { width: 2, height: 2 }, cost: 15, monthlyMaintenance: 0,
    effects: [], spriteId: 'meeting_table', variants: 1 },
  { id: 'whiteboard', name: 'ホワイトボード', category: FURNITURE_CATEGORIES.MEETING,
    size: { width: 1, height: 1 }, cost: 3, monthlyMaintenance: 0,
    effects: [{ stat: 'productivity', operator: 'add', value: 1 }],
    spriteId: 'whiteboard', variants: 1 },
  // デコレーション
  { id: 'plant', name: '観葉植物', category: FURNITURE_CATEGORIES.DECORATION,
    size: { width: 1, height: 1 }, cost: 3, monthlyMaintenance: 0.5,
    effects: [{ stat: 'stress', operator: 'add', value: -1 }, { stat: 'motivation', operator: 'add', value: 1 }],
    spriteId: 'plant', variants: 5 },
  { id: 'art_painting', name: 'アートパネル', category: FURNITURE_CATEGORIES.DECORATION,
    size: { width: 1, height: 1 }, cost: 10, monthlyMaintenance: 0,
    effects: [{ stat: 'motivation', operator: 'add', value: 2 }],
    spriteId: 'art_painting', variants: 3, unlockLevel: OFFICE_LEVELS.SMALL_OFFICE },
  // キッチン
  { id: 'coffee_machine', name: 'コーヒーマシン', category: FURNITURE_CATEGORIES.KITCHEN,
    size: { width: 1, height: 1 }, cost: 8, monthlyMaintenance: 2,
    effects: [{ stat: 'motivation', operator: 'add', value: 2 }, { stat: 'break_efficiency', operator: 'add', value: 10 }],
    spriteId: 'coffee_machine', variants: 2 },
  { id: 'fridge', name: '冷蔵庫', category: FURNITURE_CATEGORIES.KITCHEN,
    size: { width: 1, height: 1 }, cost: 5, monthlyMaintenance: 1,
    effects: [{ stat: 'break_efficiency', operator: 'add', value: 5 }],
    spriteId: 'fridge', variants: 1 },
  { id: 'vending_machine', name: '自販機', category: FURNITURE_CATEGORIES.KITCHEN,
    size: { width: 1, height: 1 }, cost: 10, monthlyMaintenance: 3,
    effects: [{ stat: 'motivation', operator: 'add', value: 1 }],
    spriteId: 'vending_machine', variants: 1, unlockLevel: OFFICE_LEVELS.ONE_FLOOR },
  // レクリエーション
  { id: 'nap_pod', name: '仮眠ポッド', category: FURNITURE_CATEGORIES.RECREATION,
    size: { width: 1, height: 2 }, cost: 50, monthlyMaintenance: 2,
    effects: [{ stat: 'burnout_recovery', operator: 'add', value: 20 }, { stat: 'stress', operator: 'add', value: -5 }],
    spriteId: 'nap_pod', variants: 1, unlockLevel: OFFICE_LEVELS.ONE_FLOOR },
  { id: 'game_table', name: 'ゲーム台', category: FURNITURE_CATEGORIES.RECREATION,
    size: { width: 2, height: 1 }, cost: 20, monthlyMaintenance: 1,
    effects: [{ stat: 'motivation', operator: 'add', value: 3 }, { stat: 'stress', operator: 'add', value: -3 }],
    spriteId: 'game_table', variants: 2, unlockLevel: OFFICE_LEVELS.SMALL_OFFICE },
  // 設備
  { id: 'server_rack', name: 'サーバーラック', category: FURNITURE_CATEGORIES.FACILITY,
    size: { width: 1, height: 1 }, cost: 30, monthlyMaintenance: 5,
    effects: [{ stat: 'productivity', operator: 'add', value: 3 }],
    spriteId: 'server_rack', variants: 1 },
  // 照明
  { id: 'floor_lamp', name: 'フロアランプ', category: FURNITURE_CATEGORIES.LIGHTING,
    size: { width: 1, height: 1 }, cost: 5, monthlyMaintenance: 0.5,
    effects: [{ stat: 'motivation', operator: 'add', value: 1 }],
    spriteId: 'floor_lamp', variants: 3 },
]

/**
 * FurnitureManager — 家具の配置と効果管理
 */
export class FurnitureManager {
  private readonly instances = new Map<string, FurnitureInstance>()
  private readonly tileMap: TileMap
  private nextId = 1

  constructor(tileMap: TileMap) {
    this.tileMap = tileMap
  }

  /** カタログを取得する */
  getCatalog(currentLevel: OfficeLevel): FurnitureDefinition[] {
    return FURNITURE_CATALOG.filter(
      (f) => !f.unlockLevel || f.unlockLevel <= currentLevel,
    )
  }

  /** カタログからIDで検索する */
  getDefinition(id: string): FurnitureDefinition | null {
    return FURNITURE_CATALOG.find((f) => f.id === id) ?? null
  }

  /** 家具を配置する */
  place(definitionId: string, position: IsoCoord, variant = 0): FurnitureInstance | null {
    const def = this.getDefinition(definitionId)
    if (!def) return null

    // 配置可能チェック
    if (!this.canPlace(def, position)) return null

    const instance: FurnitureInstance = {
      id: `furn_${this.nextId++}`,
      definitionId,
      position,
      variant: variant % def.variants,
    }

    this.instances.set(instance.id, instance)

    // タイル占有更新
    for (let dr = 0; dr < def.size.height; dr++) {
      for (let dc = 0; dc < def.size.width; dc++) {
        this.tileMap.setOccupied(
          { col: position.col + dc, row: position.row + dr },
          true, instance.id,
        )
      }
    }

    return instance
  }

  /** 家具を除去する */
  remove(instanceId: string): boolean {
    const instance = this.instances.get(instanceId)
    if (!instance) return false

    const def = this.getDefinition(instance.definitionId)
    if (def) {
      for (let dr = 0; dr < def.size.height; dr++) {
        for (let dc = 0; dc < def.size.width; dc++) {
          this.tileMap.setOccupied(
            { col: instance.position.col + dc, row: instance.position.row + dr },
            false,
          )
        }
      }
    }

    return this.instances.delete(instanceId)
  }

  /** 配置可能か判定する */
  canPlace(def: FurnitureDefinition, position: IsoCoord): boolean {
    for (let dr = 0; dr < def.size.height; dr++) {
      for (let dc = 0; dc < def.size.width; dc++) {
        const coord = { col: position.col + dc, row: position.row + dr }
        if (!this.tileMap.isWalkable(coord)) return false
      }
    }
    return true
  }

  /** 全インスタンスを取得する */
  getAll(): FurnitureInstance[] {
    return [...this.instances.values()]
  }

  /** カテゴリ別にフィルタして取得する */
  getByCategory(category: FurnitureCategory): FurnitureInstance[] {
    return this.getAll().filter((inst) => {
      const def = this.getDefinition(inst.definitionId)
      return def?.category === category
    })
  }

  /** 全家具の効果を集計する */
  getTotalEffects(): Map<string, number> {
    const totals = new Map<string, number>()

    for (const instance of this.instances.values()) {
      const def = this.getDefinition(instance.definitionId)
      if (!def) continue

      for (const effect of def.effects) {
        const current = totals.get(effect.stat) ?? 0
        totals.set(effect.stat, current + effect.value)
      }
    }

    return totals
  }

  /** 月次維持費の合計を計算する */
  getTotalMaintenance(): number {
    let total = 0
    for (const instance of this.instances.values()) {
      const def = this.getDefinition(instance.definitionId)
      if (def) total += def.monthlyMaintenance
    }
    return total
  }
}
