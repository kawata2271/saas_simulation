/**
 * NotificationToast — 右上スタック通知
 * 最大3つ同時表示、自動消去(5秒)、4種別
 */

import { useEffect, type ReactNode } from 'react'
import { useUIStore } from '@ui/stores/uiStore.js'
import type { Notification } from '@ui/stores/uiStore.js'

const ICON_MAP: Record<string, { icon: string; bg: string; border: string }> = {
  info:    { icon: 'ℹ️', bg: 'bg-blue-50', border: 'border-l-blue-500' },
  success: { icon: '✅', bg: 'bg-emerald-50', border: 'border-l-emerald-500' },
  warning: { icon: '⚠️', bg: 'bg-amber-50', border: 'border-l-amber-500' },
  error:   { icon: '❌', bg: 'bg-red-50', border: 'border-l-red-500' },
}

/** 個別トースト */
function Toast(props: { notification: Notification; onDismiss: () => void }): ReactNode {
  const { notification: n, onDismiss } = props
  const style = ICON_MAP[n.type] ?? ICON_MAP['info']

  useEffect(() => {
    if (n.type === 'error') return // errorは手動消去
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
  }, [n.type, onDismiss])

  return (
    <div className={`glass-panel border-l-4 ${style.border} ${style.bg} px-3 py-2.5 flex items-start gap-2 animate-slide-in-right max-w-[300px]`}
         role="alert">
      <span className="text-sm shrink-0 mt-0.5">{style.icon}</span>
      <p className="text-[12px] text-slate-700 flex-1 leading-snug">{n.message}</p>
      <button onClick={onDismiss} className="text-slate-300 hover:text-slate-500 text-xs shrink-0" aria-label="閉じる">
        ✕
      </button>
    </div>
  )
}

export function NotificationToast(): ReactNode {
  const notifications = useUIStore((s) => s.notifications)
  const removeNotification = useUIStore((s) => s.removeNotification)

  // 最新3件のみ表示
  const visible = notifications.slice(-3)

  if (visible.length === 0) return null

  return (
    <div className="absolute top-16 right-[276px] z-50 flex flex-col gap-2 pointer-events-auto">
      {visible.map((n) => (
        <Toast key={n.id} notification={n} onDismiss={() => removeNotification(n.id)} />
      ))}
    </div>
  )
}
