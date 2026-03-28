/**
 * A*パスファインディング
 * タイルベースの最短経路探索（8方向移動対応）
 */

import type { IsoCoord } from '@game-types/rendering.js'
import type { TileMap } from './TileMap.js'

/** 探索ノード */
interface PathNode {
  col: number
  row: number
  g: number
  h: number
  f: number
  parent: PathNode | null
}

/** 8方向の移動差分 */
const NEIGHBORS: ReadonlyArray<{ dc: number; dr: number; cost: number }> = [
  { dc: 0, dr: -1, cost: 1 },     // 北
  { dc: 1, dr: -1, cost: 1.414 },  // 北東
  { dc: 1, dr: 0, cost: 1 },      // 東
  { dc: 1, dr: 1, cost: 1.414 },   // 南東
  { dc: 0, dr: 1, cost: 1 },      // 南
  { dc: -1, dr: 1, cost: 1.414 },  // 南西
  { dc: -1, dr: 0, cost: 1 },     // 西
  { dc: -1, dr: -1, cost: 1.414 }, // 北西
]

/** マンハッタン距離ヒューリスティック */
function heuristic(a: IsoCoord, b: IsoCoord): number {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row)
}

/** ノードキー生成 */
function nodeKey(col: number, row: number): string {
  return `${col},${row}`
}

/**
 * A*アルゴリズムで経路を探索する
 * @returns 経路（始点含む、終点含む）。到達不可能ならnull
 */
export function findPath(
  tileMap: TileMap,
  start: IsoCoord,
  goal: IsoCoord,
  maxIterations = 500,
): IsoCoord[] | null {
  if (!tileMap.isInBounds(start) || !tileMap.isInBounds(goal)) return null
  if (!tileMap.isWalkable(goal)) return null
  if (start.col === goal.col && start.row === goal.row) return [start]

  const openSet: PathNode[] = []
  const closedSet = new Set<string>()
  const gScores = new Map<string, number>()

  const startNode: PathNode = {
    col: start.col,
    row: start.row,
    g: 0,
    h: heuristic(start, goal),
    f: heuristic(start, goal),
    parent: null,
  }
  openSet.push(startNode)
  gScores.set(nodeKey(start.col, start.row), 0)

  let iterations = 0

  while (openSet.length > 0 && iterations < maxIterations) {
    iterations++

    // f値が最小のノードを取得（簡易的に線形探索）
    let bestIdx = 0
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[bestIdx].f) {
        bestIdx = i
      }
    }
    const current = openSet[bestIdx]
    openSet.splice(bestIdx, 1)

    // ゴール到達
    if (current.col === goal.col && current.row === goal.row) {
      return reconstructPath(current)
    }

    const currentKey = nodeKey(current.col, current.row)
    closedSet.add(currentKey)

    // 隣接ノードを探索
    for (const neighbor of NEIGHBORS) {
      const nc = current.col + neighbor.dc
      const nr = current.row + neighbor.dr
      const nKey = nodeKey(nc, nr)

      if (closedSet.has(nKey)) continue
      if (!tileMap.isInBounds({ col: nc, row: nr })) continue
      if (!tileMap.isWalkable({ col: nc, row: nr })) continue

      // 斜め移動の場合、隣接タイルも通行可能か確認
      if (neighbor.dc !== 0 && neighbor.dr !== 0) {
        const adj1 = tileMap.isWalkable({ col: current.col + neighbor.dc, row: current.row })
        const adj2 = tileMap.isWalkable({ col: current.col, row: current.row + neighbor.dr })
        if (!adj1 || !adj2) continue
      }

      const tentativeG = current.g + neighbor.cost
      const existingG = gScores.get(nKey) ?? Infinity

      if (tentativeG < existingG) {
        const h = heuristic({ col: nc, row: nr }, goal)
        const node: PathNode = {
          col: nc, row: nr,
          g: tentativeG, h, f: tentativeG + h,
          parent: current,
        }
        gScores.set(nKey, tentativeG)

        const existingIdx = openSet.findIndex(
          (n) => n.col === nc && n.row === nr,
        )
        if (existingIdx >= 0) {
          openSet[existingIdx] = node
        } else {
          openSet.push(node)
        }
      }
    }
  }

  return null // 到達不可能
}

/** パスを復元する */
function reconstructPath(endNode: PathNode): IsoCoord[] {
  const path: IsoCoord[] = []
  let node: PathNode | null = endNode
  while (node !== null) {
    path.unshift({ col: node.col, row: node.row })
    node = node.parent
  }
  return path
}

/**
 * 移動方向から8方向のDirection文字列を返す
 */
export function getDirectionFromDelta(
  dc: number,
  dr: number,
): string {
  if (dc === 0 && dr < 0) return 'north'
  if (dc > 0 && dr < 0) return 'north_east'
  if (dc > 0 && dr === 0) return 'east'
  if (dc > 0 && dr > 0) return 'south_east'
  if (dc === 0 && dr > 0) return 'south'
  if (dc < 0 && dr > 0) return 'south_west'
  if (dc < 0 && dr === 0) return 'west'
  if (dc < 0 && dr < 0) return 'north_west'
  return 'south'
}
