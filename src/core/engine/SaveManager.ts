/**
 * セーブ/ロード管理
 * - IndexedDB (Dexie.js) ベース
 * - 最大10スロット + オートセーブ3枠
 * - セーブデータのバージョニング（マイグレーション対応）
 * - セーブデータ圧縮（LZ圧縮）
 * - セーブデータ暗号化（AES-GCM）
 * - チェックサムによるデータ整合性検証
 */

import Dexie from 'dexie'
import type { SaveData, SaveMeta } from '@game-types/game.js'
import { GAME_CONSTANTS } from '@game-types/game.js'

/** 暗号化キー（固定キー — クライアントサイドなので改竄防止レベル） */
const ENCRYPTION_KEY_MATERIAL = 'SaaSEmpire2024SecretKey'

/** オートセーブスロットの開始インデックス */
const AUTO_SAVE_SLOT_START = 100

/** オートセーブスロット数 */
const AUTO_SAVE_SLOT_COUNT = 3

/** マイグレーション関数の型 */
type MigrationFn = (oldData: unknown) => SaveData

/** セーブデータ用DB */
class SaveDatabase extends Dexie {
  saves!: Dexie.Table<SaveRecord, string>

  constructor() {
    super('SaaSEmpireSaves')
    this.version(2).stores({
      saves: 'id, slotIndex, savedAt',
    })
  }
}

/** DB内の保存レコード（圧縮/暗号化済み） */
interface SaveRecord {
  readonly id: string
  readonly slotIndex: number
  readonly savedAt: number
  readonly version: string
  readonly metaJson: string
  readonly dataPayload: string
  readonly checksum: string
  readonly encrypted: boolean
  readonly compressed: boolean
}

/** チェックサムを計算する（FNV-1a 32bit） */
function calcChecksum(data: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < data.length; i++) {
    hash ^= data.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

/** 簡易LZ圧縮（ブラウザ互換） */
async function compress(data: string): Promise<string> {
  if (typeof CompressionStream !== 'undefined') {
    const blob = new Blob([data])
    const cs = new CompressionStream('gzip')
    const compressedStream = blob.stream().pipeThrough(cs)
    const compressedBlob = await new Response(compressedStream).blob()
    const buffer = await compressedBlob.arrayBuffer()
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
  }
  // フォールバック: 圧縮なし
  return btoa(encodeURIComponent(data))
}

/** 簡易LZ解凍 */
async function decompress(data: string, wasCompressed: boolean): Promise<string> {
  if (wasCompressed && typeof DecompressionStream !== 'undefined') {
    const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0))
    const blob = new Blob([bytes])
    const ds = new DecompressionStream('gzip')
    const decompressedStream = blob.stream().pipeThrough(ds)
    return new Response(decompressedStream).text()
  }
  // フォールバック
  return decodeURIComponent(atob(data))
}

/** AES-GCM暗号化 */
async function encrypt(plaintext: string): Promise<string> {
  const enc = new TextEncoder()
  const keyData = enc.encode(ENCRYPTION_KEY_MATERIAL.padEnd(32, '0').slice(0, 32))
  const key = await crypto.subtle.importKey(
    'raw', keyData, { name: 'AES-GCM' }, false, ['encrypt'],
  )
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, enc.encode(plaintext),
  )
  // iv + ciphertext をBase64エンコード
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)
  return btoa(String.fromCharCode(...combined))
}

/** AES-GCM復号 */
async function decrypt(ciphertext: string): Promise<string> {
  const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const data = combined.slice(12)
  const enc = new TextEncoder()
  const keyData = enc.encode(ENCRYPTION_KEY_MATERIAL.padEnd(32, '0').slice(0, 32))
  const key = await crypto.subtle.importKey(
    'raw', keyData, { name: 'AES-GCM' }, false, ['decrypt'],
  )
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv }, key, data,
  )
  return new TextDecoder().decode(decrypted)
}

/**
 * SaveManager — セーブ/ロードの実行と管理
 */
export class SaveManager {
  private readonly db: SaveDatabase
  private readonly migrations = new Map<string, MigrationFn>()
  private encryptionEnabled = true
  private compressionEnabled = true

  constructor() {
    this.db = new SaveDatabase()
  }

  /** 暗号化の有効/無効を切り替える */
  setEncryption(enabled: boolean): void {
    this.encryptionEnabled = enabled
  }

  /** 圧縮の有効/無効を切り替える */
  setCompression(enabled: boolean): void {
    this.compressionEnabled = enabled
  }

  /** バージョンマイグレーションを登録する */
  registerMigration(fromVersion: string, migration: MigrationFn): void {
    this.migrations.set(fromVersion, migration)
  }

  /** セーブデータを保存する */
  async save(data: SaveData, slot?: number): Promise<void> {
    const slotIndex = slot ?? data.meta.slotIndex
    const jsonStr = JSON.stringify(data)
    const checksum = calcChecksum(jsonStr)

    let payload: string
    if (this.compressionEnabled) {
      const compressed = await compress(jsonStr)
      payload = this.encryptionEnabled ? await encrypt(compressed) : compressed
    } else {
      payload = this.encryptionEnabled ? await encrypt(jsonStr) : jsonStr
    }

    const record: SaveRecord = {
      id: `save_${slotIndex}`,
      slotIndex,
      savedAt: Date.now(),
      version: data.meta.version,
      metaJson: JSON.stringify(data.meta),
      dataPayload: payload,
      checksum,
      encrypted: this.encryptionEnabled,
      compressed: this.compressionEnabled,
    }

    await this.db.saves.put(record)
  }

  /** 指定スロットからロードする */
  async load(slotIndex: number): Promise<SaveData | null> {
    const record = await this.db.saves.get(`save_${slotIndex}`)
    if (!record) return null
    return this.decodeRecord(record)
  }

  /** レコードをデコードする */
  private async decodeRecord(record: SaveRecord): Promise<SaveData> {
    let payload = record.dataPayload

    if (record.encrypted) {
      payload = await decrypt(payload)
    }

    if (record.compressed) {
      payload = await decompress(payload, true)
    } else if (!record.encrypted) {
      // 非暗号化・非圧縮の場合はそのまま
    }

    // チェックサム検証
    const checksum = calcChecksum(payload)
    if (checksum !== record.checksum) {
      throw new Error(`Save data corrupted (checksum mismatch) in slot ${record.slotIndex}`)
    }

    let data = JSON.parse(payload) as SaveData

    // バージョンマイグレーション
    if (data.meta.version !== GAME_CONSTANTS.SAVE_VERSION) {
      const migration = this.migrations.get(data.meta.version)
      if (migration) {
        data = migration(data)
      } else {
        console.warn(`[SaveManager] No migration for version ${data.meta.version}`)
      }
    }

    return data
  }

  /** オートセーブを実行する（ローテーション） */
  async autoSave(data: SaveData, rotationIndex: number): Promise<void> {
    const slot = AUTO_SAVE_SLOT_START + (rotationIndex % AUTO_SAVE_SLOT_COUNT)
    const autoData: SaveData = {
      ...data,
      meta: { ...data.meta, slotIndex: slot },
    }
    await this.save(autoData, slot)
  }

  /** 全スロットのメタ情報を取得する */
  async listSaves(): Promise<SaveMeta[]> {
    const records = await this.db.saves
      .orderBy('slotIndex')
      .toArray()
    return records.map((r) => JSON.parse(r.metaJson) as SaveMeta)
  }

  /** 指定スロットのセーブを削除する */
  async deleteSave(slotIndex: number): Promise<void> {
    await this.db.saves.delete(`save_${slotIndex}`)
  }

  /** 全セーブを削除する */
  async deleteAll(): Promise<void> {
    await this.db.saves.clear()
  }

  /** セーブデータをエクスポートする（暗号化済み文字列） */
  async exportSave(slotIndex: number): Promise<string | null> {
    const record = await this.db.saves.get(`save_${slotIndex}`)
    if (!record) return null
    return JSON.stringify(record)
  }

  /** エクスポートされたデータをインポートする */
  async importSave(exportedJson: string, targetSlot: number): Promise<void> {
    const record = JSON.parse(exportedJson) as SaveRecord
    const data = await this.decodeRecord(record)
    const updated: SaveData = {
      ...data,
      meta: { ...data.meta, slotIndex: targetSlot },
    }
    await this.save(updated, targetSlot)
  }

  /** データベースを閉じる */
  close(): void {
    this.db.close()
  }
}
