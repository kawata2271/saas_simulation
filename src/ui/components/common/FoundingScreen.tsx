/**
 * 会社設立画面 — ライトテーマ版
 */

import { useState, type ReactNode } from 'react'
import type { SimulationManager } from '@core/simulation/SimulationManager.js'
import type { Industry } from '@game-types/company.js'
import { INDUSTRIES } from '@game-types/company.js'
import { FINANCE_CONSTANTS } from '@core/data/constants.js'

const INDUSTRY_LABELS: Record<Industry, string> = {
  [INDUSTRIES.HORIZONTAL_SAAS]: '水平SaaS',
  [INDUSTRIES.VERTICAL_SAAS]: '業種特化SaaS',
  [INDUSTRIES.FINTECH]: 'フィンテック',
  [INDUSTRIES.HEALTHTECH]: 'ヘルステック',
  [INDUSTRIES.EDTECH]: 'エドテック',
  [INDUSTRIES.HR_TECH]: 'HR Tech',
  [INDUSTRIES.SECURITY]: 'セキュリティ',
  [INDUSTRIES.AI_ML]: 'AI/ML',
  [INDUSTRIES.DEV_TOOLS]: '開発者ツール',
  [INDUSTRIES.MARTECH]: 'マーテック',
}

interface FoundingScreenProps {
  simulation: SimulationManager
  onStart: () => void
}

export function FoundingScreen(props: FoundingScreenProps): ReactNode {
  const [companyName, setCompanyName] = useState('')
  const [founderName, setFounderName] = useState('')
  const [industry, setIndustry] = useState<Industry>(INDUSTRIES.HORIZONTAL_SAAS)
  const [mission, setMission] = useState('')

  const canStart = companyName.trim().length > 0 && founderName.trim().length > 0

  const handleStart = (): void => {
    if (!canStart) return
    props.simulation.foundCompany({
      name: companyName.trim(),
      industry,
      founderName: founderName.trim(),
      initialCash: FINANCE_CONSTANTS.INITIAL_CASH,
      mission: mission.trim() || 'テクノロジーで世界を変える',
    }, 0)
    props.onStart()
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(241,245,249,0.95)' }}>
      <div className="w-full max-w-md glass-panel p-8 animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">S</div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">SAAS EMPIRE</h1>
          <p className="text-slate-400 text-sm mt-1">SaaS企業を創業し、帝国を築き上げよ</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">会社名</label>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
              placeholder="例: CloudSync Inc." maxLength={30}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder-slate-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">創業者名</label>
            <input type="text" value={founderName} onChange={(e) => setFounderName(e.target.value)}
              placeholder="例: 田中 太郎" maxLength={20}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder-slate-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">業界</label>
            <select value={industry} onChange={(e) => setIndustry(e.target.value as Industry)}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all">
              {Object.entries(INDUSTRY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              ミッション <span className="text-slate-300">(任意)</span>
            </label>
            <input type="text" value={mission} onChange={(e) => setMission(e.target.value)}
              placeholder="テクノロジーで世界を変える" maxLength={50}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder-slate-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>
        </div>

        <div className="mt-5 p-3 rounded-lg bg-emerald-50 flex items-center justify-between">
          <span className="text-xs text-emerald-600 font-medium">初期資金</span>
          <span className="font-mono text-sm font-bold text-emerald-700">
            {FINANCE_CONSTANTS.INITIAL_CASH.toLocaleString()}万円
          </span>
        </div>

        <button onClick={handleStart} disabled={!canStart}
          className={`w-full mt-5 py-3 rounded-xl font-semibold text-sm tracking-wide transition-all ${
            canStart
              ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-200'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}>
          会社を設立する
        </button>
      </div>
    </div>
  )
}
