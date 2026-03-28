/**
 * マクロ経済イベント定義（15イベント）
 */

import type { GameEventDefinition } from '@game-types/events.js'

export const macroEvents: GameEventDefinition[] = [
  {
    id: 'macro_rate_hike', category: 'macro', severity: 'warning',
    titleKey: '金利引き上げ', descriptionKey: '中央銀行が政策金利を0.25%引き上げました。資金調達環境が厳しくなる可能性があります。',
    conditions: [{ type: 'stat', field: 'companyAge', operator: 'gte', value: 4 }],
    probability: 0.03, cooldownDays: 120, maxOccurrences: 5, earliestTick: 100,
    choices: [
      { id: 'hedge', labelKey: 'コスト削減で備える', descriptionKey: '経費10%カット', effects: [{ target: 'finance', field: 'monthlyExpense', operator: 'multiply', value: 0.9, duration: 60 }] },
      { id: 'aggressive', labelKey: '攻めの投資を継続', descriptionKey: 'チャンスを狙う', effects: [{ target: 'company', field: 'reputation', operator: 'add', value: 3, duration: 0 }] },
    ],
  },
  {
    id: 'macro_recession', category: 'macro', severity: 'critical',
    titleKey: '景気後退入り', descriptionKey: '景気が後退局面に入りました。顧客の予算削減が始まっています。',
    conditions: [{ type: 'stat', field: 'companyAge', operator: 'gte', value: 8 }],
    probability: 0.01, cooldownDays: 250, maxOccurrences: 3, earliestTick: 500,
    choices: [
      { id: 'cut', labelKey: 'リストラ実施', descriptionKey: '人件費を30%削減', effects: [{ target: 'hr', field: 'headcount', operator: 'multiply', value: 0.7, duration: 0 }] },
      { id: 'invest', labelKey: '逆張り投資', descriptionKey: '不況時に人材確保', effects: [{ target: 'company', field: 'reputation', operator: 'add', value: 5, duration: 0 }] },
      { id: 'freeze', labelKey: '採用凍結のみ', descriptionKey: '現状維持', effects: [{ target: 'hr', field: 'motivation', operator: 'add', value: -5, duration: 30 }] },
    ],
  },
  {
    id: 'macro_boom', category: 'macro', severity: 'opportunity',
    titleKey: '好景気到来', descriptionKey: 'IT投資が活発化しています。企業のSaaS導入意欲が高まっています。',
    conditions: [{ type: 'stat', field: 'activeCustomers', operator: 'gte', value: 5 }],
    probability: 0.02, cooldownDays: 200, maxOccurrences: 5, earliestTick: 60,
    choices: [
      { id: 'expand', labelKey: '積極的に営業拡大', descriptionKey: 'マーケ予算倍増', effects: [{ target: 'sales', field: 'leadGen', operator: 'multiply', value: 1.5, duration: 60 }] },
      { id: 'quality', labelKey: 'プロダクト強化に集中', descriptionKey: '品質向上', effects: [{ target: 'product', field: 'quality', operator: 'add', value: 10, duration: 0 }] },
    ],
  },
  {
    id: 'macro_regulation', category: 'macro', severity: 'warning',
    titleKey: '個人情報保護法改正', descriptionKey: '新しい個人情報保護規制が施行されます。対応が必要です。',
    conditions: [{ type: 'stat', field: 'activeCustomers', operator: 'gte', value: 20 }],
    probability: 0.02, cooldownDays: 250, maxOccurrences: 2, earliestTick: 200,
    choices: [
      { id: 'comply_fast', labelKey: '即座に対応チームを編成', descriptionKey: '開発リソースを割く', effects: [{ target: 'product', field: 'devSpeed', operator: 'multiply', value: 0.8, duration: 30 }, { target: 'company', field: 'reputation', operator: 'add', value: 5, duration: 0 }] },
      { id: 'delay', labelKey: '期限ギリギリまで様子見', descriptionKey: 'リスクあり', effects: [{ target: 'company', field: 'reputation', operator: 'add', value: -3, duration: 0 }] },
    ],
  },
  {
    id: 'macro_tax_change', category: 'macro', severity: 'info',
    titleKey: '法人税率変更', descriptionKey: '法人税の実効税率が変更されました。',
    conditions: [{ type: 'stat', field: 'companyAge', operator: 'gte', value: 4 }],
    probability: 0.01, cooldownDays: 250, maxOccurrences: 3, earliestTick: 250,
    choices: [
      { id: 'accept', labelKey: '対応する', descriptionKey: '経理チームが対応', effects: [] },
    ],
  },
  {
    id: 'macro_currency', category: 'macro', severity: 'info',
    titleKey: '為替変動', descriptionKey: '円安が進行しています。海外SaaSのコストが上昇しています。',
    conditions: [{ type: 'stat', field: 'companyAge', operator: 'gte', value: 2 }],
    probability: 0.03, cooldownDays: 90, maxOccurrences: 10, earliestTick: 60,
    choices: [
      { id: 'domestic', labelKey: '国産ツールに切り替え', descriptionKey: 'コスト抑制', effects: [{ target: 'finance', field: 'serverCost', operator: 'multiply', value: 0.9, duration: 60 }] },
      { id: 'keep', labelKey: '現状維持', descriptionKey: '影響は限定的', effects: [] },
    ],
  },
  {
    id: 'macro_pandemic', category: 'macro', severity: 'critical',
    titleKey: 'パンデミック発生', descriptionKey: '感染症のパンデミックが宣言されました。リモートワーク需要が急増しています。',
    conditions: [{ type: 'stat', field: 'companyAge', operator: 'gte', value: 4 }],
    probability: 0.003, cooldownDays: 500, maxOccurrences: 1, earliestTick: 250,
    choices: [
      { id: 'remote', labelKey: '完全リモートに移行', descriptionKey: 'オフィス費削減、生産性一時低下', effects: [{ target: 'finance', field: 'officeCost', operator: 'multiply', value: 0.3, duration: 120 }, { target: 'product', field: 'devSpeed', operator: 'multiply', value: 0.85, duration: 30 }] },
      { id: 'hybrid', labelKey: 'ハイブリッド勤務', descriptionKey: 'バランス重視', effects: [{ target: 'finance', field: 'officeCost', operator: 'multiply', value: 0.6, duration: 120 }] },
    ],
  },
  {
    id: 'macro_ai_boom', category: 'macro', severity: 'opportunity',
    titleKey: 'AI革命の波', descriptionKey: '生成AI技術が爆発的に普及しています。AI機能の需要が急増中です。',
    conditions: [{ type: 'stat', field: 'productScore', operator: 'gte', value: 20 }],
    probability: 0.02, cooldownDays: 200, maxOccurrences: 2, earliestTick: 100,
    choices: [
      { id: 'ai_feature', labelKey: 'AI機能を緊急開発', descriptionKey: 'トレンドに乗る', effects: [{ target: 'product', field: 'quality', operator: 'add', value: 15, duration: 0 }, { target: 'sales', field: 'leadGen', operator: 'multiply', value: 1.3, duration: 90 }] },
      { id: 'wait', labelKey: '様子を見る', descriptionKey: '技術成熟を待つ', effects: [] },
    ],
  },
  {
    id: 'macro_supply_chain', category: 'macro', severity: 'warning',
    titleKey: 'サプライチェーン混乱', descriptionKey: '半導体不足によりクラウドインフラのコストが上昇しています。',
    conditions: [{ type: 'stat', field: 'activeCustomers', operator: 'gte', value: 10 }],
    probability: 0.015, cooldownDays: 180, maxOccurrences: 3, earliestTick: 150,
    choices: [
      { id: 'optimize', labelKey: 'インフラ最適化', descriptionKey: 'エンジニアを投入して効率化', effects: [{ target: 'finance', field: 'serverCost', operator: 'multiply', value: 0.85, duration: 60 }] },
      { id: 'absorb', labelKey: 'コスト増を吸収', descriptionKey: '粗利率が低下', effects: [{ target: 'finance', field: 'serverCost', operator: 'multiply', value: 1.2, duration: 90 }] },
    ],
  },
  {
    id: 'macro_startup_support', category: 'macro', severity: 'opportunity',
    titleKey: '政府のスタートアップ支援策', descriptionKey: '政府がスタートアップ支援の補助金制度を発表しました。',
    conditions: [{ type: 'stat', field: 'headcount', operator: 'lte', value: 50 }],
    probability: 0.02, cooldownDays: 250, maxOccurrences: 2, earliestTick: 60,
    choices: [
      { id: 'apply', labelKey: '補助金を申請', descriptionKey: '最大500万円', effects: [{ target: 'finance', field: 'cash', operator: 'add', value: 500, duration: 0 }] },
      { id: 'skip', labelKey: '手続きが面倒なのでスキップ', descriptionKey: '時間を節約', effects: [] },
    ],
  },
]
