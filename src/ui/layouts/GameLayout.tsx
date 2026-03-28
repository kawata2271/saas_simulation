/**
 * メインゲームレイアウト
 * PixiJSキャンバス + React UIオーバーレイの統合レイアウト
 */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { OfficeRenderer } from '@rendering/OfficeRenderer.js'
import { useGameEngine } from '@ui/hooks/useGameEngine.js'
import { HUD } from './HUD.js'
import { SidePanel } from './SidePanel.js'
import { FoundingScreen } from '@ui/components/common/FoundingScreen.js'
import { BottomBar } from '@ui/components/common/BottomBar.js'

/**
 * GameLayout — メインゲーム画面
 */
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

    const handleResize = (): void => {
      renderer.resize()
    }
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
    <div className="relative w-full h-full overflow-hidden">
      {/* PixiJS Canvas layer */}
      <div
        ref={canvasContainerRef}
        className="absolute inset-0"
      />

      {/* ゲーム開始前: 会社設立画面 */}
      {!gameStarted && (
        <FoundingScreen
          simulation={simulation}
          onStart={handleGameStart}
        />
      )}

      {/* ゲーム開始後: HUD + パネル */}
      {gameStarted && (
        <>
          <HUD />
          <SidePanel />
          <BottomBar simulation={simulation} />
        </>
      )}
    </div>
  )
}
