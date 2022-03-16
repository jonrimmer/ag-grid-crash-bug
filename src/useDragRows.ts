import { GridApi, RowDragEvent, RowNode } from 'ag-grid-community';
import { useCallback, useRef } from 'react';
import { useDataMove } from './queries';
import { DataItemRow } from './types';

export type RowDropLocation = 'into' | 'before' | 'after';
const DROP_TYPE_PAD = 16;

export const useDragRows = (api: GridApi | undefined) => {
  const reopenGroupAfterMove = useRef(false);
  const hoveredOverRow = useRef<RowNode | undefined>(undefined);
  const openGroupTimeout = useRef<number | undefined>(undefined);
  const dropLocation = useRef<RowDropLocation | undefined>(undefined);
  const { mutateAsync } = useDataMove();

  const clearHoveredState = useCallback(() => {
    if (hoveredOverRow.current) {
      clearTimeout(openGroupTimeout.current);
      const prevHoveredOverRow = hoveredOverRow.current;
      hoveredOverRow.current = undefined;
      dropLocation.current = undefined;
      api?.redrawRows({
        rowNodes: [prevHoveredOverRow],
      });
    }
  }, [api]);

  const onRowDragStart = useCallback((event: RowDragEvent) => {
    const movingNode = event.node;
    if (movingNode.expanded) {
      reopenGroupAfterMove.current = true;
      movingNode.setExpanded(false);
    } else {
      reopenGroupAfterMove.current = false;
    }
  }, []);

  const onRowDragMove = useCallback(
    (event: RowDragEvent) => {
      const movingNode = event.node;
      let overNode = event.overNode;

      if (!overNode || movingNode === overNode) {
        clearHoveredState();
        return;
      }

      const topDistance = event.y - (overNode.rowTop ?? 0);
      const bottomDistance =
        (overNode.rowTop ?? 0) + (overNode.rowHeight ?? 0) - event.y;

      const prevDropType = dropLocation.current;

      dropLocation.current =
        topDistance < DROP_TYPE_PAD
          ? 'before'
          : bottomDistance < DROP_TYPE_PAD
          ? 'after'
          : 'into';

      if (overNode !== hoveredOverRow.current) {
        clearTimeout(openGroupTimeout.current);

        const prevHoveredOverRow = hoveredOverRow.current;
        hoveredOverRow.current = overNode;

        api?.redrawRows({
          rowNodes: [
            hoveredOverRow.current,
            ...(prevHoveredOverRow ? [prevHoveredOverRow] : []),
          ],
        });

        if (overNode.hasChildren()) {
          // Open the group after a pause:
          openGroupTimeout.current = window.setTimeout(() => {
            overNode?.setExpanded(true);
          }, 1100);
        }
      } else if (prevDropType !== dropLocation.current) {
        api?.redrawRows({
          rowNodes: [hoveredOverRow.current],
        });
      }
    },
    [api, clearHoveredState]
  );

  const onRowDragEnd = useCallback(
    async (event: RowDragEvent) => {
      clearTimeout(openGroupTimeout.current);

      try {
        const movingNode = event.node;
        movingNode.setExpanded(reopenGroupAfterMove.current);
        const movingData = movingNode.data as DataItemRow;
        const destinationData = hoveredOverRow.current?.data as DataItemRow;
        mutateAsync({
          id: movingData.id,
          destId: destinationData.id,
          placement: dropLocation.current ?? 'into',
        });
      } finally {
        clearHoveredState();
      }
    },
    [clearHoveredState, mutateAsync]
  );

  const isRowDropInto = useCallback(
    ({ node }: { node: RowNode }) =>
      node.id === hoveredOverRow.current?.id && dropLocation.current === 'into',
    []
  );
  const isRowDropAfter = useCallback(
    ({ node }: { node: RowNode }) =>
      node.id === hoveredOverRow.current?.id &&
      dropLocation.current === 'after',
    []
  );
  const isRowDropBefore = useCallback(
    ({ node }: { node: RowNode }) =>
      node.id === hoveredOverRow.current?.id &&
      dropLocation.current === 'before',
    []
  );

  return {
    onRowDragStart,
    onRowDragMove,
    onRowDragEnd,
    isRowDropInto,
    isRowDropAfter,
    isRowDropBefore,
    onRowDragLeave: () => clearHoveredState(),
  };
};
