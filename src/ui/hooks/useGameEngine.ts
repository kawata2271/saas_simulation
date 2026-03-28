/**
 * ゲームエンジン接続フック
 * GameEngine + SimulationManagerのシングルトンを管理し、React UIと同期する
 */

import { useEffect, useRef } from 'react'
import { GameEngine } from '@core/engine/GameEngine.js'
import { SimulationManager } from '@core/simulation/SimulationManager.js'
import { useGameStore } from '@ui/stores/gameStore.js'

/** シングルトン */
let engineInstance: GameEngine | null = null
let simInstance: SimulationManager | null = null

/** GameEngineのシングルトンを取得する */
export function getGameEngine(): GameEngine {
  if (!engineInstance) {
    engineInstance = new GameEngine()
  }
  return engineInstance
}

/** SimulationManagerのシングルトンを取得する */
export function getSimulation(): SimulationManager {
  if (!simInstance) {
    const engine = getGameEngine()
    simInstance = new SimulationManager(engine.eventBus)
  }
  return simInstance
}

/**
 * useGameEngine — GameEngine + SimulationをReactコンポーネントに接続する
 */
export function useGameEngine(): {
  engine: GameEngine
  simulation: SimulationManager
} {
  const engine = useRef(getGameEngine()).current
  const simulation = useRef(getSimulation()).current
  const store = useGameStore

  useEffect(() => {
    // ティックごとにシミュレーション更新 → UI同期
    const unsubTick = engine.eventBus.on('tick', () => {
      const date = engine.scheduler.getCurrentDate()
      store.getState().setDate(date)

      if (simulation.isInitialized()) {
        const snap = simulation.updateTick(date)
        store.getState().setCash(snap.cash)
        store.getState().setValuation(snap.valuation)
        store.getState().setHeadcount(snap.headcount)
      }
    })

    const unsubPause = engine.eventBus.on('game:paused', () => {
      store.getState().setPaused(true)
    })

    const unsubResume = engine.eventBus.on('game:resumed', () => {
      store.getState().setPaused(false)
    })

    return () => {
      unsubTick()
      unsubPause()
      unsubResume()
    }
  }, [engine, simulation, store])

  return { engine, simulation }
}
