/**
 * SAAS EMPIRE — メインアプリケーションエントリポイント
 */

import type { ReactNode } from 'react'
import { GameLayout } from '@ui/layouts/GameLayout.js'
import '@i18n/config.js'

export function App(): ReactNode {
  return <GameLayout />
}
