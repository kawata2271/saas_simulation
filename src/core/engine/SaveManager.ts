/**
 * セーブ/ロード管理
 * IndexedDB (Dexie.js) を使用した複数スロットセーブシステム
 */

import Dexie from 'dexie'
import type { SaveData, SaveMeta } from '@game-types/game.js'
import { GAME_CONSTANTS } from '@game-types/game.js'

/** セーブデータ用のDexieデータベース */
class SaveDatabase extends Dexie {
  saves!: Dexie.Table<SaveData, string>

  constructor() {
    super('SaaSEmpireSaves')
    this.version(1).stores({
      saves: 'meta.id, meta.slotIndex, meta.savedAt',
    })
  }
}

/**
 * SaveManager — セーブ/ロードの実行と管理
 */
export class SaveManager {
  private readonly db: SaveDatabase

  constructor() {
    this.db = new SaveDatabase()
  }

  /** セーブデータを保存する */
  async save(data: SaveData): Promise<void> {
    await this.db.saves.put(data)
  }

  /** 指定スロットからロードする */
  async load(slotIndex: number): Promise<SaveData | undefined> {
    return this.db.saves
      .where('meta.slotIndex')
      .equals(slotIndex)
      .first()
  }

  /** IDを指定してロードする */
  async loadById(id: string): Promise<SaveData | undefined> {
    return this.db.saves.get(id)
  }

  /** 全スロットのメタ情報を取得する */
  async listSaves(): Promise<SaveMeta[]> {
    const saves = await this.db.saves
      .orderBy('meta.slotIndex')
      .toArray()
    return saves.map((s) => s.meta)
  }

  /** 指定スロットのセーブを削除する */
  async deleteSave(slotIndex: number): Promise<void> {
    await this.db.saves
      .where('meta.slotIndex')
      .equals(slotIndex)
      .delete()
  }

  /** 全セーブを削除する */
  async deleteAll(): Promise<void> {
    await this.db.saves.clear()
  }

  /** セーブデータをJSONにエクスポートする */
  async exportSave(slotIndex: number): Promise<string | null> {
    const data = await this.load(slotIndex)
    if (!data) return null
    return JSON.stringify(data)
  }

  /** JSONからセーブデータをインポートする */
  async importSave(json: string, targetSlot: number): Promise<void> {
    const data = JSON.parse(json) as SaveData
    if (!data.meta || data.meta.version !== GAME_CONSTANTS.SAVE_VERSION) {
      throw new Error('Incompatible save data version')
    }
    const updated: SaveData = {
      ...data,
      meta: { ...data.meta, slotIndex: targetSlot },
    }
    await this.save(updated)
  }

  /** データベースを閉じる */
  close(): void {
    this.db.close()
  }
}
