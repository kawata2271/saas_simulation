/**
 * 開発パネル — ライトテーマ版
 */

import { useState, type ReactNode } from 'react'
import type { SimulationManager } from '@core/simulation/SimulationManager.js'

const FEATURE_NAMES = [
  'ダッシュボード改善', 'レポート機能', 'API連携', '通知システム', 'ユーザー管理',
  '権限管理', 'データエクスポート', 'ワークフロー自動化', 'チャット統合', 'モバイル対応',
  'AI分析機能', '検索機能強化', 'SSO対応', '多言語対応', 'カスタムフィールド',
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

  const handleStart = (): void => {
    const name = featureName.trim() || FEATURE_NAMES[Math.floor(Math.random() * FEATURE_NAMES.length)]
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
    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-50 w-[560px] max-h-[400px] glass-panel border border-emerald-200 overflow-hidden animate-slide-up">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-bold text-emerald-600">プロダクト開発</h3>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-slate-400">スコア <span className="font-mono font-bold text-slate-700">{productScore}</span></span>
            <span className="text-slate-400">負債 <span className="font-mono font-bold text-amber-600">{techDebt}</span></span>
            <span className="text-slate-400">バグ <span className="font-mono font-bold text-red-500">{bugCount}</span></span>
          </div>
        </div>
        <button onClick={props.onClose} className="text-slate-400 hover:text-slate-600 text-xs font-medium">閉じる</button>
      </div>

      <div className="p-3 overflow-y-auto max-h-[340px] space-y-3">
        {/* 新機能フォーム */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-2">
            <input type="text" value={featureName} onChange={(e) => setFeatureName(e.target.value)}
              placeholder="機能名（空欄でランダム）" maxLength={30}
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-emerald-400" />
            <select value={complexity} onChange={(e) => setComplexity(Number(e.target.value))}
              className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 outline-none">
              <option value={1}>簡単</option><option value={2}>普通</option>
              <option value={3}>複雑</option><option value={4}>大規模</option><option value={5}>超大規模</option>
            </select>
            <button onClick={handleStart} disabled={inProgress.length >= 3}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                inProgress.length < 3 ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}>開発開始</button>
          </div>
          {inProgress.length >= 3 && <p className="text-amber-500 text-[10px] mt-1">同時開発は最大3機能まで</p>}
        </div>

        {inProgress.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-500 mb-1.5">開発中</h4>
            {inProgress.map((f) => (
              <FeatureRow key={f.id} name={f.name} progress={1 - f.remainingEffort / f.totalEffort} color="emerald" tag="開発中" />
            ))}
          </div>
        )}
        {completed.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-xs font-semibold text-slate-500">完成済み</h4>
              <button onClick={handleRelease}
                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500 text-white hover:bg-amber-600">リリース</button>
            </div>
            {completed.map((f) => (
              <FeatureRow key={f.id} name={f.name} progress={1} quality={f.quality} color="amber" tag="完成" />
            ))}
          </div>
        )}
        {released.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-500 mb-1.5">リリース済み ({released.length})</h4>
            {released.slice(-5).reverse().map((f) => (
              <FeatureRow key={f.id} name={f.name} progress={1} quality={f.quality} color="slate" tag="済" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FeatureRow(props: { name: string; progress: number; quality?: number; color: string; tag: string }): ReactNode {
  const barColors: Record<string, string> = { emerald: 'bg-emerald-400', amber: 'bg-amber-400', slate: 'bg-slate-300' }
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded bg-white border border-slate-100 mb-1">
      <span className="text-xs text-slate-700 flex-1 truncate">{props.name}</span>
      <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${barColors[props.color] ?? 'bg-slate-300'}`} style={{ width: `${props.progress * 100}%` }} />
      </div>
      {props.quality !== undefined && <span className="text-[10px] text-slate-400 font-mono w-7 text-right">Q{Math.round(props.quality)}</span>}
      <span className="text-[10px] text-slate-400 w-10 text-right">{props.tag}</span>
    </div>
  )
}
