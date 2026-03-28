/**
 * 全イベント定義の集約
 */

import type { GameEventDefinition } from '@game-types/events.js'
import { macroEvents } from './macroEvents.js'
import { companyEvents } from './companyEvents.js'
import { hrEvents } from './hrEvents.js'
import { productEvents } from './productEvents.js'
import { salesEvents } from './salesEvents.js'
import { randomEvents } from './randomEvents.js'

/** 全イベント定義（100+） */
export const ALL_EVENTS: readonly GameEventDefinition[] = [
  ...macroEvents,
  ...companyEvents,
  ...hrEvents,
  ...productEvents,
  ...salesEvents,
  ...randomEvents,
]

export { macroEvents, companyEvents, hrEvents, productEvents, salesEvents, randomEvents }
