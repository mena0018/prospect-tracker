import { useEffect, useRef, useState } from 'react'

import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  draggable,
  dropTargetForElements,
  monitorForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'

// Cross-column drag wiring — see docs/reference/board-mechanism.md
type CardData = { boardId: string; cardId: string; columnId: string }
type ColumnData = { boardId: string; columnId: string }

function isCardData(data: Record<string, unknown>, boardId: string): data is CardData {
  return (
    data.boardId === boardId && typeof data.cardId === 'string' && typeof data.columnId === 'string'
  )
}

function isColumnData(data: Record<string, unknown>, boardId: string): data is ColumnData {
  return data.boardId === boardId && typeof data.columnId === 'string' && !('cardId' in data)
}

// Pure, so the one piece of judgement in the drop path is testable: Pragmatic drives its drags
// through internal state that neither CDP nor a synthetic DragEvent can reach.
// See docs/reference/board-mechanism.md
export function resolveDrop(
  boardId: string,
  sourceData: Record<string, unknown>,
  targetData: Record<string, unknown> | undefined
): { cardId: string; toColumnId: string } | null {
  if (!isCardData(sourceData, boardId) || !targetData) return null

  const toColumnId = isCardData(targetData, boardId)
    ? targetData.columnId
    : isColumnData(targetData, boardId)
      ? targetData.columnId
      : null

  // A drop back into the same column is not a move: order is not persisted.
  if (toColumnId === null || toColumnId === sourceData.columnId) return null

  return { cardId: sourceData.cardId, toColumnId }
}

type Options = {
  boardId: string
  onMove: (cardId: string, toColumnId: string) => void
}

export function useBoardDnd({ boardId, onMove }: Options) {
  const latest = useRef(onMove)
  latest.current = onMove

  useEffect(
    () =>
      monitorForElements({
        canMonitor: ({ source }) => isCardData(source.data, boardId),
        onDrop: ({ source, location }) => {
          // Innermost first: a card dropped over another card resolves to that card's column.
          const move = resolveDrop(boardId, source.data, location.current.dropTargets[0]?.data)

          if (move) latest.current(move.cardId, move.toColumnId)
        }
      }),
    [boardId]
  )
}

export function useBoardCard(boardId: string, cardId: string, columnId: string, label: string) {
  const ref = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLButtonElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Read at drag time, not captured: a move re-renders every card in both columns, and depending
  // on the label would re-subscribe them all. See docs/reference/board-mechanism.md
  const labelRef = useRef(label)
  labelRef.current = label

  useEffect(() => {
    const element = ref.current
    const handle = handleRef.current
    if (!element || !handle) return

    const data = { boardId, cardId, columnId }

    return combine(
      draggable({
        element,
        dragHandle: handle,
        getInitialData: () => data,
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: pointerOutsideOfPreview({ x: '12px', y: '8px' }),
            render: ({ container }) => {
              const chip = document.createElement('div')
              chip.textContent = labelRef.current
              chip.className =
                'bg-card text-foreground border-border max-w-60 truncate rounded-lg border ' +
                'px-3 py-1.5 text-sm font-medium shadow-md'
              container.appendChild(chip)
            }
          })
        },
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false)
      }),
      // A card is a drop target too, so dropping onto the cards rather than the gap below them
      // still lands in that column.
      dropTargetForElements({
        element,
        canDrop: ({ source }) => isCardData(source.data, boardId),
        getDropEffect: () => 'move',
        getData: () => data
      })
    )
  }, [boardId, cardId, columnId])

  return { ref, handleRef, isDragging }
}

export function useBoardColumn(boardId: string, columnId: string) {
  const ref = useRef<HTMLDivElement>(null)
  const [isOver, setIsOver] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    return dropTargetForElements({
      element,
      canDrop: ({ source }) =>
        isCardData(source.data, boardId) && source.data.columnId !== columnId,
      getDropEffect: () => 'move',
      getData: () => ({ boardId, columnId }),
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: () => setIsOver(false)
    })
  }, [boardId, columnId])

  return { ref, isOver }
}
