/**
 * 営業パネル — ライトテーマ版
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

  const handleBudget = (v: number): void => {
    setBudget(v)
    props.simulation.setMarketingBudget(v)
  }

  return (
    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-50 w-[520px] glass-panel border border-violet-200 overflow-hidden animate-slide-up">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
        <h3 className="text-sm font-bold text-violet-600">営業 / マーケティング</h3>
        <button onClick={props.onClose} className="text-slate-400 hover:text-slate-600 text-xs font-medium">閉じる</button>
      </div>

      <div className="p-4 space-y-4">
        {/* KPIグリッド */}
        <div className="grid grid-cols-4 gap-2">
          <KpiCard label="MRR" value={`${mrr.toLocaleString()}`} unit="万" color="text-emerald-600" />
          <KpiCard label="ARR" value={`${arr.toLocaleString()}`} unit="万" color="text-blue-600" />
          <KpiCard label="顧客数" value={`${funnel.activeCustomers}`} color="text-slate-800" />
          <KpiCard label="ARPU" value={`${arpu.toFixed(1)}`} unit="万" color="text-violet-600" />
        </div>

        {/* ファネル */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <h4 className="text-xs font-semibold text-slate-500 mb-2">セールスファネル</h4>
          <div className="space-y-1.5">
            <FunnelBar label="リード" value={Math.floor(funnel.leads)} color="bg-slate-400" />
            <FunnelBar label="トライアル" value={funnel.trials} color="bg-blue-400" />
            <FunnelBar label="有料顧客" value={funnel.activeCustomers} color="bg-emerald-500" />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-slate-400">
            <span>今月新規: {funnel.newCustomersThisMonth}</span>
            <span>今月解約: {funnel.churnedThisMonth}</span>
          </div>
        </div>

        {/* マーケティング予算 */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-500">マーケティング予算</h4>
            <span className="font-mono text-xs font-bold text-violet-600">{budget}万円/月</span>
          </div>
          <input type="range" min={0} max={200} step={5} value={budget}
            onChange={(e) => handleBudget(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-slate-200 cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500" />
          <div className="flex justify-between text-[10px] text-slate-300 mt-0.5">
            <span>0</span><span>100万</span><span>200万</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard(props: { label: string; value: string; unit?: string; color: string }): ReactNode {
  return (
    <div className="bg-white rounded-lg p-2 text-center border border-slate-100">
      <p className="text-[10px] text-slate-400 font-medium">{props.label}</p>
      <p className={`font-mono text-sm font-bold ${props.color}`}>
        {props.value}<span className="text-[9px] text-slate-400 font-normal">{props.unit}</span>
      </p>
    </div>
  )
}

function FunnelBar(props: { label: string; value: number; color: string }): ReactNode {
  const w = Math.min(100, Math.max(3, props.value * 0.8))
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-400 w-14">{props.label}</span>
      <div className="flex-1 h-3 rounded bg-slate-100 overflow-hidden">
        <div className={`h-full rounded ${props.color}`} style={{ width: `${w}%` }} />
      </div>
      <span className="font-mono text-[11px] text-slate-600 w-6 text-right">{props.value}</span>
    </div>
  )
}
