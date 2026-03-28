/**
 * 会社・組織イベント定義（20イベント）
 */

import type { GameEventDefinition } from '@game-types/events.js'

export const companyEvents: GameEventDefinition[] = [
  {
    id: 'company_first_hire', category: 'company', severity: 'info',
    titleKey: '最初の仲間', descriptionKey: '初めての社員を迎える時が来ました！どんな人材を求めますか？',
    conditions: [{ type: 'stat', field: 'headcount', operator: 'eq', value: 1 }],
    probability: 1.0, cooldownDays: 9999, maxOccurrences: 1, earliestTick: 5,
    choices: [
      { id: 'engineer', labelKey: 'エンジニアを採用', descriptionKey: 'プロダクト開発を加速', effects: [{ target: 'product', field: 'devSpeed', operator: 'multiply', value: 1.2, duration: 60 }] },
      { id: 'sales', labelKey: '営業を採用', descriptionKey: '売上確保を優先', effects: [{ target: 'sales', field: 'leadGen', operator: 'multiply', value: 1.3, duration: 60 }] },
    ],
  },
  {
    id: 'company_10_employees', category: 'milestone', severity: 'info',
    titleKey: '従業員10名突破！', descriptionKey: '会社が二桁の規模になりました。そろそろ組織づくりを考える時期です。',
    conditions: [{ type: 'stat', field: 'headcount', operator: 'gte', value: 10 }],
    probability: 1.0, cooldownDays: 9999, maxOccurrences: 1, earliestTick: 20,
    choices: [
      { id: 'flat', labelKey: 'フラットな組織を維持', descriptionKey: 'スピード重視', effects: [{ target: 'product', field: 'devSpeed', operator: 'multiply', value: 1.1, duration: 120 }] },
      { id: 'hierarchy', labelKey: 'マネジメント層を設置', descriptionKey: '安定性重視', effects: [{ target: 'hr', field: 'satisfaction', operator: 'add', value: 5, duration: 0 }] },
    ],
  },
  {
    id: 'company_office_cramped', category: 'company', severity: 'warning',
    titleKey: 'オフィスが手狭に', descriptionKey: '人員増加に対してオフィスが狭くなってきました。移転を検討しますか？',
    conditions: [{ type: 'stat', field: 'headcount', operator: 'gte', value: 8 }],
    probability: 0.05, cooldownDays: 120, maxOccurrences: 5, earliestTick: 30,
    choices: [
      { id: 'upgrade', labelKey: 'オフィスを拡張', descriptionKey: 'コスト増だが満足度UP', effects: [{ target: 'hr', field: 'satisfaction', operator: 'add', value: 10, duration: 0 }, { target: 'finance', field: 'officeCost', operator: 'multiply', value: 1.5, duration: 0 }] },
      { id: 'remote', labelKey: 'リモートワーク導入', descriptionKey: 'コスト抑制', effects: [{ target: 'hr', field: 'satisfaction', operator: 'add', value: 3, duration: 0 }] },
      { id: 'endure', labelKey: '我慢する', descriptionKey: 'ストレス増加', effects: [{ target: 'hr', field: 'stress', operator: 'add', value: 10, duration: 60 }] },
    ],
  },
  {
    id: 'company_culture_clash', category: 'company', severity: 'warning',
    titleKey: '文化の衝突', descriptionKey: '新しく入った社員と古参社員の間で価値観の衝突が起きています。',
    conditions: [{ type: 'stat', field: 'headcount', operator: 'gte', value: 15 }],
    probability: 0.03, cooldownDays: 90, maxOccurrences: 3, earliestTick: 60,
    choices: [
      { id: 'mediate', labelKey: 'チームビルディング合宿', descriptionKey: 'コスト50万、チームワーク向上', effects: [{ target: 'finance', field: 'cash', operator: 'add', value: -50, duration: 0 }, { target: 'hr', field: 'belongingness', operator: 'add', value: 10, duration: 0 }] },
      { id: 'values', labelKey: '企業バリューを再定義', descriptionKey: '長期的な文化基盤', effects: [{ target: 'company', field: 'reputation', operator: 'add', value: 3, duration: 0 }] },
      { id: 'ignore', labelKey: '自然解決を待つ', descriptionKey: '悪化するかも', effects: [{ target: 'hr', field: 'motivation', operator: 'add', value: -5, duration: 30 }] },
    ],
  },
  {
    id: 'company_media_coverage', category: 'company', severity: 'opportunity',
    titleKey: 'メディア取材のオファー', descriptionKey: 'テック系メディアから取材依頼が来ました。',
    conditions: [{ type: 'stat', field: 'reputation', operator: 'gte', value: 20 }],
    probability: 0.03, cooldownDays: 60, maxOccurrences: 10, earliestTick: 30,
    choices: [
      { id: 'accept', labelKey: '快く受ける', descriptionKey: '知名度UP', effects: [{ target: 'company', field: 'reputation', operator: 'add', value: 5, duration: 0 }, { target: 'sales', field: 'leadGen', operator: 'multiply', value: 1.2, duration: 30 }] },
      { id: 'decline', labelKey: 'まだ早いと断る', descriptionKey: 'ステルスモード継続', effects: [] },
    ],
  },
  {
    id: 'company_founder_burnout', category: 'company', severity: 'warning',
    titleKey: '創業者の疲労', descriptionKey: 'あなた自身が疲弊しています。少し休みませんか？',
    conditions: [{ type: 'stat', field: 'companyAge', operator: 'gte', value: 6 }],
    probability: 0.02, cooldownDays: 120, maxOccurrences: 3, earliestTick: 150,
    choices: [
      { id: 'vacation', labelKey: '1週間休暇を取る', descriptionKey: 'リフレッシュ', effects: [{ target: 'product', field: 'devSpeed', operator: 'multiply', value: 0.9, duration: 5 }, { target: 'company', field: 'reputation', operator: 'add', value: 2, duration: 0 }] },
      { id: 'push', labelKey: '気合いで乗り切る', descriptionKey: '短期的にはOK', effects: [{ target: 'product', field: 'devSpeed', operator: 'multiply', value: 1.1, duration: 20 }] },
    ],
  },
  {
    id: 'company_acquisition_offer', category: 'company', severity: 'critical',
    titleKey: '買収提案', descriptionKey: '大手企業から買収の打診がありました。',
    conditions: [{ type: 'stat', field: 'arr', operator: 'gte', value: 3000 }],
    probability: 0.01, cooldownDays: 250, maxOccurrences: 3, earliestTick: 300,
    choices: [
      { id: 'reject', labelKey: '断る', descriptionKey: '独立を貫く', effects: [{ target: 'company', field: 'reputation', operator: 'add', value: 3, duration: 0 }] },
      { id: 'negotiate', labelKey: '交渉する', descriptionKey: '条件次第では…', effects: [{ target: 'company', field: 'reputation', operator: 'add', value: 5, duration: 0 }] },
    ],
  },
  {
    id: 'company_arr_100', category: 'milestone', severity: 'opportunity',
    titleKey: 'ARR 100万円突破！', descriptionKey: '年間経常収益が100万円を超えました。PMFに近づいています。',
    conditions: [{ type: 'stat', field: 'arr', operator: 'gte', value: 100 }],
    probability: 1.0, cooldownDays: 9999, maxOccurrences: 1, earliestTick: 10,
    choices: [
      { id: 'celebrate', labelKey: 'チームで祝う', descriptionKey: 'モチベーションUP', effects: [{ target: 'hr', field: 'motivation', operator: 'add', value: 10, duration: 0 }] },
    ],
  },
  {
    id: 'company_arr_1000', category: 'milestone', severity: 'opportunity',
    titleKey: 'ARR 1,000万円突破！', descriptionKey: '素晴らしい成長です。VCの注目を集め始めています。',
    conditions: [{ type: 'stat', field: 'arr', operator: 'gte', value: 1000 }],
    probability: 1.0, cooldownDays: 9999, maxOccurrences: 1, earliestTick: 30,
    choices: [
      { id: 'fundraise', labelKey: '資金調達を検討', descriptionKey: 'VC へのアプローチ', effects: [{ target: 'company', field: 'reputation', operator: 'add', value: 5, duration: 0 }] },
      { id: 'bootstrap', labelKey: 'ブートストラップ継続', descriptionKey: '希薄化を避ける', effects: [] },
    ],
  },
  {
    id: 'company_arr_10000', category: 'milestone', severity: 'opportunity',
    titleKey: 'ARR 1億円突破！！', descriptionKey: '1億円ARRを達成！SaaS業界で注目の存在です。',
    conditions: [{ type: 'stat', field: 'arr', operator: 'gte', value: 10000 }],
    probability: 1.0, cooldownDays: 9999, maxOccurrences: 1, earliestTick: 60,
    choices: [
      { id: 'party', labelKey: '盛大に祝う', descriptionKey: '全社パーティー', effects: [{ target: 'hr', field: 'motivation', operator: 'add', value: 15, duration: 0 }, { target: 'finance', field: 'cash', operator: 'add', value: -30, duration: 0 }] },
    ],
  },
]
