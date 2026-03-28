/**
 * 会社設立画面
 * ゲーム開始時に会社名、業界、創業者名を入力する
 */

import { useState, type ReactNode } from 'react'
import type { SimulationManager } from '@core/simulation/SimulationManager.js'
import type { Industry } from '@game-types/company.js'
import { INDUSTRIES } from '@game-types/company.js'
import { FINANCE_CONSTANTS } from '@core/data/constants.js'

/** 業界の日本語ラベル */
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
    props.simulation.foundCompany(
      {
        name: companyName.trim(),
        industry,
        founderName: founderName.trim(),
        initialCash: FINANCE_CONSTANTS.INITIAL_CASH,
        mission: mission.trim() || 'テクノロジーで世界を変える',
      },
      0,
    )
    props.onStart()
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center"
         style={{ background: 'rgba(10,8,20,0.9)' }}>
      <div className="w-full max-w-lg p-8 rounded-2xl"
           style={{ background: 'rgba(30,27,46,0.98)', border: '1px solid rgba(74,70,96,0.5)' }}>
        {/* タイトル */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-400 tracking-wider">
            SAAS EMPIRE
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            SaaS企業を創業し、帝国を築き上げよ
          </p>
        </div>

        {/* フォーム */}
        <div className="space-y-5">
          <div>
            <label className="block text-gray-400 text-xs mb-1.5">会社名</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="例: CloudSync Inc."
              maxLength={30}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-800/60 border border-gray-600/50
                         text-white text-sm placeholder-gray-500 outline-none
                         focus:border-amber-400/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs mb-1.5">創業者名</label>
            <input
              type="text"
              value={founderName}
              onChange={(e) => setFounderName(e.target.value)}
              placeholder="例: 田中 太郎"
              maxLength={20}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-800/60 border border-gray-600/50
                         text-white text-sm placeholder-gray-500 outline-none
                         focus:border-amber-400/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs mb-1.5">業界</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value as Industry)}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-800/60 border border-gray-600/50
                         text-white text-sm outline-none
                         focus:border-amber-400/50 transition-colors"
            >
              {Object.entries(INDUSTRY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-xs mb-1.5">
              ミッション <span className="text-gray-600">(任意)</span>
            </label>
            <input
              type="text"
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              placeholder="テクノロジーで世界を変える"
              maxLength={50}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-800/60 border border-gray-600/50
                         text-white text-sm placeholder-gray-500 outline-none
                         focus:border-amber-400/50 transition-colors"
            />
          </div>
        </div>

        {/* 初期資金表示 */}
        <div className="mt-6 p-3 rounded-lg bg-gray-800/40 flex items-center justify-between">
          <span className="text-gray-400 text-xs">初期資金</span>
          <span className="text-green-400 font-bold text-sm">
            {FINANCE_CONSTANTS.INITIAL_CASH.toLocaleString()}万円
          </span>
        </div>

        {/* 開始ボタン */}
        <button
          onClick={handleStart}
          disabled={!canStart}
          className={`w-full mt-6 py-3 rounded-xl font-bold text-sm tracking-wider
                     transition-all duration-200 ${
            canStart
              ? 'bg-amber-500 text-gray-900 hover:bg-amber-400 active:scale-[0.98]'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          会社を設立する
        </button>
      </div>
    </div>
  )
}
