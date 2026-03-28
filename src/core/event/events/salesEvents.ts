/**
 * 営業・資金調達イベント定義（20イベント）
 */

import type { GameEventDefinition } from '@game-types/events.js'

export const salesEvents: GameEventDefinition[] = [
  {
    id: 'sales_enterprise_lead', category: 'sales', severity: 'opportunity',
    titleKey: 'エンタープライズ案件', descriptionKey: '大手企業のIT部門から問い合わせが入りました。ARPUの10倍の案件になる可能性があります。',
    conditions: [{ type: 'stat', field: 'productScore', operator: 'gte', value: 30 }, { type: 'stat', field: 'activeCustomers', operator: 'gte', value: 10 }],
    probability: 0.02, cooldownDays: 45, maxOccurrences: 10, earliestTick: 60,
    choices: [
      { id: 'pursue', labelKey: '全力で追う', descriptionKey: '営業リソースを集中', effects: [{ target: 'sales', field: 'leadGen', operator: 'multiply', value: 0.7, duration: 30 }, { target: 'sales', field: 'enterprise', operator: 'add', value: 1, duration: 0 }] },
      { id: 'standard', labelKey: '通常プロセスで対応', descriptionKey: 'バランス重視', effects: [] },
    ],
  },
  {
    id: 'sales_churn_wave', category: 'sales', severity: 'critical',
    titleKey: '解約の波', descriptionKey: '今月の解約率が通常の3倍に達しています。原因を調査しますか？',
    conditions: [{ type: 'stat', field: 'activeCustomers', operator: 'gte', value: 15 }],
    probability: 0.02, cooldownDays: 60, maxOccurrences: 5, earliestTick: 60,
    choices: [
      { id: 'investigate', labelKey: '原因を徹底調査', descriptionKey: 'CSチーム総動員', effects: [{ target: 'sales', field: 'churn', operator: 'multiply', value: 0.7, duration: 30 }] },
      { id: 'discount', labelKey: '継続割引を提案', descriptionKey: 'ARPUは下がるが残る', effects: [{ target: 'sales', field: 'churn', operator: 'multiply', value: 0.5, duration: 30 }, { target: 'sales', field: 'arpu', operator: 'multiply', value: 0.9, duration: 60 }] },
    ],
  },
  {
    id: 'sales_partnership', category: 'sales', severity: 'opportunity',
    titleKey: 'パートナーシップ提案', descriptionKey: '同業界の非競合SaaSから連携の提案がありました。',
    conditions: [{ type: 'stat', field: 'arr', operator: 'gte', value: 500 }],
    probability: 0.02, cooldownDays: 90, maxOccurrences: 5, earliestTick: 60,
    choices: [
      { id: 'partner', labelKey: '提携する', descriptionKey: '相互送客', effects: [{ target: 'sales', field: 'leadGen', operator: 'multiply', value: 1.3, duration: 120 }, { target: 'company', field: 'reputation', operator: 'add', value: 3, duration: 0 }] },
      { id: 'decline', labelKey: '断る', descriptionKey: '独立路線', effects: [] },
    ],
  },
  {
    id: 'sales_price_pressure', category: 'sales', severity: 'warning',
    titleKey: '値下げ圧力', descriptionKey: '競合が大幅値下げを仕掛けてきました。価格戦略を見直しますか？',
    conditions: [{ type: 'stat', field: 'activeCustomers', operator: 'gte', value: 10 }],
    probability: 0.02, cooldownDays: 90, maxOccurrences: 5, earliestTick: 60,
    choices: [
      { id: 'match', labelKey: '対抗値下げ', descriptionKey: '顧客流出を防ぐ', effects: [{ target: 'sales', field: 'churn', operator: 'multiply', value: 0.8, duration: 60 }, { target: 'sales', field: 'arpu', operator: 'multiply', value: 0.85, duration: 0 }] },
      { id: 'value', labelKey: '価値訴求で差別化', descriptionKey: 'プレミアム戦略', effects: [{ target: 'product', field: 'quality', operator: 'add', value: 5, duration: 0 }] },
    ],
  },
  {
    id: 'sales_viral', category: 'sales', severity: 'opportunity',
    titleKey: 'バイラル拡散', descriptionKey: '顧客がSNSで御社サービスを絶賛投稿し、バズっています！',
    conditions: [{ type: 'stat', field: 'productScore', operator: 'gte', value: 35 }],
    probability: 0.01, cooldownDays: 90, maxOccurrences: 5, earliestTick: 40,
    choices: [
      { id: 'amplify', labelKey: 'キャンペーンで増幅', descriptionKey: 'マーケ予算投入', effects: [{ target: 'sales', field: 'leadGen', operator: 'multiply', value: 2.0, duration: 14 }, { target: 'finance', field: 'cash', operator: 'add', value: -30, duration: 0 }] },
      { id: 'organic', labelKey: '自然に任せる', descriptionKey: 'コスト0', effects: [{ target: 'sales', field: 'leadGen', operator: 'multiply', value: 1.3, duration: 14 }] },
    ],
  },
  // 資金調達系
  {
    id: 'funding_vc_interest', category: 'funding', severity: 'opportunity',
    titleKey: 'VCからの関心', descriptionKey: '有名VCのパートナーから面談のオファーが来ました。',
    conditions: [{ type: 'stat', field: 'arr', operator: 'gte', value: 300 }],
    probability: 0.02, cooldownDays: 60, maxOccurrences: 10, earliestTick: 30,
    choices: [
      { id: 'meet', labelKey: '面談に応じる', descriptionKey: '調達の可能性', effects: [{ target: 'company', field: 'reputation', operator: 'add', value: 2, duration: 0 }] },
      { id: 'pass', labelKey: '今は必要ない', descriptionKey: '自力成長', effects: [] },
    ],
  },
  {
    id: 'funding_angel', category: 'funding', severity: 'opportunity',
    titleKey: 'エンジェル投資家の紹介', descriptionKey: '知人からエンジェル投資家を紹介されました。500万円の出資を検討中です。',
    conditions: [{ type: 'stat', field: 'cash', operator: 'lte', value: 300 }],
    probability: 0.03, cooldownDays: 120, maxOccurrences: 3, earliestTick: 15,
    choices: [
      { id: 'accept', labelKey: '出資を受ける', descriptionKey: '500万円調達（希薄化5%）', effects: [{ target: 'finance', field: 'cash', operator: 'add', value: 500, duration: 0 }] },
      { id: 'decline', labelKey: '辞退する', descriptionKey: '希薄化を避ける', effects: [] },
    ],
  },
  {
    id: 'funding_seed_round', category: 'funding', severity: 'opportunity',
    titleKey: 'シードラウンド機会', descriptionKey: 'VCから3000万円のシードラウンドをリードしたいとの申し出です。',
    conditions: [{ type: 'stat', field: 'arr', operator: 'gte', value: 500 }, { type: 'stat', field: 'cash', operator: 'lte', value: 1000 }],
    probability: 0.02, cooldownDays: 250, maxOccurrences: 1, earliestTick: 60,
    choices: [
      { id: 'raise', labelKey: '調達する', descriptionKey: '3000万円（希薄化15%）', effects: [{ target: 'finance', field: 'cash', operator: 'add', value: 3000, duration: 0 }, { target: 'company', field: 'reputation', operator: 'add', value: 5, duration: 0 }] },
      { id: 'decline', labelKey: '見送る', descriptionKey: 'ブートストラップ継続', effects: [] },
    ],
  },
  {
    id: 'funding_series_a', category: 'funding', severity: 'opportunity',
    titleKey: 'Series A 調達機会', descriptionKey: '複数のVCからSeries Aの打診。2億円の調達が見込めます。',
    conditions: [{ type: 'stat', field: 'arr', operator: 'gte', value: 3000 }],
    probability: 0.02, cooldownDays: 250, maxOccurrences: 1, earliestTick: 150,
    choices: [
      { id: 'raise', labelKey: '調達する', descriptionKey: '2億円（希薄化20%）', effects: [{ target: 'finance', field: 'cash', operator: 'add', value: 20000, duration: 0 }, { target: 'company', field: 'reputation', operator: 'add', value: 10, duration: 0 }] },
      { id: 'decline', labelKey: 'まだ早い', descriptionKey: 'もう少し成長してから', effects: [] },
    ],
  },
  {
    id: 'crisis_security_breach', category: 'crisis', severity: 'critical',
    titleKey: 'セキュリティ侵害', descriptionKey: '不正アクセスにより顧客データの一部が漏洩した可能性があります。',
    conditions: [{ type: 'stat', field: 'activeCustomers', operator: 'gte', value: 20 }],
    probability: 0.005, cooldownDays: 250, maxOccurrences: 2, earliestTick: 100,
    choices: [
      { id: 'full_disclosure', labelKey: '即座に全顧客に通知', descriptionKey: '透明性確保', effects: [{ target: 'company', field: 'reputation', operator: 'add', value: -8, duration: 0 }, { target: 'sales', field: 'churn', operator: 'multiply', value: 1.3, duration: 30 }] },
      { id: 'investigate_first', labelKey: '調査後に報告', descriptionKey: '影響範囲を特定してから', effects: [{ target: 'company', field: 'reputation', operator: 'add', value: -12, duration: 0 }, { target: 'finance', field: 'cash', operator: 'add', value: -100, duration: 0 }] },
    ],
  },
]
