import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from 'react';
import { Button, Table } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import { HolderOutlined } from '@ant-design/icons';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './sortableTable.css';

export interface SortableRow {
  id: string;
}

interface SortableResourceTableProps<T extends SortableRow>
  extends Omit<TableProps<T>, 'columns' | 'dataSource' | 'rowKey' | 'components'> {
  columns: ColumnsType<T>;
  data: T[];
  onReorder?: (rows: T[]) => void | Promise<void>;
  reordering?: boolean;
  rowLabel?: (row: T) => string;
}

interface DragHandleContextValue {
  attributes: ReturnType<typeof useSortable>['attributes'];
  listeners: ReturnType<typeof useSortable>['listeners'];
  setActivatorNodeRef: ReturnType<typeof useSortable>['setActivatorNodeRef'];
  rowLabel: string;
}

const DragHandleContext = createContext<DragHandleContextValue | null>(null);

export function moveRows<T extends SortableRow>(rows: T[], activeId: string, overId: string): T[] {
  const from = rows.findIndex((row) => row.id === activeId);
  const to = rows.findIndex((row) => row.id === overId);
  return from < 0 || to < 0 ? rows : arrayMove(rows, from, to);
}

function DragHandle({ disabled }: { disabled?: boolean }) {
  const context = useContext(DragHandleContext);
  if (!context) return null;
  return (
    <Button
      type="text"
      size="small"
      className="sortable-table-handle"
      icon={<HolderOutlined />}
      aria-label={`Reordonează ${context.rowLabel}`}
      disabled={disabled}
      ref={context.setActivatorNodeRef}
      {...context.attributes}
      {...context.listeners}
    />
  );
}

function DraggableRow({ style, ...props }: HTMLAttributes<HTMLTableRowElement> & { 'data-row-key': string }) {
  const id = String(props['data-row-key']);
  const rowLabel = String(props['aria-label'] || 'rând');
  const sortable = useSortable({ id });
  const rowStyle: CSSProperties = {
    ...style,
    transform: CSS.Transform.toString(sortable.transform && { ...sortable.transform, scaleY: 1 }),
    transition: sortable.transition,
    position: 'relative',
    zIndex: sortable.isDragging ? 2 : undefined,
    opacity: sortable.isDragging ? 0.72 : 1,
  };
  const value = useMemo(() => ({
    attributes: sortable.attributes,
    listeners: sortable.listeners,
    setActivatorNodeRef: sortable.setActivatorNodeRef,
    rowLabel,
  }), [sortable.attributes, sortable.listeners, sortable.setActivatorNodeRef, rowLabel]);

  return (
    <DragHandleContext.Provider value={value}>
      <tr {...props} ref={sortable.setNodeRef} style={rowStyle} />
    </DragHandleContext.Provider>
  );
}

export function SortableResourceTable<T extends SortableRow>({
  columns,
  data,
  onReorder,
  reordering = false,
  rowLabel = (row) => String((row as T & { name?: string; title?: string }).name
    || (row as T & { title?: string }).title
    || row.id),
  ...tableProps
}: SortableResourceTableProps<T>) {
  const [orderedData, setOrderedData] = useState(data);
  useEffect(() => setOrderedData(data), [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const sortableColumns: ColumnsType<T> = onReorder
    ? [{
        key: 'drag-handle',
        title: <span className="sr-only">Ordine</span>,
        width: 48,
        align: 'center',
        render: () => <DragHandle disabled={reordering} />,
      }, ...columns]
    : columns;

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!onReorder || !over || active.id === over.id) return;
    const next = moveRows(orderedData, String(active.id), String(over.id));
    setOrderedData(next);
    await onReorder(next);
  };

  const table = (
    <Table<T>
      {...tableProps}
      rowKey="id"
      columns={sortableColumns}
      dataSource={orderedData}
      components={onReorder ? { body: { row: DraggableRow } } : undefined}
      onRow={(row) => ({ 'aria-label': rowLabel(row) }) as HTMLAttributes<HTMLTableRowElement>}
    />
  );

  if (!onReorder) return table;
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void handleDragEnd(event)}>
      <SortableContext items={orderedData.map((row) => row.id)} strategy={verticalListSortingStrategy}>
        {table}
      </SortableContext>
    </DndContext>
  );
}
