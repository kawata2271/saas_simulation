/**
 * 設定ストア
 * ゲーム設定（音量、言語、自動セーブ等）を管理し永続化する
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { GameSettings } from '@game-types/game.js'

interface SettingsStoreState extends GameSettings {}

interface SettingsStoreActions {
  setLocale: (locale: string) => void
  setMasterVolume: (volume: number) => void
  setBgmVolume: (volume: number) => void
  setSeVolume: (volume: number) => void
  setAutoSave: (enabled: boolean) => void
  setShowTutorial: (show: boolean) => void
}

const defaultSettings: GameSettings = {
  locale: 'ja',
  masterVolume: 0.8,
  bgmVolume: 0.6,
  seVolume: 0.8,
  autoSaveEnabled: true,
  autoSaveIntervalDays: 30,
  showTutorial: true,
}

export const useSettingsStore = create<SettingsStoreState & SettingsStoreActions>()(
  persist(
    immer((set) => ({
      ...defaultSettings,

      setLocale: (locale) =>
        set((state) => {
          state.locale = locale
        }),

      setMasterVolume: (volume) =>
        set((state) => {
          state.masterVolume = Math.max(0, Math.min(1, volume))
        }),

      setBgmVolume: (volume) =>
        set((state) => {
          state.bgmVolume = Math.max(0, Math.min(1, volume))
        }),

      setSeVolume: (volume) =>
        set((state) => {
          state.seVolume = Math.max(0, Math.min(1, volume))
        }),

      setAutoSave: (enabled) =>
        set((state) => {
          state.autoSaveEnabled = enabled
        }),

      setShowTutorial: (show) =>
        set((state) => {
          state.showTutorial = show
        }),
    })),
    {
      name: 'saas-empire-settings',
    },
  ),
)
