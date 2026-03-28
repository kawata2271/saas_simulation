/**
 * 営業パネル
 * ファネル状況、マーケティング予算設定、KPI表示
 */

import { useState, type ReactNode } from 'react'
import type { SimulationManager } from '@core/simulation/SimulationManager.js'

interface SalesPanelProps {
  simulation: SimulationManager
  onClose: () => void
}

export function SalesPanel(props: SalesPanelProps): ReactNode {
  const funnel = props.simulation.sales.getFunnelStats()
  const mrr = props.simulation.sales.getMRR()
  const arr = props.simulation.sales.getARR()
  const arpu = props.simulation.sales.getARPU()
  const currentBudget = props.simulation.sales.getMarketingBudget()
  const [budget, setBudget] = useState(currentBudget)

  const handleBudgetChange = (value: number): void => {
    setBudget(value)
    props.simulation.setMarketingBudget(value)
  }

  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 w-[550px]
                    rounded-xl overflow-hidden"
         style={{ background: 'rgba(30,27,46,0.98)', border: '1px solid rgba(168,85,247,0.3)' }}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700/50">
        <h3 className="text-purple-400 font-bold text-sm">営業 / マーケティング</h3>
        <button onClick={props.onClose} className="text-gray-500 hover:text-white text-xs">
          閉じる
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* KPIグリッド */}
        <div className="grid grid-cols-4 gap-2">
          <KPICard label="MRR" value={`${mrr.toLocaleString()}万`} color="text-green-400" />
          <KPICard label="ARR" value={`${arr.toLocaleString()}万`} color="text-amber-400" />
          <KPICard label="顧客数" value={`${funnel.activeCustomers}`} color="text-blue-400" />
          <KPICard label="ARPU" value={`${arpu.toFixed(1)}万`} color="text-purple-400" />
        </div>

        {/* ファネル */}
        <div className="p-3 rounded-lg bg-gray-800/40">
          <h4 className="text-gray-400 text-xs font-medium mb-2">セールスファネル</h4>
          <div className="space-y-1.5">
            <FunnelRow label="リード" value={Math.floor(funnel.leads)} color="bg-gray-500" maxWidth={100} />
            <FunnelRow label="トライアル" value={funnel.trials} color="bg-blue-500" maxWidth={80} />
            <FunnelRow label="有料顧客" value={funnel.activeCustomers} color="bg-green-500" maxWidth={60} />
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px]">
            <span className="text-gray-500">今月の新規: {funnel.newCustomersThisMonth}</span>
            <span className="text-gray-500">今月の解約: {funnel.churnedThisMonth}</span>
          </div>
        </div>

        {/* マーケティング予算 */}
        <div className="p-3 rounded-lg bg-gray-800/40">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-gray-400 text-xs font-medium">マーケティング予算</h4>
            <span className="text-white text-xs font-bold">{budget}万円/月</span>
          </div>
          <input
            type="range"
            min={0}
            max={200}
            step={5}
            value={budget}
            onChange={(e) => handleBudgetChange(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-gray-700
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-purple-400
                       [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-600 mt-1">
            <span>0万</span>
            <span>100万</span>
            <span>200万</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function KPICard(props: { label: string; value: string; color: string }): ReactNode {
  return (
    <div className="p-2 rounded-lg bg-gray-800/40 text-center">
      <p className="text-gray-500 text-[10px]">{props.label}</p>
      <p className={`${props.color} font-bold text-sm`}>{props.value}</p>
    </div>
  )
}

function FunnelRow(props: {
  label: string
  value: number
  color: string
  maxWidth: number
}): ReactNode {
  const width = Math.min(props.maxWidth, Math.max(5, props.value * 0.5))
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 text-[10px] w-14">{props.label}</span>
      <div className="flex-1 h-3 rounded-sm overflow-hidden bg-gray-700/30">
        <div
          className={`h-full rounded-sm ${props.color}/60`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-white text-xs w-8 text-right">{props.value}</span>
    </div>
  )
}
