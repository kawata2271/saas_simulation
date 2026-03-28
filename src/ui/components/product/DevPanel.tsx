/**
 * 開発パネル
 * 機能開発の開始、進捗確認、リリース、技術的負債管理
 */

import { useState, type ReactNode } from 'react'
import type { SimulationManager } from '@core/simulation/SimulationManager.js'

/** 機能名の候補 */
const FEATURE_NAME_TEMPLATES = [
  'ダッシュボード改善',
  'レポート機能',
  'API連携',
  '通知システム',
  'ユーザー管理',
  '権限管理',
  'データエクスポート',
  'ワークフロー自動化',
  'チャット統合',
  'モバイル対応',
  'AI分析機能',
  '検索機能強化',
  'SSO対応',
  '多言語対応',
  'カスタムフィールド',
]

interface DevPanelProps {
  simulation: SimulationManager
  onClose: () => void
}

export function DevPanel(props: DevPanelProps): ReactNode {
  const [featureName, setFeatureName] = useState('')
  const [complexity, setComplexity] = useState(2)
  const [, forceUpdate] = useState(0)

  const features = props.simulation.product.getFeatures()
  const productScore = props.simulation.product.getProductScore()
  const techDebt = props.simulation.product.getTechDebt()
  const bugCount = props.simulation.product.getBugCount()

  const handleStartFeature = (): void => {
    const name = featureName.trim() ||
      FEATURE_NAME_TEMPLATES[Math.floor(Math.random() * FEATURE_NAME_TEMPLATES.length)]
    props.simulation.startFeature(name, complexity)
    setFeatureName('')
    forceUpdate((n) => n + 1)
  }

  const handleRelease = (): void => {
    props.simulation.releaseFeatures()
    forceUpdate((n) => n + 1)
  }

  const inProgress = features.filter((f) => f.state === 'in_progress')
  const completed = features.filter((f) => f.state === 'completed')
  const released = features.filter((f) => f.state === 'released')

  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 w-[600px] max-h-[420px]
                    rounded-xl overflow-hidden"
         style={{ background: 'rgba(30,27,46,0.98)', border: '1px solid rgba(34,197,94,0.3)' }}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700/50">
        <div className="flex items-center gap-4">
          <h3 className="text-green-400 font-bold text-sm">プロダクト開発</h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-400">
              スコア: <span className="text-white font-bold">{productScore}</span>
            </span>
            <span className="text-gray-400">
              負債: <span className="text-yellow-400">{techDebt}</span>
            </span>
            <span className="text-gray-400">
              バグ: <span className="text-red-400">{bugCount}</span>
            </span>
          </div>
        </div>
        <button onClick={props.onClose} className="text-gray-500 hover:text-white text-xs">
          閉じる
        </button>
      </div>

      <div className="p-3 overflow-y-auto max-h-[360px] space-y-3">
        {/* 新機能開発フォーム */}
        <div className="p-3 rounded-lg bg-gray-800/40">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={featureName}
              onChange={(e) => setFeatureName(e.target.value)}
              placeholder="機能名（空欄でランダム）"
              maxLength={30}
              className="flex-1 px-3 py-1.5 rounded bg-gray-700/50 border border-gray-600/30
                         text-white text-xs placeholder-gray-500 outline-none
                         focus:border-green-400/50"
            />
            <select
              value={complexity}
              onChange={(e) => setComplexity(Number(e.target.value))}
              className="px-2 py-1.5 rounded bg-gray-700/50 border border-gray-600/30
                         text-white text-xs outline-none"
            >
              <option value={1}>簡単</option>
              <option value={2}>普通</option>
              <option value={3}>複雑</option>
              <option value={4}>大規模</option>
              <option value={5}>超大規模</option>
            </select>
            <button
              onClick={handleStartFeature}
              disabled={inProgress.length >= 3}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                inProgress.length < 3
                  ? 'bg-green-500 text-white hover:bg-green-400'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              開発開始
            </button>
          </div>
          {inProgress.length >= 3 && (
            <p className="text-yellow-400/70 text-[10px] mt-1">
              同時開発は最大3機能までです
            </p>
          )}
        </div>

        {/* 開発中 */}
        {inProgress.length > 0 && (
          <div>
            <h4 className="text-gray-400 text-xs mb-1.5 font-medium">開発中</h4>
            <div className="space-y-1">
              {inProgress.map((f) => (
                <FeatureRow key={f.id} name={f.name} state="開発中"
                  progress={1 - f.remainingEffort / f.totalEffort}
                  color="green" />
              ))}
            </div>
          </div>
        )}

        {/* 完成済み（未リリース） */}
        {completed.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-gray-400 text-xs font-medium">完成済み</h4>
              <button
                onClick={handleRelease}
                className="px-2 py-1 rounded text-[10px] font-bold bg-amber-500 text-gray-900 hover:bg-amber-400"
              >
                まとめてリリース
              </button>
            </div>
            <div className="space-y-1">
              {completed.map((f) => (
                <FeatureRow key={f.id} name={f.name} state="完成"
                  progress={1} quality={f.quality} color="amber" />
              ))}
            </div>
          </div>
        )}

        {/* リリース済み（最新5件） */}
        {released.length > 0 && (
          <div>
            <h4 className="text-gray-400 text-xs mb-1.5 font-medium">
              リリース済み ({released.length})
            </h4>
            <div className="space-y-1">
              {released.slice(-5).reverse().map((f) => (
                <FeatureRow key={f.id} name={f.name} state="リリース済"
                  progress={1} quality={f.quality} color="gray" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FeatureRow(props: {
  name: string
  state: string
  progress: number
  quality?: number
  color: string
}): ReactNode {
  const barColor: Record<string, string> = {
    green: 'bg-green-400/70',
    amber: 'bg-amber-400/70',
    gray: 'bg-gray-500/50',
  }

  return (
    <div className="flex items-center gap-2 py-1 px-2 rounded bg-gray-800/30">
      <span className="text-white text-xs flex-1 truncate">{props.name}</span>
      <div className="w-20 h-1.5 rounded-full bg-gray-700/60 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor[props.color] ?? 'bg-gray-400'}`}
          style={{ width: `${props.progress * 100}%` }}
        />
      </div>
      {props.quality !== undefined && (
        <span className="text-gray-400 text-[10px] w-8 text-right">Q{Math.round(props.quality)}</span>
      )}
      <span className="text-gray-500 text-[10px] w-12 text-right">{props.state}</span>
    </div>
  )
}
