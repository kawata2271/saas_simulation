/**
 * 人事イベント定義（20イベント）
 */

import type { GameEventDefinition } from '@game-types/events.js'

export const hrEvents: GameEventDefinition[] = [
  {
    id: 'hr_star_recruit', category: 'hr', severity: 'opportunity',
    titleKey: 'スター人材の応募', descriptionKey: '業界で有名なエンジニアが御社に興味を示しています。ただし年俸は相場の1.5倍です。',
    conditions: [{ type: 'stat', field: 'reputation', operator: 'gte', value: 30 }],
    probability: 0.02, cooldownDays: 90, maxOccurrences: 5, earliestTick: 60,
    choices: [
      { id: 'hire', labelKey: '高給で採用', descriptionKey: '即戦力確保', effects: [{ target: 'product', field: 'devSpeed', operator: 'multiply', value: 1.3, duration: 120 }, { target: 'finance', field: 'personnelCost', operator: 'multiply', value: 1.1, duration: 0 }] },
      { id: 'pass', labelKey: '見送る', descriptionKey: '予算オーバー', effects: [] },
    ],
  },
  {
    id: 'hr_key_person_quit', category: 'hr', severity: 'critical',
    titleKey: 'キーパーソンの退職意向', descriptionKey: 'エース社員が退職を検討していることが判明しました。',
    conditions: [{ type: 'stat', field: 'headcount', operator: 'gte', value: 5 }],
    probability: 0.02, cooldownDays: 60, maxOccurrences: 10, earliestTick: 60,
    choices: [
      { id: 'raise', labelKey: '昇給で引き留め', descriptionKey: '給与20%UP', effects: [{ target: 'finance', field: 'personnelCost', operator: 'multiply', value: 1.05, duration: 0 }, { target: 'hr', field: 'satisfaction', operator: 'add', value: 10, duration: 0 }] },
      { id: 'promote', labelKey: '昇進を提示', descriptionKey: '責任範囲拡大', effects: [{ target: 'hr', field: 'motivation', operator: 'add', value: 15, duration: 0 }] },
      { id: 'let_go', labelKey: '引き留めない', descriptionKey: 'チームに影響あり', effects: [{ target: 'hr', field: 'motivation', operator: 'add', value: -8, duration: 30 }] },
    ],
  },
  {
    id: 'hr_team_conflict', category: 'hr', severity: 'warning',
    titleKey: 'チーム間の対立', descriptionKey: '開発チームと営業チームの間で優先順位を巡る対立が起きています。',
    conditions: [{ type: 'stat', field: 'headcount', operator: 'gte', value: 10 }],
    probability: 0.03, cooldownDays: 45, maxOccurrences: 10, earliestTick: 40,
    choices: [
      { id: 'meeting', labelKey: '合同ミーティングで解決', descriptionKey: '相互理解促進', effects: [{ target: 'hr', field: 'satisfaction', operator: 'add', value: 5, duration: 0 }] },
      { id: 'side_dev', labelKey: '開発を優先', descriptionKey: '営業チーム不満', effects: [{ target: 'product', field: 'devSpeed', operator: 'multiply', value: 1.1, duration: 30 }, { target: 'hr', field: 'motivation', operator: 'add', value: -3, duration: 30 }] },
      { id: 'side_sales', labelKey: '営業を優先', descriptionKey: '開発チーム不満', effects: [{ target: 'sales', field: 'leadGen', operator: 'multiply', value: 1.1, duration: 30 }, { target: 'hr', field: 'motivation', operator: 'add', value: -3, duration: 30 }] },
    ],
  },
  {
    id: 'hr_harassment_report', category: 'hr', severity: 'critical',
    titleKey: 'ハラスメント報告', descriptionKey: '社内からハラスメントの報告がありました。迅速な対応が求められます。',
    conditions: [{ type: 'stat', field: 'headcount', operator: 'gte', value: 8 }],
    probability: 0.01, cooldownDays: 120, maxOccurrences: 3, earliestTick: 60,
    choices: [
      { id: 'investigate', labelKey: '即座に調査開始', descriptionKey: '正しい対応', effects: [{ target: 'company', field: 'reputation', operator: 'add', value: 2, duration: 0 }] },
      { id: 'dismiss', labelKey: '大したことないと判断', descriptionKey: '危険な判断', effects: [{ target: 'company', field: 'reputation', operator: 'add', value: -10, duration: 0 }, { target: 'hr', field: 'satisfaction', operator: 'add', value: -15, duration: 60 }] },
    ],
  },
  {
    id: 'hr_referral_bonus', category: 'hr', severity: 'info',
    titleKey: 'リファラル採用の提案', descriptionKey: '社員からリファラル採用制度の導入を提案されました。',
    conditions: [{ type: 'stat', field: 'headcount', operator: 'gte', value: 5 }],
    probability: 0.03, cooldownDays: 250, maxOccurrences: 1, earliestTick: 30,
    choices: [
      { id: 'introduce', labelKey: '制度導入（紹介料30万）', descriptionKey: '質の高い採用', effects: [{ target: 'company', field: 'reputation', operator: 'add', value: 3, duration: 0 }] },
      { id: 'skip', labelKey: '今は見送る', descriptionKey: 'コスト抑制', effects: [] },
    ],
  },
  {
    id: 'hr_overwork_alert', category: 'hr', severity: 'warning',
    titleKey: '長時間労働の警告', descriptionKey: '複数の社員が月80時間超の残業をしています。労基法違反のリスクがあります。',
    conditions: [{ type: 'stat', field: 'headcount', operator: 'gte', value: 5 }],
    probability: 0.03, cooldownDays: 60, maxOccurrences: 5, earliestTick: 40,
    choices: [
      { id: 'enforce', labelKey: '残業規制を強化', descriptionKey: '開発速度低下するが安全', effects: [{ target: 'product', field: 'devSpeed', operator: 'multiply', value: 0.9, duration: 30 }, { target: 'hr', field: 'stress', operator: 'add', value: -15, duration: 0 }] },
      { id: 'ignore', labelKey: '目を瞑る', descriptionKey: '訴訟リスク', effects: [{ target: 'hr', field: 'burnoutRisk', operator: 'add', value: 15, duration: 30 }] },
    ],
  },
  {
    id: 'hr_remote_demand', category: 'hr', severity: 'info',
    titleKey: 'リモートワーク要望', descriptionKey: '社員の多くがリモートワークの拡充を希望しています。',
    conditions: [{ type: 'stat', field: 'headcount', operator: 'gte', value: 10 }],
    probability: 0.03, cooldownDays: 120, maxOccurrences: 2, earliestTick: 60,
    choices: [
      { id: 'full_remote', labelKey: 'フルリモートOK', descriptionKey: '満足度UP、コミュニケーションコスト', effects: [{ target: 'hr', field: 'satisfaction', operator: 'add', value: 12, duration: 0 }, { target: 'hr', field: 'belongingness', operator: 'add', value: -5, duration: 0 }] },
      { id: 'hybrid', labelKey: 'ハイブリッド（週3出社）', descriptionKey: 'バランス型', effects: [{ target: 'hr', field: 'satisfaction', operator: 'add', value: 5, duration: 0 }] },
      { id: 'office', labelKey: '出社必須を維持', descriptionKey: '不満が出るかも', effects: [{ target: 'hr', field: 'motivation', operator: 'add', value: -5, duration: 30 }] },
    ],
  },
  {
    id: 'hr_intern_star', category: 'hr', severity: 'opportunity',
    titleKey: '優秀なインターン', descriptionKey: 'インターンが予想を超える成果を出しています。正社員登用しますか？',
    conditions: [{ type: 'stat', field: 'headcount', operator: 'gte', value: 5 }],
    probability: 0.02, cooldownDays: 120, maxOccurrences: 5, earliestTick: 60,
    choices: [
      { id: 'hire', labelKey: '即座に正社員登用', descriptionKey: '将来のエース', effects: [{ target: 'hr', field: 'motivation', operator: 'add', value: 5, duration: 0 }] },
      { id: 'wait', labelKey: '卒業まで待つ', descriptionKey: '他社に取られるかも', effects: [] },
    ],
  },
  {
    id: 'hr_salary_market', category: 'hr', severity: 'warning',
    titleKey: '給与水準の見直し要求', descriptionKey: '市場相場が上がっており、社員から給与改定の要望が出ています。',
    conditions: [{ type: 'stat', field: 'headcount', operator: 'gte', value: 10 }],
    probability: 0.03, cooldownDays: 120, maxOccurrences: 5, earliestTick: 100,
    choices: [
      { id: 'raise_all', labelKey: '全員一律10%昇給', descriptionKey: '満足度大幅UP', effects: [{ target: 'finance', field: 'personnelCost', operator: 'multiply', value: 1.1, duration: 0 }, { target: 'hr', field: 'satisfaction', operator: 'add', value: 15, duration: 0 }] },
      { id: 'selective', labelKey: '成果に応じて個別対応', descriptionKey: '公平だが不満も', effects: [{ target: 'finance', field: 'personnelCost', operator: 'multiply', value: 1.05, duration: 0 }, { target: 'hr', field: 'satisfaction', operator: 'add', value: 5, duration: 0 }] },
      { id: 'delay', labelKey: '次の四半期まで延期', descriptionKey: '退職リスク上昇', effects: [{ target: 'hr', field: 'motivation', operator: 'add', value: -8, duration: 60 }] },
    ],
  },
  {
    id: 'hr_team_lunch', category: 'random', severity: 'info',
    titleKey: 'チームランチの提案', descriptionKey: '「たまにはみんなでランチ行きませんか？」と提案がありました。',
    conditions: [{ type: 'stat', field: 'headcount', operator: 'gte', value: 3 }],
    probability: 0.05, cooldownDays: 30, maxOccurrences: 20, earliestTick: 10,
    choices: [
      { id: 'go', labelKey: '行こう！', descriptionKey: 'チームワークUP', effects: [{ target: 'hr', field: 'belongingness', operator: 'add', value: 3, duration: 0 }] },
      { id: 'busy', labelKey: '忙しいから今度…', descriptionKey: 'ちょっと残念', effects: [] },
    ],
  },
]
