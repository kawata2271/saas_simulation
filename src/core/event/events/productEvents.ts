/**
 * プロダクト・技術イベント定義（20イベント）
 */

import type { GameEventDefinition } from '@game-types/events.js'

export const productEvents: GameEventDefinition[] = [
  {
    id: 'prod_major_bug', category: 'product', severity: 'critical',
    titleKey: '本番環境の重大バグ', descriptionKey: '顧客からデータ不整合の報告が多数。本番環境に重大なバグが見つかりました。',
    conditions: [{ type: 'stat', field: 'activeCustomers', operator: 'gte', value: 3 }],
    probability: 0.02, cooldownDays: 30, maxOccurrences: 10, earliestTick: 20,
    choices: [
      { id: 'hotfix', labelKey: '緊急ホットフィックス', descriptionKey: '全エンジニア投入', effects: [{ target: 'product', field: 'devSpeed', operator: 'multiply', value: 0.5, duration: 5 }, { target: 'product', field: 'quality', operator: 'add', value: 5, duration: 0 }] },
      { id: 'rollback', labelKey: 'ロールバック', descriptionKey: '新機能は消えるが安全', effects: [{ target: 'product', field: 'quality', operator: 'add', value: 3, duration: 0 }, { target: 'company', field: 'reputation', operator: 'add', value: -2, duration: 0 }] },
    ],
  },
  {
    id: 'prod_downtime', category: 'product', severity: 'critical',
    titleKey: 'サービスダウン', descriptionKey: 'サービスが完全に停止しています。顧客から問い合わせが殺到中です。',
    conditions: [{ type: 'stat', field: 'activeCustomers', operator: 'gte', value: 10 }],
    probability: 0.01, cooldownDays: 60, maxOccurrences: 5, earliestTick: 60,
    choices: [
      { id: 'war_room', labelKey: 'ウォールーム設置', descriptionKey: '全力復旧', effects: [{ target: 'hr', field: 'stress', operator: 'add', value: 15, duration: 5 }, { target: 'company', field: 'reputation', operator: 'add', value: -3, duration: 0 }] },
      { id: 'communicate', labelKey: '顧客に誠実に説明', descriptionKey: '信頼は維持', effects: [{ target: 'company', field: 'reputation', operator: 'add', value: -1, duration: 0 }] },
    ],
  },
  {
    id: 'prod_tech_debt_crisis', category: 'product', severity: 'warning',
    titleKey: '技術的負債の限界', descriptionKey: '技術的負債が蓄積し、新機能の開発速度が著しく低下しています。',
    conditions: [{ type: 'stat', field: 'techDebt', operator: 'gte', value: 30 }],
    probability: 0.04, cooldownDays: 60, maxOccurrences: 5, earliestTick: 60,
    choices: [
      { id: 'refactor_sprint', labelKey: 'リファクタリングスプリント', descriptionKey: '2週間の技術投資', effects: [{ target: 'product', field: 'techDebt', operator: 'add', value: -15, duration: 0 }, { target: 'product', field: 'devSpeed', operator: 'multiply', value: 0.6, duration: 10 }] },
      { id: 'gradual', labelKey: '段階的に改善', descriptionKey: '20%ルール導入', effects: [{ target: 'product', field: 'techDebt', operator: 'add', value: -5, duration: 0 }] },
      { id: 'ignore', labelKey: '後回しにする', descriptionKey: 'さらに悪化', effects: [{ target: 'product', field: 'techDebt', operator: 'add', value: 5, duration: 30 }] },
    ],
  },
  {
    id: 'prod_feature_idea', category: 'product', severity: 'opportunity',
    titleKey: '革新的な機能アイデア', descriptionKey: 'チームメンバーから画期的な新機能のアイデアが出ました。実装しますか？',
    conditions: [{ type: 'stat', field: 'headcount', operator: 'gte', value: 3 }],
    probability: 0.04, cooldownDays: 30, maxOccurrences: 20, earliestTick: 15,
    choices: [
      { id: 'build', labelKey: '開発開始', descriptionKey: 'プロダクトスコアUP', effects: [{ target: 'product', field: 'quality', operator: 'add', value: 8, duration: 0 }] },
      { id: 'backlog', labelKey: 'バックログに入れる', descriptionKey: '後で検討', effects: [] },
    ],
  },
  {
    id: 'prod_security_audit', category: 'product', severity: 'info',
    titleKey: 'セキュリティ監査の提案', descriptionKey: 'エンジニアから外部セキュリティ監査の実施を提案されました。',
    conditions: [{ type: 'stat', field: 'activeCustomers', operator: 'gte', value: 15 }],
    probability: 0.03, cooldownDays: 120, maxOccurrences: 3, earliestTick: 60,
    choices: [
      { id: 'audit', labelKey: '監査実施（200万円）', descriptionKey: 'セキュリティ強化', effects: [{ target: 'finance', field: 'cash', operator: 'add', value: -200, duration: 0 }, { target: 'company', field: 'reputation', operator: 'add', value: 5, duration: 0 }, { target: 'product', field: 'quality', operator: 'add', value: 5, duration: 0 }] },
      { id: 'skip', labelKey: '今は見送る', descriptionKey: 'コスト節約', effects: [] },
    ],
  },
  {
    id: 'prod_competitor_copy', category: 'product', severity: 'warning',
    titleKey: '競合が類似機能をリリース', descriptionKey: '競合他社が御社の主力機能と酷似した機能をリリースしました。',
    conditions: [{ type: 'stat', field: 'productScore', operator: 'gte', value: 25 }],
    probability: 0.03, cooldownDays: 60, maxOccurrences: 5, earliestTick: 60,
    choices: [
      { id: 'innovate', labelKey: 'さらに先を行く', descriptionKey: '差別化機能を開発', effects: [{ target: 'product', field: 'quality', operator: 'add', value: 10, duration: 0 }] },
      { id: 'price', labelKey: '価格で勝負', descriptionKey: '値下げ', effects: [{ target: 'sales', field: 'convRate', operator: 'multiply', value: 1.2, duration: 60 }] },
    ],
  },
  {
    id: 'prod_customer_feedback', category: 'product', severity: 'info',
    titleKey: '顧客からの改善要望', descriptionKey: '複数の大口顧客から同じ機能改善を求められています。',
    conditions: [{ type: 'stat', field: 'activeCustomers', operator: 'gte', value: 5 }],
    probability: 0.05, cooldownDays: 20, maxOccurrences: 20, earliestTick: 20,
    choices: [
      { id: 'prioritize', labelKey: '最優先で対応', descriptionKey: '顧客満足度UP', effects: [{ target: 'sales', field: 'churn', operator: 'multiply', value: 0.9, duration: 30 }] },
      { id: 'roadmap', labelKey: 'ロードマップに追加', descriptionKey: '計画的に対応', effects: [] },
    ],
  },
  {
    id: 'prod_open_source', category: 'product', severity: 'opportunity',
    titleKey: 'OSS化の提案', descriptionKey: 'コアライブラリのOSS化でコミュニティを作りませんか？と提案が。',
    conditions: [{ type: 'stat', field: 'productScore', operator: 'gte', value: 30 }],
    probability: 0.01, cooldownDays: 250, maxOccurrences: 1, earliestTick: 120,
    choices: [
      { id: 'oss', labelKey: 'OSS化する', descriptionKey: 'ブランド価値UP、採用にも好影響', effects: [{ target: 'company', field: 'reputation', operator: 'add', value: 8, duration: 0 }] },
      { id: 'keep', labelKey: 'プロプライエタリを維持', descriptionKey: '競争優位保持', effects: [] },
    ],
  },
  {
    id: 'prod_load_test_fail', category: 'product', severity: 'warning',
    titleKey: '負荷テスト不合格', descriptionKey: '想定アクセス数の半分でシステムが不安定になりました。',
    conditions: [{ type: 'stat', field: 'activeCustomers', operator: 'gte', value: 20 }],
    probability: 0.02, cooldownDays: 90, maxOccurrences: 3, earliestTick: 60,
    choices: [
      { id: 'scale', labelKey: 'インフラ増強', descriptionKey: 'コスト増だが安定', effects: [{ target: 'finance', field: 'serverCost', operator: 'multiply', value: 1.3, duration: 0 }, { target: 'product', field: 'quality', operator: 'add', value: 5, duration: 0 }] },
      { id: 'optimize', labelKey: 'コード最適化', descriptionKey: '時間がかかるが根本対策', effects: [{ target: 'product', field: 'devSpeed', operator: 'multiply', value: 0.8, duration: 14 }, { target: 'product', field: 'quality', operator: 'add', value: 8, duration: 0 }] },
    ],
  },
  {
    id: 'prod_hackathon', category: 'random', severity: 'info',
    titleKey: '社内ハッカソン開催', descriptionKey: '「ハッカソンやりたい！」とエンジニアから要望が。',
    conditions: [{ type: 'stat', field: 'headcount', operator: 'gte', value: 5 }],
    probability: 0.03, cooldownDays: 90, maxOccurrences: 10, earliestTick: 30,
    choices: [
      { id: 'yes', labelKey: '2日間のハッカソン', descriptionKey: '創造性と結束力UP', effects: [{ target: 'hr', field: 'motivation', operator: 'add', value: 8, duration: 0 }, { target: 'product', field: 'quality', operator: 'add', value: 3, duration: 0 }] },
      { id: 'no', labelKey: '今は忙しい', descriptionKey: 'ちょっと残念', effects: [{ target: 'hr', field: 'motivation', operator: 'add', value: -2, duration: 0 }] },
    ],
  },
]
