/**
 * UI状態ストア
 * サイドパネル、モーダル、通知などのUI状態を管理
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

/** サイドパネルのタブ */
export const SIDE_PANEL_TABS = {
  OVERVIEW: 'overview',
  FINANCE: 'finance',
  HR: 'hr',
  PRODUCT: 'product',
  MARKET: 'market',
} as const satisfies Record<string, string>

export type SidePanelTab = (typeof SIDE_PANEL_TABS)[keyof typeof SIDE_PANEL_TABS]

/** 通知 */
export interface Notification {
  readonly id: string
  readonly type: 'info' | 'success' | 'warning' | 'error'
  readonly message: string
  readonly timestamp: number
}

interface UIStoreState {
  /** サイドパネルが開いているか */
  sidePanelOpen: boolean
  /** 現在のサイドパネルタブ */
  sidePanelTab: SidePanelTab
  /** イベントダイアログが開いているか */
  eventDialogOpen: boolean
  /** 通知キュー */
  notifications: Notification[]
  /** 設定画面が開いているか */
  settingsOpen: boolean
  /** チュートリアルが有効か */
  tutorialActive: boolean
}

interface UIStoreActions {
  toggleSidePanel: () => void
  setSidePanelTab: (tab: SidePanelTab) => void
  setEventDialogOpen: (open: boolean) => void
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  setSettingsOpen: (open: boolean) => void
  setTutorialActive: (active: boolean) => void
}

export const useUIStore = create<UIStoreState & UIStoreActions>()(
  immer((set) => ({
    sidePanelOpen: false,
    sidePanelTab: SIDE_PANEL_TABS.OVERVIEW,
    eventDialogOpen: false,
    notifications: [],
    settingsOpen: false,
    tutorialActive: false,

    toggleSidePanel: () =>
      set((state) => {
        state.sidePanelOpen = !state.sidePanelOpen
      }),

    setSidePanelTab: (tab) =>
      set((state) => {
        state.sidePanelTab = tab
        state.sidePanelOpen = true
      }),

    setEventDialogOpen: (open) =>
      set((state) => {
        state.eventDialogOpen = open
      }),

    addNotification: (notification) =>
      set((state) => {
        const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
        state.notifications.push({
          ...notification,
          id,
          timestamp: Date.now(),
        })
        // 最大10件
        if (state.notifications.length > 10) {
          state.notifications.shift()
        }
      }),

    removeNotification: (id) =>
      set((state) => {
        state.notifications = state.notifications.filter((n) => n.id !== id)
      }),

    setSettingsOpen: (open) =>
      set((state) => {
        state.settingsOpen = open
      }),

    setTutorialActive: (active) =>
      set((state) => {
        state.tutorialActive = active
      }),
  })),
)
