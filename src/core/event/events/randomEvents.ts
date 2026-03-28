/**
 * ランダム/フレーバーイベント定義（15イベント）
 */

import type { GameEventDefinition } from '@game-types/events.js'

export const randomEvents: GameEventDefinition[] = [
  {
    id: 'random_coffee', category: 'random', severity: 'info',
    titleKey: 'コーヒーマシン故障', descriptionKey: 'オフィスのコーヒーマシンが壊れました。生産性に影響？',
    conditions: [{ type: 'stat', field: 'headcount', operator: 'gte', value: 3 }],
    probability: 0.05, cooldownDays: 60, maxOccurrences: 5, earliestTick: 10,
    choices: [
      { id: 'new', labelKey: '新しいのを買う（5万円）', descriptionKey: '高性能エスプレッソマシン', effects: [{ target: 'finance', field: 'cash', operator: 'add', value: -5, duration: 0 }, { target: 'hr', field: 'motivation', operator: 'add', value: 3, duration: 0 }] },
      { id: 'repair', labelKey: '修理する', descriptionKey: '1週間かかる', effects: [] },
    ],
  },
  {
    id: 'random_birthday', category: 'random', severity: 'info',
    titleKey: '社員の誕生日', descriptionKey: '今日は社員の誕生日です。サプライズしますか？',
    conditions: [{ type: 'stat', field: 'headcount', operator: 'gte', value: 2 }],
    probability: 0.04, cooldownDays: 20, maxOccurrences: 50, earliestTick: 5,
    choices: [
      { id: 'party', labelKey: 'ケーキでお祝い', descriptionKey: 'チームの絆', effects: [{ target: 'hr', field: 'belongingness', operator: 'add', value: 2, duration: 0 }] },
      { id: 'skip', labelKey: '特に何もしない', descriptionKey: '普通の一日', effects: [] },
    ],
  },
  {
    id: 'random_tech_talk', category: 'random', severity: 'info',
    titleKey: '社内テックトーク', descriptionKey: 'エンジニアが「最新技術について発表したい」と提案しています。',
    conditions: [{ type: 'stat', field: 'headcount', operator: 'gte', value: 5 }],
    probability: 0.03, cooldownDays: 30, maxOccurrences: 20, earliestTick: 20,
    choices: [
      { id: 'approve', labelKey: '開催する', descriptionKey: '学習文化の醸成', effects: [{ target: 'hr', field: 'motivation', operator: 'add', value: 3, duration: 0 }, { target: 'product', field: 'quality', operator: 'add', value: 1, duration: 0 }] },
      { id: 'later', labelKey: 'また今度', descriptionKey: '忙しい時期', effects: [] },
    ],
  },
  {
    id: 'random_pet_office', category: 'random', severity: 'info',
    titleKey: 'ペットOKオフィスの提案', descriptionKey: '「ペットを連れてきていいですか？」犬派と猫派で議論が白熱。',
    conditions: [{ type: 'stat', field: 'headcount', operator: 'gte', value: 8 }],
    probability: 0.01, cooldownDays: 250, maxOccurrences: 1, earliestTick: 30,
    choices: [
      { id: 'allow', labelKey: 'ペットOKにする', descriptionKey: '満足度UP、アレルギー対策は必要', effects: [{ target: 'hr', field: 'satisfaction', operator: 'add', value: 5, duration: 0 }] },
      { id: 'deny', labelKey: '業務に集中しよう', descriptionKey: '残念がる人も', effects: [] },
    ],
  },
  {
    id: 'random_pizza_friday', category: 'random', severity: 'info',
    titleKey: 'ピザフライデー', descriptionKey: '金曜日はピザの日にしませんか？とチームから提案が。',
    conditions: [{ type: 'stat', field: 'headcount', operator: 'gte', value: 3 }],
    probability: 0.02, cooldownDays: 120, maxOccurrences: 1, earliestTick: 10,
    choices: [
      { id: 'yes', labelKey: '毎週ピザにしよう！', descriptionKey: '月2万円の投資', effects: [{ target: 'hr', field: 'belongingness', operator: 'add', value: 5, duration: 0 }, { target: 'finance', field: 'cash', operator: 'add', value: -2, duration: 0 }] },
      { id: 'no', labelKey: 'コスト意識を持とう', descriptionKey: '合理的判断', effects: [] },
    ],
  },
  {
    id: 'random_earthquake_drill', category: 'random', severity: 'info',
    titleKey: '防災訓練', descriptionKey: '年に一度の防災訓練の時期です。',
    conditions: [{ type: 'stat', field: 'headcount', operator: 'gte', value: 5 }],
    probability: 0.01, cooldownDays: 250, maxOccurrences: 5, earliestTick: 60,
    choices: [
      { id: 'conduct', labelKey: '訓練を実施', descriptionKey: '半日使うが大切', effects: [{ target: 'product', field: 'devSpeed', operator: 'multiply', value: 0.95, duration: 1 }] },
      { id: 'skip', labelKey: '今年はスキップ', descriptionKey: '忙しいから…', effects: [] },
    ],
  },
  {
    id: 'random_standup_comedy', category: 'random', severity: 'info',
    titleKey: '社内のお笑いタレント', descriptionKey: 'あるエンジニアの独特なユーモアがチームの癒しになっています。',
    conditions: [{ type: 'stat', field: 'headcount', operator: 'gte', value: 5 }],
    probability: 0.02, cooldownDays: 120, maxOccurrences: 3, earliestTick: 20,
    choices: [
      { id: 'encourage', labelKey: '社内イベントで活躍してもらう', descriptionKey: 'ムードメーカー', effects: [{ target: 'hr', field: 'motivation', operator: 'add', value: 5, duration: 0 }] },
    ],
  },
  {
    id: 'random_naming_debate', category: 'random', severity: 'info',
    titleKey: '変数名論争', descriptionKey: 'チーム内で変数の命名規則を巡る激しい議論が勃発。camelCase vs snake_case。',
    conditions: [{ type: 'stat', field: 'headcount', operator: 'gte', value: 3 }],
    probability: 0.03, cooldownDays: 120, maxOccurrences: 2, earliestTick: 15,
    choices: [
      { id: 'linter', labelKey: 'リンター導入で決着', descriptionKey: '合理的解決', effects: [{ target: 'product', field: 'quality', operator: 'add', value: 2, duration: 0 }] },
      { id: 'vote', labelKey: '多数決', descriptionKey: '民主的', effects: [] },
    ],
  },
  {
    id: 'random_cat_video', category: 'random', severity: 'info',
    titleKey: '猫動画タイム', descriptionKey: 'Slackの雑談チャンネルで猫動画が大量にシェアされています。',
    conditions: [{ type: 'stat', field: 'headcount', operator: 'gte', value: 5 }],
    probability: 0.04, cooldownDays: 30, maxOccurrences: 10, earliestTick: 10,
    choices: [
      { id: 'allow', labelKey: '癒しは大事', descriptionKey: '和やかな職場', effects: [{ target: 'hr', field: 'stress', operator: 'add', value: -2, duration: 0 }] },
      { id: 'focus', labelKey: '業務時間中は控えて', descriptionKey: '生産性重視', effects: [{ target: 'product', field: 'devSpeed', operator: 'multiply', value: 1.02, duration: 5 }] },
    ],
  },
  {
    id: 'random_first_customer_letter', category: 'random', severity: 'info',
    titleKey: '顧客からの感謝の手紙', descriptionKey: '最初期からの顧客が感謝のメッセージを送ってくれました。チーム全員が感動。',
    conditions: [{ type: 'stat', field: 'activeCustomers', operator: 'gte', value: 5 }],
    probability: 0.02, cooldownDays: 120, maxOccurrences: 5, earliestTick: 30,
    choices: [
      { id: 'share', labelKey: '全社に共有する', descriptionKey: '初心を思い出す', effects: [{ target: 'hr', field: 'motivation', operator: 'add', value: 8, duration: 0 }, { target: 'hr', field: 'belongingness', operator: 'add', value: 5, duration: 0 }] },
    ],
  },
]
