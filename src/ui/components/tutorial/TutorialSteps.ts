/**
 * チュートリアルステップ定義
 * 各ステップ: ハイライト対象、テキスト、次へ進む条件
 */

/** ハイライト対象の種別 */
export const HIGHLIGHT_TARGETS = {
  NONE: 'none',
  TOP_BAR: 'top-bar',
  SPEED_CONTROLS: 'speed-controls',
  CASH_DISPLAY: 'cash-display',
  VALUATION_DISPLAY: 'valuation-display',
  RIGHT_PANEL: 'right-panel',
  BOTTOM_BAR: 'bottom-bar',
  HIRE_BUTTON: 'hire-button',
  DEV_BUTTON: 'dev-button',
  SALES_BUTTON: 'sales-button',
  CANVAS: 'canvas',
  KPI_SECTION: 'kpi-section',
} as const satisfies Record<string, string>

export type HighlightTarget = (typeof HIGHLIGHT_TARGETS)[keyof typeof HIGHLIGHT_TARGETS]

/** ステップの次へ進む条件 */
export const ADVANCE_CONDITIONS = {
  CLICK_NEXT: 'click_next',
  CLICK_TARGET: 'click_target',
  HIRE_EMPLOYEE: 'hire_employee',
  START_FEATURE: 'start_feature',
  SET_BUDGET: 'set_budget',
  CHANGE_SPEED: 'change_speed',
  WAIT_TICKS: 'wait_ticks',
} as const satisfies Record<string, string>

export type AdvanceCondition = (typeof ADVANCE_CONDITIONS)[keyof typeof ADVANCE_CONDITIONS]

/** チュートリアルステップ */
export interface TutorialStep {
  readonly id: string
  readonly title: string
  readonly message: string
  readonly highlight: HighlightTarget
  readonly advanceOn: AdvanceCondition
  readonly position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  readonly waitTicks?: number
}

/** 全チュートリアルステップ */
export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    id: 'welcome',
    title: 'SAAS EMPIREへようこそ！',
    message: 'あなたはSaaS企業のCEOです。会社を成長させてIPOを目指しましょう。まずは画面の見方を説明します。',
    highlight: HIGHLIGHT_TARGETS.NONE,
    advanceOn: ADVANCE_CONDITIONS.CLICK_NEXT,
    position: 'center',
  },
  {
    id: 'top_bar',
    title: 'トップバー',
    message: '画面上部に会社名、ゲーム内日付、手持ち資金、企業価値が表示されています。資金が尽きるとゲームオーバーです。',
    highlight: HIGHLIGHT_TARGETS.TOP_BAR,
    advanceOn: ADVANCE_CONDITIONS.CLICK_NEXT,
    position: 'bottom',
  },
  {
    id: 'speed',
    title: '速度コントロール',
    message: 'ゲーム速度を変更できます。x1〜x8で加速、⏸で一時停止。まずは一時停止を解除して時間を進めてみましょう。',
    highlight: HIGHLIGHT_TARGETS.SPEED_CONTROLS,
    advanceOn: ADVANCE_CONDITIONS.CHANGE_SPEED,
    position: 'bottom',
  },
  {
    id: 'wait_days',
    title: '時間が進んでいます',
    message: '1ティック=1営業日です。数日待つと採用候補者が現れます。少し待ちましょう…',
    highlight: HIGHLIGHT_TARGETS.CANVAS,
    advanceOn: ADVANCE_CONDITIONS.WAIT_TICKS,
    position: 'center',
    waitTicks: 8,
  },
  {
    id: 'hire_intro',
    title: '最初の仲間を採用しよう',
    message: '画面下部の「採用」ボタンをクリックして、候補者一覧を開いてください。',
    highlight: HIGHLIGHT_TARGETS.HIRE_BUTTON,
    advanceOn: ADVANCE_CONDITIONS.CLICK_TARGET,
    position: 'top',
  },
  {
    id: 'hire_action',
    title: '候補者を採用',
    message: '候補者の能力値を確認して「採用」をクリック。エンジニアを雇うとプロダクト開発が加速します。',
    highlight: HIGHLIGHT_TARGETS.BOTTOM_BAR,
    advanceOn: ADVANCE_CONDITIONS.HIRE_EMPLOYEE,
    position: 'top',
  },
  {
    id: 'dev_intro',
    title: 'プロダクトを開発しよう',
    message: '「開発」ボタンから新機能の開発を始めましょう。機能をリリースするとプロダクトスコアが上がります。',
    highlight: HIGHLIGHT_TARGETS.DEV_BUTTON,
    advanceOn: ADVANCE_CONDITIONS.CLICK_TARGET,
    position: 'top',
  },
  {
    id: 'dev_action',
    title: '機能開発を開始',
    message: '機能名を入力（空欄でもOK）して「開発開始」をクリック。複雑度が高いほど品質は上がりますが時間がかかります。',
    highlight: HIGHLIGHT_TARGETS.BOTTOM_BAR,
    advanceOn: ADVANCE_CONDITIONS.START_FEATURE,
    position: 'top',
  },
  {
    id: 'sales_intro',
    title: '営業で顧客を獲得',
    message: '「営業」ボタンでマーケティング予算を設定できます。予算を上げるとリード獲得が加速します。',
    highlight: HIGHLIGHT_TARGETS.SALES_BUTTON,
    advanceOn: ADVANCE_CONDITIONS.CLICK_TARGET,
    position: 'top',
  },
  {
    id: 'sales_action',
    title: 'マーケティング予算を設定',
    message: 'スライダーで予算を設定しましょう。最初は20〜50万円/月がおすすめです。',
    highlight: HIGHLIGHT_TARGETS.BOTTOM_BAR,
    advanceOn: ADVANCE_CONDITIONS.SET_BUDGET,
    position: 'top',
  },
  {
    id: 'right_panel',
    title: 'KPIを確認',
    message: '右パネルにMRR、ARR、NRR、Rule of 40などのSaaS KPIが表示されます。これらの数値を伸ばすのがゲームの目標です。',
    highlight: HIGHLIGHT_TARGETS.RIGHT_PANEL,
    advanceOn: ADVANCE_CONDITIONS.CLICK_NEXT,
    position: 'left',
  },
  {
    id: 'events',
    title: 'イベントに対応',
    message: 'ゲーム中にさまざまなイベントが発生します。選択肢によって会社の運命が変わります。慎重に判断しましょう。',
    highlight: HIGHLIGHT_TARGETS.NONE,
    advanceOn: ADVANCE_CONDITIONS.CLICK_NEXT,
    position: 'center',
  },
  {
    id: 'complete',
    title: 'チュートリアル完了！',
    message: '基本操作は以上です。採用→開発→営業のサイクルを回してMRRを伸ばし、資金調達を経てIPOを目指してください。頑張って！',
    highlight: HIGHLIGHT_TARGETS.NONE,
    advanceOn: ADVANCE_CONDITIONS.CLICK_NEXT,
    position: 'center',
  },
]
