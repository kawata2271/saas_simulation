/**
 * メインゲームレイアウト
 * PixiJSキャンバス + React UIオーバーレイの統合
 */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { OfficeRenderer } from '@rendering/OfficeRenderer.js'
import { useGameEngine } from '@ui/hooks/useGameEngine.js'
import { TopBar } from './TopBar.js'
import { RightPanel } from './RightPanel.js'
import { FoundingScreen } from '@ui/components/common/FoundingScreen.js'
import { BottomBar } from '@ui/components/common/BottomBar.js'
import { EventDialog } from '@ui/overlays/EventDialog.js'
import { NotificationToast } from '@ui/overlays/NotificationToast.js'

export function GameLayout(): ReactNode {
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<OfficeRenderer | null>(null)
  const { engine, simulation } = useGameEngine()
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    const container = canvasContainerRef.current
    if (!container) return

    const renderer = new OfficeRenderer()
    rendererRef.current = renderer
    renderer.init(container).catch((err: unknown) => {
      console.error('[GameLayout] Failed to init renderer:', err)
    })

    const handleResize = (): void => renderer.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      engine.stop()
      renderer.destroy()
      rendererRef.current = null
    }
  }, [engine])

  const handleGameStart = (): void => {
    setGameStarted(true)
    engine.start()
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-100">
      {/* PixiJS Canvas */}
      <div ref={canvasContainerRef} className="absolute inset-0" />

      {/* 会社設立画面 */}
      {!gameStarted && (
        <FoundingScreen simulation={simulation} onStart={handleGameStart} />
      )}

      {/* ゲーム中UI */}
      {gameStarted && (
        <>
          <TopBar />
          <RightPanel />
          <EventDialog />
          <NotificationToast />
          <BottomBar simulation={simulation} />
        </>
      )}
    </div>
  )
}
